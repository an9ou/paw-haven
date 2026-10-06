/* ======================= v2.2 PHONE SHELL: mode switch, portrait lock, HUD, sheets (SHELL lane, tag ps) ======================= */
/* Everything here only acts when isPhone() (html[data-layout="phone"]) or on a touch-only device. A mouse pointer never sees any of it.
   Cross-lane API: psSheetOpen(), psLongPress(el, text), bus 'phone:layout' { phone }, bus 'phone:lock' { on }. */

/* ---------- mode switch (called at load from 13_more_dogs.js through applyLayout, so no top-level const is read here) ---------- */
function psMQ(q) { return !!(window.matchMedia && matchMedia(q).matches); }
function psLayoutWanted() { return psMQ('(max-width: 820px)') || (psMQ('(orientation: portrait)') && window.innerWidth < 1024); }
function psApplyLayout(rerender) {
  const ph = psLayoutWanted(), was = isPhone();
  if (ph) document.documentElement.dataset.layout = 'phone'; else delete document.documentElement.dataset.layout;
  if (was !== ph) { if (!ph) hud.classList.remove('hexp'); emit('phone:layout', { phone: ph }); }
  if (rerender && was !== ph && S && ['yard', 'map', 'shelter'].includes(cur.mode)) go(cur.mode);
  else camApply(camCx);
  psLockCheck();
}

/* ---------- portrait lock: a touch-only device held sideways with a short screen ---------- */
function psLockWanted() { return psMQ('(pointer: coarse)') && !psMQ('(any-pointer: fine)') && psMQ('(orientation: landscape)') && window.innerHeight <= 500; }
function psLockCheck() {
  const on = psLockWanted(), html = document.documentElement, was = html.hasAttribute('data-pslock');
  if (on === was) return;
  let card = document.getElementById('psTurn');
  if (on && !card) {
    card = document.createElement('div'); card.id = 'psTurn'; card.setAttribute('role', 'alertdialog'); card.setAttribute('aria-label', 'Turn your phone upright');
    card.innerHTML = `<div class="ps-turn-card taped"><svg class="ps-turn-art" viewBox="-40 -40 80 80" aria-hidden="true"><g fill="none" stroke="#5B3D32" stroke-linecap="round" stroke-linejoin="round"><path d="M-9 -25 Q-1 -27.5 8 -25.5 Q15 -24 14.6 -17 Q15.6 0 14.2 18 Q14.5 25 8 25.8 Q-1 27.5 -9.5 25.4 Q-15.4 24.6 -14.4 17.5 Q-15.2 -1 -14.6 -17.5 Q-15 -23.8 -9 -25 Z" fill="#FFFBF3" stroke-width="3.2"/><path d="M-11.2 -20.5 Q-11.6 -2 -11 15.5 M-6 -21.4 Q2 -22.2 10.2 -21" stroke-width="1.4" opacity=".45"/><path d="M-12 18.6 Q0 20 11.6 18.2" stroke-width="1.5" opacity=".55"/><path d="M-3.5 -22.5 Q0 -23.2 3.8 -22.4" stroke-width="2.4"/><path d="M-2.6 22.4 Q0 21.2 2.8 22.6" stroke-width="2.2"/></g><g fill="none" stroke="#F28FA5" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M-31 -6.5 Q-33.5 -20 -17.5 -30.5"/><path d="M-26.5 -8.5 Q-29 -18 -18.5 -26.5" stroke-width="1.5" opacity=".5"/><path d="M-21 -33.5 Q-17.5 -31 -16 -29.5 Q-17.8 -27.4 -18.4 -23.6"/></g></svg><h2>Turn your phone upright</h2><p>Paw Haven plays standing up. Your game waits right here.</p></div>`;
    document.body.appendChild(card);
  }
  if (on) html.setAttribute('data-pslock', ''); else html.removeAttribute('data-pslock');
  if (card) card.hidden = !on;
  emit('phone:lock', { on });
  if (on) window.dispatchEvent(new Event('blur')); // review fix: the walk runner (mods/walkrun.js) pauses on blur, so it doesn't play on behind the card
}

/* ---------- sheets ---------- */
// true when the press starts inside something that scrolls or pans sideways (a tab row, the family tree, a pup row): the sheet's swipe-down leaves it alone
function psPansX(el, stop) {
  for (let n = el; n && n !== stop && n.nodeType === 1; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if ((/auto|scroll/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1) || /^pan-x$/.test(cs.touchAction.trim())) return true;
  }
  return false;
}
function psSheetOpen() { return isPhone() && (!modal.hidden || (typeof popOpen === 'function' && !!popOpen())); }

