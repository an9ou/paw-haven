/* ======================= v2.7 SHELTER lane (tag sr): the Shelter Playroom. See V27.md sections 1 and 7 =======================
   The SHELTER lane owns this file (and css/33_shelter.css). This is the coordinator's stub: the room layout, the board slots, the resident names and
   traits and the roster are final here, so the art lane, the SHELTER lane and the tests agree on them. The playroom itself is the SHELTER lane's. */

// the playroom scene (PawArt.scene('playroom'), 1000 x 600, world_c). Boxes are [x, y, w, h] in world units, points are [x, y].
const SR_ROOM = {
  sign: [370, 10, 260, 64], // painted "Doodle Doggo Shelter" sign (art)
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

/* ---------------- the playroom (V27.md section 7) ---------------- */
const SR_MEET = [500, 592]; // the meet spot at the front (adopt mode): feet x, y, scale 1
const SR_TOYS = ['ball', 'bone', 'ring'];
const SR_LINES = {
  pet: ['Happy wiggle.', 'Ears go floppy.', 'Leans right into it.', 'Tail at full speed.', 'More please.', 'A very small happy grumble.'],
  belly: ['Belly rub!', 'Belly rub! Legs everywhere.', 'Belly rub! Pure bliss.'],
  fetch: ['Got it!', 'Mine. Thank you.', 'Look what I found!'],
  late: ['So close.', 'Next time.', 'Fine. Sniffing instead.']
};
let SR = null; // the live room: { mode, gen, dogs, timers, tossAt, toy, meet, lastFetch, lineAt }
const srScale = (fy) => 0.5 + (fy - 450) / 146 * 0.22;
const srMotion = () => document.documentElement.dataset.motion !== 'off';
function srAfter(ms, fn, rd) {
  if (!SR) return 0; const g = SR.gen;
  const id = setTimeout(() => { if (SR && SR.gen === g) fn(); }, Math.max(0, ms));
  SR.timers.push(id); if (rd) { clearTimeout(rd.t); rd.t = id; } return id;
}
// a dog-like record the art and the voices understand: id, key, genes and a birthday from the age in months (1 real day = 1 dog month)
function srLook(x) { return { id: x.id, key: x.key, genes: x.genes || null, born: bornDaysAgo(x.months == null ? 10 : x.months), name: x.name }; }
function srStage(m) { const st = lifeStage(m); return st === 'young' ? 'adult' : st; }
function srStarters() {
  const r = seeded(hashId('starters|' + localISO())), keys = dogsList().map((d) => d.key);
  for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
  return keys.slice(0, 6);
}
function srStarterLook(key) { const g = STARTER_GENES[key] || STARTER_GENES.mutt; return { id: 'tmp_' + key, key, genes: { B: g.B, D: g.D, E: g.E, S: g.S, M: g.M, Bl: g.Bl }, born: bornDaysAgo(10), name: dogInfo(key).name }; }
// who lives in the room right now
function srRoomList(mode) {
  if (mode === 'adopt') return srStarters().map((k) => ({ id: 'st_' + k, key: k, name: dogInfo(k).name, kind: 'starter', months: 10, look: srStarterLook(k) }));
  return srRoster().map((x) => Object.assign({}, x, { look: srLook(x) }));
}
// what the board lists: shelter mode the roster, adopt mode the 14 starters
function srBoardList(mode) {
  if (mode === 'adopt') return dogsList().map((d) => ({ id: d.key, key: d.key, name: d.name, look: srStarterLook(d.key) }));
  return srRoster().map((x) => ({ id: x.id, key: x.key, name: x.name, look: srLook(x) }));
}

/* ---- camera: the room fits the screen (V27.md section 7, as built: the board stays whole on desktop, the floor stays above the phone tray) ---- */
function srView() {
  const svg = $('#view > svg.world'); if (!svg || !SR) return null;
  const vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect(), v = view.getBoundingClientRect();
  const k = r.width / vb.width, x0 = vb.x + (Math.max(r.left, v.left) - r.left) / k, x1 = vb.x + (Math.min(r.right, v.right) - r.left) / k;
  const y0 = vb.y + (Math.max(r.top, v.top) - r.top) / k, y1 = vb.y + (Math.min(r.bottom, v.bottom) - r.top) / k;
  // the dock tray covers part of the room: room dogs keep out of it
  const avoid = []; const tr = dock.querySelector('.tray'); if (tr && dock.offsetParent !== null) { const t = tr.getBoundingClientRect(); if (t.width && t.height) avoid.push([vb.x + (t.left - r.left) / k, vb.y + (t.top - r.top) / k, vb.x + (t.right - r.left) / k, vb.y + (t.bottom - r.top) / k]); }
  return { x0, x1, y0, y1: Math.min(y1, 600), k, avoid };
}
function srCam() {
  const svg = $('#view > svg.world'); if (!svg || !SR) return;
  const W = svg.clientWidth || view.clientWidth, H = svg.clientHeight || view.clientHeight; if (!W || !H) return;
  let usable = H;
  if (isPhone() && SR.mode === 'shelter') { const tr = dock.querySelector('.sr-tray'); if (tr) { const t = tr.getBoundingClientRect(), r = svg.getBoundingClientRect(); if (t.top > r.top && t.top < r.bottom) usable = t.top - r.top; } }
  let x, y, w, h;
  if (W / usable >= 1000 / 600) { // wide: full width, crop the height, keep the board whole (from y 78) and as much floor as fits
    w = 1000; h = H * 1000 / W; const vis = usable * 1000 / W; y = clamp(600 - vis, 0, SR.mode === 'adopt' ? 600 : 78); x = 0;
  } else { // tall: full height above the tray, crop the sides around the board's middle
    const s = usable / 600; w = W / s; h = H / s; x = clamp(500 - w / 2, 0, Math.max(0, 1000 - w)); y = 0; if (w > 1000) x = (1000 - w) / 2;
  }
  svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
}

/* ---- drawing ---- */
function srHasArt(name, vb) { const s = artReal('prop', name, name === 'adoptboard' ? { n: 1 } : { kind: 'ball' }); return !!s && s.includes(`viewBox="${vb}"`); }
function srBoardFallback(n, more) { // until the art merges: a cork board with paper posters at SR_SLOTS
  const ps = SR_SLOTS.slice(0, n).map(([x, y, w, h]) => `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 16}" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2"/><circle cx="${x + w / 2}" cy="${y - 4}" r="4" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.5"/>`).join('');
  return `<svg viewBox="0 0 300 220"><rect x="4" y="4" width="292" height="212" rx="8" fill="#D9A86C" stroke="#5B3D32" stroke-width="4"/><text x="150" y="38" text-anchor="middle" font-family="Caveat, cursive" font-size="30" fill="#5B3D32">Adopt me!</text>${more ? `<text x="270" y="30" text-anchor="middle" font-family="Caveat, cursive" font-size="18" fill="#5B3D32">+${more}</text>` : ''}${ps}</svg>`;
}
function srBoardSVG() {
  const L = srBoardList(SR.mode), n = Math.min(8, L.length), more = Math.max(0, L.length - 8), [bx, by, bw, bh] = SR_ROOM.board;
  const slots = Array.isArray(PA().ADOPT_SLOTS) && PA().ADOPT_SLOTS.length >= 8 ? PA().ADOPT_SLOTS : SR_SLOTS;
  const board = propTint(srHasArt('adoptboard', '0 0 300 220') ? art('prop', 'adoptboard', { n, more }) : srBoardFallback(n, more), false, true); // the room's indoor time tint (the heads stay untinted, like the dogs)
  const heads = L.slice(0, n).map((x, i) => {
    const [sx, sy, sw, sh] = slots[i], z = Math.min(sw, sh) - 2;
    return `<g class="sr-slot" data-srslot="${esc(x.id)}" aria-label="${esc(x.name)}"><rect x="${bx + sx}" y="${by + sy}" width="${sw}" height="${sh}" fill="transparent"/>${place(headSVG(x.look), bx + sx + (sw - z) / 2, by + sy + (sh - z) / 2, z, z)}</g>`;
  }).join('');
  return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="transparent"/>${place(board, bx, by, bw, bh)}${heads}`;
}
function srDogArt(rd) { return place(dogSVG(rd.look, { pose: rd.pose, facing: rd.face }), -DW / 2, -DH * 205 / 220, DW, DH); }
function srXform(x, y, s) { return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`; }
function srHitBox() { // dog units: at least 52 px on a phone at the smallest room scale (0.5)
  const svg = $('#view > svg.world'); let m = 0; if (isPhone() && svg) { const vb = svg.viewBox.baseVal, k = svg.clientWidth / vb.width; if (k > 0) m = 52 / (k * 0.5); }
  const w = Math.max(210, m), h = Math.max(190, m); return [-w / 2, 10 - h, w, h];
}
function srDogG(rd) {
  const [hx, hy, hw, hh] = srHitBox();
  return `<g class="sr-dog hot" data-srdog="${esc(rd.id)}" role="button" tabindex="0" aria-label="${esc(rd.name)} the ${esc(dogInfo(rd.key).breed)}: tap to pet" style="transform:${srXform(rd.x, rd.y, srScale(rd.y))}"><rect class="sr-hit" x="${hx.toFixed(1)}" y="${hy.toFixed(1)}" width="${hw.toFixed(1)}" height="${hh.toFixed(1)}" fill="transparent"/><g class="sr-art">${srDogArt(rd)}</g></g>`;
}
const srNode = (rd) => $(`#srDogs [data-srdog="${rd.id}"]`);
function srPose(rd, pose, face) {
  rd.pose = pose; if (face) rd.face = face; const n = srNode(rd); if (!n) return;
  const a = n.querySelector('.sr-art'); if (a) a.innerHTML = srDogArt(rd);
}
// keep feet-y order: move only this (resting) dog's node, so the others' walks are not restarted
function srOrder(rd) {
  const g = $('#srDogs'), n = srNode(rd); if (!g || !n) return;
  const after = [...g.children].find((c) => { if (c === n) return false; const o = SR.dogs.find((d) => d.id === c.dataset.srdog); return o && o.y > rd.y; });
  if (after) { if (n.nextSibling !== after) g.insertBefore(n, after); } else if (g.lastChild !== n) g.appendChild(n);
}
function srRoomSVG(mode) {
  const sc = PA().WORLD_C_SCENES && PA().WORLD_C_SCENES.includes('playroom') ? 'playroom' : 'shelter';
  return `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">${sceneG(sc)}<g id="srBoardG" class="hot" role="button" tabindex="0" aria-label="Adopt me board: see who is looking for a home"></g><g id="srDogs"></g><g id="adoptDog"></g><g id="srFx" pointer-events="none"></g></svg>`;
}

/* ---- floor spots ---- */
function srSpotOk(x, y, me, V) {
  const s = srScale(y), box = [x - 110 * s, y - 180 * s, x + 110 * s, y];
  if (V) { if (box[0] < V.x0 + 4 || box[2] > V.x1 - 4 || y > V.y1 - 4) return false;
    for (const a of V.avoid) { const ix = Math.min(box[2], a[2]) - Math.max(box[0], a[0]), iy = Math.min(box[3], a[3]) - Math.max(box[1], a[1]); if (ix > 0 && iy > 0 && ix * iy > (box[2] - box[0]) * (box[3] - box[1]) * 0.2) return false; } }
  if (SR.mode === 'adopt' && box[2] > SR_MEET[0] - 125 && box[0] < SR_MEET[0] + 125 && box[1] < SR_MEET[1] && box[3] > SR_MEET[1] - 195) return false; // the meet dog's whole body stays clear
  // no two dogs drawn over each other: the art boxes may touch, not cover (a dog further back counts too, not only one in the same row)
  return SR.dogs.every((o) => { if (o === me || o.away) return true; const so = srScale(o.ty);
    return Math.abs(o.tx - x) > 120 * (s + so) || Math.abs(o.ty - y) > 46 && Math.abs(o.tx - x) > 70 * (s + so) || Math.abs(o.ty - y) > 150 * Math.max(s, so); });
}
function srSpot(me, near, strict) {
  const V = srView(), F = SR_ROOM.floor, x0 = Math.max(F[0] + 30, V ? V.x0 + 60 : 0), x1 = Math.min(F[2] - 30, V ? V.x1 - 60 : 1000), y1 = Math.min(F[3] - 4, V ? V.y1 - 6 : 600);
  for (let i = 0; i < 40; i++) {
    let x = x0 + Math.random() * Math.max(1, x1 - x0), y = F[1] + 8 + Math.random() * Math.max(1, y1 - F[1] - 8);
    if (near) { x = clamp(near[0] + (Math.random() - 0.5) * 260, x0, x1); y = clamp(near[1] + (Math.random() - 0.5) * 70, F[1] + 8, y1); }
    if (srSpotOk(x, y, me, V)) return [Math.round(x), Math.round(y)];
  }
  if (strict) return null;
  return [Math.round(clamp(me ? me.x : 500, x0, x1)), Math.round(clamp(me ? me.y : 500, F[1] + 8, y1))];
}
// walk to a free spot; when the crop has none (a phone with a meet dog up front), the dog trots out to the back room
function srGo(rd) {
  const sp = srSpot(rd, null, true); if (sp) return srWalk(rd, sp, () => srRestPose(rd));
  const V = srView(), out = V && rd.x - V.x0 < V.x1 - rd.x ? (V ? V.x0 : 0) - 140 : (V ? V.x1 : 1000) + 140;
  rd.busy = rd.away = rd.leaving = true; srWalk(rd, [out, rd.y], () => { rd.busy = rd.leaving = false; rd.parked = true; const n = srNode(rd); if (n) n.style.display = 'none'; }, 260);
}
// a dog from the back room comes in from the nearer side when a spot is free again
function srUnpark() {
  const rd = SR && SR.dogs.find((d) => d.parked && !(SR.meet && SR.meet.key === d.key)); if (!rd) return; const sp = srSpot(rd, null, true); if (!sp) return;
  const V = srView(), fromX = V && sp[0] - V.x0 < V.x1 - sp[0] ? V.x0 - 140 : (V ? V.x1 : 1000) + 140;
  rd.parked = rd.away = rd.busy = rd.leaving = false; rd.x = rd.tx = fromX; rd.y = rd.ty = sp[1];
  const n = srNode(rd); if (n) { n.style.transition = 'none'; n.style.transform = srXform(fromX, sp[1], srScale(sp[1])); n.style.display = ''; void n.getBoundingClientRect(); }
  srOrder(rd); srWalk(rd, sp, () => srRestPose(rd));
}
function srCushion(me) {
  const V = srView();
  const free = SR_ROOM.cushions.map((c, i) => ({ c, i })).filter(({ c, i }) => !SR.dogs.some((o) => o !== me && o.cushion === i) && (!V || (c[0] > V.x0 + 70 && c[0] < V.x1 - 70 && c[1] < V.y1 + 10 && !V.avoid.some((a) => c[0] > a[0] - 60 && c[0] < a[2] + 60 && c[1] > a[1] - 20))) && srSpotOk(c[0], c[1] - 4, me, V));
  return free.length ? PICK(free) : null;
}

/* ---- life ---- */
function srWalk(rd, to, then, speed) {
  const [x, y] = to, dist = Math.hypot(x - rd.x, y - rd.y);
  const secs = clamp(dist / (speed || (rd.stage === 'senior' ? 140 : rd.stage === 'puppy' ? 230 : 190)), speed ? 0.4 : 1.2, 2.5);
  rd.tx = x; rd.ty = y; rd.walking = true;
  srPose(rd, 'walk', x < rd.x ? 'left' : x > rd.x ? 'right' : rd.face);
  const n = srNode(rd);
  if (n) { n.style.transition = srMotion() ? `transform ${secs}s linear` : 'none'; n.style.transform = srXform(x, y, srScale(y)); }
  rd.x = x; rd.y = y;
  srAfter(secs * 1000, () => { rd.walking = false; srOrder(rd); then(); }, rd);
}
function srRest(rd, pose, ms, then) { srPose(rd, pose); srAfter(ms, then || (() => srNext(rd)), rd); }
function srNext(rd) {
  if (!SR || rd.away) return; rd.busy = false; rd.cushion = null; rd.mate = null; srUnpark();
  const st = rd.stage, r = Math.random();
  const W = st === 'puppy' ? [0.4, 0.3, 0.1] : st === 'senior' ? [0.35, 0.05, 0.3] : [0.5, 0.15, 0.15]; // walk, play, nap; the rest: rest in place
  if (r < W[0]) return srWalk(rd, srSpot(rd), () => srRestPose(rd));
  if (r < W[0] + W[1] && srPlay(rd)) return;
  if (r < W[0] + W[1] + W[2]) { const cu = srCushion(rd); if (cu) { rd.cushion = cu.i; return srWalk(rd, [cu.c[0] + (Math.random() - 0.5) * 30, cu.c[1] - 4], () => { srPose(rd, 'sleep', 'right'); srAfter(RINT(8000, 15000) * (st === 'senior' ? 1.3 : 1), () => { rd.cushion = null; srRest(rd, 'yawn', 1400); }, rd); }); } }
  srRestPose(rd);
}
function srRestPose(rd) {
  const P = rd.stage === 'puppy' ? ['idle', 'sit', 'happy', 'jump', 'sniff', 'scratch'] : rd.stage === 'senior' ? ['down', 'down', 'sit', 'idle', 'yawn', 'sniff'] : ['idle', 'sit', 'down', 'sniff', 'scratch', 'yawn'];
  srRest(rd, PICK(P), RINT(2000, 6000) * (rd.stage === 'senior' ? 1.3 : 1));
}
function srPlay(a) {
  const b = PICK(SR.dogs.filter((o) => o !== a && !o.away && !o.busy && !o.walking && o.pose !== 'sleep')); if (!b) return false;
  const V = srView(), lo = (V ? V.x0 : 0) + 110, hi = (V ? V.x1 : 1000) - 110;
  const sp = srSpot(a, [clamp((a.x + b.x) / 2, lo + 70, hi - 70), (a.y + b.y) / 2], true); if (!sp) return false;
  const [px, py] = sp, ax = clamp(px - 70, lo, hi - 140), bx = ax + 140;
  if (!srSpotOk(ax, py, a, V) || !srSpotOk(bx, py, b, V)) return false; // no play date on top of another dog (or the meet dog)
  a.busy = b.busy = true; clearTimeout(b.t); a.mate = b.id; b.mate = a.id;
  let arrived = 0;
  const both = () => { if (++arrived < 2) return;
    srPose(a, 'bow', 'right'); srPose(b, 'bow', 'left');
    srAfter(1300, () => { const pp = (d) => (d.stage === 'puppy' ? PICK(['jump', 'happy']) : 'happy'); srPose(a, pp(a)); srPose(b, pp(b)); srHearts((ax + bx) / 2, py - 130 * srScale(py), 2);
      srAfter(2200, () => { srNext(a); srNext(b); }, a); }, a); };
  srWalk(a, [ax, py], () => { srPose(a, 'idle', 'right'); both(); });
  srWalk(b, [bx, py + RINT(-6, 6)], () => { srPose(b, 'idle', 'left'); both(); });
  return true;
}
// stop whatever the dog is doing, right where it is (mid-walk too)
function srHalt(rd) {
  clearTimeout(rd.t); const n = srNode(rd);
  if (rd.walking && n) { try { const m = new DOMMatrix(getComputedStyle(n).transform); rd.x = m.e; rd.y = m.f; } catch (e) { /* keep the target */ } n.style.transition = 'none'; n.style.transform = srXform(rd.x, rd.y, srScale(rd.y)); }
  rd.walking = false; rd.tx = rd.x; rd.ty = rd.y; rd.cushion = null;
  const mate = SR.dogs.find((o) => o !== rd && o.busy && o.mate === rd.id); if (mate) srNext(mate);
}

/* ---- hearts and lines ---- */
function srHearts(x, y, n) {
  const fx = $('#srFx'); if (!fx) return;
  for (let i = 0; i < n; i++) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'sr-heart');
    g.setAttribute('transform', `translate(${(x + (i - (n - 1) / 2) * 26 + (Math.random() - 0.5) * 10).toFixed(1)} ${(y - Math.random() * 14).toFixed(1)})`);
    g.innerHTML = `<g style="animation-delay:${i * 90}ms">${doodle('heart', 0, 0, 0.9 + Math.random() * 0.4)}</g>`; fx.appendChild(g);
    setTimeout(() => g.remove(), 1500);
  }
}
// v2.7 phone review: on phones a room dog's line (and the meet dog's) starts below the Adopt me board's bottom edge, so it never covers the board
function srSay(text, x, y, ms) {
  say(text, x, y, ms); if (!isPhone() || bubble.hidden) return;
  const svg = $('svg.world', view); if (!svg) return;
  const b = Math.round(worldToStage(svg, 0, SR_ROOM.board[1] + SR_ROOM.board[3]).y + 4); if ((parseFloat(bubble.style.top) || 0) < b) bubble.style.top = b + 'px';
}
function srLine(rd, list, force) {
  if (!force && (performance.now() - (SR.lineAt || 0) < 5000 || Math.random() > 0.35)) return;
  SR.lineAt = performance.now(); srSay(`${rd.name}: ${PICK(list)}`, rd.x, rd.y - 170 * srScale(rd.y), 2400);
}
function srBark(rd, kind) { if (barkMode() === 'off') return; playBark(voiceOf(rd.look), kind, { volume: 0.8 }); const bl = window.__barkLog; bl.push({ dog: rd.name, id: rd.id, kind, t: Math.round(performance.now()), room: true }); if (bl.length > 300) bl.shift(); }

