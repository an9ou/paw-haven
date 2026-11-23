/* ======================= v2.33 "Helping paws": 60b_sleep.js (tag sl, V233.md 4) =======================
   The sleepover. My side: a dog goes to a friend's yard for the night (the friend row's "..." pop and the visit's Sleepover button open the
   sheet: who can go, who stays home with a kind line), one a Japan day to anyone; it comes home by breakfast with a diary page and a picture
   (slHome). My dog stays in my game all day: nothing is hidden, locked or changed (the fiction: it slips out at night and is back by breakfast).
   The save keeps only the recipe in S.hp.sl (about 300 bytes: no pixels, the picture is drawn from it at display time, slPicSVG).
   The friend's side: HP_DO.sleep turns a sleep act into a guest in S.hp.gu (at most HP_GUESTS a Japan day: a third waits unclaimed for
   tomorrow) and a postcard; the guests stand in my home yard (#hpGuests, before #pack like #yvHost) with the friend ribbon and a tag chip, play
   with my leader the first time, have a card with Pet (once) and are gone on the next Japan day (no goodbye: a guest is never a dog to keep).
   No coins. Sounds: SFX.whoosh (sent), SFX.bark (a guest), PawAudio.stinger('discover') (home). Test hook: window.__paw.hp.sl. */
// the guests' preferred spots (feet x, y, facing, scale as PACK_SPOTS; the drawn scale is the pack's own at that depth). Each guest takes the
// free spot nearest its own that is clear of every dog, the bowl, the mailbox, a yard visitor, the place buttons and the chips, and on a phone
// fits in one crop with my leader (slSpot), never over or under it; the phone camera then keeps them in view (slCropFit). Phone check: V233.md 4.1
const HP_SPOTS = [[600, 456, 'left', 0.56], [258, 430, 'right', 0.55]];
const SLV = { busy: false, came: [], drawn: [], tick: 0, play: 0, spots: [] }; // spots: the drawn guests' x spans (the one-crop rule) // came: sleepovers home this load; drawn: the guests in the scene { g, d, x, y, face, k, box, tag }
const slToday = () => jstISO();
function slMoon() { let s = ''; try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.moon === 'function') s = P.FRIENDS.moon(); } catch (e) { s = ''; } return s || ICON('zzz'); } // TODO art fallback
const slName = (pair) => frPairName(pair) || tt('fr.a_friend', 'A friend');

/* ---------------- who may go (V233.md 4) ---------------- */
// '' = may go; else the kind line for why this dog stays home tonight
function slWhy(d) {
  if (!d) return tt('hp.no_card', '{name} stays home tonight.', { name: '' });
  if (typeof isNursing === 'function' && isNursing(d)) return tt('hp.no_pups', '{name} stays with the puppies tonight.', { name: d.name });
  if (typeof isExpecting === 'function' && isExpecting(d)) return tt('hp.no_expect', '{name} is expecting and rests at home.', { name: d.name });
  if (dogMonths(d) < 3) return tt('hp.no_little', '{name} is too little for sleepovers. Yard play only.', { name: d.name });
  if (!frCardOf(d)) return tt('hp.no_card', '{name} stays home tonight.', { name: d.name });
  return '';
}
// one sleepover a Japan day to anyone: mine (S.hp.slDay) or one a friend row says went today (sent on another device)
function slSentToday() {
  if (!S || !S.hp) return false;
  if (S.hp.slDay === slToday()) return true;
  return ((S.fr && S.fr.cache && S.fr.cache.friends) || []).some((f) => f && frSentToday(f.fid, 'sleep'));
}
const slTonight = () => (S && S.hp ? S.hp.sl.slice().reverse().find((r) => r && r.day === slToday()) || null : null);
function slUsed() {
  const r = slTonight(), d = r && dogById(r.my);
  if (r) toast(tt('hp.sleep_used', "One sleepover a night. {dog} is at {name}'s tonight.", { dog: d ? d.name : r.n, name: slName(r.f) }), 'good');
  else toast(tt('hp.sleep_done_btn', 'Sleepover sent'), 'good');
}
// the visit's button (50_friends.js frBtns, before Go home) and the friend row's "..." pop row (frRowHTML, above Remove friend)
function slBtnHTML() {
  if (typeof hpOn !== 'function' || !hpOn()) return '';
  const done = slSentToday();
  return `<button class="btn sl-vbtn${done ? ' soon' : ''}" type="button" id="hpSleepBtn"${done ? ' aria-disabled="true"' : ''}><span class="sl-moon" aria-hidden="true">${slMoon()}</span><span>${esc(done ? tt('hp.sleep_done_btn', 'Sleepover sent') : tt('hp.sleep_btn', 'Sleepover'))}</span></button>`;
}
function slRowHTML() {
  if (typeof hpOn !== 'function' || !hpOn()) return '';
  const done = slSentToday();
  return `<button class="btn sl-rowbtn${done ? ' soon' : ''}" type="button" data-fr="sleep"${done ? ' aria-disabled="true"' : ''}><span class="sl-moon" aria-hidden="true">${slMoon()}</span><span>${esc(done ? tt('hp.sleep_done_btn', 'Sleepover sent') : tt('hp.sleep_row', 'Sleepover tonight'))}</span></button>`;
}
function slTap(fid) {
  if (!S || !fid || typeof hpOn !== 'function' || !hpOn()) return null;
  if (slSentToday()) { SFX.click(); slUsed(); return null; }
  return slOpen(fid);
}