/* ---------- the "..." menu: Settings, sound, cloud status ---------- */
function psCloud() { try { return typeof cloudStatus === 'function' ? cloudStatus() : null; } catch (e) { return null; } }
function openMore() {
  const cs = psCloud(), hasCloud = !!cs || typeof cloudOpen === 'function';
  const p = openModal('Menu', `<div class="moremenu"><button class="btn big" id="mmSet"><span class="ic">${ICON('settings')}</span>Settings</button><button class="btn big" id="mmMute"><span class="ic">${ICON(prefs.mute ? 'sound-on' : 'sound-off')}</span>${prefs.mute ? 'Sound on' : 'Mute sound'}</button>${hasCloud ? `<button class="btn big" id="mmCloud">Cloud save</button>` : ''}${cs && cs.text ? `<p class="ps-cloud" data-state="${esc(cs.state || '')}" id="mmCloudTxt">${esc(cs.text)}</p>` : ''}</div>`, { cls: 'ps-more' });
  $('#mmSet', p).onclick = () => { closeModal(); openSettings(); };
  $('#mmMute', p).onclick = () => { closeModal(); $('#muteBtn').click(); };
  const cb = $('#mmCloud', p); if (cb) cb.onclick = () => { closeModal(); if (typeof cloudOpen === 'function') cloudOpen(); else openSettings(); };
}

/* ---------- HUD: a tap on the ring meters expands them (22_input.js); a tap anywhere else folds them again ---------- */
window.addEventListener('pointerdown', (e) => {
  if (!isPhone() || !hud.classList.contains('hexp') || e.target.closest('#meters')) return;
  hud.classList.remove('hexp');
}, { capture: true });

/* ---------- long-press tooltip: any [title] or [data-tip] inside the stage, or any element passed to psLongPress ---------- */
let psTipT = 0, psTipEl = null, psTipX = 0, psTipY = 0, psTipShownAt = 0;
function psTipHide() { clearTimeout(psTipT); if (psTipEl) { psTipEl.remove(); psTipEl = null; } }
function psTipShow(txt, x, y) {
  psTipHide(); const r = stage.getBoundingClientRect();
  const tip = document.createElement('div'); tip.className = 'lptip'; tip.setAttribute('role', 'tooltip'); tip.textContent = txt; stage.appendChild(tip); psTipEl = tip;
  tip.style.left = clamp(x - r.left - tip.offsetWidth / 2, 8, r.width - tip.offsetWidth - 8) + 'px';
  tip.style.top = Math.max(8, y - r.top - tip.offsetHeight - 28) + 'px';
  psTipShownAt = Date.now();
}
function psTipStart(e, txt) {
  if (!txt || e.pointerType === 'mouse') return;
  psTipHide(); psTipX = e.clientX; psTipY = e.clientY;
  psTipT = setTimeout(() => psTipShow(txt, psTipX, psTipY), 550);
}
function psLongPress(el, text) {
  if (!el) return el; el.setAttribute('data-tip', text);
  if (!stage.contains(el) && !el.dataset.psLp) { el.dataset.psLp = '1'; el.addEventListener('pointerdown', (e) => { if (isPhone()) psTipStart(e, el.getAttribute('data-tip')); }); }
  return el;
}
stage.addEventListener('pointerdown', (e) => {
  if (!isPhone() || e.pointerType === 'mouse') return; psTipHide();
  const el = e.target.closest('[data-tip],[title]'); if (!el || !stage.contains(el)) return;
  psTipStart(e, el.getAttribute('data-tip') || el.getAttribute('title'));
});
window.addEventListener('pointermove', (e) => { if (psTipT && Math.hypot(e.clientX - psTipX, e.clientY - psTipY) > 12) clearTimeout(psTipT); });
['pointerup', 'pointercancel'].forEach((ev) => window.addEventListener(ev, () => { clearTimeout(psTipT); if (psTipEl) setTimeout(psTipHide, 1400); }));
// a long press that showed a tooltip does not also press the button, and does not open the browser's own menu
window.addEventListener('click', (e) => { if (psTipShownAt && Date.now() - psTipShownAt < 1600 && psTipEl) { e.preventDefault(); e.stopPropagation(); psTipShownAt = 0; } }, { capture: true });
window.addEventListener('contextmenu', (e) => { if (isPhone() && e.target.closest && e.target.closest('#stage')) e.preventDefault(); });
// test hook (like window.__paw): the phone suites read the sheet state and try the long-press helper
window.__pawShell = { sheetOpen: () => psSheetOpen(), longPress: (el, text) => psLongPress(el, text) };
