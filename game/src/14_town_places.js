/* ======================= v1.6: the bigger town + trick training ======================= */
/* ---- data: places, routes, loot ---- */
const NEW_PLACES = ['square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier'];
Object.assign(PLACES, {
  square: { n: 'Town Square', bond: 1, out: true }, cafe: { n: 'Pupuccino Café', bond: 1, out: false }, dogpark: { n: 'Dog Park', bond: 2, out: true },
  vet: { n: 'Vet Clinic', bond: 1, out: false }, salon: { n: 'Grooming Salon', bond: 3, out: false }, hilltop: { n: 'Hilltop Meadow', bond: 4, out: true }, pier: { n: 'Lighthouse Pier', bond: 6, out: true }
});
Object.assign(ROUTES, {
  town: { n: 'Town Loop', bond: 1, secs: 60, energy: 15, happy: 15, clean: 5, coins: [25, 35], bp: 9, pool: ['coin', 'leaf', 'bone'] },
  hilltop: { n: 'Hilltop Trail', bond: 4, secs: 75, energy: 25, happy: 25, clean: 10, coins: [45, 60], bp: 12, pool: ['coin', 'flower', 'leaf'] },
  pier: { n: 'Pier Boardwalk', bond: 6, secs: 75, energy: 25, happy: 25, clean: 10, coins: [55, 70], bp: 13, pool: ['coin', 'shell'] }
});
const LOOT16 = { town: ['Lucky Penny', "Duck's Picnic Sandwich", 'Rubber Chicken', 'Wild Berries'], hilltop: ['Acorn Cap', 'Explorer Goggles', 'Glow Ball', 'Wild Berries', 'Golden Bone'], pier: ['Seashell Necklace', 'Driftwood Stick', 'Sparkle Stone', 'Golden Bone'] };
Object.keys(LOOT16).forEach((r) => LOOT16[r].forEach((n) => { const t = TREASURES.find((x) => x.n === n); if (t && !t.routes.includes(r)) t.routes.push(r); }));
Object.assign(ROUTE_WORD, { town: 'around town', hilltop: 'up on the hilltop', pier: 'on the pier' });
Object.assign(ROUTE_HINT, { town: 'Found around town...', hilltop: 'Found up on the hilltop...', pier: 'Found on the pier...' });
const PUBLIC_AUDIENCE = ['park', 'square', 'dogpark'];
const isIndoor = () => !!(S && PLACES[S.place] && PLACES[S.place].out === false);

/* ---- scene fallback while world C is missing: a similar existing scene + a doodle sign ---- */
const SCENE_FB = { square: 'market', cafe: 'house', dogpark: 'park', vet: 'shelter', salon: 'house', hilltop: 'woods', pier: 'beach' };
function placeSign(name) {
  const t = PLACES[name] ? PLACES[name].n : name;
  return `<g class="fbsign" transform="translate(820 140) rotate(3)" pointer-events="none"><path d="M0 70 V170" stroke="#5B3D32" stroke-width="6"/><rect x="-120" y="0" width="240" height="72" rx="10" fill="#FFF3DA" stroke="#5B3D32" stroke-width="4"/><text x="0" y="48" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${t.length > 13 ? 30 : 36}" fill="#5B3D32">${esc(t)}</text></g>`;
}

