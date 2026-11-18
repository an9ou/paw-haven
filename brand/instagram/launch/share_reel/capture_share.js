// The 18 Nov 2026 "Share my dog" Reel (v2.31, docs/marketing/SHARE_REEL.md): clean captures from a fresh worktree of origin/main
// (game/test_merged.html: node game/build.js && node game/harness.js merged), with the test harness (game/test_lib.js). Nothing in main changes.
// Noodle the dachshund is adopted (the title's one Play, the Dachshund head, a boy), wears the Autumn Scarf, the What's new sheet is marked seen.
//   scenes (svg.world as the game draws each place, our own dog, the roaming dogs and the effects left out, for build_share.js to draw at 3.2x):
//     <place>.svg  for every place in PLACES below (autumn, sunny, day). The gift Reel's yard, pier, square and house are not used.
//   the share pictures (the game's own shareDog drawing, window.__paw.sh.draw, the PNG exactly as the Share button hands it over):
//     pic_noodle_feed.png (1080x1350, Show name off), pic_noodle_feed_name.png, pic_noodle_story_name.png (1080x1920, Show name on),
//     pic_<key>.png  other dogs (PALS below: their breed's starter coat, an outfit, Show name on), 1080x1350
//   screens (3x PNG, transparent corners; the close cross and the dev button hidden):
//     sh_sheet       the "Share my dog" sheet on a phone (iPhone 15): the preview, Post / Story, Show name, the note, Share
//     more_tray      the phone's More tray open (the Share tile), with the phone bar under it; boxes in facts.json
//     walk_card      the walk results card with "Share this moment"
//     bond_card      the Bond level card with "Share this moment"
//   NODE_PATH=$(npm root -g) [PAW_LANG=zh-Hans] node brand/instagram/launch/share_reel/capture_share.js <main checkout> <outdir>
// PAW_LANG=zh-Hans (the RedNote cut): the game switched to Simplified Chinese after the adoption (as gift_reel/capture_gift.js). RedNote rule (owner,
// 18 Nov 2026: never suggest posting to other apps): the sheet's size buttons (帖子 / 快拍, post / story) are hidden (display:none) and the preview's
// bottom strip, the "Doodle Doggo · doodledoggo.app" chip, is cropped off (clip-path) before the sheet is captured. build_share.js crops the chip
// off the share pictures themselves.
// facts.json lists the game lines the captures carry (build_share.js checks them).
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'share_caps'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const LANG = process.env.PAW_LANG || '';
const CLEAN = '#devBtn,#toasts,.sheet-grab,#modal .xbtn,#modal .x{display:none!important}'
  + 'body *:not(#modal):not(#modal *){visibility:hidden!important}#modal,#modal *{visibility:visible}'
  + '#modal,#stage,html,body{background:transparent!important;backdrop-filter:none!important;box-shadow:none}';
