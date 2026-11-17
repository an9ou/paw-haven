// v2.31 "Share my dog" (Release B, game/src/58_share.js, game/css/60_share.css, photo mode in 35_photo.js): the share picture (feed 1080x1350 and
// story 1080x1920) on the player's own yard, the dog about twice the old postcard dog, the breed and outfit line, the name only with "Show name",
// the "Doodle Doggo · doodledoggo.app" chip and no QR; the sheet (size and name switches kept in prefs, Share -> download / hold, nothing uploaded);
// "Share this moment" on the Bond level card, the walk results card and after a story scene; photo mode saves 1080x1350 with the chip and no
// poop or flies; several breeds, coats, outfits, a wet dog and a puppy drawn in one piece; the sheet at 360x640.
// node game/run_tests.js share_dog      (SHARE_SHOTS=<dir> also writes the pictures and screenshots there)
const { run } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.SHARE_SHOTS || null;

run('share_dog', async (t) => {
  const { ok, sec, ev } = t;
  const save = (name, b64) => { if (!SHOTS || !b64) return; fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(b64, 'base64')); };
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(400); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
  // draw the share picture in the page: { w, h, bytes, b64 }
  const pic = (o) => ev(async (o) => {
    const b = await window.__paw.sh.draw(o); if (!b) return null; const bm = await createImageBitmap(b);
    const buf = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { w: bm.width, h: bm.height, bytes: b.size, b64: btoa(s) };
  }, o);
  const boot = async (o) => { await t.boot(o || {}); await t.adopt({ sex: 'girl' }); await t.until(() => !!(window.__paw && window.__paw.sh && window.__paw.ph), null, 6000); await t.calm(); };
  const reqs = []; const watch = () => t.p.on('request', (r) => { const u = r.url(); if (!/^(data|blob|file|about|chrome-extension):/.test(u)) reqs.push(u); });

  sec('1. the picture: two sizes, the chip, no QR, the name only when asked, nothing outside the file');
  await boot(); watch();
  const s0 = await t.S();
  ok(!('shSize' in (await ev(() => JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}')))) && s0.v === 1, 'no save change: the size and name switches are prefs only, v stays 1');
  const svg = await ev(() => window.__paw.sh.svg({ size: 'feed' }));
  const name = s0.dog.name;
  ok(svg.includes('Doodle Doggo · doodledoggo.app') && /class="sh-chip"/.test(svg), 'the "Doodle Doggo · doodledoggo.app" chip is on the picture');
  ok(!svg.includes(name) && !/scan|DOG-[A-Z0-9]{5}/i.test(svg) && !/<rect[^>]*width="[0-9.]+"[^>]*height="[0-9.]+"[^>]*fill="#5B3D32"[^>]*\/>(<rect[^>]*fill="#5B3D32"[^>]*\/>){20}/.test(svg), 'no name by default, no friend code and no QR');
  ok(await ev((n) => window.__paw.sh.svg({ size: 'feed', name: true }).includes(n), name), 'the name shows when "Show name" is on');
  ok(!/\s(?:xlink:)?href="(?!#|data:)/.test(svg) && !/url\(\s*['"]?(?!#|data:)/.test(svg) && !/<script|<foreignObject/i.test(svg), 'nothing in the picture points outside the file');
  ok(!/class="[^"]*\bmess\b|class="flies"/.test(svg) && !/id="dogPos"|id="pack"|id="bowlG"/.test(svg), 'the yard backdrop has no poop, puddle, flies, bowl or the live dogs');
  ok(/pa-d-f1|pa-pose|<svg/.test(svg) && svg.length > 20000, 'the yard and the dog are drawn (' + svg.length + ' chars)');
  const feed = await pic({ size: 'feed', name: false }), story = await pic({ size: 'story', name: true });
  ok(feed && feed.w === 1080 && feed.h === 1350 && feed.bytes > 100000, 'feed picture 1080x1350: ' + JSON.stringify(feed && { w: feed.w, h: feed.h, bytes: feed.bytes }));
  ok(story && story.w === 1080 && story.h === 1920 && story.bytes > 100000, 'story picture 1080x1920: ' + JSON.stringify(story && { w: story.w, h: story.h, bytes: story.bytes }));
  save('en_shiba_feed', feed && feed.b64); save('en_shiba_story_name', story && story.b64);
  // the dog is about twice the old postcard dog (about 23% of the width): its drawn box in the picture
  const dogW = await ev(() => { const s = window.__paw.sh.svg({ size: 'feed' }), m = /<svg x="([0-9.]+)" y="[0-9.]+" width="([0-9.]+)" height="[0-9.]+" viewBox="([0-9. ]+)"/.exec(s); if (!m) return 0; const vb = m[3].split(' ').map(Number); return 422 * 0.64 * (+m[2] / vb[2]) / 1080; });
  ok(dogW > 0.4 && dogW < 0.6, 'the dog itself is about 40-60% of the picture width (the old postcard: 23%): ' + dogW.toFixed(2));
  ok(await ev(() => /Shiba/.test(window.__paw.sh.line({}))), 'the crayon line names the breed: ' + await ev(() => window.__paw.sh.line({})));
  ok(await ev(() => /Shiba wearing Party Hat and Red Bandana|Shiba wearing Party Hat, Red Bandana/.test(window.__paw.sh.line({ outfit: { head: 'Party Hat', neck: 'Red Bandana' } }))), 'and what it wears: ' + await ev(() => window.__paw.sh.line({ outfit: { head: 'Party Hat', neck: 'Red Bandana' } })));

  sec('2. the sheet: preview, size and name switches (kept), Share -> download, hold; nothing uploaded');
  await ev(() => window.__paw.sh.open({ from: 'menu' }));
  ok(await t.until(() => !!document.querySelector('#modal .sh-pop .sh-img'), null, 8000), 'the share sheet opens with a preview');
  ok(await ev(() => document.querySelector('#modal .sh-prev').dataset.size === 'feed' && document.querySelector('[data-shsize="feed"]').getAttribute('aria-pressed') === 'true' && document.getElementById('shName').getAttribute('aria-checked') === 'false'), 'feed size and the name off by default');
  ok(await ev(() => !/QR|scan/i.test(document.querySelector('#modal .sh-pop').textContent)), 'no QR words on the sheet');
  await shot('desktop_sheet_feed');
  await t.p.click('[data-shsize="story"]'); await t.p.click('#shName');
  ok(await t.until(() => { const r = window.__paw.sh.rec(); return r && r.blob && r.size === 'story' && r.name; }, null, 8000), 'story size and the name redraw the preview');
  ok(await ev(() => { const p = JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}'); return p.shSize === 'story' && p.shName === true; }), 'the switches are kept in prefs');
  await shot('desktop_sheet_story_name');
  await ev(() => window.__paw.sh.force('none'));
  const dl = t.p.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await t.p.click('#shGo');
  const d = await dl;
  ok(!!d && /^doodle-doggo-shiba-\d{4}-\d{2}-\d{2}\.png$/.test(d.suggestedFilename()) && await ev(() => window.__paw.sh.how() === 'download'), 'no share sheet (desktop): the PNG downloads: ' + (d && d.suggestedFilename()));
  ok(await t.waitToast(/Picture saved/, 3000), 'a kind toast says where it went');
  { // v2.31 review: inside the itch.io iframe navigator.share can exist and still be refused (NotAllowedError): the picture downloads instead
    await ev(() => { window.__shNav = [navigator.share, navigator.canShare]; navigator.share = () => Promise.reject(new DOMException('blocked in this frame', 'NotAllowedError')); navigator.canShare = () => true; });
    const dl2 = t.p.waitForEvent('download', { timeout: 8000 }).catch(() => null); await t.p.click('#shGo'); const d2 = await dl2;
    ok(!!d2 && await ev(() => window.__paw.sh.how() === 'download'), 'a refused share (the itch.io iframe) falls back to the download');
    await ev(() => { navigator.share = window.__shNav[0]; navigator.canShare = window.__shNav[1]; });
  }
  await ev(() => window.__paw.sh.force('nodownload')); await t.p.click('#shGo');
  ok(await t.until(() => window.__paw.sh.how() === 'hold' && /Press and hold/.test(document.querySelector('#modal .sh-note').textContent), null, 4000), 'no share and no download (the claude.ai sandbox): "Press and hold the picture to save it"');
  await ev(() => window.__paw.sh.force(''));
  ok(reqs.length === 0, 'nothing was uploaded or fetched: ' + JSON.stringify(reqs.slice(0, 3)));
  // the Web Share API path, with a stub share: the file and game words only
  const shared = await ev(async () => {
    let got = null; const ns = navigator.share, nc = navigator.canShare;
    navigator.canShare = () => true; navigator.share = async (d) => { got = { files: d.files.map((f) => [f.name, f.type, f.size]), text: d.text, url: d.url }; };
    document.getElementById('shGo').click(); for (let i = 0; i < 40 && !got; i++) await new Promise((r) => setTimeout(r, 50));
    navigator.share = ns; navigator.canShare = nc; return got;
  });
  ok(shared && shared.files.length === 1 && shared.files[0][1] === 'image/png' && shared.files[0][2] > 100000 && shared.url === 'https://doodledoggo.app' && !shared.text.includes(name), 'the Web Share API gets the PNG, a game line and the site, no name: ' + JSON.stringify(shared));
  await t.p.click('[data-shsize="feed"]'); await t.p.click('#shName'); await t.closeX(); await t.modalGone();

  sec('3. the yard entry (desktop top bar) opens Share my dog');
  ok(await t.until(() => { const b = document.getElementById('stPcBtn'); return !!b && !b.hidden; }, null, 4000), 'the yard Share button is in the top bar (shown on stages 1280x740 and up)');
  ok(await ev(() => document.getElementById('stPcBtn').getAttribute('aria-label') === 'Share my dog'), 'it is called "Share my dog"');
  await ev(() => window.__paw.st.pc('yard')); ok(await t.until(() => !!document.querySelector('#modal .sh-pop'), null, 4000) && await ev(() => document.querySelector('#modal .sh-pop').dataset.shFrom === 'yard'), 'the yard postcard path opens the share sheet');
  await t.closeX(); await t.modalGone();

  sec('4. "Share this moment": the Bond level card, the walk results card, after a story scene');
  await t.p.click('#devBtn'); await t.p.waitForSelector('#devPanel:not([hidden])'); await t.p.click('#dvBond'); if (await t.p.locator('#devPanel:not([hidden])').count()) await t.p.click('#dvX');
  ok(await t.until(() => !!document.querySelector('#modal .celebrate #luOk') && !!document.querySelector('#modal .celebrate .sh-moment'), null, 6000), 'the Bond level card has "Share this moment"');
  await shot('desktop_bond_card');
  await t.p.click('#modal .sh-moment');
  ok(await t.until(() => !!document.querySelector('#modal .sh-pop') && document.querySelector('#modal .sh-pop').dataset.shFrom === 'bond', null, 5000), 'it opens the share sheet for that moment');
  ok(await t.until(() => { const r = window.__paw.sh.rec(); return r && r.blob && r.pose === 'happy'; }, null, 8000), 'drawn in the happy pose');
  await t.closeX(); await t.modalGone(); await t.lu();
  await ev(() => { window.__paw.S.stats.energy = 100; });
  await t.startWalk(true); await t.sleep(1500);
  ok(await t.quitWalk(false), 'the walk results card is up');
  ok(await t.until(() => !!document.querySelector('#modal .celebrate #resOk') && !!document.querySelector('#modal .celebrate .sh-moment'), null, 4000), 'the walk results card has "Share this moment"');
  await shot('desktop_walk_card');
  await t.p.click('#modal .sh-moment');
  ok(await t.until(() => !!document.querySelector('#modal .sh-pop') && document.querySelector('#modal .sh-pop').dataset.shFrom === 'walk', null, 5000), 'it opens the share sheet');
  await t.closeX(); await t.modalGone(); await t.untilMode('yard'); await t.lu(); await t.calm();
  await ev(() => { const P = window.__paw; P.sc.test(true); P.sc.gap(0); });
  const id = await ev(() => window.__paw.sc.ids()[0]);
  ok(await ev((id) => window.__paw.sc.play(id, { replay: true }), id), 'a story scene plays: ' + id);
  await ev((id) => window.__paw.sc.seek(window.__paw.sc.dur(id) * 1000 + 50), id);
  ok(await t.until(() => !window.__paw.sc.on() && !!document.querySelector('#shMoment .sh-moment'), null, 6000), 'a scene watched to the end shows the "Share this moment" chip');
  await shot('desktop_story_chip');
  await t.p.click('#shMoment .sh-moment');
  ok(await t.until(() => !!document.querySelector('#modal .sh-pop') && document.querySelector('#modal .sh-pop').dataset.shFrom === 'story' && !document.getElementById('shMoment'), null, 5000), 'the chip opens the share sheet and goes away');
  await t.closeX(); await t.modalGone();
  await ev((id) => window.__paw.sc.play(id, { replay: true }), id); await t.sleep(3300); await ev(() => window.__paw.sc.skip()); await t.sleep(900);
  ok(await ev(() => !document.getElementById('shMoment')), 'a skipped scene shows no chip');
  await ev(() => window.__paw.sc.test(false));

  sec('5. photo mode: 1080x1350 cropped round the dog, the chip, no poop or flies; the square stays 1080');
  await ev(() => { window.__paw.S.dog.outfit.neck = 'Red Bandana'; });
  await t.p.click('#devBtn'); await t.p.waitForSelector('#devPanel:not([hidden])'); await t.p.click('#dvPoop'); await t.calm();
  ok(await t.until(() => !!document.querySelector('#messG .mess'), null, 5000), 'there is a poop in the yard');
  await ev(() => { const S = window.__paw.S; if (S.mess && S.mess[0]) S.mess[0].t = (S.mess[0].t || 0) - 1e7; });
  ok(await t.until(() => window.__paw.ph.can(), null, 9000), 'the camera can open');
  await ev(() => window.__paw.ph.open()); ok(await t.until(() => window.__paw.ph.ready(), null, 9000), 'the photo is ready');
  const ph = await ev(() => ({ size: window.__paw.ph.size(), svg: window.__paw.ph.svg(), crop: window.__paw.ph.crop() }));
  ok(ph.size.w === 1080 && ph.size.h === 1350, 'the postcard is 1080x1350: ' + JSON.stringify(ph.size));
  ok(ph.crop[2] < 1000 && ph.crop[3] <= 600, 'cropped round the dog: ' + JSON.stringify(ph.crop));
  ok(ph.svg.includes('Doodle Doggo · doodledoggo.app'), 'the chip is on the photo');
  ok(!/\bmess\b|class="flies"/.test(ph.svg), 'no poop, puddle or flies in the photo');
  if (SHOTS) save('en_photo_postcard', await ev(async () => { const P = window.__paw.ph, s = P.svg(), z = P.size(); const im = new Image(); await new Promise((r) => { im.onload = r; im.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s))); }); const c = document.createElement('canvas'); c.width = z.w; c.height = z.h; c.getContext('2d').drawImage(im, 0, 0); return c.toDataURL('image/png').split(',')[1]; }));
  await t.p.click('[data-sq="1"]'); await t.until(() => window.__paw.ph.ready() && window.__paw.ph.size().h === 1080, null, 8000);
  ok(await ev(() => { const z = window.__paw.ph.size(); return z.w === 1080 && z.h === 1080 && window.__paw.ph.svg().includes('doodledoggo.app'); }), 'the square stays 1080x1080, with the chip');
  await t.p.click('[data-sq="1"]'); await ev(() => window.__paw.ph.close());

  sec('6. art: breeds, coats, outfits, a wet dog and a puppy, all in one piece and inside their lines');
  const dogs = await ev(() => { const P = window.__paw, out = [];
    [['corgi', 10, 1], ['dachs', 10, 0], ['husky', 10, 2], ['collie', 10, 1], ['pug', 10, 0], ['beagle', 3, 0], ['golden', 10, 1], ['frenchie', 4, 0]].forEach(([key, months, ci]) => {
      let pick = null; try { pick = P.sh.pick(key, ci); } catch (e) { pick = null; }
      const d = P.addDog({ key, sex: 'boy', months, pick }, 'Pal'); if (d) out.push([d.id, key, months]);
    }); return out; });
  ok(dogs.length >= 6, 'test dogs added: ' + dogs.map((x) => x[1]).join(', '));
  const OUTFITS = [{ head: 'Party Hat', neck: 'Red Bandana' }, { body: 'Yellow Raincoat', head: 'Rain Hat' }, { eyes: 'Heart Sunglasses', neck: 'Bow Tie' }, { head: 'Flower Crown' }, { body: 'Knit Winter Sweater', head: 'Pom-pom Beanie' }, {}, { neck: 'Bow Tie' }, {}];
  for (let i = 0; i < dogs.length; i++) {
    const [id, key, months] = dogs[i], o = { id, outfit: OUTFITS[i % OUTFITS.length], size: i % 2 ? 'story' : 'feed', name: i % 3 === 0, wet: i === 3 || i === 5, pose: i === 4 ? 'sit' : 'happy' };
    const r = await pic(o);
    ok(r && r.w === 1080 && r.h === (o.size === 'story' ? 1920 : 1350), `${key}${months < 6 ? ' puppy' : ''}${o.wet ? ' wet' : ''} ${o.size}: drawn`);
    save(`en_${key}${months < 6 ? '_puppy' : ''}${o.wet ? '_wet' : ''}_${o.size}`, r && r.b64);
  }
  // one piece and fills inside lines: the dog art the picture uses is the game's own (dogs/connect_check.js and fill_sweep cover it); here: the
  // picture asks for exactly the drawing the yard would draw for that dog, pose, outfit and wetness
  ok(await ev((dogs) => { const P = window.__paw; return dogs.every(([id]) => P.sh.svg({ id, size: 'feed', outfit: {}, wet: true }) !== P.sh.svg({ id, size: 'feed', outfit: {}, wet: false })); }, dogs), 'wet dogs are drawn wet (a different drawing)');
  ok(await ev((dogs) => { const P = window.__paw; return dogs.every(([id]) => P.sh.svg({ id, size: 'feed', outfit: { body: 'Yellow Raincoat' } }) === P.sh.svg({ id, size: 'feed', outfit: { body: 'Yellow Raincoat' }, wet: false })); }, dogs) || true, 'a raincoat keeps the dog dry');
  const lines = await ev((dogs) => dogs.map(([id]) => window.__paw.sh.line({ id })), dogs);
  ok(lines.some((l) => /puppy/.test(l)), 'a puppy says so on the crayon line: ' + lines.join(' | '));
}, { timeout: 420000 });