/* ---- pet and belly rub ---- */
function srPet(id) {
  const rd = SR && SR.dogs.find((d) => d.id === id && !d.away); if (!rd) return false;
  srHalt(rd); rd.busy = true; rd.mate = null;
  if (SR.mode === 'adopt') { // a pet, then this dog comes to the front to say hello (V27.md section 7: a tap also selects it)
    srPose(rd, 'pet'); srHearts(rd.x, rd.y - 150 * srScale(rd.y), 2); srBark(rd, 'play'); SFX.boop(760); SR.pets = (SR.pets || 0) + 1;
    srAfter(700, () => { if (!rd.away) srSelectKey(rd.key, rd); }); return true; // (not on rd.t: a play partner's timers must not cancel the hello)
  }
  const now = performance.now(); rd.taps = (rd.taps || []).filter((t) => now - t < 4000); rd.taps.push(now);
  const hy = rd.y - 150 * srScale(rd.y);
  if (rd.taps.length >= 3) { // the third tap within 4 s: a belly rub
    rd.taps = []; srPose(rd, 'rollover'); srHearts(rd.x, hy + 30, 5); srBark(rd, 'play'); SFX.boop(880); srLine(rd, SR_LINES.belly, true);
    SR.bellies = (SR.bellies || 0) + 1; srAfter(2000, () => srRest(rd, 'happy', 1200), rd); return true;
  }
  srPose(rd, 'pet'); srHearts(rd.x, hy, 2); srBark(rd, PICK(['play', 'woof'])); SFX.boop(700 + Math.random() * 160); srLine(rd, SR_LINES.pet);
  SR.pets = (SR.pets || 0) + 1; srAfter(900, () => srRest(rd, 'happy', 1300), rd); return true;
}

