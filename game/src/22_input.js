/* ======================= INPUT ======================= */
let audioReady = false;
function firstGesture() { SFX.init(); if (!audioReady) { audioReady = true; applyAudioPrefs(); audioPlace(); } }
window.addEventListener('pointerdown', firstGesture, { capture: true });
window.addEventListener('keydown', (e) => {
  firstGesture();
  if (cur.key && modal.hidden) { cur.key(e); if (e.defaultPrevented) return; }
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (e.key === 'Escape') { if (buyOpen) return; if (!modal.hidden) { closeModal(); return; } if (!devPanel.hidden) { devPanel.hidden = true; return; } if (['map', 'shelter', 'routes'].includes(cur.mode)) go('yard'); else if (cur.mode === 'garden' || cur.mode === 'kitchen') return; /* the module handles Esc (pouch / book first, then onClose) */ else if (cur.mode === 'yard') { if (TRN) closeTraining(); else closeTray(); } return; }
  if (!modal.hidden || tag === 'INPUT') return;
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

