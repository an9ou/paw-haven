// v2.3 PHONE PLAY, area walkfetch: walk/fetch results sheets, fetch toast, keyboard wording, route carousel height.
const goWalkQuit = async (H) => {
  const { t, ev, p } = H;
  await ev(() => { window.PawWalk = null; const S = window.__paw.S; S.sleeping = false; S.stats.energy = 95; window.__paw.go('walk', 'park'); });
  await t.until(() => !!document.getElementById('holdBtn'), null, 10000);
  return p;
};
const sheetInfo = (sel) => {
  const pn = document.querySelector('#modal .panel'); if (!pn) return null;
  const pr = pn.getBoundingClientRect(), h = pn.querySelector('h3'), h2 = pn.querySelector('h2'), body = pn.querySelector('.panel-body'), foot = pn.querySelector('.foot');
  const lh = (e) => { const cs = getComputedStyle(e); return parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2; };
  const out = { pw: pr.width, tiles: [], zero: [], vh: innerHeight };
  if (h) { const hr = h.getBoundingClientRect(), cs = getComputedStyle(h); out.hw = hr.width; out.hfont = parseFloat(cs.fontSize); out.hlines = Math.round(hr.height / lh(h)); }
  if (h2) { const r = h2.getBoundingClientRect(); out.h2left = r.left - pr.left; out.h2pad = parseFloat(getComputedStyle(h2).marginLeft) + parseFloat(getComputedStyle(h2).paddingLeft); }
  const area = body ? body.getBoundingClientRect() : pr, fr = foot ? foot.getBoundingClientRect() : null;
  pn.querySelectorAll('.res').forEach((e) => {
    const r = e.getBoundingClientRect(), v = e.querySelector('.v').textContent.trim();
    out.tiles.push({ v, top: r.top, bottom: r.bottom });
    if (/^[+-]?0$/.test(v)) out.zero.push(v);
    out.clip = out.clip || (r.bottom > area.bottom + 1 || (fr && r.bottom > fr.top + 1 && r.top < fr.bottom) || r.top < area.top - 1 || r.bottom > innerHeight);
  });
  out.kind = !!pn.querySelector('.wf-nil');
  out.txt = pn.textContent;
  return out;
};
module.exports = {
  name: 'walkfetch',
  async phone(H, w, h, tag) {
    const { t, ok, ev, p } = H;
    // ---- classic walk: quit at once -> results sheet
    await goWalkQuit(H);
    ok(!/or D\b|or Space/.test(await ev(() => document.body.innerText)), `${tag} walkfetch: the walk screen has no keyboard-only wording`);
    await p.locator('#walkQuit').click(); await p.waitForSelector('#resOk');
    await H.settle(['#modal .panel']);
    const r = await ev(`(${sheetInfo})()`);
    ok(r.hw >= r.pw * 0.6, `${tag} walkfetch: the headline uses the width (${Math.round(r.hw)} of ${Math.round(r.pw)})`);
    ok(r.hfont >= 24, `${tag} walkfetch: the headline font is >= 24px (${r.hfont})`);
    ok(r.hlines <= 3, `${tag} walkfetch: the headline is not one word per line (${r.hlines} lines)`);
    ok(r.h2left >= 56, `${tag} walkfetch: the title clears the tape in the top-left corner (left offset ${Math.round(r.h2left)})`);
    ok(!r.clip, `${tag} walkfetch: no results tile is clipped or under the footer button`);
    ok(r.zero.length === 0, `${tag} walkfetch: no zero tiles (${r.zero.join(',')})`);
    ok(r.tiles.length > 0 || r.kind, `${tag} walkfetch: tiles, or the kind one-liner when all are zero`);
    await p.locator('#resOk').click(); await t.untilMode('yard');

    // ---- fetch: a toast from the start must be gone after endFetch, and the hint has no "(or Space)"
    await ev(() => window.__paw.go('fetch', 'Tennis Ball')); await t.until(() => !!document.getElementById('fQuit'), null, 8000);
    ok(await t.until(() => !!document.querySelector('#toasts .toast'), null, 3000), `${tag} walkfetch: the throw toast is showing during fetch`);
    ok(!/or Space/.test(await ev(() => document.getElementById('dock').textContent)), `${tag} walkfetch: the fetch hint has no "(or Space)"`);
    await p.locator('#fQuit').click(); await p.waitForSelector('#fOk');
    ok((await ev(() => document.querySelectorAll('#toasts .toast').length)) === 0, `${tag} walkfetch: no toast lingers after endFetch`);
    await H.settle(['#modal .panel']);
    const f = await ev(`(${sheetInfo})()`);
    ok(f.zero.length === 0 && !f.clip, `${tag} walkfetch: fetch results have no zero tiles and nothing clipped`);
    await p.locator('#fOk').click(); await t.untilMode('yard');

    // ---- carousel on the phone: the whole card fits
    await ev(() => window.__paw.go('routes')); await t.until(() => !!document.getElementById('rtView'), null, 6000); await H.settle(['#rtView', '.rt-card.cur']);
    const c = await ev(carouselFit); ok(c.ok, `${tag} walkfetch: carousel card fits #rtView ${c.msg}`);
    await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  },
  async desk(H) {
    const { t, ok, ev, p } = H;
    await goWalkQuit(H);
    await p.locator('#walkQuit').click(); await p.waitForSelector('#resOk'); await H.settle(['#modal .panel']);
    const r = await ev(`(${sheetInfo})()`);
    ok(r.zero.length === 0, `desk walkfetch: no zero tiles on the desktop results sheet (${r.zero.join(',')})`);
    ok(r.tiles.length > 0 || r.kind, 'desk walkfetch: tiles, or the kind one-liner');
    await p.locator('#resOk').click(); await t.untilMode('yard');
    for (const [w, h] of [[1280, 720], [1024, 768], [1280, 600]]) {
      await t.p.setViewportSize({ width: w, height: h }); await t.until((w) => innerWidth === w, w, 5000);
      await ev(() => window.__paw.go('routes')); await t.until(() => !!document.getElementById('rtView'), null, 6000); await H.settle(['#rtView', '.rt-card.cur']);
      const c = await ev(carouselFit); ok(c.ok, `desk walkfetch ${w}x${h}: carousel card incl. name, length, weather fits #rtView ${c.msg}`);
      await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
    }
    await t.p.setViewportSize({ width: 1280, height: 720 });
  },
};
function carouselFit() {
  const v = document.getElementById('rtView').getBoundingClientRect(), card = document.querySelector('.rt-card.cur');
  const parts = ['h3', '.rt-meta', '.rt-env'].map((s) => card.querySelector(s).getBoundingClientRect());
  const inside = parts.every((r) => r.top >= v.top - 1 && r.bottom <= v.bottom + 1) && card.getBoundingClientRect().bottom <= v.bottom + 1;
  return { ok: inside, msg: `(view ${Math.round(v.top)}-${Math.round(v.bottom)}, card ${Math.round(card.getBoundingClientRect().top)}-${Math.round(card.getBoundingClientRect().bottom)})` };
}
