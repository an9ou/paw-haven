// v2.3 phone, HOME lane: occlusion. On a phone nothing may block the view: the dock, sheets, HUD, toasts and action bar must not cover the dog's box
// or the screen's main interactive props. 390x844 and 360x740 (the viewport is set explicitly: the iPhone 13 profile is 390x664).
// node game/run_tests.js phone_occl_home
const { run } = require('./test_lib');

// In-page: for each selector, sample 5 points inside the box (centre + four points at 25% / 75%). A point counts as covered when the element on top is
// phone chrome (dock tray, sheet, HUD, action bar, toast, place buttons, dev button). Returns per-target { n, vis, cov }: samples, samples on screen, samples covered.
const SCAN = (sels) => {
  const CHROME = '#dock > .tray, #modal .panel, #hud, #bar, #toasts .toast, #placeBtns .btn, #devBtn, #devPanel';
  const vr = document.getElementById('view') ? document.getElementById('view').getBoundingClientRect() : { top: 0, bottom: innerHeight, left: 0, right: innerWidth };
  const out = {};
  for (const sel of sels) {
    const el = document.querySelector(sel); if (!el) { out[sel] = null; continue; }
    const r = el.getBoundingClientRect(); const res = { n: 0, vis: 0, cov: 0, by: [], box: [r.left | 0, r.top | 0, r.right | 0, r.bottom | 0] };
    for (const [fx, fy] of [[.5, .5], [.25, .25], [.75, .25], [.25, .75], [.75, .75]]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy; res.n++;
      if (x < Math.max(0, vr.left) || x > Math.min(innerWidth, vr.right) || y < Math.max(0, vr.top) || y > Math.min(innerHeight, vr.bottom)) continue;
      res.vis++; const top = document.elementFromPoint(x, y), c = top && top.closest(CHROME);
      if (c) { res.cov++; res.by.push((c.id ? '#' + c.id : '') + (typeof c.className === 'string' ? '.' + c.className.split(/\s+/)[0] : '')); }
    }
    out[sel] = res;
  }
  return out;
};

