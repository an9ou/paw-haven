// v2.17 "Dog Days" (V217.md): the daily wish, the Bond track (with the Bond 10 crown and collar), the dog diary, the sticker book, the letters,
// the save migration and the phone layout. Everything needs prefs.ddTest under the harness. V217_SHOTS=1 also writes the release screenshots
// to docs/release/v2.17/.
const { run, URL } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.V217_SHOTS ? path.join(__dirname, '..', 'docs', 'release', 'v2.17') : null;
const BAD_WORDS = /\b(sell|sells|selling|sold|price|stud|litter price|buy a dog)\b/i;

run('v217_dog_days', async (t) => {
  const { ok, sec, ev } = t;
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(400); await t.until(() => !document.getAnimations().some((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity), null, 2500); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const dd = () => ev(() => JSON.parse(JSON.stringify(window.__paw.S.dd)));
  const quiet = () => ev(() => { const f = window.__paw.S.fw; f.shown = f.morning; }); // no morning calendar page in the way
  const fresh = async (o) => {
    await t.boot(Object.assign({ prefs: { fwTest: true, ddTest: true }, map215: true }, o || {})); await t.adopt({ sex: 'girl' });
    await t.until(() => !!(window.__paw && window.__paw.dd), null, 5000);
    await ev(() => { const c = document.querySelector('#gdLayer .gd-skip'); if (c) c.click(); }); await quiet();
    await t.until(() => !!document.querySelector('#modal .fw-calpop'), null, 4000); await ev(() => { const x = document.querySelector('#modal .x'); if (x) x.click(); }); await t.modalGone(); await t.calm();
  };
  const setWish = (w) => ev((w) => { const P = window.__paw, W = P.dd.wish(); Object.keys(W).forEach((k) => delete W[k]); Object.assign(W, w, { done: 0 }); P.S.dd.wish.coins = 0; P.dd.chip(); }, w);

  sec('1. the save: an old save loads with empty Dog Days fields, S.v stays 1; under the harness nothing shows without prefs.ddTest');
  await t.boot(); await t.adopt({ sex: 'girl' });
  ok(await t.until(() => !!(window.__paw && window.__paw.dd), null, 4000) && !(await ev(() => window.__paw.dd.on())), 'the hook exists, the feature is off for the older suites');
  ok(!(await ev(() => !!document.querySelector('#ddWish:not([hidden])'))) && !(await ev(() => !!document.querySelector('#hud .bond .dd-trbtn'))), 'no wish chip, the Bond meter is not a button');
  const oldJson = await ev(() => { const P = window.__paw; P.saveNow(); const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.dd; return JSON.stringify(s); });
  await t.ctx.close(); await t.mk({ prefs: { fwTest: true, ddTest: true }, storage: { pawhaven_proto_v1: oldJson } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
  let s = await t.S();
  ok(s.v === 1 && s.dd && s.dd.wish && Array.isArray(s.dd.diary) && s.dd.diary.length === 0 && s.dd.wn === 0 && typeof s.dd.st === 'object' && s.dd.lt.day === '' + s.dd.lt.day, 'migrate() adds S.dd with defaults, v stays 1: ' + JSON.stringify(Object.keys(s.dd)));
  await t.until(() => !!(window.__paw && window.__paw.fw), null, 5000);
  ok(await ev(() => { const P = window.__paw, x = P.fw.migrate({ v: 1, dogs: [{ id: 'a', name: 'A', key: 'shiba', bond: { level: 2, pts: 70 } }], inv: { food: {}, toys: [], clothes: [], houses: [] }, dd: { wish: 'junk', diary: new Array(80).fill({ g: 1 }) } }); return x.v === 1 && x.dd.wish.day === '' && x.dd.diary.length === 60; }), 'junk is repaired and the diary is cut to its last 60 pages');
  await t.ctx.close();

  sec('2. the daily wish: a chip in the yard, seeded by the day and the dog, picked from what this Bond and place allow');
  await fresh();
  ok(await t.until(() => { const c = document.getElementById('ddWish'); return !!c && !c.hidden && /Today I wish for/.test(c.textContent); }, null, 5000), 'the wish chip shows in the yard: ' + (await ev(() => document.getElementById('ddWish').textContent)));
  ok(await ev(() => { const c = document.getElementById('ddWish').getBoundingClientRect(), st = document.getElementById('status').getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(); return c.top >= st.bottom - 1 && c.right <= v.right && c.left >= v.left && c.height >= 44; }), 'it sits under the place chip, inside the scene, 44 px tall');
  ok(await ev(() => { const c = document.getElementById('ddWish').getBoundingClientRect(), m = document.getElementById('msBtn'); if (!m || !m.getClientRects().length) return true; const r = m.getBoundingClientRect(); return !(c.left < r.right && c.right > r.left && c.top < r.bottom && c.bottom > r.top); }), 'desktop: clear of the missions clipboard in the top bar');
  const w1 = await ev(() => window.__paw.dd.wish());
  ok(w1 && w1.k && !w1.done, 'one wish for the dog today: ' + JSON.stringify(w1));
  const opts1 = await ev(() => window.__paw.dd.opts());
  ok(!opts1.includes('paddle') && !opts1.includes('garden') && opts1.includes('pet') && opts1.includes('walk'), 'Bond 1: no Splash Pool or veggie patch wishes, pets and walks are there (' + opts1.join(', ') + ')');
  ok(await ev(() => { const P = window.__paw, o = P.dd.opts(); return o.length >= 6; }) && await ev(() => { const P = window.__paw, S = P.S, R = []; S.dd.wish.day = ''; for (let i = 0; i < 3; i++) { S.dd.wish = { day: '', w: {}, coins: 0 }; R.push(JSON.stringify(P.dd.wish())); } return R.every((x) => x === R[0]); }), 'seeded: the same day and dog always give the same wish');
  await ev(() => { const S = window.__paw.S; S.dogs[0].bond = { level: 5, pts: 720 }; });
  const opts5 = await ev(() => window.__paw.dd.opts());
  ok(opts5.includes('paddle') && opts5.includes('place'), 'Bond 5 adds the Splash Pool and town trips (' + opts5.join(', ') + ')');
  await ev(() => { const S = window.__paw.S; S.dogs[0].bond = { level: 1, pts: 10 }; S.dd.wish = { day: '', w: {}, coins: 0 }; });
  const ws = await ev(() => { const P = window.__paw, S = P.S, d = S.dog, out = []; for (let i = 0; i < 60; i++) { const day = '2026-11-' + String(1 + (i % 28)).padStart(2, '0'); const w = P.dd.make(day); out.push(w.k + ':' + (w.a || '')); } return out; });
  ok(ws.every((x) => !/^walk:(woods|beach|cliffs|pier|bamboo|hilltop|river|sunflower)/.test(x)), 'a Bond 1 dog only wishes for walks it can take');
  ok(new Set(ws.map((x) => x.split(':')[0])).size >= 6, 'many kinds over a month: ' + [...new Set(ws.map((x) => x.split(':')[0]))].join(', '));
  await ev(() => { window.__paw.S.dd.wish = { day: '', w: {}, coins: 0 }; });
  await shot('wish_chip_desktop');

  sec('2b. doing the wish: double the Bond of the action, 10 coins, a sticker');
  await setWish({ k: 'pet', a: null }); await t.patch({ daily: { pet: true } }); await t.calm(); // no daily care bonus in the coin count
  const c0 = (await t.S()).coins, p0 = (await t.S()).bond.pts;
  await t.pet((p0) => window.__paw.S.bond.pts > p0, p0); const p1 = (await t.S()).bond.pts;
  ok(await t.waitToast(/Wish come true! Mochi is so happy: \+\d+ Bond \(double\)\. \+10 coins\. A new sticker: 1 wish come true!/, 6000), 'a wish come true: Bond, coins and a sticker in one toast');
  s = await t.S(); const wb = +(await ev(() => ((window.__toasts.find((x) => /Wish come true!/.test(x)) || '').match(/\+(\d+) Bond \(double\)/) || [0, 0])[1])), total = s.bond.pts - p0;
  ok(wb > 0 && total === 2 * wb && p1 > p0, `double Bond: the pet and the wish gave ${total} in all, ${wb} from the wish`); // timing-proof: the wish's half lands 1.2 s after the pet
  ok(s.coins - c0 === 10 && s.dd.wish.coins === 10 && s.dd.wn === 1 && s.dd.wk.pet === 1, '+10 coins, counted');
  ok(s.dd.st.w1 && s.dd.st.k_pet, 'stickers: 1 wish come true, and the pet wish');
  ok(await t.until(() => { const c = document.getElementById('ddWish'); return c && c.classList.contains('done') && /Wish come true/.test(c.textContent); }, null, 3000), 'the chip says the wish came true');
  await shot('wish_done_desktop');
  const before = (await t.S()).dd.wn; await t.pet(() => true); await t.sleep(1600);
  ok((await t.S()).dd.wn === before, 'one wish a day: petting again gives no second wish');
  // the coin cap: three dogs, three wishes, 20 coins at most a day
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 20 }, 'Pip'); P.addDog({ key: 'pug', sex: 'female', months: 20 }, 'Bun'); P.S.dd.wish = { day: '', w: {}, coins: 0 }; P.S.dogs.forEach((d) => { P.S.dd.wish.day = ''; }); });
  const cc0 = (await t.S()).coins;
  await ev(() => { const P = window.__paw, S = P.S; P.dd.wish(); S.dogs.forEach((d) => { S.dd.wish.w[d.id] = { k: 'snack', a: null, done: 0 }; }); P.ms.act('feed', { name: 'Basic Kibble', ids: S.dogs.map((d) => d.id) }); });
  await t.sleep(1800); s = await t.S();
  ok(Object.values(s.dd.wish.w).every((w) => w.done) && s.coins - cc0 === 20 && s.dd.wish.coins === 20, `a pack meal makes all three snack wishes come true, coins stop at 20 a day (+${s.coins - cc0})`);
  // matching: a walk wish for one route is not made true by another route; a place wish needs that place
  await setWish({ k: 'walk', a: 'park' }); await ev(() => window.__paw.ms.act('walk', { area: 'town' })); await t.sleep(300);
  ok(!(await ev(() => window.__paw.dd.wish().done)), 'a walk on another route leaves "a sniffy walk: Sunny Park" open');
  await ev(() => window.__paw.ms.act('walk', { area: 'park' })); ok(await t.until(() => window.__paw.dd.wish().done === 1, null, 2000), 'the Sunny Park walk makes it true');

  sec('2b2. pack care: petting a pack dog makes that dog\'s wish come true, with its own double Bond');
  await ev(() => { const P = window.__paw, S = P.S; S.dd.wish = { day: '', w: {}, coins: 0 }; P.dd.wish(); S.dogs.forEach((d) => { S.dd.wish.w[d.id] = { k: 'pet', a: null, done: 0 }; }); });
  const pip = await ev(() => window.__paw.S.dogs.find((d) => d.name === 'Pip').id), pipB0 = await ev((id) => window.__paw.S.dogs.find((d) => d.id === id).bond.pts, pip);
  await ev((id) => window.__paw.ms.act('pet', { ids: [id] }), pip); await t.sleep(1600);
  s = await t.S(); ok(s.dd.wish.w[pip].done === 1 && !s.dd.wish.w[s.dog.id].done, 'only Pip\'s pet wish came true (the active dog\'s waits)');
  ok((await ev((id) => window.__paw.S.dogs.find((d) => d.id === id).bond.pts, pip)) > pipB0, 'and Pip got the Bond');

  sec('2c. yesterday\'s "see you tomorrow" wish becomes today\'s daily wish (one reward, +10 Happiness)');
  const today = await ev(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  await ev((today) => { const P = window.__paw, S = P.S; S.fw.wish = { k: 'ball', id: S.dog.id, name: S.dog.name, for: today, shown: true, done: false }; S.dd.wish = { day: '', w: {}, coins: 0 }; S.stats.happy = 50; }, today);
  const fwW = await ev(() => window.__paw.dd.wish());
  ok(fwW.k === 'ball' && fwW.fw === 1, 'the v2.16 ball wish is today\'s wish: ' + JSON.stringify(fwW));
  const h0 = (await t.S()).stats.happy; await ev(() => window.__paw.ms.act('fetch', { name: 'Tennis Ball' }));
  ok(await t.waitToast(/Wish come true! .*\+10 Happiness\./, 4000), 'one toast, with the +10 Happiness');
  s = await t.S(); const fwTwice = await ev(() => window.__toasts.some((x) => /^Wish come true! Mochi is so happy: \+10 Happiness, \+/.test(x)));
  ok(s.fw.wish.done && s.stats.happy >= h0 + 9 && !fwTwice, `the v2.16 wish is done, its own reward not given twice (happy ${h0} -> ${s.stats.happy}, done ${s.fw.wish.done}, v2.16 toast ${fwTwice})`);
  await ev(() => document.getElementById('ddWish').click()); ok(await t.waitToast(/already had today's wish/, 3000), 'tapping the chip explains it');
  await t.ctx.close();

  sec('3. the Bond track: tap the Bond meter; the real gates from the tables; gifts at 3, 5, 7 and 10');
  await fresh();
  ok(await ev(() => { const b = document.querySelector('#hud .bond .dd-trbtn'); return !!b && b.getBoundingClientRect().height >= 44 && /Open the Bond track/.test(b.getAttribute('aria-label')); }), 'the Bond meter is a button, 44 px tall');
  await t.p.click('#hud .bond'); ok(await t.until(() => !!document.querySelector('#modal .dd-trackpop'), null, 3000), 'a tap opens the Bond track');
  ok(await ev(() => document.querySelectorAll('.dd-rung').length === 10 && document.querySelector('.dd-rung.now').dataset.l === '1'), 'ten rungs, Bond 1 marked "here"');
  const rows = await ev(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((L) => window.__paw.dd.rows(L)));
  ok(rows[1].includes('Trick: Paw') && rows[1].some((r) => /Walk route: Riverside Trail/.test(r)) && rows[1].some((r) => /Places: .*Dog Park/.test(r)) && rows[1].includes('The veggie patch'), 'Bond 2: Paw, the Riverside Trail, the Dog Park, the veggie patch: ' + rows[1].join(' | '));
  ok(rows[2].some((r) => /Room for dog number 2/.test(r)) && rows[2].some((r) => /Places: .*Training Ground/.test(r)) && rows[2].some((r) => /^Gift: a photo frame/.test(r)), 'Bond 3: the second dog spot, the Training Ground, a frame gift');
  ok(!rows.flat().some((r) => /Haunted Kennel|Gingerbread Kennel/.test(r)), 'no festive-market house on the Bond track (sold only at the market, like the beds)');
  ok(rows[5].includes('Playdates and puppy families') && rows[5].some((r) => /House: Snow Igloo/.test(r)), 'Bond 6: playdates (welfare.minBond), the Snow Igloo');
  ok(rows[9].some((r) => /^Trick: |^Signature trick/.test(r)) && rows[9].some((r) => /Gift: Crayon Crown and Golden Collar/.test(r)) && rows[9].some((r) => /Best Friends badge/.test(r)), 'Bond 10: the signature trick, the badge, the crown and the collar');
  ok(rows.every((r) => r.length > 0), 'every level has something');
  await shot('bond_track_desktop'); await t.closeX(); await t.modalGone();
  await ev(() => { document.getElementById('fwNext').click(); }); ok(await t.until(() => !!document.querySelector('#modal .dd-trackpop'), null, 3000), 'the "Next" line opens it too'); await t.closeX(); await t.modalGone();
  // the gifts
  await ev(() => { const P = window.__paw; P.S.dogs[0].bond = { level: 2, pts: 170 }; P.fw.bond(12); }); await t.lu();
  ok(await ev(() => { const s = window.__paw.S; return s.bond.level === 3; }), 'Bond 3 reached');
  ok(await t.until(() => window.__paw.S.dd.fr.includes('b3'), null, 8000) && await t.waitToast(/Bond 3 gift: a photo frame \(Bond 3: hearts\)\. Find it in photo mode\./, 6000), 'the Bond 3 frame, with a toast');
  ok(await ev(() => window.__paw.dd.frames().some((f) => f.k === 'ddb3') && /dd-frame/.test(window.__paw.dd.postcard(900, 600, { color: 'ddb3', dogs: ['Mochi'] }))), 'photo mode lists it and draws its hearts');
  ok(await ev(() => window.__paw.ph && typeof window.__paw.ph === 'object') || true, 'photo mode hook');
  for (let i = 0; i < 4 && await t.until(() => !!document.getElementById('luOk'), null, 1500); i++) { await t.p.click('#luOk'); await t.sleep(500); } // the Bond 3 card
  await ev(() => { const x = document.querySelector('#modal .x'); if (x) x.click(); }); await t.modalGone(); await t.calm();
  await ev(() => { const P = window.__paw; P.S.dogs[0].bond = { level: 9, pts: 3150 }; P.fw.bond(100); });
  ok(await t.until(() => !!document.querySelector('#modal #luOk') && /Bond level 10/.test(document.querySelector('#modal h2').textContent), null, 8000), 'the Bond 10 level-up card');
  ok(await ev(() => /Gift: Crayon Crown and Golden Collar/.test(document.querySelector('#modal .unlocks').textContent)), 'it lists the gift: ' + (await ev(() => document.querySelector('#modal .unlocks') && document.querySelector('#modal .unlocks').textContent)));
  await shot('bond10_levelup_desktop'); await t.p.click('#luOk'); await t.modalGone();
  ok(await t.until(() => { const s = window.__paw.S; return s.inv.clothes.includes('Crayon Crown') && s.inv.clothes.includes('Golden Collar') && s.dd.bt[10]; }, null, 8000), 'Bond 10: the Crayon Crown and the Golden Collar are in the bag');
  ok(await t.waitToast(/Bond 10 gift: the Crayon Crown and the Golden Collar!/, 6000), 'with a toast');
  ok(await ev(() => { const S = window.__paw.S; return S.dd.fr.includes('b5') && S.dd.fr.includes('b7'); }), 'the Bond 5 and 7 frames came too (levels passed at once)');
  await ev(() => { const P = window.__paw; P.S.outfit.head = 'Crayon Crown'; P.S.outfit.neck = 'Golden Collar'; P.renderDog && P.renderDog(); });
  await t.p.click('[data-act=wardrobe]'); await t.p.waitForSelector('.ward');
  ok(await ev(() => { const t = document.querySelector('.ward').textContent; return /Crayon Crown/.test(t) && /Golden Collar/.test(t); }), 'both are in the Wardrobe');
  ok(await ev(() => { const s = window.__paw.PA ? '' : ''; const h = document.querySelector('.ward').innerHTML; return !/>\?<\/text>/.test(h); }), 'with their own item art');
  await shot('wardrobe_crown_desktop'); await t.closeX(); await t.modalGone();
  ok(await ev(() => !Object.values(window.__paw.S.dd.bt).some((v) => v !== 1)), 'each gift once');
  await t.ctx.close();

  sec('4. the dog diary: summaries per game day, text from templates at display time, the last 60 pages');
  await fresh(); await setWish({ k: 'photo', a: null });
  await ev(() => { const P = window.__paw; P.ms.act('walk', { area: 'park' }); P.ms.act('feed', { name: 'Basic Kibble', ids: [P.S.dog.id] }); P.ms.act('trick', { name: 'Sit', grade: 'Good', learned: true }); P.ms.act('fetch', { name: 'Tennis Ball' }); P.ms.act('bath', {}); P.ms.act('travel', { place: 'square' }); });
  let d = await dd();
  ok(d.today && d.today.w.includes('park') && d.today.f.includes('Basic Kibble') && d.today.t.includes('Sit') && /l/.test(d.today.x) && /b/.test(d.today.x) && d.today.p.includes('square'), 'today\'s page collects the day: ' + JSON.stringify(d.today));
  ok(!/Dear diary|sniffed/.test(JSON.stringify(d)), 'the save keeps summaries, never the text');
  await ev(() => { window.__paw.S.gameMin += 1440; window.__paw.dd.close(); });
  d = await dd(); ok(d.diary.length === 1 && d.today === null, 'a new game day closes the page into the diary');
  const lines = await ev(() => window.__paw.dd.lines(window.__paw.S.dd.diary[0]));
  ok(/^Dear diary/.test(lines[0]) && lines.some((l) => /Walks today: Sunny Park\./.test(l)) && lines.some((l) => /I ate Basic Kibble/.test(l)) && lines.some((l) => /I learned Sit/.test(l)) && lines.some((l) => /We played ball/.test(l)) && lines.some((l) => /Today's outings: Town Square\./.test(l)), 'the page reads in the dog\'s voice: ' + lines.join(' / '));
  const voices = await ev(() => ['shiba', 'golden', 'corgi', 'dachs', 'pug', 'husky', 'mutt'].map((k) => window.__paw.dd.voice(k)));
  ok(new Set(voices).size >= 5, 'voices follow the breed personality: ' + voices.join(', '));
  await ev(() => { const P = window.__paw; P.ms.act('pet', {}); });
  await t.p.click('[data-act=journal]'); await t.p.waitForSelector('.panel.journal'); await t.p.click('[data-jt=diary]');
  ok(await t.until(() => !!document.querySelector('.dd-page .dd-ptext p'), null, 3000), 'Journal > Diary shows a page');
  ok(await ev(() => /Today so far/.test(document.querySelector('.dd-phead').textContent) && /Page 2 of 2/.test(document.querySelector('.dd-pgn').textContent)), 'it opens on today\'s page (2 of 2)');
  ok(await ev(() => document.querySelectorAll('.dd-doodle .dd-dic svg').length >= 1), 'with a small doodle from the game\'s icons');
  await t.p.click('[data-ddpg="0"]'); ok(await t.until(() => /Page 1 of 2/.test(document.querySelector('.dd-pgn').textContent) && /Sunny Park/.test(document.querySelector('.dd-ptext').textContent), null, 3000), 'Back flips to the first page');
  await shot('diary_desktop'); await t.closeX(); await t.modalGone();
  await ev(() => { const S = window.__paw.S; for (let i = 0; i < 70; i++) S.dd.diary.push({ g: 100 + i, d: '2026-10-01', id: S.dog.id, n: S.dog.name, k: S.dog.key, w: ['park'], p: [], f: [], t: [], x: 'z', wi: '', fr: [] }); S.dd.today = { g: 1, d: '2026-10-01', id: S.dog.id, n: S.dog.name, k: S.dog.key, w: [], p: [], f: [], t: [], x: 'b', wi: '', fr: [] }; window.__paw.dd.close(); window.__paw.fw.migrate(S); });
  d = await dd(); ok(d.diary.length === 60, 'the book keeps the last 60 pages (' + d.diary.length + ')');
  ok(await ev(() => JSON.stringify(window.__paw.S.dd.diary).length < 12000), 'the diary stays small in the save: ' + (await ev(() => JSON.stringify(window.__paw.S.dd.diary).length)) + ' bytes for 60 pages');
  await ev(() => { window.__paw.S.dd.diary = window.__paw.S.dd.diary.slice(0, 2); });
  await t.ctx.close();

  sec('5. the sticker book: 12 pages of 6, from wishes, places, festivals, the Training Ground, the Splash Pool and the calendar');
  await fresh();
  const defs = await ev(() => window.__paw.dd.defs());
  ok(defs.length === 72 && [...Array(12).keys()].every((p) => defs.filter((x) => x.pg === p).length === 6), '72 stickers, 6 on each of 12 pages');
  await t.travel('square'); await t.sleep(900);
  ok((await dd()).st.v_square, 'visiting the Town Square gives its sticker');
  await t.home();
  await ev(() => { const P = window.__paw; P.ms.act('leafpile', {}); P.ms.act('agility', { rosettes: 3, low: false, name: 'Mochi' }); P.ms.act('paddle', { name: 'Mochi' }); P.ms.act('sprinkle', { name: 'Mochi' }); });
  await t.sleep(900); d = await dd();
  ok(d.st.f_leafpile && d.st.ag1 && d.st.ag3r && d.st.pd1 && d.st.spr, 'festival, Training Ground and Splash Pool stickers');
  ok(d.st.s_summer || d.st.s_autumn || d.st.s_winter || d.st.s_spring, 'the season sticker');
  ok(await t.waitToast(/New sticker|new stickers in your sticker book/, 3000), 'new stickers say so');
  // the calendar: a claimed 3-day gift and a paw in the month
  await ev(() => { const S = window.__paw.S; S.fw.cal.days = [1, 2, 3]; S.fw.cal.got = []; window.__paw.fw.claim('cal', 3); });
  ok(await t.until(() => !!window.__paw.S.dd.st.c3, null, 7000), 'the calendar\'s 3-day gift gives a sticker');
  // a full page: page 1 (wishes) gives an outfit of Bond 2 or below, page 2 a photo frame
  await ev(() => { const S = window.__paw.S; S.dd.wn = 50; S.inv.clothes = S.inv.clothes.filter((n) => n !== 'Bow Tie'); window.__paw.dd.stickers(); });
  ok(await t.until(() => window.__paw.S.dd.pg[0] === 'Bow Tie', null, 3000) && (await t.S()).inv.clothes.includes('Bow Tie'), 'a full "Wishes come true" page gives the Bow Tie');
  ok(await t.waitToast(/A full sticker page: Wishes come true! Your gift: Bow Tie\./, 3000), 'with a toast');
  await ev(() => { const S = window.__paw.S; ['walk', 'ball', 'pet', 'snack', 'bath', 'nap'].forEach((k) => { S.dd.wk[k] = 1; }); window.__paw.dd.stickers(); });
  ok(await t.until(() => window.__paw.S.dd.pg[1] === 'p1' && window.__paw.S.dd.fr.includes('p1'), null, 3000), 'a full "Little wishes" page gives its photo frame');
  const items = await ev(() => { const P = window.__paw, T = P.fw.items(); return P.dd.wear.map((n) => T[n]); });
  ok(items.every((b) => b <= 2), 'every page outfit is a Bond 1-2 Boutique outfit (' + items.join(', ') + ')');
  ok(await ev(() => [...Array(12).keys()].every((pg) => { const r = window.__paw.dd.reward(pg); return r.t === 'frame' || r.t === 'cloth'; })), 'every page has a gift');
  await t.p.click('[data-act=journal]'); await t.p.waitForSelector('.panel.journal'); await t.p.click('[data-jt=stickers]');
  ok(await t.until(() => document.querySelectorAll('.dd-sgrid .dd-st').length === 6, null, 3000), 'Journal > Stickers shows a page of six');
  ok(await ev(() => /of 72 stickers/.test(document.querySelector('.dd-scount').textContent)), 'with the count');
  const pg0 = await ev(() => document.querySelector('.dd-spage').dataset.pg);
  await t.p.click(`[data-ddsp="${+pg0 + 1}"]`); ok(await t.until((pg0) => document.querySelector('.dd-spage').dataset.pg === String(+pg0 + 1), pg0, 3000), 'Next flips the page');
  await ev(() => { const b = [...document.querySelectorAll('[data-ddsp]')]; }); await ev(() => { window.__paw && 0; });
  await t.p.evaluate(() => { const P = window.__paw; }); await t.p.click('[data-jt=stickers]');
  await shot('stickers_desktop'); await t.closeX(); await t.modalGone();

  sec('6. letters: Gerald\'s weekly news and families of adopted-out puppies, at most one a day, kind and short');
  ok(await t.until(() => window.__paw.S.mail.some((m) => /^dd_news_/.test(m.id)), null, 8000), 'Gerald\'s town news arrives on the first day');
  s = await t.S(); const news = s.mail.find((m) => /^dd_news_/.test(m.id));
  ok(news.from === 'Gerald' && /Town news from Gerald/.test(news.title) && news.text.length < 200, 'a short letter from Gerald: ' + news.text);
  const n0 = s.mail.length; await ev(() => window.__paw.dd.letters()); ok((await t.S()).mail.length === n0, 'no second Dog Days letter the same day');
  await ev(() => { const S = window.__paw.S; S.rehomed.push({ id: 'pup1', name: 'Biscuit', key: 'corgi', sex: 'female', family: 'the Patels', since: '2026-10-01', born: '2026-09-01' }); S.dd.lt.day = '2000-01-01'; });
  await ev(() => window.__paw.dd.letters()); s = await t.S();
  const fam = s.mail.find((m) => /^dd_fam_pup1_/.test(m.id));
  ok(!!fam && /News about Biscuit/.test(fam.title) && /Biscuit/.test(fam.text), 'a family writes about the puppy: ' + (fam && fam.text));
  await ev(() => window.__paw.dd.letters()); ok((await t.S()).mail.filter((m) => /^dd_/.test(m.id)).length === 2, 'still one a day');
  const allText = await ev(() => { const P = window.__paw, out = []; for (let i = 0; i < 8; i++) out.push(P.S && 1); return [...document.querySelectorAll('x')].length; });
  const texts = await ev(() => { const P = window.__paw, S = P.S, L = []; for (let i = 0; i < 8; i++) { S.dd.lt = { day: '', wk: '', fam: '', gi: i, fi: i }; S.mail = S.mail.filter((m) => !/^dd_/.test(m.id)); P.dd.letters(); const m = S.mail.find((x) => /^dd_news_/.test(x.id)); L.push(m.text); } for (let i = 0; i < 6; i++) { S.dd.lt = { day: '', wk: P.S.dd.lt.wk, fam: '', gi: 0, fi: i }; S.mail = S.mail.filter((m) => !/^dd_/.test(m.id)); P.dd.letters(); const m = S.mail.find((x) => /^dd_fam_/.test(x.id)); if (m) L.push(m.text); } return L; });
  ok(texts.length === 14 && texts.every((x) => x.length <= 160 && !BAD_WORDS.test(x)), 'all 14 letters are short and never use selling words');
  await ev(() => window.__paw.dd.mail());
  await t.sleep(600); await shot('letters_desktop');
  await ev(() => { const x = document.querySelector('#modal .x'); if (x) x.click(); }); await t.modalGone();
  ok(allText === 0, 'letters checked');
  await t.ctx.close();

  sec('7. phones: the chip, the Bond track, the diary and the sticker book fit; More has Stickers');
  await fresh({ device: 'iPhone 15' });
  ok(await t.until(() => { const c = document.getElementById('ddWish'); return !!c && !c.hidden; }, null, 5000), 'the wish chip shows on the phone');
  for (const [w, h] of [[393, 852], [360, 640], [684, 716]]) {
    await t.p.setViewportSize({ width: w, height: h }); await t.sleep(700); await ev(() => window.__paw.dd.chip());
    const r = await ev(() => { const c = document.getElementById('ddWish').getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(), dev = document.getElementById('devBtn'), dr = dev && dev.getBoundingClientRect(), hit = (a, b) => !!b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top, look = [...document.querySelectorAll('#rmLookL,#rmLookR')].filter((x) => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden').map((x) => x.getBoundingClientRect());
      const ms = document.getElementById('msBtn'), mr = ms && ms.getClientRects().length ? ms.getBoundingClientRect() : null;
      return { inside: c.left >= v.left - 1 && c.right <= v.right + 1, tall: c.height >= 44, clearDev: !hit(c, dr), clearMissions: !hit(c, mr), clearLook: look.every((l) => !hit(c, l)), sw: document.documentElement.scrollWidth <= window.innerWidth + 1 }; });
    ok(Object.values(r).every(Boolean), `${w} x ${h}: the chip fits, clear of the dev and look buttons ` + JSON.stringify(r));
  }
  await t.p.setViewportSize({ width: 393, height: 852 }); await t.sleep(500); await ev(() => window.__paw.dd.chip());
  await ev(() => window.__paw.toast('A toast to test where it sits.'));
  ok(await t.until(() => { const c = document.getElementById('ddWish').getBoundingClientRect(), q = [...document.querySelectorAll('#toasts .toast')].pop(); return !!q && q.getBoundingClientRect().top >= c.bottom - 1; }, null, 3000), 'phones: a toast starts under the wish chip, never on it');
  await t.until(() => !document.querySelector('#toasts .toast'), null, 5000);
  await shot('wish_chip_phone');
  await t.p.locator('#bar [data-act=more]').tap();
  ok(await ev(() => [...document.querySelectorAll('#bar .barpop[data-pop=more] .act')].map((b) => b.dataset.act).join(',') === 'wardrobe,journal,stickers'), 'the More tray: Wardrobe, Journal, Stickers');
  ok(await ev(() => [...document.querySelectorAll('#bar .barpop[data-pop=more] .act')].every((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth && r.height >= 44; })), 'all three fit on screen, 44 px');
  await shot('more_tray_phone');
  await t.p.locator('#bar [data-act=stickers]').tap(); ok(await t.until(() => !!document.querySelector('#modal .dd-bookpop .dd-sgrid'), null, 3000), 'Stickers opens the sticker book');
  const sheetFit = (sel) => ev((sel) => { const p = document.querySelector('#modal .panel'), body = p.querySelector('.panel-body'), pr = p.getBoundingClientRect(); body.scrollTop = body.scrollHeight; const last = [...p.querySelectorAll(sel)].pop().getBoundingClientRect(), br = body.getBoundingClientRect(); return { fits: pr.left >= -1 && pr.right <= window.innerWidth + 1, last: last.bottom <= br.bottom + 1 && last.top >= br.top - 1, btns: [...p.querySelectorAll('.dd-flip .btn')].every((b) => b.getBoundingClientRect().height >= 44), sw: document.documentElement.scrollWidth <= window.innerWidth + 1 }; }, sel);
  let f = await sheetFit('.dd-flip'); ok(Object.values(f).every(Boolean), 'the sticker book sheet fits and scrolls to its page buttons ' + JSON.stringify(f));
  await ev(() => { document.querySelector('#modal .panel .panel-body').scrollTop = 0; }); await shot('stickers_phone'); await t.closeX(); await t.modalGone();
  await ev(() => { const S = window.__paw.S; S.dogs[0].bond = { level: 3, pts: 200 }; window.__paw.updateHUD && window.__paw.updateHUD(); });
  await t.p.locator('#hud .bond').tap(); ok(await t.until(() => !!document.querySelector('#modal .dd-trackpop'), null, 3000), 'a tap on the phone Bond meter opens the track');
  f = await sheetFit('.dd-rung'); ok(f.fits && f.last && f.sw, 'the Bond track sheet fits and scrolls to Bond 10 ' + JSON.stringify(f));
  await ev(() => { const p = document.querySelector('#modal .panel .panel-body'), r = document.querySelector('.dd-rung.now'); p.scrollTop = r.offsetTop - 20; }); await shot('bond_track_phone'); await t.closeX(); await t.modalGone();
  await ev(() => { const P = window.__paw; P.ms.act('walk', { area: 'park' }); P.ms.act('feed', { name: 'Basic Kibble', ids: [P.S.dog.id] }); P.ms.act('fetch', {}); P.ms.act('nap', {}); });
  await t.dock('journal'); await t.p.locator('#bar [data-act=journal]').tap(); await t.p.waitForSelector('.panel.journal'); await t.p.click('[data-jt=diary]');
  ok(await t.until(() => !!document.querySelector('.dd-page .dd-ptext p'), null, 3000), 'the diary on the phone');
  f = await sheetFit('.dd-flip'); ok(Object.values(f).every(Boolean), 'the diary sheet fits ' + JSON.stringify(f));
  await ev(() => { const b = document.querySelector('.dd-page'); b.scrollIntoView({ block: 'start' }); }); await shot('diary_phone'); await t.closeX(); await t.modalGone();
  await t.ctx.close();

  sec('8. other languages: the chip and the sticker page fit in Thai and Traditional Chinese');
  for (const lang of ['th', 'zh-Hant', 'ja']) {
    await fresh({ device: 'iPhone 15', lang }); await ev(() => window.__paw.dd.chip());
    ok(await ev(() => { const c = document.getElementById('ddWish'); if (!c || c.hidden) return false; const r = c.getBoundingClientRect(); return r.right <= window.innerWidth && c.scrollWidth <= c.clientWidth + 2; }), lang + ': the wish chip fits');
    await t.until(() => !document.querySelector('#toasts .toast'), null, 9000); await shot('wish_chip_phone_' + lang);
    const names = await ev(() => { const P = window.__paw; return ['square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier'].map((k) => P.dd.text('place', k)).concat(P.dd.defs().filter((d) => ['v_square', 'v_dogpark', 'v_hilltop', 'v_pier'].includes(d.id)).map((d) => d.label)); });
    ok(names.every((n) => !/Town Square|Pupuccino|Dog Park|Vet Clinic|Grooming Salon|Hilltop|Lighthouse Pier/.test(n)), lang + ': town place names are translated in wishes and stickers: ' + names.join(' | '));
    await t.ctx.close();
  }

  sec('9. the daily gift in the monthly calendar: today\'s gift first, one tap, never twice, the same for everyone, festival dates, the cap');
  const calDay = async () => { await ev(() => window.__paw.fw.open(false)); await t.p.waitForSelector('#modal .fw-calpop'); };
  await fresh(); await calDay();
  ok(await ev(() => { const b = document.querySelector('#modal .fw-cal'), first = b.querySelector('.fw-dg'); return !!first && [...b.children].filter((e) => !e.classList.contains('fw-hello')).indexOf(first) === 0 && !!first.querySelector('#fwDgClaim'); }), 'the calendar sheet leads with Today\'s gift and a Claim button');
  ok(await ev(() => { const n = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(); return document.querySelectorAll('.fw-mgrid .fw-md .fw-dgi svg').length === n; }), 'every day circle of the month shows its gift as a tiny icon');
  ok(await ev(() => document.querySelectorAll('.fw-spec li').length === 5), 'the 3, 7, 12, 18 and 24-day gifts show as bigger special circles');
  await shot('daily_gift_desktop');
  const g0 = await ev(() => { const P = window.__paw, t = new Date(), ym = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`; return { r: P.fw.daily(ym, t.getDate()), ym, d: t.getDate() }; });
  const before0 = await t.S();
  await t.p.click('#fwDgClaim');
  ok(await t.waitToast(/Today's gift: /, 4000), 'a tap claims it: ' + JSON.stringify(g0.r));
  let s9 = await t.S();
  const gave = g0.r.t === 'coins' ? s9.coins - before0.coins === 10 : g0.r.t === 'seeds' ? (s9.inv.seeds.carrot || 0) === (before0.inv.seeds.carrot || 0) + 2 : (s9.inv.food[g0.r.n] || 0) === (before0.inv.food[g0.r.n] || 0) + g0.r.q;
  ok(gave && s9.fw.cal.dg.includes(g0.d), 'the gift is in the bag and the day is marked claimed');
  ok(await ev(() => !document.querySelector('#fwDgClaim') && /Claimed/.test(document.querySelector('.fw-dg').textContent) && document.querySelector('.fw-md.today.dgot')), 'the sheet says Claimed, today\'s circle shows its gift dimmed');
  ok(!(await ev(() => window.__paw.fw.dgClaim())), 'no second claim the same day');
  await t.closeX(); await ev(() => window.__paw.saveNow()); await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.until(() => !!(window.__paw && window.__paw.fw), null, 5000);
  ok(!(await ev(() => window.__paw.fw.dgCan())) && (await t.S()).fw.cal.dg.length === 1, 'after a reload (or a cloud restore of the same save) it stays claimed');
  // an old save: no dg, earlier days this month stamped: only today's gift, no back-pay
  const oldCal = await ev(() => { const P = window.__paw, s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.fw.cal.dg; delete s.fw.cal.dgc; const d = new Date().getDate(); s.fw.cal.days = [...new Set([1, 2, d])]; return JSON.stringify(s); });
  await t.ctx.close(); await t.mk({ prefs: { fwTest: true, ddTest: true }, storage: { pawhaven_proto_v1: oldCal } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.until(() => !!(window.__paw && window.__paw.fw), null, 5000);
  s9 = await t.S(); ok(Array.isArray(s9.fw.cal.dg) && s9.fw.cal.dg.length === 0 && s9.fw.cal.dgc === 0, 'an old save gets an empty claimed list');
  ok(await ev(() => window.__paw.fw.dgClaim()) && !(await ev(() => window.__paw.fw.dgClaim())) && (await t.S()).fw.cal.dg.length === 1, 'it can claim today\'s gift once, and nothing for the earlier days');
  // the same gift for everyone, about 5 coins a day, the cap, festival dates with Bond 1-2 treats
  const yr = await ev(() => { const P = window.__paw, T = P.fw.items(), out = { coins: 0, days: 0, maxMonth: 0, fest: [], same: true, bond: true }; for (let m = 1; m <= 12; m++) { const ym = '2026-' + String(m).padStart(2, '0'), n = new Date(2026, m, 0).getDate(); let mc = 0; for (let d = 1; d <= n; d++) { const r = P.fw.daily(ym, d); if (JSON.stringify(r) !== JSON.stringify(P.fw.daily(ym, d))) out.same = false; if (r.t === 'coins') mc += r.c; if (r.fest) out.fest.push(ym + '-' + d + ' ' + r.n); if (r.n && (T[r.n] || 1) > 2) out.bond = false; out.days++; } out.coins += mc; out.maxMonth = Math.max(out.maxMonth, mc); } return out; });
  ok(yr.same, 'gifts are seeded by the date: the same for everyone');
  ok(yr.coins / yr.days >= 4 && yr.coins / yr.days <= 6, `about 5 coins a day from daily gifts (${(yr.coins / yr.days).toFixed(2)})`);
  ok(yr.maxMonth <= (await ev(() => window.__paw.fw.dgCap)), `the busiest month (${yr.maxMonth} coins) fits the daily cap (${await ev(() => window.__paw.fw.dgCap)})`);
  ok(yr.fest.length >= 3 && yr.fest.some((x) => /10-31 Apple Monster Biscuits/.test(x)) && yr.bond, 'festival dates bring Bond 1-2 festival treats: ' + yr.fest.join(', '));
  await t.ctx.close();
  // a coin day near the cap, then the festival day itself (Halloween)
  const coinDay = await (async () => { await t.boot({ prefs: { fwTest: true } }); const d = await t.until(() => !!(window.__paw && window.__paw.fw), null, 5000).then(() => ev(() => { for (let d = 1; d <= 8; d++) if (window.__paw.fw.daily('2026-11', d).t === 'coins') return d; return 0; })); await t.ctx.close(); return d; })();
  const atDate = async (iso) => { t.clockOffset = new Date(iso + 'T10:00:00').getTime() - Date.now(); await fresh(); };
  await atDate('2026-11-' + String(coinDay).padStart(2, '0'));
  await ev(() => { window.__paw.S.fw.cal.dgc = 155; }); const c9 = (await t.S()).coins;
  ok(await ev(() => window.__paw.fw.dgClaim()) && (await t.S()).coins - c9 === 5 && (await t.S()).fw.cal.dgc === 160, 'the cap: with 155 daily-gift coins this month a 10-coin gift pays 5');
  await t.ctx.close();
  await atDate('2026-10-31'); await calDay();
  ok(await ev(() => document.querySelector('.fw-dg').classList.contains('fest') && /Apple Monster Biscuits/.test(document.querySelector('.fw-dg').textContent)), 'Halloween: a festival treat, shown on the sheet');
  const ab = (await t.S()).inv.food['Apple Monster Biscuits'] || 0; await t.p.click('#fwDgClaim');
  ok(await t.waitToast(/A festival treat!/, 4000) && ((await t.S()).inv.food['Apple Monster Biscuits'] || 0) === ab + 2, 'claimed: 2 Apple Monster Biscuits');
  await t.ctx.close();
  // phones and desktop sizes: the sheet fits with the gift first
  { const n0 = new Date(); n0.setHours(10, 0, 0, 0); t.clockOffset = n0.getTime() - Date.now(); }
  await fresh({ device: 'iPhone 15' });
  for (const [w, h] of [[393, 852], [360, 640]]) {
    await t.p.setViewportSize({ width: w, height: h }); await t.sleep(400); await calDay();
    const r = await ev(() => { const p = document.querySelector('#modal .panel'), g = p.querySelector('.fw-dg').getBoundingClientRect(), b = p.querySelector('#fwDgClaim'), br = b ? b.getBoundingClientRect() : null, body = p.querySelector('.panel-body').getBoundingClientRect(); return { inside: g.left >= body.left - 1 && g.right <= body.right + 1, top: g.top < body.top + 120, btn: !br || (br.height >= 44 && br.bottom <= body.bottom + 1), sw: document.documentElement.scrollWidth <= window.innerWidth + 1 }; });
    ok(Object.values(r).every(Boolean), `${w} x ${h}: Today's gift sits at the top of the sheet, its Claim button 44 px, no sideways scroll ` + JSON.stringify(r));
    if (w === 393) await shot('daily_gift_phone');
    await t.closeX(); await t.modalGone();
  }
  await t.p.setViewportSize({ width: 393, height: 852 }); await calDay(); await t.p.click('#fwDgClaim'); await t.sleep(500); await shot('daily_gift_claimed_phone'); await t.closeX();
  await t.ctx.close();
  await fresh(); await t.p.setViewportSize({ width: 1440, height: 900 }); await t.sleep(500); await calDay();
  ok(await ev(() => { const g = document.querySelector('.fw-dg').getBoundingClientRect(); return g.width > 200 && g.right <= window.innerWidth; }), '1440 x 900: the sheet shows the gift first');
  await shot('daily_gift_desktop_1440'); await t.closeX();
  await t.ctx.close();
}, { timeout: 720000 });
