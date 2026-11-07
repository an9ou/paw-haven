// The Friends how-to (owner, 7 Nov 2026: "put some in-game content, teach players how to use the function, how they can share the code through
// WhatsApp, IG, other social media platforms with the poster"). Records the REAL v2.19 Friends screens, with the game's own interface (the owner
// wants the sheet and the buttons here), but none of the clutter that is not part of a step (toasts, hints, the wish bubble, the place buttons):
//   OUR side (the Doodle Doggo account: Mochi the Shiba, Sunny Biscuit, DOG-K3APZ)
//     yard_ui      the yard with the bottom bar (step 1: tap More)          more_tray   the More tray open (tap Friends)
//     name_*       the name wheels turning to Sunny Biscuit (clip name/)     card        our friend card with Share invite / Share poster / Copy code
//     poster.png   the game's own 1080 x 1920 poster (fr.poster(): the PNG the Share poster button hands to the phone's share menu)
//   THE FRIEND's side ("Cozy Maple", a made-up player, with Waffles the Corgi): our code typed into Add a friend, letter by letter, then Add
//     add_0..add_5 the boxes filling, add_done  "Sunny Biscuit is your friend now!" and Sunny Biscuit in their list (their own card is never shown: crop)
// layout.json: the screen rects (CSS px of the 393 x 659 phone) of every button a step taps, for the tap marks and the crops.
// The visit, the note, the gift and the walk come from capture_clean.js (DOG_HEAD= DOG_NAME=Mochi).
//
//   OUR_CODE=DOG-K3APZ OUR_NAME=0,0 NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/howto/capture_howto.js <game checkout> <outdir>
//   (the checkout needs game/test_merged.html: node game/build.js && node game/harness.js merged)
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || 'howto_footage'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const { mockInit, slowInit, boxesInit, reelPage } = require('../capture_friends.js');
const OUR_CODE = process.env.OUR_CODE; if (!OUR_CODE) throw new Error('OUR_CODE (DOG-K3APZ) is needed: the how-to shows our real card');
const OUR_NAME = (process.env.OUR_NAME || '0,0').split(',').map(Number);
const FRIEND = (process.env.FRIEND_NAME || '2,14').split(',').map(Number); // Cozy Maple
const FRIEND_CODE = 'DOG-7MW2Q'; // the made-up friend's own code: never on screen (their card is cropped out)
const OUR_FID = 'doodledoggoxxxxxxxxxxx';
// the clutter that is not part of any step; the bars, the sheet and its buttons stay
const TIDY = '#devBtn,.hint,.coach,#ddWish,#msBtn,#phPeek,#placeBtns,#bubble{opacity:0!important;pointer-events:none!important}';
const NOTOAST = '#toasts{opacity:0!important}';
// PAW_LANG=zh-Hans (the RedNote cut, 7 Nov 2026): the dogs are adopted in English (the harness picks breeds by their English names), then the game is
// switched to the language and reloaded with the save, as capture_clean.js does, so every button and word on screen is the game's own zh-Hans
const LANG = process.env.PAW_LANG || '';

