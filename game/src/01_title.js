/* ======================= TITLE ======================= */
function enterTitle() {
  setChrome(false, false); view.innerHTML = ''; titleEl.hidden = false;
  const has = !!loadSave() || !!(S && S.dog);
  const rings = `<svg viewBox="0 0 44 600" preserveAspectRatio="none">${Array.from({ length: 13 }, (_, i) => `<ellipse cx="25" cy="${24 + i * 46}" rx="6" ry="6" fill="#E6D7BF" stroke="${INKG}" stroke-width="1.6"/><path d="M27 ${24 + i * 46} C 10 ${10 + i * 46}, 2 ${22 + i * 46}, 8 ${34 + i * 46}" fill="none" stroke="#A8968A" stroke-width="3" stroke-linecap="round"/><path d="M27 ${24 + i * 46} C 10 ${10 + i * 46}, 2 ${22 + i * 46}, 8 ${34 + i * 46}" fill="none" stroke="${INKG}" stroke-width="1.3"/>`).join('')}</svg>`;
  const doodles = `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">${doodle('spark', 120, 70, 1.3)}${doodle('spark', 690, 120, 0.9)}${doodle('spark', 150, 330, 0.7)}${doodle('heart', 660, 62, 1.2, 12)}${doodle('heart', 718, 330, 0.8, -10)}${doodle('note', 96, 190, 1.1, -8)}${doodle('note', 700, 230, 0.9, 10)}${doodle('flower', 640, 420, 1.2)}${doodle('flower', 100, 430, 0.9, 20)}${doodle('paw', 250, 450, 0.8, -20)}${doodle('paw', 300, 470, 0.8, -10)}${doodle('paw', 350, 455, 0.8, -25)}${doodle('bone', 560, 455, 1.1, -8)}<path d="M200 190 Q400 178 610 192" fill="none" stroke="#A8968A" stroke-width="1" stroke-dasharray="3 5" opacity=".7"/></svg>`;
  titleEl.innerHTML = `<div class="bg">${art('scene', 'yard', envNow())}</div>
    <div class="cover"><div class="rings" aria-hidden="true">${rings}</div><div class="doodles" aria-hidden="true">${doodles}</div>
      <h1 class="logo" aria-label="Paw Haven"><span style="transform:rotate(-3deg)">Paw</span> <span style="transform:rotate(2deg) translateY(4px)">Haven</span></h1>
      <div class="tagline">a cozy dog game, sketchbook edition</div>
      <div class="tbtns">
        ${has ? '<button class="btn big go" id="tContinue">Continue</button>' : ''}
        <button class="btn big ${has ? '' : 'yes'}" id="tNew">New game</button>
      </div>
      <div class="crayon-note">Everything here is lovingly sketched. Except the dogs. The dogs drew themselves, with crayons, on purpose.</div>
    </div>
    <div class="tdog2" aria-hidden="true">${art('dog', 'dachs', { pose: 'idle' })}</div>
    <div class="tdog" aria-hidden="true">${art('dog', 'corgi', { pose: 'happy', facing: 'left' })}</div>`;
  const tn = $('#tNew'), tc = $('#tContinue');
  tn.onclick = async () => {
    SFX.boop(600);
    if (has) { const ok = await ask('Start over?', `This replaces <b>${esc((loadSave() || S || {}).dog?.name || 'your dog')}</b> with a brand new dog. The old one will be fine. Probably moved to a farm. A real one.`, 'Yes, new dog', 'Keep my dog'); if (!ok) return; lsDel(SAVE_KEY); S = null; }
    go('adopt');
  };
  if (tc) tc.onclick = () => { SFX.boop(700); if (!S) S = loadSave(); applyAway(); gardenAdvance(); birthdayCheck(); go('yard'); migNote(); setTimeout(() => greetBark(), 1200); };
}