/* ---------------- the sheet ---------------- */
function slSheetHTML(fid) {
  const f = frFriend(fid), name = slName(f && f.name);
  const rows = S.dogs.map((d) => {
    const why = slWhy(d), head = `<span class="sl-head" aria-hidden="true">${headSVG(d)}</span>`;
    return why ? `<div class="sl-dog no" data-slno="${esc(d.id)}">${head}<span class="sl-dt"><b>${esc(d.name)}</b><span class="small">${esc(why)}</span></span></div>`
      : `<button class="sl-dog" type="button" data-sldog="${esc(d.id)}">${head}<span class="sl-dt"><b>${esc(d.name)}</b></span><span class="sl-go" aria-hidden="true">${slMoon()}</span></button>`;
  }).join('');
  return `<div class="sl-sheet"><div class="sl-top"><span class="sl-art" aria-hidden="true">${slMoon()}</span><p>${esc(tt('hp.sleep_lead', "Who goes to {name}'s yard tonight? Back by morning.", { name }))}</p></div><div class="sl-dogs">${rows}</div></div>`;
}
function slOpen(fid) {
  if (!S || !fid || !hpOn()) return null;
  SFX.click(); v233Fields(S);
  const f = frFriend(fid), name = slName(f && f.name);
  const p = openModal(esc(tt('hp.sleep_title', 'Sleepover tonight')), slSheetHTML(fid), { cls: 'frsheet hp-sleep' });
  p.querySelectorAll('[data-sldog]').forEach((b) => {
    b.onclick = async () => {
      SFX.click();
      const d = dogById(b.dataset.sldog); if (!d || SLV.busy || slWhy(d)) return;
      const ok = await confirmIn(p, esc(tt('hp.sleep_ask', "Send {dog} for a sleepover at {name}'s yard?", { dog: d.name, name })), esc(tt('hp.sleep_go', 'Sleepover!')), esc(tt('hp.sleep_no', 'Not tonight')));
      if (ok) slSend(fid, d, p);
    };
  });
  p.querySelectorAll('[data-slno]').forEach((r) => { r.onclick = () => SFX.click(); });
  return p;
}

/* ---------------- the send and the recipe ---------------- */
// the recipe (no pixels, V233.md 4): { day, fid, my, n, k, me, f, h, s, de, ld, home: 0 }
function slRecipe(fid, d, raw) {
  const y = raw && typeof raw === 'object' ? raw : null, f = frFriend(fid);
  const pair = y && Array.isArray(y.name) ? y.name.slice(0, 2) : f && Array.isArray(f.name) ? f.name.slice(0, 2) : null;
  const h = y && Number.isInteger(y.house) && FR_HOUSES[y.house] ? y.house : -1;
  const de0 = y && Array.isArray(y.decor) ? y.decor.find((x) => x && Number.isInteger(x.i) && FR_DECOR[x.i] && frDecorLive(FR_DECOR[x.i])) : null;
  const ld = y && Array.isArray(y.dogs) && y.dogs[0] && typeof y.dogs[0] === 'object' && Number.isInteger(y.dogs[0].b) ? Object.assign({}, y.dogs[0]) : null;
  return { day: slToday(), fid, my: d.id, n: d.name, k: d.key, me: frCardOf(d), f: pair, h, s: y && SEASONS.includes(y.season) ? y.season : seasonNow(), de: de0 ? de0.i : -1, ld, home: 0 };
}
// the friend's snapshot first (today's copy, else GET /friends/yard; { yard: null } is fine: a generic page), then the send. Every effect waits for { ok: true }
async function slSend(fid, d, p) {
  if (!S || SLV.busy || !hpOn() || slSentToday()) return 'busy';
  const me = frCardOf(d), f = frFriend(fid), name = slName(f && f.name); if (!me || slWhy(d)) return 'no';
  SLV.busy = true;
  let raw = null, r = null;
  const c = S.fr.yards && S.fr.yards[fid];
  if (c && c.day === frToday() && c.yard) raw = c.yard;
  else {
    try { r = await frApi('GET', '/friends/yard?fid=' + encodeURIComponent(fid)); } catch (e) { r = null; }
    if (r && r.ok && r.data && r.data.yard && typeof r.data.yard === 'object') { raw = r.data.yard; frYardKeep(fid, raw); }
  }
  r = null;
  try { r = await frApi('POST', '/friends/send', { fid, kind: 'sleep', data: { dog: me } }); } catch (e) { r = null; }
  SLV.busy = false;
  const shut = () => { if (!modal.hidden && modal.querySelector('.hp-sleep')) closeModal(); };
  if (r && r.ok) {
    v233Fields(S); hpDay(); frMarkSent(fid, 'sleep');
    S.hp.slDay = slToday(); S.hp.sl.push(slRecipe(fid, d, raw)); if (S.hp.sl.length > HP_SL_KEEP) S.hp.sl = S.hp.sl.slice(-HP_SL_KEEP);
    markDirty(); shut(); slSync();
    try { SFX.whoosh(); } catch (e) { /* audio off */ }
    toast(tt('hp.sleep_sent', '{dog} packed a toothbrush. See you in the morning!', { dog: d.name }), 'good');
    return 'ok';
  }
  const err = frErr(r);
  if (err === 'limit') { frMarkSent(fid, 'sleep'); S.hp.slDay = slToday(); markDirty(); shut(); slSync(); slUsed(); return 'limit'; } // sent on another device tonight
  if (err === 'bad') { shut(); hpGone(); toast(tt('hp.failed', "That didn't reach {name}. Try again later.", { name }), 'bad'); slSync(); return 'bad'; }
  if (r && r.status === 404) { shut(); toast(tt('fr.not_friend', 'That friend is not on your list any more.'), ''); return 'gone'; }
  toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad');
  return 'off';
}
// the visit's buttons and an open Friends sheet show "Sleepover sent" at once
function slSync() {
  if (cur.mode === 'fryard' && typeof frBtns === 'function') { frBtns(); if (typeof frScan === 'function') frScan(); }
  const P = !modal.hidden && modal.querySelector('.panel.frsheet .fr-sheet'); if (P && FR.menu && typeof frRowPatch === 'function') frRowPatch(P.closest('.panel'), FR.menu);
}

