// v2.8 NEW YEAR lane (V28.md sections 8, 9 and 10). fest 'auto', season 'winter', prefs.wnTest. 2027-01-02, a rehomed pup patched in: Gerald, Plum and one pup
// card once each (the nengajo is the card picture), Collect all pays +30 raw coins and the hood (Wardrobe, 2027 tag, warm), a second Collect pays nothing;
// the Fortune box draws once a real day (+5 happy, the act, a knot, 0.8 s shake, motion off at once), a patched next day allows another, knots cap at 12 and
// restart with the year. 2026-12-28: no cards or box, the year-end clean done by a real bath. 2027-01-08: no box, row, button or card. 2028-01-02: Gerald's
// card has no gift. An uncollected card survives MAIL_MAX. Screenshots (PAW_SHOTS=1 or PAW_NY_SHOTS=1): game/shots_v28/newyear/.
// node game/run_tests.js v28_newyear
const fs = require('fs'); const path = require('path');
require('./test_lib').run('v28_newyear', async (t) => {
  const { ok, sec, ev, S } = t;
  const p = () => t.p;
  const SHOTS = !!(process.env.PAW_SHOTS || process.env.PAW_NY_SHOTS), DIR = path.join(__dirname, 'shots_v28', 'newyear');
  const shot = async (n) => { if (!SHOTS) return; await ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => e.remove())); await t.sleep(650); fs.mkdirSync(DIR, { recursive: true }); await p().screenshot({ path: path.join(DIR, n + '.jpg'), type: 'jpeg', quality: 72 }); };
  const setDate = (d) => { t.clockOffset = new Date(d + 'T10:00:00').getTime() - Date.now(); };
  const motion = (on) => ev((on) => { document.documentElement.dataset.motion = on ? 'on' : 'off'; }, on);
  const quiet = () => ev(() => { window.__toasts.splice(0); document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
  const today = () => ev(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
  const mails = () => ev(() => window.__paw.S.mail.filter((m) => /^ny_/.test(m.id)).map((m) => ({ id: m.id, kind: m.kind, from: m.from, title: m.title, text: m.text, gift: m.gift || null, card: m.card, animal: m.animal, read: m.read })));
  const eligible = (ids) => ev((ids) => { const seen = new Set(); for (let i = 0; i < 160; i++) window.__paw.ms.pick('x' + i).forEach((m) => seen.add(m.id)); return ids.map((id) => seen.has(id)); }, ids);
  const msDone = (id) => ev((id) => { const m = window.__paw.S.missions.list.find((x) => x.id === id); return !!(m && m.done); }, id);
  const pupSpec = (id, name, since, family) => ({ id, name, since, family, born: '2026-08-01', sex: id.endsWith('1') || id.endsWith('3') ? 'female' : 'male' });
  const seedPups = (list) => ev((list) => { const s = window.__paw.S, me = s.dog; s.rehomed = list.map((x) => Object.assign({ key: me.key, genes: JSON.parse(JSON.stringify(me.genes)), parents: [me.id, 'dad'], gen: 2 }, x)); window.__paw.saveNow(); }, list);
  const FORTUNES = ['Great luck. A stick of exactly the right length is coming your way.', 'Great luck. Someone will drop a whole piece of cheese.', 'Good luck. The postman will finally say hello back.', 'Good luck. Every puddle this year will be the perfect depth.', "Great luck. A sunny patch will find you on the floor at four o'clock.", 'Good luck. The squirrel will make a mistake.', 'Small luck. Small luck is still luck. Have a biscuit.', 'Great luck. Your tail will be the fastest in town.', 'Good luck. A new friend at the Dog Park, and they have a ball.', 'Great luck. The bath will be quick and the towel will be warm.', 'Good luck. A nap so good you forget what day it is.', 'Great luck. Someone will say good dog and mean it every time.'];
  const FAM = { id: 'tanaka', name: 'the Tanakas', where: 'by the bakery' };

  /* ======================= 2027-01-02 ======================= */
  setDate('2027-01-02');
  await t.newGame({ sex: 'girl' }, { bond: { level: 6, pts: 700 }, coins: 500, stats: { hunger: 80, happy: 50, energy: 90, clean: 90 } });
  await t.home('yard');
  const dog = await ev(() => window.__paw.S.dog.name);

  sec('2027-01-02: the natural flow sends Gerald and Mrs. Plum once (no pups yet)');
  ok(await t.until(() => window.__paw.S.mail.filter((m) => /^ny_/.test(m.id)).length === 2, null, 9000), 'two New Year cards arrive by themselves');
  ok((await S()).ny.cards === 2027, 'S.ny.cards = 2027');
  await t.until(() => window.__paw.ny.pending === 0, null, 6000);
  await t.home('house'); await t.home('yard'); await t.until(() => window.__paw.ny.pending === 0, null, 6000);
  ok((await mails()).length === 2, 'a second yard entry sends no new card');

  sec('the three kinds of card, with one rehomed pup patched in');
  await ev(() => { const S = window.__paw.S; S.mail = []; S.ny.cards = null; S.mailCards = {}; window.__paw.ms.force([]); });
  await seedPups([pupSpec('pupA1', 'Button', '2026-11-01', FAM)]);
  ok(await ev(() => window.__paw.ny.cards()) === 3, 'ny.cards() sends 3 cards');
  ok(await ev(() => window.__paw.ny.cards()) === 0, 'and 0 the second time (once per New Year)');
  let ms = await mails(); const by = (id) => ms.find((m) => m.id === id);
  const g = by('ny_gerald_2027'), pl = by('ny_plum_2027'), pu = by('ny_pup_pupA1_2027');
  ok(ms.length === 3 && g && pl && pu, 'ids ny_gerald_2027, ny_plum_2027, ny_pup_pupA1_2027');
  ok(g.kind === 'gift' && g.from === 'Gerald the duck' && g.title === 'A New Year card from Gerald' && g.text === `Happy New Year. It is the Year of the Sheep. The Border Collie has been told. A woolly hood for ${dog}, so nobody gets herded by mistake.`, "Gerald's card text");
  ok(JSON.stringify(g.gift) === JSON.stringify({ item: 'Year of the Sheep Hood', cat: 'clothes', n: 1 }), 'Gerald: the hood waits for Collect');
  ok(pl.kind === 'gift' && pl.title === 'Otoshidama from Mrs. Plum' && pl.text === `A New Year envelope, the way my grandmother did it. The youngest in the house gets one, and that is ${dog}.`, "Mrs. Plum's card text");
  ok(JSON.stringify(pl.gift) === JSON.stringify({ coins: 30 }), 'Mrs. Plum: 30 coins wait for Collect');
  ok(pu.kind === 'postcard' && !pu.gift && /^(Happy New Year from Button and the Tanakas\. She ate the paper on the shimekazari, but only a little\.|Happy New Year! Button saw a kite and is still barking at it\.|Button wishes you a year full of sticks\. Happy New Year\.)$/.test(pu.text), 'the pup card: a photo card without a gift: ' + pu.text);
  ok(ms.every((m) => m.card === 'nengajo' && m.animal === 'sheep'), 'all three are nengajo cards with the sheep stamp');
  ok(ms.every((m) => !m.gift || !m.gift.claimed), 'nothing is paid before Collect');
  const s0 = await S();
  ok(!s0.inv.clothes.includes('Year of the Sheep Hood'), 'the hood is not in the Wardrobe yet');

  sec('the mailbox: the nengajo is the card picture');
  await ev(() => window.__paw.openMailbox('ny_gerald_2027'));
  ok(await t.until(() => !!document.querySelector('#modal .letter .pc.ny-card'), null, 3000), "Gerald's letter has the nengajo card");
  const gc = await ev(() => { const c = document.querySelector('#modal .ny-card'), svg = c.querySelector('.pc-bg > svg'), r = c.getBoundingClientRect(); return { bg: !!svg, hny: svg ? /Happy New Year/.test(svg.outerHTML) || /New Year/.test(svg.getAttribute('aria-label') || '') : false, duck: !!c.querySelector('.ny-mini svg'), tx: c.querySelector('.ny-cardtx').textContent, w: r.width, h: r.height, text: !!document.querySelector('#modal .mb-text') }; });
  ok(gc.bg && gc.hny && gc.duck && gc.text && gc.w / gc.h > 1.3 && gc.w / gc.h < 1.55, `the card shows prop('nengajo'), Gerald's drawing and the letter text below (${Math.round(gc.w)}x${Math.round(gc.h)})`);
  ok(/To /.test(gc.tx) && /from Gerald/.test(gc.tx), 'card text: ' + gc.tx);
  await shot('01_mailbox_gerald');
  await ev(() => window.__paw.openMailbox('ny_plum_2027'));
  ok(await t.until(() => /Otoshidama/.test((document.querySelector('#modal .letter header b') || {}).textContent || '') && !!document.querySelector('#modal .ny-card .ny-mini svg'), null, 3000), "Mrs. Plum's letter has the nengajo and the envelope");
  await shot('02_mailbox_plum');
  await ev(() => window.__paw.openMailbox('ny_pup_pupA1_2027'));
  ok(await t.until(() => !!document.querySelector('#modal .ny-card .pc-photo svg'), null, 3000), "the pup's letter has the nengajo with the pup's photo");
  ok(await ev(() => !document.querySelector('#modal .ny-card .ny-mini') && /from Button/.test(document.querySelector('#modal .ny-cardtx').textContent)), 'photo and "from Button" on the card');
  await shot('03_mailbox_pup');
  ok(await ev(() => !!document.querySelector('#modal .mb-allbar .mb-all') && /^2 letters carry a gift/.test(document.querySelector('#modal .mb-allbar').textContent)), 'Collect all is offered for the two gifts');

  sec('Collect all pays 30 raw coins and the hood, once');
  const c0 = (await S()).coins;
  await p().click('#modal .mb-all');
  ok(await t.until((c) => window.__paw.S.coins === c + 30, c0, 3000), 'coins +30 (raw, no bonus)');
  let s = await S();
  ok(s.inv.clothes.includes('Year of the Sheep Hood'), 'the Year of the Sheep Hood is in the Wardrobe list');
  ok(await t.waitToast(/^Collected 30 coins and a Year of the Sheep Hood\. The Year of the Sheep Hood is in the Wardrobe\./, 3000), 'the Collect toast names both');
  ok(s.mail.filter((m) => /^ny_(gerald|plum)/.test(m.id)).every((m) => m.gift.claimed), 'both gifts are marked collected');
  ok(await t.until(() => !document.querySelector('#modal .mb-allbar'), null, 3000), 'the Collect all bar is gone');
  await ev(() => window.__paw.openMailbox('ny_plum_2027'));
  ok(await t.until(() => !!document.querySelector('#modal .mb-got') && !document.querySelector('#modal .mb-get'), null, 3000), 'the letter shows Collected instead of the button');
  await shot('04_collect_all');
  ok(await ev(() => window.__paw.mbCollect(['ny_gerald_2027', 'ny_plum_2027'])) === '', 'a second Collect pays nothing');
  s = await S(); ok(s.coins === c0 + 30 && s.inv.clothes.filter((x) => x === 'Year of the Sheep Hood').length === 1, 'still +30 coins and one hood');
  await t.closeX();

  sec('the hood: Wardrobe, 2027 tag, warm');
  await ev(() => window.__paw.shop.wardrobe());
  ok(await t.until(() => !!document.querySelector('#modal [data-eq="Year of the Sheep Hood"] .hw-tag'), null, 4000), 'the hood is in the Wardrobe with a tag');
  const wd = await ev(() => { const c = document.querySelector('#modal [data-eq="Year of the Sheep Hood"]'); return { tag: c.querySelector('.hw-tag').textContent, txt: c.textContent, svg: !!c.querySelector('svg') }; });
  ok(wd.tag === '2027' && wd.svg, 'the tag reads 2027 and the card has its picture');
  await shot('05_wardrobe_hood');
  await p().click('#modal [data-eq="Year of the Sheep Hood"]');
  ok(await t.until(() => window.__paw.S.outfit.head === 'Year of the Sheep Hood', null, 3000), 'and it can be worn');
  await t.closeX();
  // warm: a dive into Pip's snowdrift with the hood on gives no cold tip, the same dive without it does
  await ev(() => { window.__paw.S.wn.tips.cold = null; window.__toasts.splice(0); }); await t.home('yard');
  await t.until(() => !!document.querySelector('#wnDriftG [data-drift="0"] > rect.fs-hit'), null, 8000);
  await t.until(() => !window.__paw.shop.busy, null, 5000);
  await p().click('#wnDriftG [data-drift="0"] > rect.fs-hit', { force: true });
  ok(await t.until(() => window.__paw.wn.scattered.includes(0), null, 3000), 'a dive in the snowdrift');
  await t.until(() => !window.__paw.shop.busy && window.__paw.wn.pending === 0, null, 8000);
  ok(!(await t.toasts()).some((x) => /^Short coats feel the cold/.test(x)) && (await S()).wn.tips.cold === null, 'with the hood on there is no cold tip: it is warm wear');
  await ev(() => { const S = window.__paw.S; S.outfit.head = null; S.wn.drifts[0] = S.gameMin - 99; });
  await t.until(() => !window.__paw.wn.scattered.length, null, 6000);
  await p().click('#wnDriftG [data-drift="0"] > rect.fs-hit', { force: true });
  ok(await t.waitToast(/^Short coats feel the cold fast\./, 6000), 'without it the same dive gets the cold tip');
  await t.until(() => !window.__paw.shop.busy, null, 8000);

  sec('MAIL_MAX never drops an uncollected card');
  await ev(() => { const S = window.__paw.S; S.mail = S.mail.filter((m) => !/^ny_/.test(m.id)); S.ny.cards = null; });
  await ev(() => window.__paw.ny.cards());
  await ev(() => { for (let i = 0; i < 55; i++) { const m = window.__paw.mailPush({ kind: 'news', id: 'zz_' + i, from: 'Test', title: 'Filler ' + i, text: 'x' }); m.read = i % 2 === 0; } });
  s = await S();
  ok(s.mail.length <= 43, `the mailbox is trimmed (${s.mail.length} letters)`);
  ok(s.mail.filter((m) => /^ny_(gerald|plum)/.test(m.id) && m.gift && !m.gift.claimed).length === 2, 'the Gerald and Plum cards (gifts owed) survived 55 newer letters');
  ok(await ev(() => ['ny_gerald_2027', 'ny_plum_2027'].every((id) => window.__paw.mbOwed().includes(id))), 'mbOwed() still lists both');
  await ev(() => { const S = window.__paw.S; S.mail = S.mail.filter((m) => !/^zz_/.test(m.id)); });

  sec('four rehomed pups: only the three most recent write, most recent first');
  await seedPups([pupSpec('old1', 'Oldie', '2026-06-01', { id: 'reyes', name: 'Old Mr. Reyes', where: 'at the pier' }), pupSpec('pupB2', 'Mochi', '2026-12-20', { id: 'okafor', name: 'the Okafors', where: 'on Elm Street' }), pupSpec('pupC3', 'Kinako', '2026-12-05', FAM), pupSpec('pupD4', 'Daifuku', '2026-11-15', { id: 'nguyen', name: 'the Nguyens', where: 'by the park' })]);
  const mm = await ev(() => window.__paw.ny.msgs());
  ok(mm.length === 5 && mm.slice(2).map((x) => x.id).join() === 'ny_pup_pupB2_2027,ny_pup_pupC3_2027,ny_pup_pupD4_2027', 'Gerald, Plum, then Mochi, Kinako, Daifuku (the oldest stays home): ' + mm.map((x) => x.id).join());
  ok(mm.slice(2).every((x) => /^(Happy New Year from \w+ and the \w+\. (He|She) ate the paper on the shimekazari, but only a little\.|Happy New Year! \w+ saw a kite and is still barking at it\.|\w+ wishes you a year full of sticks\. Happy New Year\.)$/.test(x.text)), 'pup lines are the three spec lines: ' + mm.slice(2).map((x) => x.text).join(' | '));

  /* ======================= the Square ======================= */
  sec('2027-01-02: the Fortune box in the Square');
  await ev(() => { window.__paw.S.coins = 500; window.__paw.ms.force(['fortune']); }); await quiet();
  await t.home('square'); await motion(false);
  ok(await t.until(() => !!document.querySelector('#nyFortuneG'), null, 6000), '#nyFortuneG is drawn');
  const sq = await ev(() => {
    const g = document.getElementById('nyFortuneG'), st = document.getElementById('fsStallG'), sv = g.querySelector(':scope > svg'), pb = document.getElementById('placeBtns');
    const btn = pb.querySelector('[data-ny="fortune"]'), nx = btn && btn.nextElementSibling;
    return { after: st.nextElementSibling === g, one: document.querySelectorAll('#nyFortuneG').length, box: [+sv.getAttribute('x'), +sv.getAttribute('y'), +sv.getAttribute('width'), +sv.getAttribute('height')], btn: !!btn && /Fortune box/.test(btn.textContent), before: !!nx && nx.dataset.pb === 'yard', hot: g.classList.contains('hot'), hit: !!g.querySelector('rect.fs-hit'), knots: g.dataset.knots, keep: window.__paw.wn.keepOut('square'), fb: window.__paw.ny.box(), j: window.__paw.fest.journal(), kind: st.dataset.kind, banner: !!document.getElementById('wnBannerG') };
  });
  ok(sq.one === 1 && sq.after, '#nyFortuneG is right after #fsStallG');
  ok(JSON.stringify(sq.box) === '[212,344,114,105]', 'the desktop spot is the pop-up spot [212,344,114,105]: ' + JSON.stringify(sq.box));
  ok(sq.btn && sq.before, 'the desktop place button "Fortune box" sits before Go home');
  ok(sq.hot && sq.hit && sq.knots === '0', 'a hotspot with a tap rect, no knots yet');
  ok(sq.keep.some((b) => b.join() === '212,344,114,105') && JSON.stringify(sq.fb) === '[212,344,114,105]', 'fsKeepOut(square) holds nyFortuneBox()');
  ok(/Fortune box in the Square until 7 January\./.test(sq.j), 'the Journal line: ' + sq.j.replace(/<[^>]+>/g, ''));
  ok(sq.kind === 'newyear' && !sq.banner, 'the New Year stall, no contest banner');
  await shot('06_square_2jan_day');

  sec('the sheet, the shake (0.8 s), the slip');
  await motion(true);
  const hap0 = (await S()).stats.happy;
  await p().click('#nyFortuneG > rect.fs-hit', { force: true });
  ok(await t.until(() => !!document.querySelector('#modal .panel.ny-fortunepop'), null, 3000), 'a tap on the box opens the sheet');
  const sh = await ev(() => { const b = document.getElementById('nyShake'); return { h: b.getBoundingClientRect().height, txt: b.textContent, art: !!document.querySelector('.ny-boxart svg'), slip: !!document.querySelector('.ny-slip') }; });
  ok(sh.h >= 44 && sh.art && !sh.slip && sh.txt === 'Shake the box', 'the box and a 44 px "Shake the box", no slip yet');
  await shot('07_sheet_before');
  await p().click('#nyShake');
  ok(await t.until(() => !!document.querySelector('.ny-boxart.ny-shaking'), null, 1500), 'the box wobbles');
  ok(await ev(() => parseFloat(getComputedStyle(document.querySelector('.ny-boxart')).animationDuration) === 0.8), 'for 0.8 s');
  ok(!(await ev(() => !!document.querySelector('.ny-slip'))), 'no slip while it wobbles');
  await shot('07b_sheet_shaking');
  ok(await t.until(() => !!document.querySelector('.ny-slip') && !document.querySelector('.ny-shaking'), null, 3000), 'then the slip opens');
  const slip = await ev(() => ({ luck: document.querySelector('.ny-luck').textContent, f: document.querySelector('.ny-ftxt').textContent, fs: parseFloat(getComputedStyle(document.querySelector('.ny-ftxt')).fontSize) }));
  const full = slip.luck + ' ' + slip.f;
  ok(FORTUNES.includes(full), 'the slip is one of the twelve fortunes: ' + full);
  ok(slip.fs >= 17, 'slip text >= 17 px (' + slip.fs + ')');
  s = await S();
  ok(s.stats.happy >= hap0 + 4.5 && s.stats.happy <= hap0 + 6, `happy +5 (${hap0.toFixed(1)} -> ${s.stats.happy.toFixed(1)})`);
  ok(s.ny.fortune.date === await today() && s.ny.fortune.knots === 0, 'S.ny.fortune.date is today, no knot yet');
  ok(await msDone('fortune'), 'act:fortune completes the "Draw a New Year fortune" mission');
  ok(await ev(() => window.__paw.ny.acts.length) === 1, 'one fortune act');
  ok(await ev(() => { const b = document.getElementById('nyTie'); return b.textContent === 'Tie it on the rail' && b.getBoundingClientRect().height >= 44; }), '"Tie it on the rail", 44 px');
  await shot('08_sheet_after');
  const seed = await ev(() => { const P = window.__paw.ny, days = new Set(); for (let d = 1; d <= 60; d++) days.add(P.fortuneFor('2027-03-' + d)); return { same: P.fortuneFor('2027-01-02') === P.fortuneFor('2027-01-02'), spread: days.size }; });
  ok(seed.same && seed.spread >= 8, `seeded by date: the same day gives the same slip, 60 days spread over ${seed.spread} fortunes`);
  ok(await ev((d) => window.__paw.ny.fortuneFor(d), await today()) === full, "the slip is today's seeded fortune");
  await p().click('#nyTie');
  ok(await t.until(() => window.__paw.ny.knots === 1 && !document.querySelector('#modal .panel.ny-fortunepop'), null, 3000), 'tying it on adds a knot and closes');
  ok(await t.until(() => document.getElementById('nyFortuneG') && document.getElementById('nyFortuneG').dataset.knots === '1', null, 3000), 'the box in the Square is redrawn with 1 knot');
  ok(await t.waitToast(/^Tied on the rail\./, 3000), 'a kind toast');
  await shot('09_square_one_knot');
  await p().click('[data-ny="fortune"]');
  ok(await t.until(() => !!document.querySelector('#modal .panel.ny-fortunepop'), null, 3000), 'the place button opens the sheet too');
  ok(await ev(() => /Come back tomorrow for another\./.test(document.querySelector('.ny-intro').textContent) && !document.getElementById('nyShake') && !!document.querySelector('.ny-slip')), 'the same day: "Come back tomorrow for another.", no shake');
  await t.closeX();
  s = await S(); ok(s.ny.fortune.knots === 1, 'still one knot');

  sec('a patched next day allows another; motion off opens the slip at once');
  await ev(() => { const f = window.__paw.S.ny.fortune; f.date = '2027-01-01'; f.tied = '2027-01-01'; window.__paw.ms.force(['fortune']); }); await quiet();
  await motion(false);
  await ev(() => window.__paw.ny.fortuneOpen()); await t.until(() => !!document.getElementById('nyShake'), null, 3000);
  const hap1 = (await S()).stats.happy;
  await p().click('#nyShake');
  ok(await t.until(() => !!document.querySelector('.ny-slip'), null, 1200), 'motion off: the slip opens at once');
  ok(await ev(() => !document.querySelector('.ny-shaking')), 'and the box never wobbled');
  ok((await S()).stats.happy > hap1 + 4, 'happy +5 again');
  await p().click('#nyTie');
  ok(await t.until(() => window.__paw.ny.knots === 2, null, 3000), 'a second knot');
  ok(await msDone('fortune'), 'the mission completes again on a new day');

  sec('a shake whose sheet was closed still counts; reopening shows the slip to tie');
  await ev(() => { const f = window.__paw.S.ny.fortune; f.date = '2027-01-01'; f.tied = '2027-01-01'; });
  await ev(() => window.__paw.ny.fortuneOpen()); await t.until(() => !!document.getElementById('nyShake'), null, 3000);
  await p().click('#nyShake'); await t.until(() => !!document.getElementById('nyTie'), null, 3000); await t.closeX();
  ok(await ev(() => window.__paw.ny.drawn()) && (await S()).ny.fortune.knots === 2, 'drawn today, no knot yet');
  await ev(() => window.__paw.ny.fortuneOpen());
  ok(await t.until(() => !!document.querySelector('.ny-slip') && !!document.getElementById('nyTie') && !document.getElementById('nyShake'), null, 3000), 'reopened: the slip and "Tie it on the rail"');
  await p().click('#nyTie'); ok(await t.until(() => window.__paw.ny.knots === 3, null, 3000), 'tied: 3 knots');

  sec('knots cap at 12; they restart when the New Year changes');
  await ev(() => { const f = window.__paw.S.ny.fortune; f.knots = 11; f.date = '2000-01-01'; f.tied = null; });
  for (let i = 0; i < 2; i++) {
    await ev(() => window.__paw.ny.fortuneOpen()); await t.until(() => !!document.getElementById('nyShake'), null, 3000);
    await p().click('#nyShake'); await t.until(() => !!document.getElementById('nyTie'), null, 3000); await p().click('#nyTie'); await t.modalGone();
    await ev(() => { const f = window.__paw.S.ny.fortune; f.date = '2000-01-01'; f.tied = null; });
  }
  ok(await ev(() => window.__paw.ny.knots) === 12, 'knots stop at 12');
  ok(await t.until(() => document.getElementById('nyFortuneG') && document.getElementById('nyFortuneG').dataset.knots === '12', null, 3000), 'the box draws 12');
  await shot('10_square_12_knots');
  await ev(() => { window.__paw.S.ny.fortune.year = 2026; window.__paw.S.ny.fortune.knots = 7; window.__paw.ny.draw(); });
  ok(await ev(() => window.__paw.ny.knots === 0 && window.__paw.S.ny.fortune.year === 2027 && document.getElementById('nyFortuneG').dataset.knots === '0'), 'knots start again at 0 when S.ny.fortune.year changes');

  sec('night and Fuji (screenshots)');
  await ev(() => { window.__paw.S.ny.fortune.knots = 5; });
  await t.dev(async () => { await p().selectOption('#dvTime', 'night'); });
  await ev(() => { window.__paw.jp.allow(true); });
  ok(await t.until(() => !!document.querySelector('#nyFortuneG[data-night="1"]'), null, 6000), 'at night the box is redrawn with the night art');
  await shot('11_square_night_fuji');
  await t.dev(async () => { await p().selectOption('#dvTime', 'day'); });
  await t.until(() => !!document.querySelector('#nyFortuneG[data-night="0"]'), null, 6000);
  await ev(() => { window.__paw.S.ny.fortune.knots = 3; window.__paw.ny.draw(); });
  await shot('12_square_day_fuji');
  await ev(() => { window.__paw.jp.allow(false); });

  /* ======================= other dates ======================= */
  sec('2028-01-02: no zodiac entry, Gerald sends the card without a gift');
  await t.ctx.close(); setDate('2028-01-02');
  await t.newGame({ sex: 'boy' }, { bond: { level: 6, pts: 700 }, coins: 500 });
  await t.home('yard');
  ok(await t.until(() => window.__paw.S.mail.filter((m) => /^ny_/.test(m.id)).length === 2, null, 9000), 'two cards again');
  ms = await mails(); const dog8 = await ev(() => window.__paw.S.dog.name);
  const g8 = ms.find((m) => m.id === 'ny_gerald_2028'), p8 = ms.find((m) => m.id === 'ny_plum_2028');
  ok(g8 && g8.kind === 'news' && g8.text === 'Happy New Year. I hope it is a year of long walks.' && !g8.gift && g8.animal === 'pine', "Gerald's 2028 card: a news letter, no gift, a pine stamp");
  ok(p8 && p8.gift && p8.gift.coins === 30 && p8.text.endsWith(`that is ${dog8}.`), "Mrs. Plum's 2028 card still has the 30 coins");
  await ev(() => window.__paw.openMailbox('ny_gerald_2028'));
  ok(await t.until(() => !!document.querySelector('#modal .ny-card .pc-bg svg') && !document.querySelector('#modal .mb-giftrow'), null, 3000), 'the 2028 card shows the nengajo and no Collect row');
  await shot('13_mailbox_2028_no_gift');
  ok((await S()).ny.cards === 2028, 'S.ny.cards = 2028');
  await t.closeX();

  sec('2027-01-08: no box, no row, no button, no cards; the hood stays');
  await t.ctx.close(); setDate('2027-01-08');
  await t.newGame({ sex: 'girl' }, { bond: { level: 6, pts: 700 }, coins: 500, inv: { clothes: ['Year of the Sheep Hood'] } });
  await t.home('yard'); await t.until(() => window.__paw.ny.pending === 0, null, 6000);
  ok(await ev(() => window.__paw.ny.cards()) === 0 && (await mails()).length === 0, 'no cards after 7 January');
  await t.home('square'); await motion(false);
  await t.until(() => !!document.getElementById('fsStallG'), null, 6000);
  ok(await ev(() => !document.getElementById('nyFortuneG') && !document.querySelector('[data-ny]') && window.__paw.ny.journal() === '' && !/Fortune box/.test(window.__paw.fest.journal())), 'no box, no place button, no Journal line');
  await shot('14_square_8jan');
  await ev(() => window.__paw.ny.fortuneOpen());
  ok(await t.waitToast(/^The Fortune box has gone back to the shed until next New Year\.$/, 3000), 'the sheet will not open: a kind line');
  ok(await ev(() => window.__paw.S.ny.fortune.knots === 0 && window.__paw.S.inv.clothes.includes('Year of the Sheep Hood')), 'the hood stays owned');
  await ev(() => window.__paw.shop.wardrobe());
  ok(await t.until(() => !!document.querySelector('#modal [data-eq="Year of the Sheep Hood"] .hw-tag'), null, 4000), 'and still wears its 2027 tag');
  await t.closeX();

  sec('2026-12-28: no cards or box; the year-end clean is done by a bath');
  await t.ctx.close(); setDate('2026-12-28');
  await t.newGame({ sex: 'girl' }, { bond: { level: 6, pts: 700 }, coins: 500, stats: { hunger: 80, happy: 60, energy: 90, clean: 40 } });
  await t.home('yard'); await t.until(() => window.__paw.ny.pending === 0, null, 6000);
  ok(await ev(() => window.__paw.ny.cards()) === 0 && (await mails()).length === 0, 'no New Year cards before 1 January');
  ok(await ev(() => window.__paw.ny.journal() === ''), 'no Journal line');
  await t.home('square'); await motion(false); await t.until(() => !!document.getElementById('fsStallG'), null, 6000);
  ok(await ev(() => !document.getElementById('nyFortuneG') && !document.querySelector('[data-ny]')), 'no Fortune box in the Square');
  ok((await eligible(['yearclean', 'fortune'])).join() === 'true,false', 'yearclean is eligible on 28 December, the fortune is not');
  await ev(() => window.__paw.ms.force(['yearclean'])); await t.home('yard'); await quiet();
  ok(!(await msDone('yearclean')), 'not done yet');
  await ev(() => window.__paw.go('bath')); await t.untilMode('bath');
  for (let i = 0; i < 40 && !(await msDone('yearclean')); i++) await p().keyboard.press('Space');
  ok(await t.until(() => { const m = window.__paw.S.missions.list.find((x) => x.id === 'yearclean'); return !!(m && m.done); }, null, 5000), 'a real bath completes "Year-end clean"');
  await t.untilMode('yard');

  sec('mission gates by date');
  await t.ctx.close(); setDate('2027-01-03');
  await t.newGame({ sex: 'girl' }, { bond: { level: 6, pts: 700 }, coins: 500 });
  ok((await eligible(['yearclean', 'fortune'])).join() === 'false,true', 'on 3 January the fortune mission is eligible and the year-end clean is not');
  const td = await today(); await ev((d) => { window.__paw.S.ny.fortune.date = d; }, td);
  ok((await eligible(['fortune']))[0] === false, 'and not once a fortune was drawn today');

  sec('the twelve fortunes are final and only good');
  const fz = await ev(() => window.__paw.ny.fortunes);
  ok(JSON.stringify(fz) === JSON.stringify(FORTUNES), 'the text matches the spec');
  ok(fz.every((f) => /^(Great|Good|Small) luck\. /.test(f) && !/\b(bad|unlucky|lose|lost|sick|cry|hurt|scare|never)\b/i.test(f)), 'every fortune starts with Great, Good or Small luck and none is bad');

  const errs = t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
}, { fest: 'auto', season: 'winter', prefs: { wnTest: true, msTest: true } });
