// v2.3 PHONE PLAY lane, area `shell`: trick training panel + mini-game labels (SH-2, SH-3), portrait lock card (SH-1), greeting-whine guard (SH-4).
// Hook for game/test_phone_occl_play.js (see the HOOK note there).
const rectOf = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };

module.exports = {
  name: 'shell',

  phone: async (H, w, h, tag) => {
    const { t, ok, ev } = H;
    // open the training panel on a paw trick (tap x2 + hold labels), enough Focus, trick below the fade
    await ev(() => { const S = window.__paw.S; S.sleeping = false; S.bond.level = Math.max(S.bond.level, 10); S.dog.focus = { v: 100, at: S.gameMin }; S.dog.tricks.Paw = { p: 0.1, shows: 0 }; S.dog.tricks.Sit = { p: 0.1, shows: 0 }; });
    await ev(() => { window.__paw.go('yard'); });
    await t.untilMode('yard');
    await ev(() => { const b = document.querySelector('[data-act=play]'); b.click(); });
    await t.until(() => !!document.querySelector('[data-play=tricks]'), null, 5000);
    await ev(() => document.querySelector('[data-play=tricks]').click());
    await t.until(() => !!document.querySelector('#trainPanel:not([hidden]) #trStart'), null, 6000);
    await H.settle();
    // the panel layout on the Sit (lure) tab
    const lay = () => ev(() => {
      const tp = document.querySelector('#trainPanel'), P = tp.getBoundingClientRect(), bar = document.querySelector('#bar').getBoundingClientRect(), vh = innerHeight;
      const R = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { t: r.top, b: r.bottom }; };
      return { st: tp.scrollTop, P: { t: P.top, b: P.bottom }, barT: bar.top, vh, line: R('#trLine'), focus: R('#trainPanel .trfocus'), btn: R('#trainPanel .trbtns') };
    });
    const inside = (r, L) => !!r && r.t >= L.P.t - 0.5 && r.b <= Math.min(L.P.b, L.barT, L.vh) + 0.5;
    let L = await lay();
    ok(L.st === 0, `${tag}training panel starts scrolled to the top (${L.st})`);
    ok(inside(L.focus, L), `${tag}the Focus meter is fully in view without scrolling (${JSON.stringify(L.focus)} in panel ${JSON.stringify(L.P)}, bar ${Math.round(L.barT)})`);
    ok(inside(L.line, L), `${tag}the status/hint line is not clipped by the panel or the bar (${JSON.stringify(L.line)})`);
    ok(inside(L.btn, L), `${tag}the Start button row is in view (${JSON.stringify(L.btn)})`);
    // during an attempt: Paw has the tap and hold labels
    await ev(() => document.querySelector('[data-tr="Paw"]').click());
    await t.until(() => document.querySelector('[data-tr="Paw"].on'), null, 3000);
    await ev(() => document.querySelector('#trStart').click());
    await t.until(() => document.querySelectorAll('#trTrack text:not(.tg-star)').length >= 2, null, 6000);
    await H.settle();
    L = await lay();
    ok(L.st === 0 && inside(L.focus, L) && inside(L.line, L), `${tag}Paw attempt: Focus meter and hint line stay in view (focus ${JSON.stringify(L.focus)}, line ${JSON.stringify(L.line)}, panel ${JSON.stringify(L.P)})`);
    const lab = await ev(() => {
      const sc = document.querySelector('#view svg.world').getScreenCTM().a, d = document.querySelector('#dogHit').getBoundingClientRect();
      return { dog: { l: d.left, t: d.top, r: d.right, b: d.bottom }, labels: [...document.querySelectorAll('#trTrack text:not(.tg-star)')].map((x) => { const r = x.getBoundingClientRect(); return { txt: x.textContent, fs: parseFloat(getComputedStyle(x).fontSize) * sc, l: r.left, t: r.top, r: r.right, b: r.bottom }; }) };
    });
    ok(lab.labels.length >= 2, `${tag}the tap and hold labels are drawn (${lab.labels.map((x) => x.txt)})`);
    lab.labels.forEach((x) => {
      ok(x.fs >= 13, `${tag}"${x.txt}" label is ${x.fs.toFixed(1)} px on screen (>= 13)`);
      const hit = x.l < lab.dog.r && x.r > lab.dog.l && x.t < lab.dog.b && x.b > lab.dog.t;
      ok(!hit, `${tag}"${x.txt}" label ${[x.l, x.t, x.r, x.b].map(Math.round)} stays off the dog's box ${[lab.dog.l, lab.dog.t, lab.dog.r, lab.dog.b].map(Math.round)}`);
      ok(x.l >= 0 && x.r <= w && x.t >= 0, `${tag}"${x.txt}" label is on screen`);
    });
    await ev(() => { const b = document.querySelector('#trStop'); if (b) b.click(); });
    await ev(() => { const b = document.querySelector('#trX'); if (b) b.click(); });
    await t.until(() => document.querySelector('#trainPanel').hidden, null, 4000);
  },

  once: async (H) => {
    const { t, ok, ev, vp } = H;
    // SH-1: the portrait-lock card (touch phone held sideways)
    await t.p.setViewportSize({ width: 800, height: 390 });
    await t.until(() => document.documentElement.hasAttribute('data-pslock') && !!document.querySelector('#psTurn .ps-turn-card'), null, 6000);
    await H.settle();
    const c = await ev(() => {
      const card = document.querySelector('#psTurn .ps-turn-card'), cs = getComputedStyle(card), cr = card.getBoundingClientRect(), tape = getComputedStyle(card, '::before');
      const panelSample = document.createElement('div'); panelSample.className = 'panel'; document.body.appendChild(panelSample);
      const pcs = getComputedStyle(panelSample), ref = { bg: pcs.backgroundImage.split(',')[0], rad: pcs.borderRadius }; panelSample.remove();
      const inCard = (e) => { const r = e.getBoundingClientRect(); return r.left >= cr.left && r.right <= cr.right && r.top >= cr.top && r.bottom <= cr.bottom && r.width > 0; };
      const radii = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
      return { frame: cs.backgroundImage.split(',')[0], ref, border: cs.borderTopWidth, radii, uneven: new Set(radii).size > 1, shadow: cs.boxShadow, tape: tape.backgroundImage, tapeContent: tape.content,
        h2: card.querySelector('h2').textContent, p: card.querySelector('p').textContent, textIn: [...card.querySelectorAll('h2,p,svg')].every(inCard), svgStroke: [...card.querySelectorAll('svg path')].filter((x) => !x.getAttribute('d').includes('a')).length,
        outline: !!card.querySelector('svg rect'), card: [cr.left, cr.top, cr.right, cr.bottom].map(Math.round), vw: innerWidth, vh: innerHeight, scrollOver: card.scrollWidth > card.clientWidth + 1 };
    });
    ok(c.frame === c.ref.bg && /url\(|svg/.test(c.frame), `lock card: uses the same hand-drawn frame as .panel (--fr-card): ${c.frame.slice(0, 40)}`);
    ok(c.border === '0px', `lock card: the old plain 2.5px CSS border is gone (${c.border})`);
    ok(c.uneven && c.shadow === 'none', `lock card: uneven sketch radius ${c.radii} and no flat box-shadow (${c.shadow})`);
    ok(/url\(/.test(c.tape) && c.tapeContent !== 'none', 'lock card: wears the washi tape');
    ok(!c.outline, 'lock card: the generic outline phone (svg rect) is replaced by a hand-drawn path');
    ok(c.h2 === 'Turn your phone upright' && c.p === 'Paw Haven plays standing up. Your game waits right here.', 'lock card: copy unchanged');
    ok(c.textIn && c.card[0] >= 0 && c.card[2] <= c.vw && c.card[1] >= 0 && c.card[3] <= c.vh && !c.scrollOver, `lock card: title, text and phone art are fully inside the card, and the card inside the screen ${c.card} of ${c.vw}x${c.vh}`);
    await t.p.setViewportSize({ width: 667, height: 375 });
    await t.until(() => innerHeight === 375, null, 4000); await H.settle();
    const c2 = await ev(() => { const card = document.querySelector('#psTurn .ps-turn-card'), cr = card.getBoundingClientRect(); return [...card.querySelectorAll('h2,p,svg')].every((e) => { const r = e.getBoundingClientRect(); return r.left >= cr.left && r.right <= cr.right && r.top >= cr.top && r.bottom <= cr.bottom; }) && cr.bottom <= innerHeight && cr.top >= 0; });
    ok(c2, 'lock card at 667x375: text fits inside the card and the card inside the screen');
    await vp(390, 844);
    await t.until(() => !document.documentElement.hasAttribute('data-pslock'), null, 6000);

    // SH-4: the greeting timers (Continue schedules greetBark at 1200 ms, which schedules the whine at 700 ms) must not throw once S is gone
    // (Continue, then a quick New game / account switch). The timers are held and run by hand: no race, no sleep.
    await ev(() => window.__paw.go('title'));
    await t.until(() => !!document.getElementById('tContinue'), null, 6000);
    const errs0 = t.errors.length;
    const held = await ev(() => {
      const orig = window.setTimeout, cbs = {}; window.__shTimers = cbs;
      window.setTimeout = (f, ms, ...a) => { if (ms === 700 || ms === 1200) { cbs[ms] = f; return 0; } return orig(f, ms, ...a); };
      try { document.getElementById('tContinue').click(); if (cbs[1200]) cbs[1200](); } finally { window.setTimeout = orig; }
      return { have1200: !!cbs[1200], have700: !!cbs[700] };
    });
    ok(held.have1200 && held.have700, 'greeting: Continue schedules the 1200 ms greeting and the 700 ms whine timers (' + JSON.stringify(held) + ')');
    await ev(() => window.__paw.go('title'));
    await t.until(() => !!document.getElementById('tNew'), null, 6000);
    await ev(() => document.getElementById('tNew').click());
    await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel .btn.yes'), null, 6000);
    await ev(() => document.querySelector('#modal:not([hidden]) .panel .btn.yes').click());
    await t.until(() => !window.__paw.S, null, 6000);
    const thrown = await ev(() => { const err = []; [1200, 700].forEach((k) => { try { window.__shTimers[k](); } catch (e) { err.push(k + ': ' + e.message); } }); return err; });
    ok(thrown.length === 0, 'greeting: the held 1200 ms and 700 ms timers do nothing after the game is gone (New game)' + (thrown.length ? ' -> ' + thrown.join(' | ') : ''));
    ok(t.errors.length === errs0, 'greeting: no console errors from the timers (t.errors)');
    // give the rest of the suite a game again
    await t.newGame({ device: 'iPhone 13' }, { coins: 3000, bond: { level: 10, pts: 5000 }, stats: { hunger: 80, happy: 80, energy: 95, clean: 90 }, inv: { toys: ['Tennis Ball', 'Frisbee'] } });
    await vp(390, 844);
  },
};

