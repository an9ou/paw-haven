// v2.33 overlap review (docs/reviews/V233_overlap_review.md) S5 and S6, against the Friends cloud mock (game/fr_mock.js) with hp:
//   S5: on a friend visit on a phone, a toast starts under the Help out strip #hpStrip (as at home under the wish chip, phChipClear in 00_core.js),
//       never on the strip, the place chip, their leader's wish bubble #hpWish or the phone bar: 360x640, 390x844, 412x915 in en, de, th, ja.
//   S6: a dog's speech bubble (sayPlace in 00_core.js) keeps off the visit wish bubble and the strip, and off a sleepover guest's name tag at home;
//       with no clear spot at all it goes under them (class sub) and leaves sooner.
//   node game/run_tests.js v233_overlap        OVL_SHOTS=<folder>: screenshots (deviceScaleFactor 2)
const { run, URL } = require('./test_lib');
const { mockInit } = require('./fr_mock');

const ME = { fid: 'ownerxxxxxxxxxxxxxxxxx', code: 'DOG-23456', name: [3, 4] };
const SUNNY = 'sunnybiscuitxxxxxxxxxx', FERN = ('cozyfern' + 'x'.repeat(22)).slice(0, 22), CLOVER = ('happyclover' + 'x'.repeat(22)).slice(0, 22);
const SHOTS = process.env.OVL_SHOTS || '';
const SIZES = [[360, 640], [390, 844], [412, 915]], LANGS = ['en', 'de', 'th', 'ja'];
const LONG = 'Bella leans on you. All of him. It is a lot of dog.'; // the review's line (test text only)

