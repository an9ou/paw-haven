// v2.16 "First Week" (V216.md): the Bond thresholds and their quiet migration, Puppy's first day (the guided start), the next-unlock line,
// the Bond 2 party, the welcome week and the monthly calendar (rewards, the 80-coin cap, the new month), "see you tomorrow", the lighter phone dock.
// Everything but the thresholds needs prefs.fwTest under the harness. V216_SHOTS=1 also writes the release screenshots to docs/release/v2.16/.
const { run, URL } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.V216_SHOTS ? path.join(__dirname, '..', 'docs', 'release', 'v2.16') : null;
const TH = [0, 60, 180, 450, 700, 1000, 1400, 1900, 2500, 3200];

run('v216_first_week', async (t) => {
  const { ok, sec, ev } = t;
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(350); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const card = () => ev(() => { const c = document.querySelector('#gdLayer .gd-card'); return c && !c.hidden ? { step: +c.dataset.step, k: c.dataset.k, txt: c.querySelector('.gd-txt').textContent, next: c.querySelector('.gd-next').textContent } : null; });
  const cardAt = (k) => t.until((k) => { const c = document.querySelector('#gdLayer .gd-card'); return !!c && !c.hidden && c.dataset.k === k; }, k, 8000);
  const ringFor = () => ev(() => { const r = document.querySelector('#gdLayer .gd-ring'); return r && !r.hidden ? r.dataset.for : null; });
  const fw = () => ev(() => JSON.parse(JSON.stringify(window.__paw.S.fw)));
  const quiet = () => ev(() => { const f = window.__paw.S.fw; f.shown = f.morning; }); // no morning page pending
  const fresh = async (o) => { await t.boot(Object.assign({ prefs: { fwTest: true } }, o || {})); await t.adopt({ sex: 'girl' }); };

  sec('1. Bond thresholds: Bond 2 at 60 and Bond 3 at 180, the rest as before');
  await t.boot(); await t.until(() => !!(window.__paw && window.__paw.fw), null, 4000);
  ok(JSON.stringify(await ev(() => window.__paw.fw && window.__paw.fw.BOND_TH)) === JSON.stringify(TH), 'BOND_TH is ' + TH.join(', '));

  sec('2. migration: an old save levels up quietly, once, with one kind toast; nothing else of v2.16 switches on');
  await t.adopt({ sex: 'girl' });
  const oldJson = await ev(() => { const P = window.__paw; const m = P.addDog({ key: 'dachs', sex: 'male', months: 30 }, 'Otto'); P.S.dogs[0].bond = { level: 2, pts: 200 }; m.bond = { level: 1, pts: 70 }; P.saveNow(); const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.fw; delete s.guide.fw; return JSON.stringify(s); });
  await t.ctx.close(); await t.mk({ prefs: { fwTest: true }, storage: { pawhaven_proto_v1: oldJson } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
  let s = await t.S();
  ok(s.dogs[0].bond.level === 3 && s.dogs[1].bond.level === 2, `the dogs moved up: 200 points -> Bond 3, 70 points -> Bond 2 (${s.dogs.map((d) => d.bond.level).join(', ')})`);
  ok(await t.waitToast(/Good news: Bond levels are a little closer now\. 2 of your dogs moved up a level\./, 6000), 'one kind toast');
  ok(!(await t.until(() => !!document.getElementById('luOk'), null, 1500)), 'no level-up fanfare queue for the quiet level-ups');
  ok(s.fw && s.fw.fresh === false && s.fw.wel === null && s.fw.dock === 10 && s.fw.b2[s.dogs[0].id] && s.fw.b2[s.dogs[1].id], 'an old save: not fresh, no welcome week, full dock, both dogs marked as past the Bond 2 party: ' + JSON.stringify({ fresh: s.fw.fresh, wel: s.fw.wel, dock: s.fw.dock, b2: s.fw.b2 }));
  ok(!(await card()), 'an old save never gets the first-day guide');
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.sleep(2600);
  ok(!(await ev(() => window.__toasts.some((x) => /Good news: Bond/.test(x)))) && (await t.S()).dogs[0].bond.level === 3, 'reloading keeps the levels and says nothing again (the fix runs once)');
  ok(await ev(() => window.__paw.fw.bondFix({ dogs: [{ name: 'A', bond: { level: 5, pts: 10 } }] }).dogs[0].bond.level === 5), 'levels never go down');
  ok(await ev(() => [...document.querySelectorAll('#bar .act')].every((b) => !b.hidden)), 'an old save keeps all seven dock buttons');
  await t.ctx.close();

  sec('3. Puppy\'s first day (desktop): five steps, each gives Bond, Bond 2 lands on the walk home');
  await fresh();
  ok(await cardAt('pet'), 'Gerald starts with the pet step on a new save');
  let c = await card(); ok(/Rub .* to say hello/.test(c.txt) && (await ringFor()) === '#dogHit', 'step 1: pet, the crayon ring on the dog: ' + c.txt);
  s = await t.S(); ok(s.guide.fw === 1 && s.fw.fresh && s.fw.dock === 1 && s.fw.wel && s.fw.wel.days.length === 1, 'the save is marked fresh with a welcome week (day 1 stamped)');
  await shot('guided_start_desktop');
  const b0 = (await t.S()).bond.pts;
  await t.pet(() => window.__paw.S.guide.step >= 1);
  ok(await cardAt('feed'), 'petting moves on to feed');
  ok(await t.waitToast(/First day: step 1 of 5 done\. \+4 Bond\./), 'the step gives Bond (+4) with a toast');
  ok((await ringFor()) === '#bar [data-act=feed]', 'the ring is on Feed');
  await t.p.click('[data-act=feed]'); await t.waitPop(true);
  ok(await t.until(() => { const r = document.querySelector('#gdLayer .gd-ring'); return r && !r.hidden && /^#dock/.test(r.dataset.for); }, null, 3000), 'with the feed tray open the ring moves onto a food in the tray');
  await t.retryUntil(() => ev(() => { const b = document.querySelector('[data-food="Basic Kibble"]'); if (b) b.click(); }), () => window.__paw.S.guide.step >= 2);
  await t.waitPop(false); await t.calm();
  ok(await cardAt('ball'), 'feeding moves on to ball play');
  await t.p.click('[data-act=play]'); await t.waitPop(true);
  ok(await t.until(() => { const r = document.querySelector('#gdLayer .gd-ring'); return r && !r.hidden && r.dataset.for === '#dock [data-play="ball:Tennis Ball"]'; }, null, 3000), 'the ring points at the Tennis Ball in the play tray');
  await t.p.click('[data-play="ball:Tennis Ball"]'); await t.until(() => !!(window.__paw.bl && window.__paw.bl.on), null, 4000);
  await ev(() => window.__paw.bl.throwV(800, -600)); await ev(() => window.__paw.bl.sim(14));
  ok(await t.until(() => window.__paw.S.guide.step >= 3, null, 6000), 'a ball brought back moves on to the name tag');
  await ev(() => window.__paw.bl.stop()); await t.untilMode('yard'); await t.calm(); await t.lu();
  ok(await cardAt('tag'), 'the name-tag step');
  c = await card(); ok(c.next === 'Make the tag' && (await ringFor()) === '#gdLayer .gd-next', 'its button says Make the tag and the ring is on it');

  sec('3b. the guide resumes after a reload');
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
  ok(await cardAt('tag'), 'after a reload Gerald is back on the same step');

  await t.p.click('#gdLayer .gd-next'); await t.p.waitForSelector('#fwTagName');
  await t.p.fill('#fwTagName', 'Biscuit'); await t.p.click('[data-tagcol="mint"]');
  ok(await ev(() => /Biscuit/.test(document.querySelector('.fw-tagart').textContent)), 'the tag drawing follows the typed name');
  await t.p.click('#fwTagOk');
  ok(await cardAt('walk'), 'hanging the tag moves on to the walk');
  s = await t.S(); ok(s.dog.name === 'Biscuit' && s.dog.fwTag === 'mint' && await ev(() => !!document.querySelector('#hudHead .fw-htag')), 'the dog wears the tag (name, colour, the HUD portrait)');
  const before = await t.S(); ok(before.bond.level === 1 && before.bond.pts < 60, `still Bond 1 before the walk (${before.bond.pts} points, ${before.bond.pts - b0} from the first four steps)`);
  ok((await ringFor()) === '#bar [data-act=walk]', 'the ring is on Walk');
  await t.startWalk(true); await ev(() => { window.__paw.W.dist = 1e7; }); await t.quitWalk(false);
  await t.p.click('#resOk'); await t.untilMode('yard');
  s = await t.S(); ok(s.bond.level === 2 && s.guide.done && !s.guide.skipped, `after the walk: Bond 2 (${s.bond.pts} points) and the first day is done`);

  sec('4. the Bond 2 party: confetti, a gift, then Paw');
  ok(await t.until(() => !!document.querySelector('#modal .panel.fw-party #luOk'), null, 8000), 'the level-up card is a party');
  ok(await ev(() => !!document.getElementById('fwConfetti') && document.querySelectorAll('#fwConfetti .fw-cf').length > 20), 'crayon confetti over the stage');
  s = await t.S(); ok(s.inv.clothes.includes('Bow Tie') && s.fw.b2[s.dog.id] === 1 && await ev(() => /A party gift: Bow Tie!/.test(document.querySelector('.fw-gift').textContent)), 'a free Bow Tie from the Boutique list, once for this dog');
  await shot('bond2_party_desktop');
  await t.p.click('#luOk');
  ok(await t.until(() => { const fx = document.getElementById('dogFx'), a = document.querySelector('#dogArt svg'); return (fx && fx.classList.contains('tk-paw')) || (a && /pa-pose-paw/.test(a.getAttribute('class') || '')); }, null, 4000), 'then the dog does Paw');
  ok(await t.waitToast(/That was Biscuit's first day!/, 6000), 'the first-day toast');

  sec('5. the morning page after the first day: the welcome week and the month, side by side');
  ok(await t.until(() => !!document.querySelector('#modal .fw-calpop .fw-welp') && !!document.querySelector('#modal .fw-calpop .fw-monp'), null, 9000), 'the calendar opens by itself once the yard is calm, with both pages');
  ok(await ev(() => document.querySelectorAll('.fw-welp .fw-wd.on').length === 1 && document.querySelectorAll('.fw-monp .fw-md.on').length === 1), 'one paw stamped on each page');
  await shot('calendars_desktop');
  const f0 = (await t.S()).inv.food['Chicken & Rice Bowl'] || 0;
  await t.p.click('[data-fwclaim="wel:1"]');
  s = await t.S(); ok((s.inv.food['Chicken & Rice Bowl'] || 0) === f0 + 2 && s.fw.wel.got.includes(1), 'day 1: a tap claims the bowl (Chicken & Rice Bowl x2)');
  ok(await ev(() => !document.querySelector('[data-fwclaim="wel:1"]') && !!document.querySelector('.fw-rew.got[data-rew="wel:1"]')), 'the page redraws with Got it');
  await t.p.click('#fwCalOk'); await t.modalGone();
  ok(await ev(() => /Bond 3: learns Lie Down/.test(document.getElementById('fwNext').textContent)), 'the next-unlock line moved on to Bond 3');
  await shot('next_unlock_desktop');
  ok(await ev(() => { const n = document.getElementById('fwNext').getBoundingClientRect(), b = document.querySelector('#hud .bond').getBoundingClientRect(); return !document.getElementById('fwNext').hidden && n.top >= b.bottom - 2 && n.right <= window.innerWidth; }), 'desktop: the line hangs under the Bond meter');
  ok(await ev(() => [...document.querySelectorAll('#bar .act')].every((b) => !b.hidden)), 'desktop keeps all seven buttons');
  await t.ctx.close();

  sec('6. skipping the first day never blocks anything; the next-unlock texts');
  await fresh(); ok(await cardAt('pet'), 'the guide is up');
  await t.p.click('#gdLayer .gd-skip');
  ok(await t.until(() => { const c = document.querySelector('#gdLayer .gd-card'); return !c || c.hidden; }, null, 3000) && !!(await t.S()).guide.skipped, 'Skip ends it');
  ok(await t.until(() => !!document.querySelector('#modal .fw-calpop'), null, 8000), 'the calendar still opens after a skip');
  await t.p.click('#fwCalOk'); await t.modalGone();
  await t.p.click('[data-act=walk]'); ok(await t.untilMode('routes'), 'Walk works after the skip'); await t.home();
  const nx = await ev(() => [1, 2, 3, 4, 9].map((L) => window.__paw.fw.next(L)));
  ok(/^Bond 2: learns Paw \+ \d+ new outfits$/.test(nx[0]) && /^Bond 3: learns Lie Down/.test(nx[1]) && /Roll Over/.test(nx[2]) && /Spin/.test(nx[3]) && /^Bond 10: a signature trick/.test(nx[4]), 'next unlocks come from TRICKS and the shop: ' + nx.join(' | '));
  ok(await ev(() => window.__paw.fw.next(10) === ''), 'nothing after Bond 10');

  sec('7. the calendars: rewards, the 80-coin cap, a new month, days need not be in a row');
  await quiet();
  const ym = await ev(() => window.__paw.S.fw.cal.ym), mo = +ym.slice(5);
  await t.patch({ fw: { cal: { ym, days: Array.from({ length: 24 }, (_, i) => i + 1), got: [], coins: 0 } } });
  let coins0 = (await t.S()).coins;
  await ev(() => window.__paw.fw.open(false)); await t.p.waitForSelector('[data-fwclaim="cal:3"]');
  for (const n of [3, 7, 12, 18, 24]) { await t.p.click(`[data-fwclaim="cal:${n}"]`); await t.until((n) => !document.querySelector(`[data-fwclaim="cal:${n}"]`), n, 3000); }
  s = await t.S();
  const outfit = ['Pom-pom Beanie', 'Knit Scarf', 'Flower Crown', 'Polka-dot Raincoat', 'Bumblebee Suit', 'Frog Raincoat', 'Sailor Collar', 'Heart Sunglasses', 'Leaf Beret', 'Autumn Scarf', 'Cozy Hoodie', 'Snowflake Snood'][mo - 1];
  ok(s.coins - coins0 === 80 && s.fw.cal.coins === 80, `3 days 30 + 12 days 50 coins = 80 (${s.coins - coins0})`);
  ok(s.fw.cal.got.length === 5 && s.fw.frames.months.includes(ym) && s.inv.clothes.includes(outfit) && (s.inv.food['Carrot Sticks'] || 0) >= 2, `7 days a seasonal toy, 12 a treat bag, 18 the ${ym} frame, 24 the month's outfit (${outfit})`);
  ok(await ev(() => document.querySelectorAll('.fw-monp .fw-rew.got').length === 5), 'all five show Got it');
  await t.closeX();
  await t.patch({ fw: { cal: { ym, days: Array.from({ length: 12 }, (_, i) => i + 1), got: [3], coins: 60 } } }); coins0 = (await t.S()).coins;
  ok(await ev(() => window.__paw.fw.claim('cal', 12)) && (await t.S()).coins - coins0 === 20 && (await t.S()).fw.cal.coins === 80, 'the cap: with 60 calendar coins this month the 12-day gift pays only 20');
  ok(!(await ev(() => window.__paw.fw.claim('cal', 12))) && !(await ev(() => window.__paw.fw.claim('cal', 18))), 'a gift claims once, and only once its day count is reached');
  // a new month: last month's unclaimed gifts go to the bag (inside the cap), the new page starts with today
  await t.patch({ fw: { cal: { ym: '2026-09', days: Array.from({ length: 20 }, (_, i) => i + 1), got: [3], coins: 30 }, frames: { months: [] } } }); coins0 = (await t.S()).coins;
  await ev(() => window.__paw.fw.stamp()); s = await t.S();
  ok(s.fw.cal.ym === ym && s.fw.cal.days.length === 1 && s.fw.cal.coins === 0 && s.fw.frames.months.includes('2026-09') && s.coins - coins0 === 50, `a new month: the September gifts arrive (+${s.coins - coins0} coins, the frame), a fresh page for ${ym}`);
  ok(await t.waitToast(/Last month's calendar gifts are in your bag\./, 4000), 'with a kind note');
  // the welcome week: any 7 days, never in a row needed, a missed day takes nothing away
  await t.patch({ fw: { wel: { days: ['2026-10-01', '2026-10-04', '2026-10-09'], got: [1] } } });
  await ev(() => window.__paw.fw.stamp()); s = await t.S();
  ok(s.fw.wel.days.length === 4 && s.fw.wel.days[0] === '2026-10-01', 'days with gaps all count, today is added (4 of 7)');
  await t.patch({ fw: { wel: { days: ['2026-10-01', '2026-10-04', '2026-10-09', '2026-10-12', '2026-10-15', '2026-10-20', '2026-10-25'], got: [1] } } });
  for (const n of [3, 5, 7]) ok(await ev((n) => window.__paw.fw.claim('wel', n), n), 'welcome day ' + n + ' claimed');
  s = await t.S(); ok(s.inv.toys.includes('Squeaky Duck') && s.inv.clothes.includes('Flower Crown') && s.fw.frames.name === 'Mochi', 'day 3 a toy (Squeaky Duck), day 5 an outfit (Flower Crown), day 7 a photo frame with the dog\'s name');
  const frames = await ev(() => window.__paw.fw.frames().map((f) => f.k));
  ok(frames.includes('fwname') && frames.includes('fwm202609'), 'photo mode lists the new frames: ' + frames.join(', '));
  ok(await ev(() => { const s = window.__paw.fw.postcard(900, 600, { color: 'fwname', dogs: ['Mochi'] }); return /fw-frame/.test(s) && /Mochi/.test(s); }), 'the name frame draws the name on the postcard');
  ok(await ev(() => /fw-frame/.test(window.__paw.fw.postcard(900, 600, { color: 'fwm202609', dogs: ['Mochi'] }))), 'the month frame draws its doodles');
  ok(await ev(() => !window.__paw.fw.html(false).includes('fw-welp')), 'a finished welcome week leaves the calendar (the month stays)');

  sec('8. see you tomorrow: a wish after 10 minutes of play or on pagehide, shown on the next day');
  await t.patch({ fw: { named: '', wish: null } }); await ev(() => window.__paw.fw.play(600));
  ok(await t.waitToast(/See you tomorrow! Mochi is already looking forward to it\./, 4000), 'after 10 minutes the dog names a wish');
  s = await t.S(); const tom = await ev(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); });
  ok(s.fw.wish && s.fw.wish.for > (await ev(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })) && !s.fw.wish.shown, 'the wish is for tomorrow (' + s.fw.wish.for + ', ' + tom + ')');
  await t.patch({ fw: { named: '', wish: null } }); await ev(() => window.dispatchEvent(new Event('pagehide')));
  ok(!!(await t.S()).fw.wish, 'pagehide names it too (quietly)');
  const today = await ev(() => window.__paw.S.fw.cal.ym + '-' + String(new Date().getDate()).padStart(2, '0'));
  await t.patch({ fw: { wish: { k: 'snack', for: today, shown: false, done: false }, shown: '' } });
  await ev(() => { window.__paw.S.fw.morning = window.__paw.S.fw.cal.ym + '-' + String(new Date().getDate()).padStart(2, '0'); });
  ok(await t.until(() => !!document.querySelector('#modal .fw-calpop .fw-wish'), null, 8000), 'the next day\'s first open shows the wish on the morning page');
  ok(await ev(() => /Mochi remembered yesterday: Today, a crunchy snack\?/.test(document.querySelector('.fw-wish').textContent)), 'in the dog\'s words');
  await t.p.click('#fwCalOk'); await t.modalGone(); await t.calm();
  const h0 = (await t.S()).stats.happy;
  await t.p.click('[data-act=feed]'); await t.waitPop(true);
  await t.retryUntil(() => ev(() => { const b = document.querySelector('[data-food="Basic Kibble"]'); if (b) b.click(); }), () => window.__paw.S.fw.wish.done);
  ok(await t.waitToast(/Wish come true! Mochi is so happy: \+10 Happiness/, 4000), 'doing it makes the wish come true (+10 Happiness, a little Bond)');
  await t.ctx.close();

  sec('9. phones: the lighter dock, new! tags, the guide and the next-unlock line at 393, 390 and 684 px');
  await fresh({ device: 'iPhone 15' });
  const acts = () => ev(() => [...document.querySelectorAll('#bar .act')].filter((b) => !b.hidden && b.getClientRects().length).map((b) => b.dataset.act).join(','));
  ok((await acts()) === 'feed,play,care,walk,map', 'Bond 1 on a new save: Feed, Play, Care, Walk, Map (' + (await acts()) + ')');
  ok(await ev(() => { const b = [...document.querySelectorAll('#bar .act')].filter((x) => !x.hidden).map((x) => x.getBoundingClientRect()); return b.every((r) => r.width > 60 && r.height >= 48) && b[b.length - 1].right <= window.innerWidth + 1; }), 'the five buttons share the bar, each 48 px or taller');
  ok(await cardAt('pet'), 'the first-day card shows on the phone');
  const fitCheck = async (label) => {
    const r = await ev(() => { const st = document.getElementById('stage').getBoundingClientRect(), c = document.querySelector('#gdLayer .gd-card').getBoundingClientRect(), ring = document.querySelector('#gdLayer .gd-ring'), rr = ring && !ring.hidden ? ring.getBoundingClientRect() : null, bt = [...document.querySelectorAll('#gdLayer .gd-card .btn')].filter((b) => !b.hidden).map((b) => b.getBoundingClientRect());
      return { inX: c.left >= st.left - 1 && c.right <= st.right + 1, inY: c.top >= st.top - 1 && c.bottom <= st.bottom + 1, btn: bt.every((b) => b.height >= 44), sw: document.documentElement.scrollWidth <= window.innerWidth + 1, ring: !!rr }; });
    ok(r.inX && r.inY && r.btn && r.sw && r.ring, `${label}: the card sits inside the stage, its buttons are 44 px or taller, no sideways scroll, the ring is up ` + JSON.stringify(r));
  };
  await fitCheck('iPhone 15 (393 px)');
  ok(await ev(() => { const n = document.getElementById('fwNext'), h = document.getElementById('hud').getBoundingClientRect(), r = n.getBoundingClientRect(); return !n.hidden && r.top >= h.top && r.bottom <= h.bottom + 1 && /Bond 2: learns Paw/.test(n.textContent); }), 'phone: the next-unlock line sits inside the HUD, under the Bond meter');
  ok(await ev(() => document.getElementById('hud').getBoundingClientRect().height <= 104), 'the phone HUD stays about 100 px tall');
  await shot('guided_start_phone'); await shot('next_unlock_phone');
  for (const [w, h] of [[390, 844], [684, 716]]) { await t.p.setViewportSize({ width: w, height: h }); await t.sleep(600); await fitCheck(`site game box ${w} px`); }
  await t.p.setViewportSize({ width: 393, height: 852 }); await t.sleep(400);
  // Bond 2 on the phone: the party, then Wardrobe and Journal join with a new! tag
  await t.p.click('#gdLayer .gd-skip'); await quiet();
  await ev(() => window.__paw.S.dogs[0].bond.pts = 55); await t.pet(() => window.__paw.S.bond.level >= 2);
  ok(await t.until(() => !!document.querySelector('#modal .panel.fw-party #luOk'), null, 8000), 'phone: the Bond 2 party');
  await shot('bond2_party_phone');
  await t.p.click('#luOk'); await t.modalGone();
  ok(await t.until(() => [...document.querySelectorAll('#bar .act')].filter((b) => !b.hidden).length === 7, null, 4000), 'at Bond 2 all seven buttons show');
  ok(await ev(() => ['wardrobe', 'journal'].every((a) => !!document.querySelector(`#bar [data-act=${a}] .fw-newtag`)) && !document.querySelector('#bar [data-act=feed] .fw-newtag')), 'Wardrobe and Journal wear a new! tag');
  await t.p.click('#bar [data-act=wardrobe]'); await t.until(() => !document.getElementById('modal').hidden, null, 4000);
  ok(await ev(() => !document.querySelector('#bar [data-act=wardrobe] .fw-newtag') && !!document.querySelector('#bar [data-act=journal] .fw-newtag') && !window.__paw.S.fw.dockNew.wardrobe), 'a tap takes the tag off that button only');
  await t.closeX();
  await ev(() => window.__paw.fw.open(false)); await t.p.waitForSelector('#modal .fw-calpop');
  ok(await ev(() => { const p = document.querySelector('#modal .panel'), r = p.getBoundingClientRect(); return r.left >= -1 && r.right <= window.innerWidth + 1 && [...p.querySelectorAll('.fw-claim, #fwCalOk')].every((b) => b.getBoundingClientRect().height >= 44); }), 'phone: the calendar sheet fits, its buttons are 44 px or taller');
  await shot('calendars_phone');
  await t.closeX();
  // the "..." menu reaches the calendar at any Bond (the Journal button may still be hidden)
  await ev(() => document.getElementById('moreBtn').click()); ok(await t.until(() => !!document.getElementById('mmCal'), null, 3000), 'the phone menu has a Calendar button');
  await t.p.click('#mmCal'); ok(await t.until(() => !!document.querySelector('#modal .fw-calpop'), null, 3000), 'which opens the calendar'); await t.closeX();
  await t.ctx.close();

  sec('10. phones: an old save at Bond 1 keeps every button');
  await t.boot({ device: 'iPhone 15' }); await t.adopt({ sex: 'girl' });
  const j1 = await ev(() => { const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.fw; return JSON.stringify(s); });
  await t.ctx.close(); await t.mk({ device: 'iPhone 15', prefs: { fwTest: true }, storage: { pawhaven_proto_v1: j1 } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
  ok((await acts()) === 'feed,play,care,walk,wardrobe,journal,map', 'all seven buttons for a save from before v2.16 (' + (await acts()) + ')');
}, { timeout: 420000 });
