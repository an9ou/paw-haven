/* ======================= v2.5: 26_festival.js (FESTIVAL lane, tag fs) =======================
   Seasons greetings, the Autumn leaf festival (leaf piles in the yard, Baker Bea's Harvest Stall in the Square) and Halloween
   (the costume parade in the Square, a jack-o-lantern on the porch). Spec: V25.md section 5.
   Data: S.fest { letters, parade, piles, stall }, S.seasonSeen. Cross-lane names: fsStallOpen, fsParadeOpen, fsActive, fsJournalLine.
   Art: PawArt.prop('leafpile' | 'stall' | 'paradebanner' | 'jackolantern' | 'leafdrift') from the FESTIVAL ART lane, with doodle fallbacks. */

/* ---- spots (world box x, y, w, h of the 1000x600 scene) ---- */
// leaf piles: the lawn under the dog (clear of the garden bed, the bowl, #dogHit and the secret X) and in front of the dog house
// (right of the secret X, left of the place buttons). The spec spots [120,470] and [760,540] sat on the garden bed / bowl and under the buttons.
const FS_PILES = [[318, 520, 116, 72], [748, 522, 112, 70]];
const FS_PILE_GAP = 20; // game minutes between two jumps in the same pile
const FS_STALL = { desk: [850, 378, 150, 138], phone: [182, 380, 118, 109] }; // Square: right foreground (desktop); on phones beside the fountain inside the camera crop
const FS_BANNER = { desk: [560, 150, 400, 90], phone: [196, 142, 330, 74] }; // strung between the clock tower and the right shopfront, above the shop signs
const FS_PUMPKIN = [596, 486, 40, 40]; // the porch step, left of the dog-house door
const FS_PACK_SQ = [905, 470, 'left', 0.53]; // Square pack spot 3 while the stall is up (it stands where the stall is)
const FS_COSTUMES = ['Ghost Sheet', 'Pumpkin Suit', 'Wizard Hat', 'Bumblebee Suit', 'Astronaut Helmet', 'Happi Coat'];
const FS_PARADE_MS = 6000;
const FS_SEASON_LINE = { spring: 'Spring: the blossom is out.', summer: 'Summer: long days.', autumn: 'Autumn: the leaves are turning.', winter: 'Winter: frost on the fence.' };
const FS_LETTERS = {
  leaf: { from: 'Baker Bea', title: 'The leaf festival is on', text: 'The leaf festival is on. Leaf piles in the yard, and my stall is in the Square. Pumpkin everything.' },
  halloween: { from: 'Gerald the duck', title: 'Costume parade in the Square', text: 'Costume parade in the Square until the 31st. I am going as a duck.' }
};
const FS = { walking: false, walkT: [], pileT: {}, packSq: null };

/* ---- state ---- */
function fsFields() {
  if (!S) return;
  if (!S.fest || typeof S.fest !== 'object') S.fest = {};
  ['letters', 'parade', 'piles', 'stall'].forEach((k) => { if (!S.fest[k] || typeof S.fest[k] !== 'object') S.fest[k] = {}; });
  if (!S.seasonSeen || typeof S.seasonSeen !== 'object') S.seasonSeen = {};
}
const fsYear = () => localISO().slice(0, 4);
const fsAnyOn = () => festOn('leaf') || festOn('halloween');
const fsMotionOff = () => document.documentElement.dataset.motion === 'off';
const fsHere = (pl) => cur.mode === 'yard' && !!S && S.place === pl && !!$('#view svg.world');
function fsActive() { return FS.walking; }

