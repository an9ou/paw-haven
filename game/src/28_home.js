/* ======================= v2.7 HOME lane (tag ho): house and yard decorating, placement mode, beds for every dog, furniture the dogs use. See V27.md sections 1 and 5 =======================
   Owned by the HOME lane (with css/31_home.css). The names napSpot, hoBedFor, hoPackSpot and hoFree are called by PACK CARE and SHELTER: keep their signatures.
   Items: every HM_DECOR entry (yard or house) and every bed name. A decoration is out when S.decor[n].out, a bed when S.bedAt[n] exists. Position: S.decor[n].at
   (or the catalogue spot HM_DECOR[n].at), S.bedAt[n]. Size and room always come from HM_DECOR (beds are 260 x 160, house only). Nothing is drawn differently
   until the player buys, moves or puts something out: an old save draws the same yard decorations and the one bed where they always stood. */

// zones a placed item must stay in, world units of the 1000 x 600 scene. floor: the item's bottom edge y within [y0, y1] and x within [x0, x1 - w].
// wall: the whole box inside [x0, y0, x1, y1]. The desktop crop hides the scene above y 147, so the wall bands start at y 150. The house floor starts at the
// sofa's front (y 424), so nothing seems to stand on the sofa. The yard floor starts on the grass in front of the fence (y 380). V27.md section 10.
const HO_ZONES = {
  yard: { floor: { x0: 0, x1: 1000, y0: 380, y1: 596 }, wall: { x0: 0, x1: 1000, y0: 150, y1: 420 } },
  house: { floor: { x0: 0, x1: 1000, y0: 424, y1: 596 }, wall: { x0: 16, x1: 864, y0: 150, y1: 384 } }
};
const HO_BED_WH = [260, 160]; // every bed in the house is drawn 260 x 160 (BED_BOX w, h), sleep area ~(130, 95) of the bed's own viewBox
// where a dog without a bed of its own naps in the house: [feet x, feet y, facing, scale] on the big pink rug, clear of #dogHit at rest and the bowl
const HO_RUG_NAPS = [[310, 582, 'right', 0.6], [560, 586, 'left', 0.6], [440, 594, 'right', 0.6]];
// the v2.1 and v2.6 yard decorations have no zone in HM_DECOR: these hang on the fence or a wire, the rest stand on the grass
const HO_OLD_ZONE = { 'Family Photo Frame': 'wall', 'Paper Bat Bunting': 'wall', 'Ghost Garland': 'wall' };
// boxes a free spot keeps clear of (x, y, w, h): the dog's tap box at rest, the bowl, and per room the mailbox, the missions clipboard, the dog house, the place buttons
const HO_DOG_REST = [328, 335, 204, 180], HO_STATUS = [0, 147, 262, 42]; // the place and time chip (top left) covers the wall under it
const HO_KEEP = {
  yard: [[210, 470, 80, 80], [286, 288, 90, 120], [208, 318, 50, 64], [640, 340, 204, 186], [850, 525, 150, 50]],
  house: [[210, 470, 80, 80], [850, 525, 150, 50]]
};
// a few short lines a dog says on a piece of furniture (by prop and spot)
const HO_LINES = {
  playtower: { top: ['Top step. Mine.', 'I can see the whole house from here.', 'King of the tower.'], cubby: ['Cubby time. Do not disturb.', 'This hole is my office.'] },
  tunnelsofa: { tunnel: ['Tunnel! Tunnel! Tunnel!', 'You cannot see me. I am in the tunnel.'], seat: ['The good cushion. Finally.', 'Sofa. Mine. Thank you.'] },
  ballpit: { a: ['So many balls.', 'I live here now.'], b: ['Ball bath!', 'Do not tell anyone where I am.'] },
  sofaramp: { top: ['Up the ramp. No jumping needed.', 'Nice and easy. Like a lift.'] },
  windowseat: { seat: ['Postman watch. On duty.', 'A bird! Two birds!', 'Nothing out there. Still watching.'] }
};
const HO = { pl: null, uses: {}, fav: {}, want: null, pending: null, sRef: null, syncFor: null, lit: null, rugDay: '', watch: 0, acts: [] };
on('act', (a) => { if (a && ['buy', 'decorate', 'furniture'].includes(a.kind)) { HO.acts.push(a); if (HO.acts.length > 40) HO.acts.shift(); } }); // the test hook reads them

