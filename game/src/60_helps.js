/* ======================= v2.33 "Helping paws": 60_helps.js (tag hp, V233.md) =======================
   Friends help each other: on a yard visit a friend fills the bowl, waters the garden or makes a wish come true, and says thanks; a dog goes
   for a sleepover (60b_sleep.js, tag sl). This file: the gate, the save (S.hp), the snapshot's hp field and the inbox's acts.
   Part 1 (V233.md 14.1) is the plumbing only: hpActs records and claims act ids safely, and each kind's effect is a handler in HP_DO that
   parts 2 (bowl, water, wish) and 3 (sleep, in 60b_sleep.js) fill in. No new coins (V233.md 0).
   Gate (V233.md 1): HP_FROM. 'YYYY-MM-DD' = on from 00:00 JST that day ('' = no launch date: off). The Worker's HP_FROM carries the same
     text (test_v233_worker checks it). hpOn() also needs Friends (frOn) and a Worker that said hp: 1 in GET /friends (FR.hp, memory only).
     Tests turn it on with prefs.hpTest; never under webdriver otherwise. While off: no hp snapshot field, no ?hp=1, no S.hp writes beyond
     the migration defaults (v233Fields).
   Test hook: window.__paw.hp. Suites: v233_helps (game), v233_worker (Worker). */
const HP_FROM = '2026-11-26'; // LAUNCH DATE (owner's go-ahead 24 Nov 2026: 26 Nov 2026 00:00 JST): 'YYYY-MM-DD' = on from 00:00 JST that day. Keep cloudflare/worker.js HP_FROM and NEWS_V233.date the same
/* append only, never reorder: the Worker knows its length (HP_LIM.wish) and the doable kinds (HP_WISH_DO). The DD_WACT wish kinds (48_dogdays.js) */
const HP_WISH = ['pet', 'ball', 'snack', 'walk', 'bath', 'nap', 'trick', 'toy', 'place', 'paddle', 'garden', 'photo', 'wear'];
const HP_WISH_DO = [0, 1, 2]; // the wishes a visitor can make come true: pet, ball, snack
const HP_KINDS = ['bowl', 'water', 'wish', 'sleep']; // the Worker's HP_KINDS: friend_acts kinds
const HP_BOND_MAX = 5, HP_GOTB_MAX = 5, HP_BOWLS = 3, HP_IDS = 90, HP_SL_KEEP = 10, HP_GUESTS = 2, HP_GROW_MAX = 6;
// what each act kind does on the friend's side: HP_DO[kind](act) -> false to leave the act unclaimed for now (a third guest waits for
// tomorrow), anything else = done (claimed, its id kept in S.hp.ids so it never applies twice). Parts 2 and 3 fill these in
const HP_DO = {};
const HP = { claimed: 0, gone: false, pgFirst: false }; // memory only: acts sent to the claim this load (tests); gone: a Worker that said hp: 1 then refused a help kind (V233.md 1): off for the rest of the load

function hpOn() {
  if (typeof frOn !== 'function' || !frOn()) return false;
  if (typeof FR === 'undefined' || !FR.hp || HP.gone) return false; // an older Worker never says hp: 1, so the game stays v2.32.1 with it
  return (!navigator.webdriver && !!HP_FROM && jstISO() >= HP_FROM) || !!(typeof prefs !== 'undefined' && prefs && prefs.hpTest);
}

/* ---------------- save (additive, V233.md 5): from freshState and migrate(), like fiFields ---------------- */
function v233Fields(s) {
  if (!s) return s;
  if (!s.hp || typeof s.hp !== 'object' || Array.isArray(s.hp)) s.hp = {};
  const h = s.hp, str = (k) => { if (typeof h[k] !== 'string') h[k] = ''; }, num = (k, max) => { if (!Number.isInteger(h[k]) || h[k] < 0) h[k] = 0; if (max && h[k] > max) h[k] = max; };
  const day = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  str('day'); str('slDay');
  if (h.day && !day(h.day)) h.day = ''; if (h.slDay && !day(h.slDay)) h.slDay = '';
  num('bond', HP_BOND_MAX); num('gotB', HP_GOTB_MAX); num('bowls', HP_BOWLS); num('n'); num('thx'); num('host');
  if (!Array.isArray(h.ids)) h.ids = [];
  h.ids = h.ids.filter((x) => Number.isInteger(x) && x > 0).slice(-HP_IDS);
  if (!Array.isArray(h.sl)) h.sl = [];
  h.sl = h.sl.filter((x) => x && typeof x === 'object' && !Array.isArray(x) && day(x.day)).slice(-HP_SL_KEEP);
  if (!Array.isArray(h.gu)) h.gu = [];
  h.gu = h.gu.filter((x) => x && typeof x === 'object' && !Array.isArray(x) && day(x.day)).slice(-HP_GUESTS);
  // part 4 (V233.md 7): the page keys S.dd.pg is numbered by ([] = numbered without the "Helping paws" page) and that page's gift
  if (!Array.isArray(h.pk) || h.pk.length > 80 || !h.pk.every((k) => typeof k === 'string' && k.length < 24)) h.pk = [];
  str('pg');
  // fix batch B1 (code review 11): page gifts whose page was not in the book at a load's first sync, by page key, until the page comes back
  if (!h.px || typeof h.px !== 'object' || Array.isArray(h.px)) h.px = {};
  Object.keys(h.px).forEach((k) => { if (k.length > 23 || typeof h.px[k] !== 'string' || h.px[k].length > 40) delete h.px[k]; });
  return s;
}
// the daily counters start again on a new Japan day (from frDay); only today's guests stay. Nothing while off
function hpDay() {
  if (!S || !hpOn()) return;
  v233Fields(S);
  const h = S.hp, today = jstISO();
  if (h.day === today) return;
  h.day = today; h.bond = 0; h.gotB = 0; h.bowls = 0;
  h.gu = h.gu.filter((g) => g.day === today);
  markDirty();
}

/* ---------------- the snapshot's hp field (V233.md 6): what a visitor can help with today ---------------- */
// { d: today (JST), g: growing plots (a crop, not ready; 0 when the garden is not open), w?: the leader's wish today, a?: a snack's food }
function hpSnap() {
  const out = { d: jstISO(), g: 0 };
  try {
    if (typeof gkOn === 'function' && gkOn() && typeof gardenUnlocked === 'function' && gardenUnlocked()) {
      const pl = (S.garden && Array.isArray(S.garden.plots)) ? S.garden.plots : [];
      out.g = Math.min(HP_GROW_MAX, pl.filter((p) => p && p.crop && Number(p.g) < 1).length);
    }
  } catch (e) { out.g = 0; }
  try {
    const lead = typeof frYardDogs === 'function' ? (frYardDogs()[0] || {}).d : null;
    const w = lead && typeof ddOn === 'function' && ddOn() && typeof ddWish === 'function' ? ddWish(lead) : null;
    const i = w && !w.done ? HP_WISH.indexOf(w.k) : -1;
    if (i >= 0) {
      if (w.k !== 'snack' || !w.a) out.w = i;
      else { const a = FR_GIFTS.indexOf(w.a); if (a >= 0) { out.w = i; out.a = a; } } // a snack naming a food that is no gift: no bubble
    }
  } catch (e) { /* no wish today */ }
  return out;
}
// a snapshot's hp from the Worker, checked again here: { d, g, w?, a? } or null
function hpSnapClean(h) {
  if (!h || typeof h !== 'object' || Array.isArray(h)) return null;
  if (typeof h.d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(h.d) || !Number.isInteger(h.g) || h.g < 0 || h.g > HP_GROW_MAX) return null;
  const out = { d: h.d, g: h.g };
  if (Number.isInteger(h.w) && h.w >= 0 && h.w < HP_WISH.length) {
    out.w = h.w;
    if (h.w === 2 && Number.isInteger(h.a) && h.a >= 0 && h.a < FR_GIFTS.length) out.a = h.a;
  }
  return out;
}

/* ---------------- the inbox's acts (V233.md 3.2): apply once, then claim ---------------- */
// acts from GET /friends/inbox?hp=1; claimActs collects the ids to claim. An id already applied (S.hp.ids, the last 90) is only claimed
// again. Returns how many acts were applied now (the caller saves before the claim when there are some)
function hpActs(acts, claimActs) {
  if (!S || !Array.isArray(acts) || !Array.isArray(claimActs)) return 0;
  v233Fields(S); hpDay();
  let made = 0;
  acts.forEach((ev) => {
    if (!ev || !Number.isInteger(ev.id) || ev.id < 1) return;
    if (S.hp.ids.includes(ev.id)) { claimActs.push(ev.id); return; }
    const ok = ev.kind && HP_KINDS.includes(ev.kind) && ev.from && typeof ev.from.fid === 'string' && typeof ev.day === 'string';
    let r = true;
    if (ok && typeof HP_DO[ev.kind] === 'function') { try { r = HP_DO[ev.kind](ev); } catch (e) { r = true; } } // a broken act never sits on the badge for ever
    if (r === false) return; // waits (unclaimed) for a later look
    S.hp.ids.push(ev.id); if (S.hp.ids.length > HP_IDS) S.hp.ids = S.hp.ids.slice(-HP_IDS);
    claimActs.push(ev.id); made++;
  });
  if (made) markDirty();
  return made;
}