/* ---- toss a toy ---- */
const SR_BASKET = [870, 396];
function srToyArt(kind) { return propTint(srHasArt('tosstoy', '0 0 60 60') ? art('prop', 'tosstoy', { kind }) : `<svg viewBox="0 0 60 60"><circle cx="30" cy="32" r="18" fill="#F28FA5" stroke="#5B3D32" stroke-width="3"/><path d="M14 30 Q30 22 46 30" fill="none" stroke="#FFE3A1" stroke-width="5"/></svg>`, false, true); }
function srToss() {
  if (!SR) return false; const now = performance.now();
  if (SR.toy || now - (SR.tossAt || -1e9) < 6000) { toast('One toy at a time. The dogs are still busy with the last one.', 'good'); return false; }
  SR.tossAt = now; const kind = PICK(SR_TOYS), [tx, ty] = srSpot(null), fx = $('#srFx'); if (!fx) return false;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'sr-toy'); g.innerHTML = place(srToyArt(kind), -24, -40, 48, 48);
  fx.appendChild(g); SR.toy = { el: g, x: tx, y: ty, kind }; SFX.whoosh();
  const land = () => { if (!SR || !SR.toy || SR.toy.el !== g) return; g.setAttribute('transform', `translate(${tx} ${ty})`); SFX.squeak(); srFetch(); };
  if (!srMotion()) { land(); return true; }
  const [sx, sy] = SR_BASKET, t0 = performance.now(), dur = 900, peak = Math.min(sy, ty) - 150;
  const step = (t) => { if (!SR || !SR.toy || SR.toy.el !== g) return; const k = Math.min(1, (t - t0) / dur), x = sx + (tx - sx) * k, y = (1 - k) * (1 - k) * sy + 2 * (1 - k) * k * peak + k * k * ty;
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(k * 540).toFixed(0)})`); if (k < 1) requestAnimationFrame(step); else land(); };
  g.setAttribute('transform', `translate(${sx} ${sy})`); requestAnimationFrame(step); return true;
}
function srFetch() {
  const T = SR.toy, awake = SR.dogs.filter((d) => !d.away && d.pose !== 'sleep' && d.pose !== 'rollover');
  if (!awake.length) { srAfter(4000, () => { if (SR.toy === T) { T.el.remove(); SR.toy = null; } }); toast('Everyone is napping. The toy can wait.', 'good'); return; }
  const run = awake.sort((a, b) => Math.hypot(a.x - T.x, a.y - T.y) - Math.hypot(b.x - T.x, b.y - T.y)).slice(0, Math.random() < 0.6 ? 2 : 1);
  run.forEach((rd) => { srHalt(rd); rd.busy = true; });
  const [first] = run.map((rd) => [rd, Math.hypot(rd.x - T.x, rd.y - T.y)]).sort((a, b) => a[1] - b[1])[0];
  run.forEach((rd, i) => {
    const off = rd === first ? 0 : (rd.x < T.x ? -90 : 90);
    srWalk(rd, [T.x + off - (rd.x < T.x ? 30 : -30), T.y + (rd === first ? 0 : RINT(-10, 10))], () => {
      if (rd === first) {
        if (SR.toy === T) { T.el.remove(); SR.toy = null; }
        SR.lastFetch = { id: rd.id, at: Date.now() }; srBark(rd, 'play'); srLine(rd, SR_LINES.fetch, true);
        const V = srView(), fy = Math.min(SR_ROOM.floor[3] - 8, V ? V.y1 - 8 : 590), fxp = clamp(rd.x + (500 - rd.x) * 0.3, V ? V.x0 + 90 : 90, V ? V.x1 - 90 : 910);
        srPose(rd, 'happy'); srAfter(500, () => srWalk(rd, srSpotOk(fxp, fy, rd, V) ? [fxp, fy] : srSpot(rd, [fxp, fy]), () => { srPose(rd, 'bow'); srHearts(rd.x, rd.y - 120 * srScale(rd.y), 3); srAfter(1600, () => srRest(rd, 'happy', 1200), rd); }, 200), rd);
      } else { srPose(rd, PICK(['sit', 'sniff'])); srLine(rd, SR_LINES.late); srAfter(1800, () => srNext(rd), rd); }
    }, 300 + i * 40);
  });
}

/* ---- adopt mode: the selected starter trots to the meet spot ---- */
function srMeetSVG(key, pose, face) { const L = srStarterLook(key); return place(dogSVG(L, { pose, facing: face || 'right' }), -DW / 2, -DH * 205 / 220, DW, DH); }
function srPetMeet() {
  if (!SR || !SR.meet) return; const key = SR.meet.key, m = $('#adoptDog .sr-meetdog'); if (!m) return;
  const now = performance.now(); SR.meet.taps = (SR.meet.taps || []).filter((t) => now - t < 4000); SR.meet.taps.push(now);
  const belly = SR.meet.taps.length >= 3; if (belly) SR.meet.taps = [];
  m.innerHTML = srMeetSVG(key, belly ? 'rollover' : 'pet', 'right'); srHearts(SR_MEET[0] + 20, SR_MEET[1] - 190, belly ? 5 : 2); SFX.boop(belly ? 880 : 720);
  playBark(voiceOf(srStarterLook(key)), 'play', { volume: 0.8 }); SR.pets = (SR.pets || 0) + 1; if (belly) { SR.bellies = (SR.bellies || 0) + 1; srSay(PICK(SR_LINES.belly), SR_MEET[0] + 40, SR_MEET[1] - 200, 2200); }
  clearTimeout(SR.meet.t); SR.meet.t = srAfter(belly ? 2000 : 900, () => { if (SR.meet && SR.meet.key === key && m.isConnected) m.innerHTML = srMeetSVG(key, 'happy', 'right'); });
}
function srSelectKey(key, fromRd) {
  const i = dogsList().findIndex((d) => d.key === key); if (i < 0) return;
  if (adoptIdx !== i) { adoptIdx = i; adoptSex = null; } renderAdopt(fromRd ? undefined : true);
}
function srMeetShow(key) {
  if (!SR || SR.mode !== 'adopt') return; const g = $('#adoptDog'); if (!g) return;
  if (SR.meet && SR.meet.key === key) return;
  const prev = SR.meet; SR.meet = { key };
  // the old meet dog: a room dog goes back to the room, anyone else trots off
  if (prev) { const back = SR.dogs.find((d) => d.key === prev.key); if (back) { back.away = back.parked = back.leaving = false; back.x = SR_MEET[0]; back.y = SR_MEET[1]; const n = srNode(back); if (n) { n.style.display = ''; n.style.transition = 'none'; n.style.transform = `translate(${SR_MEET[0]}px, ${SR_MEET[1]}px) scale(1)`; void n.getBoundingClientRect(); } srGo(back); } }
  const rd = SR.dogs.find((d) => d.key === key && !d.away);
  let from = null;
  if (rd) { srHalt(rd); from = [rd.x, rd.y, srScale(rd.y)]; rd.away = true; rd.busy = true; const n = srNode(rd); if (n) n.style.display = 'none'; }
  else if (prev) { const V = srView(); from = [V && SR_MEET[0] - (V.x0) < (V.x1) - SR_MEET[0] ? (V ? V.x0 : 0) - 100 : (V ? V.x1 : 1000) + 100, SR_MEET[1], 1]; }
  const face = from && from[0] > SR_MEET[0] ? 'left' : 'right';
  g.innerHTML = `<g class="sr-meetdog" style="transform:${from ? srXform(from[0], from[1], from[2]) : srXform(SR_MEET[0], SR_MEET[1], 1)}">${srMeetSVG(key, from ? 'walk' : 'idle', face)}</g>`;
  if (!from) { srRecall(); return; }
  const m = g.firstChild, secs = srMotion() ? clamp(Math.hypot(from[0] - SR_MEET[0], from[1] - SR_MEET[1]) / 320, 0.5, 1.4) : 0;
  void m.getBoundingClientRect(); m.style.transition = secs ? `transform ${secs}s ease-out` : 'none'; m.style.transform = srXform(SR_MEET[0], SR_MEET[1], 1);
  srAfter(secs * 1000, () => { if (SR.meet && SR.meet.key === key) m.innerHTML = srMeetSVG(key, 'idle', 'right'); });
  srRecall(); // room dogs step out of the meet dog's way
}

/* ---- the room ---- */
function srEnter(mode) {
  if (SR) srLeave();
  SR = { mode, gen: Math.random(), dogs: [], timers: [], tossAt: -1e9, toy: null, meet: null, lastFetch: null, lineAt: 0, pets: 0, bellies: 0 };
  const list = srRoomList(mode), F = SR_ROOM.floor;
  SR.dogs = list.map((x, i) => {
    const fx = F[0] + 90 + (i + 0.5) * (F[2] - F[0] - 180) / Math.max(1, list.length), fy = F[1] + 20 + ((i * 53) % 110);
    return { id: x.id, key: x.key, name: x.name, kind: x.kind, look: x.look, stage: srStage(x.months), x: fx, y: fy, tx: fx, ty: fy, face: i % 2 ? 'left' : 'right', pose: 'idle', t: 0 };
  });
  const svg = $('#view > svg.world');
  srCam(); // the camera first, so the dogs start on screen
  SR.dogs.forEach((rd) => { const sp = srSpot(rd, null, true); if (sp) { rd.x = rd.tx = sp[0]; rd.y = rd.ty = sp[1]; } else { rd.away = rd.parked = true; rd.x = rd.tx = -300; } });
  SR.dogs.sort((a, b) => a.y - b.y); $('#srDogs').innerHTML = SR.dogs.map(srDogG).join('');
  SR.dogs.forEach((rd) => { if (rd.parked) { const n = srNode(rd); if (n) n.style.display = 'none'; } });
  srDrawBoard(); srBasketHit();
  // taps: room dogs, the board, the toy basket (delegated, so a scene redraw keeps the basket working)
  svg.addEventListener('click', srClick);
  svg.addEventListener('keydown', (e) => { if (e.key !== 'Enter' && e.key !== ' ') return; const t = e.target.closest && e.target.closest('[data-srdog], #srBoardG'); if (t) { e.preventDefault(); srClick({ target: t }); } });
  SR.dogs.forEach((rd, i) => { if (!rd.parked) srRest(rd, PICK(['idle', 'sit', 'sniff']), 400 + i * 450); });
  // the camera follows the screen and the tray (it can settle a frame later); dogs left out of view walk back in
  let camKey = '';
  const rs = () => { if (!SR) return; srCam(); const hb = srHitBox(); document.querySelectorAll('#srDogs .sr-hit').forEach((r) => { r.setAttribute('x', hb[0].toFixed(1)); r.setAttribute('y', hb[1].toFixed(1)); r.setAttribute('width', hb[2].toFixed(1)); r.setAttribute('height', hb[3].toFixed(1)); }); const k = $('#view > svg.world') ? $('#view > svg.world').getAttribute('viewBox') : ''; if (k !== camKey) { camKey = k; srRecall(); } };
  window.addEventListener('resize', rs); const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => requestAnimationFrame(rs)) : null;
  if (ro) { ro.observe(view); ro.observe(dock); } requestAnimationFrame(rs); setTimeout(rs, 400);
  onCleanup(() => { window.removeEventListener('resize', rs); if (ro) ro.disconnect(); srLeave(); });
}
// the basket's tap area grows to at least 48 px on small crops (the art's own hit rect stays as drawn)
function srBasketHit() {
  const g = $('#sceneG [data-hot="toys"]'); if (!g || g.querySelector('.sr-toyhit')) return; const [x, y, w, h] = SR_ROOM.toys;
  const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); r.setAttribute('class', 'sr-toyhit');
  [['x', x - 12], ['y', y - 20], ['width', w + 24], ['height', h + 40], ['fill', 'transparent']].forEach(([k, v]) => r.setAttribute(k, v)); g.appendChild(r);
}
on('scene:redraw', () => { if (!SR) return; srBasketHit(); const b = $('#srBoardG'); if (b && b.dataset.tod !== timePhase()) srDrawBoard(); }); // the board follows the room's time tint
function srRecall() {
  const V = srView(); if (!V || !SR) return;
  SR.dogs.forEach((rd) => { if (rd.away || rd.busy) return; const x = rd.walking ? rd.tx : rd.x, y = rd.walking ? rd.ty : rd.y; if (srSpotOk(x, y, rd, V)) return; srHalt(rd); srGo(rd); });
  srUnpark();
}
function srDrawBoard() { const b = $('#srBoardG'); if (b) { b.innerHTML = srBoardSVG(); b.dataset.tod = timePhase(); } }
function srLeave() { if (!SR) return; SR.timers.forEach(clearTimeout); SR.dogs.forEach((d) => clearTimeout(d.t)); SR = null; }
function srClick(e) {
  if (!SR) return; const t = e.target;
  const dg = t.closest && t.closest('[data-srdog]'); if (dg) { srPet(dg.dataset.srdog); return; }
  if (t.closest && t.closest('#adoptDog')) { srPetMeet(); return; }
  if (t.closest && t.closest('[data-hot="toys"]')) { srToss(); return; }
  const sl = t.closest && t.closest('[data-srslot]'), bd = t.closest && t.closest('#srBoardG'); if (!bd) return;
  SFX.click();
  if (SR.mode === 'adopt') { if (sl && !isPhone()) srSelectKey(sl.dataset.srslot); else { const h = dock.querySelector('.heads button[aria-current="true"]'); if (h) { h.scrollIntoView({ block: 'nearest' }); h.focus({ preventScroll: true }); } } return; }
  if (sl && !isPhone()) srMeet(sl.dataset.srslot); else openShelterList();
}

/* ---- shelter mode: the dock tray ---- */
function srHomeLabel() { return !S || ['yard', 'house'].includes(S.place) || !PLACES[S.place] ? 'Go home' : `Back to ${PLACES[S.place].n}`; }
function srTray() {
  dock.innerHTML = `<div class="tray sr-tray"><div class="tray-h"><h3>Doodle Doggo Shelter</h3></div><div class="sr-btns"><button class="btn go" id="srBoard">Adopt me board</button><button class="btn" id="srToss">Toss a toy</button><button class="btn" id="srHome">${esc(srHomeLabel())}</button></div></div>`;
  $('#srBoard').onclick = () => { SFX.click(); openShelterList(); };
  $('#srToss').onclick = () => { SFX.click(); srToss(); };
  $('#srHome').onclick = () => { SFX.click(); go('yard'); };
}

/* ---- the Meet card ---- */
function srMeet(id) {
  const x = srRoster().find((r) => r.id === id); if (!x) { openShelterList(); return; }
  const L = srLook(x), info = dogInfo(x.key), bl = adoptBlock(), tip = typeof bdTip === 'function' ? bdTip(x.key) : '';
  const p = openModal(`${esc(x.name)} ${sexSym(x.sex)}`, `<div class="sr-meetbox"><div class="sr-meetart" id="srMeetArt">${dogSVG(L, { pose: 'sit' })}</div><div class="sr-meetinfo">
    <p class="sr-meetsub"><b>${esc(info.breed)}</b> · ${x.sex === 'female' ? 'Girl' : 'Boy'} · ${esc(ageText(x.months))}</p>
    <p class="sr-meettrait">${esc(x.trait)}</p>
    ${x.key !== 'mutt' ? `<p class="small">Loves: ${esc(favLine(x.key))}</p>` : ''}${tip ? `<p class="small bd-tip">${esc(tip)}</p>` : ''}
    <p class="small sr-meetkind">${x.kind === 'rescue' ? 'Arrived today as a rescue.' : srStage(x.months) === 'senior' ? 'Lives in the playroom. Old knees, big heart, soft cushion.' : srStage(x.months) === 'puppy' ? 'Lives in the playroom. Small, fast and very interested in shoelaces.' : 'Lives in the playroom, waiting for the right family.'}</p></div></div>`,
  { cls: 'sr-meet', foot: `<button class="btn no" id="srMeetBack">Back</button><button class="btn" id="srMeetPet">Pet</button><button class="btn yes big" id="srAdopt" ${bl ? 'aria-disabled="true"' : ''}>Adopt ${esc(x.name)}</button>` });
  $('#srMeetBack', p).onclick = () => { SFX.click(); openShelterList(); };
  let petting = 0;
  $('#srMeetPet', p).onclick = () => {
    if (petting) return; const a = $('#srMeetArt', p); petting = 1; SFX.boop(760);
    const show = (pose) => { if (a.isConnected) a.innerHTML = dogSVG(L, { pose }); };
    const hearts = () => { if (!a.isConnected) return; const h = document.createElement('span'); h.className = 'sr-cardhearts'; h.innerHTML = [0, 1, 2].map((i) => `<svg viewBox="-16 -16 32 32" style="animation-delay:${i * 120}ms">${doodle('heart', 0, 0, 1)}</svg>`).join(''); a.appendChild(h); setTimeout(() => h.remove(), 1600); };
    show('pet'); hearts(); playBark(voiceOf(L), 'play', { volume: 0.8 });
    setTimeout(() => { show('rollover'); hearts(); }, 900); setTimeout(() => { show('sit'); petting = 0; }, 2900);
  };
  $('#srAdopt', p).onclick = () => { const b2 = adoptBlock(); if (b2) { nope(b2); return; } srAdoptFlow(x.kind, x.id, () => srMeet(id)); };
  return p;
}

/* ---- adopting (the v2.6 path): rescues, residents and starters ---- */
function srAdoptFlow(kind, id, back) {
  const bl = adoptBlock(); if (bl) { nope(bl); return; }
  let spec;
  if (kind === 'rescue') spec = rescuesToday().find((r) => r.id === id);
  else if (kind === 'resident') spec = srRoster().find((r) => r.id === id && r.kind === 'resident');
  else { if (!shelterSex[id]) { nope('Pick Boy or Girl first. The siblings are waiting politely.'); return; } spec = { key: id, sex: shelterSex[id], months: 10 }; }
  if (!spec || (spec.id && dogById(spec.id))) return;
  const def = kind === 'starter' ? dogInfo(spec.key).name : spec.name;
  const pp = openModal(`Name your new ${spec.sex === 'female' ? 'girl' : 'boy'} ${sexSym(spec.sex)}`, `<p>${kind === 'starter' ? 'The tag says' : 'The shelter calls this one'} <b>${esc(def)}</b>. Keep it, or pick something just as silly.</p><input id="shName" class="namebox" maxlength="16" value="${esc(def)}" autofocus>`, { foot: '<button class="btn no" id="shNo">Back</button><button class="btn yes big" id="shOk">Bring home!</button>' });
  const done = () => {
    const nm = ($('#shName', pp).value || def).trim().slice(0, 16) || def;
    const d = addDog(kind === 'starter' ? spec : { id: spec.id, key: spec.key, sex: spec.sex, months: spec.months, genes: spec.genes, rescue: spec.rescue }, nm);
    if (kind !== 'starter') { if (!S.shelter || !Array.isArray(S.shelter.adopted)) S.shelter = { adopted: [], seen: S.shelter && S.shelter.seen || null }; if (!S.shelter.adopted.includes(spec.id)) S.shelter.adopted.push(spec.id); }
    trackAct('adopt', { id: d.id, key: d.key, kind });
    closeModal(); audioCue('adopt'); SFX.fanfare();
    const pd = PRd(d); toast(`${nm} is home! ${pd.He} sniffs everything twice. ${S.dogs.length} dogs now.`, 'gold');
    S.place = 'yard'; go('yard');
  };
  $('#shOk', pp).onclick = done; $('#shNo', pp).onclick = () => (back || openShelterList)();
  $('#shName', pp).addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
}

function srExpose() {
  if (!window.__paw) return;
  window.__paw.sr = {
    list: () => openShelterList(),
    roster: (dk) => srRoster(dk).map((x) => ({ id: x.id, key: x.key, sex: x.sex, months: x.months, name: x.name, kind: x.kind, trait: x.trait })),
    room: SR_ROOM, slots: SR_SLOTS,
    meet: (id) => srMeet(id), toss: () => srToss(), pet: (id) => srPet(id),
    count: () => (SR ? SR.dogs.filter((d) => !d.away || d.parked || d.leaving).length : 0), // room dogs, the back room included (not the meet dog)
    dogs: () => (SR ? SR.dogs.filter((d) => !d.away).map((d) => ({ id: d.id, key: d.key, pose: d.pose, x: Math.round(d.x), y: Math.round(d.y), walking: !!d.walking, busy: !!d.busy })) : []),
    get mode() { return SR ? SR.mode : null; }, get lastFetch() { return SR ? SR.lastFetch : null; }, get pets() { return SR ? SR.pets : 0; }, get bellies() { return SR ? SR.bellies : 0; },
    get meetKey() { return SR && SR.meet ? SR.meet.key : null; }, cam: () => srCam()
  };
}
on('game:ready', () => setTimeout(srExpose, 0));
setTimeout(srExpose, 0);