/* ---------------- items: kind, room, size, position ---------------- */
const hoIsBed = (n) => !HM_DECOR[n] && BEDS.some((b) => b.n === n);
function hoRoomOf(name) { if (hoIsBed(name)) return 'house'; const D = HM_DECOR[name]; return (D && D.room) || 'yard'; }
const hoKind = (n) => (hoIsBed(n) ? 'bed' : (HM_DECOR[n] && HM_DECOR[n].kind) || 'decor');
const hoZoneOf = (n) => (hoIsBed(n) ? 'floor' : (HM_DECOR[n] && HM_DECOR[n].zone) || HO_OLD_ZONE[n] || 'floor');
const hoLayer = (n) => (hoZoneOf(n) === 'wall' ? 0 : HM_DECOR[n] && HM_DECOR[n].flat ? 1 : 2);
function hoSize(n) { if (hoIsBed(n)) return HO_BED_WH.slice(); const a = HM_DECOR[n].at; return [a[2], a[3]]; }
function hoHome(n) { return hoIsBed(n) ? [BED_BOX[0], BED_BOX[1]] : HM_DECOR[n].at.slice(0, 2); } // the catalogue spot
function hoPos(n) {
  if (HO.pl && HO.pl.pos[n]) return HO.pl.pos[n];
  if (hoIsBed(n)) return (S.bedAt && S.bedAt[n]) || hoHome(n);
  const r = S.decor && S.decor[n]; return r && Array.isArray(r.at) && r.at.length === 2 && isFinite(r.at[0]) && isFinite(r.at[1]) ? r.at : hoHome(n);
}
const hoBox = (n) => hoPos(n).concat(hoSize(n));
// the part of an item's box that is really drawn, for keeping things apart: a bed's art fills only the lower part of its 260 x 160 box
const HO_BED_TOP = { 'Royal Canopy Bed': 0, 'Hammock Cot': 24, 'Cloud Bed': 40 };
function hoFoot(n) { const b = hoBox(n); if (!hoIsBed(n)) return b; const t = HO_BED_TOP[n] ?? 64; return [b[0], b[1] + t, b[2], b[3] - t]; }
function hoIsOut(n) { return hoIsBed(n) ? !!(S.bedAt && S.bedAt[n] && S.beds.includes(n)) : hmDecorOut(n); }
function hoOwned(room) { // decorations and furniture owned in this room, catalogue order
  hmDecorFields(); return Object.keys(HM_DECOR).filter((n) => S.decor[n] && hoRoomOf(n) === room);
}
function hoOutIn(room) { const a = hoOwned(room).filter(hmDecorOut); if (room === 'house') a.push(...S.beds.filter((n) => S.bedAt && S.bedAt[n])); return a; }
const hoFurnOut = () => (S && S.place === 'house' ? hoOwned('house').filter((n) => hmDecorOut(n) && hoKind(n) === 'furniture') : []);
// drawing order: wall items, then flat items, then everything standing on the floor by its bottom edge (stable)
function hoOrder(names) { return names.map((n, i) => ({ n, i, l: hoLayer(n), b: hoBox(n)[1] + hoBox(n)[3] })).sort((a, b) => a.l - b.l || (a.l === 2 ? a.b - b.b : 0) || a.i - b.i).map((o) => o.n); }
const ho2 = (v) => Math.round(v / 2) * 2;
// clamp a top-left to the item's zone (the same rule for a drag, a tap, a key and __paw.ho.move), rounded to 2 world units
function hoClamp(n, x, y) {
  const room = hoRoomOf(n), z = HO_ZONES[room][hoZoneOf(n)], [w, h] = hoSize(n);
  x = clamp(ho2(x), z.x0, Math.max(z.x0, z.x1 - w));
  y = hoZoneOf(n) === 'wall' ? clamp(ho2(y), z.y0, Math.max(z.y0, z.y1 - h)) : clamp(ho2(y) + h, z.y0, z.y1) - h;
  return [x, y];
}
const hoHit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
// boxes a new spot keeps clear of: the fixed ones, the nursery basket, the scene hotspots on show, every other item out in the room
function hoKeepBoxes(room, skip) {
  const out = [HO_DOG_REST, HO_STATUS].concat(HO_KEEP[room] || []);
  // where the pack dogs stand (13_more_dogs.js PACK_SPOTS): a tall thing behind a standing dog would look like the dog stands on it
  const ps = typeof PACK_SPOTS === 'object' && PACK_SPOTS[room]; if (ps && S.dogs.length > 1) ps.slice(0, Math.min(3, S.dogs.length - 1)).forEach(([fx, fy, , sc]) => { const w = DW * sc, h = DH * sc; out.push([fx - w / 2 + 20 * sc, fy - h * 205 / 220 + 30 * sc, w - 40 * sc, h - 30 * sc]); });
  if (room === 'yard' && Array.isArray(S.litters) && S.litters.length && typeof NURSERY_AT !== 'undefined') out.push(NURSERY_AT.art);
  const svg = cur.mode === 'yard' && S.place === room && $('svg.world', view);
  if (svg) svg.querySelectorAll('#sceneG [data-hot]').forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width) return; const a = toWorld(svg, r.left, r.top), b = toWorld(svg, r.right, r.bottom); out.push([a.x, a.y, b.x - a.x, b.y - a.y]); });
  hoOutIn(room).forEach((m) => { if (m !== skip) out.push(hoFoot(m)); });
  return out;
}
// the house scene's own wall furniture (bookshelf, picture, window, sign, kitchen): a hung item looks for bare wall first
const HO_WALL_KEEP = { house: [[25, 147, 190, 252], [233, 147, 82, 88], [340, 147, 236, 114], [578, 160, 68, 56], [676, 147, 154, 58]], yard: [[40, 147, 345, 248]] };
const hoOverlap = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
// a free spot: the catalogue spot if clear, else the first clear box scanning the zone (back to front, left to right, step 24).
// When nothing is clear (a very full room) it takes the scanned box that overlaps the least, so a new bed never lands right on another bed.
function hoFreeSpot(n, start) {
  const room = hoRoomOf(n), z = HO_ZONES[room][hoZoneOf(n)], [w, h] = hoSize(n), wall = hoZoneOf(n) === 'wall';
  const keep = hoKeepBoxes(room, n).concat(wall ? HO_WALL_KEEP[room] || [] : []), cost = (x, y) => keep.reduce((a, b, i) => a + hoOverlap([x, y, w, h], b) * (i === 0 ? 12 : 1), 0); // [0] is the dog at rest: overlap it last of all
  const at = hoClamp(n, ...(start || hoHome(n))); if (!cost(at[0], at[1])) return at;
  let best = at, bc = cost(at[0], at[1]);
  for (let v = z.y0; v <= z.y1 - (wall ? h : 0); v += 24) for (let x = z.x0; x <= z.x1 - w; x += 24) { const p = hoClamp(n, x, wall ? v : v - h), c = cost(p[0], p[1]); if (!c) return p; if (c < bc) { bc = c; best = p; } }
  return best;
}

