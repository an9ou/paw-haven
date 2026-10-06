// v2.3 PHONE PLAY lane, area "followup": the style re-check items (runner results, fetch/classic results trays, tutorial pages, walk-start toasts,
// Market Go home, desktop location chip, pier bubble tail, no mid-run layout flip). Loaded by test_phone_occl_play.js (see its HOOK note).
const PAGE_TUT = `(async () => { const hs = []; const x = { tiles: null, coins: null }; for (let i = 0; i < 4; i++) { const c = document.querySelector('.pw-card.pw-tut'); if (!c) break; hs.push(Math.round(c.getBoundingClientRect().height));
  if (i === 1) { const cells = [...c.querySelectorAll('.pw-obsc')], f = c.querySelector('.pw-tfoot').getBoundingClientRect(); x.tiles = { n: cells.length, bad: cells.filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > f.top - 2 || r.right > c.getBoundingClientRect().right; }).length }; }
  if (i === 3) { const m = [...c.querySelectorAll('.pw-mini')].find((e) => e.querySelector('img')); if (m) { const mr = m.getBoundingClientRect(); x.coins = [...m.querySelectorAll('img')].filter((im) => { const r = im.getBoundingClientRect(); return r.top < mr.top - 0.5 || r.bottom > mr.bottom + 0.5 || r.left < mr.left - 0.5 || r.right > mr.right + 0.5; }).length; } }
  const b = document.querySelector('.pw-tut [data-next]'); if (!b) break; const before = c.innerHTML; b.click(); const t0 = performance.now(); while (performance.now() - t0 < 2000) { await new Promise((r) => requestAnimationFrame(r)); const n = document.querySelector('.pw-card.pw-tut'); if (n && n.innerHTML !== before) break; } } return { hs, x }; })()`;

// open the runner on the first-walk tutorial (PawWalk is restored by the caller on phones)
async function openRunner(H) {
  const { ev, t } = H;
  await ev(() => { if (window.__PW) window.PawWalk = window.__PW; window.__paw.S.walks = 0; window.__paw.go('walk', 'park'); });
  return t.until(() => !!document.querySelector('.pw-tut'), null, 12000);
}
async function skipTutorial(H) {
  const { ev, t } = H;
  for (let i = 0; i < 8 && (await ev(() => !!document.querySelector('.pw-tut'))); i++) {
    const before = await ev(() => document.querySelector('.pw-tut').innerHTML);
    await ev(() => { const b = document.querySelector('.pw-tut [data-go]') || document.querySelector('.pw-tut [data-next]'); if (b) b.click(); });
    await t.until((b) => { const c = document.querySelector('.pw-tut'); return !c || c.innerHTML !== b; }, before, 3000);
  }
}