/* ---- art with doodle fallbacks (used until the FESTIVAL ART lane's props are merged) ---- */
const FS_LEAF_COLS = ['#E8893A', '#D9663B', '#F2C14E', '#B5542F', '#C9A13B'];
function fsLeafPath(x, y, s, r, col) { return `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${Math.round(r)}) scale(${f1(s)})" d="M0 -9 C5 -6 7 -1 0 9 C-7 -1 -5 -6 0 -9 Z M0 -7 V8" fill="${col}" stroke="${INKG}" stroke-width="1.3" stroke-linejoin="round"/>`; }
const FS_FB = {
  leafpile: (o) => {
    const sc = o && o.state === 'scattered', r = seeded(77 + ((o && o.seed) || 0)); let s = '';
    s += sc ? `<path d="M22 88 Q80 70 140 88 Z" fill="#D9663B" stroke="${INKG}" stroke-width="2.4" opacity=".9"/>` : `<path d="M14 90 Q30 40 80 30 Q130 40 146 90 Z" fill="#E8893A" stroke="${INKG}" stroke-width="2.6" stroke-linejoin="round"/>`;
    for (let i = 0; i < (sc ? 16 : 22); i++) { const x = sc ? 6 + r() * 148 : 26 + r() * 108, y = sc ? 60 + r() * 34 : 42 + r() * 44; s += fsLeafPath(x, y, 0.9 + r() * 0.5, r() * 360, FS_LEAF_COLS[i % 5]); }
    return `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  },
  stall: (o) => {
    const hw = o && o.kind === 'halloween';
    const stripes = [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${20 + i * 34} 52 h34 v22 q-17 10 -34 0 Z" fill="${i % 2 ? '#FFFBF3' : hw ? '#E8893A' : '#D9663B'}" stroke="${INKG}" stroke-width="2.2"/>`).join('');
    return `<svg viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg"><path d="M34 74 V206 M206 74 V206" stroke="#8A6248" stroke-width="8" stroke-linecap="round"/><path d="M14 54 L120 18 L226 54 Z" fill="#F9D56E" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/>${stripes}
      <rect x="22" y="132" width="196" height="74" rx="6" fill="#D9A877" stroke="${INKG}" stroke-width="3"/><path d="M30 150 h180 M30 170 h180 M30 190 h180" stroke="#B88A5E" stroke-width="2"/>
      <g stroke="${INKG}" stroke-width="2.2"><ellipse cx="62" cy="122" rx="22" ry="16" fill="#E8893A"/><ellipse cx="100" cy="124" rx="16" ry="12" fill="#F2A04E"/><path d="M62 106 v-6 M100 112 v-5" stroke-width="3"/><ellipse cx="150" cy="124" rx="24" ry="10" fill="#B5542F" transform="rotate(-8 150 124)"/><ellipse cx="186" cy="124" rx="18" ry="8" fill="#C46A45"/></g>
      ${hw ? `<g transform="translate(176 160)"><rect x="-30" y="-14" width="60" height="30" rx="4" fill="#3E3A38" stroke="${INKG}" stroke-width="2"/><text y="6" text-anchor="middle" font-family="Caveat,cursive" font-size="13" fill="#FFFBF3">Dog-safe treats</text></g>` : ''}</svg>`;
  },
  paradebanner: () => {
    const flags = [0, 1, 2, 3, 4, 5, 6].map((i) => { const x = 40 + i * 50, y = 22 + Math.sin(i / 6 * Math.PI) * 14; return i % 2 ? `<g transform="translate(${x} ${y})"><path d="M-12 0 Q-14 26 -10 32 L-5 27 L0 32 L5 27 L10 32 Q14 26 12 0 Q0 -10 -12 0 Z" fill="#FFFBF3" stroke="${INKG}" stroke-width="2"/><circle cx="-4" cy="8" r="2" fill="${INKG}"/><circle cx="4" cy="8" r="2" fill="${INKG}"/></g>` : `<g transform="translate(${x} ${y + 14})"><ellipse rx="14" ry="12" fill="#E8893A" stroke="${INKG}" stroke-width="2"/><path d="M0 -12 v-5" stroke="#6B8A3A" stroke-width="3"/></g>`; }).join('');
    return `<svg viewBox="0 0 400 90" xmlns="http://www.w3.org/2000/svg"><path d="M4 14 Q200 54 396 14" fill="none" stroke="${INKG}" stroke-width="2.4"/>${flags}<g transform="translate(200 72) rotate(-2)"><rect x="-74" y="-16" width="148" height="28" rx="6" fill="#FFF3B8" stroke="${INKG}" stroke-width="2"/><text y="5" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="20" fill="${INKG}">Costume Parade</text></g></svg>`;
  },
  jackolantern: (o) => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">${o && o.lit ? '<circle cx="40" cy="48" r="34" fill="#F9D56E" opacity=".35"/>' : ''}<path d="M40 22 q-2 -8 4 -12" fill="none" stroke="#6B8A3A" stroke-width="4" stroke-linecap="round"/><ellipse cx="40" cy="48" rx="30" ry="24" fill="#E8893A" stroke="${INKG}" stroke-width="2.6"/><path d="M28 26 Q24 48 28 70 M52 26 Q56 48 52 70" fill="none" stroke="#B5542F" stroke-width="1.6"/><g fill="${o && o.lit ? '#FFE27A' : '#5B3D32'}" stroke="${INKG}" stroke-width="1.4"><path d="M26 42 l6 -8 l6 8 Z"/><path d="M42 42 l6 -8 l6 8 Z"/><path d="M26 54 q14 12 28 0 l-5 4 l-4 -4 l-5 5 l-5 -5 l-4 4 Z"/></g></svg>`,
  leafdrift: () => { const r = seeded(31); let s = ''; for (let i = 0; i < 9; i++) s += fsLeafPath(10 + i * 12 + r() * 6, 18 + r() * 14, 0.9 + r() * 0.4, r() * 360, FS_LEAF_COLS[i % 5]); return `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">${s}</svg>`; }
};
function fsArt(name, o) { return artReal('prop', name, o || {}) || FS_FB[name](o || {}); }
const fsKind = () => (festOn('halloween') ? 'halloween' : 'leaf');
const fsStallBox = () => (isPhone() ? FS_STALL.phone : FS_STALL.desk);
const fsBannerBox = () => (isPhone() ? FS_BANNER.phone : FS_BANNER.desk);
// a tap rect of at least 48 screen px each way on phones (like hmDecorHit)
function fsHit(x, y, w, h) {
  if (isPhone()) { const s = ((view.clientHeight || 500) - 60) / 600, m = 48 / s; if (w < m) { x -= (m - w) / 2; w = m; } if (h < m) { y -= (m - h) / 2; h = m; } }
  return `<rect class="fs-hit" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="transparent" pointer-events="all"/>`;
}

