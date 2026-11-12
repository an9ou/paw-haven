/* ======================= INPUT ======================= */
let audioReady = false;
function firstGesture() { SFX.init(); if (!audioReady) { audioReady = true; applyAudioPrefs(); audioPlace(); } }
window.addEventListener('pointerdown', firstGesture, { capture: true });
window.addEventListener('keydown', (e) => {
  firstGesture();
  // v2.29: a story scene owns the keys (1-7, Space, the mode's own keys); Escape skips it once Skip shows (57_scenes.js, capture phase)
  if (typeof scPlaying === 'function' && scPlaying()) { const a = document.activeElement, inSc = !!(a && a.closest && a.closest('#scLayer')); if (!inSc && (e.key === ' ' || e.key === 'Enter' || /^[1-7]$/.test(e.key))) e.preventDefault(); return; }
  if (cur.key && modal.hidden) { cur.key(e); if (e.defaultPrevented) return; }
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (e.key === 'Escape') { if (buyOpen) return; if (!modal.hidden) { closeModal(); return; } if (!devPanel.hidden) { devPanel.hidden = true; return; } if (['map', 'shelter', 'routes'].includes(cur.mode)) go('yard'); else if (cur.mode === 'garden' || cur.mode === 'kitchen') return; /* the module handles Esc (pouch / book first, then onClose) */ else if (cur.mode === 'yard') { if (TRN) closeTraining(); else closeTray(); } return; }
  if (!modal.hidden || tag === 'INPUT') return;
  if (typeof phActive === 'function' && phActive()) return; // v2.9: photo mode keeps the bar's number keys and space-petting off
  if (!bar.hidden && /^[1-7]$/.test(e.key)) { doAct(ACTS[+e.key - 1][0]); return; }
  if (cur.mode === 'yard' && e.key === ' ' && tag !== 'BUTTON') { e.preventDefault(); petTick(560 + RAND(-30, 30), 380); }
});
window.addEventListener('keyup', (e) => { if (cur.keyup) cur.keyup(e); });
$('#muteBtn').onclick = () => { firstGesture(); prefs.mute = !prefs.mute; savePrefs(); applyAudioPrefs(); updateMute(); if (!prefs.mute) SFX.boop(700); };
$('#gearBtn').onclick = () => { SFX.click(); openSettings(); };
$('#moreBtn').onclick = () => { SFX.click(); openMore(); };
$('#meters').addEventListener('click', () => { if (isPhone()) { hud.classList.toggle('hexp'); SFX.click(); } });
window.addEventListener('pagehide', saveNow);
let wasPortrait = null;
window.addEventListener('resize', () => { const p = portrait(); if (wasPortrait !== null && p !== wasPortrait && ['map', 'market'].includes(cur.mode) && modal.hidden) go(cur.mode); wasPortrait = p; });
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); saveNow(); } else if (S) { gardenAdvance(); birthdayCheck(); if (hiddenAt && Date.now() - hiddenAt > 120000 && cur.mode === 'yard') setTimeout(() => greetBark(), 600); } });


/* ---------- sideways rows on desktop (QA 6 Nov 2026) ---------- */
// One helper for every sideways chip row: the trick row, the pack chip rows (.cr-chips, also the friend's-dog row), the one-dog picker (.pk-pick),
// the home put-away row, the photo face row and the dock trays' .row. On a mouse: the wheel moves the row (a trackpad's own sideways swipe works
// as is; at an end the page scrolls on), a drag past 6 px scrolls it (the row holds the pointer, so leaving it does not stop the drag) and swallows
// the click the drag would fire. The listeners sit on the window, so a row that is drawn again needs no new binding; hsKeep keeps its scroll.
// Touch never comes here: phones scroll these rows natively (touch-action pan-x pan-y).
const HS_ROWS = '.trchips, .cr-chips, .pk-pick, .ho-put, .ex-frow, #dock .row';
function hsRow(t) { const r = t && t.closest ? t.closest(HS_ROWS) : null; return r && r.scrollWidth > r.clientWidth + 1 ? r : null; }
// run fn (a redraw) under root and put every row back where it was scrolled to (the rows are matched by their order)
function hsKeep(root, fn) {
  const rows = () => (root ? [...root.querySelectorAll(HS_ROWS)] : []), xs = rows().map((r) => r.scrollLeft);
  const out = fn(); if (xs.some((x) => x > 0)) rows().forEach((r, i) => { if (xs[i]) r.scrollLeft = xs[i]; });
  return out;
}
let hsDrag = null;
window.addEventListener('wheel', (e) => {
  if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return; const row = hsRow(e.target); if (!row) return;
  const max = row.scrollWidth - row.clientWidth, to = Math.max(0, Math.min(max, row.scrollLeft + e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? row.clientWidth : 1)));
  if (Math.abs(to - row.scrollLeft) < 0.5) return; // at an end: let the page (or the sheet) scroll on
  e.preventDefault(); row.scrollLeft = to;
}, { passive: false, capture: true });
window.addEventListener('pointerdown', (e) => {
  hsDrag = null; if (e.pointerType !== 'mouse' || e.button !== 0) return; const row = hsRow(e.target); if (!row) return;
  hsDrag = { row, id: e.pointerId, x: e.clientX, sl: row.scrollLeft, moved: false };
}, true);
window.addEventListener('pointermove', (e) => {
  const d = hsDrag; if (!d || e.pointerId !== d.id) return;
  if (!(e.buttons & 1)) { hsDrag = null; d.row.classList.remove('hs-drag'); return; } // the button came up outside the window
  const dx = e.clientX - d.x;
  if (!d.moved) { if (Math.abs(dx) < 6) return; d.moved = true; d.row.classList.add('hs-drag'); try { d.row.setPointerCapture(e.pointerId); } catch (er) { /* no capture */ } }
  d.row.scrollLeft = d.sl - dx;
}, true);
function hsEnd(e) {
  const d = hsDrag; if (!d || e.pointerId !== d.id) return; hsDrag = null; d.row.classList.remove('hs-drag');
  if (!d.moved || e.type !== 'pointerup') return;
  const swallow = (ev) => { ev.stopImmediatePropagation(); ev.preventDefault(); }; // the click a drag would fire on the chip under the pointer
  window.addEventListener('click', swallow, { capture: true, once: true }); setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
}
window.addEventListener('pointerup', hsEnd, true); window.addEventListener('pointercancel', hsEnd, true);
