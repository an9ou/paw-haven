// The TikTok intro (8 Nov 2026, owner: "Can u create a short intro video for tiktok"): CLEAN footage of the live game, told by Noodle the dachshund.
// The Friends Reel's way of filming (friends_reel/capture_clean.js): the iPhone 15 profile (393 x 659 CSS px, DPR 3), every game bar, button, sheet,
// toast and speech bubble hidden, the page clock slowed (capture_friends.js slowInit) and each frame stamped with its game time, so the motion plays
// smoothly at 30 fps. Autumn by day, no festival on screen (8 Nov 2026 is autumn; the Winter Market only opens on 1 Dec). The harness gates that keep
// live features off under webdriver are turned on (the v2.15 map and floors, Japan and Mt. Fuji, faces), so the footage is the game as players see it.
// Scenes (each a folder of frames + ts.json, and a still <name>.png):
//   hook     Noodle in the Home Yard, petted (hearts)          (the 40 dogs are a line-up drawn in build_intro.js)
//   fuji     Noodle on the path at the Mt. Fuji Lookout         dress    the Bumblebee Suit and Heart Sunglasses
//   ball     ball play in the yard                              garden   the veggie patch
//   pups     Noodle with Udon and their two puppies, petted (hearts), every dog apart
//
//   cd <game checkout> && node game/build.js && node game/harness.js merged
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/intro_tiktok/capture_intro.js <game checkout> <outdir> [scene ...]
//   STILLS=1: stills only (to look at the framing first)
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || 'intro_footage'); fs.mkdirSync(OUT, { recursive: true });
const WANT = process.argv.slice(4);
const want = (n) => !WANT.length || WANT.includes(n);
const STILLS = !!process.env.STILLS;
const { run, URL } = require(path.join(DEV, 'game', 'test_lib'));
const { slowInit } = require('../friends_reel/capture_friends.js');
// the game's own interface, hidden for the clean look (as friends_reel/capture_clean.js CLEAN_CSS, plus the yard's phone extras and the ball dock)
const CLEAN_CSS = '#hud,#bar,#dock,#toasts,#devBtn,#devPanel,#placeBtns,#status,#phPeek,#ddWish,#msBtn,#bubble,.hint,.coach,#rmLookL,#rmLookR,#blDone,#blHint,'
  + '.pw-hud,.pw-ctrls,.pw-tut,.pw-panel,.pw-legend,.pw-btn,.pw-card,.pw-notes,.pw-badge,.pw-nl,.pw-mini,.pw-hint{display:none!important}';
const HIDE_MODAL = '#modal{display:none!important}';

// every dog's drawn box on screen (CSS px), for the build's apartCheck (owner, 6 Nov 2026: dogs never overlap or touch)
function boxesInit() {
  window.__dogBoxes = () => {
    const box = (svg) => { let l = 1e9, r = -1e9, t = 1e9, b = -1e9;
      svg.querySelectorAll('path,ellipse,circle,polygon,polyline,line').forEach((e) => { const op = e.getAttribute('opacity'); if (op != null && +op <= 0.4) return;
        const q = e.getBoundingClientRect(); if (!q.width && !q.height) return; l = Math.min(l, q.left); r = Math.max(r, q.right); t = Math.min(t, q.top); b = Math.max(b, q.bottom); });
      return l < r ? [+l.toFixed(1), +t.toFixed(1), +r.toFixed(1), +b.toFixed(1)] : null; };
    const out = []; const lead = document.querySelector('#dogArt svg.pa-dog'); if (lead) { const b = box(lead); if (b) out.push({ n: 'Noodle', b }); }
    document.querySelectorAll('#pack .packdog').forEach((g, i) => { const s = g.querySelector('svg.pa-dog'); if (!s || getComputedStyle(g).display === 'none') return; const b = box(s); if (b) out.push({ n: g.dataset.id || 'pack' + i, b }); });
    return out;
  };
}