/* ---------------- beds for every dog ---------------- */
function hoSync() {
  if (!S || !Array.isArray(S.dogs) || !S.dogs.length || !Array.isArray(S.beds)) return;
  if (typeof v27Fields === 'function') v27Fields(S);
  const before = JSON.stringify([S.bed, S.bedAt, S.bedOf]), act = S.activeId, ids = S.dogs.map((d) => d.id);
  Object.keys(S.bedAt).forEach((n) => { const p = S.bedAt[n]; if (!S.beds.includes(n) || !Array.isArray(p) || !isFinite(p[0]) || !isFinite(p[1])) delete S.bedAt[n]; });
  Object.keys(S.bedOf).forEach((id) => { if (!ids.includes(id)) delete S.bedOf[id]; });
  if (HO.sRef !== S) { HO.sRef = S; HO.syncFor = act; }
  const takenBy = (n, but) => S.dogs.some((d) => d.id !== but && S.bedOf[d.id] === n);
  if (HO.syncFor !== act) { // the active dog changed: S.bed follows it (its own bed, else a free bed, else it keeps S.bed)
    HO.syncFor = act; const mine = S.bedOf[act];
    if (mine && S.bedAt[mine]) S.bed = mine;
    else if (!(S.bedAt[S.bed] && !takenBy(S.bed, act))) { const free = Object.keys(S.bedAt).find((n) => !takenBy(n, act)); if (free) S.bed = free; }
  }
  if (!S.beds.includes(S.bed)) S.bed = Object.keys(S.bedAt)[0] || S.beds[0];
  if (!S.bedAt[S.bed]) { // S.bed is owned but not in the house (old code or a test set it): it takes the place of the active dog's previous bed, or BED_BOX
    const prev = S.bedOf[act];
    if (prev && prev !== S.bed && S.bedAt[prev]) { S.bedAt[S.bed] = S.bedAt[prev].slice(); delete S.bedAt[prev]; } else S.bedAt[S.bed] = [BED_BOX[0], BED_BOX[1]];
  }
  S.bedOf[act] = S.bed; const taken = new Set([S.bed]);
  S.dogs.forEach((d) => {
    if (d.id === act) return; const b = S.bedOf[d.id];
    if (b && S.bedAt[b] && !taken.has(b)) { taken.add(b); return; }
    const free = Object.keys(S.bedAt).find((n) => !taken.has(n)); if (free) { S.bedOf[d.id] = free; taken.add(free); } else delete S.bedOf[d.id];
  });
  if (JSON.stringify([S.bed, S.bedAt, S.bedOf]) !== before) markDirty();
}
// the bed a dog naps on (a name in S.bedAt) or null (it naps on the rug). d: a dog or a dog id
function hoBedFor(d) {
  if (!S) return null; hoSync(); const id = d && typeof d === 'object' ? d.id : d || S.activeId;
  const b = id === S.activeId ? S.bed : S.bedOf[id]; return b && S.bedAt[b] ? b : null;
}
// [tx, ty, scale] for dogTo() when the ACTIVE dog naps: in the house its own bed (feet at x + 130, y + 145), else the rug; in the yard the dog-house door
function napSpot() {
  if (!S || S.place !== 'house') return [417.5, 140, 0.75];
  const b = hoBedFor(S.dog); if (b) { const [x, y] = S.bedAt[b]; return [x - 192.5, y - 230, 0.75]; }
  const r = HO_RUG_NAPS[0]; return [r[0] - 430 * r[3], r[1] - 500 * r[3], r[3]];
}
// is the active dog standing at its bed's nap spot right now (fbNapFit, 03_yard.js)
function hoAtBedNap() {
  const p = $('#dogPos'); if (!p || !S || S.place !== 'house' || !hoBedFor(S.dog)) return false;
  const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([\d.]+)\)/.exec(p.style.transform), ns = napSpot();
  return !!m && Math.abs(+m[1] - ns[0]) < 0.6 && Math.abs(+m[2] - ns[1]) < 0.6 && Math.abs(+m[3] - ns[2]) < 0.01;
}
// the Zzz (03_yard.js showZzz draws it over the v2.5 bed spot) follows the active dog's bed
function hoZzzSync() {
  const z = $('#zzz'); if (!z) return; const b = S && S.place === 'house' && hoBedFor(S.dog);
  if (b && (S.bedAt[b][0] !== BED_BOX[0] || S.bedAt[b][1] !== BED_BOX[1])) z.setAttribute('transform', `translate(${S.bedAt[b][0] - BED_BOX[0]} ${S.bedAt[b][1] - BED_BOX[1]})`); else z.removeAttribute('transform');
}
// give bed b to dog id, swapping with whoever had it
function hoGiveBed(id, b) {
  const d = dogById(id); if (!d || !S.bedAt[b]) return; hoSync();
  const prev = hoBedFor(d), o = S.dogs.find((x) => x !== d && hoBedFor(x) === b);
  if (o && o.id === S.activeId && !prev) { nope(`${o.name} needs a bed too. A second bed from Barkitecture would suit everyone.`); return false; }
  if (o) { if (prev) S.bedOf[o.id] = prev; else delete S.bedOf[o.id]; if (o.id === S.activeId) S.bed = prev || S.bed; }
  S.bedOf[d.id] = b; if (d.id === S.activeId) S.bed = b; if (o && o.id === S.activeId && prev) S.bed = prev;
  hoSync(); markDirty(); return true;
}
function hoRugHint(d) {
  const day = localISO(); if (HO.rugDay === day || !d) return; HO.rugDay = day;
  setTimeout(() => { if (S && S.place === 'house') toast(`${d.name} naps on the rug tonight. A second bed from Barkitecture would suit ${d.name}.`, ''); }, 600);
}

