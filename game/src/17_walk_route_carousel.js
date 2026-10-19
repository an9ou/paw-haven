/* ======================= WALK ROUTE CAROUSEL ======================= */
const ROUTE_KEYS = ['park', 'town', 'river', 'hilltop', 'woods', 'pier', 'beach'];
const ROUTE_DIFF = { park: 1, town: 1, river: 2, hilltop: 3, woods: 3, pier: 3, beach: 4 };
let routeIdx = 0;
function enterRoutes(startKey) {
  if (walkNever(D())) { nope(walkBlock(D(), 'park')); go('yard'); return; } // v2: under 3 months / nursing mums
  setChrome(true, false); dock.innerHTML = '';
  routeIdx = typeof startKey === 'string' && ROUTE_KEYS.includes(startKey) ? ROUTE_KEYS.indexOf(startKey) : Math.max(0, ROUTE_KEYS.indexOf(S.place));
  const e = envNow(), envTxt = tt('route.env', '{time} · {weather}', { time: { dawn: tt('route.time_dawn', 'Dawn'), day: tt('route.time_day', 'Daytime'), dusk: tt('route.time_dusk', 'Dusk'), night: tt('route.time_night', 'Night') }[e.time], weather: wxLabel() });
  const paw = (on) => `<svg viewBox="-14 -14 28 28" class="rt-paw ${on ? 'on' : ''}">${doodle('paw', 0, 2, 0.85)}</svg>`;
  const card = (k, i) => {
    const R = ROUTES[k], lock = topBond() < R.bond, hidden = TREASURES.filter((t) => t.routes.includes(k) && !S.found[t.n]).length;
    return `<div class="rt-card ${lock ? 'locked' : ''}" data-i="${i}"><div class="rt-prev"><svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice">${place(art('walkStrip', k, e), 0, 0, 1200, 400)}</svg>${lock ? `<span class="stamp r1 rt-lock">${esc(tt('route.locked_stamp', 'Locked: Bond {n}', { n: R.bond }))}</span>` : ''}</div>
      <h3>${esc(townRouteName(k))}</h3><div class="rt-meta"><span>${esc(tt('route.secs_walk', '{n}s walk', { n: Math.round(R.secs * walkScale()) }))}</span><span class="rt-paws" aria-label="${esc(tt('route.difficulty', 'Difficulty {n} of 4', { n: ROUTE_DIFF[k] }))}">${[1, 2, 3, 4].map((n) => paw(n <= ROUTE_DIFF[k])).join('')}</span></div>
      <p class="small">${esc(tt('route.hidden_line', '{hidden, plural, =0 {Every treasure here found!} one {# treasure still hidden here} other {# treasures still hidden here}} · {map, select, yes {Map piece found} other {A map piece is buried here}}', { hidden, map: S.mapPieces.includes(k) ? 'yes' : 'no' }))}</p>
      <p class="rt-env"><span class="wxic">${iconOr(wxIconName(), WX_DOODLE[wxIconName()] || '')}</span>${esc(tt('route.runs_in', 'Runs in: {env}', { env: envTxt }))}</p></div>`;
  };
  view.innerHTML = `<div class="routes"><h2 class="rt-title">${esc(tt('route.pick', 'Pick a walk'))}</h2><div class="rt-viewport" id="rtView"><div class="rt-track" id="rtTrack">${ROUTE_KEYS.map(card).join('')}</div></div>
    <div class="rt-nav"><button class="arrow" id="rtPrev" aria-label="${esc(tt('route.prev', 'Previous route'))}">&lt;</button><span class="small" id="rtCount"></span><button class="arrow" id="rtNext" aria-label="${esc(tt('route.next', 'Next route'))}">&gt;</button></div>
    ${pkRoutesHTML()}<div class="rt-foot"><button class="btn" id="rtBack">${esc(tt('route.back_to', 'Back to {place}', { place: townPlaceName(PLACES[S.place] ? S.place : 'yard') }))}</button><button class="btn big yes" id="rtStart">${esc(tt('route.start', 'Start walk'))}</button></div></div>`;
  const shift = (d) => { routeIdx = clamp(routeIdx + d, 0, ROUTE_KEYS.length - 1); layoutRoutes(); SFX.click(); };
  $('#rtPrev').onclick = () => shift(-1); $('#rtNext').onclick = () => shift(1);
  $('#rtBack').onclick = () => go('yard'); $('#rtStart').onclick = () => startRoute(ROUTE_KEYS[routeIdx]);
  view.querySelectorAll('.rt-card').forEach((c) => { c.onclick = () => { const i = +c.dataset.i; if (i !== routeIdx) { routeIdx = i; layoutRoutes(); } }; });
  let x0 = null; const vp = $('#rtView');
  vp.addEventListener('pointerdown', (ev) => { x0 = ev.clientX; }); vp.addEventListener('pointerup', (ev) => { if (x0 === null) return; const dx = ev.clientX - x0; x0 = null; if (Math.abs(dx) > 60) shift(dx < 0 ? 1 : -1); });
  cur.key = (ev) => { if (ev.key === 'ArrowLeft') { ev.preventDefault(); shift(-1); } if (ev.key === 'ArrowRight') { ev.preventDefault(); shift(1); } };
  onCleanup(() => { cur.key = null; });
  pkRoutesBind(); // v2.9 PACK: the chip row on the route screen
  layoutRoutes();
}
function layoutRoutes() {
  const tr = $('#rtTrack'), vp = $('#rtView'); if (!tr || !vp) return;
  const cards = [...tr.children], cw = cards[0].offsetWidth + 36;
  tr.style.transform = `translateX(${vp.clientWidth / 2 - cw / 2 - routeIdx * cw + 18}px)`;
  cards.forEach((c, i) => c.classList.toggle('cur', i === routeIdx));
  const k = ROUTE_KEYS[routeIdx], lock = topBond() < ROUTES[k].bond;
  $('#rtCount').textContent = tt('route.count', '{i} / {n} · {phone, select, yes {swipe, or tap the arrows} other {drag, or use the arrow keys}}', { i: routeIdx + 1, n: ROUTE_KEYS.length, phone: isPhone() ? 'yes' : 'no' });
  pkRoutesLine();
  const blk = !lock && walkBlock(D(), k), st = $('#rtStart'); st.textContent = lock ? tt('route.locked_btn', 'Locked (Bond {n})', { n: ROUTES[k].bond }) : blk ? tt('route.not_yet', 'Not for {name} yet', { name: D().name }) : tt('route.start_route', 'Start walk: {route}', { route: townRouteName(k) }); st.setAttribute('aria-disabled', lock || blk ? 'true' : 'false');
}
function startRoute(k) {
  const r = ROUTES[k]; if (!r) return;
  if (topBond() < r.bond) { nope(tt('route.bouncer', 'Nope. {route} opens at Bond {n}. There is a bouncer. He is a goose.', { route: townRouteName(k), n: r.bond })); return; }
  if (S.sleeping) { nope(tt('route.asleep', '{name} is asleep. Wake up first (Care menu).', { name: NAME() })); return; }
  if (S.stats.energy < 20) { nope(tt('route.sleepy', '{name} lies down at the gate. Too sleepy for a walk. Try a nap first.', { name: NAME() })); return; }
  const wb = walkBlock(D(), k); if (wb) { nope(wb); return; }
  go('walk', k);
}

