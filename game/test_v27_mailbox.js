// v2.7 MAILBOX (owner addition): letters with coins or items wait for Collect, Collect all, one kind toast, paid exactly once,
// collected letters stay readable with a Collected stamp, pen-pal gift cards wait too, old saves never pay twice.
// node game/run_tests.js v27_mailbox
const { URL } = require('./test_lib');
require('./test_lib').run('v27_mailbox', async (t) => {
  const { ok, sec, ev, S } = t;
  const today = () => ev(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const ago = (n) => ev((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }, n);
  const txt = (sel) => ev((sel) => { const e = document.querySelector(sel); return e ? e.textContent.trim() : null; }, sel);
  const has = (sel) => ev((sel) => !!document.querySelector(sel), sel);
  const openMb = async (id) => { await ev((id) => window.__paw.openMailbox(id), id || null); await t.p.waitForSelector('.panel.mailbox .mbox'); };

  sec('new game, four letters (three carry a gift)');
  await t.newGame({}, { coins: 300 });
  const p = t.p;
  await t.until(() => !!window.__paw.S.mailGiftDay, null, 6000); // the daily gift lands first, then the test owns the mailbox
  await t.patch({ careGifts: { scarf: '2026-01-01' } }); // the Bond 3 scarf letter would win the roll
  await t.rnd(0.7); const seeds = await ev(() => window.__paw.shop.giftRoll()); await t.rnd(null);
  ok(seeds && seeds.gift && seeds.gift.cat === 'seeds' && seeds.gift.n === 2, 'a real seed parcel from the gift roll: ' + (seeds && seeds.gift && seeds.gift.item));
  const ids = await ev((seeds) => {
    const P = window.__paw, s = P.S; s.mail = []; s.inv.clothes = s.inv.clothes.filter((n) => n !== 'Knit Scarf');
    const a = P.mailPush({ kind: 'news', from: 'Paw Haven Post', title: 'The pumpkin patch is open', text: 'Come say hi in the Square.' });
    const b = P.mailPush(Object.assign({}, seeds, { id: 'mb_seeds' }));
    const c = P.mailPush({ kind: 'gift', id: 'mb_scarf', from: 'Mrs. Plum next door', title: 'A parcel from Mrs. Plum next door', text: 'I knitted too much again.', gift: { item: 'Knit Scarf', cat: 'clothes', n: 1 } });
    const d = P.mailPush({ kind: 'gift', id: 'mb_coins', from: 'Baker Bea', title: 'A little something from Baker Bea', text: '25 coins from the tip jar.', gift: { coins: 25 } });
    return [a.id, b.id, c.id, d.id];
  }, seeds);
  const s0 = await S(); const c0 = s0.coins, seedId = seeds.gift.id, seedN0 = (s0.inv.seeds || {})[seedId] || 0;
  ok(s0.mail.length === 4 && s0.mail.filter((m) => m.gift && !m.gift.claimed).length === 3, 'three gift letters wait, nothing paid on arrival');

  sec('opening a letter does not pay, Collect does');
  await p.click('#mailboxG', { position: { x: 40, y: 30 } }); await p.waitForSelector('.panel.mailbox .mbox');
  ok(await has('.mb-item.on[data-mail="mb_coins"]'), 'the newest letter (25 coins) opens first');
  ok((await S()).coins === c0, 'opening the gift letter pays nothing yet');
  ok(await txt('.letter [data-mbget]') === 'Collect', 'the letter shows a Collect button');
  ok(await txt('.letter .mb-gift') === '25 coins', 'the gift line names it: 25 coins');
  ok(await p.locator('.mb-item .mb-chip').count() === 3, 'the list marks the three letters that carry a gift');
  ok(await has('.mb-allbar [data-mball]') && await txt('.mb-allbar [data-mball]') === 'Collect all', 'Collect all shows at the top (3 letters with a gift)');
  ok(/^3 letters carry a gift\.$/.test(await txt('.mb-allbar span')), 'the bar line: 3 letters carry a gift.');
  const [bb, ab] = await ev(() => ['.letter [data-mbget]', '[data-mball]'].map((s) => { const e = document.querySelector(s); return { width: e.offsetWidth, height: e.offsetHeight }; })); // layout px (the desktop stage is scaled to the window)
  ok(bb.height >= 44 && bb.width >= 44 && ab.height >= 44, `buttons are at least 44 px (${Math.round(bb.width)}x${Math.round(bb.height)}, ${Math.round(ab.width)}x${Math.round(ab.height)})`);
  await ev(() => window.__toasts.splice(0));
  await p.click('.letter [data-mbget]'); await p.waitForSelector('.letter .mb-got');
  ok((await S()).coins === c0 + 25, 'Collect: +25 coins');
  ok(await t.waitToast(/^Collected 25 coins\. Thank you, Baker Bea!$/), 'toast: Collected 25 coins. Thank you, Baker Bea!');
  ok(await txt('.letter .mb-got') === 'Collected' && !(await has('.letter [data-mbget]')), 'the letter shows the Collected stamp instead of the button');
  ok(await txt('.letter .mb-text') === '25 coins from the tip jar.', 'the letter stays readable');
  ok(!(await has('.mb-item[data-mail="mb_coins"] .mb-chip')) && await p.locator('.mb-item .mb-chip').count() === 2, 'its Gift chip is gone, two left');
  ok(/^2 letters carry a gift\.$/.test(await txt('.mb-allbar span')), 'Collect all stays for the other two');
  await t.SH('01_collected');

  sec('never pay twice');
  ok(await ev(() => window.__paw.mbCollect(['mb_coins'])) === '' && (await S()).coins === c0 + 25, 'collecting the same letter again gives nothing');
  await t.closeX(); await t.modalGone(); await openMb('mb_coins');
  ok(await txt('.letter .mb-got') === 'Collected' && (await S()).coins === c0 + 25, 'reopened: still Collected, no coins');
  await p.locator('.mb-item[data-mail="mb_scarf"]').click(); await p.waitForSelector('.mb-item.on[data-mail="mb_scarf"]');
  ok(await txt('.letter .mb-gift') === 'A Knit Scarf' && await has('.letter [data-mbget]'), 'the scarf letter: A Knit Scarf, Collect');
  ok(!(await S()).inv.clothes.includes('Knit Scarf'), 'reading the scarf letter does not give the scarf');

  sec('Collect all');
  await ev(() => window.__toasts.splice(0));
  await p.click('[data-mball]'); await t.until(() => !document.querySelector('.mb-allbar') && !!document.querySelector('.letter .mb-got'), null, 4000);
  let s1 = await S();
  ok(s1.inv.clothes.includes('Knit Scarf'), 'the Knit Scarf is in the Wardrobe');
  ok(((s1.inv.seeds || {})[seedId] || 0) === seedN0 + 2, `+2 ${seeds.gift.item}`);
  ok(s1.coins === c0 + 25, 'coins unchanged (the coin letter was already collected)');
  const allTxt = `Collected a Knit Scarf and 2 × ${seeds.gift.item}. The Knit Scarf is in the Wardrobe. Thank you, neighbours!`;
  ok(await t.waitToast(new RegExp('^' + allTxt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')), 'one toast names everything: ' + allTxt);
  ok(s1.mail.every((m) => !m.gift || m.gift.claimed), 'every gift is collected');
  ok(!(await has('.mb-allbar')) && await p.locator('.mb-item .mb-chip').count() === 0, 'no Collect all bar and no Gift chips left');
  ok(s1.mail.find((m) => m.id === ids[0]).read === false, 'Collect all leaves the news letter unread (read marks are only for reading)');
  ok(await ev(() => window.__paw.mbCollect(['mb_scarf', 'mb_seeds'])) === '', 'Collect all again gives nothing');
  s1 = await S(); ok(((s1.inv.seeds || {})[seedId] || 0) === seedN0 + 2 && s1.inv.clothes.filter((n) => n === 'Knit Scarf').length === 1, 'items added exactly once');
  await t.SH('02_collect_all');
  await t.closeX(); await t.modalGone();

  sec('one gift letter: Collect, no Collect all');
  await ev(() => window.__paw.mailPush({ kind: 'gift', id: 'mb_one', from: 'the mail carrier', title: 'A little something from the mail carrier', text: '11 coins.', gift: { coins: 11 } }));
  await openMb('mb_one');
  ok(await has('.letter [data-mbget]') && !(await has('.mb-allbar')), 'a single gift: the Collect button, no Collect all bar');
  await p.click('.letter [data-mbget]'); await p.waitForSelector('.letter .mb-got');
  ok((await S()).coins === c0 + 25 + 11, '+11 coins');
  await t.closeX(); await t.modalGone();

  sec('pen-pal photo card (day 14): the 40 coins wait for Collect');
  const c2 = (await S()).coins;
  await t.patch({ rehomed: [{ id: 'pp1', name: 'Bean', key: 'corgi', sex: 'female', genes: s0.dog.genes, parents: null, family: { id: 'tanaka', name: 'the Tanakas', where: 'by the bakery' }, mix: null, sparkle: false, born: await ago(20), since: await ago(14) }], mailCards: { pp1: { n: 1, next: '2999-01-01', paid: {}, bday: 9 } } });
  await ev(() => window.__paw.mailTick());
  let s2 = await S(); const card = s2.mail.find((m) => m.id === 'pp_pp1_d14');
  ok(card && card.gift.coins === 40 && !card.gift.claimed && s2.coins === c2, 'the card arrives with 40 coins inside, nothing paid yet');
  await openMb('pp_pp1_d14');
  ok(await has('.letter.k-postcard [data-mbget]') && await txt('.letter .mb-gift') === '40 coins', 'the postcard shows 40 coins and Collect');
  await p.click('.letter [data-mbget]'); await p.waitForSelector('.letter .mb-got');
  ok((await S()).coins === c2 + 40, 'Collect: +40 coins');
  await ev(() => window.__paw.mailTick()); ok((await S()).coins === c2 + 40 && (await S()).mail.filter((m) => m.id === 'pp_pp1_d14').length === 1, 'ticks again: no second card, no second pay');
  await t.closeX(); await t.modalGone();

  sec('an old save (before v2.7): opened gift letters read as collected, never paid again');
  const day = await today();
  const old = await ev((day) => {
    window.__paw.saveNow(); const j = JSON.parse(localStorage.getItem('pawhaven_proto_v1'));
    delete j.mbCollectV27; j.coins = 500; j.mailGiftDay = day;
    j.mail = [
      { id: 'o_unread', kind: 'gift', from: 'Baker Bea', title: 'Old unread gift', text: '12 coins.', gift: { coins: 12 }, date: day, read: false },
      { id: 'o_paid', kind: 'gift', from: 'Mrs. Plum next door', title: 'Old opened gift', text: '30 coins.', gift: { coins: 30, claimed: true }, date: day, read: true },
      { id: 'o_odd', kind: 'gift', from: 'Pip the farmer', title: 'Old opened parcel', text: 'Seeds.', gift: { item: 'Carrot Seeds', cat: 'seeds', id: 'carrot', n: 2 }, date: day, read: true },
      { id: 'o_card', kind: 'postcard', from: 'Bean & the Tanakas', title: 'A photo from Bean', text: 'A photo.', gift: { coins: 40, claimed: true }, date: day, read: false },
      { id: 'o_news', kind: 'news', from: 'Paw Haven Post', title: 'News', text: 'Hello.', date: day, read: true }
    ];
    return JSON.stringify(j);
  }, day);
  await t.ctx.close();
  const p2 = await t.mk({ storage: { pawhaven_proto_v1: old } }); await p2.goto(URL); await p2.waitForSelector('#tContinue'); await p2.click('#tContinue'); await t.untilMode('yard');
  await t.sleep(1200); // the yard-enter mail tick has run
  let s3 = await S(); const m3 = (id) => s3.mail.find((m) => m.id === id);
  ok(s3.coins === 500, 'loading the old save pays nothing (' + s3.coins + ')');
  ok(!!s3.mbCollectV27 && s3.v === 1, 'the once-flag is set, S.v stays 1');
  ok(m3('o_paid').gift.claimed && m3('o_card').gift.claimed, 'gifts paid before v2.7 stay collected');
  ok(m3('o_odd').gift.claimed && ((s3.inv.seeds || {}).carrot || 0) === ((JSON.parse(old).inv.seeds || {}).carrot || 0), 'an opened letter with an unpaid gift counts as collected (no seeds handed out)');
  ok(!m3('o_unread').gift.claimed && s3.mail.length === 5, 'an unread old gift waits for Collect, no letter dropped');
  await openMb('o_paid');
  ok(await txt('.letter .mb-got') === 'Collected' && !(await has('.mb-allbar')), 'the opened old gift shows Collected, no Collect all (only one waits)');
  await openMb('o_card'); ok(await txt('.letter .mb-got') === 'Collected', 'the old pen-pal card shows Collected');
  await openMb('o_unread'); await t.p.click('.letter [data-mbget]'); await t.p.waitForSelector('.letter .mb-got');
  ok((await S()).coins === 512, 'Collect on the old unread gift: +12');
  await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.saveNow()); await t.p.reload(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.sleep(1000);
  s3 = await S();
  ok(s3.coins === 512 && s3.mail.every((m) => !m.gift || m.gift.claimed), 'after a reload: nothing paid again, everything still collected');
});