/* ---------------- drawing ---------------- */
function hoFurnArt(n) {
  const D = HM_DECOR[n], on = Object.values(HO.uses).some((u) => u.name === n && u.on), o = { use: on }; if (D.lit) o.lit = isNight();
  return `<svg viewBox="0 0 ${D.vb[0]} ${D.vb[1]}" xmlns="http://www.w3.org/2000/svg">${place(art('prop', D.prop, o), 0, 0, D.vb[0], D.vb[1])}</svg>`;
}
// placement extras: the outline (and a tap rect at least 48 px on phones), only while placing this room
function hoPlaceBits(n, x, y, w, h) {
  if (!HO.pl || HO.pl.room !== hoRoomOf(n)) return '';
  let [hx, hy, hw, hh] = [x, y, w, h]; if (isPhone()) { const svg = $('svg.world', view), M = svg && svg.getScreenCTM(), s = M && M.a > 0 ? M.a : ((view.clientHeight || 500) - 60) / 600, m = 50 / s; /* the tray shrinks the scene: measure the real scale */ if (hw < m) { hx -= (m - hw) / 2; hw = m; } if (hh < m) { hy -= (m - hh) / 2; hh = m; } }
  return `<rect class="ho-hit" x="${f1(hx)}" y="${f1(hy)}" width="${f1(hw)}" height="${f1(hh)}" fill="transparent"/><rect class="ho-ol${HO.pl.sel === n ? ' ho-sel' : ''}" x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="8" fill="none" vector-effect="non-scaling-stroke"/>`;
}
function hoItemSVG(n) {
  const [x, y] = hoPos(n), [w, h] = hoSize(n), k = hoKind(n), pl = HO.pl && HO.pl.room === hoRoomOf(n) ? ` data-ho-item="${esc(n)}"` : '';
  if (k === 'bed') {
    const sv = bedSVG(n); if (!sv) return '';
    if (n === S.bed) return `<g id="bedG" class="hot" tabindex="0" role="button" aria-label="Pet bed: ${esc(n)}"${pl}>${place(sv, x, y, w, h)}${hoPlaceBits(n, x, y, w, h)}</g>`;
    const who = S.dogs.find((d) => hoBedFor(d) === n);
    return `<g class="hot ho-bed" data-bed="${esc(n)}" tabindex="0" role="button" aria-label="Pet bed: ${esc(n)}${who ? ' (' + esc(who.name) + ')' : ''}"${pl}>${place(sv, x, y, w, h)}${hoPlaceBits(n, x, y, w, h)}</g>`;
  }
  if (k === 'furniture') return `<g class="hot ho-furn" data-furn="${esc(n)}" tabindex="0" role="button" aria-label="${esc(n)}"${pl}>${place(hoFurnArt(n), x, y, w, h)}${hmDecorHit(x, y, w, h)}${hoPlaceBits(n, x, y, w, h)}</g>`;
  return `<g class="hot hm-decor" data-decor="${esc(n)}" tabindex="0" role="button" aria-label="${esc(n)}"${pl}>${place(hmDecorArt(n), x, y, w, h)}${hmDecorHit(x, y, w, h)}${hoPlaceBits(n, x, y, w, h)}</g>`;
}
function hoFrontSVG(n) {
  const [x, y] = hoPos(n), [w, h] = hoSize(n), k = hoKind(n);
  if (k === 'bed') { const sv = bedSVG(n); if (!sv || !sv.includes('pa-bed-front')) return ''; return n === S.bed ? `<g id="bedFront" class="bedfront" pointer-events="none">${place(sv, x, y, w, h)}</g>` : `<g class="bedfront ho-bedfront" data-bed="${esc(n)}" pointer-events="none" style="display:none">${place(sv, x, y, w, h)}</g>`; }
  if (k === 'furniture') return `<g class="ho-front" data-furn="${esc(n)}" pointer-events="none"${hoFrontOn(n) ? '' : ' style="display:none"'}>${place(hoFurnArt(n), x, y, w, h)}</g>`;
  return '';
}
// the whole house room (bedLayers, 12_popups): back = wall, flat, then floor items, beds and furniture by bottom edge; front = bed lips and furniture fronts
function hoRoomSVG() {
  const names = hoOrder(hoOutIn('house'));
  return { back: `<g id="hoRoomG">${names.map(hoItemSVG).join('')}</g>`, front: `<g id="hoFrontG" pointer-events="none">${names.map(hoFrontSVG).join('')}</g>` };
}
// redraw the room's items in place (yard: #decorG, house: #hoRoomG + #hoFrontG), keep the dog's nap fit and the pack on their beds
function hoRoomRedraw() {
  if (!S || cur.mode !== 'yard') return;
  if (S.place === 'yard') { const old = $('#decorG'); if (old) old.outerHTML = hmDecorSVG(); }
  else if (S.place === 'house') {
    hoSync(); const r = hoRoomSVG(), b = $('#hoRoomG'), f = $('#hoFrontG'); if (b) b.outerHTML = r.back; if (f) f.outerHTML = r.front;
    const bf = $('#bedFront'); if (bf) bf.style.display = dogKey.startsWith('sleep|') ? '' : 'none';
    if (typeof fbNapFit === 'function') fbNapFit(dogKey.split('|')[0]);
  } else return;
  hmDecorBind(); fbPackNapFit();
}
function hoFrontOn(n) { return Object.values(HO.uses).some((u) => u.name === n && hoSpot(u.name, u.spot) && hoSpot(u.name, u.spot).front); }
function hoFrontSync() { document.querySelectorAll('#hoFrontG .ho-front[data-furn]').forEach((g) => { g.style.display = hoFrontOn(g.dataset.furn) ? '' : 'none'; }); }
// the prop's use state (balls up, a dented cushion) while a dog is on it: redraw that piece and its front copy
function hoFurnRefresh(n) {
  if (cur.mode !== 'yard' || !S || S.place !== 'house') return; const [x, y] = hoPos(n), [w, h] = hoSize(n), sel = CSS.escape(n);
  [`#hoRoomG [data-furn="${sel}"]`, `#hoFrontG [data-furn="${sel}"]`].forEach((q) => { const g = $(q), s = g && g.querySelector(':scope > svg'); if (s) s.outerHTML = place(hoFurnArt(n), x, y, w, h); });
  hoFrontSync();
}

