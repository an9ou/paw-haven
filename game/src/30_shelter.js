/* ======================= v2.7 SHELTER lane (tag sr): the Shelter Playroom. See V27.md sections 1 and 7 =======================
   The SHELTER lane owns this file (and css/33_shelter.css). This is the coordinator's stub: the room layout, the board slots, the resident names and
   traits and the roster are final here, so the art lane, the SHELTER lane and the tests agree on them. The playroom itself is the SHELTER lane's. */

// the playroom scene (PawArt.scene('playroom'), 1000 x 600, world_c). Boxes are [x, y, w, h] in world units, points are [x, y].
const SR_ROOM = {
  sign: [370, 10, 260, 64], // painted "Paw Haven Shelter" sign (art)
  board: [350, 84, 300, 220], // plain wall: the game draws PawArt.prop('adoptboard') here (viewBox 300 x 220, 1:1)
  window: [70, 90, 230, 180], // the window with the real sky (art)
  shelf: [716, 96, 236, 264], // the toy shelf against the right wall (art)
  toys: [800, 360, 140, 84], // the toy basket on the floor by the shelf, <g data-hot="toys"> in the art: tap it to toss a toy
  tables: [[214, 392, 120, 48], [610, 392, 120, 48]], // low café tables against the back wall (art), bottom edges at y <= 440, one with a water bowl
  cushions: [[170, 560], [500, 576], [850, 562]], // floor cushion centres (art draws them flat): the nap spots
  floor: [40, 450, 960, 596] // where room dogs stand: feet x in [40, 960], feet y in [450, 596]. Nothing upright stands in this band.
};
// the board's poster slots, in the board's own viewBox (300 x 220): portrait box [x, y, w, h] for slot i (0..7, 2 rows of 4). PawArt.ADOPT_SLOTS wins if the art publishes it.
const SR_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [20 + (i % 4) * 70, 58 + Math.floor(i / 4) * 80, 54, 50]);
const SR_NAMES = ['Clementine', 'Rusty', 'Mabel', 'Pudding', 'Ziggy', 'Hazel', 'Otis', 'Peanut', 'Juniper', 'Bramble', 'Toffee', 'Winnie', 'Buster', 'Maple', 'Scout', 'Pickle Jr.'];
const SR_TRAITS = ['Loves belly rubs more than dinner.', 'Shy for five minutes, then your shadow.', 'Snores like a tiny tractor.', 'Brings you a toy and keeps it.',
  'Sits very nicely for a biscuit.', 'Thinks every visitor came to see them.', 'Likes long naps in a sunny spot.', 'Leans on your legs to say hello.',
  'Chases bubbles and never catches one.', 'Gentle with puppies and very old cats.', 'Waits by the door in case of walks.', 'Talks back in small grumbles.'];

