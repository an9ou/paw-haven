// all_b (shard 2 of 5 of the old test_all.js): the market. Starts from a prepared save (bond 7, 1000 coins, standing in Market Street).
// Coverage: kibble shop, purchase window (summary, x5 quick pick, can't afford, Esc, arrow keys, backdrop), pantry, boutique + wear prompt,
// wardrobe popup, Barkitecture beds, Pip's Sprout Cart. (See the full checklist at the top of test_all_a.js.)
require('./test_lib').run('all_b', async (t) => {
  const { ok, sec, ev, S, buy, win } = t;
  sec('prepared save: bond 7, 1000 coins, at the market');
  await t.newGame({}, { coins: 1000 }); const p = t.p;
  await t.home('market'); ok((await t.mode()) === 'market' && (await S()).place === 'market', 'standing in Market Street');

  sec('market: kibble shop + purchase window');
  await p.click('#placeBtns [data-sh=kibble]'); await p.waitForSelector('[data-buy="Basic Kibble"]');
  let s = await S(); const k0 = s.inv.food['Basic Kibble'] || 0, coins0 = s.coins;
  await p.click('[data-buy="Basic Kibble"]'); await p.waitForSelector('.buyveil'); await p.click('[data-qq="5"]');
  await t.until(() => document.querySelector('.bb-in').value === '5');
  const sumTxt = (await p.textContent('.bb-sum')).replace(/\s+/g, ' ');
  ok(/You have [\d,]+ coins/.test(sumTxt) && /Total: [\d,]+ coins/.test(sumTxt) && /Coins left after: [\d,]+/.test(sumTxt) && /In bag: \d+/.test(sumTxt), 'purchase window summary: ' + sumTxt.trim());
  await t.SH('08a_buy_window'); await p.click('.bb-yes'); await p.waitForSelector('.buyveil', { state: 'detached' });
  s = await S(); const unit = coins0 - s.coins;
  ok((s.inv.food['Basic Kibble'] || 0) === k0 + 5 && unit > 0 && unit % 5 === 0, `bought 5 x Basic Kibble: bag ${k0} -> ${s.inv.food['Basic Kibble']}, coins ${coins0} -> ${s.coins}`);
  ok(await t.waitToast(/Bought 5 × Basic Kibble/), 'toast "Bought 5 × Basic Kibble"');
  // can't afford: Buy disabled, summary red; Esc cancels only the window
  await ev(() => { window.__paw.S.coins = 3; });
  await p.click('[data-buy="Basic Kibble"]'); await p.waitForSelector('.buyveil'); await p.click('[data-qq="10"]'); await t.until(() => document.querySelector('.bb-in').value === '10');
  ok(await p.locator('.bb-yes[disabled]').count() === 1 && await p.locator('.bb-sum.bad').count() === 1, "can't afford: red summary, Buy disabled"); await t.SH('08b_cant_afford');
  await p.keyboard.press('Escape'); ok(await t.until(() => !document.querySelector('.buyveil')), 'Esc cancels the window'); ok(await p.locator('#modal .panel').count() === 1, 'the shop stays open');
  await ev((c) => { window.__paw.S.coins = c; }, s.coins);
  // arrow keys: wait until the quantity box has its focus (the window focuses it ~30 ms after opening), THEN press, then read the real quantity from the Total line.
  await p.click('[data-buy="Basic Kibble"]'); await p.waitForSelector('.buyveil'); await t.until(() => document.activeElement === document.querySelector('.bb-in'));
  const unitPrice = await p.evaluate(() => +document.querySelector('.bb-unit').textContent.replace(/[^\d]/g, ''));
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  ok(await t.until((u) => { const m = /Total: ([\d,]+) coins/.exec(document.querySelector('.bb-sum').textContent); return !!m && +m[1].replace(/,/g, '') === 3 * u && document.querySelector('.bb-in').value === '3'; }, unitPrice), 'arrow keys change the quantity (1 -> 3: box shows 3, Total = 3 x ' + unitPrice + ')');
  await p.keyboard.press('ArrowLeft'); ok(await t.until((u) => { const m = /Total: ([\d,]+) coins/.exec(document.querySelector('.bb-sum').textContent); return !!m && +m[1].replace(/,/g, '') === 2 * u; }, unitPrice), 'ArrowLeft lowers it again (2)');
  const vb = await p.locator('.buyveil').boundingBox(); await p.mouse.click(vb.x + 12, vb.y + vb.height / 2);
  ok(await t.until(() => !document.querySelector('.buyveil')), 'window backdrop click cancels'); ok(await p.locator('#modal .panel').count() === 1, 'the shop stays open after the backdrop click');

  sec('market: pantry');
  await p.click('[data-tab=pantry]'); await p.waitForSelector('[data-buy="Oats"]');
  await buy('Oats', 5); await buy('Rice', 1); await buy('Egg', 1); await buy('Chicken', 1);
  s = await S(); ok(s.inv.pantry.oats >= 5 && s.inv.pantry.chicken >= 1, 'Kibble Corner pantry'); await t.SH('08_kibble'); await t.closeX();

  sec('market: boutique, wardrobe, beds, Pip');
  await p.click('#placeBtns [data-sh=boutique]'); await p.waitForSelector('[data-buy]');
  const cl = await p.locator('[data-buy]').first().getAttribute('data-buy'); await buy(cl, 1);
  await p.waitForSelector('.confirm .yes'); await p.click('.confirm .yes');
  ok(await t.until((cl) => window.__paw.S.inv.clothes.includes(cl), cl), 'Boutique: bought ' + cl); await t.closeX();
  await p.click('[data-act=wardrobe]'); ok(await p.waitForSelector('.ward').then(() => true), 'Wardrobe popup'); await t.SH('09_wardrobe'); await t.closeX();
  await p.click('#placeBtns [data-sh=builder]'); await p.waitForSelector('[data-btab=beds]'); await p.click('[data-btab=beds]'); await p.waitForSelector('[data-buy="Plaid Pillow"]');
  await buy('Plaid Pillow', 1); await p.waitForSelector('.confirm .yes'); await p.click('.confirm .yes');
  ok(await t.until(() => window.__paw.S.bed === 'Plaid Pillow'), 'Barkitecture Beds: bought + equipped'); await t.closeX();
  await p.click('#placeBtns [data-sh=sprout]'); ok(await p.waitForSelector('#modal .panel').then(() => true), "Pip's Sprout Cart popup");
  await p.click('[data-seed="spinach"]'); await win(1);
  ok(await t.until(() => (window.__paw.S.inv.seeds.spinach || 0) >= 1), 'Pip: bought spinach seeds'); await t.SH('10_pip'); await t.closeX();
});