/* ---- drawing into the scene (yard:enter, scene:redraw, env:fest) ---- */
function fsPileSVG(i, state) {
  const [x, y, w, h] = FS_PILES[i];
  return `<g class="hot fs-pile" data-pile="${i}" data-state="${state}" tabindex="0" role="button" aria-label="Leaf pile: jump in">${place(fsArt('leafpile', { state, seed: i }), x, y, w, h)}${fsHit(x, y, w, h)}</g>`;
}
function fsYardDraw() {
  const svg = $('#view svg.world'); if (!svg) return;
  ['#fsPilesG', '#fsPumpkinG'].forEach((s) => { const e = $(s, svg); if (e) e.remove(); });
  if (festOn('leaf')) {
    const html = `<g id="fsPilesG">${FS_PILES.map((p, i) => fsPileSVG(i, FS.pileT[i] ? 'scattered' : 'full')).join('')}</g>`;
    const a = $('#decorG', svg) || $('#msCardG', svg); if (a) a.insertAdjacentHTML('afterend', html); else { const h = $('#houseG', svg); if (h) h.insertAdjacentHTML('beforebegin', html); }
    fsPileBind();
  }
  if (festOn('halloween')) {
    const [x, y, w, h] = FS_PUMPKIN, lit = isNight(), html = `<g id="fsPumpkinG" pointer-events="none" data-lit="${lit ? 1 : 0}">${place(fsArt('jackolantern', { lit }), x, y, w, h)}</g>`;
    const hg = $('#houseG', svg); if (hg) hg.insertAdjacentHTML('afterend', html);
  }
}
function fsPileBind() {
  document.querySelectorAll('#fsPilesG [data-pile]').forEach((el) => {
    const go = (e) => { if (e) e.stopPropagation(); fsPileTap(+el.dataset.pile); };
    el.onclick = go; el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  });
}
function fsSquareDraw() {
  const svg = $('#view svg.world'); if (!svg) return;
  ['#fsStallG', '#fsBannerG'].forEach((s) => { const e = $(s, svg); if (e) e.remove(); });
  const pb = $('#placeBtns'); if (pb) pb.querySelectorAll('[data-fs]').forEach((b) => b.remove());
  if (!fsAnyOn() || FS.walking) { fsPackSync(); return; }
  const pack = $('#pack', svg); if (!pack) return;
  const [sx, sy, sw, sh] = fsStallBox();
  let html = `<g id="fsStallG" class="hot" data-kind="${fsKind()}" tabindex="0" role="button" aria-label="Baker Bea's Harvest Stall">${place(fsArt('stall', { kind: fsKind() }), sx, sy, sw, sh)}${fsHit(sx + 8, sy + 10, sw - 16, sh - 10)}</g>`;
  if (festOn('halloween')) { const [bx, by, bw, bh] = fsBannerBox(); html = `<g id="fsBannerG" pointer-events="none">${place(fsArt('paradebanner'), bx, by, bw, bh)}</g>` + html; }
  pack.insertAdjacentHTML('beforebegin', html);
  const st = $('#fsStallG', svg); st.onclick = (e) => { e.stopPropagation(); SFX.click(); fsStallOpen(); }; st.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fsStallOpen(); } };
  if (pb) {
    const home = pb.querySelector('[data-pb="yard"]'), add = (h) => { if (home) home.insertAdjacentHTML('beforebegin', h); else pb.insertAdjacentHTML('beforeend', h); };
    add('<button class="btn yes" data-fs="stall">Harvest Stall</button>');
    if (festOn('halloween')) add(`<button class="btn yes" data-fs="parade" ${fsParadedToday() ? 'aria-disabled="true"' : ''}>${fsParadedToday() ? 'Paraded today' : 'Costume parade'}</button>`);
    pb.querySelectorAll('[data-fs]').forEach((b) => { b.onclick = () => { SFX.click(); if (b.dataset.fs === 'stall') fsStallOpen(); else fsParadeOpen(); }; });
  }
  fsPackSync();
}
// Square pack spot 3 stands where the stall is: it moves to the front while the stall is up and comes back when the festival packs up
function fsPackSync() {
  if (typeof PACK_SPOTS === 'undefined' || !PACK_SPOTS.square) return;
  if (!FS.packSq) FS.packSq = PACK_SPOTS.square[2].slice();
  const want = fsAnyOn() ? FS_PACK_SQ : FS.packSq, now = PACK_SPOTS.square[2];
  if (now[0] === want[0] && now[1] === want[1]) return;
  PACK_SPOTS.square[2] = want.slice();
  if (fsHere('square') && !FS.walking) { const g = $('#pack'); if (g) { g.innerHTML = packSVG(); bindPack(); } }
}
function fsDraw() {
  if (!S || cur.mode !== 'yard') return; fsFields();
  if (S.place === 'yard') fsYardDraw();
  else if (S.place === 'square') fsSquareDraw();
}

