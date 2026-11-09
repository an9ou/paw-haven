// v2.24 "Kind shop" Reel: CLEAN footage from the kind-shop build (prepared for launch; docs/marketing/KIND_SHOP_REEL.md).
// The shop is not released: it is built from a checkout of the claude/kind-shop branch, with the build's own test switch on (prefs.shopTest,
// the same switch the v224_shop suite uses; SHOP_LIVE itself stays false in the branch). The purchases are granted through the game's own
// ks.grant() with fake purchase ids (no Worker, no Stripe), exactly as the suite does. Every game bar, button, toast and bubble is hidden.
// Scenes (iPhone 15, 393 x 852 CSS px at 3x):
//   yard   the Golden Paw Cottage is the dog house, Noodle in the Tokyo Street set beside it     (still yard.png + clip yard/)
//   house  the Cozy Winter set placed in the house (each at the spot the game picks), a slow pan from the Woolly Armchair and the Tea-Cosy Bed
//          to the Cardboard Fireplace, the Doggy Snow Globe and the Cocoa Mug Lamp   (stills house_l.png, house_r.png + clip house/)
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_reel/capture_shop.js <kind-shop checkout, built: node game/build.js && node game/harness.js merged> <outdir>
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || 'shop_clean'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const { slowInit } = require('../friends_reel/capture_friends.js');
// a copy of the test page with one line added after the phone camera (13_more_dogs.js camTo), so the capture can pan to the kennel and across the room
function camPage(dev) {
  const SRC = path.join(dev, 'game', 'test_merged.html'), OUTP = path.join(dev, 'game', 'test_merged_reel_shop.html'), A = '\napplyLayout(false);\n';
  const L = '\nfunction camApply(cx) {\n'; // window.__camLock holds the camera still while the dog roams (the clip keeps the cottage in view)
  let html = fs.readFileSync(SRC, 'utf8'); if (html.split(A).length !== 2) throw new Error('the applyLayout(false) anchor after camTo moved (13_more_dogs.js)');
  if (html.split(L).length !== 2) throw new Error('the camApply anchor moved (13_more_dogs.js)');
  html = html.replace(L, '\nfunction camApply(cx) { if (window.__camLock != null) cx = window.__camLock;\n');
  fs.writeFileSync(OUTP, html.replace(A, '\napplyLayout(false); window.__shx = { camTo, cam: () => camCx, dogTo };\n')); return OUTP;
}
const CLEAN_CSS = '#hud,#bar,#dock,#toasts,#devBtn,#placeBtns,#status,#phPeek,#ddWish,#msBtn,#bubble,#ksPlus,#mailBtn,#mbx,.rm-look,.ph-peek,.hint,.coach,.pw-hud{display:none!important}';
// the Tokyo Street set Noodle wears (one neck item at a time: the Paw Tote; the Lucky Cat Charm is shown as a card)
const TOKYO = { body: 'Sukajan Jacket', head: 'Bucket Hat', eyes: 'Round Shades', neck: 'Paw Tote', feet: 'Little Sneakers' };