/* ---------------- the friend's side: a guest (V233.md 4.1) ---------------- */
function slGuestDog(g) {
  if (!g || !g.dog) return null;
  try { return dcDog({ id: 'hp:' + g.id, name: Array.isArray(g.f) ? g.f : [0, 0], dogs: [g.dog] }, 0); } catch (e) { return null; }
}
const slGuests = () => (S && S.hp && Array.isArray(S.hp.gu) ? S.hp.gu.filter((g) => g && g.day === slToday() && slGuestDog(g)) : []);
HP_DO.sleep = (ev) => {
  const a = ev.data || {}, dog = a.dog;
  if (!dog || typeof dog !== 'object' || Array.isArray(dog) || !Number.isInteger(dog.b)) return true; // a broken act: claimed and dropped
  const today = slToday(); S.hp.gu = S.hp.gu.filter((g) => g && g.day === today);
  if (S.hp.gu.length >= HP_GUESTS) return false; // a third guest waits (unclaimed) for tomorrow
  const g = { id: ev.id, fid: ev.from.fid, f: Array.isArray(ev.from.name) ? ev.from.name.slice(0, 2) : [0, 0], dog: Object.assign({}, dog), day: today, pet: 0, pl: 0, t: Date.now() };
  const d = slGuestDog(g); if (!d) return true; // a breed this copy does not know yet: nothing to draw
  S.hp.gu.push(g); S.hp.host++; markDirty();
  const name = slName(g.f);
  if (typeof mailPush === 'function') mailPush({ kind: 'postcard', id: 'hp_guest_' + ev.id, from: name, frPaw: true, title: tt('hp.g_title', 'A sleepover guest!'), text: tt('hp.g_text', "{dog} from {name}'s yard is staying over today. Say hello in your yard!", { dog: d.name, name }) });
  setTimeout(() => { if (slHere()) slDraw(); }, 0); // here now: it comes in at once
  return true;
};

