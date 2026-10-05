/* ======================= WALK ROUTE CAROUSEL ======================= */
const ROUTE_KEYS = ['park', 'town', 'river', 'hilltop', 'woods', 'pier', 'beach'];
const ROUTE_DIFF = { park: 1, town: 1, river: 2, hilltop: 3, woods: 3, pier: 3, beach: 4 };
let routeIdx = 0;
function enterRoutes(startKey) {
  if (walkNever(D())) { nope(walkBlock(D(), 'park')); go('yard'); return; } // v2: under 3 months / nursing mums
  setChrome(true, false); dock.innerHTML = '';
  routeIdx = typeof startKey === 'string' && ROUTE_KEYS.includes(startKey) ? ROUTE_KEYS.indexOf(startKey) : Math.max(0, ROUTE_KEYS.indexOf(S.place));
  const e = envNow(), envTxt = `${{ dawn: 'Dawn', day: 'Daytime', dusk: 'Dusk', night: 'Night' }[e.time]} · ${wxLabel()}`;
  const paw = (on) => `<svg viewBox="-14 -14 28 28" class="rt-paw ${on ? 'on' : ''}">${doodle('paw', 0, 2, 0.85)}</svg>`;
  const card = (k, i) => {
    const R = ROUTES[k], lock = topBond() < R.bond, hidden = TREASURES.filter((t) => t.routes.includes(k) && !S.found[t.n]).length;
    return `<div class="rt-card ${lock ? 'locked' : ''}" data-i="${i}"><div class="rt-prev"><svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice">${place(art('walkStrip', k, e), 0, 0, 1200, 400)}</svg>${lock ? `<span class="stamp r1 rt-lock">Locked: Bond ${R.bond}</span>` : ''}</div>
      <h3>${esc(R.n)}</h3><div class="rt-meta"><span>${Math.round(R.secs * walkScale())}s walk</span><span class="rt-paws" aria-label="Difficulty ${ROUTE_DIFF[k]} of 4">${[1, 2, 3, 4].map((n) => paw(n <= ROUTE_DIFF[k])).join('')}</span></div>
      <p class="small">${hidden ? `${hidden} treasure${hidden > 1 ? 's' : ''} still hidden here` : 'Every treasure here found!'} · ${S.mapPieces.includes(k) ? 'Map piece found' : 'A map piece is buried here'}</p>
      <p class="rt-env"><span class="wxic">${iconOr(wxIconName(), WX_DOODLE[wxIconName()] || '')}</span>Runs in: ${envTxt}</p></div>`;
  };
  view.innerHTML = `<div class="routes"><h2 class="rt-title">Pick a walk</h2><div class="rt-viewport" id="rtView"><div class="rt-track" id="rtTrack">${ROUTE_KEYS.map(card).join('')}</div></div>
    <div class="rt-nav"><button class="arrow" id="rtPrev" aria-label="Previous route">&lt;</button><span class="small" id="rtCount"></span><button class="arrow" id="rtNext" aria-label="Next route">&gt;</button></div>
    <div class="rt-foot"><button class="btn" id="rtBack">Back to ${esc((PLACES[S.place] || PLACES.yard).n)}</button><button class="btn big yes" id="rtStart">Start walk</button></div></div>`;
  const shift = (d) => { routeIdx = clamp(routeIdx + d, 0, ROUTE_KEYS.length - 1); layoutRoutes(); SFX.click(); };
  $('#rtPrev').onclick = () => shift(-1); $('#rtNext').onclick = () => shift(1);
  $('#rtBack').onclick = () => go('yard'); $('#rtStart').onclick = () => startRoute(ROUTE_KEYS[routeIdx]);
  view.querySelectorAll('.rt-card').forEach((c) => { c.onclick = () => { const i = +c.dataset.i; if (i !== routeIdx) { routeIdx = i; layoutRoutes(); } }; });
  let x0 = null; const vp = $('#rtView');
  vp.addEventListener('pointerdown', (ev) => { x0 = ev.clientX; }); vp.addEventListener('pointerup', (ev) => { if (x0 === null) return; const dx = ev.clientX - x0; x0 = null; if (Math.abs(dx) > 60) shift(dx < 0 ? 1 : -1); });
  cur.key = (ev) => { if (ev.key === 'ArrowLeft') { ev.preventDefault(); shift(-1); } if (ev.key === 'ArrowRight') { ev.preventDefault(); shift(1); } };
  onCleanup(() => { cur.key = null; });
  layoutRoutes();
}
function layoutRoutes() {
  const tr = $('#rtTrack'), vp = $('#rtView'); if (!tr || !vp) return;
  const cards = [...tr.children], cw = cards[0].offsetWidth + 36;
  tr.style.transform = `translateX(${vp.clientWidth / 2 - cw / 2 - routeIdx * cw + 18}px)`;
  cards.forEach((c, i) => c.classList.toggle('cur', i === routeIdx));
  const k = ROUTE_KEYS[routeIdx], lock = topBond() < ROUTES[k].bond;
  $('#rtCount').textContent = `${routeIdx + 1} / ${ROUTE_KEYS.length} · drag, or use the arrow keys`;
  const blk = !lock && walkBlock(D(), k), st = $('#rtStart'); st.textContent = lock ? `Locked (Bond ${ROUTES[k].bond})` : blk ? `Not for ${D().name} yet` : `Start walk: ${ROUTES[k].n}`; st.setAttribute('aria-disabled', lock || blk ? 'true' : 'false');
}
function startRoute(k) {
  const r = ROUTES[k]; if (!r) return;
  if (topBond() < r.bond) { nope(`Nope. ${r.n} opens at Bond ${r.bond}. There is a bouncer. He is a goose.`); return; }
  if (S.sleeping) { nope(`${NAME()} is asleep. Wake up first (Care menu).`); return; }
  if (S.stats.energy < 20) { nope(`${NAME()} lies down at the gate. Too sleepy for a walk. Try a nap first.`); return; }
  const wb = walkBlock(D(), k); if (wb) { nope(wb); return; }
  go('walk', k);
}

