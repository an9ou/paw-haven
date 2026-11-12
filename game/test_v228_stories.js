// v2.28 "Stories and stars" (V228.md, game/src/56_stories.js, game/css/58_stories.css): the save migration (old Bond 10+ saves get their stars
// once), the star math and the keepsakes (once), the neighbour stories (a step only by doing its request, paced, letters once), the postcard on
// the yard, the diary page and My Dog Card, and the phone fit at 360x640. Everything shown needs prefs.stTest under the harness.
// node game/run_tests.js v228_stories      (V228_SHOTS=<dir> also writes screenshots there)
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path'); const fs = require('fs');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const SHOTS = process.env.V228_SHOTS || null;
const BAD = /\b(sell|sells|selling|sold|price|stud|buy a dog|bought)\b/i;

run('v228_stories', async (t) => {
  const { ok, sec, ev } = t;
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(500); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const PR = { stTest: true, ddTest: true };
  const fresh = async (o) => {
    await t.boot(Object.assign({ prefs: PR }, o || {})); await t.adopt({ sex: 'girl' });
    await t.until(() => !!(window.__paw && window.__paw.st && window.__paw.dd), null, 5000);
    await ev(() => { const c = document.querySelector('#gdLayer .gd-skip'); if (c) c.click(); }); await t.calm();
  };
  const st = () => ev(() => JSON.parse(JSON.stringify(window.__paw.S.st)));
  // a local ISO date n days back, as the game writes it (localISO)
  const ago = (n) => ev((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }, n);
  const setBack = async (id, n) => { const iso = await ago(n); await ev(([id, iso]) => { const S = window.__paw.S, r = S.st.s[id]; if (r.dn) r.dn = iso; S.st.lt = ''; }, [id, iso]); };

  sec('1. the save: an old save loads with S.st, v stays 1, an old Bond 10+ dog gets its stars once (quietly), its keepsake on the first tick');
  await t.boot({ prefs: PR }); await t.adopt({ sex: 'girl' });
  await t.until(() => !!(window.__paw && window.__paw.st), null, 5000);
  const oldJson = await ev(() => { const P = window.__paw; P.S.dogs[0].bond = { level: 10, pts: 3200 + 5000 * 7 + 120 }; P.saveNow(); const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.st; delete s.decor['Framed Paw Print']; return JSON.stringify(s); });
  await t.ctx.close(); await t.mk({ prefs: PR, storage: { pawhaven_proto_v1: oldJson } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
  let s = await t.S();
  ok(s.v === 1 && s.st && s.st.stars && s.st.stars[s.dogs[0].id] === 7 && s.st.s.plum && s.st.s.plum.n === 0 && s.st.lt === '' && s.st.pc === 0, 'migrate() adds S.st, v stays 1, the old Bond 10 dog has its 7 stars: ' + JSON.stringify(s.st && s.st.stars));
  ok(await t.until(() => !!(window.__paw.S.st.ks[5] && window.__paw.S.decor['Framed Paw Print'] && window.__paw.S.decor['Framed Paw Print'].out), null, 9000), 'the 5-star keepsake comes on the first tick: the Framed Paw Print is out in the house');
  { const at = await ev(() => { const r = window.__paw.S.decor['Framed Paw Print']; return r && r.at; }), win = [340, 147, 236, 114], ov = at && Math.max(0, Math.min(at[0] + 68, win[0] + win[2]) - Math.max(at[0], win[0])) * Math.max(0, Math.min(at[1] + 79, win[1] + win[3]) - Math.max(at[1], win[1]));
    ok(Array.isArray(at) && ov === 0 && at[1] >= 150 && at[1] + 79 <= 384, 'it hangs on a bare bit of wall, clear of the living-room window (art 7): ' + JSON.stringify(at)); }
  s = await t.S();
  ok(!s.st.ks[10] && !s.inv.clothes.includes('Star Collar'), 'no 10-star keepsake at 7 stars');
  await t.sleep(1200); const tl = await t.toasts();
  ok(!tl.some((x) => /earned a Bond star/.test(x)), 'no star toasts for the stars an old save already had: ' + JSON.stringify(tl));
  ok(await ev(() => { const P = window.__paw, x = P.st.fields({ v: 1, dogs: [{ id: 'a', bond: { level: 10, pts: 13300 } }], st: { stars: { a: 9 }, ks: [], s: { plum: { n: 9, d: 'x', at: 3 } }, lt: 5, pc: -2 } }).st; return x.stars.a === 9 && !Array.isArray(x.ks) && x.s.plum.n === 5 && x.s.plum.d === 0 && x.s.plum.at === '' && x.s.rosa.n === 0 && x.lt === '' && x.pc === 0; }), 'junk in S.st is mended and a kept star count is never lowered (9 kept over 2 computed)');
  ok(await ev(() => { const x = window.__paw.st.fields({ v: 1, dogs: [], st: [1, 2] }).st; return !Array.isArray(x) && typeof x === 'object' && typeof x.stars === 'object' && typeof x.s === 'object'; }), 'an array S.st (a corrupt save) is rebuilt as an object, so it keeps its keys (code review 9)');
  await t.ctx.close();

  sec('2. the star math and the keepsakes, once');
  await fresh();
  ok(await ev(() => { const c = window.__paw.st.count; return c({ bond: { level: 9, pts: 9000 } }) === 0 && c({ bond: { level: 10, pts: 3200 } }) === 0 && c({ bond: { level: 10, pts: 8199 } }) === 0 && c({ bond: { level: 10, pts: 8200 } }) === 1 && c({ bond: { level: 10, pts: 53200 } }) === 10 && c({}) === 0; }), 'a star per 5,000 Bond points past the Bond 10 line (3,200): 8,200 = 1, 53,200 = 10, below Bond 10 = 0');
  await ev(() => { const S = window.__paw.S; S.bond.level = 10; S.bond.pts = 3200 + 5000 * 10 + 5; window.__toasts.splice(0); window.__paw.st.tick(false); });
  s = await t.S();
  ok(s.st.stars[s.dog.id] === 10 && s.st.ks[5] && s.st.ks[10] && s.inv.clothes.filter((n) => n === 'Star Collar').length === 1 && s.decor['Framed Paw Print'], 'ten stars: both keepsakes, the Star Collar in the wardrobe once');
  ok(await t.waitToast(/earned a Bond star! 10 stars now/, 3000) && await t.waitToast(/10 Bond stars! The Star Collar is in the Wardrobe/, 4000), 'one toast for the new star, one for the collar');
  await ev(() => { const P = window.__paw; P.st.tick(false); P.st.tick(false); P.S.bond.pts = 3300; P.st.tick(false); });
  s = await t.S();
  ok(s.inv.clothes.filter((n) => n === 'Star Collar').length === 1 && s.st.stars[s.dog.id] === 10 && await ev(() => window.__paw.st.stars() === 10), 'the keepsakes are given once, and a star is never taken away (fewer points still show 10)');
  await ev(() => { window.__paw.S.bond.pts = 3200 + 5000 * 10 + 5; });
  ok(await ev(() => { const P = window.__paw, A = window.PawArt, d = P.S.dog; const a = A.dog(d.key, { outfit: { neck: 'Star Collar' } }), b = A.dog(d.key, {}); const i = A.item('Star Collar'), f = A.prop('stpawframe'); return typeof a === 'string' && a !== b && /<svg/.test(i) && /<svg/.test(f) && /#4F8FD6/i.test(a); }), 'the art: the dog wears the blue Star Collar, the wardrobe icon and the paw print frame draw');
  await ev(() => window.__paw.dd.track()); await t.until(() => !!document.querySelector('#modal .st-track'), null, 3000);
  ok(await ev(() => /Bond stars/.test(document.querySelector('#modal .st-track').textContent) && /Next star in/.test(document.querySelector('#modal .st-track').textContent) && document.querySelectorAll('#modal .st-trks li.got').length === 2), 'the Bond track shows the stars, the next star and both keepsakes as got');
  await ev(() => { const b = document.querySelector('#modal .panel-body'); if (b) b.scrollTop = b.scrollHeight; }); await shot('bond_track_stars_desktop'); await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.dd.journal('profile')); await t.until(() => !!document.querySelector('#modal .profile'), null, 3000);
  ok(await ev(() => { const b = document.querySelector('#modal .pf-head .st-badge'); return !!b && /10/.test(b.textContent); }), 'the dog card (journal profile) has the star badge');
  await t.closeX(); await t.modalGone();
  ok(await ev(() => !!(window.__paw.S.decor['Framed Paw Print'] && window.__paw.S.decor['Framed Paw Print'].out)), 'the Framed Paw Print stays out in the house');
  await t.ctx.close();

  sec('3. neighbour stories: a step only by doing its request, paced, letters once');
  await fresh();
  await ev(() => window.__paw.st.hold(true)); // the test sends the letters itself (no tick in between)
  const L = (f) => ev((f) => window.__paw.st.letters(f), f);
  ok((await L(true)) === null && (await st()).s.plum.n === 0, 'Bond 1: no story yet');
  await ev(() => { const S = window.__paw.S; S.bond.level = 3; S.bond.pts = 200; });
  ok((await L(false)) === 'plum:0', 'Bond 3: the first letter, from Mrs. Plum');
  const mailN = (id) => ev((id) => window.__paw.S.mail.filter((m) => m.id === id).length, id);
  ok((await mailN('st_plum_0')) === 1 && await ev(() => { const m = window.__paw.S.mail.find((x) => x.id === 'st_plum_0'); return /knit a sweater/.test(m.text) && /Request: Take .+ for a walk/.test(m.ps); }), 'the letter is in the mailbox once, with its request in the P.S.');
  ok((await L(false)) === null && (await L(true)) === null && (await mailN('st_plum_0')) === 1, 'no second letter the same day, none while the request is open, the letter never twice');
  await ev(() => { const P = window.__paw; P.st.act({ kind: 'travel', place: 'market' }); P.st.act({ kind: 'bath' }); P.st.act({ kind: 'photo' }); });
  ok((await st()).s.plum.d === 0, 'other acts do not do the walk request');
  await ev(() => window.__paw.st.act({ kind: 'walk', area: 'park' }));
  s = await t.S();
  ok(s.st.s.plum.d === 1 && s.st.s.plum.dn && (await L(true)) === null, 'a walk does it, and the next letter waits: at least ' + 3 + ' days');
  await setBack('plum', 2); ok((await L(false)) === null, 'two days later: still waiting (no hurry, nothing lost)');
  await setBack('plum', 3); ok((await L(false)) === 'plum:1' && (await mailN('st_plum_1')) === 1, 'three days later: the second letter (Market Street)');
  // the real act bus: a trip to Market Street
  await t.travel('market');
  s = await t.S(); ok(s.st.s.plum.d === 2, 'the real trip to Market Street does the request (the act bus)');
  await t.home(); await setBack('plum', 3);
  ok((await L(false)) === 'plum:2', 'three days later: Mrs. Plum again (the parcel for the café), first in the story order');
  ok((await L(false)) === null, 'and then no more letters today (one story letter a day)');
  await ev(() => { window.__paw.S.st.lt = ''; }); ok((await L(false)) === 'rosa:0', 'the next day: Mrs. Plum has two done, so Rosa starts');
  ok(await ev(() => /Take the parcel to/.test(window.__paw.st.reqText(window.__paw.st.open('plum')))), 'the parcel request reads as a delivery');
  ok(await ev(() => { const h = window.__paw.st.week(); return /Neighbour stories/.test(h) && /parcel/.test(h) && /café/i.test(h); }), 'the open story requests show as notes on the help-wanted board');
  ok(await ev(() => !window.__paw.msw || /st-wk/.test(window.__paw.msw.html() || 'st-wk')), "they sit in the Week tab under Gerald's five notes");
  await ev(() => { const P = window.__paw; P.st.act({ kind: 'travel', place: 'cafe' }); }); // plum 3/5 and rosa 1/5 (both want the café)
  s = await t.S(); ok(s.st.s.plum.d === 3 && s.st.s.rosa.d === 1, 'one trip to the café does both stories that asked for it');
  for (const [k, a] of [[3, { kind: 'bath' }], [4, { kind: 'photo', place: 'park' }]]) {
    await setBack('plum', 3); // Mrs. Plum comes first in the story order, Rosa's next letter waits for her own three days
    ok((await L(false)) === 'plum:' + k, 'Mrs. Plum letter ' + (k + 1));
    if (a.kind === 'photo') await ev(() => { window.__paw.S.place = 'park'; });
    await ev((a) => window.__paw.st.act(a), a);
    if (a.kind === 'photo') await ev(() => { window.__paw.S.place = 'yard'; });
  }
  s = await t.S();
  ok(s.st.s.plum.d === 5 && s.st.s.plum.ks && s.dd.fr.includes('k_plum') && !s.st.s.plum.fin, 'the fifth request done: the keepsake frame, the story page, the closing letter not yet');
  ok(await t.waitToast(/A story is finished: The sweater project/, 3000), 'a toast names the story and the keepsake');
  ok(await ev(() => window.__paw.dd.frames().some((f) => f.k === 'ddk_plum' && /wool frame/.test(f.n))), 'the keepsake is a photo mode frame with its own name');
  await ev(() => { window.__paw.S.st.lt = ''; }); ok((await L(false)) !== 'plum:end', 'the closing letter waits for a later day');
  await setBack('plum', 1); ok((await L(false)) === 'plum:end' && (await mailN('st_plum_5')) === 1, 'a day later: the closing letter, once');
  await ev(() => { window.__paw.S.st.lt = ''; }); const again = await L(false); ok(again !== 'plum:end' && (await mailN('st_plum_5')) === 1, 'never twice (' + again + ')');
  const mtext = await ev(() => window.__paw.S.mail.filter((m) => /^st_/.test(m.id)).map((m) => m.title + ' ' + m.text + ' ' + (m.ps || '')).join(' | '));
  ok(!BAD.test(mtext) && !/;/.test(mtext), 'kind words: no selling or buying words, no semicolons in the letters');
  ok(await ev(() => { const P = window.__paw; return ['plum', 'rosa', 'post', 'pip'].every((id) => [0, 1, 2, 3, 4].every((i) => !!P.st.req(id, i))); }), 'four stories of five steps each');
  // the pip gate: the veggie patch
  ok(await ev(() => { const P = window.__paw, S = P.S; S.st.s.post.d = 2; S.st.s.post.n = 2; return typeof P.st.letters === 'function'; }), 'the mail carrier has two done');
  await ev(() => window.__paw.dd.journal('stories')); await t.until(() => !!document.querySelector('#modal .st-j'), null, 3000);
  ok(await ev(() => { const c = document.querySelectorAll('#modal .st-card'); const f = document.querySelector('#modal .st-card.fin'); return c.length >= 2 && !!f && !!f.querySelector('.st-ks svg') && f.querySelectorAll('.st-dots i.on').length === 5 && f.querySelectorAll('.st-lets li').length === 6; }), "the journal's Stories tab: a card per started story, the finished page with its keepsake and all six letters");
  await shot('journal_stories_desktop'); await t.closeX(); await t.modalGone();
  await t.ctx.close();

  sec('4. the postcard: the yard, the diary page, My Dog Card (no typed text leaves the device)');
  await fresh();
  await ev(() => { const S = window.__paw.S; S.dog.name = 'Zorbleflip'; window.__paw.st.pcForce('none'); });
  ok(await t.until(() => { const b = document.getElementById('stPcBtn'); return !!b && !b.hidden && b.getBoundingClientRect().width > 20; }, null, 4000), 'the yard has a postcard button in the top bar');
  ok(await ev(() => { const v = window.__paw.st.pcSVG('yard'); return /Greetings from our yard/.test(v) && !/Zorbleflip/.test(v) && /doodledoggo\.app/.test(v); }), 'the postcard has game words only: never the typed dog name');
  await t.p.click('#stPcBtn');
  ok(await t.until(() => !!document.querySelector('#modal .st-pcpop'), null, 3000), 'the yard button opens the postcard sheet');
  ok(await t.until(() => { const i = document.querySelector('#modal .st-pcimg'); return !!i && i.complete && i.naturalWidth === 1080 && i.naturalHeight === 1920; }, null, 15000), 'the postcard is drawn: a 1080x1920 PNG');
  await shot('postcard_yard_desktop');
  const dl = t.p.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await t.p.click('#stPcGo'); const got = await dl;
  ok(!!got && /doodle-doggo-postcard\.png/.test(got.suggestedFilename()) && (await st()).pc === 1, 'Share (no share sheet here): the PNG downloads, the count goes up');
  await t.closeX(); await t.modalGone();
  await t.pet((p0) => window.__paw.S.bond.pts > p0, (await t.S()).bond.pts); await t.sleep(300);
  await ev(() => window.__paw.dd.journal('diary')); await t.until(() => !!document.querySelector('#modal .dd-page'), null, 3000);
  ok(await ev(() => !!document.querySelector('#modal [data-stpc="diary"]')), 'the diary page has a postcard button');
  await t.p.click('#modal [data-stpc="diary"]');
  ok(await t.until(() => { const p = document.querySelector('#modal .st-pcpop'); return !!p && p.dataset.stSrc === 'diary' && !!p.querySelector('#stPcBack'); }, null, 3000), 'the diary button opens the postcard sheet, with Back');
  ok(await t.until(() => { const i = document.querySelector('#modal .st-pcimg'); return !!i && i.naturalWidth === 1080; }, null, 15000), 'the diary postcard draws');
  await t.p.click('#stPcBack'); ok(await t.until(() => !!document.querySelector('#modal .dd-page'), null, 3000), 'Back returns to the diary page');
  await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.dc.settings(true)); await t.until(() => !!document.querySelector('#modal [data-stpc="card"]'), null, 3000);
  ok(await ev(() => !!document.querySelector('#modal [data-stpc="card"]')), 'My Dog Card has a postcard button');
  await t.p.click('#modal [data-stpc="card"]');
  ok(await t.until(() => { const p = document.querySelector('#modal .st-pcpop'); return !!p && p.dataset.stSrc === 'card'; }, null, 3000), 'the Dog Card button opens the postcard sheet');
  ok(await t.until(() => { const i = document.querySelector('#modal .st-pcimg'); return !!i && i.naturalWidth === 1080; }, null, 15000), 'the Dog Card postcard draws');
  ok(await ev(() => /Meet my Dog Card/.test(window.__paw.st.pcSVG('card')) && !/Zorbleflip/.test(window.__paw.st.pcSVG('card'))), 'the Dog Card postcard: its headline, no typed name');
  await t.closeX(); await t.modalGone();
  ok(t.errors.length === 0, 'no page errors: ' + t.errors.slice(0, 3).join(' | '));
  await t.ctx.close();

  sec('5. phone 360x640: the "..." menu postcard, the sheet fits, the Stories tab fits');
  await fresh({ device: 'Phone 360x640' });
  ok(await ev(() => document.documentElement.dataset.layout === 'phone' && getComputedStyle(document.getElementById('stPcBtn')).display === 'none'), 'phones: no top bar postcard icon');
  await t.p.click('#moreBtn'); await t.until(() => !!document.querySelector('#modal #mmPc'), null, 3000);
  ok(await ev(() => { const b = document.querySelector('#modal #mmPc'); return !!b && b.getBoundingClientRect().height >= 44; }), 'the "..." menu has "Send a postcard", a 44 px row');
  await t.p.click('#modal #mmPc');
  ok(await t.until(() => { const i = document.querySelector('#modal .st-pcimg'); return !!i && i.naturalWidth === 1080; }, null, 15000), 'the phone postcard sheet opens and draws');
  const fit = await ev(() => { const p = document.querySelector('#modal .panel').getBoundingClientRect(), pr = document.querySelector('#modal .st-pcprev').getBoundingClientRect(), g = document.getElementById('stPcGo').getBoundingClientRect(); return { inX: p.left >= -1 && p.right <= 361, prev: pr.top >= 0 && pr.bottom <= 641 && pr.width > 100, go: g.bottom <= 641 && g.height >= 44, noScroll: document.documentElement.scrollWidth <= 361 }; });
  ok(Object.values(fit).every(Boolean), '360 x 640: the sheet, the preview and a 44 px Share button fit, no sideways scroll ' + JSON.stringify(fit));
  await shot('postcard_phone_360');
  await t.closeX(); await t.modalGone();
  await ev(() => { const S = window.__paw.S; S.bond.level = 3; S.bond.pts = 200; window.__paw.st.letters(true); });
  await ev(() => window.__paw.dd.journal('stories')); await t.until(() => !!document.querySelector('#modal .st-card'), null, 3000);
  ok(await ev(() => { const c = document.querySelector('#modal .st-card').getBoundingClientRect(); return c.left >= 0 && c.right <= 361 && document.documentElement.scrollWidth <= 361; }), '360 x 640: a story card fits the width');
  await shot('journal_stories_phone_360');
  await t.closeX(); await t.modalGone();
  await t.ctx.close();
}, { timeout: 600000 });