/* ---------------- the guests in my home yard ---------------- */
function slHere() { return !!(S && cur.mode === 'yard' && S.place === 'yard' && !(typeof HO !== 'undefined' && HO.pl)); }
// the drawn scale at feet y (as a pack dog there) and the tag's font size (phones: 13 px or more on screen)
const slK = (d, y) => rmScale(y) * sizeK(d);
function slTagFs() { return isPhone() ? Math.max(19, dcTagFs(1)) : 19; }
// one guest's drawing with its feet at 0, 0 (the group is moved to the spot): the dog, then the tag chip with the ribbon pinned on its left end
// the tag's text in one line, or two when it is wider than the dog (split where the two lines are most even; no spaces: in the middle)
function slTagLines(txt, fs, max) {
  const W = (t) => frTextW(t, fs, "'Caveat',cursive", 700); if (W(txt) <= max) return [txt];
  const cut = [...txt.matchAll(/ /g)].map((m) => m.index); let best = null;
  (cut.length ? cut : [Math.ceil(txt.length / 2)]).forEach((i) => { const a = txt.slice(0, i).trim(), b = txt.slice(i).trim(), v = Math.max(W(a), W(b)); if (a && b && (!best || v < best.v)) best = { v, l: [a, b] }; });
  return best ? best.l : [txt];
}
function slGuestInner(g, d, k, face, pose) {
  const fs = slTagFs(), name = slName(g.f), lines = slTagLines(tt('hp.g_tag', '{dog}, from {name}', { dog: d.name, name }), fs, Math.max(150, 190 * k)), tw = Math.max(...lines.map((l) => frTextW(l, fs, "'Caveat',cursive", 700)));
  const rb = fs * 1.5, w = tw + fs * 1.1 + rb * 0.7, h = fs * (0.42 + lines.length), x0 = -w / 2, tx = x0 + rb * 0.7 + (w - rb * 0.7) / 2;
  const dog = `<g class="sl-gart" transform="scale(${k.toFixed(3)}) translate(-430 -500)">${place(dogSVG(d, wetOpt(d, { pose, outfit: d.outfit, facing: face })), DX, DY, DW, DH)}</g>`;
  const tag = `<g class="sl-tag" pointer-events="none" transform="translate(0 ${f1(fs * 0.25)})"><rect x="${f1(x0)}" y="0" width="${f1(w)}" height="${f1(h)}" rx="${f1(fs * 0.42)}" fill="#FFF3DA" stroke="#5B3D32" stroke-width="2"/>`
    + `<text text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${f1(fs)}" fill="#5B3D32">${lines.map((l, i) => `<tspan x="${f1(tx)}" y="${f1(fs * (0.98 + i))}">${esc(l)}</tspan>`).join('')}</text>`
    + `<g class="sl-rib">${place(frRibbonSVG(), x0 - rb * 0.3, h / 2 - rb / 2, rb, rb)}</g></g>`;
  return dog + tag;
}
function slGuestSVG(o, i) {
  const { g, d } = o, name = slName(g.f);
  return `<g class="hp-guest hot" id="hpGuest${i}" data-slg="${g.id}" tabindex="0" role="button" transform="translate(${f1(o.x)} ${f1(o.y)})" aria-label="${esc(tt('hp.g_aria', '{dog} from {name}, sleeping over. Tap to say hello.', { dog: d.name, name }))}">`
    + `<rect class="sl-hit" x="${f1(o.hit[0])}" y="${f1(o.hit[1])}" width="${f1(o.hit[2])}" height="${f1(o.hit[3])}" fill="transparent"/><g class="sl-in">${slGuestInner(g, d, o.k, o.face, o.pose)}</g></g>`;
}
// world boxes [x0, y0, x1, y1] of what a guest must keep clear of (the drawn dog and its tag): every dog in the scene, a yard visitor, the
// Dog Card visitors, the mailbox, the bowl, every small tappable thing, the place buttons and chips
function slObstacles(svg, M) {
  const out = [], wb = (el, keep) => { const b = rmWorldBox(svg, M, el); if (b && b[2] > 2 && b[3] > 2) { const o = [b[0], b[1], b[0] + b[2], b[1] + b[3]]; if (keep) o.keep = 1; out.push(o); } };
  svg.querySelectorAll('#visitorG, #mailboxG, #bowlG, #dcVis .dcvis:not([style*="none"])').forEach((el) => { wb(el, true); if (!/^(mailboxG|bowlG)$/.test(el.id)) out[out.length - 1].dog = 1; }); // my own dogs: slSpot keeps clear of my leader, the pack steps aside (rmValidate); a yard visitor stands still
  (RM.no || []).forEach((b) => { if (/^hpGuest/.test(b[4]) || b[4] === 'scene' || b[4] === 'dctag') return; const o = [b[0], b[1], b[0] + b[2], b[1] + b[3]]; if (b[4] === 'house' || b[4] === 'houseG' || b[2] * b[3] >= RM_HUGE) o.big = 1; out.push(o); });
  ['#status', '#ddWish:not([hidden])', '#placeBtns .btn', '#phPeek', '#rmLookL', '#rmLookR', '#msBtn'].forEach((q) => document.querySelectorAll(q).forEach((el) => { if (el.hidden || !el.getClientRects().length) return; wb(el); }));
  return out;
}
// the visible world window: [x0, y0, x1, y1] (phones: the camera's crop above the bar)
function slView(svg, M) {
  const vr = view.getBoundingClientRect(), bar = $('#bar'), bt = bar && !bar.hidden && bar.getClientRects().length ? bar.getBoundingClientRect().top : vr.bottom;
  const a = new DOMPoint(vr.left, vr.top).matrixTransform(M), b = new DOMPoint(vr.right, Math.min(vr.bottom, bt)).matrixTransform(M);
  return [Math.max(0, a.x), Math.max(0, a.y), Math.min(1000, b.x), Math.min(600, b.y)];
}
// a guest's footprint relative to its feet (the dog and the tag), per facing: measured once from its own drawing
function slMeasure(svg, M, g, d, k, pose) {
  const out = {};
  ['left', 'right'].forEach((face) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'g'); t.setAttribute('transform', 'translate(500 300)'); t.setAttribute('opacity', '0'); t.innerHTML = slGuestInner(g, d, k, face, pose); svg.appendChild(t);
    const a = rmWorldBox(svg, M, t.querySelector('.sl-gart')) || [0, 0, 0, 0], b = rmWorldBox(svg, M, t.querySelector('.sl-tag')) || [0, 0, 0, 0]; t.remove();
    out[face] = { dog: [a[0] - 500, a[1] - 300, a[0] + a[2] - 500, a[1] + a[3] - 300], tag: [b[0] - 500, b[1] - 300, b[0] + b[2] - 500, b[1] + b[3] - 300] };
  });
  return out;
}
const slHit = (a, b, m) => a[0] - m < b[2] && a[2] + m > b[0] && a[1] - m < b[3] && a[3] + m > b[1];
const slAt = (r, x, y) => [r[0] + x, r[1] + y, r[2] + x, r[3] + y];
// the leader's drawn box now (world), for the one-crop rule
function slLeadBox(svg, M) { const el = rmEl(D()) || $('#dogG'); const b = el ? rmWorldBox(svg, M, el) : null; return b ? [b[0], b[1], b[0] + b[2], b[1] + b[3]] : [343, 344, 517, 505]; }
// where guest i stands: the free spot nearest HP_SPOTS[i] (see HP_SPOTS); null: none clear
function slSpot(i, ext, ob, lead, win, W, lax) { // lax: only the dogs, a yard visitor, the mailbox and the bowl keep it off (its tag may touch the rest)
  const pref = HP_SPOTS[i] || HP_SPOTS[0], z = rmZoneOf(S.place);
  let best = null;
  for (let y = z.y0 + 6; y <= z.y1; y += 6) {
    for (let x = z.x0; x <= z.x1; x += 6) {
      if (z.poly && typeof grIn === 'function' && !grIn(z.poly, x, y)) continue;
      if (rmHard(x, y)) continue; // the feet: never on the house, the garden or anything tappable
      const face = x < (lead[0] + lead[2]) / 2 ? 'right' : 'left', e = ext[face], A = slAt(e.dog, x, y), T = slAt(e.tag, x, y);
      if (A[0] < win[0] + 4 || A[2] > win[2] - 4 || T[0] < win[0] + 4 || T[2] > win[2] - 4 || T[3] > win[3] - 2 || A[1] < win[1] + 2) continue;
      if (ob.some((o) => (lax ? ((lax === 2 ? o.dog : o.keep) || (o.big && y < o[3] + 6)) && slHit(A, o, 2) : o.big ? y < o[3] + 6 && (slHit(A, o, 2) || slHit(T, o, 2)) : slHit(A, o, 4) || slHit(T, o, 4)))) continue; // a big thing (the dog house): only in front of it
      if (slHit(A, lead, 4) || slHit(T, lead, 4)) continue; // never over or under my leader
      if (W) { const L = Math.min(lead[0], A[0], T[0], ...SLV.spots.map((q) => q[0])), R = Math.max(lead[2], A[2], T[2], ...SLV.spots.map((q) => q[1])); if (R - L > W - 16) continue; } // phones: in one crop with my leader
      const s = -Math.hypot(x - pref[0], (y - pref[1]) * 1.4);
      if (!best || s > best.s) best = { s, x, y, face, A, T };
    }
  }
  return best;
}
// draw today's guests (yard:enter, a guest arriving, a new Japan day). A guest drawn for the first time plays with my leader
function slDraw() {
  const old = $('#hpGuests', view); if (old) old.remove();
  SLV.drawn = []; SLV.spots = [];
  if (!slHere()) return [];
  const list = slGuests(); if (!list.length) return [];
  const svg = $('#view > svg.world'), pack = svg && $('#pack', svg), M0 = svg && svg.getScreenCTM(); if (!pack || !M0) return [];
  const M = M0.inverse(); rmScan();
  const ob = slObstacles(svg, M), lead = slLeadBox(svg, M), ph = isPhone(), vb = svg.viewBox.baseVal;
  // phones: anywhere the camera can show together with my leader (slCropFit moves the camera there); desktop: the view
  const v = slView(svg, M), W = ph && vb && vb.width ? vb.width : 0, win = ph ? [0, v[1], 1000, v[3]] : v;
  list.slice(0, HP_GUESTS).forEach((g, i) => {
    const d = slGuestDog(g), pref = HP_SPOTS[i] || HP_SPOTS[0], k = slK(d, pref[1]), pose = g.pet ? 'happy' : 'sit', ext = slMeasure(svg, M, g, d, k, pose);
    let at = slSpot(i, ext, ob, lead, win, W) || slSpot(i, ext, ob, lead, [0, 0, 1000, 600], 0) || slSpot(i, ext, ob, lead, [0, 0, 1000, 600], 0, true) || slSpot(i, ext, ob, lead, [0, 0, 1000, 600], 0, 2); // no room in one crop: elsewhere in the yard (the camera pans to it)
    if (!at) { const e = ext[pref[2]]; at = { x: pref[0], y: pref[1], face: pref[2], A: slAt(e.dog, pref[0], pref[1]), T: slAt(e.tag, pref[0], pref[1]) }; }
    const o = { g, d, x: at.x, y: at.y, face: at.face, k, pose, box: at.A, tag: at.T, hit: [at.A[0] - at.x, at.A[1] - at.y, at.A[2] - at.A[0], at.A[3] - at.A[1]] };
    SLV.drawn.push(o); SLV.spots.push([Math.min(at.A[0], at.T[0]), Math.max(at.A[2], at.T[2])]);
    const kA = at.A.slice(), kT = at.T.slice(); kA.keep = 1; kT.keep = 1; kA.dog = 1; ob.push(kA, kT); // the next guest keeps clear of this one and its tag
  });
  const keep = SLV.drawn.map((o) => { const [x0, y0, x1, y1] = o.box, h = (x1 - x0) / 2; return [0, 1].map((j) => `<rect class="hot sl-keep" x="${f1(x0 + j * h)}" y="${f1(y0)}" width="${f1(h)}" height="${f1(y1 - y0)}" fill="none" pointer-events="none"/>`).join(''); }).join(''); // the roam keeps the pack off each half (small things: 8%)
  pack.insertAdjacentHTML('beforebegin', `<g id="hpGuests">${keep}${SLV.drawn.map((o, i) => slGuestSVG(o, i)).join('')}</g>`);
  document.querySelectorAll('#hpGuests .hp-guest').forEach((el) => {
    const open = (e) => { if (e) { e.stopPropagation(); e.preventDefault(); } slCard(+el.dataset.slg); };
    el.addEventListener('click', open); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') open(e); });
  });
  try { rmScan(); if (typeof rmValidate === 'function') rmValidate(true); } catch (e) { /* roam off */ } // the pack keeps off them (hot)
  const fresh = SLV.drawn.filter((o) => !o.g.pl);
  if (fresh.length) { fresh.forEach((o) => { o.g.pl = 1; }); markDirty(); slPlay(fresh[0]); }
  slCropFit();
  return SLV.drawn;
}
// phones: the home camera keeps my leader's spot and the guests in view together (as phHomeRefit keeps a yard visitor), after its own fit
function slCropFit() {
  if (!isPhone() || !slHere() || !SLV.drawn.length) return;
  const svg = $('#view > svg.world'), vb = svg && svg.viewBox.baseVal; if (!vb || !vb.width) return;
  const r = rmSt(D()), T = rmTapBox(r.hx, r.hy, rmK(r)), half = vb.width / 2;
  let L = T[0] - 8, R = T[0] + T[2] + 8;
  SLV.spots.forEach((q) => { const l = Math.min(L, q[0] - 8), r2 = Math.max(R, q[1] + 8); if (r2 - l <= vb.width) { L = l; R = r2; } }); // as many guests as fit, the first first
  const cx = clamp(clamp(phHomeCx, R - half, L + half), half, 1000 - half); if (Math.abs(cx - phHomeCx) < 1) return;
  phHomeCx = cx; if (!S.sleeping) { phCamHome = cx; camCx = cx; } camApply(camCx);
}
if (typeof phHomeRefit === 'function') { const slRefit0 = phHomeRefit; phHomeRefit = function () { slRefit0.apply(this, arguments); try { slCropFit(); } catch (e) { /* the yard is changing */ } }; } // eslint-disable-line no-func-assign
// the first meeting: my leader and the guest (already beside it) both bow, then happy with two hearts, a bark.
// Reduced motion: no walk; the guest's bow and one heart
function slGuestPose(o, pose) { const el = $(`#hpGuests [data-slg="${o.g.id}"] .sl-in`); o.pose = pose; if (el) el.innerHTML = slGuestInner(o.g, o.d, o.k, o.face, pose); }
function slHearts(x, y, n) { fxText('♥', x, y); if (n > 1) setTimeout(() => fxText('♥', x + 22, y - 26), 200); }
function slPlay(o) {
  const now = Date.now(); if (now - SLV.play < 1500) return; SLV.play = now;
  const hx = o.x, hy = o.box[1] - 10;
  try { SFX.bark(BARK[o.d.key] || 1); } catch (e) { /* audio off */ }
  if (motionOff()) { slGuestPose(o, 'bow'); slHearts(hx, hy, 1); setTimeout(() => { if (slHere() && SLV.drawn.includes(o)) slGuestPose(o, o.g.pet ? 'happy' : 'sit'); }, 1600); return; }
  const lead = D();
  const bow = () => {
    const side = rmSt(lead).x < o.x ? -1 : 1;
    if (!slHere() || !SLV.drawn.includes(o)) return;
    slGuestPose(o, 'bow'); try { rmSet(lead, { pose: 'bow', face: side < 0 ? 'right' : 'left' }); } catch (e) { /* busy */ }
    setTimeout(() => {
      if (!slHere() || !SLV.drawn.includes(o)) return;
      slGuestPose(o, 'happy'); try { rmSet(lead, { pose: 'happy' }); } catch (e) { /* busy */ }
      slHearts(hx, hy, 2); const h = rmHead(lead); slHearts(h.x, h.y - 20, 2);
      setTimeout(() => { if (!slHere()) return; if (SLV.drawn.includes(o)) slGuestPose(o, o.g.pet ? 'happy' : 'sit'); try { rmSet(lead, { pose: 'idle' }); } catch (e) { /* busy */ } }, 2200);
    }, 900);
  };
  // the guest stands beside my leader (slSpot), facing it: my leader turns to it where it stands (no walk needed, V233.md 4.1)
  setTimeout(bow, 200);
}
// the guest card (like yvCard): Pet once (+1 Bond to my leader), OK
function slCard(id) {
  const o = SLV.drawn.find((x) => x.g.id === id); if (!o) return null;
  const { g, d } = o, name = slName(g.f), petted = !!g.pet;
  SFX.boop(700);
  const p = openModal(esc(tt('hp.g_card', '{dog} is sleeping over', { dog: d.name })), `<div class="visitcard yv-card sl-card"><span class="vzdog">${dogSVG(d, { pose: 'sit', outfit: d.outfit })}</span><div><p><b>${esc(d.name)}</b> · ${esc(tbreed(d.key))}</p><p>${esc(tt('hp.g_body', "{dog} came from {name}'s yard and is staying until tomorrow.", { dog: d.name, name }))}</p></div></div>`,
    { cls: 'yv-pop hp-gcard', foot: `<button class="btn" type="button" id="slOk">${esc(tt('cards.ok', 'OK'))}</button><button class="btn yes big" type="button" id="slPet"${petted ? ' aria-disabled="true"' : ''}>${esc(petted ? tt('hp.g_petted', 'Petted today') : tt('hp.g_pet', 'Pet'))}</button>` });
  $('#slOk', p).onclick = () => { SFX.click(); closeModal(); };
  $('#slPet', p).onclick = () => slPet(id);
  return p;
}
function slPet(id) {
  const o = SLV.drawn.find((x) => x.g.id === id), g = o ? o.g : ((S.hp && S.hp.gu) || []).find((x) => x && x.id === id); if (!g) return 0;
  if (g.pet) { SFX.click(); return 0; }
  g.pet = 1; const n = addBond(1, { raw: true }); markDirty(); SFX.boop(820); updateHUD();
  if (!modal.hidden && modal.querySelector('.hp-gcard')) closeModal();
  const d = o ? o.d : slGuestDog(g);
  if (o) { slGuestPose(o, 'happy'); slHearts(o.x, o.box[1] - 10, motionOff() ? 1 : 2); }
  toast(tt('hp.g_pet_ok', '{dog} and {guest} play together. +{n} Bond.', { dog: NAME(), guest: d ? d.name : '', n }), 'good');
  return n;
}