/* ======================= part 2 (V233.md 3.1-3.3, 8, 9): the three helps on a friend's yard visit =======================
   The helper's side: the help strip #hpStrip under the place chip, the bowl and the watering can in #hpG (50_friends.js frYardSVG), the friend
   leader's wish bubble. A help goes to the Worker first; every effect waits for { ok: true } (the bag, Bond, the tick). The friend's side:
   HP_DO.bowl / water / wish on the claim, one letter per helper per Japan day, Say thanks (note 12) on it. No coins anywhere but ddWishDone's own. */
// the help bowl: HP_BOWL is its spot by the house's left corner on its front line (y 530); the can stands on the veggie patch's top edge. Phone check
// (23 Nov 2026): on a 390 phone the greeting pair fills the whole ground the camera shows (x 411..770, y 427..544), on a 360 one the three dogs
// fill it above the buttons, so no one spot is clear on every screen: the bowl waits until the dogs stand (frDrawDogs), then takes the free spot
// nearest HP_BOWL in view (hpBowlSpot: clear of every dog's drawn box in all its poses, the chip, the strip, the buttons, the bar, the paw stamp and
// their decorations, never on the house's wall). The can shows once the camera pans to it (the strip's button does). World units x, y, w, h
const HP_BOWL = [660, 466, 68, 68], HP_CAN = [150, 388, 56, 56];
// the bowl's drawing inside its 68 box (x0, y0, x1, y1: the full bowl's kibble from y 21, its base at y 59), and how much of a dog's shortest drawn
// height (its paws) a bowl in front of it may hide (hpBowlSpot's near tier), the part of its drawn width at its nose's end it never stands in front of
const HP_INK = [2, 20, 66, 60], HP_PAW = 0.14, HP_HEAD = 0.38, HP_SCALES = [1, 0.85, 0.72, 0.6]; // and the sizes a near bowl may take to fit there
// where no dog may put its feet, so that none is drawn over the can: its box (frScan adds 8 round it) and the ground beside it
// (a dog's drawn half-width is about 88 x its scale: about 1 on a desktop, 0.6 on a phone)
const HP_KEEP = { can: [0, 0, 96, 120] }, HP_KEEP_PH = { can: [0, 0, 60, 120] };
const HP_HUNGER = 20, HP_NOTE = 12; // a bowl top-up's Hunger; the thank-you note (FR_NOTES[12])
const HPV = { busy: '', raf: 0, wish: null, bub: '', bowl: null, pour: false, at: '', ro: null }; // the visit: a send in flight, the bubble's frame loop, the wish shown { i, k, a, do }, the bubble's drawn key, the bowl's spot,
// pour: the bowl stays empty until the kibble lands (hpBowlFx fills it), at: what the bubble was last placed for (hpFrame), ro: the chip's ResizeObserver
const hpSnd = (n, alt) => { try { if (typeof SFX[n] === 'function') SFX[n](); else if (alt) alt(); } catch (e) { /* audio off */ } }; // SFX.chime and SFX.page fall back
const hpFriendName = () => frPairName(FRV.pair) || tt('fr.a_friend', 'A friend');
// their leader on this visit (the snapshot's first dog) and its name
const hpTheirs = () => FRV.dogs.find((v) => !v.mine && v.i === 0) || null;
const hpMine = () => FRV.dogs.find((v) => v.mine) || null;
function hpTheirName() { const v = hpTheirs(); if (v) return v.dog.name; try { const d = FRV.card && dcDog(FRV.card, 0); return d ? d.name : ''; } catch (e) { return ''; } }
// the snapshot says (today, JST): something grows (the can), the leader's wish (the bubble)
const hpYardHp = () => { const h = FRV.yard && FRV.yard.hp; return h && h.d === jstISO() ? h : null; };
const hpGrowing = () => { const h = hpYardHp(); return !!(h && h.g > 0); };
function hpWishOf() {
  const h = hpYardHp(); if (!h || !Number.isInteger(h.w) || !HP_WISH[h.w]) return null;
  const a = h.w === 2 && Number.isInteger(h.a) && FR_GIFTS[h.a] ? FR_GIFTS[h.a] : null;
  return { i: h.w, k: HP_WISH[h.w], a, do: HP_WISH_DO.includes(h.w) };
}
const hpVisitOn = () => cur.mode === 'fryard' && !!FRV.fid && !!FRV.yard && hpOn();
const hpDone = (k) => !!FRV.fid && frSentToday(FRV.fid, k);
// frYardSVG's veggie patch: growing when the snapshot says so (the can stands on it), else empty as in v2.19
function hpPatch(y) { const h = hpOn() && y && y.hp; return h && h.d === jstISO() && h.g > 0 ? 'growing' : 'empty'; }
function hpCanArt() { let a = ''; try { a = art('icon', 'water-can'); } catch (e) { a = ''; } return a || `<svg viewBox="0 0 64 64">${doodle('spark', 32, 32, 1.6)}</svg>`; }
function hpBowlSVG() { const [, , w, h] = HP_BOWL; return place(bowlArt(hpDone('bowl') && !HPV.pour ? 'Basic Kibble' : null), 0, 0, w, h); }
// the scene's bowl drawn again: full once filled today, empty while the pour plays (data-full for the tests)
function hpBowlFill() { const g = $('#view .hp-bowlart'); if (!g) return; g.innerHTML = hpBowlSVG(); g.setAttribute('data-full', hpDone('bowl') && !HPV.pour ? '1' : '0'); }
// #hpG: the bowl (always; hidden until hpBowlSpot puts it down) and the can (something grows today). Each is a button; its box keeps the dogs' feet off it (frScan)
function hpGSVG() {
  if (!hpOn()) return '';
  const lead = hpTheirName(), [bx, by, bw, bh] = HP_BOWL, [cx, cy, cw, ch] = HP_CAN, K = isPhone() ? HP_KEEP_PH : HP_KEEP;
  const keep = (b, o) => `<rect data-hp="keep" x="${b[0] + o[0]}" y="${b[1] + o[1]}" width="${b[2] + o[2]}" height="${Math.min(o[3], 600 - b[1])}" fill="none" pointer-events="none"/>`;
  const bowl = `<g class="hp-prop hp-bowl" data-hp="bowl" role="button" tabindex="0" style="display:none" transform="translate(${bx} ${by})" aria-label="${esc(tt('hp.bowl_aria', "Fill {dog}'s bowl", { dog: lead }))}"><rect x="-4" y="-4" width="${bw + 8}" height="${bh + 8}" fill="transparent"/><g class="hp-bowlart" data-full="${hpDone('bowl') ? 1 : 0}">${hpBowlSVG()}</g></g>`;
  const can = hpGrowing() ? keep(HP_CAN, K.can) + `<g class="hp-prop hp-can" data-hp="water" role="button" tabindex="0" aria-label="${esc(tt('hp.water_aria', 'Water the garden'))}"><rect x="${cx - 6}" y="${cy - 6}" width="${cw + 12}" height="${ch + 12}" fill="transparent"/><g class="hp-canart"><g transform="translate(${2 * cx + cw} 0) scale(-1 1)">${place(hpCanArt(), cx, cy, cw, ch)}</g></g></g>` : ''; // its spout over the patch
  return bowl + can;
}
// where the bowl goes on this visit, once the dogs stand: [x, y, over, s, tier] (its top left, drawn over the dogs (#hpTop), its scale), or null
// (no ground clear of the screen's own parts: the bowl stays hidden, the strip's button still fills it). Phone and art review (23 Nov 2026), tiers:
//   1 clear: the free spot nearest HP_BOWL; 2 near (no clear ground: a 390 phone's greeting pair fills it): in front of the dogs it touches, its
//   base on their foot line, hiding at most their paws (HP_PAW) in every pose they take there and never at their nose's end (HP_HEAD), drawn over
//   them, a little smaller when only that fits (HP_SCALES, never under a 44 px tap); 3 the same in front of their legs (FR_LEGS, as a dog in front
//   may hide them); 4 last: in front of the dogs it touches, hiding the least of them and of the standing decorations. In every tier the chip, the
//   strip, the buttons, the camera arrow, the bar (frScan's boxes), the paw stamp, the can, the wish bubble and the house's wall are no-go for its
//   whole tap box. Hanging decorations (lights, bunting, garlands: hoLayer 0) never block ground; flat ones (stones, a sandbox) and the scene's hot
//   spots are kept clear in tiers 1 and 2
function hpBowlSpot() {
  const c = FRV.crop, svg = $('#view > svg.world'), M = svg && svg.getScreenCTM(); if (!c || !M) return HP_BOWL.slice(0, 2).concat(0, 1);
  const inv = M.inverse(), ppu = Math.hypot(M.a, M.b) || 1, toW = (el) => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return null; const p = svg.createSVGPoint(); p.x = r.left; p.y = r.top; const a = p.matrixTransform(inv); p.x = r.right; p.y = r.bottom; const b = p.matrixTransform(inv); return [a.x, a.y, b.x, b.y]; };
  const hard = c.boxes.map((b) => [b[0], b[1], b[0] + b[2], b[1] + b[3]]), soft = []; // [x0, y0, x1, y1, weight]
  const st = FR_STAMP, sy = isPhone() ? st[1] - 70 : st[1]; hard.push([st[0], sy, st[0] + st[2], sy + st[3]]);
  [...svg.querySelectorAll('#hpG .hp-can, #hpG [data-hp="keep"]:not(#hpBowlKeep)')].concat([...document.querySelectorAll('#hpWish:not([hidden])')]).forEach((el) => { const r = toW(el); if (r) hard.push(r); });
  svg.querySelectorAll('#frDecorG .fr-decor').forEach((el) => {
    const n = el.getAttribute('data-frdecor'), l = typeof hoLayer === 'function' && HM_DECOR[n] ? hoLayer(n) : 2; if (l === 0) return; // hanging: no ground of its own
    const r = toW(el); if (r) soft.push(r.concat(l === 1 ? 0.5 : 1));
  });
  svg.querySelectorAll('#sceneG [data-hot]').forEach((el) => { const r = toW(el); if (r) soft.push(r.concat(1)); });
  const [hx, hy, W, H] = HP_BOWL, I = HP_INK, x0 = Math.max(4, c.x0 + 6), xr = Math.min(996, c.x1 - 6), yb = Math.min(598, c.y1);
  const over = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  // the dogs where they stand for the visit; my leader still to walk in (the greeting) counts at its spot, and its way in is kept clear of a bowl
  // drawn under the dogs (one drawn over them stands in front of the way: the leader walks behind it)
  let path = null;
  const dogs = FRV.dogs.filter((v) => v.res && v.res.r && !v.hidden).map((v) => {
    const T = frTap(v.x, v.y, v.k), hit = v.mine ? null : [T[0], T[1], T[0] + T[2], T[1] + T[3]]; // a friend's dog's tap box (its fr-hit)
    if (!(v.gr && v.home && Math.abs(v.home[0] - v.x) > 1)) return { r: v.res.r, y: v.y, h: v.res.h, face: v.face, hit };
    const k = frK(v, v.home[1]), r = frEnv(v, v.home[0], v.home[1], k, v.face); path = { r: v.res.r, y: v.home[1] };
    return { r, y: v.home[1], h: frMinH(v) * k, face: v.face, hit };
  });
  // its base on or in front of its foot line, hiding no more than the bottom f of its shortest drawn height (v.res.r: every pose it takes there), and never in front of
  // the end its nose is at (HP_HEAD: a glad dog's play bow brings its head down to the ground there)
  const low = (k, v, f) => { const r = v.r, cut = r[0] + (r[2] - r[0]) * (v.face === 'left' ? HP_HEAD : 1 - HP_HEAD); return k[3] >= v.y - 2 && k[1] >= v.y - f * v.h && (v.face === 'left' ? k[0] >= cut : k[2] <= cut); };
  const paws = (k, v) => low(k, v, HP_PAW), legs = (k, v) => low(k, v, FR_LEGS);
  const head = (k, v) => { const r = v.r, a = (r[2] - r[0]) * HP_HEAD; return over(k, v.face === 'left' ? [r[0], r[1], r[0] + a, r[3]] : [r[2] - a, r[1], r[2], r[3]]); }; // in front of its nose's end
  let best = null, near = null, mid = null, last = null;
  HP_SCALES.forEach((s) => {
    const T = hpBowlTap(s, ppu); // a 44 px tap at every size
    const w = W * s, h = H * s;
    for (let y = yb - h; y >= 430 - h; y -= 4) {
      for (let x = x0; x <= xr - w; x += 4) {
        if (x + w > 628 && x < 856 && y + h < 528) continue; // never on the house's wall: in front of the house only from its front line
        const t = [x + T[0] * s, y + T[1] * s, x + (T[0] + T[2]) * s, y + (T[1] + T[3]) * s]; // its tap box (frScan's boxes have 6 px round them)
        if (hard.some((o) => over(t, o) > 0)) continue;
        const k = [x + I[0] * s, y + I[1] * s, x + I[2] * s, y + I[3] * s], d = -Math.abs(x + w / 2 - hx - W / 2) - Math.abs(y + h - hy - H) * 1.5 - (1 - s) * 400;
        const sa = soft.reduce((n, o) => n + over(k, o) * o[4], 0), on = dogs.filter((v) => over(k, v.r) > 0);
        const way = path && over(k, path.r) > 0; if (way && k[3] < path.y - 2) continue; // never on my leader's way in, unless in front of it
        if (s === 1 && !sa && !on.length && !way && !dogs.some((v) => over(t, v.r) > 0)) { if (!best || d > best.s) best = { s: d, x, y, k: s, top: dogs.some((v) => v.hit && over(t, v.hit) > 0) }; continue; } // (its tap box clear of them too; over their tap boxes it is drawn over the dogs, so none takes its taps)
        const d2 = d - on.reduce((n, v) => n + over(k, v.r), 0) * 0.03; // (paws or legs hidden: a little; a full size bowl is worth more)
        if (!sa && on.every((v) => paws(k, v))) { if (!near || d2 > near.s) near = { s: d2, x, y, k: s }; continue; } // (a smaller bowl on clear ground too: drawn over, so no dog's tap box takes its taps)
        if (on.length && on.every((v) => legs(k, v))) { const d3 = d2 - sa * 0.5; if (!mid || d3 > mid.s) mid = { s: d3, x, y, k: s }; continue; } // in front of their legs (FR_LEGS, as a dog in front may hide them)
        if (!on.every((v) => k[3] >= v.y - 2)) continue; // the last tier: in front of every dog it touches (drawn over them), hiding the least
        const d4 = d - sa * 0.5 - on.reduce((n, v) => n + over(k, v.r) + head(k, v) * 4, 0);
        if (!last || d4 > last.s) last = { s: d4, x, y, k: s };
      }
    }
  });
  if (best) return [best.x, best.y, best.top ? 1 : 0, 1, 1];
  const o = near || mid || last;
  return o ? [o.x, o.y, 1, o.k, o === near ? 2 : o === mid ? 3 : 4] : null;
}
// the bowl's tap box in its own units at scale s ([x, y, w, h]): round its drawing, wider and taller up when that is under 46 px on screen (over
// the paws a near bowl stands in front of, never further down)
function hpBowlTap(s, ppu) { const I = HP_INK, q = 46 / ((s || 1) * (ppu || 1)), th = Math.max(I[3] - I[1] + 12, q), tw = Math.max(I[2] - I[0] + 8, q); return [(I[0] + I[2] - tw) / 2, I[3] + 2 - th, tw, th]; }
// the bowl at its spot and scale; over the dogs (#hpTop, after #frDogs) when it stands in front of those it touches. No spot: hidden
function hpBowlPut() {
  const g = $('#hpG .hp-bowl') || $('#hpTop .hp-bowl'); if (!g) return null;
  const at = hpBowlSpot(); HPV.bowl = at;
  const dogs = $('#frDogs'), hpG = $('#hpG'), svg = $('#view > svg.world'), M = svg && svg.getScreenCTM(); let k = $('#hpBowlKeep');
  if (!at) { g.style.display = 'none'; if (k) k.remove(); return null; }
  const s = at[3] || 1, T = hpBowlTap(s, M ? Math.hypot(M.a, M.b) : 1), r = g.querySelector(':scope > rect');
  g.setAttribute('transform', `translate(${f1(at[0])} ${f1(at[1])})${s !== 1 ? ` scale(${s})` : ''}`); g.style.display = '';
  if (r) [['x', T[0]], ['y', T[1]], ['width', T[2]], ['height', T[3]]].forEach(([n, v]) => r.setAttribute(n, f1(v)));
  if (at[2] && dogs) { let top = $('#hpTop'); if (!top) { top = document.createElementNS('http://www.w3.org/2000/svg', 'g'); top.id = 'hpTop'; dogs.after(top); } top.appendChild(g); }
  else if (hpG && g.parentNode !== hpG) hpG.insertBefore(g, hpG.firstChild);
  if (hpG) { if (!k) { k = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); k.id = 'hpBowlKeep'; k.setAttribute('data-hp', 'keep'); k.setAttribute('fill', 'none'); k.setAttribute('pointer-events', 'none'); hpG.appendChild(k); }
    const I = HP_INK; [['x', at[0] + I[0] * s], ['y', at[1] + I[1] * s], ['width', (I[2] - I[0]) * s], ['height', (I[3] - I[1]) * s]].forEach(([n, v]) => k.setAttribute(n, f1(v))); } // the dogs keep their feet off the bowl itself, wherever it is drawn (frScan)
  return at;
}
// the strip: "Help out" and three round buttons (bowl, can, wish). Done today: a tick. The can rests (greyed) when nothing grows; the wish shows for a doable wish
function hpStripBtns() {
  const w = hpWishOf(), lead = hpTheirName(), tick = `<i class="hp-tick" aria-hidden="true">${ICON('check')}</i>`;
  const b = (k, icon, label, rest) => { const done = hpDone(k); return `<button class="hp-b${done ? ' done' : ''}${rest && !done ? ' rest' : ''}" type="button" data-hpk="${k}" aria-label="${esc(label)}"${rest && !done ? ' aria-disabled="true"' : ''}><span class="hp-ic" aria-hidden="true">${icon}</span>${done ? tick : ''}</button>`; };
  return `<span class="hp-lbl">${esc(tt('hp.help_out', 'Help out'))}</span>`
    + b('bowl', art('prop', 'bowl-empty'), tt('hp.bowl_aria', "Fill {dog}'s bowl", { dog: lead }))
    + b('water', hpCanArt(), tt('hp.water_aria', 'Water the garden'), !hpGrowing())
    + (w && w.do ? b('wish', ICON('heart'), tt('hp.wish_aria', "Make {dog}'s wish come true", { dog: lead })) : '');
}
function hpStripHTML() { return hpOn() ? `<div id="hpStrip" class="hp-strip" role="group" aria-label="${esc(tt('hp.help_out', 'Help out'))}">${hpStripBtns()}</div>` : ''; }
// under the place chip (as #ddWish sits at home)
function hpStripPlace() {
  const el = $('#hpStrip', view), st = $('#status', view); if (!el || !st) return;
  const vr = view.getBoundingClientRect(), r = st.getBoundingClientRect(); if (!r.height) return;
  const top = Math.round(r.bottom - vr.top + 8) + 'px', left = Math.round(Math.max(8, r.left - vr.left)) + 'px';
  if (el.style.top !== top) el.style.top = top; if (el.style.left !== left) el.style.left = left;
}
function hpStripSync() { const el = $('#hpStrip', view); if (el) { el.innerHTML = hpStripBtns(); hpStripPlace(); } hpBowlFill(); HPV.bub = ''; HPV.at = ''; } // the bowl stays empty while it is being filled (HPV.pour)
// the Worker went back (it said hp: 1, then refused a new kind): no helps for the rest of the load
function hpGone() {
  FR.hp = false; HP.gone = true;
  const s = $('#hpStrip', view); if (s) s.remove(); ['#hpG', '#hpTop'].forEach((q) => { const g = $(q); if (g) g.innerHTML = ''; }); const b = $('#hpWish', view); if (b) b.remove();
  cancelAnimationFrame(HPV.raf); HPV.raf = 0; if (HPV.ro) { HPV.ro.disconnect(); HPV.ro = null; } if (cur.mode === 'fryard') frScan();
}