// a phone game with Friends and the helps on (the mock Worker has hp, prefs.hpTest), three friends with yards
async function start(t, o) {
  await t.mk(Object.assign({ prefs: { frTest: true, ddTest: true, hpTest: true }, device: 'iPhone 15', dsf: 2 }, o.lang ? { lang: o.lang } : {}));
  await t.p.setViewportSize({ width: o.vw, height: o.vh });
  await t.ctx.addInitScript(mockInit, { hp: true });
  await t.p.goto(URL);
  await t.p.waitForSelector('#tNew, #tContinue, #tGuest, #tPlay');
  if (await t.p.locator('#tGuest').count()) { await t.p.click('#tGuest'); await t.p.waitForSelector('#tNew'); }
  await t.adopt({});
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000 });
  await t.calm();
  await t.until(() => !!(window.__paw && window.__paw.hp && window.__paw.fr && window.__frSrv), null, 8000);
  await t.ev(([ids, me]) => {
    const s = window.__frSrv, [sunny, fern, clover] = ids;
    s.yardOf[clover] = { v: 1, name: [1, 6], house: 1, season: 'autumn', dogs: [{ b: 2, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 2 }], decor: [] };
    s.friends = [[sunny, [0, 0]], [fern, [2, 11]], [clover, [1, 6]]].map(([fid, name]) => ({ fid, name, dogs: s.yardOf[fid].dogs, seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } }));
    s.me = me; s.events = [];
  }, [[SUNNY, FERN, CLOVER], ME]);
  await t.ev(() => window.__paw.hp.load());
}
const jst = (t) => t.ev(() => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
async function visit(t, fid, hp) {
  await t.ev(([f, h]) => { const y = window.__frSrv.yardOf[f]; if (h) y.hp = h; else delete y.hp; const S = window.__paw.S; if (S.fr && S.fr.yards) S.fr.yards = {}; }, [fid, hp]);
  await t.ev((f) => window.__paw.fr.visit(f), fid);
  return t.until((f) => window.__paw.mode === 'fryard' && window.__paw.fr.scene().fid === f && window.__paw.hp.visit().on && !!document.querySelector('#view .hp-bowl:not([style*="none"])'), fid, 8000);
}
async function shot(t, name) { if (!SHOTS) return; try { require('fs').mkdirSync(SHOTS, { recursive: true }); await t.p.screenshot({ path: require('path').join(SHOTS, name + '.png') }); } catch (e) { /* no folder */ } }
// in the page: the toast on screen against the strip, the place chip, the wish bubble and the bar
function toastLook() {
  const R = (e) => e.getBoundingClientRect(), ov = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
  const on = [...document.querySelectorAll('#toasts .toast:not(.tq)')].filter((q) => R(q).height > 0); if (!on.length) return { none: true };
  const bad = [], strip = document.getElementById('hpStrip'), sr = strip && R(strip);
  on.forEach((q) => { const r = R(q); ['#hpStrip', '#status', '#hpWish:not([hidden])', '#bar:not([hidden])', '#placeBtns .btn'].forEach((s) => document.querySelectorAll(s).forEach((e) => { if (e.getClientRects().length && ov(r, R(e))) bad.push(q.textContent.slice(0, 24) + ' on ' + (e.id || e.textContent.trim().slice(0, 12))); })); if (sr && r.top < sr.bottom - 1) bad.push('above the strip end ' + Math.round(r.top) + '/' + Math.round(sr.bottom)); });
  return { bad, lines: on.map((q) => Math.round(R(q).height)), top: on.map((q) => Math.round(R(q).top)), strip: sr ? Math.round(sr.bottom) : null };
}

run('v233_overlap', async (t) => {
  const { ok, sec, ev } = t;
  const today = () => jst(t);

  /* ---------- S5: the toast after a help, on a visit ---------- */
  for (const lang of LANGS) {
    sec(`S5. ${lang}: the toast after a help starts under the Help out strip, at ${SIZES.map((s) => s.join('x')).join(', ')}`);
    await start(t, { vw: SIZES[0][0], vh: SIZES[0][1], lang });
    ok(await t.until(() => document.documentElement.dataset.layout === 'phone', null, 4000), lang + ': the phone layout');
    const d = await today();
    for (const [w, h] of SIZES) {
      const tag = lang + ' ' + w + 'x' + h;
      await t.p.setViewportSize({ width: w, height: h }); await t.sleep(300);
      await ev(() => { window.__toasts.length = 0; document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
      ok(await visit(t, [SUNNY, FERN, CLOVER][SIZES.findIndex((s) => s[0] === w)], { d, g: 2, w: 1 }), tag + ': a visit with all three helps');
      await t.sleep(500);
      await ev(() => window.__paw.hp.tap('bowl', 'strip'));
      ok(await t.waitToast(/./, 6000), tag + ': a toast after the bowl help: ' + JSON.stringify(await ev(() => window.__toasts.slice(-2))));
      await t.sleep(800); // a help pans the camera (0.5 s); the toast follows the wish bubble
      const L = await ev(toastLook);
      ok(!L.none && !L.bad.length, tag + ': the toast is under the strip, clear of the strip, chip, wish bubble, buttons and bar: ' + JSON.stringify(L));
      await shot(t, 'S5_toast_' + tag.replace(/ /g, '_'));
      // a long toast (it wraps) and their leader's wish bubble pushed right under the strip (a tall leader): the toast steps under the bubble
      await ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()));
      // (in one go: the frame loop moves the bubble again when their leader moves; the toast column is placed when the toast comes)
      const L2 = await ev(() => {
        const b = document.getElementById('hpWish'), s = document.getElementById('hpStrip'), tc = document.getElementById('toasts'); if (!b || !s) return { bad: ['no bubble or strip'] };
        b.hidden = false; b.style.top = (s.offsetTop + s.offsetHeight + 6) + 'px';
        window.__paw.toast('Friends need an internet connection. Your dog is happy at home, and that is a long line to wrap.', 'good');
        const st = document.getElementById('stage').getBoundingClientRect(), y = st.top + parseFloat(tc.style.top), h = [...tc.querySelectorAll('.toast:not(.tq)')].reduce((a, e) => a + e.offsetHeight, 0), wr = b.getBoundingClientRect(), sr = s.getBoundingClientRect();
        const pb = [...document.querySelectorAll('#placeBtns .btn')].map((e) => e.getBoundingClientRect().top), bad = [];
        if (y < sr.bottom) bad.push('on the strip'); if (y < wr.bottom && y + h > wr.top) bad.push('on the wish bubble'); const bt = document.getElementById('bar').getBoundingClientRect().top; if (y + h > bt) bad.push('on the bar'); // (a very long line may reach the visit buttons; never the bar)
        return { bad, y: Math.round(y), h, btns: pb.length && y + h > Math.min(...pb), wish: [Math.round(wr.top), Math.round(wr.bottom)], strip: Math.round(sr.bottom) };
      });
      ok(!L2.bad.length && L2.h > 40, tag + ': a long toast with the wish bubble right under the strip: under both, above the bar: ' + JSON.stringify(L2));
      await ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()));
    }
    await t.ctx.close();
  }

  /* ---------- S6: a speech bubble vs the visit wish bubble and the strip ---------- */
  for (const [w, h, lang] of [[390, 844, 'en'], [360, 640, 'de'], [412, 915, 'ja']]) {
    const tag = lang + ' ' + w + 'x' + h;
    sec(`S6. ${tag}: a speech bubble over their leader keeps off its wish bubble and the strip`);
    await start(t, { vw: w, vh: h, lang });
    ok(await visit(t, SUNNY, { d: await today(), g: 2, w: 1 }), tag + ': a visit with a wish');
    await t.sleep(2600); // the greeting plays, the bubble settles
    const sayAt = () => ev((txt) => { // the speaking point: their leader's head, just under the wish bubble's tail
      const b = document.getElementById('hpWish'); if (!b || b.hidden) return null;
      const r = b.getBoundingClientRect(), tail = parseFloat(b.style.getPropertyValue('--tail')) || 40, svg = document.querySelector('#view > svg.world'), pt = svg.createSVGPoint();
      pt.x = r.left + tail + 7; pt.y = r.bottom + 18; const q = pt.matrixTransform(svg.getScreenCTM().inverse());
      window.__paw.home.say(txt, q.x, q.y); return true;
    }, LONG);
    ok(await sayAt(), tag + ': the wish bubble shows, a line is said at its dog');
    await t.sleep(400);
    const B = await ev(() => {
      const R = (e) => e.getBoundingClientRect(), ov = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5, bub = document.getElementById('bubble'), br = R(bub), bad = [];
      ['hpWish', 'hpStrip', 'status', 'phPeek'].forEach((id) => { const e = document.getElementById(id); if (e && !e.hidden && e.getClientRects().length && ov(br, R(e))) bad.push(id); });
      return { bad, sub: bub.classList.contains('sub'), hidden: bub.hidden, bub: [br.left, br.top, br.right, br.bottom].map(Math.round), wish: (() => { const r = R(document.getElementById('hpWish')); return [r.left, r.top, r.right, r.bottom].map(Math.round); })() };
    });
    // the review's case (en 390) has room: clear of everything. A long German line at 360 may find no clear spot (the gap between the strip and the
    // wish bubble is shorter than the line): then the last resort, under the wish bubble (class sub), never over it
    ok(!B.hidden && ((!B.bad.length && !B.sub) || (lang !== 'en' && B.sub)), tag + ': the speech bubble is clear of the wish bubble, the strip, the chip and the arrow' + (B.sub ? ' (no clear spot: under the wish bubble, the last resort)' : '') + ': ' + JSON.stringify(B));
    if (B.sub) ok(await ev(() => getComputedStyle(document.getElementById('bubble')).zIndex === '2'), tag + ': the last resort draws it under the wish bubble');
    await shot(t, 'S6_say_wish_' + tag.replace(/ /g, '_'));
    if (lang === 'en') { // the last resort: a chip over the whole view (no clear spot): the bubble goes under it (z-order) and leaves within 1.6 s
      await ev(() => { const v = document.getElementById('view'), f = document.createElement('div'); f.id = 'ddWish'; f.style.cssText = 'position:absolute;inset:0;z-index:3'; v.appendChild(f); });
      ok(await sayAt(), tag + ': the line said again with no clear spot');
      const z = await ev(() => { const b = document.getElementById('bubble'); return { sub: b.classList.contains('sub'), z: getComputedStyle(b).zIndex }; });
      ok(z.sub && z.z === '2', tag + ': no clear spot: the bubble goes under the chips (class sub, z-index 2): ' + JSON.stringify(z));
      ok(await t.until(() => document.getElementById('bubble').hidden, null, 2200), tag + ': and leaves sooner (1.6 s)');
      await ev(() => document.getElementById('ddWish').remove());
      await ev(() => window.__paw.home.say('Hello there.', 300, 300)); await t.sleep(100);
      ok(await ev(() => !document.getElementById('bubble').classList.contains('sub')), tag + ': the next line is back on top');
    }
    await t.ctx.close();
  }

  /* ---------- S6: a speech bubble vs a sleepover guest's name tag at home ---------- */
  for (const [w, h, lang] of [[1280, 720, 'en'], [390, 844, 'en'], [360, 640, 'th']]) {
    const tag = lang + ' ' + w + 'x' + h;
    sec(`S6. ${tag}: a line said by a sleepover guest, or next to one, keeps off its name tag`);
    await start(t, { vw: w, vh: h, lang });
    await ev(() => window.__paw.go('town')).catch(() => {}); await t.sleep(300);
    await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await t.sleep(500);
    await ev(([ids]) => { const s = window.__frSrv, day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); s.acts = [{ id: 700, from: { fid: ids[0], name: [0, 0] }, kind: 'sleep', data: { dog: { b: window.PawGenes.BREEDS.indexOf('dane'), c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 } }, day, claimed: false }]; }, [[SUNNY]]);
    await ev(() => window.__paw.hp.inbox());
    ok(await t.until(() => document.querySelectorAll('#hpGuests .hp-guest').length === 1, null, 6000), tag + ': a guest drawn');
    await t.until(() => window.__paw.hp.sl.drawn().every((o) => !o.hush), null, 6000); await t.sleep(400);
    let n = 0, bad = [], subs = 0;
    for (const who of ['guest', 'leader']) { // the guest itself (its tag is over its head or under its feet), then my leader
      const r = await ev(([who, txt]) => {
        const svg = document.querySelector('#view > svg.world'), M = svg.getScreenCTM().inverse(), at = document.querySelector('#hpTags .sl-tagat'), tg = at && at.getAttribute('visibility') !== 'hidden' ? at.querySelector('.sl-tag') : null;
        if (!tg) return { skip: 'no tag in view' };
        let x, y; if (who === 'guest') { const g = document.querySelector('#hpGuests .sl-gart').getBoundingClientRect(); x = g.left + g.width * 0.6; y = g.top + 4; } else { const tr = tg.getBoundingClientRect(); x = tr.left + tr.width / 2; y = tr.bottom + 40; }
        const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); window.__paw.home.say(txt, q.x, q.y);
        const b = document.getElementById('bubble').getBoundingClientRect(), t2 = tg.getBoundingClientRect(), ov = Math.min(b.right, t2.right) - Math.max(b.left, t2.left) > 0.5 && Math.min(b.bottom, t2.bottom) - Math.max(b.top, t2.top) > 0.5;
        return { ov, sub: document.getElementById('bubble').classList.contains('sub'), bub: [b.left, b.top, b.right, b.bottom].map(Math.round), tag: [t2.left, t2.top, t2.right, t2.bottom].map(Math.round) };
      }, [who, LONG]);
      if (r.skip) continue; n++;
      if (r.ov && !r.sub) bad.push(who + ' ' + JSON.stringify(r)); if (r.sub) subs++;
      await t.sleep(350); await shot(t, 'S6_say_tag_' + who + '_' + tag.replace(/ /g, '_'));
    }
    ok(n > 0 && !bad.length, tag + `: ${n} lines, none drawn over the guest's tag (${subs} under it as the last resort): ` + bad.join(' | '));
    await t.ctx.close();
  }
}, { timeout: 400000 });