/* ---------------- my side: home by morning (V233.md 4.2) ---------------- */
// each sleepover from before today that is not home yet: a diary page, +2 Bond for that dog, one toast for all, the stinger
function slHome() {
  if (!S || !S.hp || !Array.isArray(S.hp.sl) || ['title', 'adopt'].includes(cur.mode)) return 0;
  const today = slToday(), back = S.hp.sl.filter((r) => r && r.day < today && !r.home); if (!back.length) return 0;
  let bond = 0;
  back.forEach((r) => {
    r.home = 1; r.ht = Date.now(); SLV.came.push(r);
    slPage(r);
    const d = dogById(r.my); if (d) bond += withDog(d, () => addBond(2, { raw: true })); // none if it is no longer mine
  });
  markDirty();
  const r0 = back[back.length - 1], d0 = dogById(r0.my);
  toast(tt('hp.home_toast', '{dog} is home from the sleepover! +{n} Bond. A new page in the diary.', { dog: d0 ? d0.name : r0.n, n: bond }), 'gold');
  try { if (window.PawAudio && typeof PawAudio.stinger === 'function') PawAudio.stinger('discover'); } catch (e) { /* audio off */ }
  if (typeof ddStickers === 'function') try { ddStickers(); } catch (e) { /* the book is not ready */ }
  return back.length;
}
// the page: a normal diary page placed by its Japan day (j), trimmed to DD_DIARY_MAX
function slPage(r) {
  if (!S.dd || !Array.isArray(S.dd.diary)) return null;
  const p = { g: typeof day === 'function' ? day() : 1, j: r.day, d: r.day, id: r.my, n: r.n, k: r.k, w: [], p: [], f: [], t: [], x: '', wi: '', fr: [], sl: Object.assign({}, r) };
  delete p.sl.home; delete p.sl.ht;
  const L = S.dd.diary, i = L.findIndex((x) => x && (x.j || '') > r.day);
  if (i < 0) L.push(p); else L.splice(i, 0, p);
  if (L.length > DD_DIARY_MAX) L.splice(0, L.length - DD_DIARY_MAX);
  markDirty(); return p;
}
// generic (no name, house or pal) when the friend is no longer on my list (removed or blocked) or the recipe has no friend or house
function slGeneric(sl) {
  if (!sl || !Array.isArray(sl.f) || !Number.isInteger(sl.h) || sl.h < 0 || !FR_HOUSES[sl.h]) return true;
  return !((S.fr && S.fr.cache && S.fr.cache.friends) || []).some((f) => f && f.fid === sl.fid);
}
function slPal(sl) { if (!sl || !sl.ld) return null; try { return dcDog({ id: 'hpsl:' + sl.fid + ':' + sl.day, name: Array.isArray(sl.f) ? sl.f : [0, 0], dogs: [sl.ld] }, 0); } catch (e) { return null; } }
const slDecor = (sl) => (sl && Number.isInteger(sl.de) && sl.de >= 0 && FR_DECOR[sl.de] && frDecorLive(FR_DECOR[sl.de]) && HM_DECOR[FR_DECOR[sl.de]] ? FR_DECOR[sl.de] : '');
// the page's lines (48_dogdays.js ddPageLines asks for a page with sl): the opener, the night, the season, home by breakfast, the closer
function slLines(p) {
  const sl = p.sl, v = ddVoice(p.k), r = seeded(hashId('dd|' + p.j + '|' + p.id + '|sl')), L = [ddOpener(v, Math.floor(r() * 2) % 2)];
  if (slGeneric(sl)) L.push(tt('hp.d_generic', "I went to a sleepover at a friend's yard. We played until the stars came out."));
  else {
    const name = slName(sl.f), pal = slPal(sl), de = slDecor(sl);
    L.push(tt('hp.d_l1', "I slept over at {name}'s yard. Their {house} was very cosy.", { name, house: shNameAny(FR_HOUSES[sl.h]) }));
    L.push(de && pal ? tt('hp.d_l2', '{pal} showed me the {decor}. We sniffed it together.', { pal: pal.name, decor: homeName(de) }) : tt('hp.d_l2b', '{pal} and I played until the stars came out.', { pal: pal ? pal.name : name }));
    const s = SEASONS.includes(sl.s) ? sl.s : 'spring';
    L.push(s === 'summer' ? tt('hp.d_s_summer', 'We counted fireflies.') : s === 'autumn' ? tt('hp.d_s_autumn', 'We rolled in the leaves.') : s === 'winter' ? tt('hp.d_s_winter', 'We kept warm nose to nose.') : tt('hp.d_s_spring', 'The night smelled of blossom.'));
  }
  L.push(tt('hp.d_back', 'Home by breakfast, of course.'));
  L.push(ddCloser(v, Math.floor(r() * 2) % 2));
  return L;
}
/* ---------------- the picture (drawn from the recipe at display time; nothing stored, no friend name, no text) ---------------- */
// the yard without dogs, in scene units 0 0 1000 600: their season at dusk, their house, the decoration, the moon and three stars. Generic: the
// default yard and house (index 1). 58_share.js draws it as the share picture's yard (opts.yard) with the dogs on top
function slPicInner(sl) {
  const gen = slGeneric(sl), env = { time: 'dusk', weather: 'sunny', season: !gen && SEASONS.includes(sl.s) ? sl.s : seasonNow() };
  let s = '';
  try { s += sceneArt('yard', env, { patch: 'empty' }); } catch (e) { s += '<rect width="1000" height="600" fill="#CFE8B8"/>'; }
  const de = gen ? '' : slDecor(sl);
  if (de) try { const at = HM_DECOR[de].at; s += place(frDecorArt(de), at[0], at[1], at[2], at[3]); } catch (e) { /* no decoration art */ }
  try { s += place(art('house', FR_HOUSES[gen ? 1 : sl.h]), ...FR_HOUSE_AT); } catch (e) { /* no house art */ }
  s += `<g class="sl-sky">${place(slMoon(), 268, 34, 92, 92)}${doodle('spark', 420, 70, 1.5)}${doodle('spark', 520, 40, 1.1)}${doodle('spark', 190, 118, 1.2)}</g>`;
  return s.replace(/\s(?:on[a-z]+|tabindex|role|aria-label)="[^"]*"/gi, '').replace(/\s(?:xlink:)?href="(?!#|data:)[^"]*"/g, '');
}
// the diary's picture: the yard above, their leader and my dog side by side (sit / happy, nose to nose). Generic: my dog alone
const SL_PIC = { vb: [150, 40, 760, 520], pal: [330, 572], me: [560, 576] };
function slPicDog(d, x, y, face, pose) {
  if (!d) return '';
  const k = 1.08 * sizeK(d);
  try { return `<g transform="translate(${x} ${y}) scale(${k.toFixed(3)}) translate(-430 -500)">${place(dogSVG(d, { pose, outfit: d.outfit ? (dogById(d.id) ? outfitOf(d) : d.outfit) : undefined, facing: face, anim: false }).replace(/\s(?:role|aria-label)="[^"]*"/g, ''), DX, DY, DW, DH)}</g>`; } catch (e) { return ''; }
}
function slPicSVG(sl) {
  if (!sl) return '';
  const gen = slGeneric(sl), pal = gen ? null : slPal(sl);
  let me = dogById(sl.my);
  if (!me && sl.me) { try { me = dcDog({ id: 'hpme:' + sl.day, name: [0, 0], dogs: [sl.me] }, 0); } catch (e) { me = null; } } // no longer mine: its card look
  const dogs = pal ? slPicDog(pal, SL_PIC.pal[0], SL_PIC.pal[1], 'right', 'sit') + slPicDog(me, SL_PIC.me[0], SL_PIC.me[1], 'left', 'happy') : slPicDog(me, 470, SL_PIC.me[1], 'right', 'happy');
  return `<svg class="sl-picsvg" viewBox="${SL_PIC.vb.join(' ')}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(tt('hp.d_title', 'Sleepover!'))}"><rect x="0" y="0" width="1000" height="600" fill="#D3E9F6"/>${slPicInner(sl)}${dogs}</svg>`;
}
// the diary page's picture block and its Share this moment (48_dogdays.js ddDiaryHTML)
function slPageHTML(p) {
  if (!p || !p.sl) return '';
  const can = !!dogById(p.sl.my) && typeof shareDog === 'function';
  return `<div class="sl-pic"><b class="sl-ptitle">${esc(tt('hp.d_title', 'Sleepover!'))}</b>${slPicSVG(p.sl)}</div>${can ? `<div class="sh-mrow sl-mrow"><button class="btn sh-moment" type="button" data-slshare="${esc(p.sl.day)}|${esc(p.sl.my)}"><span class="sh-ic">${typeof shIcon === 'function' ? shIcon() : ''}</span>${esc(tt('sh.moment', 'Share this moment'))}</button></div>` : ''}`;
}
function slShare(sl) {
  if (!sl || typeof shareDog !== 'function' || !dogById(sl.my)) return null;
  const pal = slGeneric(sl) ? null : slPal(sl);
  return shareDog({ id: sl.my, from: 'sleep', pose: 'happy', wet: false, yard: slPicInner(sl), pal, back: () => openJournal('diary') });
}
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest ? e.target.closest('[data-slshare]') : null; if (!b || !S || !S.dd) return;
  e.stopPropagation(); const [d, id] = b.dataset.slshare.split('|');
  const p = S.dd.diary.find((x) => x && x.sl && x.sl.day === d && x.sl.my === id); if (!p) return;
  if (!modal.hidden) closeModal();
  setTimeout(() => slShare(p.sl), 60);
});
// While you were out (53_welcome.js wbHTML): one line under the visitors: a sleepover that came home during the absence, else a guest who came
function slWbHTML(pend, vis) {
  if (!S || !S.hp || (vis && vis.length >= 3 && isPhone())) return ''; // only when it fits
  const lo = ((pend && pend.at) || Date.now()) - (((pend && pend.h) || 4) + 1) * 3600e3, friend = (pair, fid) => (frFriend(fid) ? slName(pair) : tt('fr.a_friend', 'A friend'));
  const r = S.hp.sl.slice().reverse().find((x) => x && x.home && +x.ht > lo);
  let line = '';
  if (r) { const d = dogById(r.my); line = tt('hp.wb_sleep', "{dog} went to a sleepover at {name}'s yard and came home happy.", { dog: d ? d.name : r.n, name: friend(r.f, r.fid) }); }
  else { const g = slGuests().find((x) => +x.t > lo), d = g && slGuestDog(g); if (g && d) line = tt('hp.wb_guest', "{guest} from {name}'s yard came for a sleepover.", { guest: d.name, name: friend(g.f, g.fid) }); }
  return line ? `<div class="wb-vis wb-sl"><p>${esc(line)}</p></div>` : '';
}

