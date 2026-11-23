/* ======================= v2.33 "Helping paws": 60_helps.js (tag hp, V233.md) =======================
   Friends help each other: on a yard visit a friend fills the bowl, waters the garden or makes a wish come true, and says thanks; a dog goes
   for a sleepover (60b_sleep.js, tag sl). This file: the gate, the save (S.hp), the snapshot's hp field and the inbox's acts.
   Part 1 (V233.md 14.1) is the plumbing only: hpActs records and claims act ids safely, and each kind's effect is a handler in HP_DO that
   parts 2 (bowl, water, wish) and 3 (sleep, in 60b_sleep.js) fill in. No new coins (V233.md 0).
   Gate (V233.md 1): HP_FROM. '' = no launch date yet: off. 'YYYY-MM-DD' = on from 00:00 JST that day. The Worker's HP_FROM carries the same
     text (test_v233_worker checks it). hpOn() also needs Friends (frOn) and a Worker that said hp: 1 in GET /friends (FR.hp, memory only).
     Tests turn it on with prefs.hpTest; never under webdriver otherwise. While off: no hp snapshot field, no ?hp=1, no S.hp writes beyond
     the migration defaults (v233Fields).
   Test hook: window.__paw.hp. Suites: v233_helps (game), v233_worker (Worker). */
const HP_FROM = ''; // LAUNCH DATE (owner): 'YYYY-MM-DD' = on from 00:00 JST that day. Keep cloudflare/worker.js HP_FROM and NEWS_V233.date the same
/* append only, never reorder: the Worker knows its length (HP_LIM.wish) and the doable kinds (HP_WISH_DO). The DD_WACT wish kinds (48_dogdays.js) */
const HP_WISH = ['pet', 'ball', 'snack', 'walk', 'bath', 'nap', 'trick', 'toy', 'place', 'paddle', 'garden', 'photo', 'wear'];
const HP_WISH_DO = [0, 1, 2]; // the wishes a visitor can make come true: pet, ball, snack
const HP_KINDS = ['bowl', 'water', 'wish', 'sleep']; // the Worker's HP_KINDS: friend_acts kinds
const HP_BOND_MAX = 5, HP_GOTB_MAX = 5, HP_BOWLS = 3, HP_IDS = 90, HP_SL_KEEP = 10, HP_GUESTS = 2, HP_GROW_MAX = 6;
// what each act kind does on the friend's side: HP_DO[kind](act) -> false to leave the act unclaimed for now (a third guest waits for
// tomorrow), anything else = done (claimed, its id kept in S.hp.ids so it never applies twice). Parts 2 and 3 fill these in
const HP_DO = {};
const HP = { claimed: 0 }; // memory only: acts sent to the claim this load (tests)

function hpOn() {
  if (typeof frOn !== 'function' || !frOn()) return false;
  if (typeof FR === 'undefined' || !FR.hp) return false; // an older Worker never says hp: 1, so the game stays v2.32.1 with it
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

/* ---------------- test hook ---------------- */
function hpExpose() {
  if (!window.__paw || window.__paw.hp) return;
  window.__paw.hp = {
    from: HP_FROM, on: () => hpOn(), test: (v) => { prefs.hpTest = !!v; return hpOn(); }, wish: () => HP_WISH.slice(), wishDo: () => HP_WISH_DO.slice(), kinds: () => HP_KINDS.slice(),
    fields: (s) => v233Fields(s), day: () => { hpDay(); return S && S.hp ? S.hp.day : ''; }, snap: () => hpSnap(), clean: (h) => hpSnapClean(h),
    acts: (list) => { const c = []; const n = hpActs(list, c); return { n, claim: c }; }, claimed: () => HP.claimed,
    srv: (v) => { if (v !== undefined) FR.hp = !!v; return FR.hp; }, old: (v) => { if (v !== undefined) FR.hpOld = !!v; return FR.hpOld; },
    load: () => frLoad(), inbox: () => frInbox(), yard: () => frYard(), push: () => { FR.yardAt = 0; return frAfterPush(); }, // the Friends plumbing (50_friends.js)
    caps: { bond: HP_BOND_MAX, gotB: HP_GOTB_MAX, bowls: HP_BOWLS, ids: HP_IDS, sl: HP_SL_KEEP, guests: HP_GUESTS }
  };
}
on('game:ready', () => { setTimeout(hpExpose, 0); });
setTimeout(hpExpose, 0);
