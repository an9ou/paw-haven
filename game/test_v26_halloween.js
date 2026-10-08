// v2.6 HALLOWEEN lane (V26.md section 7): Mrs. Plum's Pumpkin Patch Pop-up in the Square, open 8 Oct to 2 Nov 2026 (JST).
// 2026-10-20: the pop-up, its place button, the sheet (16 items in four sections with the 2026 tag), buying one of each category (coins, inventory,
// buy shop:'popup'), the decoration in the yard, the toy, the clothes with the tag in the Wardrobe, the food tip on first feed, the letter once,
// the Journal line. Kibble Corner, the Boutique and the Harvest Stall never list an `ed` item. The dates: 2026-11-02 open, 2026-11-03 and
// 2027-10-28 closed with the bought items still working and tagged, 2026-10-07 closed. festNow() in auto across the windows. An old v2.5 save loads.
// The tests never depend on the HW ART lane's art: they measure the game's own hit rects and data hooks.
// node game/run_tests.js v26_halloween
const { URL } = require('./test_lib');
// the item names come from the game's own tables (FOOD, TOYS, CLOTHES, HM_DECOR entries with ed: 2026), read once the page is up
let DECOR, FOODS, TOYS, CLOTHES, ALL, CAKE;
const OPTS = { fest: 'auto', season: 'autumn', date: '2026-10-20', prefs: { hwTest: true } };

