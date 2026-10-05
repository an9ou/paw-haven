/* ======================= BOOT ======================= */
function start(data) {
  data = data || {};
  if (prefs.motion) document.documentElement.dataset.motion = prefs.motion;
  else if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.dataset.motion = 'off';
  applyAudioPrefs();
  buildHUD(); buildBar();
  const snap = data.S && data.S.dog ? data.S : null;
  S = snap ? linkDogs(snap) : loadSave();
  if (snap && ['yard', 'market', 'map', 'shelter'].includes(data.mode)) { applyAway(); go(data.mode); }
  else if (snap) { applyAway(); go('yard'); }
  else go('title');
  setInterval(tick, 250);
  try { window.claude?.hot?.snapshot?.(() => ({ S: S ? JSON.parse(JSON.stringify(S)) : null, mode: cur.mode })); } catch (e) { /* no hot reload host */ }
  if (S) { gardenAdvance(); birthdayCheck(); emit('game:ready', { fresh: false }); }
  if (cur.mode !== 'title') migNote();
  window.__paw = { get S() { return S; }, get mode() { return cur.mode; }, go, feed, saveNow, get W() { return W; }, get F() { return F; }, grant: (n) => grantTreasure(tInfo(n), 'park'), walkJunk, mapTo: (k) => mapCenter(k), get train() { return TRN; }, idle: { force: (n) => { IDLE.force = n; IDLE.nextAt = 0; }, speed: (k) => { IDLE.speed = k; }, get act() { return IDLE.act ? IDLE.act.name : null; }, names: IDLE_NAMES, weights: () => idleWeights(), steps: (n) => idleSteps(n) }, addDog: (spec, name) => addDog(spec, name), switchDog: (id) => switchDog(id), rescuesOn: (dk) => rescuesToday(dk), coat: (d) => coatInfo(d), noseMul: () => noseMul(), sigName: () => tName('Signature'), poseNow: () => dogPoseNow(), voice: { bark: (id, kind, opts) => barkDog(dogById(id), kind, opts || {}), speakKind: (id) => speakKind(dogById(id)), tick: () => voiceTick(), ambient: () => placeAmbient(), fluff: () => gardenEvent({ type: 'squirrel', plot: 0, crop: 'carrot' }), reset: () => { Object.keys(barkCD).forEach((k) => delete barkCD[k]); Object.keys(demandAt).forEach((k) => delete demandAt[k]); Object.keys(lastNightHowl).forEach((k) => delete lastNightHowl[k]); lastDistant = -1e9; } } };
}
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();