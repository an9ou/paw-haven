/* ======================= FETCH ======================= */
let F = null;
function enterFetch(toy) {
  const fb = fetchBlock(D()); if (fb) { nope(fb); go('yard'); return; } // v2: nursing mums
  setChrome(true, false);
  const fris = toy === 'Frisbee', proj = toy === 'Frisbee' ? art('prop', 'frisbee') : toy === 'Tennis Ball' ? art('prop', 'ball') : art('item', toy);
  F = { toy, fris, glow: toy === 'Glow Ball', stick: toy === 'Driftwood Stick', t: 35, score: 0, great: 0, throws: 0, coins: 0, fly: null, ended: false, raf: 0, last: performance.now(), dogX: 430, dogY: 500 };
  view.innerHTML = yardWorldSVG(`<g id="fetchL"><circle id="ringIn" r="24" fill="#FFE3A1" fill-opacity=".35" stroke="#5B3D32" stroke-width="2.5" stroke-dasharray="6 5" opacity="0"/><circle id="ringOut" r="90" fill="none" stroke="#F28FA5" stroke-width="4" opacity="0"/><g id="ballG" opacity="0">${place(proj, -30, -30, 60, 60)}</g></g>`);
  $('#bowlG').remove(); dogKey = ''; busy = true; renderDog('idle'); dogTo(0, 0, 1, 0);
  updateHUD(); bindDev();
  dock.innerHTML = `<div class="tray"><div class="tray-h"><h3>Fetch with the ${esc(toy)}</h3><button class="xbtn" id="fQuit" aria-label="Stop fetch">x</button></div>
    <div class="walkctl"><span>Catches: <b id="fScore">0</b></span><span>Time: <b id="fTime">35</b>s</span><div class="prog"><i id="fBar" style="width:100%"></i></div></div>
    <p class="small" style="margin:0">Tap the grass to throw. ${isPhone() ? 'Tap again when the pink ring meets the dashed one.' : 'Tap again (or Space) when the pink ring meets the dashed one.'}</p></div>`;
  $('#fQuit').onclick = () => endFetch();
  const svg = $('svg.world', view);
  svg.addEventListener('pointerdown', (e) => { SFX.init(); e.preventDefault(); if (F.fly) catchTry(); else { const w = toWorld(svg, e.clientX, e.clientY); throwTo(w.x, w.y); } });
  cur.key = (e) => { const ok = e.key === ' ' || (e.key === 'Enter' && document.activeElement === document.body); if (!ok || e.repeat) return; e.preventDefault(); if (F.fly) catchTry(); else throwTo(RAND(300, 880), RAND(430, 540)); };
  F.raf = requestAnimationFrame(fetchLoop);
  onCleanup(() => { cancelAnimationFrame(F && F.raf); cur.key = null; busy = false; });
  if (!isPhone()) toast('Tap the grass to throw!'); // on phones the tray says it, and a toast would sit on the ball's start point
}
function throwTo(x, y) {
  if (F.ended || F.t <= 0) return;
  x = clamp(x, 300, 900); y = clamp(y, 430, 550);
  const T = F.fris ? 1.35 : 1.05;
  F.fly = { x0: 130, y0: 470, x, y, T, t0: performance.now(), tried: false, caught: false };
  F.throws++; addStat('energy', -(F.fris ? 1.5 : 1)); SFX.whoosh(); barkDog(D(), 'play', {});
  const ring = $('#ringIn'), out = $('#ringOut'); ring.setAttribute('cx', x); ring.setAttribute('cy', y - 70); ring.setAttribute('opacity', '1'); out.setAttribute('cx', x); out.setAttribute('cy', y - 70); out.setAttribute('opacity', '1');
  $('#ballG').setAttribute('opacity', '1');
  // dog runs under the landing spot
  const tx = x - 430, ty = y - 500; renderDog('walk', x < F.dogX ? 'left' : 'right'); F.dogX = x; dogTo(tx, ty, 1, T - 0.2);
}
function catchTry() {
  const f = F.fly; if (!f || f.tried) return; f.tried = true;
  const el = (performance.now() - f.t0) / 1000, diff = Math.abs(el - f.T);
  const win = F.glow ? 0.3 : 0.2;
  if (diff < win) {
    f.caught = true; const great = diff < (F.glow ? 0.12 : 0.08); F.score++; if (great) F.great++; if (F.score === 1) trackAct('fetch', { name: F.toy });
    const c = (F.fris ? 3 : 2) + (great ? 1 : 0) + (F.stick ? 1 : 0); F.coins += c;
    $('#ballG').setAttribute('opacity', '0'); ringsOff();
    renderDog('jump'); const fx = $('#dogFx'); fx.classList.remove('hop'); void fx.getBBox(); fx.classList.add('hop');
    great ? SFX.fanfare() : SFX.pop(); setTimeout(() => SFX.bark(BARK[S.dog.key]), 200);
    fxText(great ? 'GREAT CATCH!' : 'Caught it!', f.x, f.y - 190, great ? '#F2C744' : '#9CCF8F', 44);
    $('#fScore').textContent = F.score;
    setTimeout(() => { if (!F.ended) renderDog('happy'); }, 700);
    F.fly = null;
  } else { fxText('Too early!', f.x, f.y - 190, '#F28FA5', 38); SFX.boop(300); }
}
function ringsOff() { $('#ringIn').setAttribute('opacity', '0'); $('#ringOut').setAttribute('opacity', '0'); }
function fetchLoop(now) {
  if (!F || F.ended) return;
  const dt = Math.min(0.05, (now - F.last) / 1000); F.last = now;
  F.t = Math.max(0, F.t - dt);
  $('#fTime').textContent = Math.ceil(F.t); $('#fBar').style.width = (F.t / 35 * 100) + '%';
  const f = F.fly;
  if (f) {
    const el = (now - f.t0) / 1000, p = Math.min(1, el / f.T);
    const bx = f.x0 + (f.x - f.x0) * p, by = f.y0 + (f.y - 70 - f.y0) * p - (F.fris ? 160 : 230) * 4 * p * (1 - p);
    $('#ballG').setAttribute('transform', `translate(${bx} ${by}) rotate(${p * 540})`);
    $('#ringOut').setAttribute('r', 24 + 90 * Math.max(0, 1 - el / f.T));
    if (el > f.T + (F.glow ? 0.32 : 0.22)) {
      F.fly = null; ringsOff(); SFX.thud(); setTimeout(SFX.trombone, 150);
      $('#ballG').setAttribute('transform', `translate(${f.x} ${f.y - 20})`);
      fxText(PICK(['Missed!', 'Bonk.', 'Nope.']), f.x, f.y - 160, '#F28FA5', 38);
      renderDog('sad'); setTimeout(() => { if (!F.ended) { renderDog('idle'); $('#ballG').setAttribute('opacity', '0'); } }, 900);
    }
  }
  updateHUD();
  if (F.t <= 0 && !F.fly) { endFetch(); return; }
  F.raf = requestAnimationFrame(fetchLoop);
}
function endFetch() {
  if (!F || F.ended) return; F.ended = true; cancelAnimationFrame(F.raf); toasts.innerHTML = ''; // a toast from before the game must not linger over the results
  const golden = S.dog.key === 'golden' ? 1.25 : 1;
  const coins = F.coins ? addCoins(F.coins * golden) : 0;
  const key = 'toyAt_' + F.toy, full = !S[key] || S.gameMin - S[key] >= 10; S[key] = S.gameMin;
  const happy = Math.round((F.fris ? 20 : 15) * Math.min(1, F.score / 6 + 0.2) * (favAct('fetch') ? 1.5 : 1) * (S.dog.favToy === F.toy ? 1.5 : 1) * (full ? 1 : 0.25) * (S.place === 'park' ? 1.2 : 1) * (S.place === 'dogpark' ? 1.3 : 1));
  addStat('happy', happy);
  const bond = F.throws ? addBond((5 + F.score) * (full ? 1 : 0.25)) : 0;
  if (F.throws) dailyCare('play');
  markDirty();
  const p = openModal('Fetch results', `<p>${F.score >= 6 ? `${esc(NAME())} is a fetch legend. Statues are being considered.` : F.score >= 3 ? `Solid fetching. ${esc(NAME())} would rate you 7/10.` : `${esc(NAME())} has questions about your throwing arm.`}</p>
    ${wfTiles([[F.score, `Catches (${F.great} great)`, F.score], [`+${coins}`, `Paw Coins${golden > 1 ? ' (Golden +25%)' : ''}`, coins], [`+${happy}`, 'Happiness', happy], [`+${bond}`, 'Bond points', bond]], 'results')}${full ? '' : '<p class="small">Fetch again so soon is less exciting. Wait 10 game minutes for full rewards.</p>'}`, { cls: 'celebrate', foot: '<button class="btn yes big" id="fOk">Back home</button>', onClose: () => go('yard') });
  if (isPhone()) dock.innerHTML = ''; // the results sheet is the only thing on screen: no fetch tray (and its second X) behind it
  $('#fOk', p).onclick = () => { SFX.boop(700); closeModal(); };
}


/* v2.3 phone: the portrait-lock card pauses fetch; the ball in the air and the clock pick up where they stopped. */
on('phone:lock', ({ on: locked }) => {
  if (!F || F.ended || cur.mode !== 'fetch') return;
  if (locked && !F.paused) { F.paused = true; F.pAt = performance.now(); cancelAnimationFrame(F.raf); }
  else if (!locked && F.paused) { const now = performance.now(); F.paused = false; if (F.fly) F.fly.t0 += now - F.pAt; F.last = now; F.raf = requestAnimationFrame(fetchLoop); }
});