// Monday of the week of an ISO date (residents stay a week)
function srWeekKey(dk) { const d = new Date(dk + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localISO(d); }
// a dog's trait line, seeded by its id
function srTrait(id) { return SR_TRAITS[hashId('trait|' + id) % SR_TRAITS.length]; }
// The playroom roster for a date: today's 2 rescues (rescuesToday, unchanged, kind 'rescue') then 4 residents of the week (kind 'resident'):
// a puppy (3 to 5 months), a senior (96 to 150 months) and two adults (12 to 60 months), any of the 14 breeds, coats from PawGenes.
// Seeded, never saved. Dogs already home (dogById) or adopted from here before (S.shelter.adopted) are left out.
function srRoster(dk) {
  dk = dk || localISO(); const wk = srWeekKey(dk), r = seeded(hashId('resident|' + wk)), G = PGN(), taken = new Set();
  const ages = [[3, 5], [96, 150], [12, 60], [12, 60]];
  const res = ages.map(([a, b], i) => {
    const key = BREED_KEYS[Math.floor(r() * BREED_KEYS.length)], sex = r() < 0.5 ? 'female' : 'male', months = a + Math.floor(r() * (b - a + 1));
    let ni = Math.floor(r() * SR_NAMES.length); while (taken.has(ni)) ni = (ni + 1) % SR_NAMES.length; taken.add(ni);
    let genes = null; if (G && typeof G.randomGenotype === 'function') { try { genes = G.randomGenotype(key, r); } catch (e) { genes = null; } }
    if (!genes) { const g = STARTER_GENES[key] || STARTER_GENES.mutt; genes = { B: g.B.slice(), D: g.D.slice(), E: g.E.slice(), S: g.S.slice(), M: g.M.slice(), Bl: g.Bl.slice() }; }
    return { id: 'sr_' + wk + '_' + i, key, sex, months, name: SR_NAMES[ni], genes, rescue: { date: dk }, kind: 'resident' };
  });
  const all = rescuesToday(dk).map((x) => Object.assign({ kind: 'rescue' }, x)).concat(res);
  const gone = (S && S.shelter && Array.isArray(S.shelter.adopted)) ? S.shelter.adopted : [];
  return all.filter((x) => !(S && Array.isArray(S.dogs) && dogById(x.id)) && !gone.includes(x.id)).map((x) => Object.assign(x, { trait: srTrait(x.id) }));
}

/* ---------------- the playroom (V27.md section 7) ----------------
   Two modes draw the same room: 'adopt' (a new game: 6 of the 14 starters, the v2.6 carousel tray, no S read or written) and 'shelter'
   (from the Map: the whole srRoster(), the tray with the board, the toy and Go home). Each room dog is a little state machine: a queue of
   steps (walk to a spot, hold a pose for a while, run a function) that srTick() works through. Walks are CSS transform transitions. */
const SR_MEET = [500, 592]; // adopt mode: the selected dog's feet at the front, scale 1
const SR_TOYS = ['ball', 'bone', 'ring'];
const SR_TOY_N = { ball: 'squeaky ball', bone: 'plush bone', ring: 'rope ring' };
const srS = { kind: null, dogs: [], timer: 0, meet: null, tossAt: -1e9, toy: null, art: new Map(), pets: 0, bellies: 0, fetches: 0, lastFetch: null, lastPet: null };
const srMotionOff = () => document.documentElement.dataset.motion === 'off';
const srScale = (fy) => 0.5 + (clamp(fy, 450, 596) - 450) / 146 * 0.22;
const srDog = (id) => (srS.meet && srS.meet.id === id ? srS.meet : srS.dogs.find((d) => d.id === id)) || null;
const srBreed = (k) => dogInfo(k).breed;
function srSceneName() { const W = PA().WORLD_C_SCENES; return Array.isArray(W) && W.includes('playroom') ? 'playroom' : 'shelter'; }
// a stand-in dog record for the art and the genes (roster dogs carry genes and an age, starters only a key)
function srTmp(x) { if (!x._t) x._t = { id: x.id, key: x.key, genes: x.genes || null, born: bornDaysAgo(x.months || 10) }; return x._t; }
function srArt(x, pose, face) {
  const k = x.id + '|' + x.key + '|' + pose + '|' + face; if (srS.art.has(k)) return srS.art.get(k);
  let o = { pose, facing: face };
  if (x.genes) { const t = srTmp(x); o = Object.assign(o, lookOpts(t, coatInfo(t))); } else if ((x.months || 10) < 6) o.age = 'puppy';
  if (pose === 'sleep' && ROACH[x.key] && poseReal(x.key, 'rollover')) o = Object.assign(o, { pose: 'rollover', roach: true }); // greyhounds nap upside down, as at home
  const sv = dogArtSafe(x.key, o); if (srS.art.size > 400) srS.art.clear(); srS.art.set(k, sv); return sv;
}
function srHead(x) { return x.genes ? headSVG(srTmp(x)) : art('dogHead', x.key); }
function srVoice(x) { const v = { breed: x.key, pitch: +(0.85 + (hashId(x.id) % 1000) / 1000 * 0.3).toFixed(3), size: DOG_SIZE[x.key] || 'medium' }; if ((x.months || 10) < 6) v.age = 'puppy'; return v; }
function srBark(x, kind) { if (barkMode() === 'off') return; playBark(srVoice(x), kind, { volume: 0.8 }); }
// the starters in the adopt-mode room: 6 of the 14, the same 6 all day
function srStarters(dk) {
  const r = seeded(hashId('starters|' + (dk || localISO()))), L = dogsList().slice();
  for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
  return L.slice(0, 6).map((d) => ({ id: 'st_' + d.key, key: d.key, name: d.name, months: 10, kind: 'starter' }));
}
// who is on the board: shelter mode the roster, adopt mode the 14 starters (8 pinned up, "+6")
function srBoardList() { return srS.kind === 'shelter' ? srRoster() : dogsList().map((d) => ({ id: 'st_' + d.key, key: d.key, name: d.name, months: 10, kind: 'starter' })); }

/* ---- where the room can be seen: the scene is sliced to the view, and in adopt mode on a laptop the tray covers the right side ---- */
function srVis() {
  const svg = $('#view svg.world'); const M = svg && svg.getScreenCTM(); if (!M) return [0, 0, 1000, 600];
  const v = view.getBoundingClientRect(); let right = v.right;
  if (srS.kind === 'adopt' && !isPhone()) { const tr = dock.querySelector(':scope > .tray'); const r = tr && tr.getBoundingClientRect(); if (r && r.width && r.left > v.left + v.width * 0.4 && r.left < right) right = r.left - 8; }
  const I = M.inverse(), a = new DOMPoint(v.left, v.top).matrixTransform(I), b = new DOMPoint(right, v.bottom).matrixTransform(I);
  return [Math.max(0, a.x), Math.max(0, a.y), Math.min(1000, b.x), Math.min(600, b.y)];
}
function srRange() {
  const [x0, , x1] = srVis(); let lo = Math.max(SR_ROOM.floor[0] + 50, x0 + 85), hi = Math.min(SR_ROOM.floor[2] - 50, x1 - 85);
  if (hi - lo < 160) { const c = (lo + hi) / 2; lo = c - 80; hi = c + 80; } return [lo, hi];
}
function srMeetX() { const [, , x1] = srVis(); return Math.round(Math.min(SR_MEET[0], x1 - 150)); }
// a floor spot away from the other dogs (and the meet spot)
function srFreeSpot(me, near) {
  const [lo, hi] = srRange(); const others = srS.dogs.filter((o) => o !== me && !o.hidden).map((o) => [o.fx, o.fy]);
  if (srS.meet) others.push([srS.meet.fx, srS.meet.fy]);
  let best = null, bd = -1;
  for (let i = 0; i < 14; i++) {
    let x = lo + Math.random() * (hi - lo), y = SR_ROOM.floor[1] + 8 + Math.random() * (SR_ROOM.floor[3] - SR_ROOM.floor[1] - 16);
    if (near && i < 10) { x = clamp(near[0] + (Math.random() - 0.5) * 360, lo, hi); }
    const d = others.length ? Math.min(...others.map(([ox, oy]) => Math.hypot(ox - x, (oy - y) * 1.7))) : 999;
    if (d > bd) { bd = d; best = [Math.round(x), Math.round(y)]; } if (d > 180) break;
  }
  return best;
}

/* ---- drawing ---- */
function srPosStyle(x, secs) { const sc = x.sc != null ? x.sc : srScale(x.fy); return `transform:translate(${f1(x.fx)}px,${f1(x.fy)}px) scale(${sc.toFixed(3)});transition-duration:${secs || 0}s`; }
function srArtHTML(x) { return place(srArt(x, x.pose, x.face), -DW / 2, -DH * 205 / 220, DW, DH); }
function srDogHTML(x, cls) {
  const lab = `${x.name} the ${srBreed(x.key)}: tap to pet`;
  return `<g class="sr-dog hot${cls ? ' ' + cls : ''}" data-srdog="${esc(x.id)}" role="button" tabindex="0" aria-label="${esc(lab)}"${x.hidden ? ' style="display:none"' : ''}><g class="sr-pos" style="${srPosStyle(x, 0)}">${isPhone() ? '<rect class="sr-hit" x="-124" y="-232" width="248" height="244" fill="transparent"/>' : '<rect class="sr-hit" x="-104" y="-196" width="208" height="206" fill="transparent"/>'}<g class="sr-art">${srArtHTML(x)}</g></g></g>`;
}
function srPosEl(x) { return x.el ? x.el.querySelector('.sr-pos') : null; }
function srSetPose(x, pose, face) {
  face = face || x.face; if (x.pose === pose && x.face === face) return; x.pose = pose; x.face = face;
  const g = x.el && x.el.querySelector('.sr-art'); if (g) g.innerHTML = srArtHTML(x); srHeld(x);
}
// dogs are drawn in feet-y order: only the dog that starts a walk is moved in the DOM (moving a node drops its running transition)
function srOrder(x) {
  const host = $('#srDogs'); if (!host || !x.el || x.el.parentNode !== host) return;
  const nx = [...host.children].find((e) => { if (e === x.el) return false; const o = srDog(e.dataset.srdog); return o && o.fy > x.fy; }) || null;
  if (x.el.nextElementSibling === nx) return; host.insertBefore(x.el, nx); const p = srPosEl(x); if (p) void getComputedStyle(p).transform;
}
function srMove(x, tx, ty, secs, sc) { x.fx = tx; x.fy = ty; if (sc != null) x.sc = sc; else if (!x.meet) x.sc = null; if (!x.meet) srOrder(x); const p = srPosEl(x); if (p) p.style.cssText = srPosStyle(x, srMotionOff() ? 0 : secs); }
// stop a walk where the dog is right now
function srHalt(x) {
  const p = srPosEl(x); if (!p) return;
  try { const m = new DOMMatrixReadOnly(getComputedStyle(p).transform); if (isFinite(m.e) && isFinite(m.f) && m.a > 0) { x.fx = m.e; x.fy = m.f; if (x.meet || x.sc != null) x.sc = m.a; } } catch (e) { /* keep the target */ }
  p.style.cssText = srPosStyle(x, 0);
}
function srHeadAt(x) { const s = x.sc != null ? x.sc : srScale(x.fy); return [x.fx + (x.face === 'left' ? -60 : 60) * s, x.fy - 170 * s]; }
function srFx(txt, wx, wy, color, size) {
  const fx = $('#srFx'); if (!fx) return;
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', f1(wx)); t.setAttribute('y', f1(wy)); t.setAttribute('font-size', size || 34); t.setAttribute('fill', color || '#F28FA5'); t.setAttribute('stroke', INKG); t.setAttribute('stroke-width', '1.4'); t.setAttribute('paint-order', 'stroke');
  t.setAttribute('class', 'heartfx sr-heart'); t.setAttribute('text-anchor', 'middle'); t.textContent = txt; fx.appendChild(t); setTimeout(() => t.remove(), srMotionOff() ? 900 : 1000);
}
function srHearts(x, n) { const [hx, hy] = srHeadAt(x); for (let i = 0; i < n; i++) setTimeout(() => srFx('♥', hx + (i - (n - 1) / 2) * 26 + (Math.random() - 0.5) * 10, hy - (i % 2) * 14), i * 110); }

/* ---- the board ---- */
function srSlots() { const A = PA().ADOPT_SLOTS; return Array.isArray(A) && A.length >= 8 && A.every((s) => Array.isArray(s) && s.length >= 4) ? A : SR_SLOTS; }
// the board's box: SR_ROOM.board, or lower on a laptop in shelter mode, where the HUD and the action bar crop the top of the room
function srBoardBox() {
  const [bx, by, bw, bh] = SR_ROOM.board; if (srS.kind !== 'shelter' || isPhone()) return [bx, by, bw, bh];
  const top = srVis()[1]; return [bx, Math.round(Math.min(Math.max(by, top + 8), 440 - bh)), bw, bh];
}
function srBoardFallback(n, more) {
  const tilt = [-3, 2, -1.5, 3, 2.5, -2, 1.5, -3];
  const pins = srSlots().slice(0, n).map(([x, y, w, h], i) => `<g transform="rotate(${tilt[i]} ${x + w / 2} ${y + h / 2})"><rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 18}" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F3E6D3" stroke="#5B3D32" stroke-width="1.2"/><circle cx="${x + w / 2}" cy="${y - 3}" r="4.5" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.4"/></g>`).join('');
  return `<svg viewBox="0 0 300 220"><rect x="5" y="5" width="290" height="210" rx="9" fill="#D9B48A" stroke="#5B3D32" stroke-width="3"/><rect x="13" y="13" width="274" height="194" rx="6" fill="none" stroke="#B88E62" stroke-width="2" stroke-dasharray="3 5"/><text x="150" y="42" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="32" fill="#5B3D32">Adopt me!</text>${more > 0 ? `<text x="262" y="38" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="22" fill="#C0566E">+${more}</text>` : ''}${pins}</svg>`;
}
function srBoardSVG() {
  const L = srBoardList(), n = Math.min(8, L.length), more = Math.max(0, L.length - 8), [bx, by, bw, bh] = srBoardBox(), k = bw / 300;
  const board = artReal('prop', 'adoptboard', { n, more }) || srBoardFallback(n, more), ph = isPhone();
  const slots = srSlots().slice(0, n).map(([x, y, w, h], i) => { const d = L[i], sz = Math.min(w, h) * k; return `<g class="sr-slot" data-srslot="${esc(d.id)}"${ph ? '' : ` role="button" tabindex="0" aria-label="Meet ${esc(d.name)} the ${esc(srBreed(d.key))}"`}><rect x="${f1(bx + x * k)}" y="${f1(by + y * k)}" width="${f1(w * k)}" height="${f1(h * k)}" fill="transparent"/>${place(srHead(d), f1(bx + (x + w / 2) * k - sz / 2), f1(by + (y + h / 2) * k - sz / 2), f1(sz), f1(sz))}</g>`; }).join('');
  return `<g class="sr-board hot" role="button" tabindex="0" aria-label="Adopt me board: who is looking for a home" data-n="${n}" data-more="${more}">${place(board, bx, by, bw, bh)}${slots}</g>`;
}
// the toy basket: the art's <g data-hot="toys"> (or a drawn stand-in while the playroom art is not there yet), with the game's own hit box over it
// (on phones a bigger one, so it is a 44 px target even in the small adopt-mode scene)
function srBasketSVG() {
  const [x, y, w, h] = SR_ROOM.toys, toy = (k, tx, ty) => { const a = artReal('prop', 'tosstoy', { kind: k }); return a ? place(a, tx, ty, 40, 40) : ''; };
  const art = $('#sceneG [data-hot="toys"]') ? '' : `${toy('ball', x + 26, y + 4)}${toy('ring', x + 58, y)}${toy('bone', x + 84, y + 6)}<path d="M${x + 8} ${y + 30} h${w - 16} l-10 ${h - 34} q-2 4 -6 4 h${-(w - 48)} q-4 0 -6 -4 z" fill="#E8C58F" stroke="#5B3D32" stroke-width="2.6" stroke-linejoin="round"/><path d="M${x + 16} ${y + 46} h${w - 32} M${x + 20} ${y + 62} h${w - 40}" stroke="#B88E62" stroke-width="2" stroke-dasharray="6 5"/>`;
  const pad = isPhone() ? 30 : 0;
  return `<g class="sr-basket hot" data-hot="toys" role="button" tabindex="0" aria-label="Toy basket: toss a toy">${art}<rect class="sr-toyhit" x="${x - pad}" y="${y - pad}" width="${w + 2 * pad}" height="${h + 2 * pad}" fill="transparent"/></g>`;
}
function srDrawBoard() { const g = $('#srBoardG'); if (g) g.innerHTML = srBoardSVG() + srBasketSVG(); }

/* ---- life ---- */
const SR_REST = { puppy: ['happy', 'jump', 'sit', 'idle', 'sniff', 'scratch'], adult: ['idle', 'sit', 'down', 'sniff', 'scratch', 'yawn'], senior: ['down', 'down', 'sit', 'yawn', 'idle', 'sniff'] };
const srAge = (x) => { const st = lifeStage(x.months || 10); return st === 'puppy' ? 'puppy' : st === 'senior' ? 'senior' : 'adult'; };
function srRest(x) { return { pose: PICK(SR_REST[srAge(x)]), ms: RINT(2000, 6000) }; }
function srUnpair(x) { if (x.pal) { const o = x.pal; x.pal = null; if (o.pal === x) { o.pal = null; o.lock = 0; o.q = []; o.until = 0; } } x.lock = 0; x.cushion = null; }
function srPlan(x, now) {
  x.cushion = null; const age = srAge(x);
  const w = age === 'puppy' ? { walk: 3, rest: 2, play: 4, nap: 0.6 } : age === 'senior' ? { walk: 1.5, rest: 4, play: 0.4, nap: 3.5 } : { walk: 4, rest: 4, play: 1.2, nap: 1 };
  let r = Math.random() * (w.walk + w.rest + w.play + w.nap), pick = 'walk';
  for (const k of ['walk', 'rest', 'play', 'nap']) { if (r < w[k]) { pick = k; break; } r -= w[k]; }
  if (pick === 'nap' && srNap(x)) return;
  if (pick === 'play' && srPlay(x, now)) return;
  if (pick === 'walk' || x.pose === 'sleep') { const to = srFreeSpot(x); if (to) { x.q = [{ to }, srRest(x)]; return; } }
  x.q = [srRest(x)];
}
function srNap(x) {
  const [lo, hi] = srRange(); const taken = srS.dogs.filter((o) => o !== x && o.cushion != null).map((o) => o.cushion);
  const free = SR_ROOM.cushions.map((c, i) => i).filter((i) => !taken.includes(i) && SR_ROOM.cushions[i][0] >= lo - 30 && SR_ROOM.cushions[i][0] <= hi + 30);
  if (!free.length) return false; const i = PICK(free), [cx, cy] = SR_ROOM.cushions[i];
  x.q = [{ to: [cx + RINT(-12, 12), Math.min(596, cy + 8)] }, { pose: 'sleep', ms: RINT(8000, 15000) }, { fn: (d) => { d.cushion = null; } }]; x.cushion = i; return true;
}
function srPlay(x, now) {
  if (x.pose === 'sleep') return false;
  const pals = srS.dogs.filter((o) => o !== x && !o.hidden && !o.lock && !o.pal && o.pose !== 'sleep' && o.cushion == null && !o.held);
  if (!pals.length) return false; const b = PICK(pals), [lo, hi] = srRange();
  let side = x.fx < b.fx ? -1 : 1, tx = b.fx + side * 120; if (tx < lo || tx > hi) { side = -side; tx = b.fx + side * 120; } if (tx < lo || tx > hi) return false;
  x.pal = b; b.pal = x; b.lock = now + 6000; b.q = [{ pose: 'idle', ms: 4000, face: side < 0 ? 'left' : 'right' }]; b.until = 0;
  x.q = [{ to: [Math.round(tx), Math.round(b.fy)] }, { fn: (a) => srPlayPair(a) }]; return true;
}
function srPlayPair(a) {
  const b = a.pal; if (!b || b.pal !== a) { a.q = [srRest(a)]; return; }
  const fa = b.fx < a.fx ? 'left' : 'right', fb = fa === 'left' ? 'right' : 'left', fun = (d) => (srAge(d) === 'puppy' ? 'jump' : 'happy');
  a.q = [{ pose: 'bow', ms: 1200, face: fa }, { pose: fun(a), ms: 1500, face: fa }, { pose: 'happy', ms: 900, face: fa }, { fn: (d) => { d.pal = null; } }];
  b.q = [{ pose: 'bow', ms: 1200, face: fb }, { pose: fun(b), ms: 1500, face: fb }, { pose: 'happy', ms: 900, face: fb }, { fn: (d) => { d.pal = null; d.lock = 0; } }];
  b.until = 0; if (Math.random() < 0.4) srBark(a, 'play');
}
function srRun(x, st, now) {
  if (st.fn) { st.fn(x); x.until = now; return; }
  if (st.to) {
    const [tx, ty] = st.to, d = Math.hypot(tx - x.fx, ty - x.fy), secs = st.secs || clamp(d / (st.fast ? 380 : 230), 1.2, 2.5);
    const face = Math.abs(tx - x.fx) > 4 ? (tx < x.fx ? 'left' : 'right') : x.face;
    srSetPose(x, d < 4 ? (st.pose || 'idle') : 'walk', face); srMove(x, tx, ty, secs, st.sc); x.until = now + (srMotionOff() ? 350 : d < 4 ? 200 : secs * 1000); return;
  }
  srSetPose(x, st.pose, st.face); x.until = now + st.ms;
}
function srStep(x, now) {
  if (now < x.until || x.hidden) return;
  const st = x.q.shift(); if (st) { srRun(x, st, now); return; }
  if (x.lock && now < x.lock) { x.until = now + 150; return; } x.lock = 0;
  if (x.meet) { x.q = [{ pose: PICK(['idle', 'sit', 'happy', 'idle']), ms: RINT(2500, 5000), face: x.face }]; return; }
  srPlan(x, now);
}
function srTick() {
  if (!srS.kind || !$('#srDogs')) return; const now = performance.now();
  srS.dogs.forEach((x) => srStep(x, now)); if (srS.meet) srStep(srS.meet, now);
}

/* ---- petting ---- */
const SR_PET_LINES = [(n) => `${n} leans in. Then leans in some more.`, (n) => `${n} wags so hard the whole dog wags.`, (n) => `${n} would like this every day, please.`, (n) => `${n} closes both eyes. This is the good stuff.`];
const SR_BELLY_LINES = [(n) => `Belly rub! ${n} melts into a happy puddle.`, (n) => `${n} flops over. The paws go up. The legs kick a little.`, (n) => `${n} offers the belly. You accept. Everyone wins.`];
function srPet(id) {
  const x = srDog(id); if (!x || x.hidden) return false; const now = performance.now();
  if (srS.kind === 'adopt' && !x.meet) { srPetFx(x, now, false); srAdoptPick(x.key); return true; } // a room dog in a new game: say hello, then come to the front
  srHalt(x); srUnpair(x); dropHeld(x, true);
  x.taps = (x.taps || []).filter((t) => now - t < 4000); x.taps.push(now);
  const belly = x.taps.length >= 3; if (belly) x.taps = [];
  srPetFx(x, now, belly); return true;
}
function srPetFx(x, now, belly) {
  x.q = belly ? [{ pose: 'rollover', ms: 2000 }, { pose: 'happy', ms: 900 }] : [{ pose: 'pet', ms: 900 }];
  srRun(x, x.q.shift(), now); srS.pets++; srS.lastPet = { id: x.id, belly }; if (belly) srS.bellies++;
  srHearts(x, belly ? 5 : 2); srBark(x, belly ? 'play' : 'woof'); SFX.boop(belly ? 760 : 620);
  const [hx, hy] = srHeadAt(x);
  if (belly) { srFx('Belly rub!', hx, hy - 34, '#C0566E', 30); say(PICK(SR_BELLY_LINES)(x.name), hx, hy - 20, 2600); }
  else if (Math.random() < 0.3) say(PICK(SR_PET_LINES)(x.name), hx, hy - 10, 2400);
}

/* ---- toss a toy ---- */
function srToyArt(kind) {
  const a = artReal('prop', 'tosstoy', { kind }); if (a) return a;
  const body = kind === 'ball' ? '<circle cx="30" cy="32" r="17" fill="#F4A262" stroke="#5B3D32" stroke-width="3"/><path d="M15 28q15 8 30 0" fill="none" stroke="#FFFBF3" stroke-width="3"/>'
    : kind === 'bone' ? '<path d="M14 24a7 7 0 1 1 8 -6l16 0a7 7 0 1 1 8 6a7 7 0 1 1 -8 6l-16 0a7 7 0 1 1 -8 -6z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="3" transform="translate(0 8)"/>'
      : '<circle cx="30" cy="32" r="16" fill="none" stroke="#5B3D32" stroke-width="10"/><circle cx="30" cy="32" r="16" fill="none" stroke="#F28FA5" stroke-width="6" stroke-dasharray="7 5"/>';
  return `<svg viewBox="0 0 60 60">${body}</svg>`;
}
function srHeld(x) { const h = x.el && x.el.querySelector('.sr-held'); if (h) h.setAttribute('transform', `translate(${x.face === 'left' ? -112 : 112} -92)`); }
function dropHeld(x, keep) { const h = x.el && x.el.querySelector('.sr-held'); if (h) h.remove(); if (x.held && !keep) { srS.fetches++; srS.lastFetch = { id: x.id, kind: x.held }; } x.held = null; }
function srToss() {
  if (!srS.kind || !$('#srFx')) return false; const now = performance.now();
  if (now - srS.tossAt < 6000) { toast('The toy is still out on the floor. Give the dogs a moment to bring it back.'); return false; }
  srS.tossAt = now; const kind = PICK(SR_TOYS), to = srFreeSpot(null) || [500, 520], [bx, by, bw] = SR_ROOM.toys, from = [bx + bw / 2, by + 10];
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'sr-toy'); g.dataset.kind = kind;
  g.innerHTML = place(srToyArt(kind), -22, -22, 44, 44); $('#srFx').appendChild(g); srS.toy = { kind, at: to, el: g };
  SFX.boop(880);
  const land = () => { g.style.transform = `translate(${to[0]}px,${to[1] - 14}px)`; srFetch(kind, to); };
  if (srMotionOff() || typeof g.animate !== 'function') { land(); return true; }
  const fr = []; for (let i = 0; i <= 10; i++) { const t = i / 10, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - 14 - from[1]) * t - Math.sin(Math.PI * t) * 190; fr.push({ transform: `translate(${f1(x)}px,${f1(y)}px) rotate(${Math.round(t * 540)}deg)` }); }
  g.style.transform = fr[0].transform; const an = g.animate(fr, { duration: 900, easing: 'linear', fill: 'forwards' });
  an.onfinish = () => { if (g.isConnected) { an.cancel(); land(); } }; return true;
}
function srFetch(kind, to) {
  const now = performance.now();
  const awake = srS.dogs.filter((o) => !o.hidden && o.pose !== 'sleep' && o.cushion == null && !o.held).sort((a, b) => Math.hypot(a.fx - to[0], a.fy - to[1]) - Math.hypot(b.fx - to[0], b.fy - to[1]));
  const run = awake.slice(0, awake.length > 1 && Math.random() < 0.65 ? 2 : 1);
  if (!run.length) { const sl = srS.dogs.find((o) => !o.hidden); if (sl) run.push(sl); }
  run.forEach((x, i) => {
    srHalt(x); srUnpair(x); x.lock = now + 9000;
    const side = x.fx < to[0] ? -1 : 1, face = side < 0 ? 'right' : 'left';
    if (i === 0) x.q = [{ to: [to[0] + side * 34, to[1]], fast: true }, { fn: (d) => srGrab(d, kind) }, { to: [clamp(d0(to[0]), ...srRange()), 588] }, { pose: 'bow', ms: 1200 }, { fn: (d) => srDrop(d) }, { pose: 'happy', ms: 1000 }, { fn: (d) => { d.lock = 0; } }];
    else x.q = [{ to: [to[0] + side * 110, to[1] + RINT(-10, 10)], fast: true, secs: 1.5 }, { pose: 'sit', ms: 1400, face }, { pose: 'happy', ms: 900, face }, { fn: (d) => { d.lock = 0; } }];
    x.until = 0; srBark(x, 'play');
  });
  function d0(x) { return x + (Math.random() - 0.5) * 120; }
}
function srGrab(x, kind) {
  const t = srS.toy; if (t && t.el) t.el.remove(); srS.toy = null; x.held = kind;
  const p = srPosEl(x); if (!p) return; const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'sr-held'); g.innerHTML = place(srToyArt(kind), -26, -26, 52, 52); p.appendChild(g); srHeld(x);
}
function srDrop(x) {
  const kind = x.held; dropHeld(x); if (!kind) return; srHearts(x, 2);
  const [hx, hy] = srHeadAt(x); say(PICK([`${x.name} brings the ${SR_TOY_N[kind]} back. Again! Again!`, `${x.name} drops the ${SR_TOY_N[kind]} at your feet. Very proud.`, `${x.name} fetched it. ${x.name} would like the applause now.`]), hx, hy - 10, 2600);
}