/* ---------- the wish bubble over their leader (the #ddWish look, the tail down), moved by the frame loop ---------- */
function hpBubbleHTML(w) {
  const done = hpDone('wish'), txt = ddWishText(w.k, w.a);
  return `<span class="dd-wt">${done ? `<b>${esc(tt('dd.chip_done', 'Wish come true!'))}</b>` : esc(tt('hp.wish_chip', 'Today I wish for {wish}', { wish: txt }))}</span>${done ? `<span class="dd-wok" aria-hidden="true">${ICON('check')}</span>` : ''}<i class="dd-tail" aria-hidden="true"></i>`;
}
function hpBubble() {
  const w = HPV.wish; let el = $('#hpWish', view);
  if (!w || !hpVisitOn()) { if (el) el.remove(); return null; }
  if (!el) {
    el = document.createElement('button'); el.id = 'hpWish'; el.type = 'button'; el.className = 'dd-wish hp-wish'; el.hidden = true;
    el.onclick = (e) => { e.stopPropagation(); hpTap('wish', 'bubble'); }; view.appendChild(el); HPV.bub = '';
  }
  const key = [hpDone('wish'), w.k, w.a, I18N.lang].join('|');
  if (HPV.bub !== key) {
    HPV.bub = key; el.innerHTML = hpBubbleHTML(w); el.classList.toggle('done', hpDone('wish')); el.classList.toggle('home', !w.do);
    el.setAttribute('aria-label', tt('dd.chip_aria', '{name} wishes for {wish}', { name: hpTheirName(), wish: ddWishText(w.k, w.a) }));
  }
  return el;
}
// over the head of their leader: the top of its drawn box, through the screen CTM; inside the view, under the strip and clear of the camera
// arrow (#phPeek, phone review 6: beside it when the bubble fits there, else above or below it)
function hpBubblePlace() {
  const el = hpBubble(), v = hpTheirs(), svg = $('#view > svg.world'); if (!el) return;
  const M = svg && svg.getScreenCTM(); if (!v || v.hidden || !M) { el.hidden = true; return; }
  const e = frExt(v, frPose(v), v.face), p = svg.createSVGPoint(); p.x = v.x + v.k * (e[0] + e[2]) / 2; p.y = v.y + v.k * e[1];
  const q = p.matrixTransform(M), vr = view.getBoundingClientRect(), hx = q.x - vr.left, hy = q.y - vr.top;
  if (hx < 0 || hx > vr.width) { el.hidden = true; return; } // the camera looks elsewhere
  el.hidden = false;
  const w = el.offsetWidth, h = el.offsetHeight, s = $('#hpStrip', view), floor = s ? s.offsetTop + s.offsetHeight + 6 : 8;
  let left = clamp(hx - w / 2, 8, Math.max(8, vr.width - w - 8)), top = Math.max(floor, hy - h - 16);
  const pk = $('#phPeek', view), pr = pk && pk.offsetWidth ? pk.getBoundingClientRect() : null;
  if (pr) {
    const a = [pr.left - vr.left - 11, pr.top - vr.top - 6, pr.right - vr.left + 11, pr.bottom - vr.top + 6]; // its nudge moves it 5 px
    const hit = (l, t) => l < a[2] && l + w > a[0] && t < a[3] && t + h > a[1];
    if (hit(left, top)) {
      if (a[2] + w <= vr.width - 8) left = a[2]; // to its right (a visit's arrow is on the left edge)
      else if (a[0] - w >= 8) left = a[0] - w;
      else if (a[1] - h >= floor) top = a[1] - h;
      else top = a[3];
    }
  }
  el.style.left = Math.round(left) + 'px'; el.style.top = Math.round(top) + 'px';
  el.style.setProperty('--tail', Math.round(clamp(hx - left - 7, 14, w - 28)) + 'px');
}
// the bubble follows the leader and the camera: the layout is read and written only when one of them moved (code review 10), and only while
// there is a bubble. The strip follows the chip (a ResizeObserver, hpVisit) and the window
function hpFrame() {
  HPV.raf = 0; if (!hpVisitOn() || !HPV.wish) return;
  const v = hpTheirs(), w = HPV.wish;
  const key = [FRC.x.toFixed(1), FRC.w.toFixed(1), innerWidth, innerHeight, document.fonts ? document.fonts.status : '', hpDone('wish'), w.k, w.a, I18N.lang].concat(v ? [v.x.toFixed(1), v.y.toFixed(1), v.k.toFixed(3), frPose(v), v.face, v.hidden ? 1 : 0] : []).join('|');
  if (key !== HPV.at) { HPV.at = key; hpStripPlace(); hpBubblePlace(); }
  HPV.raf = requestAnimationFrame(hpFrame);
}
/* ---------- the visit (emit('fryard:enter') at the end of enterFrYard) ---------- */
function hpVisit() {
  cancelAnimationFrame(HPV.raf); HPV.raf = 0; HPV.busy = ''; HPV.bub = ''; HPV.at = ''; HPV.pour = false;
  if (!hpVisitOn()) { const s = $('#hpStrip', view); if (s) s.remove(); return; }
  hpDay();
  HPV.wish = hpWishOf();
  const strip = $('#hpStrip', view);
  if (strip) {
    hpStripPlace();
    strip.addEventListener('click', (e) => { const b = e.target.closest('[data-hpk]'); if (!b) return; e.stopPropagation(); hpTap(b.dataset.hpk, 'strip'); });
  }
  document.querySelectorAll('#view .hp-prop[data-hp]').forEach((g) => {
    const go = (e) => { if (e) { e.stopPropagation(); e.preventDefault(); } hpTap(g.dataset.hp, 'prop'); };
    g.addEventListener('click', go); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(e); });
  });
  hpBubblePlace(); frScan(); hpBowlPut(); frScan(); // the bowl goes down where no dog stands; then the dogs keep their feet off it
  const st = $('#status', view); if (HPV.ro) HPV.ro.disconnect(); HPV.ro = null;
  if (st && strip && typeof ResizeObserver === 'function') { HPV.ro = new ResizeObserver(() => { hpStripPlace(); HPV.at = ''; }); HPV.ro.observe(st); } // the chip's words change (the clock, the weather)
  if (HPV.wish) HPV.raf = requestAnimationFrame(hpFrame);
  onCleanup(() => { cancelAnimationFrame(HPV.raf); HPV.raf = 0; HPV.wish = null; HPV.busy = ''; HPV.pour = false; if (HPV.ro) { HPV.ro.disconnect(); HPV.ro = null; } });
}
on('fryard:enter', () => hpVisit());
// the spot each help plays at (world x): the camera pans there on a phone first (0.5 s) when it is not well in view
function hpSpotX(k) { if (k === 'bowl') return (HPV.bowl || HP_BOWL)[0] + HP_BOWL[2] * ((HPV.bowl && HPV.bowl[3]) || 1) / 2; if (k === 'water') return HP_CAN[0] + HP_CAN[2] / 2; const v = hpTheirs(); return v ? v.x : null; }
function hpPan(k) {
  const x = hpSpotX(k); if (x == null || FRC.w >= 1000) return 0;
  const m = Math.min(110, FRC.w / 4); if (x > FRC.x + m && x < FRC.x + FRC.w - m) return 0;
  frCamTo(x - FRC.w / 2, 0.5); return motionOff() ? 0 : 520;
}
const hpWait = (ms) => new Promise((r) => setTimeout(r, ms));
async function hpTap(k, from) {
  if (!hpVisitOn() || HPV.busy) return false;
  SFX.click();
  if (hpDone(k)) { toast(tt('hp.done_today', 'You did that today. Come back tomorrow!'), 'good'); return false; }
  if (k === 'water' && !hpGrowing()) { toast(tt('hp.garden_rest', 'The garden is resting.'), 'good'); return false; }
  const w = HPV.wish;
  if (k === 'wish' && (!w || !w.do)) { toast(tt('hp.wish_home', 'That wish is one for home.'), 'good'); return false; }
  if (k === 'wish' && w.k === 'snack') { const ms = from === 'strip' ? hpPan(k) : 0; if (ms) await hpWait(ms); hpSnackSheet(); return true; }
  const ms = from === 'strip' ? hpPan(k) : 0; if (ms) await hpWait(ms);
  if (!hpVisitOn()) return false;
  if (k === 'wish' && w.k === 'pet') { const v = hpTheirs(); if (v) frPetDog(v); } // the pet first (its own pet event if not sent today), then the wish
  if (k === 'bowl') HPV.pour = true; // the bowl stays empty until the kibble lands (hpBowlFx fills it)
  const r = await hpSend(k, k === 'wish' ? { w: w.i } : {});
  if (r !== 'ok' || !hpVisitOn()) { if (k === 'bowl') { HPV.pour = false; hpBowlFill(); } return r === 'ok'; }
  if (k === 'bowl') hpBowlFx(); else if (k === 'water') hpWaterFx(hpCanFit()); else if (w.k === 'ball') hpBallFx(); else hpWishFx();
  return true;
}
// one send. ok: marked done, a help counted, +1 Bond to my leader up to HP_BOND_MAX a day. limit: done, quietly. bad from a Worker that said hp: 1:
// it went back (hpGone). 404: not a friend now. Else offline: nothing changes
async function hpSend(kind, data) {
  const fid = FRV.fid, name = hpFriendName(); if (!fid || HPV.busy) return 'busy';
  HPV.busy = kind;
  let r = null;
  try { r = await frApi('POST', '/friends/send', { fid, kind, data }); } catch (e) { r = null; }
  HPV.busy = '';
  if (r && r.ok) {
    frMarkSent(fid, kind); frDay(); hpDay(); v233Fields(S);
    S.hp.n++; let n = 0;
    if (S.hp.bond < HP_BOND_MAX) { S.hp.bond++; n = addBond(1, { raw: true }); }
    markDirty();
    toast(tt('hp.helped', '{dog} helped out!{n, plural, =0 {} other { +# Bond}}', { dog: NAME(), n }), 'good');
    hpStick(); // 5, 25 and 100 helps
    if (cur.mode === 'fryard' && FRV.fid === fid) hpStripSync();
    return 'ok';
  }
  const err = frErr(r);
  if (err === 'limit') { frMarkSent(fid, kind); if (cur.mode === 'fryard') hpStripSync(); return 'limit'; }
  if (err === 'bad') { hpGone(); toast(tt('hp.failed', "That didn't reach {name}. Try again later.", { name }), 'bad'); return 'bad'; }
  if (r && r.status === 404) toast(tt('fr.not_friend', 'That friend is not on your list any more.'), '');
  else toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad');
  return 'off';
}