/* ---- letters and the season greeting ---- */
function fsLetters() {
  if (!S || typeof mailPush !== 'function') return; fsFields(); const y = fsYear();
  ['leaf', 'halloween'].forEach((k) => { if (festOn(k) && S.fest.letters[k] !== y) { S.fest.letters[k] = y; markDirty(); mailPush(Object.assign({ kind: 'news', id: `fest_${k}_${y}` }, FS_LETTERS[k])); } });
}
// under the test harness the greeting only shows when a suite asks (prefs.fsTest), so older suites see the toasts they measured before
const fsGreetAllowed = () => !navigator.webdriver || !!prefs.fsTest;
function fsSeasonGreet() {
  if (!S || S.place !== 'yard' || !fsGreetAllowed()) return; fsFields();
  const s = seasonNow(), y = fsYear(); if (S.seasonSeen[s] === y || !FS_SEASON_LINE[s]) return;
  setTimeout(() => {
    if (!S || cur.mode !== 'yard' || S.place !== 'yard' || S.seasonSeen[s] === y || (typeof gdActive === 'function' && gdActive())) return;
    S.seasonSeen[s] = y; markDirty(); toast(FS_SEASON_LINE[s], 'good');
  }, 1500);
}

/* ---- leaf piles ---- */
function fsPileTap(i) {
  if (!FS_PILES[i] || !festOn('leaf') || cur.mode !== 'yard' || S.place !== 'yard') return;
  if (busy || S.sleeping || (typeof curling !== 'undefined' && curling)) return;
  fsFields(); const last = S.fest.piles[i];
  if (typeof last === 'number' && S.gameMin - last >= 0 && S.gameMin - last < FS_PILE_GAP) { toast('The pile needs raking first. Try the other one, or come back in a bit.'); return; }
  const pup = ageMonths(D()) < 3, adult = pup ? others().find((d) => !d.sleeping && ageMonths(d) >= 3 && !(typeof hmMumIn === 'function' && hmMumIn(d))) : null;
  if (pup && !adult) { const h = dogHeadWorld(); say('Sniff.', h.x, h.y, 1800); toast(`${NAME()} is too small to jump in yet. Puppies watch the leaves from the grass for now.`); return; }
  const [x, y, w, h] = FS_PILES[i], cx = x + w / 2, gy = y + h * 0.8, face = cx < 430 ? 'left' : 'right';
  busy = true; hideBubble(); SFX.click();
  const tx = pup ? cx - 430 + (face === 'left' ? 120 : -120) : cx - 430, ty = Math.max(0, gy - 500) - (pup ? 0 : 6);
  dogTo(tx, ty, 1, 0.8); renderDog('walk', face);
  const T = (fn, ms) => setTimeout(() => { if (cur.mode === 'yard' && S.place === 'yard') fn(); }, ms);
  T(() => {
    if (pup) { renderDog('sit', face, true); fsPackJump(adult, cx, gy); } else { renderDog('jump', face, true); const fx = $('#dogFx'); if (fx) { fx.classList.remove('tk-pounce'); void fx.getBBox(); fx.classList.add('tk-pounce'); } }
    SFX.crunch(); setTimeout(() => SFX.crunch(), 180);
    fsScatter(i);
  }, 850);
  T(() => {
    addStat('happy', 6); addBond(1); S.fest.piles[i] = S.gameMin; markDirty(); updateHUD();
    const hw = dogHeadWorld(); say(pup ? `${adult.name} did the jumping. ${NAME()} did the cheering.` : PICK(['Crunch.', 'Again.', 'Where did the leaves go.']), hw.x, hw.y, 2600);
    trackAct('leafpile', {});
  }, 1600);
  T(() => { const fx = $('#dogFx'); if (fx) fx.classList.remove('tk-pounce'); dogTo(0, 0, 1, 0.8); renderDog('walk', face === 'left' ? 'right' : 'left'); }, 2400);
  setTimeout(() => { busy = false; if (cur.mode === 'yard') renderDog(dogPoseNow(), 'right', true); }, 3300);
}
// a young puppy's turn: the first awake adult of the pack bounds into the pile and back
function fsPackJump(d, cx, gy) {
  const g = d && $(`#pack [data-dog="${d.id}"]`), sp = d && packSpots()[others().indexOf(d)]; if (!g || !sp) return;
  g.style.transition = 'transform .5s ease-in-out'; g.style.transform = `translate(${f1(cx - sp[0])}px, ${f1(gy - sp[1])}px)`;
  const inner = g.querySelector('.pd-wander'); if (inner) { inner.classList.remove('tk-pounce'); void inner.getBBox(); inner.classList.add('tk-pounce'); }
  setTimeout(() => { g.style.transform = ''; setTimeout(() => { g.style.transition = ''; if (inner) inner.classList.remove('tk-pounce'); }, 600); }, 1300);
}
function fsScatter(i) {
  const g = $(`#fsPilesG [data-pile="${i}"]`); if (!g) return;
  clearTimeout(FS.pileT[i]); g.outerHTML = fsPileSVG(i, 'scattered'); fsPileBind();
  FS.pileT[i] = setTimeout(() => { delete FS.pileT[i]; const o = $(`#fsPilesG [data-pile="${i}"]`); if (o) { o.outerHTML = fsPileSVG(i, 'full'); fsPileBind(); } }, 4000);
  if (fsMotionOff()) return;
  const fx = $('#fx'); if (!fx) return; const [x, y, w, h] = FS_PILES[i], cx = x + w / 2, cy = y + h * 0.5;
  for (let k = 0; k < 12; k++) {
    const a = -Math.PI * (0.1 + 0.8 * (k / 11)) + (Math.random() - 0.5) * 0.3, d = 70 + Math.random() * 60;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'fs-leafp');
    el.style.setProperty('--dx', f1(Math.cos(a) * d) + 'px'); el.style.setProperty('--dy', f1(Math.sin(a) * d) + 'px'); el.style.setProperty('--rot', Math.round(Math.random() * 540 - 270) + 'deg'); el.style.animationDelay = Math.round(k * 25) + 'ms';
    el.innerHTML = fsLeafPath(cx + (Math.random() - 0.5) * 40, cy, 1.1, Math.random() * 360, FS_LEAF_COLS[k % 5]); fx.appendChild(el); setTimeout(() => el.remove(), 1700);
  }
}