/* ---------------- furniture use ---------------- */
// a spot in world units: feet fx, fy, dog scale s, pose, facing, front, via (world point). PawArt.FURN_SPOTS wins over the catalogue spots.
function hoSpots(n) { const D = HM_DECOR[n]; if (!D || D.kind !== 'furniture') return {}; const FS = PA().FURN_SPOTS; return (FS && FS[D.prop]) || D.spots || {}; }
function hoSpot(n, sk) {
  const D = HM_DECOR[n], s0 = hoSpots(n)[sk]; if (!D || !s0) return null; const [ax, ay] = hoPos(n), k = hoSize(n)[0] / D.vb[0];
  return { name: n, key: sk, prop: D.prop, fx: ax + s0.x * k, fy: ay + s0.y * k, s: s0.w * k / 264, pose: s0.pose, face: s0.face || 'right', front: !!s0.front, via: s0.via ? [ax + s0.via.x * k, ay + s0.via.y * k] : null };
}
// free spots for dog d: pieces out in the house, spots nobody else uses; a pack dog skips a piece whose front layer would cover the active dog at rest
function hoFreeSpots(d) {
  const act = d.id === S.activeId, st = lifeStage(ageMonths(d)), list = [];
  hoFurnOut().forEach((n) => {
    const box = hoBox(n), sp = hoSpots(n); if (!act && Object.values(sp).some((s) => s.front) && hoHit(box, HO_DOG_REST)) return;
    Object.keys(sp).forEach((k) => {
      if (Object.entries(HO.uses).some(([id, u]) => id !== d.id && u.name === n && u.spot === k)) return;
      const prop = HM_DECOR[n].prop; let wt = 1;
      if (st === 'puppy' && (prop === 'ballpit' || prop === 'playtower')) wt *= 1.5;
      if (st === 'senior' && (prop === 'windowseat' || prop === 'sofaramp')) wt *= 1.5;
      if (st === 'senior' && prop === 'playtower' && k === 'top') wt *= 0.2; // old knees take the ramp, not the tower
      list.push({ name: n, spot: k, wt });
    });
  });
  return list;
}
function hoPickSpot(d) { const l = hoFreeSpots(d); if (!l.length) return null; let r = Math.random() * l.reduce((a, b) => a + b.wt, 0); for (const o of l) { r -= o.wt; if (r <= 0) return o; } return l[0]; }
const HO_POSE_FB = { sleep: 'down', rollover: 'happy', down: 'sit' };
function hoPoseFor(d, pose) { return poseReal(d.key, pose) ? pose : poseReal(d.key, HO_POSE_FB[pose] || 'sit') ? HO_POSE_FB[pose] || 'sit' : 'sit'; }
function hoUseStart(d, name, spot) {
  HO.uses[d.id] = Object.assign(HO.uses[d.id] || {}, { name, spot, on: false });
  const f = HO.fav[name] = HO.fav[name] || {}; f[d.id] = (f[d.id] || 0) + 1;
  trackAct('furniture', { name, dog: d.id }); hoFrontSync();
}
function hoUseOn(d) { const u = HO.uses[d.id]; if (!u) return; u.on = true; hoFurnRefresh(u.name); }
function hoUseEnd(d) { const u = HO.uses[d.id]; if (!u) return; delete HO.uses[d.id]; hoFurnRefresh(u.name); hoFrontSync(); }
function hoSayOn(d, sp, wx, wy) { const L = HO_LINES[sp.prop] && HO_LINES[sp.prop][sp.key]; if (L && Math.random() < 0.45) say(PICK(L), wx, wy, 2200); }
// the active dog's idle weights: furniture in the house (never while hot, dirty or sad, never while placing)
function hoIdleWeights(w, d, stage) {
  if (!S || S.place !== 'house' || HO.pl || !d || d.id !== S.activeId) return;
  const st = d.stats; if (isHot() || st.clean < 25 || Math.min(st.hunger, st.happy, st.energy, st.clean) < 25 || !hoFreeSpots(d).length) return;
  const props = hoFurnOut().map((n) => HM_DECOR[n].prop); let m = 1;
  if (stage === 'puppy' && props.some((p) => p === 'ballpit' || p === 'playtower')) m = 1.5;
  if (stage === 'senior' && props.some((p) => p === 'windowseat' || p === 'sofaramp')) m = 1.5;
  w.furn = 2.5 * m;
}
// the steps of the 'furn' idle: walk there (the ramp: to its foot, then up), the spot's pose for 6 to 14 s, walk home
function hoIdleSteps(name) {
  if (name !== 'furn') return null;
  const d = D(), pick = HO.want || hoPickSpot(d); HO.want = null; const sp = pick && hoSpot(pick.name, pick.spot);
  if (!sp) return [{ pose: 'idle', ms: 1500 * IDLE.speed }];
  const to = (x, y, s, secs) => [x - 430 * s, y - 500 * s, s, secs], sp0 = { name: sp.name, spot: sp.key }, from = [430, 500];
  const secs = (a, b) => clamp(Math.hypot(a[0] - b[0], a[1] - b[1]) / 380, 0.7, 1.8) * IDLE.speed, steps = [];
  if (sp.via) {
    const t1 = secs(from, sp.via), t2 = secs(sp.via, [sp.fx, sp.fy]);
    steps.push({ move: to(sp.via[0], sp.via[1], sp.s, t1), pose: 'walk', facing: sp.via[0] < 430 ? 'left' : 'right', ms: t1 * 1000 + 100, ho: Object.assign({ ph: 'go' }, sp0) });
    steps.push({ move: to(sp.fx, sp.fy, sp.s, t2), pose: 'walk', facing: sp.fx > sp.via[0] ? 'right' : 'left', ms: t2 * 1000 + 100, ho: Object.assign({ ph: 'up' }, sp0) });
  } else { const t1 = secs(from, [sp.fx, sp.fy]); steps.push({ move: to(sp.fx, sp.fy, sp.s, t1), pose: 'walk', facing: sp.fx < 430 ? 'left' : 'right', ms: t1 * 1000 + 100, ho: Object.assign({ ph: 'go' }, sp0) }); }
  steps.push({ pose: sp.pose, fb: HO_POSE_FB[sp.pose] || 'sit', fx: sp.pose === 'rollover' ? 'tk-roll' : sp.pose === 'down' ? 'tk-lie' : null, facing: sp.face, ms: R2(6000, 14000), ho: Object.assign({ ph: 'on' }, sp0) });
  const back = secs([sp.fx, sp.fy], from);
  steps.push({ move: [0, 0, 1, back], pose: 'walk', facing: sp.fx < 430 ? 'right' : 'left', ms: back * 1000 + 100, ho: Object.assign({ ph: 'off' }, sp0) });
  return steps;
}
function hoIdleStep(s) {
  const d = D(), o = s.ho; if (!o || !d) return;
  if (o.ph === 'go') hoUseStart(d, o.name, o.spot);
  else if (o.ph === 'on') { hoUseOn(d); const sp = hoSpot(o.name, o.spot); if (sp) setTimeout(() => { if (HO.uses[d.id] && cur.mode === 'yard') { const h = dogHeadWorld(); hoSayOn(d, sp, h.x, h.y); } }, 500); }
  else if (o.ph === 'off') hoUseEnd(d);
}
function hoIdleEnd(a) { if (a && a.name === 'furn' && S) hoUseEnd(D()); }
function hoIdleMoves(name) { return name === 'furn'; }
// a pack dog's idle turn: about one in three (puppies one in two) goes to a free piece of furniture for 8 to 16 s. True while it is there.
function hoPackIdle(d) {
  if (!S || !d) return false; const u = HO.uses[d.id], now = performance.now();
  if (u) { if (now < u.until && S.place === 'house' && !HO.pl) return true; hoFree(d, true); return false; }
  if (S.place !== 'house' || cur.mode !== 'yard' || HO.pl || HO.noPack || busy || d.sleeping || d.id === S.activeId) return false;
  if (Math.random() >= (lifeStage(ageMonths(d)) === 'puppy' ? 0.5 : 0.34)) return false;
  const pick = hoPickSpot(d); if (!pick) return false;
  return hoPackUse(d, pick.name, pick.spot);
}
function hoPackUse(d, name, spot, ms) {
  const sp = hoSpot(name, spot); if (!sp || !d || d.id === S.activeId) return false;
  hoUseStart(d, name, spot); const u = HO.uses[d.id]; u.on = true; u.until = performance.now() + (ms || RINT(8000, 16000) * IDLE.speed);
  if (typeof packNext === 'object') packNext[d.id] = u.until;
  packPose[d.id] = hoPoseFor(d, sp.pose); redrawPackDog(d); hoFurnRefresh(name);
  hoSayOn(d, sp, sp.fx, sp.fy - 150 * sp.s);
  return true;
}
// [feet x, feet y, facing, scale] for a pack dog: napping in the house = its own bed (or the rug), on furniture = the spot; else null (13_more_dogs.js packDogSVG)
function hoPackSpot(d, i) {
  if (!S || !d || S.place !== 'house') return null;
  if (d.sleeping) {
    const b = hoBedFor(d); if (b) { const [x, y] = S.bedAt[b]; return [x + 130, y + 145, 'right', 0.75]; }
    const rug = S.dogs.filter((o) => o.id !== S.activeId && o.sleeping && !hoBedFor(o)), k = Math.max(0, rug.indexOf(d)), r = HO_RUG_NAPS[(k + 1) % HO_RUG_NAPS.length];
    hoRugHint(d); return r.slice();
  }
  const u = HO.uses[d.id], sp = u && hoSpot(u.name, u.spot); return sp ? [sp.fx, sp.fy, sp.face, sp.s] : null;
}
// stop dog d using any furniture at once (PACK CARE calls it before feeding, bathing or tucking a dog in); it goes back to its normal spot
function hoFree(d, quiet) {
  if (!S || !d) return; d = typeof d === 'object' ? d : dogById(d); if (!d) return;
  if (d.id === S.activeId) { if (IDLE.act && IDLE.act.name === 'furn') idleStop(); hoUseEnd(d); return; }
  const u = HO.uses[d.id]; if (!u) return; delete HO.uses[d.id];
  if (packPose[d.id] && !d.sleeping) packPose[d.id] = 'idle';
  if (cur.mode === 'yard' && !quiet) redrawPackDog(d); else if (cur.mode === 'yard') { /* the caller redraws */ }
  hoFurnRefresh(u.name); hoFrontSync();
}
function hoFreeAllPack() { Object.keys(HO.uses).forEach((id) => { if (id !== S.activeId) hoFree(dogById(id) || { id }); }); }