/* ---- adopt mode: the selected starter trots to the front ---- */
function srAdoptPick(key) { const i = dogsList().findIndex((d) => d.key === key); if (i < 0) return; if (i !== adoptIdx) { adoptIdx = i; adoptSex = null; } renderAdopt(); }
function srMeetShow(key) {
  if (srS.kind !== 'adopt') return; const host = $('#adoptDog'); if (!host) return;
  const old = srS.meet; if (old && old.key === key && host.firstElementChild) return;
  const now = performance.now(), mx = srMeetX(), info = dogInfo(key);
  if (old) { // the last one goes back to playing
    srHalt(old); host.innerHTML = ''; srS.meet = null;
    const rd = old.from; if (rd) { rd.fx = old.fx; rd.fy = Math.max(old.fy, SR_ROOM.floor[1]); rd.hidden = false; rd.pose = 'walk'; rd.face = old.face; rd.q = [{ to: srFreeSpot(rd) || [rd.fx - 160, rd.fy - 60] }, srRest(rd)]; rd.until = 0; rd.el.style.display = ''; rd.el.querySelector('.sr-art').innerHTML = srArtHTML(rd); srMove(rd, rd.fx, rd.fy, 0); }
  }
  const rd = srS.dogs.find((d) => d.key === key && !d.hidden);
  const m = { id: 'meet', key, name: info.name, months: 10, meet: true, from: rd || null, q: [], until: 0, taps: [] };
  if (rd) { srHalt(rd); srUnpair(rd); dropHeld(rd, true); rd.hidden = true; rd.q = []; rd.el.style.display = 'none'; m.fx = rd.fx; m.fy = rd.fy; m.sc = srScale(rd.fy); m.face = rd.face; m.pose = rd.pose; }
  else { const [x0] = srVis(); m.fx = Math.max(-140, x0 - 120); m.fy = 560; m.sc = 0.66; m.face = 'right'; m.pose = 'walk'; }
  host.innerHTML = srDogHTML(m, 'sr-meetdog'); m.el = host.firstElementChild; srS.meet = m; void getComputedStyle(srPosEl(m)).transform;
  const face = mx < m.fx - 4 ? 'left' : 'right';
  m.q = [{ to: [mx, SR_MEET[1]], sc: 1, pose: 'idle' }, { pose: 'idle', ms: 1800, face }, { pose: 'sit', ms: 2600, face }];
  if (rd && rd.pose === 'pet') m.q.unshift({ pose: 'pet', ms: 700 });
  srStep(m, now);
}

