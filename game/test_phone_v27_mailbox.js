// v2.7 MAILBOX on a phone (iPhone 13): Collect and Collect all in the bottom sheet, taps >= 44 px, text >= 15 px (captions 13),
// nothing pokes out sideways, the Collected stamp stays in view after a tap, coins and items added once.
// node game/run_tests.js phone_v27_mailbox
const run = require('./test_lib').run;
run('phone_v27_mailbox', async (t) => {
  const { ok, sec, ev, S } = t, device = 'iPhone 13';
  sec(device + ': new game, three gift letters');
  await t.newGame({ device }, { coins: 300, careGifts: { scarf: '2026-01-01' } });
  const p = t.p;
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', 'phone layout is on');
  await t.until(() => !!window.__paw.S.mailGiftDay, null, 6000);
  await ev(() => {
    const P = window.__paw, s = P.S; s.mail = []; s.inv.clothes = s.inv.clothes.filter((n) => n !== 'Knit Scarf');
    P.mailPush({ kind: 'news', from: 'Paw Haven Post', title: 'The pumpkin patch is open', text: 'Come say hi in the Square.' });
    P.mailPush({ kind: 'gift', id: 'mb_scarf', from: 'Mrs. Plum next door', title: 'A parcel from Mrs. Plum next door', text: 'I knitted too much again. A scarf for your dog. It is very long. Like my winters.', gift: { item: 'Knit Scarf', cat: 'clothes', n: 1 } });
    P.mailPush({ kind: 'gift', id: 'mb_coins2', from: 'the Okafor twins', title: 'A little something from the Okafor twins', text: 'We sold lemonade. Please accept our entire profits: 14 coins.', gift: { coins: 14 } });
    P.mailPush({ kind: 'gift', id: 'mb_coins', from: 'Baker Bea', title: 'A little something from Baker Bea', text: '25 coins from the tip jar. Someone wrote "for the good dog" on a napkin.', gift: { coins: 25 } });
  });
  const c0 = (await S()).coins;

  // the same sheet checks as test_phone_journal (taps, text sizes, no sideways poke-outs)
  const check = async (where) => {
    const r = await ev(() => {
      const pn = document.querySelector('#modal .panel'); if (!pn) return { err: 'no panel' };
      const pb = pn.getBoundingClientRect(), tap = [], small = [], wide = [];
      pn.querySelectorAll('button,[role=button],.mb-item').forEach((el) => { const b = el.getBoundingClientRect(); if (!b.width || !b.height) return; if (Math.min(b.width, b.height) < 43.5) tap.push(`${String(el.className).split(' ')[0]} ${Math.round(b.width)}x${Math.round(b.height)}`); });
      const w = document.createTreeWalker(pn, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || el.closest('svg')) continue; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue; const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
        const fs = parseFloat(cs.fontSize), cap = el.closest('.small,.pc-addr,.mb-ps') ? 13 : 15; if (fs < cap - 0.01) small.push(`${String(el.className).split(' ')[0]} ${fs}px "${n.nodeValue.trim().slice(0, 14)}"`); }
      pn.querySelectorAll('*').forEach((el) => { if (el.closest('.tabs')) return; const b = el.getBoundingClientRect(); if (!b.width || !b.height) return; if (b.right > pb.right + 2 || b.left < pb.left - 2) wide.push(String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).split(' ')[0]); });
      return { tap, small, wide, sx: document.documentElement.scrollWidth > window.innerWidth + 1 };
    });
    ok(!r.err && r.tap.length === 0, `${where}: taps >= 44 px${r.tap && r.tap.length ? ' -> ' + r.tap.slice(0, 6).join(' | ') : ''}`);
    ok(!r.err && r.small.length === 0, `${where}: text >= 15 px (captions 13)${r.small && r.small.length ? ' -> ' + r.small.slice(0, 6).join(' | ') : ''}`);
    ok(!r.err && r.wide.length === 0 && !r.sx, `${where}: nothing pokes out sideways${r.wide && r.wide.length ? ' -> ' + r.wide.slice(0, 6).join(' | ') : ''}`);
  };
  const inView = (sel) => ev((sel) => { const e = document.querySelector(sel); if (!e) return false; const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= window.innerHeight && b.width > 0; }, sel);
  const size = (sel) => ev((sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(), cs = getComputedStyle(e); return { w: b.width, h: b.height, fs: parseFloat(cs.fontSize) }; }, sel);

  sec(device + ': the mailbox sheet');
  await ev(() => window.__paw.openMailbox()); await p.waitForSelector('.panel.mailbox .mbox'); await t.sleep(250);
  ok(await ev(() => { const pn = document.querySelector('#modal .panel.mailbox'); const b = pn.getBoundingClientRect(); return b.left >= 0 && b.right <= window.innerWidth + 1; }), 'the mailbox is a sheet inside the screen');
  const all = await size('[data-mball]'), chip = await size('.mb-chip');
  ok(all && all.h >= 44 && all.w >= 44 && all.fs >= 15, `Collect all: ${all && Math.round(all.w)}x${all && Math.round(all.h)}, ${all && all.fs}px`);
  ok(chip && chip.fs >= 13, `the Gift chip caption is ${chip && chip.fs}px`);
  await p.locator('.letter [data-mbget]').scrollIntoViewIfNeeded();
  const get = await size('.letter [data-mbget]');
  ok(get && get.h >= 44 && get.w >= 44 && get.fs >= 15, `Collect: ${get && Math.round(get.w)}x${get && Math.round(get.h)}, ${get && get.fs}px`);
  await check('before Collect');

  sec(device + ': tap Collect');
  await p.locator('.letter [data-mbget]').tap(); await p.waitForSelector('.letter .mb-got');
  ok((await S()).coins === c0 + 25, 'Collect: +25 coins');
  ok(await t.waitToast(/^Collected 25 coins\. Thank you, Baker Bea!$/), 'the toast names it');
  ok(await t.until(() => { const e = document.querySelector('.letter .mb-got'); if (!e) return false; const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= window.innerHeight; }, null, 3000), 'the Collected stamp is in view after the tap');
  const got = await size('.letter .mb-got'); ok(got && got.fs >= 15, `the Collected stamp text is ${got && got.fs}px`);
  await check('after Collect');
  await t.SH('collected');

  sec(device + ': tap Collect all');
  await p.locator('[data-mball]').scrollIntoViewIfNeeded(); await p.locator('[data-mball]').tap();
  await t.until(() => !document.querySelector('.mb-allbar'), null, 4000);
  const s1 = await S();
  ok(s1.coins === c0 + 25 + 14 && s1.inv.clothes.includes('Knit Scarf'), 'Collect all: +14 coins and the Knit Scarf');
  ok(await t.waitToast(/^Collected 14 coins and a Knit Scarf\. The Knit Scarf is in the Wardrobe\. Thank you, neighbours!$/), 'one toast for both');
  ok(s1.mail.every((m) => !m.gift || m.gift.claimed) && await p.locator('.mb-chip').count() === 0, 'nothing left to collect');
  await check('after Collect all');
  await p.locator('.mb-item[data-mail="mb_scarf"]').scrollIntoViewIfNeeded(); await p.locator('.mb-item[data-mail="mb_scarf"]').tap(); await p.waitForSelector('.mb-item.on[data-mail="mb_scarf"]');
  ok(await inView('.mb-item.on') && await ev(() => document.querySelector('.letter .mb-got') && document.querySelector('.letter .mb-got').textContent === 'Collected'), 'reopening the scarf letter: Collected');
  ok((await S()).coins === c0 + 39 && (await S()).inv.clothes.filter((n) => n === 'Knit Scarf').length === 1, 'paid exactly once');
});