run('shop_clean', async (t) => {
  const { ev } = t, p = () => t.p;
  await t.mk({ device: 'iPhone 15', prefs: { shopTest: true, shopCash: 'ok' }, time: process.env.TIME || 'day', weather: 'sunny', season: process.env.SEASON || 'winter' });
  await t.ctx.addInitScript(slowInit);
  await p().goto('file://' + camPage(DEV));
  await p().waitForSelector('#tNew, #tContinue, #tGuest');
  if (await p().locator('#tGuest').count()) { await p().click('#tGuest'); await p().waitForSelector('#tNew'); }
  await t.adopt({ head: '~Dachshund', sex: 'boy' });
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
  await ev(() => { window.__paw.S.coolUntil = 1e12; });
  await t.calm(); await t.lu();
  // the purchases, granted the game's own way (fake ids, as test_v224_shop.js 4 does)
  const g = await ev(() => { const P = window.__paw; return P.ks.grant([{ id: 'cs_reel_sup', item: 'supporter' }, { id: 'cs_reel_tokyo', item: 'tokyo' }, { id: 'cs_reel_cozy', item: 'cozy' }, { id: 'cs_reel_kit', item: 'comfort' }]); });
  console.log('granted', JSON.stringify(g.granted));
  await t.lu();
  await ev((o) => { const P = window.__paw, S = P.S; S.house = 'Golden Paw Cottage'; Object.values(o).forEach((n) => P.shop.equip(n)); S.mail = []; }, TOKYO);
  console.log('outfit', JSON.stringify(await ev(() => window.__paw.S.outfit)));
  await p().addStyleTag({ content: CLEAN_CSS });
  const relayout = async () => { await ev(() => window.dispatchEvent(new Event('resize'))); await p().waitForTimeout(900); };
  let cdp = null;
  async function setRate(x) { if (!cdp) { cdp = await t.ctx.newCDPSession(p()); await cdp.send('Animation.enable'); } await ev((x) => window.__setRate(x), x); await cdp.send('Animation.setPlaybackRate', { playbackRate: x }); }
  async function still(name) { await p().waitForTimeout(600); await p().screenshot({ path: path.join(OUT, name + '.png') }); console.log('still', name); }
  async function clip(name, secs, act, r) {
    const dir = path.join(OUT, name); fs.mkdirSync(dir, { recursive: true }); fs.readdirSync(dir).forEach((f) => fs.unlinkSync(path.join(dir, f)));
    await setRate(r || 0.2); const ts = []; let n = 0;
    const v0 = await ev(() => window.__vt());
    const shoot = (async () => { const vp = p().viewportSize();
      for (;;) { const v = await ev(() => window.__vt()); if (v - v0 > secs * 1000) break;
        const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 3 } });
        fs.writeFileSync(path.join(dir, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(s.data, 'base64')); ts.push((v - v0) / 1000); } })();
    if (act) await act();
    await shoot; await setRate(1);
    fs.writeFileSync(path.join(dir, 'ts.json'), JSON.stringify(ts)); console.log('clip', name, n, 'frames', ts[n - 1].toFixed(2) + 's');
  }

  // 1. the yard with the Golden Paw Cottage
  await t.home('yard'); await relayout();
  const cam = (x, s) => ev(([x, s]) => window.__shx.camTo(x, s), [x, s]);
  await cam(+(process.env.KENNEL_X || 640), 0.01); await p().waitForTimeout(500);
  await ev(() => window.__shx.dogTo(110, 0, 1, 0.01)); await p().waitForTimeout(700); await cam(+(process.env.KENNEL_X || 640), 0.01); await p().waitForTimeout(300);
  console.log('cam', JSON.stringify(await ev(() => window.__shx.cam())));
  await ev((x) => { window.__camLock = x; }, +(process.env.KENNEL_X || 640)); await cam(+(process.env.KENNEL_X || 640), 0.01);
  await ev(() => window.__shx.dogTo(-30, 0, 1, 0.01)); await p().waitForTimeout(500);
  await still('yard');
  // Noodle trots over to the Golden Paw Cottage (the game's own dog move, dogTo, as an errand walks)
  await clip('yard', 4.2, async () => { await p().waitForTimeout(150); await ev(() => window.__shx.dogTo(150, 0, 1, 2.2)); }, 0.2);
  await ev(() => { window.__camLock = null; });

  // 2. the house with the Cozy Winter set placed (each at a free spot the game picks)
  await ev(() => { const P = window.__paw, S = P.S; P.ks.cozy.forEach((n) => { if (S.decor && S.decor[n]) { S.decor[n].at = P.ho.freeSpot(n); S.decor[n].out = true; } }); S.bed = 'Tea-Cosy Bed'; S.place = 'house'; P.go('yard'); });
  await t.until(() => !!document.querySelector('[data-decor="Cocoa Mug Lamp"]'), null, 6000);
  await relayout();
  console.log('decor', JSON.stringify(await ev(() => [...document.querySelectorAll('[data-decor]')].map((e) => e.dataset.decor))));
  await cam(-2000, 0.01); await p().waitForTimeout(500); await still('house_l');
  await cam(4000, 0.01); await p().waitForTimeout(500); await still('house_r');
  // the camera's own limits in this room (camTo clamps), so the pan uses its whole time
  const vb = () => ev(() => document.querySelector('#view > svg.world').getAttribute('viewBox').split(' ').map(Number));
  const lim = []; for (const x of [-2000, 4000]) { await cam(x, 0.01); await p().waitForTimeout(300); const v = await vb(); lim.push(v[0] + v[2] / 2); }
  console.log('house camera from', lim.map(Math.round).join(' to '), 'decor boxes', JSON.stringify(await ev(() => window.__paw.ks.cozy.map((n) => { const e = document.querySelector(`[data-decor="${n}"]`), svg = document.querySelector('#view > svg.world'); if (!e) return [n, null]; const b = e.getBBox(); return [n, Math.round(b.x), Math.round(b.x + b.width)]; }))));
  if (process.env.DOG_HOUSE_TX) { await ev((x) => window.__shx.dogTo(x, 0, 1, 0.01), +process.env.DOG_HOUSE_TX); await p().waitForTimeout(700); }
  await cam(lim[1], 0.01); await p().waitForTimeout(500); // the pan runs right to left, so it ends on the Cardboard Fireplace for the joke
  await clip('house', 5.2, async () => { await p().waitForTimeout(250); await cam(lim[0], 4.3); }, 0.2);
});
