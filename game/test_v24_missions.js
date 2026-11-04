// v2.4 MISSIONS, Daily rhythm (one mission a Japan day): msRoll (one, seeded by date + first dog, never an everyday chore), progress from the act bus,
// 40 raw coins and a stamp each, the 7-stamp rewards (Astronaut Helmet, Rocket Ship, 150 coins + a Pupcake), a new day replaces an unfinished mission quietly,
// the popup, the yard clipboard, the Journal tab, old saves without S.missions.
// node game/run_tests.js v24_missions
require('./test_lib').run('v24_missions', async (t) => {
  const { ok, sec, ev, S, SH } = t;
  const p = () => t.p;
  const errs = () => t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  await t.newGame({ sex: 'boy' }, { bond: { level: 5, pts: 900 }, coins: 500, stats: { hunger: 30, happy: 70, energy: 60, clean: 90 }, inv: { food: { 'Basic Kibble': 6 } } });
  await t.home('yard'); await t.freezeMotion(true);

  sec('msRoll: one mission a day, seeded by the date and the first dog');
  let s = await S(); const today = s.missions.date, list = s.missions.list;
  ok(/^\d{4}-\d{2}-\d{2}$/.test(today) && today === await ev(() => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)) && list.length === 1, 'today (the Japan date): one mission ' + list.map((x) => x.id).join(', '));
  ok(list.every((x) => x.p === 0 && !x.done && x.n >= 1), 'it starts at p 0, not done');
  const picks = await ev(() => { const out = []; for (let i = 0; i < 60; i++) { const d = new Date(2026, 0, 1 + i); out.push(window.__paw.ms.pick(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`).map((x) => x.id)); } return out; });
  ok(picks.every((l) => l.length === 1), '60 days: always one');
  ok(picks.every((l) => !['feed2', 'pet', 'nap', 'scoop', 'mail'].includes(l[0])), '60 days: never an everyday chore (feed twice, pet, nap, scoop, a letter)');
  ok(new Set(picks.map((l) => l.join())).size > 8, 'the days differ: ' + new Set(picks.map((l) => l.join())).size + ' kinds');
  const again = await ev((d) => [window.__paw.ms.pick(d).map((x) => x.id).join(), window.__paw.ms.pick(d).map((x) => x.id).join()], '2026-03-14');
  ok(again[0] === again[1], 'same date and dog: the same one (' + again[0] + ')');
  const rr = await ev(() => [0, 1].map(() => { window.__paw.ms.roll(true); return window.__paw.S.missions.list.map((x) => x.id).join(); }));
  ok(rr[0] === rr[1], 'a forced re-roll of today gives the same one again');
  ok(await ev(() => { const S = window.__paw.S, l = S.missions.list.map((x) => x.id).join(); window.__paw.ms.roll(); return S.missions.list.map((x) => x.id).join() === l; }), 'a normal roll on the same day keeps the list');
  const other = await ev(() => { const S = window.__paw.S, id0 = S.dogs[0].id; S.dogs[0].id = id0 + 'x'; const l = window.__paw.ms.pick('2026-03-14').map((x) => x.id).join(); S.dogs[0].id = id0; return l; });
  ok(typeof other === 'string' && other.split(',').length === 1, 'another first dog rolls its own: ' + other);
  const gated = await ev(() => { const S = window.__paw.S, b = S.bond.level; S.bond.level = 1; S.dogs.forEach((d) => { d.bond.level = 1; }); const ids = new Set(); for (let i = 0; i < 80; i++) window.__paw.ms.pick('2025-05-' + i).forEach((x) => ids.add(x.id)); S.dogs.forEach((d) => { d.bond.level = b; }); return [...ids]; });
  ok(!gated.includes('walk_river') && !gated.includes('travel') && !gated.includes('cook'), 'Bond 1: no Riverside walk, no Dog Park, no cooking');

  sec('feeding twice completes feed2 (forced: the pool never picks it now) and pays 40 raw coins and a stamp');
  await ev(() => window.__paw.ms.force(['feed2']));
  ok(await t.until(() => { const b = document.querySelector('#msBtn'); return !!b && !b.hidden && b.dataset.done === '0' && b.textContent.trim() === '0/1'; }, null, 3000), 'top-bar clipboard (v2.16.1): 0/1');
  const feedOnce = async () => { await t.retryUntil(async () => { await ev(() => { window.__paw.S.stats.hunger = 30; window.__paw.feed('Basic Kibble'); }); }, (n) => (window.__paw.S.inv.food['Basic Kibble'] || 0) < n, await ev(() => window.__paw.S.inv.food['Basic Kibble']), { tries: 4, each: 4000 }); await t.until(() => window.__paw.S.missions.list[0].p >= 1 || false, null, 4000); };
  await feedOnce(); await t.until(() => window.__paw.S.missions.list[0].p === 1, null, 5000);
  s = await S(); ok(s.missions.list[0].p === 1 && !s.missions.list[0].done, 'one feed: 1/2');
  await t.until(() => !window.__paw.shop.busy && !document.querySelector('#toasts .toast'), null, 8000); await t.toasts(); // the feed finished and its toasts are gone
  const c0 = (await S()).coins;
  await feedOnce(); await t.until(() => !!window.__paw.S.missions.list[0].done, null, 6000);
  s = await S(); ok(!!s.missions.list[0].done && s.missions.list[0].p === 2, 'two feeds: feed2 done');
  ok(s.coins - c0 === 40, 'paid 40 raw coins (' + (s.coins - c0) + ')');
  ok(s.missions.stamps === 1, 'and stamped the card: 1 stamp');
  ok(await t.waitToast(/^Mission done: Feed twice\. \+40 coins and a crayon stamp\.$/), 'toast "Mission done: Feed twice. +40 coins and a crayon stamp."');
  ok(await t.until(() => { const b = document.querySelector('#msBtn'); return !!b && b.dataset.done === '1' && b.textContent.trim() === '1/1' && /1 of 1 done/.test(b.getAttribute('aria-label')); }, null, 3000), 'top-bar clipboard: 1/1');
  await t.until(() => !window.__paw.shop.busy && !document.querySelector('#toasts .toast'), null, 8000);
  await ev(() => { window.__paw.ms.act('feed', { name: 'Basic Kibble' }); }); ok((await S()).missions.stamps === 1, 'more actions: still 1 stamp');

  sec('the Missions popup and the top-bar clipboard (v2.16.1: it left the yard)');
  await t.until(() => !!document.querySelector('#msBtn:not([hidden])') && document.getElementById('modal').hidden, null, 4000);
  ok(await ev(() => !document.querySelector('#msCardG')), 'no clipboard in the yard scene');
  { const b = await p().locator('#msBtn').boundingBox(), c = await p().locator('#coins').boundingBox(); ok(b.height >= 44 && b.width >= 44 && Math.abs(b.y + b.height / 2 - (c.y + c.height / 2)) < 12 && b.x > c.x, `the clipboard sits next to the coins, 44 px or more (${Math.round(b.width)} x ${Math.round(b.height)})`); }
  await p().click('#msBtn');
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.ms-pop'), null, 4000), 'tapping the clipboard opens the popup');
  const pop = await ev(() => ({ li: [...document.querySelectorAll('.ms-pop .ms-list li')].map((l) => [l.className, l.textContent]), coins: document.querySelector('.ms-pop .ms-coins').textContent, stamp: document.querySelector('.ms-pop .ms-sline').textContent, card: !!document.querySelector('.ms-pop .ms-card svg'), sc: !!document.querySelector('.ms-pop .ms-stampcard svg') }));
  ok(pop.li.length === 1 && pop.li.every(([c]) => c === 'done'), 'one line, ticked');
  ok(/Feed .+ twice/.test(pop.li[0][1]), 'the feed line names the dog: ' + pop.li[0][1]);
  ok(/40 coins/.test(pop.coins) && /1 of 1/.test(pop.coins) && /^1 of 7/.test(pop.stamp) && /Every finished mission earns a stamp/.test(pop.stamp), 'coin line "1 of 1" and "1 of 7" stamps');
  ok(pop.card && pop.sc, 'checklist card and stamp card art');
  ok(![pop.coins, pop.stamp].concat(pop.li.map((x) => x[1])).some((x) => x.includes(';')), 'no semicolons');
  await SH('01_missions_popup');
  await t.closeX();

  sec('7 stamps: the Astronaut Helmet, then the Rocket Ship, then 150 coins and a Pupcake');
  const fullCard = async () => { await ev(() => { const S = window.__paw.S; S.missions.stamps = 6; window.__paw.ms.force(['bath']); window.__paw.ms.act('bath', {}); }); };
  await fullCard();
  s = await S(); ok(s.missions.stamps === 0 && s.missions.cards === 1 && s.missions.rewards.includes('Astronaut Helmet') && s.inv.clothes.includes('Astronaut Helmet'), 'card 1: stamps back to 0, cards 1, Astronaut Helmet owned');
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.ms-reward'), null, 6000), 'reward popup');
  await SH('02_reward_helmet');
  await p().click('#msWear'); await t.modalGone(); ok((await S()).outfit.head === 'Astronaut Helmet', 'Wear it: the helmet is on');
  await fullCard();
  s = await S(); ok(s.missions.cards === 2 && s.inv.houses.includes('Rocket Ship') && s.missions.rewards.includes('Rocket Ship'), 'card 2: the Rocket Ship');
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.ms-reward #msMove'), null, 6000) && await p().textContent('#msLater') === 'Later', 'popup with Move in / Later');
  await SH('03_reward_rocket');
  await p().click('#msMove'); await t.modalGone(); ok((await S()).house === 'Rocket Ship', 'Move in: living in the Rocket Ship');
  const c1 = (await S()).coins, pc = (await S()).inv.food.Pupcake || 0;
  await fullCard();
  s = await S(); ok(s.missions.cards === 3 && s.coins - c1 === 150 + 40 && (s.inv.food.Pupcake || 0) === pc + 1, 'card 3: +150 coins (and the mission\'s 40) and one Pupcake: ' + (s.coins - c1));
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.ms-reward'), null, 6000), 'popup');
  ok(await ev(() => /\+150 coins/.test(document.querySelector('#modal .ms-reward').textContent)), 'the popup says +150 coins');
  await t.closeX(); await t.modalGone();

  sec('a new day replaces an unfinished mission, quietly');
  await ev(() => { const S = window.__paw.S; window.__paw.ms.force(['bath']); S.missions.list[0].p = 0; S.missions.list[0].done = null; S.missions.date = '2020-01-01'; });
  await t.toasts();
  const nl = await ev(() => window.__paw.ms.today());
  s = await S(); ok(s.missions.date === today && nl.length === 1 && nl.every((x) => x.p === 0 && !x.done), 'today: one fresh mission');
  await t.sleep(300); ok(!(await t.toasts()).some((x) => /mission/i.test(x)), 'no message about the old ones');

  sec('the top-bar clipboard stays put round the scenes; the yard never draws one');
  await ev(() => window.__paw.go('bath')); ok(await t.untilMode('bath') && await ev(() => !document.querySelector('#msCardG') && !document.querySelector('#msBtn').hidden), 'bath: the top-bar clipboard, no scene clipboard');
  await t.home('yard'); ok(await t.until(() => !document.querySelector('#msCardG') && !!document.querySelector('#msBtn:not([hidden])'), null, 5000), 'back in the yard: still in the top bar only');

  sec('Journal Missions tab');
  await p().click('[data-act=journal]'); await p().waitForSelector('[data-jtab=missions], [data-tab=missions], .tabs button');
  const tabSel = await ev(() => { const b = [...document.querySelectorAll('#modal .tabs button')].find((x) => x.textContent.trim() === 'Missions'); if (b) b.click(); return !!b; });
  ok(tabSel && await t.until(() => !!document.querySelector('#modal .ms-body'), null, 4000), 'the Missions tab shows the card');
  ok(/^One mission a day\. The next one comes at .+ your time \(midnight in Japan\)\. Finished or not, tomorrow brings a fresh one\.$/.test(await ev(() => document.querySelector('#modal .ms-reset').textContent)), 'the reset line');
  await SH('04_journal_tab');
  await t.closeX();

  sec('old saves without S.missions load clean');
  const old = await ev(() => { const S = JSON.parse(JSON.stringify(window.__paw.S)); delete S.missions; return JSON.stringify(S); });
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: old } }); await p2.goto(require('./test_lib').URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
  await t.untilMode('yard'); await t.until(() => !!document.querySelector('#msBtn:not([hidden])'), null, 6000);
  const m2 = await t.ev(() => window.__paw.ms.today());
  ok(m2.length === 1, 'the mission rolls on the old save');
  ok(await t.ev(() => { const m = window.__paw.S.missions; return m.stamps === 0 && m.cards === 0 && Array.isArray(m.rewards); }), 'defaults: 0 stamps, 0 cards, no rewards');
  ok(errs().length === 0, 'no console errors ' + errs().slice(0, 3).join(' | '));
}, { prefs: { msTest: true } });