/* ---------------- placement mode ---------------- */
function hoPlaceStart(name, inRoom) {
  if (!S) return; const room = name && (HM_DECOR[name] || hoIsBed(name)) ? hoRoomOf(name) : inRoom === 'house' || inRoom === 'yard' ? inRoom : S.place === 'house' ? 'house' : 'yard';
  if (name && !hoIsBed(name) && !(S.decor && S.decor[name])) return;
  if (HO.pl && HO.pl.room === room && cur.mode === 'yard' && S.place === room) { if (name) hoPut(name); return; }
  if (HO.pl) hoDone();
  if (cur.mode !== 'yard' || S.place !== room) { HO.pending = { name: name || null, room, t: Date.now() }; if (!modal.hidden) closeModal(); travelTo(room); return; }
  const svg = $('svg.world', view); if (!svg) return;
  idleStop(); clearCurl(); hideBubble(); busy = true; hoFreeAllPack();
  HO.pl = { room, sel: null, pos: {}, moved: {}, cam: phCamHome, svg, drag: null, ground: null };
  svg.classList.add('ho-placing'); hoRoomRedraw(); hoTray(); hoCamSel();
  const pl = HO.pl;
  pl.down = (e) => hoPtrDown(e); pl.move = (e) => hoPtrMove(e); pl.up = (e) => hoPtrUp(e); pl.key = (e) => hoKey(e);
  svg.addEventListener('pointerdown', pl.down, true); svg.addEventListener('pointermove', pl.move); svg.addEventListener('pointerup', pl.up); svg.addEventListener('pointercancel', pl.up);
  window.addEventListener('keydown', pl.key, true);
  pl.obs = new MutationObserver(() => { if (HO.pl === pl && !dock.querySelector('.ho-tray')) hoDone(); }); pl.obs.observe(dock, { childList: true });
  onCleanup(() => { if (HO.pl === pl) hoDone(true); });
  if (name) hoPut(name);
  emit('ho:place', { room, on: true });
}
// put an item out at a free spot (if it is not out) and select it
function hoPut(n) {
  const pl = HO.pl; if (!pl) return;
  if (!hoIsOut(n)) {
    const at = hoFreeSpot(n);
    if (hoIsBed(n)) { if (!S.beds.includes(n)) return; S.bedAt[n] = at; hoSync(); } else { S.decor[n].out = true; pl.pos[n] = at; pl.moved[n] = true; }
    markDirty(); SFX.pop(); hoRoomRedraw();
  }
  hoSelect(n);
}
function hoSelect(n) {
  const pl = HO.pl; if (!pl) return; pl.sel = n || null;
  document.querySelectorAll('svg.world .ho-ol').forEach((r) => r.classList.toggle('ho-sel', !!n && r.parentNode && r.parentNode.dataset.hoItem === n));
  hoTray(); hoCamSel();
}
// phones: once the tray has resized the scene, ease the camera to the selected item and redraw the tap rects at the new scale
function hoCamSel() {
  if (!isPhone() || !HO.pl) return; clearTimeout(HO.camT);
  HO.camT = setTimeout(() => { const pl = HO.pl; if (!pl || pl.drag) return; hoRoomRedraw(); if (pl.sel && hoIsOut(pl.sel)) { const [x, , w] = hoBox(pl.sel); phCamHome = x + w / 2; camTo(phCamHome, 0.5); } }, 150);
}
function hoTray() {
  const pl = HO.pl; if (!pl) return; const room = pl.room, sel = pl.sel;
  const away = room === 'house' ? hoOwned('house').filter((n) => !hmDecorOut(n)).concat(S.beds.filter((n) => !S.bedAt[n])) : hoOwned('yard').filter((n) => !hmDecorOut(n));
  const icon = (n) => (hoIsBed(n) ? art('item', n) : itemArt(n));
  setTray(room === 'yard' ? 'Arrange the yard' : 'Arrange the house', `<div class="ho-tray-in"><p class="small ho-hint">${sel ? `${esc(sel)}: ${isPhone() ? 'drag it, or tap where it should go.' : 'drag it, click where it should go, or use the arrow keys.'}` : isPhone() ? 'Tap a thing to pick it up. Then drag it, or tap where it should go.' : 'Click a thing to pick it up. Then drag it, or click where it should go.'}</p>
    <div class="ho-trow"><button class="btn yes" id="hoDone">Done</button><button class="btn" id="hoAway"${sel ? '' : ' disabled aria-disabled="true"'}>Put away</button></div>
    ${away.length ? `<div class="ho-put" role="group" aria-label="Put away things">${away.map((n) => `<button class="ho-putb" data-hoput="${esc(n)}" aria-label="Put out the ${esc(n)}"><span class="art">${icon(n)}</span><span class="nm">${esc(n)}</span></button>`).join('')}</div>` : ''}</div>`, { mini: true });
  const tr = dock.querySelector(':scope > .tray'); if (tr) tr.classList.add('ho-tray');
  $('#trayX').onclick = () => { SFX.click(); hoDone(); };
  $('#hoDone').onclick = () => { SFX.click(); hoDone(); };
  $('#hoAway').onclick = () => { if (pl.sel) hoAwaySel(); };
  dock.querySelectorAll('[data-hoput]').forEach((b) => { b.onclick = () => { SFX.click(); hoPut(b.dataset.hoput); }; });
}
function hoAwaySel() {
  const pl = HO.pl, n = pl && pl.sel; if (!n) return;
  if (!hoAway(n)) return; pl.sel = null; delete pl.pos[n]; hoRoomRedraw(); hoTray();
}
// put an item away (keeps its record). The last bed stays: someone has to nap somewhere
function hoAway(n) {
  if (hoIsBed(n)) {
    if (Object.keys(S.bedAt).length <= 1) { nope('Someone has to nap somewhere. Pop another bed in first.'); return false; }
    delete S.bedAt[n]; hoSync();
  } else { if (!S.decor[n]) return false; S.decor[n].out = false; Object.keys(HO.uses).forEach((id) => { if (HO.uses[id].name === n) hoFree(dogById(id) || { id }); }); }
  markDirty(); SFX.pop(); toast(`${n} is tucked away. It will keep.`); return true;
}
// move an item to a top-left (clamped) during placement; returns the spot
function hoMoveTo(n, x, y, redraw) {
  const pl = HO.pl, p = hoClamp(n, x, y);
  if (pl) { pl.pos[n] = p; pl.moved[n] = true; if (redraw !== false) hoRoomRedraw(); }
  return p;
}
function hoItems() { return hoOrder(hoOutIn(HO.pl.room)); }
function hoCycle(dir) { const l = hoItems(); if (!l.length) return; const i = l.indexOf(HO.pl.sel); hoSelect(l[(i + dir + l.length) % l.length]); }
function hoKey(e) {
  const pl = HO.pl; if (!pl || !modal.hidden || cur.mode !== 'yard') return;
  const inDock = e.target && e.target.closest && e.target.closest('#dock'); if (e.target && e.target.closest && e.target.closest('input,textarea,select')) return;
  const k = e.key; let done = true;
  if (k === 'Tab' && !inDock) hoCycle(e.shiftKey ? -1 : 1);
  else if (k.startsWith('Arrow')) { if (!pl.sel) hoCycle(1); else { const st = e.shiftKey ? 32 : 8, [x, y] = hoPos(pl.sel); hoMoveTo(pl.sel, x + (k === 'ArrowLeft' ? -st : k === 'ArrowRight' ? st : 0), y + (k === 'ArrowUp' ? -st : k === 'ArrowDown' ? st : 0)); } }
  else if ((k === 'Delete' || k === 'Backspace') && !inDock) hoAwaySel();
  else if (k === 'Escape' || (k === 'Enter' && !inDock)) hoDone();
  else done = false;
  if (done) { e.preventDefault(); e.stopImmediatePropagation(); }
}
function hoPtrDown(e) {
  const pl = HO.pl; if (!pl || (e.pointerType === 'mouse' && e.button !== 0)) return;
  const el = e.target.closest && e.target.closest('[data-ho-item]'), svg = pl.svg, w = toWorld(svg, e.clientX, e.clientY);
  if (el) {
    e.stopPropagation(); e.preventDefault(); const n = el.dataset.hoItem; if (pl.sel !== n) hoSelect(n);
    if (isPhone() && typeof psTipStart === 'function') psTipStart(e, n);
    pl.drag = { n, id: e.pointerId, w0: [w.x, w.y], c0: [e.clientX, e.clientY], p0: hoPos(n).slice(), moved: false };
    try { svg.setPointerCapture(e.pointerId); } catch (er) { /* none */ }
    return;
  }
  pl.ground = { id: e.pointerId, c0: [e.clientX, e.clientY] };
}
function hoPtrMove(e) {
  const pl = HO.pl, dr = pl && pl.drag; if (!dr || e.pointerId !== dr.id) return;
  if (!dr.moved && Math.hypot(e.clientX - dr.c0[0], e.clientY - dr.c0[1]) < 6) return; dr.moved = true;
  const w = toWorld(pl.svg, e.clientX, e.clientY), p = hoMoveTo(dr.n, dr.p0[0] + w.x - dr.w0[0], dr.p0[1] + w.y - dr.w0[1], false);
  const g = pl.svg.querySelector(`[data-ho-item="${CSS.escape(dr.n)}"]`); if (g) g.setAttribute('transform', `translate(${p[0] - dr.p0[0]} ${p[1] - dr.p0[1]})`);
}
function hoPtrUp(e) {
  const pl = HO.pl; if (!pl) return; const dr = pl.drag;
  if (dr && e.pointerId === dr.id) { pl.drag = null; if (dr.moved) { hoRoomRedraw(); if (isPhone()) { const [x, , w] = hoBox(dr.n); phCamHome = x + w / 2; } } return; }
  const gr = pl.ground; pl.ground = null;
  if (gr && gr.id === e.pointerId && pl.sel && e.type === 'pointerup' && Math.hypot(e.clientX - gr.c0[0], e.clientY - gr.c0[1]) < FB_DRAG) {
    const w = toWorld(pl.svg, e.clientX, e.clientY), [bw, bh] = hoSize(pl.sel); hoMoveTo(pl.sel, w.x - bw / 2, w.y - bh / 2); SFX.pop();
  }
}
// Done: save the moved spots, one 'decorate' act if anything moved, redraw, back to the dock
function hoDone(fromCleanup) {
  const pl = HO.pl; if (!pl) return; HO.pl = null;
  const svg = pl.svg; svg.removeEventListener('pointerdown', pl.down, true); svg.removeEventListener('pointermove', pl.move); svg.removeEventListener('pointerup', pl.up); svg.removeEventListener('pointercancel', pl.up);
  window.removeEventListener('keydown', pl.key, true); if (pl.obs) pl.obs.disconnect(); svg.classList.remove('ho-placing');
  const moved = Object.keys(pl.moved).filter((n) => pl.pos[n] && hoIsOut(n)).filter((n) => { const p = pl.pos[n]; if (hoIsBed(n)) { const o = S.bedAt[n]; if (o[0] === p[0] && o[1] === p[1]) return false; S.bedAt[n] = p.slice(); return true; } S.decor[n].at = p.slice(); return true; });
  busy = false;
  if (moved.length) { markDirty(); trackAct('decorate', { room: pl.room, moved: moved.length }); }
  emit('ho:place', { room: pl.room, on: false });
  if (fromCleanup || cur.mode !== 'yard') return;
  hoRoomRedraw(); const pk = $('#pack'); if (pk) { pk.innerHTML = packSVG(); bindPack(); }
  if (S.sleeping && S.place === 'house') { dogTo(...napSpot(), 0); renderDog('sleep', 'right', true); showZzz(true); }
  hoZzzSync(); phCamHome = pl.cam; if (isPhone()) camTo(phCamHome, 0.6);
  if (dock.querySelector('.ho-tray')) S.sleeping ? sleepTray() : dockIdle();
  if (moved.length) toast(pl.room === 'yard' ? 'The yard looks just right.' : 'The house looks just right.', 'good');
}