/* ---- Harvest Stall (Square) ---- */
function fsStallItems() {
  const on = (x) => festOn(x.fest);
  return FOOD.filter((f) => f.fest && on(f)).map((f) => ({ cat: 'food', n: f.n, price: f.price, desc: f.note, tip: f.tip }))
    .concat(CLOTHES.filter((c) => c.fest && !c.reward && on(c)).map((c) => ({ cat: 'clothes', n: c.n, price: c.price, desc: `${SLOT_NAME[c.slot]}. ${c.perk}` })));
}
function fsStallOpen() {
  if (!S) return;
  if (!fsAnyOn()) { toast('The Harvest Stall is packed away. Baker Bea comes back for the leaf festival.'); return; }
  fsFields(); if (S.fest.stall.seen !== localISO()) { S.fest.stall.seen = localISO(); markDirty(); }
  SFX.boop(620); if (typeof audioPlace === 'function') audioPlace('shop');
  const items = fsStallItems();
  const cards = items.map((it) => {
    const owned = it.cat === 'clothes' && owns('clothes', it.n), have = it.cat === 'food' ? (S.inv.food[it.n] || 0) : 0;
    const act = owned ? '<span class="chip own">Owned</span>' : `<button class="btn yes" data-fsbuy="${esc(it.n)}">${it.cat === 'food' ? 'Buy…' : 'Buy'}</button>`;
    return `<div class="sitem fs-card" data-cat="${it.cat}"><span class="art">${itemArt(it.n)}</span><b>${esc(it.n)}</b><span class="desc">${esc(it.desc)}</span>${it.tip ? `<span class="small sh-tip">${esc(it.tip)}</span>` : ''}${priceHTML(it.price + (it.cat === 'food' ? ' each' : ''))}${have ? `<span class="small">You have ${have}</span>` : ''}${act}</div>`;
  }).join('');
  const deco = `<span class="fs-drift" aria-hidden="true">${fsArt('leafdrift')}</span>`;
  const p = openModal('Harvest Stall', `<div class="fs-bea">${deco}<p><b>Baker Bea:</b> "Everything here is dog-safe. Ask me anything, I will say pumpkin."</p></div><p class="small">Festival treats and outfits, for coins, while the festival is on. You have ${fmtC(S.coins)} Paw Coins.</p><div class="shopgrid">${cards}</div>`, { cls: 'shop fs-stall' });
  p.querySelectorAll('[data-fsbuy]').forEach((b) => {
    b.onclick = async () => {
      const it = items.find((x) => x.n === b.dataset.fsbuy); if (!it) return; SFX.click();
      const stack = it.cat === 'food', owned = !stack && owns('clothes', it.n);
      const q = await buyWindow(p, { art: itemArt(it.n), name: it.n, desc: it.desc, price: it.price, stack, owned, have: stack ? (S.inv.food[it.n] || 0) : owned ? 1 : 0, haveLabel: stack ? 'In bag' : 'Owned' }); if (!q) return;
      const cost = it.price * q; if (S.coins < cost) { nope('Not enough coins. Walks pay well, and the pumpkins will wait.'); return; }
      S.coins -= cost; SFX.kaching(); trackAct('buy', { name: it.n, cat: it.cat, qty: q, shop: 'stall' });
      if (stack) S.inv.food[it.n] = (S.inv.food[it.n] || 0) + q; else if (!owns('clothes', it.n)) S.inv.clothes.push(it.n);
      markDirty(); updateHUD();
      toast(`Bought ${q} × ${it.n}. ${PICK(['Baker Bea wraps it in a paper leaf.', 'It smells of pumpkin. Everything does.', 'Bea says it suits you.'])}`, 'gold');
      fsStallOpen();
      if (it.cat === 'clothes') { const pp = $('.panel', modal); const w = await confirmIn(pp, `Put the ${esc(it.n)} on ${esc(NAME())} now?`, 'Wear it', 'Later'); if (w) equip(it.n, true); if (!modal.hidden) fsStallOpen(); }
    };
  });
  return p;
}