const PLACES = (process.env.PLACES || 'dogpark,hilltop,pool,training,woods,park,river,cafe').split(',');
const OUTFIT = { neck: 'Autumn Scarf' };
// other dogs for the variety beat: no black or white coat as a subject (owner, 1 Nov 2026)
const PALS = [['golden', 0, 'Maple', { head: 'Flower Crown' }], ['beagle', 0, 'Pickle', { neck: 'Bow Tie' }], ['corgi', 0, 'Toffee', { head: 'Party Hat' }], ['pug', 0, 'Dumpling', { eyes: 'Heart Sunglasses' }]];
run('share_capture', async (t) => {
  const { ev } = t, p = () => t.p, facts = { pals: [] };
  const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
  const settle = async () => { await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); }); await p().waitForTimeout(900); await closeAll(); };
  const start = async (dev) => {
    await t.newGame(Object.assign({ map215: true, ground: true, time: 'day', season: 'autumn', weather: 'sunny', head: '~Dachshund', sex: 'boy' }, dev ? { device: dev } : {}), { coins: 3000, dog: { name: 'Noodle' } });
    await t.calm(); await t.lu(); await settle();
    await ev((o) => { window.__paw.S.dog.outfit = Object.assign({}, window.__paw.S.dog.outfit || {}, o); window.__paw.saveNow(); }, OUTFIT);
    await t.until(() => !!(window.__paw && window.__paw.sh), null, 8000);
    if (LANG) { // the language, switched in the game and reloaded with the save
      await ev((l) => { window.__paw.S.lang = l; window.__paw.saveNow(); const K = 'pawhaven_prefs_v1'; let pr = {}; try { pr = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { pr = {}; } pr.lang = l; localStorage.setItem(K, JSON.stringify(pr)); }, LANG);
      await t.reloadKeepingSave(); await p().waitForSelector('#tContinue'); await p().click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu(); await settle();
      await t.until(() => !!(window.__paw && window.__paw.sh), null, 8000); facts.lang = await ev(() => document.documentElement.lang); console.log('language', facts.lang);
    }
  };
  let cdp = null;
  const shoot = async (sel, name, scale) => {
    await p().waitForTimeout(700);
    const r = await ev((s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.left, y: q.top, width: q.width, height: q.height }; }, sel);
    if (!r) throw new Error('no ' + sel);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const s = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: Object.assign({}, r, { scale: scale || 3 }) });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(s.data, 'base64')); console.log('wrote', name, Math.round(r.width), 'x', Math.round(r.height));
    const txt = await ev((s) => document.querySelector(s).innerText, sel); fs.writeFileSync(path.join(OUT, name + '.txt'), txt); facts[name] = txt;
  };
  let style = null; const clean = async (on, extra) => { if (on && !style) style = await p().addStyleTag({ content: CLEAN + (extra || '') }); if (!on && style) { await style.evaluate((e) => e.remove()); style = null; } };
  // the share picture as the game draws it: the PNG blob shareDog hands to the share sheet
  const pic = async (name, o) => {
    const r = await ev(async (o) => { const b = await window.__paw.sh.draw(o); if (!b) return null; const bm = await createImageBitmap(b);
      const buf = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return { w: bm.width, h: bm.height, bytes: b.size, b64: btoa(s), line: window.__paw.sh.line(o), svgName: o.name ? window.__paw.sh.svg(o).includes(window.__paw.S.dogs.find((d) => d.id === (o.id || window.__paw.S.dog.id)).name) : null }; }, o);
    if (!r) throw new Error('no picture ' + name);
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.b64, 'base64'));
    facts[name] = { w: r.w, h: r.h, bytes: r.bytes, line: r.line, size: o.size, name: !!o.name, nameDrawn: r.svgName }; console.log('picture', name, r.w + 'x' + r.h, JSON.stringify(r.line));
  };

  // ======== desktop (1280x720): the scenes, the pictures, the walk and Bond cards ========
  await start(null); cdp = await t.ctx.newCDPSession(p());
  facts.breed = await ev(() => window.__paw.sh.line({ outfit: {} }));
  facts.sizes = await ev(() => window.__paw.sh.sizes);
  // ---- 1. the scenes ----
  for (const pl of PLACES) {
    await t.home(pl); await p().waitForTimeout(1400); await closeAll();
    const r = await ev(() => { const s = document.querySelector('#view svg.world'); if (!s) return null; const c = s.cloneNode(true);
      ['#pack .rmdog', '#pack', '#zzz', '#fx', '#ballLayer', '#messG', '#visitorG', '#dogG', '#dogPos'].forEach((q) => c.querySelectorAll(q).forEach((e) => e.remove()));
      return { svg: c.outerHTML, vb: s.getAttribute('viewBox'), place: window.__paw.S.place, name: window.__paw.placeName(window.__paw.S.place) }; });
    if (!r || r.place !== pl) { console.log('no scene for', pl, r && r.place); continue; }
    fs.writeFileSync(path.join(OUT, pl + '.svg'), r.svg); facts['scene_' + pl] = { vb: r.vb, name: r.name }; console.log('scene', pl, r.vb, r.name);
  }
  await t.home(); await p().waitForTimeout(800); await closeAll();
  // ---- 2. Noodle's share pictures (pose happy, as the sheet opens: shareDog's default) ----
  const nid = await ev(() => window.__paw.S.dog.id);
  await pic('pic_noodle_feed', { id: nid, size: 'feed', name: false, pose: 'happy', outfit: OUTFIT });
  await pic('pic_noodle_feed_name', { id: nid, size: 'feed', name: true, pose: 'happy', outfit: OUTFIT });
  await pic('pic_noodle_story_name', { id: nid, size: 'story', name: true, pose: 'happy', outfit: OUTFIT });
  await pic('pic_noodle_story', { id: nid, size: 'story', name: false, pose: 'happy', outfit: OUTFIT });
  facts.noodleCoat = await ev(() => { const c = window.__paw.coat(window.__paw.S.dog); return c ? { coatName: c.coatName, eyes: c.eyes } : null; });
  // ---- 3. the walk results card and the Bond level card, each with "Share this moment" ----
  await ev(() => { window.__paw.S.stats.energy = 100; window.__paw.S.dog.stats.energy = 100; });
  await t.startWalk(true); await p().waitForTimeout(2500);
  if (!(await t.quitWalk(false))) throw new Error('no walk results card');
  await t.until(() => !!document.querySelector('#modal .celebrate .sh-moment'), null, 5000);
  await clean(true); await shoot('#modal .panel', 'walk_card'); await clean(false);
  await p().click('#resOk'); await t.until(() => window.__paw.mode === 'yard' && !document.getElementById('resOk'), null, 8000); await t.lu(); await t.calm(); await settle();
  await p().click('#devBtn'); await p().waitForSelector('#devPanel:not([hidden])'); await p().click('#dvBond'); if (await p().locator('#devPanel:not([hidden])').count()) await p().click('#dvX');
  await t.until(() => !!document.querySelector('#modal .celebrate #luOk') && !!document.querySelector('#modal .celebrate .sh-moment'), null, 6000);
  await clean(true); await shoot('#modal .panel', 'bond_card'); await clean(false); await t.lu(); await settle();
  // ---- 4. other dogs' pictures: each breed's first starter coat, an outfit, the name on ----
  for (const [key, ci, name, outfit] of PALS) {
    const id = await ev(([key, ci, name]) => { const P = window.__paw; let pick = null; try { pick = P.sh.pick(key, ci); } catch (e) { pick = null; } const d = P.addDog({ key, sex: 'girl', months: 10, pick }, name); return d ? d.id : null; }, [key, ci, name]);
    if (!id) throw new Error('no dog ' + key);
    await pic('pic_' + key, { id, size: 'feed', name: true, pose: 'happy', outfit });
    facts.pals.push({ key, name, outfit, coat: await ev((id) => { const c = window.__paw.coat(window.__paw.S.dogs.find((d) => d.id === id)); return c ? c.coatName : ''; }, id) });
  }

  // ======== phone (iPhone 15): the More tray and the Share my dog sheet ========
  await t.ctx.close();
  await start('iPhone 15'); cdp = await t.ctx.newCDPSession(p());
  await t.home(); await p().waitForTimeout(900); await closeAll();
  await p().click('#bar .act[data-act="more"]');
  await t.until(() => { const q = document.querySelector('#bar .barpop[data-pop="more"]'); return !!q && !q.hidden; }, null, 4000); await p().waitForTimeout(700);
  facts.more = await ev(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map((v) => Math.round(v * 10) / 10); };
    return { vw: innerWidth, vh: innerHeight, tray: q('#bar .barpop[data-pop="more"]'), share: q('#bar .barpop[data-pop="more"] [data-act="share"]'), more: q('#bar .act[data-act="more"]'), bar: q('#bar'),
      shareLabel: (document.querySelector('#bar .barpop[data-pop="more"] [data-act="share"]') || {}).innerText || '', moreLabel: (document.querySelector('#bar .act[data-act="more"]') || {}).innerText || '',
      tiles: [...document.querySelectorAll('#bar .barpop[data-pop="more"] [data-act]')].map((e) => e.innerText.trim()) }; });
  console.log('more tray', JSON.stringify(facts.more));
  { const st = await p().addStyleTag({ content: '#devBtn,#toasts{display:none!important}' });
    const s = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: facts.more.vw, height: facts.more.vh, scale: 3 } }); fs.writeFileSync(path.join(OUT, 'more_tray.png'), Buffer.from(s.data, 'base64')); console.log('wrote more_tray (the full phone screen, 3x)');
    await st.evaluate((e) => e.remove()); }
  // the tile opens the sheet (the player's own tap)
  await p().click('#bar .barpop[data-pop="more"] [data-act="share"]');
  await t.until(() => !!document.querySelector('#modal .sh-pop .sh-img'), null, 10000); await p().waitForTimeout(900);
  facts.sheetFrom = await ev(() => document.querySelector('#modal .sh-pop').dataset.shFrom);
  if (LANG) { const st = await p().addStyleTag({ content: '#modal .sh-sizes{display:none!important}#modal .sh-img{clip-path:inset(0 0 7% 0)}' }); await p().waitForTimeout(500); facts.rnCover = 'size buttons hidden, preview chip cropped'; }
  await clean(true); await shoot('#modal .panel', 'sh_sheet'); await clean(false);
  fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts, null, 1));
}, { date: process.env.CAP_DATE || '2026-11-18', timeout: 400000, season: 'autumn', weather: 'sunny' });