/* ---------------- popups and sheets ---------------- */
function hoFurnPop(name) {
  const D = HM_DECOR[name]; if (!D) return; const f = HO.fav[name] || {}, top = Object.keys(f).filter((id) => dogById(id)).sort((a, b) => f[b] - f[a]).slice(0, 2).map((id) => dogById(id).name);
  const fav = top.length ? `Favourite of: ${top.join(' and ')}.` : 'Nobody has claimed it yet. Give it a minute.';
  const p = openModal(esc(name), `<div class="hm-pop"><span class="art hm-art">${art('item', name)}</span><p>${esc(D.story)}</p><p class="small ho-fav">${esc(fav)}</p></div>`, { cls: 'hm-decor-pop ho-furn-pop', foot: '<button class="btn" id="hoMove">Move</button><button class="btn yes" id="hmAway">Put away</button>' });
  $('#hoMove', p).onclick = () => { SFX.click(); closeModal(); hoPlaceStart(name); };
  $('#hmAway', p).onclick = () => { SFX.click(); closeModal(); if (hoAway(name)) hoRoomRedraw(); };
}
function hoBedsCard(b, inHouse) {
  const n = b.n, who = S.dogs.filter((d) => hoBedFor(d) === n), many = S.dogs.length > 1;
  let act;
  if (!inHouse) act = `<button class="btn yes" data-usebed="${esc(n)}">Put in the house</button>`;
  else if (many) act = `<span class="small">${who.length ? esc(who.map((d) => d.name).join(' and ')) + ' naps here' : 'Nobody naps here yet'}</span><div class="ho-bedchips" role="group" aria-label="Who naps on the ${esc(n)}">${S.dogs.map((d) => `<button class="ho-dchip" data-bedfor="${esc(d.id + '|' + n)}" aria-pressed="${who.includes(d)}" aria-label="${esc(d.name)} naps on the ${esc(n)}"><span class="hd">${headSVG(d)}</span><span class="nm">${esc(d.name)}</span></button>`).join('')}</div>`;
  else act = n === S.bed ? '<span class="chip own">In use</span>' : `<button class="btn" data-bedfor="${esc(S.activeId + '|' + n)}">Nap here</button>`;
  return `<div class="sitem"><span class="art">${art('item', n)}</span><b>${esc(n)}</b><span class="desc">House nap +${Math.round(b.bonus * 100)}% (plus +25% indoors)</span>${act}</div>`;
}