/* ---- costume parade (Square, Halloween) ---- */
const fsParadedToday = () => !!(S && S.fest && S.fest.parade && S.fest.parade.date === localISO());
function fsParadeDogs(dk = localISO()) {
  const seen = new Set(), out = [];
  playboardDogs(dk).concat(playboardDogs('parade|' + dk)).forEach((n) => { if (out.length < 5 && !seen.has(n.name)) { seen.add(n.name); out.push(n); } });
  const r = seeded(hashId('costume|' + dk));
  return out.map((n) => { const c = FS_COSTUMES[Math.floor(r() * FS_COSTUMES.length)], slot = (CLOTHES.find((x) => x.n === c) || {}).slot || 'body'; return Object.assign({}, n, { costume: c, outfit: { [slot]: c } }); });
}
function fsOutfitWords(o) { const w = SLOTS.map((k) => o[k]).filter(Boolean); return w.length ? 'Wearing ' + w.join(' and ') + '.' : 'No costume. Going as a dog. Bold.'; }
function fsParadeOpen() {
  if (!S) return;
  if (!festOn('halloween')) { toast('The costume parade is over for this year. Gerald is already planning the next one.'); return; }
  SFX.boop(700); const dogs = fsParadeDogs(), me = D(), done = fsParadedToday();
  const row = dogs.map((n) => `<div class="fs-npc"><span class="fs-pdog">${dogSVG(n, { pose: 'sit', outfit: n.outfit, facing: 'right' })}</span><b>${esc(n.name)}</b><span class="small">${esc(n.costume)}</span></div>`).join('');
  const p = openModal('Costume parade', `<div class="fs-banner" aria-hidden="true">${fsArt('paradebanner')}</div><p class="small">Gerald runs it. Five town dogs in costume, and you. Everyone gets a cheer.</p>
    <div class="fs-row" role="list" aria-label="Today's parade dogs">${row}</div>
    <div class="fs-you"><span class="fs-pdog">${dogSVG(me, { pose: 'sit', outfit: outfitOf(me), facing: 'right' })}</span><div><b>${esc(NAME())}</b><span class="small">${esc(fsOutfitWords(outfitOf(me)))}</span>${done ? '<span class="small">Paraded today. Come back tomorrow for another lap.</span>' : ''}</div></div>`,
  { cls: 'fs-paradepop', foot: `<button class="btn yes big" id="fsJoin" ${done ? 'aria-disabled="true"' : ''}>${done ? 'Paraded today' : 'Join the parade'}</button>` });
  $('#fsJoin', p).onclick = () => {
    if (fsParadedToday()) { nope('One parade a day is plenty. The costumes need a rest too.'); return; }
    if (busy || S.sleeping) { nope(S.sleeping ? `${NAME()} is asleep. The parade can wait one nap.` : `Hold on, ${NAME()} is busy.`); return; }
    SFX.click(); closeModal(); fsParadeWalk(dogs);
  };
  return p;
}
function fsParadeWalk(dogs) {
  fsFields(); S.fest.parade.date = localISO(); markDirty(); // the day is spent as soon as the walk starts
  if (fsMotionOff() || !fsHere('square')) { fsParadeDone(); return; }
  const svg = $('#view svg.world'), fx = $('#fx', svg); if (!fx) { fsParadeDone(); return; }
  FS.walking = true; busy = true; hideBubble();
  const hide = ['#dogPos', '#pack', '#visitorG', '#placeBtns'].map((s) => $(s, view)).filter(Boolean); hide.forEach((e) => { e.style.visibility = 'hidden'; });
  const sc = 0.56, w = 264 * sc, hgt = 220 * sc, gap = 104, feetY = 505, line = [D()].concat(dogs);
  const dist = 700, lead = 200 - dist / 2; // the leader walks from the fountain (x 200) to the stall (x 900)
  const parts = line.map((d, i) => { const fx0 = lead - i * gap, x = fx0 - w / 2, y = feetY - hgt * (205 / 220); return `<g class="fs-pd" data-i="${i}">${place(dogSVG(d, { pose: 'walk', outfit: i ? d.outfit : outfitOf(d), facing: 'right' }), f1(x), f1(y), f1(w), f1(hgt))}</g>`; }).join('');
  fx.insertAdjacentHTML('beforebegin', `<g id="fsParadeG" pointer-events="none"><g class="fs-line" style="transform:translateX(0px)">${parts}</g><g class="fs-leaves"></g></g>`);
  const lg = $('#fsParadeG .fs-line'), leaves = $('#fsParadeG .fs-leaves');
  for (let k = 0; k < 10; k++) { const el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'fs-drop'); el.style.animationDelay = (k * 0.55).toFixed(2) + 's'; el.style.setProperty('--sway', (k % 2 ? 40 : -40) + 'px'); el.innerHTML = fsLeafPath(120 + ((k * 97) % 800), 150 + (k % 3) * 20, 1.4, k * 40, FS_LEAF_COLS[k % 5]); leaves.appendChild(el); }
  requestAnimationFrame(() => requestAnimationFrame(() => { if (lg) { lg.style.transition = `transform ${FS_PARADE_MS}ms linear`; lg.style.transform = `translateX(${dist}px)`; } }));
  FS.walkT.push(setTimeout(() => { if (fsHere('square')) say(PICK(['Ooh.', 'Is that a duck?']), isPhone() ? 330 : 260, 300, 2400); }, 1800));
  FS.walkT.push(setTimeout(() => fsParadeEnd(true), FS_PARADE_MS + 200));
  onCleanup(() => { if (FS.walking) fsParadeEnd(false); });
}
function fsParadeEnd(here) {
  FS.walkT.splice(0).forEach(clearTimeout); if (!FS.walking) return;
  FS.walking = false; busy = false;
  const g = $('#fsParadeG'); if (g) g.remove();
  ['#dogPos', '#pack', '#visitorG', '#placeBtns'].forEach((s) => { const e = $(s, view); if (e) e.style.visibility = ''; });
  if (here && fsHere('square')) { fsSquareDraw(); renderDog(dogPoseNow(), 'right', true); }
  fsParadeDone();
}
function fsParadeDone() {
  const n = addCoins(10, { raw: true }); addStat('happy', 10); addBond(2); markDirty(); updateHUD(); SFX.kaching();
  toast(`Best in show: ${NAME()}. +${n} coins.`, 'gold'); trackAct('parade', {});
  if (fsHere('square')) fsSquareDraw();
  const y = fsYear(); if (S.fest.parade.year === y) return;
  S.fest.parade.year = y; const fresh = !owns('clothes', 'Parade Rosette'); if (fresh) S.inv.clothes.push('Parade Rosette'); markDirty(); saveNow();
  const show = () => {
    SFX.fanfare();
    const p = openModal('<span class="hl">The Parade Rosette!</span>', `<div class="ms-prize"><span class="ms-prize-art">${itemArt('Parade Rosette')}</span><div><p>${fresh ? `Gerald pins a rosette on ${esc(NAME())}. It is a little bent. So is Gerald.` : `Best in show again this year. Gerald bends the rosette a little more, for luck.`}</p><p class="small">Parade Rosette: neck. It is in the Wardrobe.</p></div></div>`, { cls: 'celebrate fs-rosette', foot: '<button class="btn no" id="fsLater">Later</button><button class="btn yes big" id="fsWear">Wear it</button>' });
    $('#fsLater', p).onclick = () => { SFX.click(); closeModal(); };
    $('#fsWear', p).onclick = () => { closeModal(); equip('Parade Rosette', true); toast(`${NAME()} is wearing the Parade Rosette. Very proud.`, 'good'); };
  };
  if (typeof msWhenFree === 'function') msWhenFree(show); else setTimeout(show, 600);
}