/* ---- entering a mode ---- */
function srRoomSVG() { return `<svg class="world sr-room" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">${sceneG(srSceneName())}<g id="srBoardG"></g><g id="srDogs"></g><g id="adoptDog"></g><g id="srFx"></g></svg>`; }
function srEnter(kind) {
  srStop(); srS.kind = kind; srS.art.clear(); srS.meet = null; srS.toy = null; srS.tossAt = -1e9;
  const svg = $('#view svg.world'); if (svg) { svg.addEventListener('click', srClick); svg.addEventListener('keydown', srKey); }
  srS.timer = setInterval(srTick, 120); onCleanup(() => { srStop(); stage.classList.remove('srmode'); });
}
// the room dogs (after the tray is in place, so the visible floor is known)
function srPopulate() {
  const specs = srS.kind === 'shelter' ? srRoster().slice(0, 6) : srStarters();
  const [lo, hi] = srRange(), n = specs.length, now = performance.now();
  srS.dogs = specs.map((sp, i) => {
    const x = Object.assign({}, sp, { _t: null, q: [], until: now + 300 + i * 420 + Math.random() * 600, taps: [], lock: 0, pal: null, cushion: null, held: null, hidden: false });
    x.fx = Math.round(lo + (hi - lo) * ((i + 0.5) / n) + (Math.random() - 0.5) * 40); x.fy = Math.round(SR_ROOM.floor[1] + 16 + ((i * 53) % 120)); x.face = Math.random() < 0.5 ? 'left' : 'right';
    x.pose = srAge(x) === 'senior' ? 'down' : srAge(x) === 'puppy' ? 'happy' : PICK(['sit', 'idle', 'sniff']); x.sc = null; return x;
  });
  const host = $('#srDogs'); if (!host) return;
  host.innerHTML = srS.dogs.slice().sort((a, b) => a.fy - b.fy).map((x) => srDogHTML(x)).join('');
  srS.dogs.forEach((x) => { x.el = host.querySelector(`[data-srdog="${CSS.escape(x.id)}"]`); });
}
function srStop() { clearInterval(srS.timer); srS.timer = 0; srS.kind = null; srS.dogs = []; srS.meet = null; srS.toy = null; }
function srClick(e) {
  const t = e.target; if (!srS.kind) return;
  const dg = t.closest('[data-srdog]'); if (dg) { srPet(dg.dataset.srdog); return; }
  if (t.closest('[data-hot="toys"]')) { srToss(); return; }
  const sl = t.closest('[data-srslot]'); if (sl && !isPhone()) { srBoardPick(sl.dataset.srslot); return; }
  if (t.closest('.sr-board')) srBoardOpen();
}
function srKey(e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-srdog],[data-srslot],.sr-board,[data-hot="toys"]')) { e.preventDefault(); srClick(e); } }
function srBoardPick(id) {
  SFX.click(); if (srS.kind === 'adopt') { srAdoptPick(id.replace(/^st_/, '')); return; }
  srMeet(id);
}
function srBoardOpen() {
  SFX.click(); if (srS.kind === 'shelter') { openShelterList(); return; }
  toast(isPhone() ? 'Everyone on the board is in the row of faces below. Tap a face to meet that dog.' : 'Everyone on the board is in the row of faces on the right. Tap a face to meet that dog.');
}
// 'shelter' mode (from the Map). Called by enterShelter (08_map.js).
function srEnterShelter() {
  setChrome(true, true); stage.classList.add('srmode');
  view.innerHTML = srRoomSVG() + '<div id="status"></div><button id="devBtn">dev</button>';
  dock.innerHTML = `<div class="tray mini sr-tray"><div class="tray-h"><h3>Paw Haven Shelter</h3></div><div class="sr-btns"><button class="btn go" id="srBoard">Adopt me board</button><button class="btn" id="srToss">Toss a toy</button><button class="btn" id="srHome">Go home</button></div></div>`;
  $('#srBoard').onclick = () => { SFX.click(); openShelterList(); };
  $('#srToss').onclick = () => srToss();
  $('#srHome').onclick = () => { SFX.click(); S.place = 'yard'; go('yard'); };
  srEnter('shelter'); srDrawBoard(); srPopulate();
  if (S.shelter && !S.shelter.seen) { S.shelter.seen = localISO(); markDirty(); setTimeout(() => { if (cur.mode === 'shelter') toast('The shelter has a playroom now. Tap a dog to say hello, or the board to see who is looking for a home.', 'gold'); }, 500); }
  setTimeout(() => { if (cur.mode !== 'shelter' || !modal.hidden || !srS.dogs.length) return; const x = PICK(srS.dogs.filter((d) => d.pose !== 'sleep')) || srS.dogs[0]; srBark(x, 'woof'); const [hx, hy] = srHeadAt(x); say(PICK(NPC_JOKES), hx, hy - 10); }, 1100);
  updateHUD(); bindDev();
}
// 'adopt' mode (a new game). Called by enterAdopt (02_adoption.js) around renderAdopt: the room first, then the tray, then the dogs.
function srEnterAdopt() { view.innerHTML = srRoomSVG(); srEnter('adopt'); srDrawBoard(); }