/* ---- place features ---- */
function cafeMenu() {
  const d = D(), done = d.cafeDay === todayKey();
  const items = [{ n: 'Pupuccino', price: 12, happy: 10, hunger: 5, note: 'A tiny cup of frothed, lactose-free milk foam. Dog-safe, no coffee, no sugar.' }, { n: 'Doggy Donut', price: 18, happy: 15, hunger: 8, note: 'Oat flour, pumpkin and a yoghurt drizzle. A dog-safe recipe: no chocolate, no xylitol, no sugar glaze.' }];
  const p = openModal('Pupuccino Café', `<p class="small">"Welcome! One café treat per pup per day." ${done ? `<b>${esc(d.name)} already had today's treat.</b>` : ''} You have ${S.coins} Paw Coins.</p><div class="shopgrid">${items.map((it) => `<div class="sitem"><span class="art">${art('item', it.n)}</span><b>${it.n}</b><span class="desc">${esc(it.note)}<br>+${it.happy} Happiness, +${it.hunger} Hunger</span>${priceHTML(it.price)}<button class="btn yes" data-cafe="${it.n}" ${done ? 'aria-disabled="true"' : ''}>Order and serve</button></div>`).join('')}</div>`, { cls: 'shop' });
  p.querySelectorAll('[data-cafe]').forEach((b) => { b.onclick = () => {
    const it = items.find((x) => x.n === b.dataset.cafe); if (D().cafeDay === todayKey()) { nope(`One café treat per dog per day. ${NAME()} is pretending not to know that.`); return; }
    if (S.coins < it.price) { nope('Not enough coins. The barista is sympathetic but firm.'); return; }
    S.coins -= it.price; D().cafeDay = todayKey(); SFX.kaching(); closeModal(); markDirty();
    // v2.5: the treat is served in the bowl (shown only while the dog eats), like every other food
    busy = true; hideBubble(); setBowl(it.n); dogTo(-125, 0, 1, 0.8); renderDog('walk', 'left'); setTimeout(() => { renderDog('eat', 'left', true); SFX.slurp(); }, 850);
    setTimeout(() => { setBowl(null); dogTo(0, 0, 1, 0.8); addStat('happy', it.happy); addStat('hunger', it.hunger); setTimeout(() => { busy = false; renderDog(dogPoseNow()); }, 900); setTemp('happy', 1400); updateHUD(); toast(`${NAME()} enjoyed a ${it.n}. ${it.n === 'Pupuccino' ? `${PR().He} has a foam moustache now.` : `${PR().He} ate it in one bite. Of course.`} +${it.happy} Happiness.`, 'good'); }, 2300);
  }; });
}
function vetCheck(id) {
  const d = (id && dogById(id)) || D(), done = d.vetDay === todayKey();
  const preg = !!(d.preg && d.preg.due);
  const pick = S.dogs.length > 1 ? `<div class="vdogs" role="group" aria-label="Which dog?">${S.dogs.map((x) => `<button class="dchip vdog" data-vdog="${x.id}" aria-pressed="${x.id === d.id}" title="${esc(x.name)}">${headSVG(x)}<span>${esc(x.name)}</span></button>`).join('')}</div>` : '';
  const p = openModal('Vet Clinic', `<div class="vetcard vet2">${pick}<p>Dr. Paws peers over tiny glasses. "Check-up is 30 coins, once a day per pup."</p>
    <div class="wrap"><button class="btn yes big" id="vetGo" ${done ? 'aria-disabled="true"' : ''}>${done ? 'Checked today' : preg ? 'Expecting check-up (30)' : 'Check-up (30)'}</button></div>
    ${vetV2Options(d)}</div>`);
  p.querySelectorAll('[data-vdog]').forEach((b) => { b.onclick = () => { SFX.click(); vetCheck(b.dataset.vdog); }; });
  vetV2Bind(p, d);
  $('#vetGo', p).onclick = () => withDog(d, () => {
    if (D().vetDay === todayKey()) { nope('Already checked today. The vet says go have fun.'); return; }
    if (S.coins < 30) { nope('Not enough coins for a check-up.'); return; }
    S.coins -= 30; D().vetDay = todayKey(); SFX.kaching(); barkDog(D(), 'huff', { player: true }); const b = addBond(5, { raw: true }); if (d.id === S.activeId) tempPose = null; markDirty(); updateHUD();
    const kg = (dogInfo(d.key).breed.length / 2 + 6).toFixed(1);
    openModal(`Health card: ${esc(d.name)}`, `<div class="vetcard"><p><b>Weight:</b> ${kg} kg of pure opinion.</p><p><b>Coat:</b> ${esc(coatNameOf(d) || 'Shiny')}. Shiny enough to see your future in it.</p><p><b>Teeth:</b> All present. Several are suspicious of carrots.</p><p><b>Nose:</b> Cold and wet. As it should be.</p>${preg ? vetScanHTML(d) : ''}<p class="small">No sniffles. +${b} Bond (brave ${d.sex === 'female' ? 'girl' : 'boy'}).</p></div>`, { foot: '<button class="btn yes" id="vetOk">Good dog!</button>' });
    $('#vetOk').onclick = () => closeModal(); toast(`${NAME()} survived the vet. Barely. Dramatically. +${b} Bond.`, 'good');
  });
}
const fluffyOn = (d = D()) => !!(d && d.fluffyUntil && S.gameMin < d.fluffyUntil);
function salonGroom() {
  const p = openModal('Grooming Salon', `<p>"Full groom: bath, blow-dry, a bow if they allow it. 40 coins." Cleanliness goes to 100 and ${esc(NAME())} gets <b>Fresh &amp; Fluffy</b> for a game day: Happiness drops at half speed.</p>`, { foot: '<button class="btn no" id="slNo">Not today</button><button class="btn yes big" id="slGo">Full groom (40)</button>' });
  $('#slNo', p).onclick = () => closeModal();
  $('#slGo', p).onclick = () => {
    if (S.coins < 40) { nope('Not enough coins. The groomer gives a sad little snip of the scissors.'); return; }
    S.coins -= 40; SFX.kaching(); S.stats.clean = 100; D().fluffyUntil = S.gameMin + 1440; closeModal(); markDirty(); SFX.splash(); setTimeout(() => SFX.shake(), 300);
    renderDog('shake', 'right', true); setTimeout(() => { renderDog(dogPoseNow(), 'right', true); drawFluff(); }, 900);
    toast(`${NAME()} is Fresh & Fluffy! ${PR().He} smells like a cloud that went to university.`, 'gold'); updateHUD();
  };
}
function drawFluff() { const g = $('#fluffFx'); if (!g) return; g.innerHTML = fluffyOn() ? `<g class="fluffspark">${doodle('spark', 330, 330, 0.7)}${doodle('spark', 545, 300, 0.55, 20)}${doodle('spark', 470, 270, 0.45, 40)}</g>` : ''; }
function squareNotice() {
  dailyCheck(); const n = S.daily.squareShows || 0, done = !!S.daily.squareGoal;
  openModal('Town notice', `<div class="notice"><p><b>Today's mini-goal:</b> Show 3 tricks here in Town Square.</p><p>Reward: +30 coins. ${done ? '<b>Done! The mayor clapped (one hand).</b>' : `Progress: ${n}/3.`}</p><p class="small">Also on the board: "LOST: one tennis ball. Answers to 'ball'." · "Fountain is not a water bowl (it is a little bit)."</p></div>`);
}
function socialise() {
  if (busy) return; const now = S.gameMin;
  if (now - (S.socialAt || -99) < 10) { nope('Everyone is still sniffing from last time. Give it a minute.'); return; }
  S.socialAt = now; const k = PICK(dogsList().filter((d) => d.key !== S.dog.key)).key; SFX.bark(BARK[k] || 1); addStat('happy', 8);
  toast(`${NAME()} met a ${dogInfo(k).breed}. They sniffed, ran in circles and agreed to be best friends forever (5 minutes). +8 Happiness.`, 'good'); updateHUD();
}
function kiteWatch() {
  const fx = $('#fx'); if (!fx) return;
  fx.insertAdjacentHTML('beforeend', `<g class="kitefx"><path d="M0 0 L24 -30 L48 0 L24 30 Z" fill="#F28FA5" stroke="#5B3D32" stroke-width="3" transform="translate(650 120)"/><path d="M674 150 Q700 220 660 300" fill="none" stroke="#5B3D32" stroke-width="2" stroke-dasharray="4 5"/></g>`);
  setTimeout(() => { const k = fx.querySelector('.kitefx'); if (k) k.remove(); }, 4200);
  const h = dogHeadWorld(); say(PICK(['A kite! I will catch it with my mind.', 'That bird is rectangular. Suspicious.', 'I could fly too. I just choose not to.']), h.x, h.y, 2600);
}

/* ---- the town map: pan + zoom ---- */
const FB_PINS = { square: [1900, 330], cafe: [2180, 560], vet: [1880, 760], salon: [2170, 980], dogpark: [1920, 1220], hilltop: [760, 150], pier: [1300, 1390] };
let MAPV = null;
function mapArt(locked) {
  const bonds = {}; Object.keys(PLACES).forEach((k) => { bonds[k] = PLACES[k].bond; });
  const raw = art('scene', 'map', { locked, bonds });
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(raw || ''), W0 = m ? +m[1] : 1000, H0 = m ? +m[2] : 600;
  const big = W0 > 1500 && Array.isArray(PA().MAP_AREAS);
  if (big) return { W: W0, H: H0, svg: `<g id="sceneG" data-scene="map" data-noenv="1">${place(raw, 0, 0, W0, H0)}</g>`, areas: PA().MAP_AREAS };
  // fallback town: today's map, enlarged, with doodle pins for the new places around it
  const W = 2400, H = 1500, ox = 100, oy = 260, sc = 1.6;
  const roads = `<g fill="none" stroke="#D9C7AB" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 18"><path d="M1700 700 C1800 650 1850 400 1900 330 M1700 700 C1900 640 2050 600 2180 560 M1700 760 L1880 760 M1700 820 C1900 900 2050 950 2170 980 M1700 900 C1800 1000 1880 1150 1920 1220 M760 150 C760 250 700 260 700 320 M1100 1210 C1150 1300 1250 1350 1300 1390"/></g>`;
  const deco = [[1780, 180], [2300, 260], [2300, 1350], [600, 1350], [300, 160], [1500, 160], [2050, 1400]].map(([x, y], i) => i % 2 ? `<g transform="translate(${x} ${y})" stroke="#5B3D32" stroke-width="3"><rect x="-26" y="-20" width="52" height="40" fill="#F9E3C8"/><path d="M-32 -20 L0 -46 L32 -20 Z" fill="#E8A598"/></g>` : `<g transform="translate(${x} ${y})" stroke="#5B3D32" stroke-width="3"><path d="M0 30 V8" /><circle r="26" cy="-6" fill="#BFD8A6"/></g>`).join('');
  const pins = NEW_PLACES.filter((k) => !new RegExp(`data-area="${k}"`).test(raw)).map((k) => {
    const [x, y] = FB_PINS[k], P = PLACES[k], lock = topBond() < P.bond;
    return `<g data-area="${k}" class="fbpin${lock ? ' locked' : ''}" transform="translate(${x} ${y})"><circle r="78" fill="#FFFBF3" stroke="#5B3D32" stroke-width="5"/><g transform="translate(-44 -62)">${place(iconOr(k, `<circle r="14" fill="#F28FA5" stroke="#5B3D32" stroke-width="2"/>`), 0, 0, 88, 88)}</g><text y="${lock ? 62 : 58}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${P.n.length > 13 ? 26 : 30}" fill="#5B3D32">${esc(P.n)}</text>${lock ? `<g transform="translate(40 -66) rotate(8)"><rect x="-44" y="-18" width="88" height="34" rx="8" fill="#F28FA5" stroke="#5B3D32" stroke-width="3"/><text y="8" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="24" fill="#fff">Bond ${P.bond}</text></g>` : ''}</g>`;
  }).join('');
  return { W, H, areas: null, svg: `<rect width="${W}" height="${H}" fill="#FFFBF3"/><text x="${W / 2}" y="90" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="72" fill="#5B3D32">Paw Haven Town</text>${roads}${deco}<g id="sceneG" data-scene="map" data-noenv="1">${place(raw, ox, oy, 1000 * sc, 600 * sc)}</g>${pins}` };
}
function mapApply() {
  const M = MAPV; if (!M) return; const inner = $('#mapInner'); if (!inner) return;
  const s = M.base * M.z, vw = M.vw, vh = M.vh, mw = M.W * s, mh = M.H * s;
  M.tx = mw <= vw ? (vw - mw) / 2 : clamp(M.tx, vw - mw - 40, 40); M.ty = mh <= vh ? (vh - mh) / 2 : clamp(M.ty, vh - mh - 40, 40);
  inner.style.transform = `translate(${M.tx.toFixed(1)}px, ${M.ty.toFixed(1)}px) scale(${s.toFixed(4)})`; inner.style.setProperty('--inv', (1 / s).toFixed(4));
  const zl = $('#mapZoomLbl'); if (zl) zl.textContent = Math.round(M.z * 100) + '%';
  const pb = M.pinBox, pin = $('#mapPin'); if (pb && pin) { const lx = pb.x - 46 / s, rx = pb.x + pb.w + 46 / s; pin.style.left = ((M.tx + lx * s >= 46 || M.tx + rx * s > M.vw - 46) ? lx : rx).toFixed(1) + 'px'; pin.style.top = (pb.y + pb.h * 0.62).toFixed(1) + 'px'; } // phones: the pin keeps a fixed screen gap from its place at every zoom, on the side with room for its label
}
function mapCenter(k, anim) { const M = MAPV; if (!M) return; const c = M.centers[k]; if (!c) return; const s = M.base * M.z; M.tx = M.vw / 2 - c[0] * s; M.ty = M.vh / 2 - c[1] * s; const inner = $('#mapInner'); if (inner) inner.style.transition = anim ? 'transform .35s ease-out' : ''; mapApply(); if (anim) setTimeout(() => { if (inner) inner.style.transition = ''; }, 380); }
function mapZoomAt(f, px, py) { const M = MAPV; if (!M) return; const z0 = M.z, z1 = clamp(z0 * f, 0.6, 1.6); if (z1 === z0) return; const s0 = M.base * z0, s1 = M.base * z1; const mx = (px - M.tx) / s0, my = (py - M.ty) / s0; M.z = z1; M.tx = px - mx * s1; M.ty = py - my * s1; mapApply(); }
// v2.5 FIXES A: on phones the X and the zoom column float over the map, so on opening the map slides sideways by the smallest step that leaves no place name under them
function mapClearCtl() {
  const M = MAPV, ctl = ['#mapX', '#mapZoom'].map((s) => $(s)).filter(Boolean).map((e) => e.getBoundingClientRect()); if (!M || !ctl.length) return;
  const labs = [...view.querySelectorAll('#mapInner svg text')].filter((e) => e.textContent.trim().length > 1);
  const hits = () => labs.some((e) => { const r = e.getBoundingClientRect(); return ctl.some((c) => r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom); });
  if (!hits()) return; const tx0 = M.tx;
  for (let d = 8; d <= 200; d += 8) for (const sg of [1, -1]) { M.tx = tx0 + sg * d; mapApply(); if (Math.abs(M.tx - (tx0 + sg * d)) < 0.5 && !hits()) return; }
  M.tx = tx0; mapApply();
}
function enterMap() {
  setChrome(true, false); hideBubble(); // a yard speech bubble must not linger over the pin
  const locked = lockedAreas(), A = mapArt(locked);
  view.innerHTML = `<div id="mapPan" class="mappan"><div id="mapInner" style="width:${A.W}px;height:${A.H}px"><svg class="world mapsvg" viewBox="0 0 ${A.W} ${A.H}" width="${A.W}" height="${A.H}" style="background:radial-gradient(#E3D2BA 1.1px,transparent 1.6px) 0 0/22px 22px,#FFFBF3">${A.svg}</svg><div id="mapHi" hidden></div><div id="mapPin" hidden>${PIN_SVG}<span>you are here</span></div></div></div>
    <button class="xbtn" id="mapX" aria-label="Back to ${esc(PLACES[S.place] ? PLACES[S.place].n : 'your place')}">x</button>
    <div id="mapZoom"><button class="btn" id="mapZin" aria-label="Zoom in">+</button><span id="mapZoomLbl">100%</span><button class="btn" id="mapZout" aria-label="Zoom out">−</button></div>
    <div id="mapTip" hidden role="tooltip"></div><div id="mapGo" hidden></div><div id="status"></div><button id="devBtn">dev</button>`;
  $('#mapX').onclick = () => { SFX.click(); go('yard'); };
  const pan = $('#mapPan'), inner = $('#mapInner'), svg = $('svg.world', view);
  const vw = pan.clientWidth || view.clientWidth, vh = pan.clientHeight || view.clientHeight;
  const base = isPhone() ? Math.max(vh / A.H, vw / (0.6 * A.W)) : vw / (0.6 * A.W);
  MAPV = { W: A.W, H: A.H, vw, vh, base, z: 1, tx: 0, ty: 0, centers: {} };
  mapApply();
  // area centres in map units (MAP_AREAS when the art gives them, else measured)
  const measure = () => { const s = MAPV.base * MAPV.z, ir = inner.getBoundingClientRect(); svg.querySelectorAll('[data-area]').forEach((g) => { const r = g.getBoundingClientRect(); MAPV.centers[g.getAttribute('data-area')] = [(r.left + r.width / 2 - ir.left) / s, (r.top + r.height / 2 - ir.top) / s]; }); (A.areas || []).forEach((a) => { MAPV.centers[a.id] = [a.x, a.y]; }); };
  measure(); mapCenter(S.place === 'house' ? 'yard' : S.place, false); if (isPhone()) mapClearCtl();
  const label = (k) => k === 'shelter' ? 'Visit the shelter' : PLACES[k] ? `Go to ${PLACES[k].n}${topBond() < PLACES[k].bond ? ' (locked, Bond ' + PLACES[k].bond + ')' : ''}` : k;
  hotify(svg, '[data-area]', 'data-area', (k) => (isPhone() ? mapPick(k) : pickArea(k)), label);
  // drag pan, pinch + wheel zoom (pointer events: mouse and touch alike)
  const pts = new Map(); let moved = 0, pinch = null, last = null;
  pan.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) { moved = 0; last = { x: e.clientX, y: e.clientY }; } if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: MAPV.z }; } });
  pan.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size >= 2 && pinch) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = pan.getBoundingClientRect(); mapZoomAt((pinch.z * d / pinch.d) / MAPV.z, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); moved = 99; return; }
    const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6) { if (!pan.classList.contains('dragging')) { pan.classList.add('dragging'); try { pan.setPointerCapture(e.pointerId); } catch (er) { /* none */ } } MAPV.tx += dx; MAPV.ty += dy; mapApply(); }
  });
  const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) setTimeout(() => pan.classList.remove('dragging'), 0); };
  pan.addEventListener('pointerup', up); pan.addEventListener('pointercancel', up);
  pan.addEventListener('click', (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
  pan.addEventListener('wheel', (e) => { e.preventDefault(); const r = pan.getBoundingClientRect(); mapZoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  $('#mapZin').onclick = () => mapZoomAt(1.2, MAPV.vw / 2, MAPV.vh / 2); $('#mapZout').onclick = () => mapZoomAt(1 / 1.2, MAPV.vw / 2, MAPV.vh / 2);
  const onRs = () => { if (cur.mode !== 'map') return; MAPV.vw = pan.clientWidth; MAPV.vh = pan.clientHeight; mapApply(); }; window.addEventListener('resize', onRs); onCleanup(() => window.removeEventListener('resize', onRs));
  mapOverlay(); updateHUD(); bindDev();
}
function mapOverlay() {
  const svg = $('svg.world', view); if (!svg) return;
  const tip = $('#mapTip'), hi = $('#mapHi'), pin = $('#mapPin'), inner = $('#mapInner');
  const rel = (g) => { const s = MAPV.base * MAPV.z, ir = inner.getBoundingClientRect(), r = g.getBoundingClientRect(); return { x: (r.left - ir.left) / s, y: (r.top - ir.top) / s, w: r.width / s, h: r.height / s }; };
  mapHighlight = (g) => { const r = rel(g); hi.hidden = false; Object.assign(hi.style, { left: r.x - 8 + 'px', top: r.y - 8 + 'px', width: r.w + 16 + 'px', height: r.h + 16 + 'px' }); };
  const show = (g) => { if ($('#mapPan').classList.contains('dragging')) return; mapHighlight(g); const k = g.getAttribute('data-area'), vr = view.getBoundingClientRect(), r = g.getBoundingClientRect(); tip.textContent = mapTipText(k); tip.hidden = false; const tw = tip.offsetWidth; tip.style.left = clamp(r.left - vr.left + r.width / 2 - tw / 2, 8, vr.width - tw - 8) + 'px'; tip.style.top = Math.max(8, r.top - vr.top - 46) + 'px'; };
  const hide = () => { hi.hidden = true; tip.hidden = true; };
  svg.querySelectorAll('[data-area]').forEach((g) => { g.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !isPhone()) show(g); }); g.addEventListener('focus', () => { if (!isPhone()) show(g); }); g.addEventListener('pointerleave', hide); g.addEventListener('blur', hide); });
  const k = S.place === 'house' ? 'yard' : S.place, c = MAPV.centers[k];
  if (c && pin) {
    pin.hidden = false; pin.style.left = c[0] + 'px'; pin.style.top = (c[1] - 30) + 'px';
    // phones: the pin stands beside its place (on the open side), so neither the place's art nor the name above it is covered
    const here = svg.querySelector(`[data-area="${k}"]`);
    if (isPhone() && here) { MAPV.pinBox = rel(here); mapApply(); }
  }
}