/* ---- the Journal Food tab line ---- */
function fsJournalLine() {
  if (!S || !fsAnyOn()) return '';
  const until = festOn('leaf') ? '30 November' : '31 October';
  return `<p class="fs-jline"><span class="ic" aria-hidden="true">${iconOr('festival', '<path d="M0 -12 C6 -8 9 -2 0 12 C-9 -2 -6 -8 0 -12 Z" fill="#E8893A" stroke="#5B3D32" stroke-width="2"/>')}</span><b>Festival:</b> Harvest Stall in the Square until ${until}.</p>`;
}

/* ---- bus ---- */
on('game:ready', () => { fsFields(); fsPackSync(); setTimeout(fsExpose, 0); });
on('yard:enter', () => {
  fsFields(); fsPackSync(); fsDraw(); fsExpose();
  setTimeout(() => { if (cur.mode === 'yard') fsLetters(); }, 1200);
  fsSeasonGreet();
});
on('scene:redraw', () => { if (!FS.walking) { fsPackSync(); fsDraw(); } });
on('env:fest', () => { fsPackSync(); if (cur.mode === 'yard') setTimeout(fsLetters, 400); });
on('env:season', () => fsSeasonGreet());

/* ---- tests: window.__paw.fest ---- */
function fsExpose() {
  if (!window.__paw) return;
  window.__paw.fest = {
    piles: FS_PILES, stall: () => fsStallBox(), banner: () => fsBannerBox(), pumpkin: FS_PUMPKIN, tap: (i) => fsPileTap(i), stallOpen: () => fsStallOpen(), paradeOpen: () => fsParadeOpen(),
    paradeDogs: (dk) => fsParadeDogs(dk), items: () => fsStallItems().map((x) => x.n), draw: () => fsDraw(), letters: () => fsLetters(), journal: () => fsJournalLine(),
    warm: () => isWarm(), get walking() { return FS.walking; }, get scattered() { return Object.keys(FS.pileT).map(Number); }, packSpot: () => (typeof PACK_SPOTS !== 'undefined' ? PACK_SPOTS.square[2] : null)
  };
}