/* ---- the Meet card ---- */
function srMeet(id, back) {
  const sp = srRoster().find((x) => x.id === id); if (!sp) { nope('That dog just went home with someone. Lucky dog, and lucky someone.'); return null; }
  SFX.click(); const info = dogInfo(sp.key), bl = adoptBlock(), tip = typeof bdTip === 'function' ? bdTip(sp.key) : '';
  const p = openModal(`${esc(sp.name)} ${sexSym(sp.sex)}`, `<div class="sr-mtop"><span class="sr-mdog" id="srMeetDog">${srArt(sp, 'sit', 'right')}</span><span class="sr-mfx" aria-hidden="true"></span></div>
    <div class="sr-minfo"><p class="sr-mline"><b>${esc(info.breed)}</b> · ${sp.sex === 'female' ? 'Girl' : 'Boy'} · ${esc(ageText(sp.months))}</p><p class="sr-trait">${esc(sp.trait || srTrait(sp.id))}</p>
    ${sp.key === 'mutt' ? '' : `<p class="small">Loves: ${esc(favLine(sp.key))}</p>`}${tip ? `<p class="small bd-tip">${esc(tip)}</p>` : ''}
    <p class="sr-block small" ${bl ? '' : 'hidden'}>${esc(bl)} ${esc(sp.name)} stays happy here in the meantime, with cushions, toys and belly rubs every day.</p></div>`,
  { cls: 'sr-meet', foot: `<button class="btn no" id="srBack">Back</button><button class="btn" id="srMeetPet">Pet</button><button class="btn ${bl ? '' : 'yes big'}" id="srAdopt"${bl ? ' aria-disabled="true"' : ''}>Adopt ${esc(sp.name)}</button>` });
  $('#srBack', p).onclick = () => { SFX.click(); if (back) back(); else openShelterList(); };
  let pt = 0; $('#srMeetPet', p).onclick = () => {
    const el = $('#srMeetDog', p), fx = $('.sr-mfx', p); if (!el) return; clearTimeout(pt); srBark(sp, 'play'); SFX.boop(700); srS.pets++;
    el.innerHTML = srArt(sp, 'pet', 'right'); if (fx) { fx.innerHTML = '<i>♥</i><i>♥</i><i>♥</i>'; }
    pt = setTimeout(() => { if (!el.isConnected) return; el.innerHTML = srArt(sp, 'rollover', 'right'); srS.bellies++; if (fx) fx.innerHTML = '<i>♥</i><i>♥</i><i>♥</i><i>♥</i><b>Belly rub!</b>'; pt = setTimeout(() => { if (el.isConnected) { el.innerHTML = srArt(sp, 'sit', 'right'); if (fx) fx.innerHTML = ''; } }, 2000); }, 900);
  };
  $('#srAdopt', p).onclick = () => { const b2 = adoptBlock(); if (b2) { nope(b2); const n = $('.sr-block', p); if (n) n.hidden = false; return; } srAdoptFlow(sp, sp.kind, () => srMeet(id, back)); };
  return p;
}
// the naming step and the adoption itself (the v2.6 path). Free, always.
function srAdoptFlow(spec, kind, back) {
  const bl = adoptBlock(); if (bl) { nope(bl); return false; }
  const def = kind === 'starter' ? dogInfo(spec.key).name : spec.name;
  const pp = openModal(`Name your new ${spec.sex === 'female' ? 'girl' : 'boy'} ${sexSym(spec.sex)}`, `<p>${kind === 'starter' ? 'The tag says' : 'The shelter calls this one'} <b>${esc(def)}</b>. Keep it, or pick something just as silly.</p><input id="shName" class="namebox" maxlength="16" value="${esc(def)}" aria-label="Name" autofocus>`, { foot: '<button class="btn no" id="shNo">Back</button><button class="btn yes big" id="shOk">Bring home!</button>' });
  const done = () => {
    if (adoptBlock()) return; const nm = ($('#shName', pp).value || def).trim().slice(0, 16) || def; const d = addDog(spec, nm);
    if ((kind === 'rescue' || kind === 'resident') && S.shelter && !S.shelter.adopted.includes(spec.id)) S.shelter.adopted.push(spec.id);
    trackAct('adopt', { id: d.id, key: d.key, kind });
    closeModal(); audioCue('adopt'); SFX.fanfare();
    const pd = PRd(d); toast(`${nm} is home! ${pd.He} sniffs everything twice. ${S.dogs.length} dogs now.`, 'gold');
    S.place = 'yard'; go('yard');
  };
  $('#shOk', pp).onclick = done; $('#shNo', pp).onclick = () => { SFX.click(); if (back) back(); else openShelterList(); };
  $('#shName', pp).addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
  return true;
}

