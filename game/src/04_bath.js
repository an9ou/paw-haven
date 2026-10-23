/* ======================= BATH ======================= */
function enterBath() {
  barkDog(D(), 'huff', { player: D().key === 'shiba' });
  setChrome(true, false);
  view.innerHTML = yardWorldSVG(`<g id="tubG">${place(art('prop', 'tub'), 300, 372, 260, 260)}</g><g id="suds"></g>`);
  ['#houseG', '#bowlG'].forEach((q) => { const el = $(q); if (el) el.remove(); }); dogKey = ''; busy = true; // a bath from the house has no dog house in the scene (the old code threw there)
  if (isPhone()) { const dg = $('#decorG'); if (dg) dg.remove(); } // phone: nothing small to mis-tap while scrubbing
  camCx = 430; camApply(camCx); dogTo(0, 18, 1, 0); renderDog(S.stats.clean < 25 ? 'dirty' : 'idle');
  // keep dog drawn under the tub: move tub after dog
  const svg = $('svg.world', view); svg.insertBefore($('#tubG'), $('#fx')); svg.insertBefore($('#suds'), $('#fx'));
  updateHUD(); bindDev();
  let prog = 0, last = null, done = false, scrubT = 0;
  const startClean = S.stats.clean;
  // v2.7 PACK CARE: in a pack bath (crBath) one dog at a time is the active dog in the tub; the title counts the queue and "Next dog" skips ahead
  const crNext = crBath && crBath.i + 1 < crBath.q.length ? '<button class="btn go" id="crBathNext">' + tt('bath.next_dog', 'Next dog') + '</button>' : '';
  dock.innerHTML = `<div class="tray"><div class="tray-h"><h3>${esc(tt('bath.bath_time_rub_to_scrub', 'Bath time: rub {name} to scrub', { name: NAME() }))}${crBathTitle()}</h3></div><p class="small" style="margin:0">${isPhone() ? tt('bath.scrub_with_a_finger_more', 'Scrub with a finger. More suds, more drama.') : tt('bath.mouse_finger_or_mash_space', 'Mouse, finger, or mash Space.')} ${esc(tt('bath.is_legally_obliged_to_look', '{name} is legally obliged to look betrayed.', { name: NAME() }))}</p><div class="walkctl"><div class="prog"><i id="bathBar"></i></div>${crNext}<button class="btn" id="bathQuit">${tt('bath.done_for_now', 'Done for now')}</button></div></div>`;
  // phone: the tub scene takes all the height above the short tray (not a fixed 40% with blank paper under the tray)
  if (isPhone()) { view.style.flex = '1 1 auto'; dock.style.flex = '0 0 auto'; onCleanup(() => { view.style.flex = ''; dock.style.flex = ''; }); camApply(camCx); }
  const bump = (amt, wx, wy) => {
    if (done) return; prog = clamp(prog + amt, 0, 100); $('#bathBar').style.width = prog + '%';
    addStat('clean', amt * (100 - startClean) / 100); updateHUD();
    if (performance.now() - scrubT > 90) { scrubT = performance.now(); SFX.scrub(); }
    if (Math.random() < 0.5) { const s = $('#suds'); s.insertAdjacentHTML('beforeend', place(art('prop', 'bubbles'), wx - 30 + RAND(-25, 25), wy - 30 + RAND(-20, 20), 60, 60, 'class="popfx"')); while (s.children.length > 14) s.firstChild.remove(); }
    if (prog > 55 && dogKey.startsWith('dirty')) renderDog('idle');
    if (prog >= 100) finish();
  };
  const finish = () => {
    done = true; bathZoomies = true; S.stats.clean = 100; if (crBath) crBath.fin++; else trackAct('bath', {}); /* a pack bath: one act when the queue ends */ SFX.splash(); exBath(D()); renderDog('shake'); /* v2.13: a face after the bath, once the dog is back in the yard (41_expressions.js) */ setTimeout(() => SFX.shake(), 150); markDirty(); updateHUD();
    const hot = isHot(); if (hot) addStat('happy', 10);
    const bp = addBond(2); toast(tt('bath.sparkling_mostly_bond_shakes_off', '{hot, select, yes {Refreshing! +10 Happiness on a hot day. Sparkling. Mostly. +{bp} Bond. {name} shakes off ON you.} other {Sparkling. Mostly. +{bp} Bond. {name} shakes off ON you.}}', { hot: hot ? 'yes' : 'no', bp, name: NAME() }), 'good');
    setTimeout(() => { if (cur.mode === 'bath') { if (crBath) crBathNext(); else go('yard'); } }, 1700);
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
  const nx = $('#crBathNext'); if (nx) nx.onclick = () => { SFX.click(); if (!done) crBathNext(); };
  onCleanup(() => { cur.key = null; busy = false; if (crBath && !crBath.next) crBathEnd(); });
}