(async () => {
  for (const [W, H] of [[390, 844], [360, 740]]) {
    await run(`phone_occl_home_${W}x${H}`, async (t) => {
      const { ok } = t;
      const tag = `${W}x${H}`;
      // must: at least one sample of the box is on screen, and none of those is covered by chrome.  soft: only the "not covered" part (the prop may be panned out of the crop)
      const check = async (label, must, soft) => {
        let r = null;
        for (let i = 0; i < 4; i++) { // the dog may be mid-wander (the ambient jokes): look again a moment later
          r = await t.ev(SCAN, [...must, ...(soft || [])]);
          if (must.every((m) => r[m] && r[m].vis > 0 && r[m].cov === 0)) break; await t.sleep(1200);
        }
        for (const s of must) {
          const v = r[s];
          if (!v) { ok(false, `${tag} ${label}: ${s} exists`); continue; }
          ok(v.vis > 0, `${tag} ${label}: ${s} is on screen ${JSON.stringify(v.box)}`);
          ok(v.cov === 0, `${tag} ${label}: ${s} is not covered (${v.cov}/${v.vis} samples${v.by.length ? ' by ' + [...new Set(v.by)].join(', ') : ''})`);
        }
        for (const s of soft || []) { const v = r[s]; if (v) ok(v.cov === 0, `${tag} ${label}: ${s} is not covered (${v.cov}/${v.vis} samples${v.by.length ? ' by ' + [...new Set(v.by)].join(', ') : ''})`); }
        await t.SH(`${tag}_${label.replace(/\W+/g, '_')}`);
      };
      // a sheet's buttons must be on screen, tappable (top element is the button) and clear of the action bar and toasts
      const sheet = async (label) => {
        const r = await t.ev(() => {
          const pn = document.querySelector('#modal .panel'); if (!pn) return null; const pr = pn.getBoundingClientRect(), bar = document.getElementById('bar'), br = bar ? bar.getBoundingClientRect() : null, out = { bad: [], panel: [pr.top | 0, pr.bottom | 0], barTop: br ? br.top | 0 : null, vh: innerHeight };
          const body = pn.querySelector('.panel-body') || pn;
          pn.querySelectorAll('button, [role=tab]').forEach((b) => {
            const q = b.getBoundingClientRect(); if (q.width < 1 || q.height < 1) return; const bb = body.getBoundingClientRect();
            if (b.closest('.panel-body') && (q.bottom < bb.top + 2 || q.top > bb.bottom - 2)) return; // scrolled out of the sheet body on purpose
            if (q.left < -1 || q.right > innerWidth + 1 || q.top < 0 || q.bottom > innerHeight) { out.bad.push('offscreen ' + (b.id || b.textContent.trim().slice(0, 14))); return; }
            const top = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
            if (top && !b.contains(top) && !top.contains(b)) out.bad.push((b.id || b.textContent.trim().slice(0, 14)) + ' under ' + (top.id || top.className));
          });
          return out;
        });
        ok(!!r, `${tag} ${label}: a sheet is open`);
        if (r) { ok(r.bad.length === 0, `${tag} ${label}: sheet buttons are on screen and not covered ${r.bad.slice(0, 4).join(' | ')}`); ok(r.barTop == null || r.panel[1] <= r.barTop + 1, `${tag} ${label}: the sheet ends above the action bar (${r.panel[1]} <= ${r.barTop})`); }
        await t.SH(`${tag}_${label.replace(/\W+/g, '_')}`);
      };
      const steady = () => t.until(() => { const x = document.querySelector('#view > svg.world').viewBox.baseVal.x, ok2 = window.__cx !== undefined && Math.abs(window.__cx - x) < 0.05; window.__cx = x; return ok2; }, null, 6000);
      // fully on screen: inside the view and the screen width
      const fullyOn = async (label, sels) => {
        let r = [];
        for (let i = 0; i < 4; i++) { // the dog may be mid-wander (the camera follows it): wait until it is home again, then look
          await t.until(() => { const p = document.getElementById('dogPos'), tf = p ? p.style.transform : ''; return !p || tf === '' || /translate\(0px, 0px\) scale\(1\)/.test(tf); }, null, 12000); await steady();
          r = await t.ev((ss) => { const vr = document.getElementById('view').getBoundingClientRect(); return ss.map((s) => { const e = document.querySelector(s); if (!e) return [s, null]; const b = e.getBoundingClientRect(); return [s, b.left >= -1 && b.right <= innerWidth + (s === '#dogHit' ? 10 : 1) && b.top >= vr.top - 1 && b.bottom <= vr.bottom + 1, [b.left | 0, b.top | 0, b.right | 0, b.bottom | 0]]; }); }, sels);
          if (r.every((x) => x[1] === true)) break; await t.sleep(900);
        }
        for (const [s, on, box] of r) ok(on === true, `${tag} ${label}: ${s} is fully on screen ${JSON.stringify(box)}`);
      };
      // a feed / care / play tray never covers the dog or the bowl: the scene shrinks into the part above it
      const trayCheck = async (act, label) => {
        await t.p.tap(`#bar [data-act=${act}]`); await t.until(() => !!document.querySelector('#dock > .tray'), null, 4000); await t.sleep(700);
        await check(label, ['#dogHit', '#bowlG']); await fullyOn(label, ['#dogHit', '#bowlG']);
        await t.p.tap('#trayX'); await t.until(() => !document.querySelector('#dock > .tray'), null, 4000); await t.sleep(500);
      };
      const dismiss = () => t.ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); });
      const toastsGone = () => t.until(() => !document.querySelector('#toasts .toast'), null, 9000);

      t.sec(tag + ': boot');
      await t.newGame({ sex: 'girl', device: 'iPhone 13' }, { bond: { level: 10, pts: 3300 }, coins: 1000, house: 'Royal Castle Kennel', stats: { hunger: 80, happy: 80, energy: 30, clean: 90 } });
      await t.p.setViewportSize({ width: W, height: H });
      ok(await t.ev((w) => document.documentElement.dataset.layout === 'phone' && innerWidth === w, W), `${tag}: phone layout, ${W} wide`);
      await t.until(() => { const r = document.getElementById('view').getBoundingClientRect(); return r.height > 300; });

      // ---------- yard ----------
      t.sec(tag + ': yard');
      await t.home('yard'); await t.sleep(900);
      await check('yard', ['#dogHit'], ['#houseG', '#bowlG']);
      await toastsGone();
      await check('yard quiet', ['#dogHit']);
      await steady(); await fullyOn('yard', ['#dogHit', '#bowlG']);
      for (const [a, l] of [['feed', 'yard feed tray'], ['play', 'yard play tray'], ['care', 'yard care tray']]) await trayCheck(a, l);

      // ---------- yard with the nap strip ----------
      t.sec(tag + ': nap strip');
      await t.p.tap('#bar [data-act=care]'); await t.until(() => !!document.querySelector('[data-care=sleep]'));
      await t.p.tap('[data-care=sleep]'); await t.until(() => !!document.getElementById('wakeBtn'));
      ok(await t.until(() => !!document.querySelector('#toasts .toast'), null, 3000), `${tag} nap: a toast shows`);
      await t.sleep(450); // the toast pops in
      const tc = await t.ev(() => { const a = document.querySelector('#toasts .toast').getBoundingClientRect(), c = document.getElementById('status').getBoundingClientRect(), d = document.getElementById('dogHit').getBoundingClientRect(); const hit = (x, y) => !(x.right < y.left || x.left > y.right || x.bottom < y.top || x.top > y.bottom); return { chip: hit(a, c), dog: hit(a, d), box: [a.top | 0, a.bottom | 0] }; });
      ok(!tc.chip && !tc.dog, `${tag} nap: the toast covers neither the location chip nor the dog ${JSON.stringify(tc)}`);
      await t.sleep(1400);
      const strip = await t.ev(() => { const tr = document.querySelector('#dock > .tray'), r = tr.getBoundingClientRect(), w = document.getElementById('wakeBtn').getBoundingClientRect(), i = document.getElementById('napInfo').getBoundingClientRect(); return { h: r.height, one: w.top >= r.top && w.bottom <= r.bottom, wh: w.height, ih: i.height, iw: i.width, det: document.getElementById('napDet').hidden }; });
      ok(strip.h <= 80, `${tag} nap: the strip is one line (${strip.h | 0}px tall)`);
      ok(strip.wh >= 43.5 && strip.ih >= 43.5 && strip.iw >= 43.5, `${tag} nap: Wake up and the info button are >= 44 px`);
      ok(strip.det, `${tag} nap: details are folded`);
      await check('nap', ['#dogHit', '#houseG']);
      await t.p.tap('#napInfo'); await t.sleep(150);
      ok(await t.ev(() => !document.getElementById('napDet').hidden), `${tag} nap: a tap on ? opens the details`);
      await t.sleep(700); // the dog lifts while the details are open
      await check('nap details', ['#dogHit']);
      const dc = await t.ev(() => { const a = document.getElementById('napDet').getBoundingClientRect(), d = document.getElementById('dogHit').getBoundingClientRect(), tr = document.querySelector('#dock > .tray').getBoundingClientRect(); return { over: !(a.right < d.left || a.left > d.right || a.bottom < d.top || a.top > d.bottom), h: tr.height, card: [a.top | 0, a.bottom | 0], dog: [d.top | 0, d.bottom | 0] }; });
      ok(!dc.over, `${tag} nap details: the details card does not touch the dog's box ${JSON.stringify(dc)}`);
      ok(dc.h <= 80, `${tag} nap details: the strip does not grow (${dc.h | 0}px)`);
      await t.p.tap('#napInfo'); await t.sleep(600);
      await t.p.tap('#wakeBtn'); await t.until(() => !document.getElementById('wakeBtn'));

      // ---------- house ----------
      t.sec(tag + ': house');
      await t.home('house'); await t.sleep(900);
      await check('house', ['#dogHit']);
      await fullyOn('house', ['#dogHit', '#bowlG']);
      await trayCheck('care', 'house care tray');
      await toastsGone();
      // asleep in the house
      await t.p.tap('#bar [data-act=care]'); await t.until(() => !!document.querySelector('[data-care=sleep]'));
      await t.p.tap('[data-care=sleep]'); await t.until(() => !!document.getElementById('wakeBtn')); await t.sleep(1400);
      await check('house nap', ['#dogHit']);
      await t.p.tap('#wakeBtn'); await t.until(() => !document.getElementById('wakeBtn'));

      // the right half of the scene (notice board, café counter, vet desk, salon table, the dog house) is reachable with the look-right button
      const peekCheck = async (label) => {
        const has = await t.ev(() => ({ btn: !!document.getElementById('phPeek'), prop: !!document.querySelector('#sceneG [data-hot]') || !!document.getElementById('houseG') }));
        if (!has.prop) return;
        ok(has.btn, `${tag} ${label}: the look-right button is there`); if (!has.btn) return;
        const bb = await t.ev(() => { const r = document.getElementById('phPeek').getBoundingClientRect(); return [r.width, r.height]; });
        ok(bb[0] >= 43.5 && bb[1] >= 43.5, `${tag} ${label}: the look-right button is >= 44 px (${bb.map(Math.round)})`);
        await t.p.tap('#phPeek'); await t.until(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look back at the dog', null, 5000); await t.sleep(900); await steady();
        // (the dog may wander off on its own and send the camera back, so try a few times)
        let r = null;
        for (let i = 0; i < 4; i++) {
          if (await t.ev(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look right')) await t.p.tap('#phPeek');
          await t.until(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look back at the dog', null, 5000); await t.sleep(900); await steady();
          r = await t.ev((sels) => { for (const s of sels) { const e = document.querySelector(s); if (!e) continue; const b = e.getBoundingClientRect(), vr = document.getElementById('view').getBoundingClientRect(); const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { sel: s, box: [b.left | 0, b.top | 0, b.right | 0, b.bottom | 0], vb: document.querySelector('#view > svg.world').getAttribute('viewBox'), on: (s === '#houseG' ? (Math.min(b.right, innerWidth) - Math.max(b.left, 0)) / b.width >= 0.7 : (b.left >= -1 && b.right <= innerWidth + 1)) && b.top >= vr.top && b.bottom <= vr.bottom + 1, cov: !!(top && top.closest('#dock > .tray, #modal .panel, #hud, #bar, #toasts .toast, #placeBtns .btn, #devBtn, #phPeek')) }; } return null; }, [label === 'yard' ? '#houseG' : '#sceneG [data-hot]']);
          if (r && r.on && !r.cov) break;
        }
        ok(!!r && r.on && !r.cov, `${tag} ${label}: the look-right button brings ${r && r.sel} fully on screen and uncovered ${JSON.stringify(r)}`);
        // the view goes back on the player's next tap on the empty scene
        if (await t.ev(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look back at the dog')) {
          const pt = await t.ev(() => { const vr = document.getElementById('view').getBoundingClientRect(); for (let y = vr.top + 70; y < vr.bottom - 80; y += 30) for (let x = 20; x < innerWidth - 60; x += 30) { const e = document.elementFromPoint(x, y); if (e && e.closest('#view') && !e.closest('.hot, [data-hot], [data-shop], button, #status, #hud')) return [x, y]; } return null; });
          if (pt) await t.p.touchscreen.tap(pt[0], pt[1]);
          ok(await t.until(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look right', null, 5000), `${tag} ${label}: a tap on the empty scene brings the view back to the dog`);
        }
        ok(await t.ev(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look right'), `${tag} ${label}: the button looks back again`);
      };
      // a speech bubble never sits on the location chip (the dog talks when petted)
      const bubbleVsChip = async (label) => {
        // a bubble anchored near the top-left of the scene (where it would land on the chip)
        await t.ev(() => window.__paw.home.say('Rub me to pet. I will wag, I promise.', 160, 30));
        await t.sleep(200);
        const r = await t.ev(() => { const b = document.getElementById('bubble'), c = document.getElementById('status'); if (!b || b.hidden || !c) return null; const x = b.getBoundingClientRect(), y = c.getBoundingClientRect(); return { over: !(x.right < y.left || x.left > y.right || x.bottom < y.top || x.top > y.bottom) }; });
        ok(!!r, `${tag} ${label}: a speech bubble shows`); if (r) ok(!r.over, `${tag} ${label}: the speech bubble does not cover the location chip`);
        await t.ev(() => { document.getElementById('bubble').hidden = true; });
      };
      await t.home('yard'); await t.sleep(700); await bubbleVsChip('yard'); await peekCheck('yard');

      // ---------- a visiting dog at the Dog Park shares the crop with the dog ----------
      t.sec(tag + ': visitor');
      await t.ev(() => { const S = window.__paw.S; S.rehomed = [{ id: 'pup1', name: 'Button', key: S.dog.key, sex: 'female', born: '2026-03-01', genes: JSON.parse(JSON.stringify(S.dog.genes)), parents: [S.dog.id, 'dad'], gen: 3, family: { id: 'tanaka', name: 'the Tanakas', where: 'by the bakery' }, since: '2026-04-01' }]; window.__paw.saveNow(); });
      await t.rnd(0.1); await t.home('dogpark'); await t.rnd(null); await t.sleep(1400);
      ok(await t.until(() => !!document.getElementById('visitorG'), null, 4000), `${tag} dogpark: a visitor shows up`);
      await fullyOn('dogpark visitor', ['#dogHit', '#visitorG']);
      await t.ev(() => { window.__paw.S.rehomed = []; window.__paw.saveNow(); });

      // ---------- every town place ----------
      for (const pl of ['market', 'square', 'cafe', 'pier', 'hilltop', 'dogpark', 'vet', 'salon']) {
        t.sec(`${tag}: ${pl}`);
        await t.home(pl); await t.until(() => !!document.getElementById('dogHit')); await t.sleep(900);
        const must = ['#dogHit'];
        if (pl === 'square') must.push('#easelG'); if (pl === 'dogpark') must.push('#playboardG');
        await check(pl, must, ['#sceneG [data-hot]']);
        if (pl === 'market') { await fullyOn('market', ['#dogHit', '#bowlG']); const sh = await t.ev(() => ['kibble', 'boutique'].map((k) => { const b = document.querySelector(`[data-shop=${k}]`).getBoundingClientRect(); return [k, Math.min(b.right, innerWidth) - Math.max(b.left, 0)]; })); for (const [k, w] of sh) ok(w >= 120, `${tag} market: the ${k} shop is partly on screen (${Math.round(w)} px wide) and look-right reaches the rest`); }
        await toastsGone();
        await check(pl + ' quiet', must);
        await bubbleVsChip(pl);
        await peekCheck(pl);
      }

      // ---------- garden ----------
      t.sec(tag + ': garden');
      await t.patch({ inv: { seeds: { carrot: 3, peas: 3 } } });
      await t.home('yard'); await t.ev(() => window.__paw.go('garden'));
      ok(await t.until(() => document.querySelectorAll('.pg-plot').length === 6, null, 8000), `${tag} garden: six plots`);
      await t.sleep(600);
      const g = await t.ev(() => {
        const vh = innerHeight, out = { plots: [], info: null, cov: [] };
        document.querySelectorAll('.pg-plot').forEach((p, i) => { const r = p.getBoundingClientRect(); out.plots.push([i + 1, Math.round(r.top), Math.round(r.bottom)]); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!top || !p.contains(top)) out.cov.push('plot ' + (i + 1) + ' under ' + (top ? (top.id || top.className) : 'nothing')); });
        const inf = document.querySelector('.pg-info'); if (inf) { const r = inf.getBoundingClientRect(); out.info = [Math.round(r.top), Math.round(r.bottom)]; }
        out.vh = vh; out.sc = document.querySelector('.pg-root').scrollTop; return out;
      });
      ok(g.plots.every((p) => p[1] >= 0 && p[2] <= g.vh), `${tag} garden: plots 1-6 fit without scrolling ${JSON.stringify(g.plots.slice(3))} in ${g.vh}`);
      ok(g.info && g.info[1] <= g.vh, `${tag} garden: the plot card fits without scrolling ${JSON.stringify(g.info)} in ${g.vh}`);
      ok(g.cov.length === 0, `${tag} garden: no plot is covered ${g.cov.join(' | ')}`);
      const gd = await t.ev(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; }; return { dog: r('.pg-dogw'), done: r('.pg-done'), vh: innerHeight }; });
      ok(gd.dog && gd.dog[3] <= gd.vh && gd.dog[1] >= 0, `${tag} garden: the dog is on screen without scrolling ${JSON.stringify(gd.dog)} in ${gd.vh}`);
      ok(gd.done && gd.done[2] - gd.done[0] >= 43.5 && gd.done[3] - gd.done[1] >= 43.5, `${tag} garden: Done is >= 44 px ${JSON.stringify(gd.done)}`);
      const gl = await t.ev(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; }; return { plots: r('.pg-plot:nth-child(6)'), info: r('.pg-info'), chips: r('.pg-chips'), hint: document.querySelector('.pg-hint').textContent, btns: [...document.querySelectorAll('.pg-info .pg-btn')].map((b) => b.textContent) }; });
      ok(gl.info && gl.chips && gl.chips[0] >= gl.info[1], `${tag} garden: the weather chips sit below the plot card, not under it ${JSON.stringify(gl)}`);
      ok(!/\([A-Z]\)/.test(gl.hint + gl.btns.join(' ')), `${tag} garden: no keyboard hints on phones "${gl.hint}" ${gl.btns.join(',')}`);
      // one-tap planting: tapping an empty plot opens the seed pouch, one tap on a seed plants it: planted, no separate dig step
      const before = await t.ev(() => document.querySelectorAll('.pg-plot .pg-crop svg, .pg-plot .pg-crop img').length);
      await t.p.locator('.pg-plot').nth(5).tap();
      if (await t.until(() => !!document.querySelector('.pg-pk'), null, 3000)) {
        await t.p.locator('.pg-pk:not(.pg-off)').first().tap();
        ok(await t.until(() => { const c = document.querySelectorAll('.pg-plot')[5].querySelector('.pg-crop'); return !!c && c.innerHTML.length > 20; }, null, 4000), `${tag} garden: a seed is planted with one tap on an empty plot`);
      } else ok(false, `${tag} garden: the seed pouch opens`);
      void before;

      // ---------- kitchen ----------
      t.sec(tag + ': kitchen');
      await t.home('house'); await t.ev(() => window.__paw.go('kitchen'));
      if (await t.until(() => !!document.querySelector('.pk-root'), null, 8000)) {
        await t.sleep(600);
        const k = await t.ev(() => {
          const vh = innerHeight, out = { bad: [], vh };
          document.querySelectorAll('.pk-root button').forEach((b) => { const r = b.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return; const root = document.querySelector('.pk-root').getBoundingClientRect(); if (r.top < root.top || r.bottom > root.bottom) return; const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (top && !b.contains(top) && !top.contains(b)) out.bad.push((b.textContent.trim().slice(0, 12) || b.className) + ' under ' + (top.id || top.className)); });
          return out;
        });
        ok(k.bad.length === 0, `${tag} kitchen: visible controls are not covered ${k.bad.slice(0, 4).join(' | ')}`);
        await t.SH(`${tag}_kitchen`);
      } else ok(false, `${tag} kitchen: opens`);

      // ---------- mailbox ----------
      t.sec(tag + ': mailbox');
      await t.home('yard');
      await t.ev(() => { const P = window.__paw; P.S.mail = []; P.mailPush({ kind: 'news', from: 'Paw Haven Post', title: 'Hello', text: 'Hello there.' }); P.openMailbox(); });
      await t.until(() => !!document.querySelector('#modal .panel.mailbox, #modal .panel .mbtabs')); await t.sleep(500);
      await sheet('mailbox');
      const mb = await t.ev(() => [...document.querySelectorAll('.mbtabs .btn')].map((b) => { const r = b.getBoundingClientRect(); return b.textContent.trim().slice(0, 10) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height * 10) / 10; }));
      ok(mb.length >= 2 && (await t.ev(() => [...document.querySelectorAll('.mbtabs .btn')].every((b) => { const r = b.getBoundingClientRect(); return r.height >= 43.5 && r.width >= 43.5; }))), `${tag} mailbox: Letters / Album buttons are >= 44 px (${mb.join(', ')})`);
      await dismiss(); await t.modalGone();

      // ---------- nursery ----------
      t.sec(tag + ': nursery');
      await t.ev(() => {
        const P = window.__paw, S = P.S, f = S.dog; f.sex = 'female'; const iso = new Date().toISOString().slice(0, 10);
        const mk = (k) => ({ id: 'op' + k, name: ['Nib', 'Moss', 'Pip'][k], key: f.key, sex: k % 2 ? 'male' : 'female', coat: 'Red', eyes: 'brown', born: iso, genes: JSON.parse(JSON.stringify(f.genes)), sparkle: false, fate: null });
        S.litters = [{ id: 'lt_occl', mum: f.id, sire: f.id, born: iso, ready: iso, pups: [0, 1, 2].map(mk), stage: 'nursery', named: true }]; P.saveNow();
      });
      await t.home('yard'); await t.sleep(900);
      for (let i = 0; i < 4; i++) { // (the dog may wander and send the camera back: try again)
        if (await t.ev(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look right')) await t.p.tap('#phPeek');
        await t.until(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look back at the dog', null, 5000); await t.sleep(900); await steady();
        if (await t.ev(() => { const b = document.querySelector('#nurseryG > rect').getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth; })) break;
      }
      await fullyOn('nursery basket (look right)', ['#nurseryG > rect']);
      await check('nursery basket (look right)', ['#nurseryG > rect']);
      await t.p.tap('#phPeek'); await t.until(() => document.getElementById('phPeek').getAttribute('aria-label') === 'Look right', null, 5000);
      const opened = await t.ev(() => { try { window.__paw.breed.openNursery('lt_occl'); return true; } catch (e) { return String(e); } });
      if (opened === true && await t.until(() => !!document.getElementById('nsCount'), null, 5000)) {
        await t.sleep(500); // the sheet slides up
        await sheet('nursery');
        const sx = await t.ev(() => [...document.querySelectorAll('#modal .sex')].map((e) => parseFloat(getComputedStyle(e).fontSize)));
        ok(sx.length === 0 || sx.every((f) => f >= 14.95), `${tag} nursery: sex symbols are >= 15 px (${sx.join(', ') || 'none shown'})`);
        await dismiss(); await t.modalGone();
      } else ok(false, `${tag} nursery: opens (${opened})`);
    }, { device: 'iPhone 13', timeout: 420000 }); // v2.3: 341 checks per size; under a full --jobs 2 run one size can pass 240 s
  }
  // desktop (unchanged layout): Settings keeps Reset save and Title screen in view at 1280x720 without scrolling
  await run('phone_occl_home_desktop_settings', async (t) => {
    await t.newGame({ sex: 'girl' });
    await t.p.click('#gearBtn'); await t.until(() => !!document.getElementById('setReset')); await t.sleep(500);
    const r = await t.ev(() => { const b = (s) => { const e = document.querySelector(s).getBoundingClientRect(); return [Math.round(e.top), Math.round(e.bottom)]; }; return { reset: b('#setReset'), title: b('#setTitle'), body: b('#modal .panel'), vh: innerHeight }; });
    t.ok(r.reset[0] >= r.body[0] && r.reset[1] <= r.body[1] + 1 && r.reset[1] <= r.vh, `desktop settings: Reset save is visible without scrolling ${JSON.stringify(r.reset)} in ${r.vh}`);
    t.ok(r.title[0] >= r.body[0] && r.title[1] <= r.body[1] + 1 && r.title[1] <= r.vh, `desktop settings: Title screen is visible without scrolling ${JSON.stringify(r.title)}`);
  });
})();