function srExpose() {
  if (!window.__paw) return;
  // list(): the "Looking for a home" sheet, roster(): today's roster, meet(id): the Meet card, toss(): toss a toy, pet(id): pet a room dog,
  // dogs(): the room dogs { id, key, pose, x, y }, st(): counters (pets, belly rubs, fetches, the last fetch)
  window.__paw.sr = {
    list: () => openShelterList(), roster: (dk) => srRoster(dk).map((x) => ({ id: x.id, key: x.key, sex: x.sex, months: x.months, name: x.name, kind: x.kind, trait: x.trait, genes: x.genes })), room: SR_ROOM, slots: SR_SLOTS,
    meet: (id) => srMeet(id), toss: () => srToss(), pet: (id) => srPet(id), starters: (dk) => srStarters(dk).map((x) => x.key),
    dogs: () => srS.dogs.concat(srS.meet ? [srS.meet] : []).filter((x) => !x.hidden).map((x) => ({ id: x.id, key: x.key, name: x.name, pose: x.pose, x: Math.round(x.fx), y: Math.round(x.fy), meet: !!x.meet, held: x.held || null, lock: !!x.lock })),
    st: () => ({ kind: srS.kind, pets: srS.pets, bellies: srS.bellies, fetches: srS.fetches, lastFetch: srS.lastFetch, lastPet: srS.lastPet, toy: srS.toy ? srS.toy.kind : null, ready: performance.now() - srS.tossAt >= 6000, board: srBoardBox(), vis: srVis().map(Math.round), range: srRange().map(Math.round) })
  };
}
on('game:ready', () => setTimeout(srExpose, 0));
setTimeout(srExpose, 0);