run('friends_howto', async (t) => {
  const { ev } = t, p = () => t.p;
  const day = new Date(t.pageNow()).toISOString().slice(0, 10);
  const L = {};
  const rect = async (key, sel) => { L[key] = await ev((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; }, sel); if (!L[key]) throw new Error('no ' + sel); };
  async function still(name) { await p().waitForTimeout(700); fs.writeFileSync(path.join(OUT, name + '.boxes.json'), JSON.stringify(await ev(() => window.__dogBoxes()))); await p().screenshot({ path: path.join(OUT, name + '.png') }); console.log('still', name); }
  let cdp = null, rate = 1;
  const wait = (ms) => p().waitForTimeout(ms / rate);
  async function setRate(x) { if (!cdp) { cdp = await t.ctx.newCDPSession(p()); await cdp.send('Animation.enable'); } await ev((x) => window.__setRate(x), x); await cdp.send('Animation.setPlaybackRate', { playbackRate: x }); rate = x; }
  async function clip(name, secs, act, r) {
    const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await setRate(r); const ts = []; let n = 0, done = false; const v0 = await ev(() => window.__vt());
    const shoot = (async () => { const vp = p().viewportSize();
      while (!done) { const v = await ev(() => window.__vt()); if (v - v0 > secs * 1000) break;
        const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 3 } });
        fs.writeFileSync(path.join(dir, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(s.data, 'base64')); ts.push((v - v0) / 1000); } })();
    if (act) await act();
    await shoot; done = true; await setRate(1);
    fs.writeFileSync(path.join(dir, 'ts.json'), JSON.stringify(ts)); console.log('clip', name, n, 'frames', ts[n - 1].toFixed(2) + 's');
  }
  const start = async (tag, init) => {
    cdp = null; rate = 1;
    await t.mk({ device: 'iPhone 15', prefs: { frTest: true } });
    await t.ctx.addInitScript(mockInit, init); await t.ctx.addInitScript(slowInit); await t.ctx.addInitScript(boxesInit);
    await p().goto('file://' + reelPage(DEV, tag, 16));
    await p().waitForSelector('#tNew, #tContinue, #tGuest');
    if (await p().locator('#tGuest').count()) { await p().click('#tGuest'); await p().waitForSelector('#tNew'); }
  };

  const toLang = async () => { if (!LANG) return;
    await ev((l) => { window.__paw.saveNow(); const K = 'pawhaven_prefs_v1'; let pr = {}; try { pr = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { pr = {}; } pr.lang = l; localStorage.setItem(K, JSON.stringify(pr)); }, LANG);
    await t.reloadKeepingSave(); await p().waitForSelector('#tContinue'); await p().click('#tContinue'); await t.untilMode('yard'); await t.calm();
    console.log('language', await ev(() => document.documentElement.lang)); };
  // ---------------- our side: Mochi, Sunny Biscuit, DOG-K3APZ ----------------
  await start('howto_us', { code: OUR_CODE, day, friend: FRIEND });
  await t.adopt({});
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Mochi' } });
  await toLang();
  await ev(() => { window.__paw.S.coolUntil = 1e12; });
  await t.calm();
  const dog = await ev(() => ({ name: window.__paw.S.dog.name, key: window.__paw.S.dog.key }));
  console.log('our dog', JSON.stringify(dog)); if (!/shiba/i.test(dog.key)) throw new Error('our dog is not the Shiba: ' + dog.key);
  await p().addStyleTag({ content: TIDY + NOTOAST });
  await p().waitForTimeout(900);
  // 1. the yard with the bar: tap More
  await rect('more', '#bar .act[data-act="more"]');
  await still('yard_ui');
  await p().click('#bar .act[data-act="more"]');
  await t.until(() => { const b = document.querySelector('.barpop[data-pop="more"] [data-act="friends"]'); return !!b && b.getBoundingClientRect().width > 0; }, null, 4000);
  await p().waitForTimeout(500);
  await rect('friends', '.barpop[data-pop="more"] [data-act="friends"]');
  await still('more_tray');
  // 2. the first time: pick a name (the wheels turn to Sunny Biscuit), then "This is my name"
  await ev((nm) => { window.__paw.S.dc.name = nm; }, [OUR_NAME[0], (OUR_NAME[1] + 2) % 40]);
  await p().click('.barpop[data-pop="more"] [data-act="friends"]');
  await t.until(() => !!document.getElementById('frOk'), null, 6000);
  await p().waitForTimeout(600);
  await still('name_start');
  await rect('spin', '[data-frspin="b:-1"]');
  await clip('name', 2.6, async () => { await wait(300); for (let i = 0; i < 2; i++) { await p().click('[data-frspin="b:-1"]'); await wait(650); } }, 0.08);
  // zh-Hans: the longer intro pushes "就用这个名字" below the sheet's fold; it is scrolled into view for the still the tap lands on (English as filmed)
  if (LANG) { await ev(() => document.getElementById('frOk').scrollIntoView({ block: 'nearest' })); await p().waitForTimeout(400); }
  await rect('ok', '#frOk');
  await still('name_pick');
  await p().click('#frOk');
  await t.until(() => !!document.getElementById('frCard'), null, 8000);
  await p().waitForTimeout(1200);
  await rect('card', '#frCard'); await rect('share', '#frShare'); await rect('poster', '#frPoster'); await rect('copy', '#frCopy');
  await still('card');
  const name = await ev(() => window.__paw.S.fr.name), code = await ev(() => window.__paw.S.fr.code);
  if (code !== OUR_CODE || name[0] !== OUR_NAME[0] || name[1] !== OUR_NAME[1]) throw new Error('our card is ' + code + ' ' + name);
  // 3. the poster the Share poster button shares: the game's own PNG
  const b64 = await ev(async () => { const b = await window.__paw.fr.poster(); if (!b) return null; const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); });
  if (!b64) throw new Error('no poster: ' + await ev(() => window.__paw.fr.posterErr()));
  fs.writeFileSync(path.join(OUT, 'poster.png'), Buffer.from(b64, 'base64')); console.log('poster.png');
  const usYard = await ev(() => window.__paw.fr.yard());
  fs.writeFileSync(path.join(OUT, 'us_yard.json'), JSON.stringify(usYard));

  // ---------------- the friend's side: Cozy Maple with Waffles the Corgi adds us ----------------
  await t.ctx.close();
  await start('howto_friend', { code: FRIEND_CODE, day, friend: FRIEND, extra: { book: { [OUR_CODE]: { fid: OUR_FID, name: OUR_NAME } }, yards: { [OUR_FID]: usYard } } });
  await t.adopt({ head: '~Corgi', sex: 'girl' });
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Waffles' } });
  await toLang();
  await ev(() => { window.__paw.S.coolUntil = 1e12; }); await t.calm();
  await p().addStyleTag({ content: TIDY });
  const quiet = await p().addStyleTag({ content: NOTOAST }); // the mail and hint toasts of a new game are not part of the step
  await ev((nm) => { window.__paw.S.dc.name = nm; }, FRIEND);
  await t.until(() => !!(window.__paw.fr && window.__paw.fr.open), null, 10000);
  await ev(() => window.__paw.fr.open());
  await t.until(() => !!document.getElementById('frOk'), null, 6000); await p().click('#frOk');
  await t.until(() => !!document.getElementById('frCard'), null, 8000);
  // the Add a friend row near the top of the sheet's view, their own card scrolled away (their code is never shown)
  await ev(() => { const e = document.querySelector('.fr-add'), h = e.previousElementSibling; (h || e).scrollIntoView({ block: 'start' }); });
  await p().waitForTimeout(600);
  await rect('f_cardTop', '#frCard'); await rect('f_add', '.fr-add'); await rect('f_addBtn', '#frAdd'); await rect('f_head', '.fr-add');
  L.f_title = await ev(() => { const h = [...document.querySelectorAll('.fr-h')][0]; const r = h.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  L.f_boxes = await ev(() => [...document.querySelectorAll('.fr-ch')].map((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }));
  await still('add_0');
  const raw = OUR_CODE.slice(4);
  for (let i = 0; i < 5; i++) { await ev(([i, ch]) => { const e = document.getElementById('frCh' + i); e.value = ch; e.dispatchEvent(new Event('input', { bubbles: true })); e.blur(); }, [i, raw[i]]); await still('add_' + (i + 1)); }
  await ev(() => document.activeElement && document.activeElement.blur());
  await ev((el) => { el.remove(); document.getElementById('toasts').innerHTML = ''; }, quiet); // only the Add toast from here
  const nToasts = await ev(() => window.__toasts.length);
  await p().click('#frAdd');
  await t.until(() => document.querySelectorAll('.fr-row').length === 1, null, 6000);
  await p().waitForTimeout(500);
  const toasts = await ev(() => window.__toasts.slice()); console.log('toasts', JSON.stringify(toasts));
  const added = toasts.slice(nToasts); // fr.added in the game's language ("Sunny Biscuit is your friend now!", "阳光饼干现在是你的好友啦！": the game puts a zero-width space between the two words)
  if (!added.some((x) => /Sunny Biscuit is your friend now|阳光\u200b?饼干现在是你的好友啦/.test(x))) throw new Error('no "is your friend now" toast: ' + JSON.stringify(added));
  await ev(() => { const e = document.querySelector('.fr-add'), h = e.previousElementSibling; (h || e).scrollIntoView({ block: 'start' }); });
  await p().waitForTimeout(300);
  await rect('f_row', '.fr-row'); await rect('f_toast', '#toasts .toast');
  L.f_cardAfter = await ev(() => { const r = document.getElementById('frCard').getBoundingClientRect(); return { y: r.top, h: r.height }; });
  await still('add_done');
  L.code = OUR_CODE; L.name = OUR_NAME; L.vw = 393; L.vh = await ev(() => innerHeight);
  fs.writeFileSync(path.join(OUT, 'layout.json'), JSON.stringify(L, null, 1));
  console.log('done', OUT);
}, { time: 'day', weather: 'sunny', season: 'autumn', timeout: 900000 });