require('./test_lib').run('v26_halloween', async (t) => {
  const { ok, sec, ev, S } = t;
  const p = () => t.p;
  const errs = () => t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  const square = async () => { await t.home('square'); await t.until(() => !!document.querySelector('#hwPopG'), null, 6000); };
  // reopen a saved game on another page date (the clock offset is read when the page is made)
  const reopen = async (date, json, o) => {
    await t.ctx.close(); t.clockOffset = new Date(date + 'T10:00:00').getTime() - Date.now();
    const pg = await t.mk(Object.assign({ storage: { pawhaven_proto_v1: json } }, o || {})); await pg.goto(URL); await pg.waitForSelector('#tContinue'); await pg.click('#tContinue');
    await t.untilMode('yard'); await t.calm(); await t.lu();
  };

  await t.newGame({ sex: 'girl' }, { coins: 3000, bond: { level: 1, pts: 0 }, stats: { hunger: 40, happy: 50, energy: 80, clean: 90 } });
  await t.home('yard');
  ALL = await ev(() => window.__paw.hw.items()); [DECOR, FOODS, TOYS, CLOTHES] = [0, 4, 8, 12].map((i) => ALL.slice(i, i + 4)); CAKE = FOODS[0];
  ok(ALL.length === 16, '16 edition items: ' + ALL.join(', '));

  sec('2026-10-20: the gate and the letter');
  ok(await ev(() => window.__paw.hw.on() && document.getElementById('modal').hidden !== undefined), 'hwOn() is true on 2026-10-20 (fest auto, the 2026 window)');
  ok(await t.until(() => (window.__paw.S.mail || []).some((m) => m.id === 'hw_popup_2026'), null, 6000), "Mrs. Plum's pop-up letter arrives");
  let s = await S(); const letter = s.mail.find((m) => m.id === 'hw_popup_2026');
  ok(/Mrs\. Plum/.test(letter.from) && letter.text === 'The Pumpkin Patch Pop-up is open in the Square until 2 November. Everything is made for this year only, so have a look.', 'the letter text');
  ok(s.hw.letter === '2026' && s.hw.seen === null, 'S.hw.letter = "2026", seen is still null');
  ok(await t.until(() => (window.__paw.S.mail || []).some((m) => m.id === 'fest_halloween_2026'), null, 6000) && (await S()).mail.find((m) => m.id === 'fest_halloween_2026').text === 'Costume parade in the Square until 2 November. I am going as a duck.', "Gerald's 2026 letter: the parade runs until 2 November");
  await t.home('house'); await t.home('yard'); await t.until(() => window.__paw.hw.pending === 0, null, 6000);
  ok((await S()).mail.filter((m) => m.id === 'hw_popup_2026').length === 1, 'a second yard entry sends no new letter');

  sec('the Square: the pop-up, its hotspot and the place button');
  await square();
  const sq = await ev(() => {
    const g = document.getElementById('hwPopG'), kids = [...g.parentNode.children], btns = [...document.querySelectorAll('#placeBtns .btn')].map((b) => b.textContent);
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
    return { before: kids.indexOf(g) < kids.indexOf(document.getElementById('pack')), afterStall: g.nextElementSibling === document.getElementById('bowlG'), btns, hit: r('#hwPopG > rect.fs-hit'), dog: r('#dogHit'), stall: r('#fsStallG > rect.fs-hit'), box: window.__paw.hw.popupBox() };
  });
  const ov = (a, b) => !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  ok(sq.before && sq.afterStall, '#hwPopG sits right before #bowlG (a snack bowl draws in front of it), before #pack');
  ok(sq.btns.join('|') === 'Town notice|Family Portrait|Harvest Stall|Costume parade|Pumpkin Patch|Go home', 'place buttons: ' + sq.btns.join(', '));
  ok(JSON.stringify(sq.box) === JSON.stringify([212, 344, 114, 105]), 'the desktop spot ' + JSON.stringify(sq.box));
  ok(!ov(sq.hit, sq.dog) && !ov(sq.hit, sq.stall), 'the hotspot is clear of #dogHit and the stall');
  await t.SH('01_square');
  await p().click('#hwPopG > rect.fs-hit', { force: true });
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.hw-pop'), null, 4000), 'a click on the pop-up opens the sheet');
  await t.closeX();
  await p().click('[data-hw=popup]');
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.hw-pop'), null, 4000), 'the place button opens the sheet');

  sec('the sheet: Mrs. Plum, four sections, 16 cards with the 2026 tag');
  const sh = await ev(() => ({
    plum: document.querySelector('.hw-plum').textContent, secs: [...document.querySelectorAll('.hw-sec')].map((e) => [e.dataset.sec, e.querySelector('h3').textContent, [...e.querySelectorAll('.sitem > b')].map((b) => b.firstChild.textContent)]),
    tags: [...document.querySelectorAll('.hw-pop .sitem > b .hw-tag')].map((x) => x.textContent), tips: document.querySelectorAll('.hw-pop .sitem[data-cat=food] .sh-tip').length, locks: document.querySelectorAll('.hw-pop .chip.lock').length,
    buys: document.querySelectorAll('.hw-pop [data-hwbuy]').length, foot: (document.querySelector('.hw-pop .hw-foot') || {}).textContent, seen: window.__paw.S.hw.seen
  }));
  ok(/^Mrs\. Plum: "Everything here is made for 2026 only\. When I pack up on 2 November, it is gone for good, but yours stays yours\."$/.test(sh.plum.trim()), "Mrs. Plum's line");
  ok(sh.secs.map((x) => x[1]).join('|') === 'Decorations|Treats|Toys|Clothes', 'four sections: ' + sh.secs.map((x) => x[1]).join(', '));
  ok(JSON.stringify(sh.secs.map((x) => x[2])) === JSON.stringify([DECOR, FOODS, TOYS, CLOTHES]), 'the 16 items, four per section');
  ok(sh.tags.length === 16 && sh.tags.every((x) => x === '2026'), 'every card has the 2026 tag');
  ok(sh.tips === 4, 'every treat shows its two-sentence tip');
  ok(sh.locks === 0 && sh.buys === 16, 'no bond locks at Bond 1: 16 Buy buttons');
  ok(sh.foot === 'Open until 2 November.', 'the footer: ' + sh.foot);
  ok(sh.seen === await ev(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }), 'S.hw.seen = the day the sheet was first opened');
  ok(sh.secs.every(([k, , ns]) => ns.length === 4) && ALL.every((n) => sh.secs.some((x) => x[2].includes(n))), 'every item of __paw.hw.items() has a card');
  await t.SH('02_sheet');

  sec('buying one of each category');
  const buy = async (n, q, sel) => {
    const c0 = (await S()).coins; await ev(() => window.__toasts.splice(0));
    await p().locator(`[data-hwbuy="${n}"]`).scrollIntoViewIfNeeded(); await p().click(`[data-hwbuy="${n}"]`); await t.win(q);
    return c0;
  };
  let c0 = await buy(CAKE, 3);
  s = await S(); ok(s.coins === c0 - 42 && s.inv.food[CAKE] === 3, `3 × ${CAKE}: coins ${c0} -> ${s.coins}, in bag ${s.inv.food[CAKE]}`);
  c0 = await buy('Squeaky Pumpkin');
  s = await S(); ok(s.coins === c0 - 45 && s.inv.toys.includes('Squeaky Pumpkin'), 'Squeaky Pumpkin: -45 coins, in S.inv.toys');
  ok(await t.waitToast(/Squeaky Pumpkin\. In the Play tray\.$/, 3000), 'toast "In the Play tray."');
  c0 = await buy('Witch Hat');
  ok(await t.until(() => { const c = document.querySelector('#modal .confirm'); return !!c && c.querySelector('.yes').textContent === 'Wear it' && c.querySelector('.no').textContent === 'Later'; }, null, 3000), 'the clothes ask "Wear it / Later"');
  await p().click('#modal .confirm .no'); await t.until(() => !document.querySelector('#modal .confirm'), null, 3000);
  s = await S(); ok(s.coins === c0 - 60 && s.inv.clothes.includes('Witch Hat') && s.outfit.head !== 'Witch Hat', 'Witch Hat: -60 coins, in S.inv.clothes, not worn (Later)');
  c0 = await buy('Jack-o-Lantern Trio');
  s = await S(); ok(s.coins === c0 - 120 && s.decor['Jack-o-Lantern Trio'] && s.decor['Jack-o-Lantern Trio'].out === true && /^\d{4}-\d\d-\d\d$/.test(s.decor['Jack-o-Lantern Trio'].got), 'Jack-o-Lantern Trio: -120 coins, S.decor { got, out: true }');
  ok(await t.waitToast(/^New for the yard: Jack-o-Lantern Trio!$/, 3000), 'toast "New for the yard: Jack-o-Lantern Trio!"');
  ok(await ev(() => window.__toasts.filter((x) => /Jack-o-Lantern Trio/.test(x)).length) === 1, 'one toast for a decoration, not two');
  const acts = await ev(() => window.__paw.hw.buys);
  ok(acts.length === 4 && acts.every((a) => a.shop === 'popup') && acts.map((a) => a.cat).join() === 'food,toys,clothes,decor' && acts[0].qty === 3 && acts[0].name === CAKE, 'buy fires with shop: "popup" (' + acts.map((a) => a.cat + ':' + a.name).join(', ') + ')');
  const own = await ev(() => ['Squeaky Pumpkin', 'Witch Hat', 'Jack-o-Lantern Trio'].map((n) => { const c = [...document.querySelectorAll('.hw-pop .sitem')].find((e) => e.querySelector('b').firstChild.textContent === n); return !!c && !!c.querySelector('.chip.own') && !c.querySelector('[data-hwbuy]'); }));
  ok(own.every(Boolean), 'toys, clothes and decorations are bought once (Owned)');
  ok(await ev((n) => /You have 3/.test([...document.querySelectorAll('.hw-pop .sitem')].find((e) => e.querySelector('b').firstChild.textContent === n).textContent), CAKE), 'the treat card says "You have 3"');
  await t.closeX();

  sec('the Journal line while open');
  ok(await ev(() => /Pumpkin Patch Pop-up in the Square until 2 November\./.test(window.__paw.fest.journal())), 'fsJournalLine carries the pop-up line');

  sec('the yard: the decoration, the toy, the clothes, the food tip');
  await t.home('yard');
  const dec = await ev(() => { const g = document.querySelector('#decorG [data-decor="Jack-o-Lantern Trio"]'), r = g && g.querySelector(':scope > rect'), d = document.getElementById('dogHit').getBoundingClientRect(), b = r && r.getBoundingClientRect(); return { g: !!g, ov: !!b && b.left < d.right && b.right > d.left && b.top < d.bottom && b.bottom > d.top, at: window.__paw.hw.spot().decor }; });
  ok(dec.g, 'the Jack-o-Lantern Trio is drawn in the yard (#decorG)');
  ok(!dec.ov, 'its tap rect is clear of #dogHit');
  ok(JSON.stringify(dec.at) === JSON.stringify({ 'Jack-o-Lantern Trio': [440, 528, 112, 67], 'Paper Bat Bunting': [646, 304, 204, 54], 'Friendly Scarecrow': [852, 262, 92, 130], 'Ghost Garland': [62, 226, 216, 65] }), 'the four decoration spots ' + JSON.stringify(dec.at));
  await t.SH('03_yard_decor');
  await p().click('#decorG [data-decor="Jack-o-Lantern Trio"] > rect', { force: true });
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .hm-decor-pop'), null, 3000), 'a tap opens its decor card (Put away)');
  ok(await ev(() => (document.querySelector('#modal .hm-decor-pop h2 .hw-tag, #modal .panel h2 .hw-tag') || {}).textContent === '2026'), 'the decor card title carries the 2026 tag');
  await t.closeX();
  // the toy: always in the Journal Toys tab; in the Play tray once the TOYS lane's module plays it (PawToys.supports)
  const sup = await ev(() => !!(window.PawToys && typeof window.PawToys.open === 'function' && (!window.PawToys.supports || window.PawToys.supports('Squeaky Pumpkin'))));
  await p().click('#bar [data-act=play]'); await t.waitPop(true);
  const card = await ev(() => { const c = document.querySelector('[data-play="toy:Squeaky Pumpkin"]'); return c ? { tag: !!c.querySelector('.hw-tag') } : null; });
  ok(sup ? !!card && card.tag : !card, sup ? 'the Squeaky Pumpkin is in the Play tray with the 2026 tag' : 'the Squeaky Pumpkin waits for the TOYS lane module (not in the Play tray yet)');
  await p().click('#bar [data-act=play]'); await t.waitPop(false);
  await ev(() => window.__paw.shop.wardrobe());
  ok(await t.until(() => !!document.querySelector('#modal [data-eq="Witch Hat"] .hw-tag'), null, 3000), 'the Witch Hat is in the Wardrobe with the 2026 tag');
  await p().click('#modal [data-eq="Witch Hat"]');
  ok(await t.until(() => window.__paw.S.outfit.head === 'Witch Hat', null, 3000), 'and it can be worn');
  await t.closeX();
  await ev(() => window.__toasts.splice(0)); await t.patch({ stats: { hunger: 40 } });
  await t.retryUntil(() => ev((n) => window.__paw.feed(n), CAKE), (n) => (window.__paw.S.inv.food[n] || 0) === 2, CAKE);
  const tip = await ev((n) => window.__paw.shop.tip(n, true), CAKE);
  ok(tip === "Plain pumpkin, oat flour and plain yoghurt, no sugar. Chocolate never goes in a dog's cake, it is poison to them." && await t.until((x) => window.__toasts.includes(x), CAKE + ': ' + tip, 4000), 'the first feed shows the tip');

  sec('Kibble Corner, the Boutique and the Harvest Stall never list an ed item');
  const names = () => ev(() => [...document.querySelectorAll('#modal .sitem > b')].map((b) => b.firstChild.textContent));
  const seen = [];
  for (const tab of ['food', 'toys']) { await ev(() => window.__paw.shop.shop('kibble')); await p().click(`#modal [data-tab=${tab}]`); await t.until((tb) => document.querySelector(`#modal [data-tab=${tb}][aria-selected=true]`), tab, 3000); seen.push(...await names()); }
  await t.closeX(); await ev(() => window.__paw.shop.shop('boutique')); seen.push(...await names()); await t.closeX();
  const stall = await ev(() => window.__paw.fest.items());
  ok(seen.length > 20 && !seen.some((n) => ALL.includes(n)), `Kibble Corner (food, toys) and the Boutique list none of the 16 (${seen.length} cards)`);
  ok(stall.length === 10 && !stall.some((n) => ALL.includes(n)), 'the Harvest Stall lists its 10 v2.5 items only');

  sec('festNow() in auto and hwShopOpen() across the dates (JST)');
  const at = await ev(() => {
    const R = Date, out = {};
    const probe = (iso) => { const T = R.parse(iso); window.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(T); } static now() { return T; } }; try { return [window.__paw.hw.on(), window.__paw.fest.items().length >= 10]; } finally { window.Date = R; } };
    // T03:00Z = noon in Japan; the edges at midnight JST (15:00Z the day before)
    [['2026-10-07T03:00:00Z'], ['2026-10-07T14:59:00Z'], ['2026-10-07T15:00:00Z'], ['2026-10-08T03:00:00Z'], ['2026-11-02T03:00:00Z'], ['2026-11-02T14:59:00Z'], ['2026-11-02T15:00:00Z'], ['2026-11-03T03:00:00Z'], ['2027-10-23T03:00:00Z'], ['2027-10-24T03:00:00Z'], ['2027-10-28T03:00:00Z'], ['2027-10-31T03:00:00Z'], ['2027-11-01T03:00:00Z']].forEach(([iso]) => { out[iso] = probe(iso); });
    return out;
  });
  const want = { '2026-10-07T03:00:00Z': [false, false], '2026-10-07T14:59:00Z': [false, false], '2026-10-07T15:00:00Z': [true, true], '2026-10-08T03:00:00Z': [true, true], '2026-11-02T03:00:00Z': [true, true], '2026-11-02T14:59:00Z': [true, true], '2026-11-02T15:00:00Z': [false, false], '2026-11-03T03:00:00Z': [false, false], '2027-10-23T03:00:00Z': [false, false], '2027-10-24T03:00:00Z': [false, true], '2027-10-28T03:00:00Z': [false, true], '2027-10-31T03:00:00Z': [false, true], '2027-11-01T03:00:00Z': [false, false] };
  for (const k of Object.keys(want)) ok(JSON.stringify(at[k]) === JSON.stringify(want[k]), `${k}: pop-up ${want[k][0] ? 'open' : 'closed'}, Halloween ${want[k][1] ? 'on' : 'off'} (${JSON.stringify(at[k])})`);

  sec('the event ends with the sheet open: it closes kindly, the pop-up and its button go');
  await square(); await ev(() => window.__paw.hw.open()); await t.until(() => !!document.querySelector('#modal .panel.hw-pop'), null, 3000);
  await ev(() => { window.__toasts.splice(0); const R = Date, T = R.parse('2026-11-03T03:00:00Z'); window.__R = R; window.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(T); } static now() { return T; } }; window.__paw.hw.tick(); });
  const end = await ev(() => ({ modal: document.getElementById('modal').hidden, pop: !!document.getElementById('hwPopG'), btn: !!document.querySelector('[data-hw]'), toasts: window.__toasts.slice() }));
  await ev(() => { window.Date = window.__R; });
  ok(end.modal && !end.pop && !end.btn, 'the sheet closed, no pop-up, no button');
  ok(end.toasts.includes('The pop-up has packed up. Thank you for visiting.'), 'toast "The pop-up has packed up. Thank you for visiting."');
  await ev(() => window.__paw.hw.tick()); await t.until(() => !!document.getElementById('hwPopG'), null, 3000);

  // a save that owns one of each category (patched: all four decorations, the four clothes, a toy, a treat)
  const json = await ev(() => { const S = JSON.parse(JSON.stringify(window.__paw.S)); ['Paper Bat Bunting', 'Friendly Scarecrow', 'Ghost Garland'].forEach((n) => { S.decor[n] = { got: '2026-10-20', out: true }; }); S.inv.clothes.push('Bat Wings'); S.inv.food['Frozen Yoghurt Ghosts'] = 2; S.place = 'yard'; return JSON.stringify(S); });

  for (const [date, open] of [['2026-11-02', true], ['2026-11-03', false], ['2027-10-28', false], ['2026-10-07', false]]) {
    sec(`${date}: the pop-up is ${open ? 'still open' : 'closed'}${open ? '' : ', bought items still work with the tag'}`);
    await reopen(date, json, OPTS);
    ok(await ev(() => window.__paw.hw.on()) === open, `hwOn() is ${open}`);
    await t.until(() => document.querySelectorAll('#decorG [data-decor]').length >= 4, null, 4000);
    ok(await ev(() => ['Jack-o-Lantern Trio', 'Paper Bat Bunting', 'Friendly Scarecrow', 'Ghost Garland'].every((n) => !!document.querySelector(`#decorG [data-decor="${n}"] > rect`))), 'the four decorations are in the yard');
    await t.home('square'); await t.sleep(300);
    const g = await ev(() => ({ pop: !!document.getElementById('hwPopG'), btn: !!document.querySelector('[data-hw]') }));
    ok(g.pop === open && g.btn === open, open ? 'the pop-up and its button are up' : 'no pop-up, no button');
    if (date === '2027-10-28') ok(await t.until(() => (window.__paw.S.mail || []).some((m) => m.id === 'fest_halloween_2027'), null, 6000) && (await S()).mail.find((m) => m.id === 'fest_halloween_2027').text === 'Costume parade in the Square until the 31st. I am going as a duck.', "Gerald's 2027 letter: until the 31st");
    if (!open) {
      await ev(() => window.__toasts.splice(0)); await ev(() => window.__paw.hw.open());
      ok(await ev(() => document.getElementById('modal').hidden || !document.querySelector('#modal .hw-pop')), 'the sheet does not open');
      ok(!(await ev(() => window.__paw.hw.journal())), 'no Journal line');
      ok(await ev(() => window.__paw.S.mail.filter((m) => /^hw_popup/.test(m.id)).length) === 1, 'no new letter');
      await ev(() => window.__paw.shop.wardrobe());
      ok(await t.until(() => ['Witch Hat', 'Bat Wings'].every((n) => !!document.querySelector(`#modal [data-eq="${n}"] .hw-tag`)), null, 3000), 'the Wardrobe still shows the clothes with the 2026 tag');
      await t.closeX(); await t.home('yard');
      await p().click('#bar [data-act=feed]'); await t.waitPop(true);
      ok(await ev(() => { const c = document.querySelector('[data-food="Frozen Yoghurt Ghosts"]'); return !!c && !!c.querySelector('.hw-tag'); }), 'the Feed tray shows the treat with the 2026 tag');
      await p().click('#bar [data-act=feed]'); await t.waitPop(false);
    }
  }

  sec('an old v2.5 save without S.hw loads clean');
  const old = JSON.parse(json); delete old.hw; old.mail = old.mail.filter((m) => !/^hw_/.test(m.id));
  await reopen('2026-10-20', JSON.stringify(old), OPTS);
  ok(await ev(() => { const h = window.__paw.S.hw; return !!h && 'letter' in h && 'seen' in h; }), 'S.hw gets its defaults');
  ok(await t.until(() => window.__paw.S.mail.some((m) => m.id === 'hw_popup_2026'), null, 6000), 'and the letter arrives (the old save never had one)');
  await square(); ok(await ev(() => !!document.querySelector('#hwPopG')), 'the pop-up is up');
  ok(errs().length === 0, 'no console errors ' + errs().slice(0, 3).join(' | '));
}, OPTS);
