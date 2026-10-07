// v2.5 FESTIVAL: the festival letters (once a year), the season greeting, leaf piles in the yard (jump, scatter, the raking cooldown, act:leafpile),
// the Harvest Stall in the Square (six foods and four clothes, buying fires buy shop:'stall', the food tip once, Warm Bone Broth keeps the dog warm),
// the costume parade (10 raw coins once a day, the Parade Rosette once a year, the walk), the perks (Leaf Beret + Autumn Scarf, Pumpkin Suit nap),
// the Journal line, and the gates: fest 'off', fest 'leaf', the real dates (2026-10-28 both, 2026-12-02 neither), old saves without S.fest.
// node game/run_tests.js v25_festival
const { URL } = require('./test_lib');
require('./test_lib').run('v25_festival', async (t) => {
  const { ok, sec, ev, S, SH } = t;
  const p = () => t.p;
  const errs = () => t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  const year = String(new Date(t.pageNow()).getFullYear());
  const idle = () => t.until(() => !window.__paw.shop.busy && !window.__paw.fest.walking, null, 8000);
  const msDone = (id) => ev((id) => { const m = window.__paw.S.missions.list.find((x) => x.id === id); return !!(m && m.done); }, id);

  await t.newGame({ sex: 'girl' }, { bond: { level: 6, pts: 700 }, coins: 2000, stats: { hunger: 40, happy: 50, energy: 80, clean: 90 } });
  await t.home('yard');

  sec('letters: Baker Bea (leaf festival) and Gerald (Halloween), once a year each');
  ok(await t.until(() => (window.__paw.S.mail || []).filter((m) => /^fest_/.test(m.id)).length === 2, null, 6000), 'two festival letters arrive');
  let s = await S();
  const bea = s.mail.find((m) => m.id === 'fest_leaf_' + year), ger = s.mail.find((m) => m.id === 'fest_halloween_' + year);
  ok(bea && bea.from === 'Baker Bea' && /^The leaf festival is on\. Leaf piles in the yard, and my stall is in the Square\. Pumpkin everything\.$/.test(bea.text), 'Baker Bea: the leaf festival letter');
  ok(ger && /Gerald/.test(ger.from) && /^Costume parade in the Square until the 31st\. I am going as a duck\.$/.test(ger.text), 'Gerald: the costume parade letter');
  ok(s.fest.letters.leaf === year && s.fest.letters.halloween === year, 'S.fest.letters holds this year for both');
  await t.home('house'); await t.home('yard'); await t.until(() => window.__paw.fest.pending === 0, null, 6000);
  ok((await S()).mail.filter((m) => /^fest_/.test(m.id)).length === 2, 'a second yard entry sends no new letter');

  sec('the season greeting: once per season per year');
  ok(await t.waitToast(/^Autumn: the leaves are turning\.$/, 5000), 'toast "Autumn: the leaves are turning."');
  ok((await S()).seasonSeen.autumn === year, 'S.seasonSeen.autumn = this year');
  await ev(() => window.__toasts.splice(0)); await t.home('house'); await t.home('yard'); await t.until(() => window.__paw.fest.pending === 0, null, 6000);
  ok(!(await t.toasts()).some((x) => /^Autumn:/.test(x)), 'no second greeting');

  sec('leaf piles: two in the yard, a tap makes the dog jump in');
  await ev(() => window.__paw.ms.force(['leafpile', 'stall', 'bath'])); await t.freezeMotion(true);
  const piles = await ev(() => [...document.querySelectorAll('#fsPilesG [data-pile]')].map((g) => g.dataset.state));
  ok(piles.length === 2 && piles.every((x) => x === 'full'), 'two full leaf piles in #fsPilesG');
  ok(await ev(() => !!document.querySelector('#fsPumpkinG')), 'the jack-o-lantern on the porch (Halloween)');
  ok(await ev(() => { const a = document.getElementById('decorG'), b = document.getElementById('fsPilesG'); return !!a && a.nextElementSibling === b; }), 'the piles are drawn right after the yard decorations');
  await idle(); await t.patch({ stats: { happy: 50 } }); let s0 = await S();
  await p().click('#fsPilesG [data-pile="0"] > rect.fs-hit', { force: true });
  ok(await t.until(() => window.__paw.fest.scattered.includes(0), null, 3000), 'the pile scatters');
  ok(await t.until(() => { const g = document.querySelector('#fsPilesG [data-pile="0"]'); return g && g.dataset.state === 'scattered'; }, null, 2000), 'pile 0 draws its scattered state');
  ok(await t.until(() => window.__paw.S.missions.list.find((x) => x.id === 'leafpile').done, null, 4000), 'act:leafpile fires (the "Jump in a leaf pile" mission is done)');
  s = await S(); ok(s.stats.happy >= s0.stats.happy + 5.5 && s.stats.happy <= s0.stats.happy + 6.01, `happy +6 (${s0.stats.happy} -> ${s.stats.happy})`);
  ok(s.bond.pts > s0.bond.pts, 'bond went up');
  ok(typeof s.fest.piles[0] === 'number' && s.fest.piles[0] <= s.gameMin, 'S.fest.piles[0] holds the game minute of the jump');
  ok(await ev(() => !!document.getElementById('bubble') && !document.getElementById('bubble').hidden && /^(Crunch\.|Again\.|Where did the leaves go\.)$/.test(document.getElementById('bubble').textContent)), 'a say line');
  await idle(); await ev(() => window.__toasts.splice(0));
  await p().click('#fsPilesG [data-pile="0"] > rect.fs-hit', { force: true });
  ok(await t.waitToast(/^The pile needs raking first\./, 3000), 'a second tap within 20 game minutes: the raking toast');
  ok(!(await ev(() => window.__paw.shop.busy)), 'and the dog stays put');
  await ev(() => { window.__paw.S.fest.piles[0] = window.__paw.S.gameMin - 21; });
  ok(await t.until(() => !window.__paw.fest.scattered.length, null, 5000), 'the pile is raked back after 4 s');
  await p().click('#fsPilesG [data-pile="0"] > rect.fs-hit', { force: true });
  ok(await t.until(() => window.__paw.fest.scattered.includes(0), null, 3000), '21 game minutes later the pile can be jumped again');
  await idle();
  ok(await ev(() => { const S = window.__paw.S, b = S.dogs.map((d) => d.born), a = window.__paw.fest.canJump(); S.dogs.forEach((d) => { d.born = new Date().toISOString().slice(0, 10); }); const c = window.__paw.fest.canJump(); S.dogs.forEach((d, i) => { d.born = b[i]; }); return a && !c; }), 'the leaf pile mission needs a dog of 3 months or more (only young puppies: not offered)');
  await SH('01_yard_piles');

  sec('Harvest Stall: in the Square during the festivals');
  await t.home('square');
  const sq = await ev(() => ({ stall: document.querySelector('#fsStallG') && document.querySelector('#fsStallG').dataset.kind, banner: !!document.querySelector('#fsBannerG'), btns: [...document.querySelectorAll('#placeBtns .btn')].map((b) => b.textContent), before: (() => { const a = document.getElementById('fsStallG'); return !!a && !!a.nextElementSibling && [...a.parentNode.children].indexOf(a) < [...a.parentNode.children].indexOf(document.getElementById('pack')); })(), spot: window.__paw.fest.packSpot() }));
  ok(sq.stall === 'halloween', 'the stall prop (halloween kind while Halloween is on)');
  ok(sq.banner, 'the parade banner');
  ok(sq.before, '#fsStallG sits before #pack');
  ok(sq.btns.join('|') === 'Town notice|Family Portrait|Harvest Stall|Costume parade|Go home', 'place buttons: ' + sq.btns.join(', '));
  ok(sq.spot && sq.spot[0] === 905 && sq.spot[1] === 470, 'Square pack spot 3 moves to 905,470 while the stall is up');
  await p().click('[data-fs=stall]');
  ok(await t.until(() => !!document.querySelector('#modal .panel.fs-stall .shopgrid'), null, 4000), 'the place button opens the stall sheet');
  const st = await ev(() => ({ bea: document.querySelector('.fs-bea').textContent, names: [...document.querySelectorAll('.fs-stall .sitem > b')].map((b) => b.textContent), tips: [...document.querySelectorAll('.fs-stall .sitem[data-cat=food] .sh-tip')].length }));
  ok(/Everything here is dog-safe\. Ask me anything, I will say pumpkin\./.test(st.bea), "Baker Bea's line");
  const FOODS = ['Baked Pumpkin Wedges', 'Sweet Potato Coins', 'Warm Bone Broth', 'Ghost Biscuits', 'Candy Corn Carrots', 'Monster Meatball'], CL = ['Leaf Beret', 'Autumn Scarf', 'Ghost Sheet', 'Pumpkin Suit'];
  ok(st.names.length === 10 && FOODS.concat(CL).every((n) => st.names.includes(n)), 'six foods and four clothes: ' + st.names.join(', '));
  ok(!st.names.includes('Parade Rosette'), 'no Parade Rosette (a parade reward)');
  ok(st.tips === 6, 'every food shows its safety tip');
  await SH('02_stall_sheet');
  s0 = await S();
  await p().click('[data-fsbuy="Ghost Biscuits"]'); await t.win(1);
  ok(await t.until(() => (window.__paw.S.inv.food['Ghost Biscuits'] || 0) === 1, null, 4000), 'bought 1 Ghost Biscuits');
  s = await S(); const paid = await msDone('stall');
  ok(paid, 'buy fires act:buy with shop "stall" (the Harvest Stall mission is done)');
  ok(s.coins === s0.coins - 9 + (paid ? 15 : 0), `9 coins (${s0.coins} -> ${s.coins}, mission +15)`);
  await p().waitForSelector('[data-fsbuy="Warm Bone Broth"]'); await p().click('[data-fsbuy="Warm Bone Broth"]'); await t.win(2);
  ok(await t.until(() => (window.__paw.S.inv.food['Warm Bone Broth'] || 0) === 2, null, 4000), 'bought 2 Warm Bone Broth');
  await p().waitForSelector('[data-fsbuy="Ghost Sheet"]'); await p().click('[data-fsbuy="Ghost Sheet"]'); await t.win();
  ok(await t.until(() => window.__paw.S.inv.clothes.includes('Ghost Sheet'), null, 4000), 'bought the Ghost Sheet');
  ok(await t.until(() => !!document.querySelector('#modal .confirm .yes'), null, 4000) && /Wear it/.test(await ev(() => document.querySelector('#modal .confirm .yes').textContent)), 'the "Wear it / Later" prompt');
  await p().click('#modal .confirm .yes');
  ok(await t.until(() => window.__paw.S.dog.outfit.body === 'Ghost Sheet', null, 3000), 'Wear it puts the Ghost Sheet on');
  ok(await ev(() => /Owned/.test([...document.querySelectorAll('.fs-stall .sitem')].find((x) => x.querySelector('b').textContent === 'Ghost Sheet').textContent)), 'the card now says Owned');
  await t.closeX();

  sec('feeding the new treats: the tip once, Warm Bone Broth keeps paws warm');
  await t.home('yard'); await idle(); await ev(() => window.__toasts.splice(0));
  const feed = async (n) => { const k = await ev((n) => window.__paw.S.inv.food[n], n); await t.retryUntil(async () => { await ev((n) => { window.__paw.S.stats.hunger = 30; window.__paw.feed(n); }, n); }, (a) => (window.__paw.S.inv.food[a.n] || 0) < a.k, { n, k }, { tries: 4, each: 4000 }); await idle(); };
  await feed('Ghost Biscuits');
  ok(await t.waitToast(/^Ghost Biscuits: Plain oats and plain yoghurt, nothing else\. Chocolate is never for dogs, it is poison to them\.$/, 4000), 'the Ghost Biscuits tip shows on the first feed');
  await feed('Warm Bone Broth'); await ev(() => window.__toasts.splice(0));
  s = await S(); ok(s.warmUntil >= s.gameMin + 55 && s.warmUntil <= s.gameMin + 61, `Warm Bone Broth sets S.warmUntil (${s.warmUntil} vs ${s.gameMin})`);
  ok(await ev(() => window.__paw.fest.warm()), 'isWarm() is true');
  await ev(() => { window.__paw.S.inv.food['Ghost Biscuits'] = 1; }); await feed('Ghost Biscuits');
  ok(!(await t.toasts()).some((x) => /^Ghost Biscuits:/.test(x)), 'the tip does not show again');

  sec('perks: Leaf Beret + Autumn Scarf fashion bonus, Pumpkin Suit nap in the Pumpkin Cottage');
  await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Leaf Beret', 'Autumn Scarf', 'Pumpkin Suit'); });
  await ev(() => { window.__paw.S.daily.outfit = true; window.__paw.shop.equip('Autumn Scarf'); window.__paw.S.daily.outfit = false; window.__toasts.splice(0); });
  const h0 = await ev(() => { window.__paw.S.stats.happy = 50; window.__paw.shop.equip('Leaf Beret'); return 50; }); // pinned well below the 100 cap, equipped in the same tick
  ok(await t.waitToast(/^Fashion bonus! \+10 Happiness\. Autumn chic\./, 3000), 'both on: the fashion bonus says +10');
  const h1 = (await S()).stats.happy; ok(h1 - h0 >= 9.5 && h1 - h0 <= 10.01, `happy +10 (${h0} -> ${h1}, the clock may tick a little)`);
  const nap = await ev(() => { const S = window.__paw.S, b = S.outfit.body, h = S.house; S.house = 'Pumpkin Cottage'; S.outfit.body = null; const a = window.__paw.shop.napRate(); S.outfit.body = 'Pumpkin Suit'; const c = window.__paw.shop.napRate(); S.house = 'Cardboard Box'; const d = window.__paw.shop.napRate(); S.outfit.body = null; const e = window.__paw.shop.napRate(); S.house = h; S.outfit.body = b; return [a, c, d, e]; });
  ok(Math.abs(nap[1] / nap[0] - 1.1) < 1e-9, `Pumpkin Suit in the Pumpkin Cottage: nap x1.1 (${nap[0]} -> ${nap[1]})`);
  ok(Math.abs(nap[2] - nap[3]) < 1e-9, 'in another house the suit changes nothing');

  sec('costume parade: once a day, 10 raw coins, the Parade Rosette once a year');
  await ev(() => window.__paw.ms.force(['parade', 'bath', 'nap']));
  await t.home('square'); await t.freezeMotion(false); await idle(); await t.lu();
  await p().click('[data-fs=parade]');
  ok(await t.until(() => document.querySelectorAll('#modal .fs-paradepop .fs-npc').length === 5, null, 4000), 'the parade sheet: five costumed dogs');
  const pd = await ev(() => ({ names: [...document.querySelectorAll('.fs-npc b')].map((b) => b.textContent), costumes: [...document.querySelectorAll('.fs-npc .small')].map((b) => b.textContent), you: document.querySelector('.fs-you b').textContent, banner: !!document.querySelector('.fs-paradepop .fs-banner svg'), join: document.getElementById('fsJoin').textContent }));
  ok(new Set(pd.names).size === 5, 'five different dogs: ' + pd.names.join(', '));
  ok(pd.costumes.every((c) => ['Ghost Sheet', 'Pumpkin Suit', 'Wizard Hat', 'Bumblebee Suit', 'Astronaut Helmet', 'Happi Coat'].includes(c)), 'costumes from the list: ' + pd.costumes.join(', '));
  const lu = await ev(() => ['2026-10-28', '2026-10-28', '2026-10-29'].map((d) => window.__paw.fest.paradeDogs(d).map((x) => x.name + '/' + x.costume).join()));
  ok(lu[0] === lu[1] && lu[0] !== lu[2], `the line-up is seeded by the date (same date: same dogs and costumes, the next day: a new line-up)`);
  ok(pd.banner && pd.join === 'Join the parade', 'the banner and "Join the parade"');
  await SH('03_parade_sheet');
  await t.patch({ stats: { happy: 50 } }); s0 = await S(); await ev(() => window.__toasts.splice(0));
  await p().click('#fsJoin');
  ok(await t.until(() => window.__paw.fest.walking && !!document.querySelector('#fsParadeG .fs-line'), null, 3000), 'the walk starts (fsActive is true)');
  ok(await ev(() => document.querySelectorAll('#fsParadeG .fs-pd').length === 6 && getComputedStyle(document.getElementById('dogPos')).visibility === 'hidden'), 'six dogs walk, the yard dog is hidden');
  ok(await t.until(() => { const l = document.querySelector('#fsParadeG .fs-line'), m = l && new DOMMatrix(getComputedStyle(l).transform); return !!m && m.e > 150 && m.e < 600; }, null, 5000) && await ev(() => window.__paw.fest.walking), 'mid-walk: the line has moved part of the way and is still walking');
  await SH('04_parade_walk');
  await ev(() => window.__paw.ms.act('bath', {}));
  ok(await ev(() => window.__paw.ms.queue > 0 && !window.__toasts.some((x) => /^Mission done/.test(x))), 'a mission finished during the walk: its toast waits (fsActive holds the queue)');
  ok(await t.until(() => !window.__paw.fest.walking, null, 9000), 'the walk ends');
  ok(await t.waitToast(/^Best in show: .+\. \+10 coins\.$/, 3000), 'toast "Best in show: {dog}. +10 coins."');
  ok(await t.waitToast(/^Mission done: Bath time\./, 4000), 'after the walk the held mission toast shows');
  ok(await t.until(() => !!document.querySelector('#modal .fs-rosette'), null, 6000), 'the first parade of the year: the Parade Rosette popup');
  s = await S();
  ok(s.inv.clothes.includes('Parade Rosette') && s.fest.parade.year === year && s.fest.parade.date === await ev(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }), 'the Rosette is owned, S.fest.parade holds the date and the year');
  const mPaid = s.missions.list.find((x) => x.id === 'parade').done, bPaid = s.missions.list.find((x) => x.id === 'bath').done;
  ok(mPaid, 'act:parade fires (the parade mission is done)');
  ok(s.coins === s0.coins + 10 + (mPaid ? 15 : 0) + (bPaid ? 15 : 0), `10 raw coins (${s0.coins} -> ${s.coins}, missions +15 each)`);
  ok(s.stats.happy >= s0.stats.happy + 9 && s.stats.happy <= s0.stats.happy + 10.01, `happy +10 (${s0.stats.happy} -> ${s.stats.happy})`);
  await SH('05_rosette');
  await p().click('#fsWear');
  ok(await t.until(() => window.__paw.S.dog.outfit.neck === 'Parade Rosette', null, 3000), 'Wear it: the Parade Rosette is on');
  ok(await t.until(() => { const b = document.querySelector('[data-fs=parade]'); return b && b.textContent === 'Paraded today' && b.getAttribute('aria-disabled') === 'true'; }, null, 3000), 'the button now reads "Paraded today"');
  await t.freezeMotion(true); s0 = await S();
  await ev(() => window.__paw.fest.paradeOpen()); await t.until(() => !!document.getElementById('fsJoin'), null, 3000);
  ok(await ev(() => document.getElementById('fsJoin').getAttribute('aria-disabled') === 'true'), 'the sheet: Join is disabled');
  await ev(() => document.getElementById('fsJoin').click()); ok(await t.waitToast(/^One parade a day is plenty\./, 3000), 'a kind no'); await t.closeX();
  ok((await S()).coins === s0.coins, 'a second parade the same day pays nothing');
  await ev(() => { window.__paw.S.fest.parade.date = '2000-01-01'; window.__toasts.splice(0); }); await t.home('square');
  await p().click('[data-fs=parade]'); await t.until(() => !!document.getElementById('fsJoin'), null, 3000); s0 = await S();
  await p().click('#fsJoin');
  ok(await t.waitToast(/^Best in show: /, 3000), 'the next day (motion off): the result comes at once');
  ok(await t.until((c) => window.__paw.S.coins === c + 10, s0.coins, 3000), 'the next day pays 10 again'); s = await S();
  ok(!(await ev(() => !!document.querySelector('#modal .fs-rosette'))), 'no second Rosette popup in the same year');

  sec('the Journal Food tab line');
  ok(/Harvest Stall in the Square until 30 November\./.test(await ev(() => window.__paw.fest.journal())), 'fsJournalLine: "Harvest Stall in the Square until 30 November."');
  await p().click('[data-act=journal]'); await t.until(() => !!document.querySelector('#modal .tabs'), null, 4000);
  await ev(() => { const b = [...document.querySelectorAll('#modal .tabs button')].find((x) => x.textContent.trim() === 'Food'); if (b) b.click(); });
  ok(await t.until(() => !!document.querySelector('#modal .fs-jline'), null, 3000), 'the Food tab shows the festival line');
  await t.closeX();
  ok(errs().length === 0, 'no console errors so far ' + errs().slice(0, 3).join(' | '));

  sec('old saves without S.fest load clean');
  const old = await ev(() => { const S = JSON.parse(JSON.stringify(window.__paw.S)); delete S.fest; delete S.seasonSeen; delete S.warmUntil; S.place = 'yard'; return JSON.stringify(S); });
  await t.ctx.close(); const p2 = await t.mk({ storage: { pawhaven_proto_v1: old } }); await p2.goto(URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue');
  await t.untilMode('yard'); await t.until(() => !!document.querySelector('#fsPilesG'), null, 6000);
  ok(await ev(() => { const f = window.__paw.S.fest; return !!f && ['letters', 'parade', 'piles', 'stall'].every((k) => f[k] && typeof f[k] === 'object') && typeof window.__paw.S.seasonSeen === 'object'; }), 'S.fest and S.seasonSeen get their defaults');
  ok(await ev(() => document.querySelectorAll('#fsPilesG [data-pile]').length === 2), 'the piles draw');
  ok(errs().length === 0, 'no console errors ' + errs().slice(0, 3).join(' | '));

  sec("fest 'off': no piles, no pumpkin, no stall, no banner, no letters");
  await t.ctx.close(); await t.newGame({ fest: 'off' }); await t.home('yard'); await t.until(() => window.__paw.fest.pending === 0, null, 6000);
  let g = await ev(() => ({ piles: !!document.querySelector('#fsPilesG'), pump: !!document.querySelector('#fsPumpkinG'), mail: window.__paw.S.mail.filter((m) => /^fest_/.test(m.id)).length, j: window.__paw.fest.journal() }));
  ok(!g.piles && !g.pump && g.mail === 0 && g.j === '', 'yard: nothing festive, no letters, no Journal line');
  await t.home('square');
  g = await ev(() => ({ stall: !!document.querySelector('#fsStallG'), banner: !!document.querySelector('#fsBannerG'), fs: document.querySelectorAll('[data-fs]').length, spot: window.__paw.fest.packSpot() }));
  ok(!g.stall && !g.banner && g.fs === 0, 'Square: no stall, no banner, no festival buttons');
  ok(g.spot[0] === 910 && g.spot[1] === 414, 'the Square pack spot stays at 910,414');
  ok(await ev(() => { window.__paw.fest.stallOpen(); return document.getElementById('modal').hidden; }), 'fsStallOpen does nothing but a kind toast');

  sec("fest 'leaf': piles and the leaf stall, no Halloween");
  await t.ctx.close(); await t.newGame({ fest: 'leaf' }); await t.home('yard');
  g = await ev(() => ({ piles: document.querySelectorAll('#fsPilesG [data-pile]').length, pump: !!document.querySelector('#fsPumpkinG') }));
  ok(g.piles === 2 && !g.pump, 'yard: two piles, no jack-o-lantern');
  await t.home('square'); await t.freezeMotion(true);
  g = await ev(() => ({ kind: document.querySelector('#fsStallG') && document.querySelector('#fsStallG').dataset.kind, banner: !!document.querySelector('#fsBannerG'), parade: !!document.querySelector('[data-fs=parade]'), items: window.__paw.fest.items() }));
  ok(g.kind === 'leaf' && !g.banner && !g.parade, 'Square: the leaf stall, no banner, no parade button');
  ok(g.items.join() === 'Baked Pumpkin Wedges,Sweet Potato Coins,Warm Bone Broth,Leaf Beret,Autumn Scarf', 'the stall: leaf treats only (' + g.items.join(', ') + ')');
  await SH('06_square_leaf');
  ok(await ev(() => { window.__paw.fest.paradeOpen(); return document.getElementById('modal').hidden; }), 'fsParadeOpen does nothing outside Halloween');

  sec("the real date: 2026-10-28 (fest 'auto') turns both on, 2026-12-02 neither");
  const at = async (date) => { await t.ctx.close(); t.clockOffset = new Date(date + 'T10:00:00').getTime() - Date.now(); await t.newGame({ fest: 'auto' }); await t.home('square'); return ev(() => ({ kind: document.querySelector('#fsStallG') && document.querySelector('#fsStallG').dataset.kind, banner: !!document.querySelector('#fsBannerG'), items: window.__paw.fest.items().length })); };
  for (const [d, k, n] of [['2026-10-23', 'leaf', 5], ['2026-10-24', 'halloween', 10], ['2026-10-28', 'halloween', 10], ['2026-10-31', 'halloween', 10], ['2026-11-01', 'leaf', 5], ['2026-11-30', 'leaf', 5], ['2026-12-01', null, 0]]) {
    g = await at(d); ok((g.kind || null) === k && g.banner === (k === 'halloween') && g.items === n, `${d}: ${k ? k + ' stall, ' + n + ' items' : 'no stall'}${k === 'halloween' ? ', the banner' : ''} (${JSON.stringify(g)})`);
  }
  g = await at('2026-12-02'); ok(!g.kind && !g.banner && g.items === 0, '2026-12-02: no stall, no banner');
  await t.home('yard'); ok(!(await ev(() => !!document.querySelector('#fsPilesG'))), '2026-12-02: no leaf piles');

  sec('the winter greeting once per winter: 2026-12-15, then 2027-01-05 on the same save');
  await t.ctx.close(); t.clockOffset = new Date('2026-12-15T10:00:00').getTime() - Date.now(); await t.newGame({ fest: 'auto', season: 'auto' }); await t.home('yard');
  ok(await t.waitToast(/^Winter: frost on the fence\.$/, 6000), '2026-12-15: "Winter: frost on the fence."');
  ok((await S()).seasonSeen.winter === '2026', 'S.seasonSeen.winter = 2026');
  const wsave = await ev(() => { window.__paw.saveNow(); return JSON.stringify(window.__paw.S); });
  await t.ctx.close(); t.clockOffset = new Date('2027-01-05T10:00:00').getTime() - Date.now();
  const p3 = await t.mk({ fest: 'auto', season: 'auto', storage: { pawhaven_proto_v1: wsave } }); await p3.goto(URL); await p3.waitForSelector('#tContinue'); await p3.click('#tContinue'); await t.untilMode('yard');
  await t.home('yard'); await t.until(() => window.__paw.fest.pending === 0, null, 6000);
  ok(!(await t.toasts()).some((x) => /^Winter:/.test(x)) && (await S()).seasonSeen.winter === '2026', '2027-01-05: no second winter greeting (January counts to the winter that began in 2026)');
  ok(errs().length === 0, 'no console errors ' + errs().slice(0, 3).join(' | '));
}, { fest: 'both', season: 'autumn', prefs: { msTest: true, fsTest: true } });
