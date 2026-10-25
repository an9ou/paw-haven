// v2.16 "First Week" (V216.md): the Bond thresholds and their quiet migration, Puppy's first day (the guided start), the next-unlock line,
// the Bond 2 party, the welcome week and the monthly calendar (rewards, the 80-coin cap, the new month), "see you tomorrow", the lighter phone dock.
// Everything but the thresholds needs prefs.fwTest under the harness. V216_SHOTS=1 also writes the release screenshots to docs/release/v2.16/.
const { run, URL } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.V216_SHOTS ? path.join(__dirname, '..', 'docs', 'release', 'v2.16') : null;
const TH = [0, 60, 180, 450, 700, 1000, 1400, 1900, 2500, 3200];

run('v216_first_week', async (t) => {
  const { ok, sec, ev } = t;
  // release screenshots: wait until the finite animations (the card's fade-in, sheets sliding up) are over
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(350); await t.until(() => !document.getAnimations().some((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity && !(a.effect.target && a.effect.target.closest && a.effect.target.closest('#fwConfetti'))), null, 2500); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
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
  await t.until(() => { const w = window.__paw.S.fw.wel; return !!w && w.days.length === 1; }, null, 4000); // the stamp comes from the 1 s tick
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
  await ev(() => window.__paw.saveNow()); await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
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
  ok(await t.until(() => window.__paw.fw.pawAt() > 0, null, 5000), 'then the dog does Paw (once the yard is calm)');
  ok(await t.until(() => { const fx = document.getElementById('dogFx'), a = document.querySelector('#dogArt svg'); return (fx && fx.classList.contains('tk-paw')) || (a && /pa-pose-paw/.test(a.getAttribute('class') || '')); }, null, 1500), 'and the Paw pose is on screen');
  await t.sleep(900); ok(await ev(() => { const fx = document.getElementById('dogFx'), a = document.querySelector('#dogArt svg'); return (fx && fx.classList.contains('tk-paw')) || (a && /pa-pose-paw/.test(a.getAttribute('class') || '')); }), 'and still held after about a second');
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
  ok(await ev(() => { const P = window.__paw, T = P.fw.items(); const bondOf = (r) => r.n ? (T[r.n] || 9) : 0; const all = []; for (let m = 1; m <= 12; m++) { const ym = '2026-' + String(m).padStart(2, '0'); [7, 24].forEach((n) => all.push(P.fw.reward('cal', n, ym))); } [3, 5].forEach((n) => all.push(P.fw.reward('wel', n))); return all.every((r) => bondOf(r) <= 2); }), 'every calendar and welcome gift is a Bond 1-2 item (Bond unlocks keep their meaning)');

  sec('7. the calendars: rewards, the 80-coin cap, a new month, days need not be in a row');
  await quiet();
  const ym = await ev(() => window.__paw.S.fw.cal.ym), mo = +ym.slice(5);
  await t.patch({ fw: { cal: { ym, days: Array.from({ length: 24 }, (_, i) => i + 1), got: [], coins: 0 } } });
  let coins0 = (await t.S()).coins;
  await ev(() => window.__paw.fw.open(false)); await t.p.waitForSelector('[data-fwclaim="cal:3"]');
  for (const n of [3, 7, 12, 18, 24]) { await t.p.click(`[data-fwclaim="cal:${n}"]`); await t.until((n) => !document.querySelector(`[data-fwclaim="cal:${n}"]`), n, 3000); }
  s = await t.S();
  const outfit = ['Knit Scarf', 'Cozy Hoodie', 'Tutu', 'Polka-dot Raincoat', 'Chef Hat', 'Yellow Raincoat', 'Sailor Collar', 'Cowboy Hat', 'Leaf Beret', 'Autumn Scarf', 'Pyjamas', 'Snowflake Snood'][mo - 1];
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
  s = await t.S(); ok(s.inv.toys.includes('Squeaky Duck') && s.inv.clothes.includes('Chef Hat') && s.fw.frames.name === 'Mochi', 'day 3 a toy (Squeaky Duck), day 5 an outfit (Chef Hat, Bond 2), day 7 a photo frame with the dog\'s name');
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

  sec('9. phones: the option C bar (Care, Walk, Map, More), its trays, the guide and the next-unlock line at 393, 390 and 684 px');
  await fresh({ device: 'iPhone 15' });
  const acts = () => ev(() => [...document.querySelectorAll('#bar .act')].filter((b) => b.getClientRects().length).map((b) => b.dataset.act).join(','));
  const popOpen = (k) => ev((k) => { const q = document.querySelector(`#bar .barpop[data-pop="${k}"]`); return !!q && !q.hidden; }, k);
  ok((await acts()) === 'caremenu,walk,map,more', 'phone bar: Care, Walk, Map, More (' + (await acts()) + ')');
  ok(await ev(() => { const bar = document.getElementById('bar').getBoundingClientRect(), b = [...document.querySelectorAll('#bar > .act')].map((x) => x.getBoundingClientRect()), w = b.map((r) => Math.round(r.width)); return b.length === 4 && Math.max(...w) - Math.min(...w) <= 2 && b.every((r) => r.height >= 76) && bar.height >= 90 && b[3].right <= window.innerWidth + 1; }), 'four equal big buttons, the bar about 92 px tall');
  ok(await ev(() => document.querySelector('#bar [data-act=caremenu] .ic svg') && /Care/.test(document.querySelector('#bar [data-act=caremenu]').textContent) && /More/.test(document.querySelector('#bar [data-act=more]').textContent)), 'Care (bath icon) and More (crayon dots) are labelled');
  ok(await cardAt('pet'), 'the first-day card shows on the phone');
  const fitCheck = async (label) => {
    const r = await ev(() => { const st = document.getElementById('stage').getBoundingClientRect(), cd = document.querySelector('#gdLayer .gd-card'), c = cd.getBoundingClientRect(), ring = document.querySelector('#gdLayer .gd-ring'), rr = ring && !ring.hidden ? ring.getBoundingClientRect() : null, bar = document.getElementById('bar').getBoundingClientRect(), bt = [...document.querySelectorAll('#gdLayer .gd-card .btn')].filter((b) => !b.hidden).map((b) => b.getBoundingClientRect());
      const hit = (a, b) => !!a && !!b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top, tgt = document.querySelector(ring && ring.dataset.for), tr = tgt ? tgt.getBoundingClientRect() : null;
      return { inX: c.left >= st.left - 1 && c.right <= st.right + 1, inY: c.top >= st.top - 1 && c.bottom <= st.bottom + 1, btn: bt.every((b) => b.height >= 44), sw: document.documentElement.scrollWidth <= window.innerWidth + 1, ring: !!rr, clearDock: c.bottom <= bar.top + 1, clearTarget: !hit(c, tr), shown: getComputedStyle(cd).visibility === 'visible' && !cd.hidden && /Rub|hello|Feed|Play|Walk/.test(cd.textContent) }; });
    ok(Object.values(r).every(Boolean), `${label}: Gerald's card shows its text inside the stage, clear of the ringed target and the bar, 44 px buttons, no sideways scroll ` + JSON.stringify(r));
  };
  await fitCheck('iPhone 15 (393 px)');
  ok(await ev(() => { const n = document.getElementById('fwNext'), h = document.getElementById('hud').getBoundingClientRect(), r = n.getBoundingClientRect(); return !n.hidden && r.top >= h.top && r.bottom <= h.bottom + 1 && /Bond 2: learns Paw/.test(n.textContent); }), 'phone: the next-unlock line sits inside the HUD, under the Bond meter');
  ok(await ev(() => document.getElementById('hud').getBoundingClientRect().height <= 104), 'the phone HUD stays about 100 px tall');
  await shot('guided_start_phone'); await shot('next_unlock_phone'); await shot('dock_c_yard');
  for (const [w, h] of [[390, 844], [684, 716], [360, 640]]) { await t.p.setViewportSize({ width: w, height: h }); await t.sleep(700); await fitCheck(`${w} x ${h}`); ok((await acts()) === 'caremenu,walk,map,more', `${w} px: the same four buttons`); }
  await t.p.setViewportSize({ width: 393, height: 852 }); await t.sleep(500);
  // the guide on the phone: pet, then Care is ringed, then Feed inside the Care tray, then the food
  await t.pet(() => window.__paw.S.guide.step >= 1); await cardAt('feed');
  ok(/tap Care, then Feed, then a food/i.test((await card()).txt), 'phone wording: Tap Care, then Feed, then a food');
  ok(await t.until(() => { const r = document.querySelector('#gdLayer .gd-ring'), b = document.querySelector('#bar [data-act=caremenu]').getBoundingClientRect(); if (!r || r.hidden) return false; const q = r.getBoundingClientRect(); return q.left <= b.left + 2 && q.right >= b.right - 2 && q.top <= b.top + 2; }, null, 4000), 'the feed step rings Care first');
  await shot('dock_c_guide_care');
  await t.p.locator('#bar [data-act=caremenu]').tap(); ok(await popOpen('caremenu'), 'Care opens its tray');
  ok(await ev(() => [...document.querySelectorAll('#bar .barpop[data-pop=caremenu] .act')].map((b) => b.dataset.act + ':' + b.textContent.trim()).join(',') === 'feed:Feed,play:Play,care:Bath & nap'), 'the Care tray: Feed, Play, Bath & nap');
  ok(await t.until(() => { const r = document.querySelector('#gdLayer .gd-ring'), b = document.querySelector('#bar [data-act=feed]').getBoundingClientRect(); if (!r || r.hidden) return false; const q = r.getBoundingClientRect(); return q.left <= b.left + 2 && q.right >= b.right - 2 && q.bottom >= b.bottom - 2; }, null, 4000), 'with the tray open the ring moves onto Feed');
  ok(await ev(() => { const p = document.querySelector('#bar .barpop[data-pop=caremenu]').getBoundingClientRect(), bar = document.getElementById('bar').getBoundingClientRect(); return p.bottom <= bar.top + 1 && p.left >= 0 && p.right <= window.innerWidth && [...document.querySelectorAll('#bar .barpop[data-pop=caremenu] .act')].every((b) => b.getBoundingClientRect().height >= 44); }), 'the tray sits above the bar, on screen, 44 px buttons');
  ok(await ev(() => +getComputedStyle(document.getElementById('gdLayer')).zIndex > +getComputedStyle(document.getElementById('bar')).zIndex), 'the guide layer sits over the open Care tray');
  await shot('dock_c_care');
  await t.p.locator('#bar [data-act=caremenu]').tap(); ok(!(await popOpen('caremenu')), 'Care again closes it');
  await t.p.locator('#bar [data-act=caremenu]').tap(); await t.p.touchscreen.tap(200, 300); ok(await t.until(() => document.querySelector('#bar .barpop[data-pop=caremenu]').hidden, null, 2000), 'a tap outside closes it');
  await t.dock('feed'); await t.p.locator('#bar [data-act=feed]').tap(); ok(await t.waitPop(true) && !(await popOpen('caremenu')), 'Feed opens the feed tray (and the Care tray folds away)');
  ok(await t.until(() => { const r = document.querySelector('#gdLayer .gd-ring'); return r && !r.hidden && /^#dock/.test(r.dataset.for); }, null, 3000), 'then the ring is on a food');
  await t.retryUntil(() => ev(() => { const b = document.querySelector('[data-food="Basic Kibble"]'); if (b) b.click(); }), () => window.__paw.S.guide.step >= 2); await t.waitPop(false); await t.calm();
  ok(await cardAt('ball'), 'the ball step');
  ok(/tap Care, then Play, then the Tennis Ball/i.test((await card()).txt), 'the phone wording follows the ring (Care, then Play)');
  await t.dock('play'); await t.p.locator('#bar [data-act=play]').tap(); await t.waitPop(true);
  await t.p.locator('[data-play="ball:Tennis Ball"]').tap(); await t.until(() => !!(window.__paw.bl && window.__paw.bl.on), null, 4000);
  await ev(() => window.__paw.bl.throwV(800, -600)); await ev(() => window.__paw.bl.sim(14));
  ok(await t.until(() => window.__paw.S.guide.step >= 3, null, 6000), 'ball play still works from the Care tray');
  await ev(() => window.__paw.bl.stop()); await t.untilMode('yard'); await t.calm(); await t.lu();
  await t.dock('care'); await t.p.locator('#bar [data-act=care]').tap(); ok(await t.until(() => !!document.querySelector('[data-care]'), null, 3000), 'Bath & nap opens the care tray'); await t.p.locator('#trayX').tap(); await t.waitPop(false);
  // Bond 2 on the phone: the party; More holds Wardrobe and Journal with new! tags until seen
  await t.p.click('#gdLayer .gd-skip'); await quiet();
  await ev(() => { const S = window.__paw.S; S.dogs[0].bond = { level: 1, pts: 55 }; S.fw.b2 = {}; S.inv.clothes = S.inv.clothes.filter((n) => n !== 'Bow Tie'); window.__paw.fw.bond(6); }); // petting gives Bond once per 2 minutes, and the first-day pet was just now // (ball play may have reached Bond 2 already: start the party over)
  ok(await t.until(() => !!document.querySelector('#modal .panel.fw-party #luOk'), null, 8000), 'phone: the Bond 2 party');
  await shot('bond2_party_phone');
  await t.p.click('#luOk'); await t.modalGone(); await quiet();
  ok(await ev(() => !!document.querySelector('#bar [data-act=more] .fw-newtag') && !document.querySelector('#bar [data-act=caremenu] .fw-newtag')), 'More wears a new! tag while something in it is unseen');
  await t.p.locator('#bar [data-act=more]').tap(); ok(await popOpen('more'), 'More opens its tray');
  ok(await ev(() => [...document.querySelectorAll('#bar .barpop[data-pop=more] .act')].map((b) => b.dataset.act).join(',') === 'wardrobe,journal' && ['wardrobe', 'journal'].every((a) => !!document.querySelector(`#bar [data-act=${a}] .fw-newtag`))), 'the More tray: Wardrobe and Journal, both new!');
  await shot('dock_c_more');
  await t.p.locator('#bar [data-act=wardrobe]').tap(); await t.until(() => !document.getElementById('modal').hidden, null, 4000);
  ok(await ev(() => !document.querySelector('#bar [data-act=wardrobe] .fw-newtag') && !!document.querySelector('#bar [data-act=journal] .fw-newtag') && !!document.querySelector('#bar [data-act=more] .fw-newtag') && !window.__paw.S.fw.dockNew.wardrobe), 'a tap takes the tag off that button only');
  await t.closeX();
  await t.dock('journal'); await t.p.locator('#bar [data-act=journal]').tap(); await t.p.waitForSelector('.panel.journal'); await t.closeX();
  ok(await ev(() => !document.querySelector('#bar .fw-newtag')), 'all seen: no tags left');
  // the calendar sheet scrolls to the whole month and its rewards; the footer button never covers them (393 x 852 and 360 x 640)
  for (const [w, h] of [[393, 852], [360, 640]]) {
    await t.p.setViewportSize({ width: w, height: h }); await t.sleep(400);
    await ev(() => window.__paw.fw.open(false)); await t.p.waitForSelector('#modal .fw-calpop');
    const r = await ev(() => { const p = document.querySelector('#modal .panel'), body = p.querySelector('.panel-body'), foot = p.querySelector('.foot').getBoundingClientRect(), pr = p.getBoundingClientRect();
      body.scrollTop = body.scrollHeight; const last = [...p.querySelectorAll('.fw-monp .fw-rew')].pop().getBoundingClientRect(), cap = p.querySelector('.fw-cap').getBoundingClientRect(), br = body.getBoundingClientRect();
      const mid = p.querySelector('.fw-mgrid li:last-child'); mid.scrollIntoView({ block: 'nearest' }); const mr = mid.getBoundingClientRect();
      return { fits: pr.left >= -1 && pr.right <= window.innerWidth + 1, scrolls: body.scrollHeight > body.clientHeight ? getComputedStyle(body).overflowY !== 'visible' : true, lastVisible: last.bottom <= foot.top + 1 && last.top >= br.top - 1, capVisible: cap.bottom <= foot.top + 1, gridEnd: mr.bottom <= foot.top + 1 && mr.top >= br.top - 1, bodyAboveFoot: br.bottom <= foot.top + 1, btns: [...p.querySelectorAll('.fw-claim, #fwCalOk')].every((b) => b.getBoundingClientRect().height >= 44) }; });
    ok(Object.values(r).every(Boolean), `${w} x ${h}: the calendar sheet scrolls to the last day and the last reward, the footer stays below them ` + JSON.stringify(r));
    if (w === 393) { await ev(() => { document.querySelector('#modal .panel .panel-body').scrollTop = 0; }); await shot('calendars_phone'); }
    await t.closeX();
  }
  await t.p.setViewportSize({ width: 393, height: 852 }); await t.sleep(300);
  // the "..." menu reaches the calendar
  await ev(() => document.getElementById('moreBtn').click()); ok(await t.until(() => !!document.getElementById('mmCal'), null, 3000), 'the phone menu has a Calendar button');
  await t.p.click('#mmCal'); ok(await t.until(() => !!document.querySelector('#modal .fw-calpop'), null, 3000), 'which opens the calendar'); await t.closeX();
  await t.ctx.close();

  sec('9b. a reload between the Bond 2 level-up and its card keeps the party');
  await fresh(); await t.p.click('#gdLayer .gd-skip'); await quiet(); await t.until(() => !!document.querySelector('#modal .fw-calpop'), null, 6000); await t.closeX(); await t.modalGone();
  await ev(() => { const P = window.__paw; P.S.dogs[0].bond = { level: 1, pts: 55 }; P.fw.open(false); }); await t.p.waitForSelector('#modal .fw-calpop'); // an open sheet: the level-up card waits
  await ev(() => { window.__paw.fw.bond(6); window.__paw.saveNow(); });
  ok(await ev(() => window.__paw.S.fw.b2pending[window.__paw.S.dog.id] === 1), 'the pending party is saved');
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
  ok(await t.until(() => !!document.querySelector('#modal .panel.fw-party #luOk'), null, 9000), 'after the reload the party shows on the calm yard');
  await t.p.click('#luOk'); ok(await t.until(() => window.__paw.fw.pawAt() > 0, null, 5000) && !(await ev(() => Object.keys(window.__paw.S.fw.b2pending).length)), 'with its Paw, and the flag is cleared');
  await t.ctx.close();

  sec('10. phones: an old save gets the same bar, desktop keeps seven buttons, other languages fit');
  await t.boot({ device: 'iPhone 15' }); await t.adopt({ sex: 'girl' });
  const j1 = await ev(() => { const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.fw; return JSON.stringify(s); });
  await t.ctx.close(); await t.mk({ device: 'iPhone 15', prefs: { fwTest: true }, storage: { pawhaven_proto_v1: j1 } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
  ok((await acts()) === 'caremenu,walk,map,more' && !(await ev(() => !!document.querySelector('#bar .fw-newtag'))), 'a save from before v2.16: the same four buttons, no new! tags (' + (await acts()) + ')');
  await t.p.setViewportSize({ width: 1280, height: 720 }); await t.sleep(600);
  ok((await acts()) === 'feed,play,care,walk,wardrobe,journal,map', 'wider than a phone the seven buttons come back (' + (await acts()) + ')');
  await t.ctx.close();
  for (const lang of ['zh-Hant', 'th']) {
    await t.boot({ device: 'iPhone 15', lang }); await t.adopt({ sex: 'girl' }); await t.sleep(800);
    const f = await ev(() => [...document.querySelectorAll('#bar .act')].filter((b) => b.getClientRects().length).every((b) => { const l = b.querySelector('span:not(.ic)'); return l.scrollWidth <= l.clientWidth + 1; }));
    ok(f, lang + ': the bar labels fit');
    await shot('dock_c_yard_' + lang);
    await ev(() => document.querySelector('#bar .act[data-act=caremenu]').click()); await t.sleep(300);
    ok(await ev(() => [...document.querySelectorAll('#bar .barpop[data-pop=caremenu] .act')].every((b) => { const r = b.getBoundingClientRect(); return r.right <= window.innerWidth && r.left >= 0; })), lang + ': the Care tray fits on screen');
    await t.ctx.close();
  }
}, { timeout: 420000 });