run('intro_tiktok', async (t) => {
  const { ev } = t, p = () => t.p;
  await t.mk({ device: 'iPhone 15', map215: true, ground: true, prefs: { jpTest: true, exTest: true, tkTest: true } });
  await t.ctx.addInitScript(slowInit);
  await t.ctx.addInitScript(boxesInit);
  await p().goto(URL);
  await p().waitForSelector('#tNew, #tContinue, #tGuest');
  if (await p().locator('#tGuest').count()) { await p().click('#tGuest'); await p().waitForSelector('#tNew'); }
  // Noodle, our narrator (the 45 s promo, the Friends Reel): the adoption page's Dachshund, a boy, grown up
  await t.adopt({ head: '~Dachshund', sex: 'boy' });
  await t.patch({ bond: { level: 9, pts: 3000 }, coins: 1000, stats: { hunger: 90, happy: 90, energy: 95, clean: 95 }, dog: { name: 'Noodle', months: 30 } });
  await ev(() => { const S = window.__paw.S; S.coolUntil = 1e12; S.careGifts = Object.assign(S.careGifts || {}, { hoodie: '2026-10-01' });
    ['Bumblebee Suit', 'Heart Sunglasses'].forEach((n) => { if (!S.inv.clothes.includes(n)) S.inv.clothes.push(n); }); window.__paw.saveNow(); });
  await t.calm();
  await ev(() => window.__paw.idle.speed(200)); // no idle acts (lying down, sniffing off) in the middle of a shot: Noodle stays up and happy
  await p().addStyleTag({ content: CLEAN_CSS });
  const relayout = async () => { await ev(() => window.dispatchEvent(new Event('resize'))); await p().waitForTimeout(900); };
  const quiet = () => ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const x = window.__paw.ex; if (x && x.cool) x.cool(); });
  const at = async (k) => { await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, k);
    await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', k, 8000); await t.calm(); await t.lu(); await relayout(); await quiet(); };
  // Noodle a little left of the middle of the phone's yard crop (world x 330, the camera's home crop shows about x 125..518), so after the 9:16 cut
  // he stays clear of TikTok's right-hand buttons
  const NX = +(process.env.NOODLE_X || 330);
  const noodleHome = () => ev((x) => { const P = window.__paw, id = P.S.dog.id; P.rm.set(id, { x, y: 500, face: 'right' }); }, NX).then(() => p().waitForTimeout(500));
  let cdp = null, rate = 1;
  const wait = (ms) => p().waitForTimeout(ms / rate);
  async function setRate(x) { if (!cdp) { cdp = await t.ctx.newCDPSession(p()); await cdp.send('Animation.enable'); } await ev((x) => window.__setRate(x), x); await cdp.send('Animation.setPlaybackRate', { playbackRate: x }); rate = x; }
  async function still(name) { await p().waitForTimeout(600); fs.writeFileSync(path.join(OUT, name + '.boxes.json'), JSON.stringify(await ev(() => window.__dogBoxes()))); await p().screenshot({ path: path.join(OUT, name + '.png') }); console.log('still', name); }
  // a clip: screenshots as fast as they come on the slowed clock, each stamped with its game time (as capture_clean.js)
  async function clip(name, secs, act, r, scale) {
    await still(name); if (STILLS) return;
    const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await setRate(r || 0.2); const ts = [], bxs = []; let n = 0, done = false;
    const v0 = await ev(() => window.__vt());
    const shoot = (async () => { const vp = p().viewportSize();
      while (!done) { const [v, bx] = await ev(() => [window.__vt(), window.__dogBoxes()]); if (v - v0 > secs * 1000) break;
        const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: scale || 3 } });
        fs.writeFileSync(path.join(dir, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(s.data, 'base64')); ts.push((v - v0) / 1000); bxs.push(bx); } })();
    if (act) await act();
    await shoot; done = true; await setRate(1);
    fs.writeFileSync(path.join(dir, 'ts.json'), JSON.stringify(ts)); fs.writeFileSync(path.join(dir, 'boxes.json'), JSON.stringify(bxs)); console.log('clip', name, n, 'frames', ts[n - 1].toFixed(2) + 's');
  }
  // a belly rub: the pointer over the dog's hit box, side to side (petting is distance based)
  const rub = async (rounds) => { const box = await p().locator('#dogHit').boundingBox(); for (let i = 0; i < rounds; i++) await p().mouse.move(box.x + box.width * (0.3 + 0.4 * (i % 2)), box.y + box.height * 0.4); };

  // 1. the hook: Noodle at home, a rub, hearts
  if (want('hook')) { await at('yard'); await noodleHome(); await clip('hook', 3.6, async () => { for (let i = 0; i < 6; i++) { await rub(14); await wait(300); } }, 0.2); }
  // 3. the Mt. Fuji Lookout by day
  // Noodle walks in along the path (the game's own roam walk, rm.to), from the left of the crop to his spot by the bench
  if (want('fuji')) {
    await at('fujihill');
    const home = await ev(() => { const P = window.__paw, id = P.S.dog.id, r = P.rm.info(id); P.rm.set(id, { x: r.x - 240, face: 'right' }); return { id, x: r.x, y: r.y, on: P.rm.on() }; });
    console.log('fuji', JSON.stringify(home)); await p().waitForTimeout(400);
    await clip('fuji', 4.4, async () => { await wait(300); await ev((h) => window.__paw.rm.to(h.id, h.x, h.y, { secs: 2.6 }), home); }, 0.2);
  }
  // 4. dress up: the hoodie and the flower crown, at home
  if (want('dress')) {
    await ev(() => { const S = window.__paw.S; S.outfit = Object.assign(S.outfit || {}, { eyes: 'Heart Sunglasses', body: 'Bumblebee Suit' }); window.__paw.saveNow(); });
    await at('yard'); await noodleHome(); await clip('dress', 2.4, async () => { await rub(14); }, 0.2);
    await ev(() => { const S = window.__paw.S; S.outfit.eyes = null; S.outfit.body = null; window.__paw.saveNow(); });
  }
  // 5. ball play in the yard
  if (want('ball')) {
    await at('yard'); await ev(() => window.__paw.bl.start('Tennis Ball')); await t.until(() => window.__paw.bl && window.__paw.bl.on, null, 5000);
    await ev(() => window.__paw.bl.seed(5)); await relayout(); await quiet();
    // the ball's own aim ring and halo, and the game's floating words ("+2", "Caught it!"), hidden: only the yard, Noodle and the ball
    const bHide = await p().addStyleTag({ content: '#blRing,#fx text{display:none!important}' });
    await clip('ball', 3.0, async () => { await wait(200); await ev(() => window.__paw.bl.easy()); }, 0.08, 6); // shot at 6x: the ball crop is wide, the build zooms in on Noodle
    await ev(() => window.__paw.bl.stop()); await t.untilMode('yard'); await ev((el) => el.remove(), bHide);
  }
  // 6. the veggie patch
  if (want('garden')) {
    // autumn crops, ripe (pumpkin, carrot, sweet potato: all autumn crops), the garden's own words, numbers, tools, hints and its little dog window hidden (with the header gone it floats in the sky)
    await ev(() => { const S = window.__paw.S, crops = ['pumpkin', 'carrot', 'sweet-potato', 'carrot', 'pumpkin', 'sweet-potato'];
      S.garden.plots.forEach((pl, i) => { if (!crops[i]) return; Object.assign(pl, { crop: crops[i], g: 1, water: 3, wd: 3, dry: 0, inSeason: true, inspected: true, planted: Date.now() - 864e5, ready: Date.now() - 36e5 }); }); window.__paw.saveNow(); });
    const gHide = await p().addStyleTag({ content: '.pg-hud,.pg-info,.pg-bubble,.pg-dogw,.pg-num,.pg-drops,.pg-tag,.pg-chips,.pg-card,.pg-pouch{display:none!important}.pg-plot.pg-sel::after{border-color:transparent!important}' });
    await ev(() => window.__paw.go('garden')); await t.until(() => document.querySelectorAll('.pg-plot').length >= 6, null, 8000); await relayout();
    await clip('garden', 2.4, null, 0.2);
    await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await ev((el) => el.remove(), gHide);
  }
  // 7. a family: Udon and their two puppies with Noodle, apart, hearts
  if (want('pups')) {
    await ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'female', months: 26 }, 'Udon'); P.addDog({ key: 'dachs', sex: 'male', months: 4 }, 'Soba'); P.addDog({ key: 'dachs', sex: 'female', months: 4 }, 'Ramen');
      P.S.dogs.forEach((d) => { d.sleeping = false; d.stats = Object.assign(d.stats, { happy: 90, energy: 90, hunger: 90, clean: 90 }); }); P.saveNow(); });
    await at('yard'); await noodleHome(); await p().waitForTimeout(1200);
    // the family placed apart (owner, 6 Nov 2026: dogs never overlap or touch): Udon and the two puppies in the back row, Noodle in front
    const fam = await ev((o) => { const P = window.__paw, S = P.S, N = S.dog, r = P.rm.info(N.id), byName = (n) => S.dogs.find((d) => d.name === n);
      const spots = { Udon: [r.x + o.u[0], r.y + o.u[1], 'right', 'sit'], Soba: [r.x + o.s[0], r.y + o.s[1], 'left', 'happy'], Ramen: [r.x + o.r[0], r.y + o.r[1], 'right', 'happy'] };
      for (const n in spots) { const d = byName(n); d.sleeping = false; P.rm.set(d.id, { x: spots[n][0], y: spots[n][1], face: spots[n][2], pose: spots[n][3] }); }
      return { noodle: [r.x, r.y], ok: Object.keys(spots).map((n) => P.rm.ok(byName(n).id, spots[n][0], spots[n][1])) }; },
      { u: JSON.parse(process.env.UDON || '[-110,-125]'), s: JSON.parse(process.env.SOBA || '[125,-115]'), r: JSON.parse(process.env.RAMEN || '[5,-110]') });
    console.log('family', JSON.stringify(fam)); await p().waitForTimeout(800);
    await clip('pups', 3.6, async () => { for (let i = 0; i < 6; i++) { await rub(14); await wait(300); } }, 0.2);
  }
  console.log('done', OUT);
}, { time: 'day', weather: 'sunny', season: 'autumn', timeout: 1500000 });