/* ---------- the animations (reduced motion: the bowl just fills, the dog just turns happy, one heart each) ---------- */
function hpFxAdd(html, ms) {
  const fx = $('#fx'); if (!fx) return null;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'hp-fx'); g.setAttribute('pointer-events', 'none'); g.innerHTML = html; fx.appendChild(g);
  setTimeout(() => g.remove(), ms); return g;
}
function hpHearts(v, n) {
  if (!v) return; const lf = v.face === 'left', hx = v.x + (lf ? -43 : 43) * v.k, hy = v.y - 175 * v.k;
  fxText('♥', hx, hy - 20); if (n > 1 && !motionOff()) setTimeout(() => fxText('♥', hx + 18, hy - 50), 180);
}
// a dog of theirs glad (and first a jump): the frame loop goes on from there
function hpJoy(v, jump) {
  if (!v) return;
  if (v.tw) { v.x = v.tw.x1; v.y = v.tw.y1; v.k = frK(v, v.y); v.tw = null; frHold(v); }
  const now = performance.now();
  if (jump && !motionOff() && !v.gr) { const was = v.pose; v.pose = 'jump'; frPaint(v); setTimeout(() => { v.pose = was === 'jump' ? 'idle' : was; v.happy = performance.now() + 1800; v.wait = v.happy + 2000; frPaint(v); }, 520); return; }
  v.happy = now + 2200; v.wait = v.happy + 2000; frPaint(v);
}
function hpBowlFx() {
  const [x, y] = HPV.bowl || HP_BOWL, k = (HPV.bowl && HPV.bowl[3]) || 1, w = HP_BOWL[2], calm = motionOff() || !HPV.bowl, fill = () => { HPV.pour = false; hpBowlFill(); };
  if (calm) { fill(); hpSnd('crunch'); hpHearts(hpTheirs(), 1); hpSnd('boop'); return; }
  let sc = ''; try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.scoop === 'function') sc = P.FRIENDS.scoop(); } catch (e) { sc = ''; }
  // the scoop (its handle left, its mouth up) up and left of the bowl turns its mouth down over the bowl; the kibble falls from the mouth into it
  const cx = w / 2 - 23, cy = -31, dots = [0, 1, 2].map((i) => `<ellipse class="hp-kib" style="animation-delay:${0.36 + i * 0.12}s" cx="${cx + 11 + i * 5}" cy="${cy + 9 + (i % 2) * 3}" rx="5" ry="4" fill="#B07A45" stroke="${INKG}" stroke-width="1.4"/>`).join('');
  hpFxAdd(`<g transform="translate(${f1(x)} ${f1(y)})${k !== 1 ? ` scale(${k})` : ''}">${sc ? `<g class="hp-scoop">${place(sc, cx - 29, cy - 29, 58, 58)}</g>` : ''}${dots}</g>`, 1120); // TODO art fallback: the kibble dots alone. In the bowl's own units, at its scale
  setTimeout(() => { fill(); hpSnd('crunch'); }, 820); // as the first kibble lands (0.36 s + its 0.45 s fall), not before
  setTimeout(() => { hpSnd('boop'); hpHearts(hpTheirs(), 2); }, 1050);
}
// the can and the edge of the patch it waters stay above the visit buttons once the camera is there (phone review 11: at 360 the buttons cover
// the patch below its top edge): the can goes up when a button is close under it, and the drops land on the patch above the buttons
function hpCanFit() {
  const [x, y, w, h] = HP_CAN, svg = $('#view > svg.world'), M = svg && svg.getScreenCTM(), out = { lift: 0, land: y + h * 0.62 + 81 };
  const g = $('#hpG .hp-can'); if (g) g.removeAttribute('transform');
  if (!M || !g) return out;
  const inv = M.inverse(), P = (px, py) => { const p = svg.createSVGPoint(); p.x = px; p.y = py; return p.matrixTransform(inv); };
  let top = 600;
  document.querySelectorAll('#placeBtns .btn, #bar:not([hidden])').forEach((b) => { const r = b.getBoundingClientRect(); if (!r.width) return; const a = P(r.left, r.top), c = P(r.right, r.bottom); if (c.x > x - 30 && a.x < x + w + 6) top = Math.min(top, a.y); });
  out.lift = Math.max(0, Math.round(y + h + 14 - top)); out.land = Math.min(out.land, top - 8);
  if (out.lift) g.setAttribute('transform', `translate(0 ${-out.lift})`);
  return out;
}
function hpWaterFx(fit) {
  const [x, y, w, h] = HP_CAN, F = fit || { lift: 0, land: y + h * 0.62 + 81 }; sfx('water');
  if (motionOff()) return;
  const can = $('#hpG .hp-canart'); if (can) { can.classList.remove('tilt'); void can.getBoundingClientRect(); can.classList.add('tilt'); setTimeout(() => can.classList.remove('tilt'), 1100); }
  const y0 = y + h * 0.62 - F.lift, fall = Math.max(8, Math.round(F.land - y0 - 11)); // from the spout to the patch (the drop is 11 tall)
  const drops = [0, 1, 2, 3].map((i) => `<path class="hp-drop" style="animation-delay:${0.3 + i * 0.15}s;--fall:${fall}px" d="M${x - 2 - (i % 2) * 7} ${f1(y0)} q-5 8 0 11 q5 -3 0 -11z" fill="#8CC8F0" stroke="${INKG}" stroke-width="1.2"/>`).join(''); // from the spout, tipped over the patch
  const splash = [0, 1].map((i) => `<ellipse class="hp-splash" style="animation-delay:${0.75 + i * 0.3}s" cx="${x - 9 - i * 7}" cy="${f1(y0 + fall + 10)}" rx="9" ry="3.5" fill="none" stroke="#5BA7D9" stroke-width="2"/>`).join(''); // where they land
  hpFxAdd(drops + splash, 1500);
}
function hpBallFx() {
  const a = hpMine(), b = hpTheirs(); hpSnd('squeak');
  if (!b) return;
  if (motionOff() || !a) { hpJoy(b, false); hpHearts(b, 1); return; }
  const g = hpFxAdd(`<g class="hp-ball">${place(art('item', 'Tennis Ball'), -20, -20, 40, 40)}</g>`, 900); if (!g) return;
  const x0 = a.x, y0 = a.y - 90 * a.k, x1 = b.x, y1 = b.y - 120 * b.k, t0 = performance.now(), ms = 800, ball = g.firstChild;
  const step = (t) => { const k = Math.min(1, (t - t0) / ms), x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(Math.PI * k) * 120; if (ball) ball.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${Math.round(k * 540)})`); if (k < 1) requestAnimationFrame(step); else { hpJoy(b, true); hpHearts(b, 2); } };
  requestAnimationFrame(step);
}
function hpWishFx() { const b = hpTheirs(); hpSnd('chime', () => SFX.boop(880)); if (b && !b.happy) hpJoy(b, false); }
// the treat on the ground just under the eating dog's nose (phone review 10: not over its head); the happy pose brings its head down to it
function hpEatFx(g) {
  const b = hpTheirs(); hpSnd('crunch'); if (!b) return;
  hpJoy(b, false); hpHearts(b, motionOff() ? 1 : 2);
  if (motionOff()) return;
  const lf = b.face === 'left', e = frExt(b, 'happy', b.face), k = b.k, s = Math.max(30, 40 * k);
  const mx = b.x + k * (lf ? e[0] + 14 : e[2] - 14), my = b.y - 14 * k; // the nose's end, on the ground line in front of the front paws
  hpFxAdd(`<g class="hp-treat">${place(art('item', g.n), mx - s / 2, my - s / 2, s, s)}</g>`, 1000);
}
/* ---------- the snack wish: a sheet like the gift sheet (my bag's FR_GIFTS foods; only the named food when the wish names one). Not the day's gift ---------- */
function hpSnackSheet() {
  const w = HPV.wish; if (!w || w.k !== 'snack' || !hpVisitOn()) return null;
  const fid = FRV.fid, dog = hpTheirName();
  const own = frGiftsOwned().filter((g) => g.cat === 'food' && (!w.a || g.n === w.a));
  const cell = (g) => { const k = frGiftHave(g); return `<button class="btn fr-gift" type="button" data-hpsnack="${g.i}" aria-label="${esc(tt('fr.gift_aria', '{item}, you have {n}', { item: g.name, n: k }))}"><span class="fr-gic" aria-hidden="true">${art('item', g.n)}</span><span class="fr-gnm">${esc(g.name)}</span><b class="fr-gn" aria-hidden="true">${esc(tt('fr.gift_n', '×{n}', { n: k }))}</b></button>`; };
  const none = w.a ? tt('hp.snack_none', "You don't have {food} in your bag.", { food: shNameAny(w.a) }) : tt('hp.snack_empty', 'No treats in your bag right now.');
  const body = `<p>${esc(tt('hp.snack_lead', '{dog} wishes for {wish}. Pick a treat from your bag.', { dog, wish: ddWishText(w.k, w.a) }))}</p>` + (own.length ? `<div class="fr-giftgrid">${own.map(cell).join('')}</div>` : `<p class="fr-gempty">${esc(none)}</p>`);
  const p = openModal(esc(tt('hp.snack_title', 'A treat for {dog}', { dog })), `<div class="fr-gifts hp-snack">${body}</div>`, { cls: 'frsheet hp-snacksheet' });
  p.querySelectorAll('[data-hpsnack]').forEach((b) => {
    b.onclick = async () => {
      SFX.click();
      const g = frGiftRef(+b.dataset.hpsnack); if (!g || HPV.busy) return;
      const ok = await confirmIn(p, esc(tt('hp.snack_ask', 'Give 1 {food} to {dog}?', { food: g.name, dog })), esc(tt('hp.give', 'Give')), esc(tt('fr.gift_no', 'Not now')));
      if (ok) hpSnackGive(fid, g, p);
    };
  });
  return p;
}
async function hpSnackGive(fid, g, p) {
  const w = HPV.wish; if (!w || FRV.fid !== fid || frGiftHave(g) < 1 || HPV.busy) return false;
  const btns = p ? [...p.querySelectorAll('[data-hpsnack]')] : []; btns.forEach((b) => { b.disabled = true; });
  const r = await hpSend('wish', { w: w.i, a: g.i });
  btns.forEach((b) => { b.disabled = false; });
  if (r === 'ok') { frGiftTake(g); markDirty(); } // only now does the treat leave the bag (not the day's gift: S.fr.gift stays)
  if (r === 'ok' || r === 'limit' || r === 'bad') { if (!modal.hidden && modal.querySelector('.hp-snacksheet')) closeModal(); }
  if (r === 'ok' && cur.mode === 'fryard') { hpEatFx(g); hpWishFx(); }
  return r === 'ok';
}

/* ---------- the friend's side (V233.md 3.2): the claim's effects, one letter per helper per Japan day ---------- */
// my leader as my friends see it (the snapshot's first dog), else the active dog
function hpLead() { const id = S.fr && Array.isArray(S.fr.snap) ? S.fr.snap[0] : null; return (id && typeof dogById === 'function' && dogById(id)) || D(); }
function hpWaterAll() {
  if (!(typeof gkOn === 'function' && gkOn() && typeof gardenUnlocked === 'function' && gardenUnlocked())) return 0;
  try { gardenAdvance(); } catch (e) { /* the plots as they are */ }
  const pl = S.garden && Array.isArray(S.garden.plots) ? S.garden.plots : []; let n = 0;
  pl.forEach((p) => { if (p && p.crop && Number(p.g) < 1) { p.water = 3; p.wd = 0; n++; } }); // a full can, as PawGarden.water
  if (n) { markDirty(); if (gardenCtl && gardenCtl.update) { try { gardenCtl.update({ state: S.garden }); } catch (e) { /* the garden redraws on its next tick */ } } }
  return n;
}
function hpGot(ev, kind) {
  const d = hpLead(); if (!d) return true;
  let ps = null;
  if (kind === 'bowl') { if (S.hp.bowls < HP_BOWLS) { S.hp.bowls++; withDog(d, () => addStat('hunger', HP_HUNGER)); ps = ['bowl', HP_HUNGER]; } } // more: the letter only
  else if (kind === 'water') { const n = hpWaterAll(); if (n) ps = ['water', n]; }
  else {
    const a = ev.data || {}, w = typeof ddReady === 'function' && ddReady() ? withDog(d, () => ddWish(d)) : null;
    const same = !!w && !w.done && ev.day === jstISO() && Number.isInteger(a.w) && HP_WISH[a.w] === w.k && (w.k !== 'snack' || !w.a || FR_GIFTS[a.a] === w.a);
    if (same) { ddWishDone(d, w); ps = ['wish', 0]; } // its normal reward (double Bond, the count, stickers, its usual wish coins inside DD_COIN_DAY)
    else if (S.hp.gotB < HP_GOTB_MAX) { S.hp.gotB++; const n = withDog(d, () => addBond(1, { raw: true })); ps = ['bond', n]; }
  }
  hpHelpLetter(ev, kind, d, ps);
  return true;
}
HP_DO.bowl = (ev) => hpGot(ev, 'bowl');
HP_DO.water = (ev) => hpGot(ev, 'water');
HP_DO.wish = (ev) => hpGot(ev, 'wish');
function hpLetterText(m) {
  const h = m.hpHelp, who = frPairName(h.who) || tt('fr.a_friend', 'A friend'), dog = h.dog || NAME();
  const got = h.ps.some((p) => p && p[0] === 'wish'); // the wish came true (else it had already, or was another one: phone review 12)
  const say = { bowl: () => tt('hp.l_bowl', "filled {dog}'s bowl", { dog }), water: () => tt('hp.l_water', 'watered the garden'),
    wish: () => (got ? tt('hp.l_wish', "made {dog}'s wish come true", { dog }) : tt('hp.l_wish_try', "came to make {dog}'s wish come true", { dog })) };
  m.from = who;
  m.title = tt('hp.l_title', '{who} helped out!', { who });
  m.text = tt('hp.l_text', '{who} stopped by: {list}.', { who, list: tlist(h.ks.filter((k) => say[k]).map((k) => say[k]())) });
  const ps = h.ps.map(([k, n]) => (k === 'bowl' ? tt('hp.l_ps_bowl', '{dog}: +{n} Hunger.', { dog, n }) : k === 'water' ? tt('hp.l_ps_water', 'Every growing plot is watered.')
    : k === 'wish' ? tt('hp.l_ps_wish', "{dog}'s wish came true!", { dog }) : tt('hp.l_ps_bond', "{dog}'s wish had already come true, so here is +{n} Bond instead.", { dog, n })));
  if (ps.length) m.ps = ps.join(' '); else delete m.ps;
}
// id hp_help_<day>_<fid>: a later read that day adds the new helps to it and marks it unread (as frPetLetter)
function hpHelpLetter(ev, kind, d, ps) {
  if (typeof mailPush !== 'function') return;
  if (typeof mailFields === 'function') mailFields();
  const fid = ev.from.fid, id = 'hp_help_' + ev.day + '_' + fid, old = (S.mail || []).find((x) => x && x.id === id);
  const m = old || { kind: 'postcard', id, from: '', frPaw: true, hpHelp: null };
  if (!m.hpHelp || !Array.isArray(m.hpHelp.ids)) m.hpHelp = { fid, who: Array.isArray(ev.from.name) ? ev.from.name.slice(0, 2) : [0, 0], day: ev.day, ks: [], ids: [], ps: [], dog: d.name };
  const h = m.hpHelp; if (h.ids.includes(ev.id)) return;
  h.ids.push(ev.id); if (!h.ks.includes(kind)) h.ks.push(kind); if (ps) h.ps.push(ps); h.dog = d.name;
  hpLetterText(m);
  if (!old) { mailPush(m); return; }
  old.read = false; markDirty();
  if (typeof mailboxRefresh === 'function') mailboxRefresh();
}
// frInbox: a thank-you note (note 12) counts once in S.hp.thx (an event that comes back after a failed claim is the same letter)
function hpThx(ev) {
  if (!S || !ev || !Number.isInteger(ev.id)) return;
  v233Fields(S);
  if ((S.mail || []).some((m) => m && m.id === 'fr_note_' + ev.id)) return;
  S.hp.thx++; markDirty();
  setTimeout(hpStick, 0); // the first thank-you note's sticker (after the letter is in the mailbox)
}
/* ---------- Say thanks on a help letter (07b_mailbox.js letterBody's action row): note 12, that day's note for that friend ---------- */
function hpLetterAct(m) {
  if (!m || !m.hpHelp || typeof m.hpHelp.fid !== 'string' || !hpOn()) return '';
  const done = frSentToday(m.hpHelp.fid, 'note');
  return `<div class="mb-acts hp-acts"><button class="btn${done ? ' soon' : ' yes'}" type="button" data-hpthx="${esc(m.hpHelp.fid)}"${done ? ' aria-disabled="true"' : ''}>${esc(done ? tt('hp.thanked', 'Thanked today') : tt('hp.thanks', 'Say thanks'))}</button></div>`;
}
async function hpThanks(fid, btn) {
  if (!S || !fid || !hpOn() || HPV.busy) return false;
  if (frSentToday(fid, 'note')) { SFX.click(); return false; }
  SFX.click(); HPV.busy = 'note'; if (btn) btn.disabled = true;
  let r = null;
  try { r = await frApi('POST', '/friends/send', { fid, kind: 'note', data: { i: HP_NOTE } }); } catch (e) { r = null; }
  HPV.busy = ''; if (btn) btn.disabled = false;
  const shown = () => { if (btn && btn.isConnected) btn.outerHTML = hpLetterAct({ hpHelp: { fid } }).replace(/^<div[^>]*>|<\/div>$/g, ''); };
  if (r && r.ok) { frMarkSent(fid, 'note'); frDay(); S.fr.notes++; markDirty(); shown(); hpSnd('page', () => SFX.pop()); toast(tt('hp.thanks_ok', 'Thank-you note sent!'), 'good'); return true; }
  const err = frErr(r);
  if (err === 'limit') { frMarkSent(fid, 'note'); shown(); return false; }
  if (r && r.status === 404) { toast(tt('fr.not_friend', 'That friend is not on your list any more.'), ''); return false; }
  if (err === 'bad') { hpGone(); shown(); const f = frFriend(fid); toast(tt('hp.failed', "That didn't reach {name}. Try again later.", { name: frPairName(f && f.name) || tt('fr.a_friend', 'A friend') }), 'bad'); return false; }
  toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad');
  return false;
}
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest ? e.target.closest('[data-hpthx]') : null; if (!b) return;
  e.stopPropagation(); if (b.getAttribute('aria-disabled') === 'true') { SFX.click(); return; }
  hpThanks(b.dataset.hpthx, b);
});

/* ======================= part 4 (V233.md 7): the sticker page "Helping paws" =======================
   Page key 'pals', six stickers. hpPagesSync (called by 24c_badges.js msPagesSync, after the Notebook pages) puts the page in the book while
   hpOn(), before 'msb1' when it is there (else at the end), as nbPagesSync does; msPagesSync then moves the page gifts (S.dd.pg, by page
   number) with their pages within this load. Across loads the page order can differ (hpOn() waits for the Worker's hp: 1, so the first sync
   of a load may run without the page), so S.hp.pk keeps the page keys S.dd.pg was numbered by, and the first sync of a save maps the gifts
   from that order to the book's (hpPagesKeep). The page's own gift is kept in S.hp.pg while the page is out (the gate shut again), so it is
   never given twice. Nothing is written for a save that never had the page (the gate off: no S.hp writes). */
const HP_PAGE = 'pals', HP_STK = ['h5', 'h25', 'h100', 'sl1', 'host', 'thx'];
const HP_PG_COL = ['#F7B2C4', '#BDE7D2', '#FFE08A', '#CBE0F4', '#F9C99E', '#E0D5F0']; // the fallback paw stamps (TODO art fallback)
function hpPagesSync() {
  if (typeof DD_PAGES === 'undefined' || !S || !S.dd) return;
  HP.pgFirst = typeof MSB === 'undefined' || !MSB.order; // msPagesSync's first sync of this save: S.dd.pg is still numbered by S.hp.pk
  const want = hpOn() && Array.isArray(S.dogs) && S.dogs.length > 0, has = DD_PAGES.includes(HP_PAGE);
  if (want && !has) { const i = DD_PAGES.indexOf('msb1'); if (i >= 0) DD_PAGES.splice(i, 0, HP_PAGE); else DD_PAGES.push(HP_PAGE); DD.defs = null; }
  else if (!want && has) { const i = DD_PAGES.indexOf(HP_PAGE), g = S.dd.pg && S.dd.pg[i]; if (g && S.hp && S.hp.pg !== g) { S.hp.pg = g; markDirty(); } DD_PAGES.splice(i, 1); DD.defs = null; } // its gift kept (S.hp.pg) even when no sync ran since it was given
}
// S.dd.pg numbered by `from` -> numbered by `to` (page keys); a gift whose page is not in `to` is kept aside by its page key (S.hp.px; code
// review 11: dropped, it was given again with a second toast when its page came back), the "Helping paws" page's own in S.hp.pg
function hpPgMap(from, to) {
  const pg = S.dd.pg; if (!pg || typeof pg !== 'object') return;
  const g = {}; from.forEach((k, i) => { if (!pg[i]) return; const j = to.indexOf(k); if (j >= 0) g[j] = pg[i]; else if (k !== HP_PAGE && Object.keys(S.hp.px).length < 40) S.hp.px[k] = pg[i]; });
  Object.keys(pg).forEach((k) => delete pg[k]); Object.assign(pg, g); markDirty();
}
// a page kept aside is in the book again: its gift with it (never over a gift its number has now)
function hpPgBack() {
  const px = S.hp.px, pg = S.dd.pg; if (!pg || typeof pg !== 'object') return;
  Object.keys(px).forEach((k) => { const j = DD_PAGES.indexOf(k); if (j < 0) return; if (!pg[j]) pg[j] = px[k]; delete px[k]; markDirty(); });
}
// after msPagesSync has ordered the book (24c_badges.js): the first sync of a save maps the gifts from S.hp.pk, the page's gift is kept, S.hp.pk follows the book
function hpPagesKeep() {
  if (typeof DD_PAGES === 'undefined' || !S || !S.dd || !S.hp) return;
  v233Fields(S);
  const h = S.hp, now = DD_PAGES.slice(), pk = h.pk.length ? h.pk : null, i = now.indexOf(HP_PAGE);
  if (HP.pgFirst) {
    HP.pgFirst = false;
    const from = pk || now.filter((k) => k !== HP_PAGE); // no S.hp.pk: a save from before the page (numbered without it)
    if (from.join() !== now.join()) hpPgMap(from, now);
  }
  if (Object.keys(h.px).length) hpPgBack();
  if (i >= 0 && S.dd.pg) {
    const g = S.dd.pg[i];
    if (g && h.pg !== g) { h.pg = g; markDirty(); } else if (!g && h.pg) { S.dd.pg[i] = h.pg; markDirty(); } // back in the book: its gift with it
  }
  if ((i >= 0 || pk) && (!pk || pk.join() !== now.join())) { h.pk = now; markDirty(); }
}
// 48_dogdays.js ddStickerDefs: the six stickers, only while the page is in the book
function hpStickerAdd(add) {
  if (!S || !S.hp || typeof DD_PAGES === 'undefined' || !DD_PAGES.includes(HP_PAGE)) return;
  const pg = DD_PAGES.indexOf(HP_PAGE), hp = () => (S.hp && typeof S.hp === 'object' ? S.hp : {});
  [5, 25, 100].forEach((n) => add('hp_h' + n, pg, 'h:h' + n, () => tt('hp.st_helps', '{n, plural, one {# help} other {# helps}}', { n }), () => (hp().n || 0) >= n));
  add('hp_sl1', pg, 'h:sl1', () => tt('hp.st_sleep', 'The first sleepover'), () => Array.isArray(hp().sl) && hp().sl.some((r) => r && r.home));
  add('hp_host', pg, 'h:host', () => tt('hp.st_host', 'A sleepover guest'), () => (hp().host || 0) >= 1);
  add('hp_thx', pg, 'h:thx', () => tt('hp.st_thx', 'A thank-you note'), () => (hp().thx || 0) >= 1);
}
function hpPageTitle() { return tt('hp.pg', 'Helping paws'); }
// a sticker face (48_dogdays.js ddStArt, art prefix 'h:'): PawArt.FRIENDS.stk, else a paw stamp in the sticker's colour
function hpStArt(n) {
  let a = ''; try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.stk === 'function') a = P.FRIENDS.stk(n); } catch (e) { a = ''; }
  if (a) return a;
  const c = HP_PG_COL[Math.max(0, HP_STK.indexOf(n))];
  return typeof fwPawSVG === 'function' ? fwPawSVG(c) : ICON('pet'); // TODO art fallback
}
// a count went up (a help, a thank-you note, a guest): the page first (it may have just come into the book), then the stickers with their toast
function hpStick() {
  if (!S || !hpOn()) return [];
  try { if (typeof msPagesSync === 'function') msPagesSync(); return typeof ddStickers === 'function' ? ddStickers(false) : []; } catch (e) { return []; } // the book is not ready
}

/* ---------------- test hook ---------------- */
function hpExpose() {
  if (!window.__paw || window.__paw.hp) return;
  window.__paw.hp = {
    from: HP_FROM, on: () => hpOn(), test: (v) => { prefs.hpTest = !!v; return hpOn(); }, wish: () => HP_WISH.slice(), wishDo: () => HP_WISH_DO.slice(), kinds: () => HP_KINDS.slice(),
    fields: (s) => v233Fields(s), day: () => { hpDay(); return S && S.hp ? S.hp.day : ''; }, snap: () => hpSnap(), clean: (h) => hpSnapClean(h),
    acts: (list) => { const c = []; const n = hpActs(list, c); return { n, claim: c }; }, claimed: () => HP.claimed,
    srv: (v) => { if (v !== undefined) FR.hp = !!v; return FR.hp; }, old: (v) => { if (v !== undefined) FR.hpOld = !!v; return FR.hpOld; },
    load: () => frLoad(), inbox: () => frInbox(), yard: () => frYard(), push: () => { FR.yardAt = 0; return frAfterPush(); }, // the Friends plumbing (50_friends.js)
    caps: { bond: HP_BOND_MAX, gotB: HP_GOTB_MAX, bowls: HP_BOWLS, ids: HP_IDS, sl: HP_SL_KEEP, guests: HP_GUESTS },
    // part 2: the visit's helps (a tap as the strip's or a prop's), the snack sheet, the spots, the state the visit shows; gone(false) undoes a rolled-back Worker
    tap: (k, from) => hpTap(k, from || 'prop'), snack: () => hpSnackSheet(), thanks: (fid) => hpThanks(fid, null), gone: (v) => { if (v !== undefined) HP.gone = !!v; return HP.gone; },
    // part 4: the sticker page (the book's page keys, the stickers now), S.hp.pk
    pages: () => DD_PAGES.slice(), stick: () => hpStick().map((x) => x.id), page: HP_PAGE, art: (k) => hpStArt(k),
    pageOut: (k) => { const i = DD_PAGES.indexOf(k); if (i >= 0) { DD_PAGES.splice(i, 1); DD.defs = null; } }, pageIn: (k) => { if (!DD_PAGES.includes(k)) { DD_PAGES.push(k); DD.defs = null; } }, pref: (k, v) => { prefs[k] = v; }, // tests: a page out of the book and back, a harness pref
    pgLoad: () => { if (typeof MSB !== 'undefined') MSB.order = null; msPagesSync(); return DD_PAGES.slice(); }, // a load's first sync (the book's order not remembered yet)
    bowlSpot: () => hpBowlSpot(), spots: () => ({ bowl: HP_BOWL.slice(), at: HPV.bowl ? HPV.bowl.slice() : null, ink: HP_INK.slice(), paw: HP_PAW, can: HP_CAN.slice(), hunger: HP_HUNGER, note: HP_NOTE }), busy: () => HPV.busy,
    // the dogs of the visit as the bowl sees them: feet y, shortest drawn height and the drawn box of every pose they take there (world units)
    dogs: () => FRV.dogs.filter((v) => !v.hidden).map((v) => ({ mine: !!v.mine, x: v.x, y: v.y, h: v.res ? v.res.h : 0, poses: (v.play ? FR_REST.concat(FR_PLAY) : FR_REST).map((p) => { const e = frExt(v, p, v.face); return [v.x + v.k * e[0], v.y + v.k * e[1], v.x + v.k * e[2], v.y + v.k * e[3]]; }) })),
    visit: () => ({ on: hpVisitOn(), strip: [...document.querySelectorAll('#hpStrip [data-hpk]')].map((b) => ({ k: b.dataset.hpk, done: b.classList.contains('done'), rest: b.classList.contains('rest') })),
      props: [...document.querySelectorAll('#view .hp-prop[data-hp]')].map((g) => g.dataset.hp), patch: (document.querySelector('#sceneG') || { dataset: {} }).dataset.extra || '', wish: HPV.wish ? Object.assign({}, HPV.wish) : null,
      bubble: (() => { const b = document.getElementById('hpWish'); return b ? { hidden: b.hidden, done: b.classList.contains('done'), home: b.classList.contains('home'), text: b.textContent.trim() } : null; })() })
  };
}
on('game:ready', () => { setTimeout(hpExpose, 0); });
setTimeout(hpExpose, 0);
