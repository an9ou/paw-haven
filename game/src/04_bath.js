/* ======================= BATH ======================= */
function enterBath() {
  barkDog(D(), 'huff', { player: D().key === 'shiba' });
  setChrome(true, false);
  view.innerHTML = yardWorldSVG(`<g id="tubG">${place(art('prop', 'tub'), 300, 372, 260, 260)}</g><g id="suds"></g>`);
  $('#houseG').remove(); $('#bowlG').remove(); dogKey = ''; busy = true;
  if (isPhone()) { const dg = $('#decorG'); if (dg) dg.remove(); } // phone: nothing small to mis-tap while scrubbing
  camCx = 430; camApply(camCx); dogTo(0, 18, 1, 0); renderDog(S.stats.clean < 25 ? 'dirty' : 'idle');
  // keep dog drawn under the tub: move tub after dog
  const svg = $('svg.world', view); svg.insertBefore($('#tubG'), $('#fx')); svg.insertBefore($('#suds'), $('#fx'));
  updateHUD(); bindDev();
  let prog = 0, last = null, done = false, scrubT = 0;
  const startClean = S.stats.clean;
  dock.innerHTML = `<div class="tray"><div class="tray-h"><h3>Bath time: rub ${esc(NAME())} to scrub</h3></div><p class="small" style="margin:0">Mouse, finger, or mash Space. ${esc(NAME())} is legally obliged to look betrayed.</p><div class="walkctl"><div class="prog"><i id="bathBar"></i></div><button class="btn" id="bathQuit">Done for now</button></div></div>`;
  const bump = (amt, wx, wy) => {
    if (done) return; prog = clamp(prog + amt, 0, 100); $('#bathBar').style.width = prog + '%';
    addStat('clean', amt * (100 - startClean) / 100); updateHUD();
    if (performance.now() - scrubT > 90) { scrubT = performance.now(); SFX.scrub(); }
    if (Math.random() < 0.5) { const s = $('#suds'); s.insertAdjacentHTML('beforeend', place(art('prop', 'bubbles'), wx - 30 + RAND(-25, 25), wy - 30 + RAND(-20, 20), 60, 60, 'class="popfx"')); while (s.children.length > 14) s.firstChild.remove(); }
    if (prog > 55 && dogKey.startsWith('dirty')) renderDog('idle');
    if (prog >= 100) finish();
  };
  const finish = () => {
    done = true; bathZoomies = true; S.stats.clean = 100; SFX.splash(); renderDog('shake'); setTimeout(() => SFX.shake(), 150); markDirty(); updateHUD();
    const hot = isHot(); if (hot) addStat('happy', 10);
    const bp = addBond(2); toast(`${hot ? 'Refreshing! +10 Happiness on a hot day. ' : ''}Sparkling. Mostly. +${bp} Bond. ${NAME()} shakes off ON you.`, 'good');
    setTimeout(() => { if (cur.mode === 'bath') go('yard'); }, 1700);
  };
  svg.addEventListener('pointerdown', (e) => { SFX.init(); last = { x: e.clientX, y: e.clientY }; try { svg.setPointerCapture(e.pointerId); } catch (er) { /* none */ } });
  svg.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && !last) return; if (!last) { last = { x: e.clientX, y: e.clientY }; return; }
    const w = toWorld(svg, e.clientX, e.clientY); const d = Math.hypot(e.clientX - last.x, e.clientY - last.y); last = { x: e.clientX, y: e.clientY };
    if (w.x > 300 && w.x < 580 && w.y > 280 && w.y < 560) bump(d / 22, w.x, w.y);
  });
  svg.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') last = null; });
  cur.key = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); bump(6, 430 + RAND(-60, 60), 420 + RAND(-40, 30)); } };
  $('#bathQuit').onclick = () => { SFX.click(); go('yard'); };
  onCleanup(() => { cur.key = null; busy = false; });
}