/* ---------------- wiring ---------------- */
function slTick() {
  if (!S || !S.hp) return;
  if (slHome() && slHere()) slDraw();
  if (slHere() && SLV.drawn.some((o) => o.g.day !== slToday())) { hpDay(); slDraw(); } // a new Japan day: the guests are gone
}
on('game:ready', () => { setTimeout(() => { try { slHome(); } catch (e) { console.warn('sl home', e); } }, 0); clearInterval(SLV.tick); SLV.tick = setInterval(() => { try { slTick(); } catch (e) { console.warn('sl tick', e); } }, 4000); });
on('yard:enter', () => { if (!S || !S.hp) return; try { slHome(); slDraw(); } catch (e) { console.warn('sl draw', e); } });
// test hook: window.__paw.hp.sl
function slExpose() {
  if (!window.__paw || !window.__paw.hp || window.__paw.hp.sl) return;
  window.__paw.hp.sl = {
    why: (id) => slWhy(dogById(id)), sent: () => slSentToday(), open: (fid) => slTap(fid), send: (fid, id) => slSend(fid, dogById(id), null), busy: () => SLV.busy,
    recipes: () => JSON.parse(JSON.stringify(S.hp.sl)), guests: () => JSON.parse(JSON.stringify(S.hp.gu)), home: () => slHome(), draw: () => slDraw().length,
    drawn: () => SLV.drawn.map((o) => ({ id: o.g.id, x: o.x, y: o.y, face: o.face, k: o.k, box: o.box.slice(), tag: o.tag.slice(), pose: o.pose, name: o.d.name })),
    card: (id) => !!slCard(id), pet: (id) => slPet(id), lines: (p) => slLines(p), pic: (sl) => slPicSVG(sl), inner: (sl) => slPicInner(sl), generic: (sl) => slGeneric(sl),
    share: (sl) => !!slShare(sl), wb: (pend) => slWbHTML(pend || { at: Date.now(), h: 4 }, []), spots: () => HP_SPOTS.map((s) => s.slice()), came: () => SLV.came.length
  };
}
on('game:ready', () => setTimeout(slExpose, 0)); setTimeout(slExpose, 0);
