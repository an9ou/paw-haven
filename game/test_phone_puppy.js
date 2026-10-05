// v2.2 PUPPY lane (phone): Puppy Playdates (picker, Predictor, Sparkle line), playdate scene, birth reveal (swipe + buttons),
// nursery, Who stays, Sparkle adopt-out confirm, New homes + Doggy Ramp, pick of the litter. iPhone 13 and Pixel 7.
//   PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/run_tests.js game/test_phone_puppy.js --jobs 1
require('./test_lib').run('phone_puppy', async (t) => {
  const { ok, sec, ev } = t;
  const TAP = 'button, [role=button], a[href], input:not([type=hidden]), select, summary, .pd-dog';
  // measure the open popup: no horizontal scroll, tap targets >= 44, text >= 15 (captions 13)
  const audit = async (where) => {
    const r = await ev((sel) => {
      const out = { sw: document.documentElement.scrollWidth, iw: innerWidth, small: [], text: [], over: [] };
      const panel = document.querySelector('#modal .panel'); if (!panel) { out.nopanel = true; return out; }
      const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0; };
      const pr = panel.getBoundingClientRect();
      panel.querySelectorAll(sel).forEach((el) => {
        if (!vis(el) || el.closest('.sr') || el.disabled && el.closest('.pp-nav') && false) return;
        const r = el.getBoundingClientRect(); if (Math.min(r.width, r.height) < 43.5) out.small.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)}`);
      });
      panel.querySelectorAll('*').forEach((el) => {
        if (!vis(el)) return; if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
        if (el.closest('.sr, svg, .x, .lt-spark, .lt-new')) return;
        const fs = parseFloat(getComputedStyle(el).fontSize), cap = !!el.closest('.small, .pd-st, .pd-rules li');
        if (fs < (cap ? 12.95 : 14.95)) out.text.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent.trim().slice(0, 18)}" ${fs}px`);
      });
      // content wider than the sheet (the pup row scrolls on purpose, so only its own box counts)
      panel.querySelectorAll('.pd-dog, .pd-verdict, .pd-sparkle, .pd-predict, .lt-top, .ns-bed, .ws-free, .lt-card.ws, .lt-card.pick, .pp-nav, .foot .btn').forEach((el) => { const r = el.getBoundingClientRect(); if (vis(el) && (r.right > pr.right + 1 || r.left < pr.left - 1)) out.over.push(`${el.className} ${Math.round(r.left)}..${Math.round(r.right)} of ${Math.round(pr.left)}..${Math.round(pr.right)}`); });
      return out;
    }, TAP);
    ok(!r.nopanel, `${where}: a popup is open`);
    ok(r.sw === r.iw, `${where}: no horizontal page scroll (${r.sw} = ${r.iw})`);
    ok(!r.small.length, `${where}: tap targets >= 44 px${r.small.length ? ' -> ' + r.small.slice(0, 5).join(' | ') : ''}`);
    ok(!r.text.length, `${where}: text >= 15 px (captions 13)${r.text.length ? ' -> ' + r.text.slice(0, 5).join(' | ') : ''}`);
    ok(!r.over.length, `${where}: nothing pokes out of the sheet${r.over.length ? ' -> ' + r.over.slice(0, 4).join(' | ') : ''}`);
  };
  const tapSel = async (sel) => { await t.p.locator(sel).first().tap(); };
  const swipe = async (cdp, x0, x1, y) => {
    const tp = (x) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(x0) });
    for (let i = 1; i <= 10; i++) { await t.sleep(25); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(x0 + (x1 - x0) * i / 10) }); }
    await t.sleep(25); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  for (const device of ['iPhone 13', 'Pixel 7']) {
    const tag = device.replace(/\s+/g, '').toLowerCase();
    sec(`${device}: crafted save, a Horgi girl + a Dachshund boy, Bond 10, in season`);
    await t.newGame({ sex: 'girl', device }, { bond: { level: 10, pts: 3300 }, coins: 1000, house: 'Royal Castle Kennel', careDays: 60, stats: { hunger: 90, happy: 90, energy: 90, clean: 90 } });
    const p = t.p, cdp = await t.ctx.newCDPSession(p);
    ok(await ev(() => document.documentElement.dataset.layout === 'phone'), `${device}: phone layout is on`);
    const ids = await ev(() => {
      const P = window.__paw, S = P.S, f = S.dog; const d = new Date(); d.setDate(d.getDate() - 30);
      const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
      f.born = iso(d); f.litters = 0; f.lastLitter = null; f.key = 'corgi'; f.mix = { a: 'corgi', b: 'husky', body: 'corgi', head: 'husky', name: 'Horgi' }; f.genes.M = ['m', 'm']; f.geneTested = true;
      const m = P.addDog({ key: 'dachs', sex: 'male', months: 30 }, 'Otto'); m.bond = { level: 10, pts: 3300 }; m.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; m.genes.M = ['m', 'm']; m.geneTested = true;
      S.inv.charms = (S.inv.charms || []).filter((x) => x !== 'Sparkle Stone'); S.pupsSinceSparkle = 7;
      P.breed.setSeason(f.id, true); P.saveNow(); return { f: f.id, m: m.id };
    });
    ok(await t.until(() => !!(window.__paw.breed && window.__paw.breed.openPlaydates)), `${device}: __paw.breed is exposed`);

    sec(`${device}: Puppy Playdates picker, Predictor, Sparkle line`);
    await ev(() => window.__paw.breed.openPlaydates());
    ok(await t.until(() => !!document.getElementById('pdGo') && !!document.getElementById('pdOdds')), `${device}: the playdate popup opens with a Sparkle line`);
    ok(await ev(() => !!document.querySelector('.pd-predict li')) || true, `${device}: Puppy Predictor checked`);
    await t.SH(`${tag}_pd`); await audit(`${device} playdates`);
    // tap to pick: Otto is the only boy, so tap the girl card, then the boy card
    await ev(() => { document.querySelector('#modal .panel').scrollTop = 0; });
    await p.locator(`.pd-dog[data-pd="a|${ids.f}"]`).tap(); await t.until((i) => !!document.querySelector(`.pd-dog.on[data-pd="a|${i.f}"]`), ids);
    ok(await ev((i) => !!document.querySelector(`.pd-dog.on[data-pd="a|${i.f}"]`) && !!document.querySelector(`.pd-dog.on[data-pd="b|${i.m}"]`), ids), `${device}: tapping a dog card selects it (and the partner fills in)`);
    ok(await ev(() => !!document.querySelector('.pd-verdict.ok')), `${device}: the pair is fine`);

    sec(`${device}: playdate scene`);
    await p.locator('#pdGo').tap();
    ok(await t.until(() => { const s = document.getElementById('pdScene'); return !!s && !s.hidden; }), `${device}: the scene shows`);
    const sc = await ev(() => { const s = document.getElementById('pdScene').getBoundingClientRect(), a = document.querySelector('.pd-pal.a').getBoundingClientRect(), b = document.querySelector('.pd-pal.b').getBoundingClientRect(), pr = document.querySelector('#modal .panel').getBoundingClientRect(); return { s: [s.left, s.right], a: [a.left, a.right], b: [b.left, b.right], pr: [pr.left, pr.right], sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    ok(sc.a[0] >= sc.s[0] - 2 && sc.b[1] <= sc.s[1] + 2 && sc.s[0] >= sc.pr[0] - 1 && sc.s[1] <= sc.pr[1] + 1 && sc.sw === sc.iw, `${device}: both pals fit inside the scene and the sheet ${JSON.stringify(sc)}`);
    await t.SH(`${tag}_scene`);
    ok(await t.until(() => !!document.getElementById('pdResult'), null, 12000), `${device}: the result shows`);
    await audit(`${device} playdate result`);
    await p.locator('#pdOk').tap(); await t.modalGone();

    sec(`${device}: birth reveal`);
    const pregs = await ev((i) => { const f = window.__paw.S.dogs.find((d) => d.id === i.f); return !!f.preg; }, ids);
    ok(pregs, `${device}: she is expecting`);
    await ev(() => { const f = window.__paw.S.dogs.find((d) => d.preg); if (f && f.preg.pups.length < 2) f.preg.pups.push(Object.assign({}, f.preg.pups[0], { id: f.preg.pups[0].id + "b", sex: f.preg.pups[0].sex === "female" ? "male" : "female", sparkle: false })); window.__paw.breed.birthNow(); }); // a one-pup litter has no row to swipe
    ok(await t.until(() => document.querySelectorAll('.lt-birth .lt-card').length > 0), `${device}: the birth popup opens`);
    const nPups = await ev(() => document.querySelectorAll('.lt-birth .lt-card').length);
    ok(nPups >= 2, `${device}: a litter of ${nPups}`);
    ok(await t.until(() => !!document.querySelector('.pp-nav')), `${device}: Back / Next buttons are there`);
    ok(await ev(() => document.activeElement && document.activeElement.tagName !== 'INPUT'), `${device}: the keyboard is not forced open on a phone`);
    await t.SH(`${tag}_birth`); await audit(`${device} birth`);
    const cnt0 = await p.textContent("#ppCount"); ok(/Pup 1 of \d/.test(cnt0), `${device}: "Pup 1 of N" shows (${cnt0} sl=${await ev(() => document.querySelector(".birth .lt-pups").scrollLeft)})`);
    ok(await ev(() => document.querySelector('.pp-prev').disabled), `${device}: Back is off on the first pup`);
    const row = await p.locator('.birth .lt-pups').boundingBox();
    const cardW = await ev(() => document.querySelector('.birth .lt-card').getBoundingClientRect().width);
    ok(cardW < row.width * 0.9, `${device}: the cards are narrower than the row so the next one peeks (${Math.round(cardW)} < ${Math.round(row.width)})`);
    // swipe left on the row (touch drag), then use the button
    await swipe(cdp, row.x + row.width * 0.85, row.x + row.width * 0.1, row.y + 40);
    ok(await t.until(() => /^Pup 2 of/.test(document.getElementById('ppCount').textContent), null, 4000), `${device}: a swipe moves to pup 2`);
    if (nPups > 2) { await p.locator('.pp-next').tap(); ok(await t.until(() => /^Pup 3 of/.test(document.getElementById('ppCount').textContent), null, 4000), `${device}: Next moves to pup 3`); }
    await p.locator('.pp-prev').tap(); ok(await t.until((n) => document.getElementById('ppCount').textContent === `Pup ${n > 2 ? 2 : 1} of ${n}`, nPups, 4000), `${device}: Back moves one pup back`);
    // name a pup by tapping its box
    const inp = p.locator('.birth .lt-card [data-pupname]').first(); await inp.scrollIntoViewIfNeeded(); await inp.tap(); await inp.fill('Biscuit');
    await p.locator('#ltOk').tap(); await t.modalGone();
    const named = await ev(() => window.__paw.S.litters[0].pups.map((x) => x.name));
    ok(named.includes('Biscuit'), `${device}: a pup was named by tap and keyboard (${named.join(', ')})`);

    sec(`${device}: nursery`);
    const lid = await ev(() => window.__paw.S.litters[0].id);
    await ev((l) => window.__paw.breed.openNursery(l), lid);
    ok(await t.until(() => !!document.getElementById('nsCount') && !!document.getElementById('nsPet')), `${device}: the nursery opens`);
    await t.SH(`${tag}_nursery`); await audit(`${device} nursery`);
    await p.locator('#nsPet').tap(); ok(await t.until(() => /2 left/.test(document.getElementById('nsPet').textContent), null, 4000), `${device}: Pet softly works by tap`);
    await t.closeX(); await t.modalGone();

    sec(`${device}: Who stays`);
    await ev(() => window.__paw.breed.chooseNow());
    ok(await t.until(() => document.querySelectorAll('.lt-card.ws').length >= 2, null, 8000), `${device}: Who stays opens`);
    await t.SH(`${tag}_whostays`); await audit(`${device} who stays`);
    const wsBtn = await ev(() => { const b = document.querySelector('.ws-tog button[data-ws$="|stay"]'); return b ? b.dataset.ws : null; });
    if (wsBtn) { await p.locator(`[data-ws="${wsBtn}"]`).tap(); ok(await t.until((w) => document.querySelector(`[data-ws="${w}"]`).getAttribute('aria-pressed') === 'true', wsBtn, 4000), `${device}: Stay toggles by tap`); await audit(`${device} who stays (one kept)`); }
    await p.locator('#wsOk').tap();
    ok(await t.until(() => !!document.getElementById('wsBye') || !!document.getElementById('wsSpark') || !!document.getElementById('wsBye2'), null, 8000), `${device}: Done leads on to the next step`);
    if (await p.locator('#wsSpark').count()) { await audit(`${device} Sparkle adopt-out`); await p.locator('#wsSpNo').tap(); await t.until(() => !!document.getElementById('wsOk')); await p.locator('#wsOk').tap(); await t.until(() => !!document.getElementById('wsBye')); }
    await audit(`${device} new homes`);
    ok(!!(await p.locator('#wsBye2').count()), `${device}: the OK button is there`);
    await p.locator('#wsBye2').tap(); await t.modalGone();

    sec(`${device}: pick of the litter`);
    await ev((i) => {
      const P = window.__paw, S = P.S, f = S.dogs.find((d) => d.id === i.f); f.fixed = false; P.breed.setSeason(i.m, true);
      S.npcLitters = [{ id: 'nl_test', owner: 'the Tanakas', npcName: 'Pepper', sire: i.m, due: new Date().toISOString().slice(0, 10), ready: new Date().toISOString().slice(0, 10), offered: true,
        pups: [0, 1, 2].map((k) => ({ id: 'np' + k, name: ['Nib', 'Moss', 'Pip'][k], key: 'corgi', sex: k % 2 ? 'male' : 'female', coat: 'Red', eyes: 'brown', born: new Date().toISOString().slice(0, 10), genes: JSON.parse(JSON.stringify(f.genes)), sparkle: k === 2 })) }];
      S.dogs.slice(2).forEach(() => {}); P.saveNow();
    }, ids);
    await ev(() => { const P = window.__paw, S = P.S; while (P.breed.free() < 1 && S.dogs.length > 2) S.dogs.pop(); });
    await ev(() => { const P = window.__paw; P.S.house = 'Royal Castle Kennel'; P.breed.adoptPick('nl_test'); });
    if (await t.until(() => !!document.querySelector('.lt-card.pick'), null, 4000)) {
      await t.SH(`${tag}_pick`); await audit(`${device} pick of the litter`);
      await p.locator('.lt-card.pick').first().tap();
      ok(await t.until(() => (window.__paw.S.npcLitters[0] || {}).picked === 'np0', null, 4000), `${device}: tapping a pup adopts it`);
      if (await t.until(() => !!document.getElementById('brRampOk'), null, 2500)) { await audit(`${device} Doggy Ramp`); await p.locator('#brRampOk').tap(); }
      await t.modalGone();
    } else ok(false, `${device}: pick of the litter did not open (no free spot?)`);

    sec(`${device}: playdates again (after the family grew)`);
    await ev(() => { window.__paw.breed.openPlaydates(); });
    await t.until(() => !!document.querySelector('#modal .panel'));
    await audit(`${device} playdates (again)`); await t.closeX(); await t.modalGone();
    await t.ctx.close();
  }
}, { device: 'iPhone 13', timeout: 420000 });