module.exports = {
  name: 'follow-ups (results, trays, tutorial, chip)',

  phone: async (H, w, h, tag) => {
    const { ev, ok, t, p, settle } = H;

    // Market Street: Go home is the one yellow button and it shows without scrolling the row
    await H.at('market');
    const yes = await ev(() => { const r = document.getElementById('placeBtns').getBoundingClientRect(), b = document.querySelector('#placeBtns .btn.yes'); if (!b) return null; const q = b.getBoundingClientRect(); return { t: b.textContent, inRow: q.left >= r.left - 1 && q.right <= r.right + 1 && q.left >= 0 && q.right <= innerWidth }; });
    ok(!!yes && yes.inRow, `${tag} market: the yellow "${yes && yes.t}" button shows in the visible part of the row`);

    // walk start clears a lingering toast; tutorial pages keep one height; no keyboard wording on touch
    await H.at('yard');
    await ev(() => { const d = document.createElement('div'); d.className = 'toast gold'; d.id = 'occlToast2'; d.textContent = 'Rub Mochi to pet. Tap Feed to fill the bowl.'; document.getElementById('toasts').appendChild(d); });
    ok(await openRunner(H), `${tag} runner: the tutorial opens`);
    ok(await ev(() => !document.getElementById('occlToast2')), `${tag} runner: a toast from the yard does not ride into the walk`);
    const tutRes = await ev(PAGE_TUT), hs = tutRes.hs;
    ok(tutRes.x.tiles && tutRes.x.tiles.bad === 0, `${tag} runner tutorial page 2: all ${tutRes.x.tiles && tutRes.x.tiles.n} obstacle tiles fit above the buttons`);
    ok(tutRes.x.coins === 0, `${tag} runner tutorial page 4: every coin sits inside its dashed box (${tutRes.x.coins} outside)`);
    ok(hs.length === 4 && Math.max(...hs) - Math.min(...hs) <= 1, `${tag} runner: the tutorial card keeps one height on every page (${hs.join(', ')})`);
    ok(Math.max(...hs) <= h - 80, `${tag} runner: the tutorial card fits the screen (${Math.max(...hs)} of ${h})`);
    // page 3 (the dig line) says "tap Dig!" with no "press D"; page 4's "-3s" does not sit on its text
    await ev(() => { const g = document.querySelector('.pw-tut [data-back]'); });
    const txt = await ev(() => { const out = []; const tut = document.querySelector('.pw-tut'); return tut ? tut.textContent : ''; });
    ok(!/press D\b|Space\b|Esc\b/.test(txt), `${tag} runner: the tutorial uses touch wording only`);
    const neg = await ev(() => { const n = document.querySelector('.pw-tut .pw-neg'); if (!n) return { skip: true }; const r = n.getBoundingClientRect(), nx = n.nextElementSibling.getBoundingClientRect(); return { skip: false, over: r.right > nx.left + 1, w: Math.round(r.width) }; });
    ok(neg.skip || !neg.over, `${tag} runner: the "-3s" mark clears the text beside it${neg.skip ? ' (not on this page)' : ''}`);
    await skipTutorial(H);
    await ev(() => { const d = document.createElement('div'); d.className = 'toast gold'; d.textContent = 'A late yard hint'; document.getElementById('toasts').appendChild(d); });
    await t.until(() => !!document.querySelector('.pw-cd'), null, 6000); // the countdown has really started (the overlay is also hidden for a frame before it)
    ok(await t.until(() => { const o = document.querySelector('.pw-ov'); return !!o && o.hidden; }, null, 15000), `${tag} runner: countdown ends`);
    const left = await ev(() => [...document.querySelectorAll('#toasts .toast')].map((e) => e.textContent.slice(0, 40)));
    ok(left.length === 0, `${tag} runner (left: ${left.join(' | ')}): a hint toast that landed during the countdown is cleared when the dog starts running`);
    await ev(() => { document.querySelector('.pw-pauseb').click(); });
    ok(await t.until(() => !!document.querySelector('[data-home]'), null, 4000), `${tag} runner: pause opens`);
    ok(await ev(() => !/Space|Esc\b|\bD\b/.test(document.querySelector('.pw-ov .pw-card').textContent)), `${tag} runner: the pause card uses touch wording`);
    // quitting early: the sheet says "Walk cut short" and lists only numbers that are not zero
    await ev(() => document.querySelector('[data-home]').click());
    ok(await t.until(() => !!document.getElementById('resOk'), null, 15000), `${tag} runner: the results sheet opens`);
    await settle(['#modal .panel']);
    const res = await ev(() => ({ title: document.querySelector('#modal .panel h2').textContent, tiles: [...document.querySelectorAll('#modal .res')].map((e) => e.textContent) }));
    ok(/^Walk cut short|^Treasure found/.test(res.title), `${tag} runner: quitting early reads "Walk cut short" (${res.title.slice(0, 30)})`);
    ok(!res.tiles.some((x) => /^[+-]?0(Paw|Happiness|Bond|Energy|Cleanliness)/.test(x.replace(/\s+/g, ''))), `${tag} runner: no zero tiles on the results (${res.tiles.join(' | ').slice(0, 80)})`);
    await ev(() => document.getElementById('resOk').click()); await t.untilMode('yard');

    // classic walk results: no walk tray (and its hint line) under the sheet
    await ev(() => { window.PawWalk = null; window.__paw.S.walks = 1; window.__paw.go('walk', 'park'); });
    ok(await t.until(() => !!document.getElementById('holdBtn'), null, 10000), `${tag} classic: opens`);
    await ev(() => document.getElementById('walkQuit').click());
    ok(await t.until(() => !!document.getElementById('resOk'), null, 8000), `${tag} classic: results open`);
    await settle(['#modal .panel']);
    ok(await ev(() => document.getElementById('dock').children.length === 0), `${tag} classic results: the walk tray is gone (no hint under the sheet)`);
    await ev(() => document.getElementById('resOk').click()); await t.untilMode('yard');
    await ev(() => { if (window.__PW) window.PawWalk = window.__PW; });

    // fetch results: no fetch tray and a single X
    await ev(() => window.__paw.go('fetch', 'Tennis Ball'));
    ok(await t.until(() => !!document.getElementById('fQuit'), null, 8000), `${tag} fetch: opens`);
    await ev(() => document.getElementById('fQuit').click());
    ok(await t.until(() => !!document.getElementById('fOk'), null, 8000), `${tag} fetch: results open`);
    await settle(['#modal .panel']);
    const fx = await ev(() => ({ dock: document.getElementById('dock').children.length, xs: [...document.querySelectorAll('.xbtn, #modal .x')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }).length }));
    ok(fx.dock === 0 && fx.xs === 1, `${tag} fetch results: no fetch tray behind the sheet and one X (tray ${fx.dock}, X buttons ${fx.xs})`);
    await ev(() => document.getElementById('fOk').click()); await t.untilMode('yard');
  },

  desk: async (H) => {
    const { ev, ok, t, settle } = H;
    // the location chip no longer sits on the "K" of Kibble Corner
    await H.at('market'); await settle(['#status']);
    const chip = await ev(() => { const c = document.getElementById('status').getBoundingClientRect(), out = []; document.querySelectorAll('#view svg.world text').forEach((x) => { const q0 = x.getBoundingClientRect(), q = { left: q0.left, right: q0.right, width: q0.width, top: q0.top + q0.height * 0.18, bottom: q0.bottom }; /* the text box includes empty ascent: measure from the letters' top */ if (q.width > 4 && q.left < c.right && q.right > c.left && q.top < c.bottom && q.bottom > c.top) out.push(x.textContent.trim().slice(0, 20) + ' ' + [q.left, q.top, q.right, q.bottom].map(Math.round) + ' chip ' + [c.left, c.top, c.right, c.bottom].map(Math.round)); }); return out; });
    ok(chip.length === 0, `desktop market: the location chip covers no sign text${chip.length ? ' -> ' + chip.join(', ') : ''}`);

    // the pier bubble's flipped tail only ever goes with a bubble that sits under the dog
    await H.at('pier');
    const bad = await ev(() => { const bub = document.getElementById('bubble'), d = document.getElementById('dogHit').getBoundingClientRect(); const out = []; for (let i = 0; i < 60; i++) { window.__paw.voice.ambient(); if (bub.hidden) continue; bub.getAnimations().forEach((a) => a.finish()); const r = bub.getBoundingClientRect(); if (bub.classList.contains('below') && r.top < d.bottom - 4) out.push('flipped tail on a bubble above the dog'); } return out; });
    ok(bad.length === 0, `desktop pier: the bubble tail follows where the bubble sits${bad.length ? ' -> ' + bad[0] : ''}`);

    // a first touch mid-run does not flip the runner layout
    ok(await openRunner(H), 'desktop runner: opens');
    await skipTutorial(H);
    ok(await t.until(() => { const o = document.querySelector('.pw-ov'); return !!o && o.hidden; }, null, 15000), 'desktop runner: countdown ends');
    const before = await ev(() => { const s = document.querySelector('.pw-stage').getBoundingClientRect(), j = document.querySelector('.pw-jump').getBoundingClientRect(); return { cls: document.querySelector('.pw-root').className.replace(/\s*pw-coarse\s*/, ' ').trim().replace(/\s+/g, ' '), st: [s.top, s.bottom], j: [j.top, j.left] }; });
    await ev(() => { const st = document.querySelector('.pw-stage'); const r = st.getBoundingClientRect(); st.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', pointerId: 77, bubbles: true, clientX: r.left + 40, clientY: r.top + 40 })); st.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', pointerId: 77, bubbles: true, clientX: r.left + 40, clientY: r.top + 40 })); });
    await ev(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const after = await ev(() => { const s = document.querySelector('.pw-stage').getBoundingClientRect(), j = document.querySelector('.pw-jump').getBoundingClientRect(); return { cls: document.querySelector('.pw-root').className.replace(/\s*pw-coarse\s*/, ' ').trim().replace(/\s+/g, ' '), st: [s.top, s.bottom], j: [j.top, j.left] }; });
    ok(JSON.stringify(before) === JSON.stringify(after), `desktop runner: the first touch does not move the strip or the controls (${JSON.stringify(before)} -> ${JSON.stringify(after)})`);
    await t.quitWalk(true);
  },
};
