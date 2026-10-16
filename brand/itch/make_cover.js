// itch.io cover (630x500) with Noodle the dachshund: a crop of the real yard (Noodle in it) under the Doodle Doggo logo card
// (brand/doodle-doggo-logo.svg: Noodle plus the wordmark) with two strips of tape, like the title screen.
//   node game/build.js && node game/harness.js merged && node brand/itch/make_cover.js      (needs Node and playwright)
// Writes brand/itch/cover-630x500.png. The yard is shot at 2x from game/test_merged.html (the harness pins weather, time and season).
const fs = require('fs'), path = require('path'), os = require('os');
const { devices } = require('playwright');
devices.cover2x = { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2, userAgent: devices['Desktop Chrome'].userAgent, isMobile: false, hasTouch: false };
const { T, URL } = require('../../game/test_lib');
const out = __dirname, logo = fs.readFileSync(path.join(out, '..', 'doodle-doggo-logo.svg'));
(async () => {
  const t = new T('cover'); await t.launch(); await t.boot({ device: 'cover2x' });
  await t.adopt({ sex: 'boy', head: '~Dachshund' }); // Noodle
  await t.p.addStyleTag({ content: '#hud,#bar,#status,.toast,#toasts,#devBtn,#bubble,#msCardG,#mailboxG{display:none!important}' });
  await t.sleep(2500);
  const tmp = path.join(os.tmpdir(), 'dd-cover-yard.png');
  await t.p.screenshot({ path: tmp, clip: { x: 350, y: 78, width: 704, height: 560 } });
  const yard = fs.readFileSync(tmp).toString('base64');
  const p = await t.b.newPage({ viewport: { width: 630, height: 500 }, deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><style>
    html,body{margin:0;width:630px;height:500px;overflow:hidden;background:#FFF8EC}
    .yard{position:absolute;inset:0;background:url(data:image/png;base64,${yard}) center/cover}
    .tape{position:absolute;width:104px;height:30px;opacity:.85}
    .card{position:absolute;left:30px;top:22px;width:570px;height:176px;box-sizing:border-box;background:#FFF8EC;border:3px solid #5B3D32;border-radius:34px 26px 38px 24px;transform:rotate(-1.6deg);box-shadow:0 5px 0 rgba(91,61,50,.18);overflow:hidden}
    .card img{display:block;width:100%;height:100%;object-fit:contain}
    .frame{position:absolute;inset:0;border:5px solid #FFF8EC;box-shadow:inset 0 0 0 2px #5B3D32}
  </style><div class="yard"></div>
  <div class="card"><img src="data:image/svg+xml;base64,${logo.toString('base64')}"></div>
  <div class="tape" style="left:18px;top:14px;background:#F9D0D9;transform:rotate(-24deg)"></div><div class="tape" style="right:16px;top:12px;background:#BFE3D2;transform:rotate(22deg)"></div>
  <div class="frame"></div>`);
  await p.screenshot({ path: path.join(out, 'cover-630x500.png'), clip: { x: 0, y: 0, width: 630, height: 500 } });
  await t.b.close(); console.log('wrote brand/itch/cover-630x500.png');
})();
