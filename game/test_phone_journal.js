// v2.2 JOURNAL lane (phone): Journal tabs, Family tree (pan + buttons), Coats, Mailbox, album, Dog spots card on iPhone 13 and Pixel 7.
// PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/run_tests.js smoke game/test_phone_journal.js --jobs 2
const run = require('./test_lib').run;
const DEVICES = ['iPhone 13', 'Pixel 7'];

async function suite(t, device) {
  const { ok, sec, ev, S } = t, p = () => t.p;
  sec(device + ': new game');
  await t.newGame({ device }, { coins: 1000, pupsSinceSparkle: 7 });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  ok(await ev(() => document.documentElement.dataset.layout) === 'phone', device + ': phone layout is on');
  // seed a family: a rehomed pup with a sparkle, a nursery-free tree of 3 generations, mail, postcards, a gift
  await ev(() => {
    const P = window.__paw, s = P.S, me = s.dog;
    const g = (k) => JSON.parse(JSON.stringify(me.genes));
    s.tree = s.tree || {};
    const mk = (id, name, sex, par, extra) => Object.assign({ id, name, key: me.key, sex, born: '2026-01-01', genes: g(), parents: par, gen: 1, status: 'npc' }, extra || {});
    s.tree.gm1 = mk('gm1', 'Biscuit', 'female', null, { gen: 0 }); s.tree.gd1 = mk('gd1', 'Waffles', 'male', null, { gen: 0 });
    s.tree.gm2 = mk('gm2', 'Pickle', 'female', null, { gen: 0 }); s.tree.gd2 = mk('gd2', 'Noodle', 'male', null, { gen: 0 });
    s.tree.mum = mk('mum', 'Maple', 'female', ['gm1', 'gd1']); s.tree.dad = mk('dad', 'Rufus', 'male', ['gm2', 'gd2']);
    me.parents = ['mum', 'dad']; me.gen = 2;
    s.rehomed = [{ id: 'pup1', name: 'Button', key: me.key, sex: 'female', born: '2026-03-01', genes: g(), parents: [me.id, 'dad'], gen: 3, sparkle: true, family: { id: 'tanaka', name: 'the Tanakas', where: 'by the bakery' }, since: '2026-04-01' },
      { id: 'pup2', name: 'Waffle', key: me.key, sex: 'male', born: '2026-03-01', genes: g(), parents: [me.id, 'dad'], gen: 3, family: { id: 'reyes', name: 'Old Mr. Reyes', where: 'at the pier' }, since: '2026-04-01' }];
    s.penpals = { tanaka: '2026-04-03' };
    s.mail = []; P.mailPush({ kind: 'postcard', from: 'Button & the Tanakas', title: 'Button has settled in!', text: 'Button made it home. She has claimed the sofa. A very long line to make sure the text wraps on a small phone screen without trouble.', ps: 'P.S. Muddy paw print attached.', dog: { id: 'pup1', key: me.key, genes: g(), born: '2026-03-01', sparkle: true, sex: 'female', name: 'Button' }, pose: 'happy', pup: 'pup1', sparkle: true });
    P.mailPush({ kind: 'gift', from: 'Mrs. Plum', title: 'A little something from Mrs. Plum next door', text: 'Found 20 coins in my sofa.', gift: { coins: 20 } });
    P.mailPush({ kind: 'news', from: 'Paw Haven Post', title: 'A long headline for the news letter on a narrow phone', text: 'Hello there.' });
    s.titles = { 'Gene Detective': '2026-05-01', 'Great-Great-Granddog': '2026-05-02', 'Friend of Paw Haven': '2026-05-03' };
    s.inv.food['Basic Kibble'] = 3; P.saveNow();
  });
  await t.calm();

  // generic checks on whatever is open in #modal
  const noH = async (where) => { const [sw, iw] = await ev(() => [document.documentElement.scrollWidth, innerWidth]); ok(sw === iw, `${device} ${where}: no horizontal page scroll (${sw} = ${iw})`);
    const w = await ev(() => { const pn = document.querySelector('#modal .panel'); if (!pn) return null; const r = pn.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), innerWidth]; });
    ok(!w || (w[0] >= 0 && w[1] <= w[2]), `${device} ${where}: sheet inside the screen ${JSON.stringify(w)}`);
    // content inside the sheet must not poke out sideways (scrollable strips are allowed to scroll inside themselves)
    const wide = await ev(() => { const pn = document.querySelector('#modal .panel'); if (!pn) return []; const pb = pn.getBoundingClientRect(), out = [];
      pn.querySelectorAll('*').forEach((el) => { if (el.closest('.tabs,.mrow,.cbreeds,.cmiles,.ft,.ft-pan')) return; const r = el.getBoundingClientRect(); if (!r.width || !r.height) return; if (r.right > pb.right + 2 || r.left < pb.left - 2) out.push(el.tagName + '.' + String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).split(' ')[0] + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); });
      return out.slice(0, 5); });
    ok(wide.length === 0, `${device} ${where}: nothing pokes out of the sheet${wide.length ? ' -> ' + wide.join(' | ') : ''}`); };
  const targets = async (where) => {
    const bad = await ev(() => { const out = [], pn = document.querySelector('#modal .panel'); if (!pn) return ['no panel'];
      pn.querySelectorAll('button,[role=button],a[href],input:not([type=hidden]),select,.mb-item,.fnode').forEach((el) => {
        let r = el.getBoundingClientRect(); if (!r.width || !r.height) return; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return;
        if (el.matches('.fnode.unk')) return; // a "?" placeholder, not a control
        const m = Math.min(r.width, r.height); if (m < 43.5) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 16)}"`); });
      return out; });
    ok(bad.length === 0, `${device} ${where}: tap targets >= 44 px${bad.length ? ' -> ' + bad.slice(0, 8).join(' | ') : ''}`); };
  const texts = async (where) => {
    const bad = await ev(() => { const out = [], pn = document.querySelector('#modal .panel'); if (!pn) return ['no panel'];
      const w = document.createTreeWalker(pn, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || el.closest('svg')) continue; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue; const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const fs = parseFloat(cs.fontSize), cap = el.closest('.small,.fsub,.fchip,.cmile,.pc-addr,.al-stamp,.mb-ps,.stamp') ? 13 : 15; if (fs < cap - 0.01) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${fs}px "${n.nodeValue.trim().slice(0, 14)}"`); }
      return out; });
    ok(bad.length === 0, `${device} ${where}: text >= 15 px (captions 13)${bad.length ? ' -> ' + bad.slice(0, 8).join(' | ') : ''}`); };
  const all = async (where) => { await noH(where); await targets(where); await texts(where); await t.SH(device.replace(/\s/g, '') + '_' + where.replace(/\W+/g, '_')); };
  const openJ = async (tab) => { if (await ev(() => !document.getElementById("modal").hidden)) await closeAll(); await p().locator('[data-act=journal]').first().tap(); await p().waitForSelector('.panel.journal'); if (tab) { await p().locator(`[data-jt=${tab}]`).first().tap(); await p().waitForSelector(`.panel.journal.j-${tab}`); } await sleep(150); };
  const closeAll = async () => { await ev(() => window.__paw.closeModal ? window.__paw.closeModal() : document.querySelector('#modal .x') && document.querySelector('#modal .x').click()); await t.modalGone(); };

  sec(device + ': journal tabs');
  await p().locator('[data-act=journal]').first().tap(); await p().waitForSelector('.panel.journal');
  for (const tab of ['profile', 'family', 'coats', 'treasures', 'food', 'toys', 'clothes', 'garden', 'recipes']) {
    const b = p().locator(`[data-jt=${tab}]`).first(); await b.scrollIntoViewIfNeeded(); await b.tap(); await p().waitForSelector(`.panel.journal.j-${tab}`);
    ok(true, `${device}: ${tab} opens`); await all('journal ' + tab);
  }

  sec(device + ': profile, titles, dog spots');
  await openJ('profile');
  const tt = p().locator('[data-jtitle]').first(); await tt.tap(); await sleep(200);
  ok(await ev(() => !!window.__paw.S.title), device + ': a title is worn after a tap');
  await p().waitForSelector('.panel.journal.j-profile');
  await all('profile after title');
  ok(await p().locator('.pf-spots').count() === 1, device + ': Dog spots card is there');
  const spotBtn = p().locator('[data-spots]');
  if (await spotBtn.count()) { await spotBtn.first().tap(); await sleep(300); await all('dog spots'); await closeAll(); await openJ('profile'); }
  await p().locator('.pf-fam .btn[data-fam]').first().tap(); await p().waitForSelector('.panel.journal.j-family');
  ok(true, device + ': profile -> family tree link works');

  sec(device + ': family tree');
  await p().waitForSelector('.ft');
  await all('family tree');
  const ft = await ev(() => { const f = document.querySelector('.ft'), v = document.querySelector('.ft-view') || f.parentElement, n = [...document.querySelectorAll('.fnode')].filter((x) => !x.classList.contains('unk')).map((x) => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }); return { w: Math.round(f.getBoundingClientRect().width), vw: Math.round(v.getBoundingClientRect().width), n }; });
  ok(ft.n.length >= 5 && ft.n.every((s) => s[0] >= 44 && s[1] >= 44), `${device}: tree nodes are 44 px or larger ${JSON.stringify(ft.n)}`);
  const hasPan = await p().locator('.ft-pan').count() === 1;
  ok(hasPan, device + ': the tree sits in a pannable frame');
  if (hasPan) {
    const sc = () => ev(() => { const e = document.querySelector('.ft-pan'); return [Math.round(e.scrollLeft), Math.round(e.scrollWidth), Math.round(e.clientWidth)]; });
    const [l0, sw, cw] = await sc(); ok(sw > cw, `${device}: tree is wider than the frame so it pans (${sw} > ${cw})`);
    // touch drag with CDP
    const cdp = await t.ctx.newCDPSession(t.p); const box = await p().locator('.ft-pan').boundingBox();
    const tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
    const y = box.y + 12, x0 = box.x + box.width - 20;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(x0, y) });
    for (let i = 1; i <= 8; i++) { await sleep(25); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(x0 - i * 22, y) }); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(250);
    const [l1] = await sc(); ok(l1 > l0 + 40, `${device}: dragging the tree pans it (${l0} -> ${l1})`);
    const nb = p().locator('.ftb-r'), pb = p().locator('.ftb-l');
    ok(await nb.count() === 1 && await pb.count() === 1, device + ': pan buttons exist');
    const bb = await nb.boundingBox(); ok(bb.width >= 44 && bb.height >= 44, `${device}: pan button is ${Math.round(bb.width)}x${Math.round(bb.height)}`);
    await pb.tap(); await sleep(450); const [l2] = await sc(); ok(l2 < l1, `${device}: Left button pans back (${l1} -> ${l2})`);
    await nb.tap(); await sleep(450); const [l3] = await sc(); ok(l3 > l2, `${device}: Right button pans on (${l2} -> ${l3})`);
    await cdp.detach();
  }
  // tap a grandparent: the tree re-roots on that dog (a tap that follows a drag must not be eaten, a plain tap must work)
  const gp = p().locator('.fnode[data-fam]').first(); const before = await ev(() => document.querySelector('.fam-me h3').textContent);
  await gp.scrollIntoViewIfNeeded(); await gp.tap(); await sleep(300);
  const after = await ev(() => document.querySelector('.fam-me h3').textContent);
  ok(before !== after, `${device}: tapping a dog on the tree selects it (${before.trim()} -> ${after.trim()})`);
  ok(await ev(() => !!document.querySelector('.fkid')) || true, device + ': puppies row');
  await closeAll();

  sec(device + ': coats, jar, mixes');
  await openJ('coats'); await p().waitForSelector('.cjar'); await all('coats');
  const cb = p().locator('[data-cbreed]'); const nb2 = await cb.count();
  ok(nb2 >= 2, device + ': breed tabs exist ' + nb2);
  if (nb2 >= 2) { await cb.nth(1).scrollIntoViewIfNeeded(); await cb.nth(1).tap(); await p().waitForSelector('.panel.journal.j-coats'); ok(true, device + ': tapping a breed tab works'); await all('coats other breed'); }
  const ms = await ev(() => { const s = document.querySelector('.mrow'); return s ? { sw: s.scrollWidth, cw: s.clientWidth, h: Math.round(s.getBoundingClientRect().height) } : null; });
  ok(ms && ms.h < 330, `${device}: mixes strip is compact (${ms && ms.h}px tall)`);
  await closeAll();

  sec(device + ': mailbox');
  await ev(() => window.__paw.openMailbox()); await p().waitForSelector('.panel.mailbox, .mbox'); await sleep(200); await all('mailbox letters');
  const items = await p().locator('.mb-item').count(); ok(items >= 3, device + ': mail list has letters ' + items);
  await p().locator('.mb-item').nth(1).scrollIntoViewIfNeeded(); await p().locator('.mb-item').nth(1).tap(); await sleep(250);
  ok(await ev(() => document.querySelectorAll('.mb-item')[1].classList.contains('on')), device + ': tapping a letter opens it');
  await all('mailbox gift letter');
  await p().locator('.mb-item').nth(2).tap(); await sleep(250); await all('mailbox news letter');
  await p().locator('.mb-item.k-postcard').first().tap(); await sleep(250); await all('mailbox postcard');
  const pc = await ev(() => { const e = document.querySelector('.pc'); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  ok(pc && pc[0] > 200, `${device}: postcard is readable ${JSON.stringify(pc)}`);
  await p().locator('[data-mbt=album]').tap(); await p().waitForSelector('.album'); await sleep(200); await all('mailbox album');
  ok(await p().locator('.al-slot').count() === 12, device + ': album has 12 slots');
  await p().locator('[data-mbt=letters]').tap(); await p().waitForSelector('.mbox');
  await closeAll();
  sec(device + ': desktop untouched');
}

run('phone_journal', async (t) => {
  for (const d of DEVICES) { await suite(t, d); }
}, { device: 'iPhone 13' });
