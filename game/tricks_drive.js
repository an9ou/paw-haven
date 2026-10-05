// v1.7.1 trick mini-games: drive the mouse along the live track (shared by test_v16, test_v16b, test_v171_tricks).
// The game exposes window.__pawTG: track() = current part in client coordinates (+ tolerance in px), beats() = ms until each Speak beat.
// quality: 'great' (on the line), 'good' (the middle 30% a little outside the band), 'miss' (most of it outside), 'fast' (no pacing)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// press Start (or a Show off button) first; this traces every part of the attempt and waits for the result
async function trace(t, quality, o) {
  o = o || {}; const p = t.p; const q = quality || 'great';
  for (let part = 0; part < 4; part++) {
    const okTrack = await t.until(() => { const g = window.__pawTG.track(); return !!g && !g.busy; }, null, 8000);
    if (!okTrack) break;
    const tr = await t.ev(() => window.__pawTG.track()); const pi = tr.pi; let down = false;
    for (const seg of tr.segs) {
      if (seg.type === 'path' && q === 'fast') { // a flick: synthetic pointer events in one go, so the speed does not depend on CPU load
        await t.ev((pts) => { const hit = document.getElementById('tgHit'); const o = (x, y) => ({ clientX: x, clientY: y, bubbles: true, pointerId: 1, isPrimary: true });
          hit.dispatchEvent(new PointerEvent('pointerdown', o(pts[0][0], pts[0][1]))); for (let i = 1; i < pts.length; i += 4) window.dispatchEvent(new PointerEvent('pointermove', o(pts[i][0], pts[i][1])));
          const e = pts[pts.length - 1]; window.dispatchEvent(new PointerEvent('pointermove', o(e[0], e[1]))); window.dispatchEvent(new PointerEvent('pointerup', o(e[0], e[1]))); }, seg.pts);
        return t.until(() => !window.__pawTG.game, null, 6000);
      }
      if (seg.type === 'path') {
        const pts = seg.pts, n = pts.length, off = tr.tol * (q === 'good' ? 1.25 : q === 'miss' ? 1.4 : 0);
        const lo = q === 'good' ? 0.4 : 0.12, hi = q === 'good' ? 0.62 : 0.9;
        await p.mouse.move(pts[0][0], pts[0][1]); if (!down) { await p.mouse.down(); down = true; }
        for (let i = 1; i < n; i++) {
          let [x, y] = pts[i]; const f = i / (n - 1);
          if (off && f > lo && f < hi) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; x += -dy / m * off; y += dx / m * off; }
          await p.mouse.move(x, y);
          await sleep(14);
        }
        await p.mouse.move(pts[n - 1][0], pts[n - 1][1]);
      } else if (seg.type === 'tap') {
        if (down) { await p.mouse.up(); down = false; }
        for (let k = 0; k < seg.n; k++) { await p.mouse.click(seg.at[0] + (q === 'miss' && k === 0 ? tr.tol * 3 : 0), seg.at[1]); await sleep(120); }
        if (q === 'miss') { await p.mouse.click(seg.at[0], seg.at[1]); await sleep(120); }
      } else if (seg.type === 'hold') {
        if (!down) { await p.mouse.move(seg.at[0], seg.at[1]); await p.mouse.down(); down = true; } else await p.mouse.move(seg.at[0], seg.at[1]);
        await t.until((si) => { const g = window.__pawTG.game; return !g || g.si > si || g.busy; }, tr.segs.indexOf(seg), (seg.ms || 1000) + 3000);
      }
    }
    if (down) { await p.mouse.up(); down = false; }
    // next part of a combo, or the end of the attempt
    await t.until((pi) => { const g = window.__pawTG.game; return !g || g.pi > pi; }, pi, 6000);
    if (!(await t.ev(() => !!window.__pawTG.game))) break;
  }
  return t.until(() => !window.__pawTG.game, null, 6000);
}
// Speak rhythm: tap at beat + offset[i] ms (null = skip that beat). The click runs inside the page, so timing does not depend on CDP latency.
async function speak(t, offsets) {
  await t.until(() => !!window.__pawTG.beats(), null, 6000);
  await t.ev((offs) => { const b = window.__pawTG.beats(); b.forEach((ms, i) => { if (offs[i] == null) return; setTimeout(() => { const el = document.getElementById('trSpeak'); if (el) el.click(); else window.__pawTG.tap(); }, Math.max(0, ms + offs[i])); }); }, offsets);
  return t.until(() => !window.__pawTG.game, null, 8000);
}
// wait for the training panel and the scene zoom to settle (the track helper maps scene points to the screen at that moment)
async function settle(t) {
  await t.p.waitForSelector('#trainPanel:not([hidden])');
  let prev = ''; for (let i = 0; i < 30; i++) { const m = await t.ev(() => { const s = document.querySelector('#view > svg.world'); const c = s && s.getScreenCTM(); return c ? [c.a, c.e, c.f].map((v) => v.toFixed(2)).join() : ''; }); if (m && m === prev) return true; prev = m; await sleep(120); }
  return false;
}
// wait until the attempt's reaction is over and Start is back
const ready = (t) => t.until(() => !!document.getElementById('trStart') && !!window.__paw.train && !window.__paw.train.game && !window.__paw.train.held, null, 8000);
module.exports = { trace, speak, settle, ready };