/* ---------------- shop (Barkitecture Decor and Furniture tabs) ---------------- */
function hoShopItems(kind) {
  const it = (n) => { const D = HM_DECOR[n]; return { cat: kind, n, price: D.price, bond: D.bond || 1, desc: D.story }; };
  const names = Object.keys(HM_DECOR).filter((n) => HM_DECOR[n].v27 && HM_DECOR[n].kind === kind);
  if (kind === 'furniture') return names.map(it);
  return [{ head: 'For the yard' }].concat(names.filter((n) => hoRoomOf(n) === 'yard').map(it), [{ head: 'For the house' }], names.filter((n) => hoRoomOf(n) === 'house').map(it));
}

/* ---------------- events, watchdog, test hook ---------------- */
on('game:ready', () => { HO.uses = {}; HO.pl = null; hoSync(); });
on('dog:added', () => setTimeout(hoSync, 0));
on('yard:enter', () => {
  hoSync(); HO.lit = isNight();
  if (S.place !== 'house') HO.uses = {}; else Object.keys(HO.uses).forEach((id) => { if (id === S.activeId || !dogById(id)) delete HO.uses[id]; });
  hoZzzSync(); fbPackNapFit();
  const pend = HO.pending; HO.pending = null;
  if (pend && pend.room === S.place && Date.now() - pend.t < 10000) setTimeout(() => { if (cur.mode === 'yard' && S.place === pend.room && !HO.pl) hoPlaceStart(pend.name || undefined, pend.room); }, 60);
  clearInterval(HO.watch); // the idle can be dropped without idleEnd (busy, a nap): switch the front layer off then
  HO.watch = setInterval(() => { if (!S || cur.mode !== 'yard') return; const u = HO.uses[S.activeId]; if (u && (!IDLE.act || IDLE.act.name !== 'furn')) hoUseEnd(D()); }, 400);
  onCleanup(() => clearInterval(HO.watch));
});
// lit things (String Lights, Moon Lamp, Window Seat) glow after dark: redraw the room when night comes or goes
on('scene:redraw', () => {
  if (!S || cur.mode !== 'yard' || HO.pl || (S.place !== 'yard' && S.place !== 'house') || HO.lit === isNight()) return; HO.lit = isNight();
  if (hoOutIn(S.place).some((n) => HM_DECOR[n] && HM_DECOR[n].lit)) hoRoomRedraw();
});
function hoExpose() {
  if (!window.__paw) return;
  window.__paw.ho = {
    napSpot: () => napSpot(), bedFor: (id) => hoBedFor(id ? dogById(id) : (S && S.dog)), room: (n) => hoRoomOf(n), place: (n) => hoPlaceStart(n), zones: HO_ZONES, specs: HM_DECOR,
    sync: () => { hoSync(); return { bed: S.bed, bedAt: S.bedAt, bedOf: S.bedOf }; },
    get placing() { return HO.pl ? { room: HO.pl.room, sel: HO.pl.sel, moved: Object.keys(HO.pl.moved) } : null; },
    move: (n, x, y) => { if (HO.pl) return hoMoveTo(n, x, y); const p = hoClamp(n, x, y); if (hoIsBed(n)) { if (S.bedAt[n]) S.bedAt[n] = p; } else if (S.decor[n]) S.decor[n].at = p; markDirty(); hoRoomRedraw(); return p; },
    done: () => hoDone(), select: (n) => hoSelect(n), pos: (n) => hoPos(n).slice(), box: (n) => hoBox(n), free: (id) => hoFree(dogById(id) || id),
    use: (id, name, spot) => { const d = dogById(id); if (!d) return false; if (!spot) spot = Object.keys(hoSpots(name))[0]; if (d.id !== S.activeId) return hoPackUse(d, name, spot); if (IDLE.act) { IDLE.steps = []; idleEnd(); } HO.want = { name, spot }; idleStart('furn'); return true; },
    uses: () => JSON.parse(JSON.stringify(HO.uses)), acts: () => HO.acts.slice(), hold: (on) => { HO.noPack = !!on; }, spot: (n, k) => hoSpot(n, k), spots: (n) => Object.keys(hoSpots(n)), freeSpot: (n) => hoFreeSpot(n), rug: HO_RUG_NAPS
  };
}
on('game:ready', () => setTimeout(hoExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.ho || !window.__paw.ho.sync) hoExpose(); });
setTimeout(hoExpose, 0);
