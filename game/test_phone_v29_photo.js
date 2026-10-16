// phone_v29_photo (V29.md section 2, lane PHOTO): on a phone the camera lives in the "..." sheet, photo mode fits the screen with 44 px taps and 15 px text,
// Save works (download, share, hold to save) and the PNG is portrait. node game/run_tests.js phone_v29_photo
const { run } = require('./test_lib');
const pngSize = (buf) => (buf.length > 24 && buf.slice(1, 4).toString() === 'PNG' ? { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) } : null);
const readStream = async (dl) => { const rs = await dl.createReadStream(); const parts = []; for await (const c of rs) parts.push(c); return Buffer.concat(parts); };

(async () => {
  for (const device of ['iPhone 15', 'Pixel 7']) {
    await run('phone_v29_photo_' + device.replace(/\W+/g, ''), async (t) => {
      const { ok, sec, ev, S } = t, p0 = await t.boot({ device, prefs: { msTest: true } }), p = p0, tag = device + ': ';
      await t.adopt({ sex: 'girl' }); await t.patch({ bond: { level: 7, pts: 1450 }, coins: 500, stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } }); await t.calm();
      await t.until(() => !!(window.__paw && window.__paw.ph), null, 5000);

      sec(tag + 'the camera is in the "..." sheet');
      ok(await ev(() => getComputedStyle(document.getElementById('phBtn')).display === 'none'), tag + 'no camera button in the HUD (the phone HUD is tight)');
      await p.click('#moreBtn'); await p.waitForSelector('#mmPhoto');
      ok(await ev(() => { const b = document.getElementById('mmPhoto'), r = b.getBoundingClientRect(); return /Take a photo/.test(b.textContent) && r.height >= 44 && !!b.querySelector('svg'); }), tag + 'the sheet has "Take a photo" (44 px, with the icon)');
      ok(await ev(() => !document.getElementById('modal').hidden && !window.__paw.ph.can()), tag + 'a sheet is open: photo mode cannot start under it');
      await t.SH('more_sheet');
      await p.click('#mmPhoto');
      ok(await t.until(() => window.__paw.ph.active() && window.__paw.ph.ready(), null, 15000), tag + 'the sheet closes and photo mode opens');
      await t.SH('photo_mode');

      sec(tag + 'photo mode fits the screen');
      const geo = await ev(() => {
        const vw = innerWidth, vh = innerHeight, q = (s) => document.querySelector(s), r = (el) => el.getBoundingClientRect();
        const pic = r(q('.ph-pic')), side = r(q('.ph-side')), root = r(q('#phMode'));
        const btns = [...document.querySelectorAll('#phMode .btn, #phMode .ph-swatch')].filter((b) => getComputedStyle(b).display !== 'none');
        const small = btns.filter((b) => r(b).height < 43.5 || r(b).width < 43.5).map((b) => (b.id || b.className) + ':' + Math.round(r(b).width) + 'x' + Math.round(r(b).height));
        const tiny = [...document.querySelectorAll('#phMode .ph-cap, #phMode .ph-shape, #phMode .ph-acts .btn')].filter((b) => getComputedStyle(b).display !== 'none' && parseFloat(getComputedStyle(b).fontSize) < 15).map((b) => b.textContent);
        const acts = [...document.querySelectorAll('#phMode .ph-acts .btn')].map((b) => { const x = r(b); return x.left >= 0 && x.right <= vw + 0.5 && x.bottom <= vh + 0.5 && x.top >= 0; });
        return { vw, vh, pic: [pic.left, pic.top, pic.right, pic.bottom].map(Math.round), side: [side.top, side.bottom].map(Math.round), root: [root.width, root.height].map(Math.round), small, tiny, acts, picOver: pic.bottom > side.top + 1, hidden: ['hud', 'bar', 'dock'].map((id) => getComputedStyle(document.getElementById(id)).visibility), hs: document.documentElement.scrollWidth <= vw };
      });
      ok(geo.root[0] === geo.vw && geo.root[1] === geo.vh, tag + `photo mode covers the screen (${geo.root})`);
      ok(geo.small.length === 0, tag + `every tap target is 44 px or more ${geo.small.join(' ')}`);
      ok(geo.tiny.length === 0, tag + 'all button text is 15 px or more');
      ok(geo.acts.every(Boolean) && geo.acts.length === 3, tag + 'Save, Retake and Close are on screen');
      ok(!geo.picOver, tag + `the picture sits above the choices (pic ${geo.pic}, choices from ${geo.side[0]})`);
      ok(geo.pic[2] - geo.pic[0] > geo.vw * 0.7 || geo.pic[3] - geo.pic[1] > geo.vh * 0.45, tag + 'the picture is big enough to see');
      ok(geo.hidden.every((v) => v === 'hidden') && geo.hs, tag + 'the HUD, bar and tray are hidden, no sideways scroll');
      const sizes = await ev(() => ({ z: window.__paw.ph.size(), svg: window.__paw.ph.svg() }));
      ok(sizes.z.h === 1080 && sizes.z.w < 1080 && sizes.z.w > 500, tag + `a portrait postcard, ${sizes.z.w}x${sizes.z.h}`);
      ok(sizes.svg.includes('>Home<') || /Home ·/.test(sizes.svg), tag + 'the frame names the place');
      ok(await ev(() => { const c = document.querySelector('.ph-caps'); return c.scrollWidth >= c.clientWidth; }), tag + 'the captions scroll sideways');

      sec(tag + 'choices and Save');
      const before = await ev(() => window.__paw.ph.svg()); await p.click('#phMode [data-frame=sky]'); ok(await t.until((old) => window.__paw.ph.svg() !== old && window.__paw.ph.ready(), before, 8000), tag + 'a frame colour tap changes the picture');
      await p.click('#phMode [data-cap=c4]'); ok(await t.until(() => window.__paw.ph.svg().includes('Drawn on purpose') && window.__paw.ph.ready(), null, 8000), tag + 'a caption chip tap changes the caption');
      let dl = p.waitForEvent('download'); await p.click('#phSave'); let d = await dl, sz = pngSize(await readStream(d));
      ok(!!sz && sz.h === 1080 && sz.w === sizes.z.w, tag + `the PNG downloads (${sz && sz.w}x${sz && sz.h})`);
      ok((await S()).ph.n === 1, tag + 'S.ph.n is 1');
      await p.click('#phMode [data-sq="1"]'); ok(await t.until(() => { const z = window.__paw.ph.size(); return z.w === 1080 && z.h === 1080 && window.__paw.ph.ready(); }, null, 10000), tag + 'Square: 1080 x 1080');
      ok(await ev(() => document.querySelector('#phMode [data-sq="1"]').getAttribute('aria-pressed') === 'true'), tag + 'the Square switch is on');
      await ev(() => { window.__shared = null; navigator.canShare = (x) => !!(x && x.files && x.files.length); navigator.share = async (x) => { window.__shared = { type: x.files[0].type, size: x.files[0].size }; }; });
      await p.click('#phSave'); ok(await t.until(() => !!window.__shared, null, 5000) && (await ev(() => window.__shared.type)) === 'image/png', tag + 'on a phone Save goes to the share sheet with the PNG');
      ok(await t.until(() => window.__paw.S.ph.n === 2, null, 3000), tag + 'it counts (2)');
      await p.click('#phMode [data-sq="1"]'); ok(await t.until(() => window.__paw.ph.size().w < 1080 && window.__paw.ph.ready(), null, 10000), tag + 'tapping Square again goes back to the postcard');

      sec(tag + 'hold to save');
      await ev(() => { navigator.canShare = undefined; navigator.share = undefined; window.__paw.ph.force('none'); });
      await p.click('#phSave'); await p.waitForSelector('#phMode .ph-hold');
      const hold = await ev(() => { const h = document.querySelector('#phMode .ph-hold').getBoundingClientRect(), im = document.querySelector('#phMode .ph-holdpic').getBoundingClientRect(), b = document.getElementById('phHoldDone').getBoundingClientRect(); return { full: h.width === innerWidth && h.height === innerHeight, imgBig: im.width > innerWidth * 0.6 && im.height > innerHeight * 0.5, btn: b.height >= 44 && b.bottom <= innerHeight, txt: /Press and hold to save/.test(document.querySelector('.ph-hold').textContent), callout: getComputedStyle(document.querySelector('.ph-holdpic')).webkitTouchCallout !== 'none' }; });
      ok(hold.full && hold.imgBig && hold.btn && hold.txt, tag + 'the full-screen picture: "Press and hold to save", big, with a Done button');
      await t.SH('hold');
      await p.click('#phHoldDone'); ok(await ev(() => !document.querySelector('#phMode .ph-hold') && window.__paw.ph.active()), tag + 'Done returns to photo mode');
      await ev(() => window.__paw.ph.force(''));

      sec(tag + 'toasts stay off the picture, Close works');
      await ev(() => window.__paw.toast('A toast during photo mode'));
      ok(await ev(() => { const tt = document.querySelector('#toasts .toast'); return !tt || tt.getBoundingClientRect().bottom < 120; }), tag + 'toasts sit at the top, not over the picture');
      await p.click('#phClose'); ok(await t.until(() => !window.__paw.ph.active(), null, 3000), tag + 'Close ends photo mode');
      ok(await ev(() => getComputedStyle(document.getElementById('hud')).visibility !== 'hidden' && getComputedStyle(document.getElementById('bar')).visibility !== 'hidden'), tag + 'the HUD and the bar are back');

      sec(tag + 'not on the map, not in a walk');
      await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]');
      ok(await ev(() => !window.__paw.ph.can()), tag + 'the map: no camera');
      if (await p.locator('#moreBtn:visible').count()) { await p.click('#moreBtn'); await t.sleep(200); ok(await p.locator('#mmPhoto').count() === 0, tag + 'the map: the "..." sheet has no camera'); await ev(() => { document.querySelector('#modal .x') && document.querySelector('#modal .x').click(); }); }
      await t.home();

      sec(tag + 'a town place');
      await t.home('market');
      await p.click('#moreBtn'); await p.waitForSelector('#mmPhoto'); await p.click('#mmPhoto'); ok(await t.until(() => window.__paw.ph.active() && window.__paw.ph.ready(), null, 15000), tag + 'Market Street: photo mode opens');
      ok(await ev(() => window.__paw.ph.svg().includes('Market Street')), tag + 'the frame names Market Street');
      await p.keyboard.press('Escape'); ok(await t.until(() => !window.__paw.ph.active(), null, 3000), tag + 'Esc closes it');
    }, { device });
  }
})();
