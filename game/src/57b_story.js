/* ======================= v2.29 "Story mode", parts 1 and 2: 57b_story.js (tag sm) =======================
   Contract: V229.md. Design: docs/design/story-mode.md. Test hook: window.__paw.sm (and __paw.sc for the scene engine). Suite: v229_story.
   Gerald's Big Book of Town: a main story alongside free play, 8 chapters (SM_PLAN), each with 3-5 tasks built from things the game already
   tracks (the act bus), each task paying XP (lvGain 'story', outside the daily cap), Bond and coins once, and each chapter ending with a scene
   (57_scenes.js) that is kept in the Memories album. Part 1 built chapters 1-2 and two first-visit scenes; part 2 chapters 3-8, six more
   first-visit scenes, the big moments (Bond 5 and 10, the first puppies, town levels 5 / 10 / 15 / 20), the Missions-tab line and the
   chapter 8 photo frame "Gerald's Big Book". Chapter 7 waits for town level 6 (the Station); nothing else waits for it (V229.md Decided).
   Free play is unchanged: nothing is locked behind the story, nothing runs out, a task only moves forward.
   Save field S.story (V229.md 2, additive; S.v stays 1). Under the harness everything that shows or pays needs prefs.smTest (scenes: prefs.scTest). */
const SM_LIVE = true, SM_CATCH_CAP = 150;
function smOn() { return SM_LIVE && ((!navigator.webdriver && nwDue(NEWS_V229)) || !!(typeof prefs !== 'undefined' && prefs && prefs.smTest)); } // goes live on NEWS_V229.date
const SM_N = 8; // chapters in the whole story (all built since part 2)

/* ---------------- save (additive) ---------------- */
// fresh: a brand-new save. An old save starts with from 'old': its first quiet moment works out the chapters it has already earned (smCatchUp)
function v229Fields(s, fresh) {
  if (!s) return s; const obj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const fr = fresh && smOn() ? 'fresh' : 'old'; // a save started before the story date gets the catch-up (no first-visit scenes for places it knows)
  if (!obj(s.story)) s.story = { ch: 0, from: fr };
  const T = s.story;
  if (typeof T.ch !== 'number' || !(T.ch >= 0) || !isFinite(T.ch)) T.ch = 0;
  ['p', 't', 'c', 'm', 'w', 'bm'].forEach((k) => { if (!obj(T[k])) T[k] = {}; }); // part 2: bm = big moments handled (id -> 1)
  if (!Array.isArray(T.q)) T.q = [];
  if (T.from !== 'fresh' && T.from !== 'old') T.from = fr;
  if (typeof T.cu !== 'number') T.cu = 0;
  return s;
}

/* ---------------- the eight chapters ---------------- */
const smName = () => (S && S.dog ? NAME() : '');
const smAnyAct = (...kinds) => (a) => kinds.includes(a.kind);
// the town level (levels off: everything counts as open, like wOpen); an old save's level as saved (catch-up)
function smLv() { return typeof lvOn === 'function' && lvOn() && S && S.lv ? S.lv.lv || 1 : 99; }
const smLvOf = (s) => (s && s.lv && +s.lv.lv) || 1;
const smSeen = (s, k) => !!(s && s.lv && s.lv.seen && s.lv.seen[k]);
const smTricked = (s) => (s.dogs || []).some((d) => d && d.tricks && Object.values(d.tricks).some((v) => (typeof v === 'number' ? v >= 3 : !!v && v.p >= 1)));
const smHarvests = (s) => Object.values((s.garden && s.garden.harvests) || {}).reduce((n, v) => n + (+v || 0), 0);
// a task: m = an act that moves it (the act bus), or chk = a state that finishes it (checked every second); lv = the town level its place opens at
// (the page shows "Opens at level N"); a chapter's lv makes the whole chapter wait (chapter 7: the Station, level 6)
const SM_CH = [
  { n: 1, place: 'yard', scene: 'ch1', rw: { xp: 30, bond: 10, c: 40 },
    old: (s) => (s.walks || 0) >= 1 || smTopBond(s) >= 2,
    tasks: [
      { id: 'c1_feed', n: 1, m: smAnyAct('feed'), rw: { xp: 10, bond: 3, c: 10 }, t: () => tt('sm.c1_feed', 'Fill the food bowl for {name}', { name: smName() }) },
      { id: 'c1_pet', n: 3, m: smAnyAct('pet'), rw: { xp: 10, bond: 3, c: 10 }, t: () => tt('sm.c1_pet', 'Give {name} three good pets', { name: smName() }) },
      { id: 'c1_play', n: 1, m: smAnyAct('toy', 'fetch'), rw: { xp: 10, bond: 3, c: 10 }, t: () => tt('sm.c1_play', 'Play with a toy or a ball') },
      { id: 'c1_nap', n: 1, m: smAnyAct('nap'), rw: { xp: 10, bond: 3, c: 10 }, t: () => tt('sm.c1_nap', 'Let {name} have a nap', { name: smName() }) }
    ] },
  { n: 2, place: 'park', scene: 'ch2', rw: { xp: 40, bond: 15, c: 60 },
    old: (s) => (s.walks || 0) >= 5 && Object.keys(s.found || {}).length >= 1,
    tasks: [
      { id: 'c2_walk', n: 2, m: (a) => a.kind === 'walk' && !a.early, rw: { xp: 15, bond: 5, c: 15 }, t: () => tt('sm.c2_walk', 'Go on two walks') },
      { id: 'c2_park', n: 1, m: (a) => (a.kind === 'travel' && a.place === 'park') || (a.kind === 'walk' && a.area === 'park' && !a.early), rw: { xp: 15, bond: 5, c: 15 }, t: () => tt('sm.c2_park', 'Visit Sunny Park') },
      { id: 'c2_treasure', n: 1, m: smAnyAct('treasure'), rw: { xp: 15, bond: 5, c: 15 }, t: () => tt('sm.c2_treasure', 'Find a treasure on a walk') },
      { id: 'c2_photo', n: 1, m: smAnyAct('photo'), rw: { xp: 15, bond: 5, c: 15 }, t: () => tt('sm.c2_photo', 'Take a photo of {name}', { name: smName() }) }
    ] },
  { n: 3, place: 'market', scene: 'ch3', rw: { xp: 50, bond: 15, c: 80 },
    old: (s) => !!s.missions && ((s.missions.stamps || 0) + (s.missions.cards || 0)) >= 1 && (s.walks || 0) >= 5,
    tasks: [
      { id: 'c3_buy', n: 1, m: (a) => a.kind === 'buy' && !['tokyo', 'station', 'popup', 'stall'].includes(a.shop), rw: { xp: 20, bond: 5, c: 20 }, t: () => tt('sm.c3_buy', 'Buy something in a Market Street shop') },
      { id: 'c3_square', n: 1, m: (a) => a.kind === 'travel' && a.place === 'square', rw: { xp: 20, bond: 5, c: 20 }, t: () => tt('sm.c3_square', 'Look around the Town Square') },
      { id: 'c3_cafe', n: 1, m: (a) => a.kind === 'travel' && a.place === 'cafe', rw: { xp: 20, bond: 5, c: 20 }, t: () => tt('sm.c3_cafe', 'Ask at the Pupuccino Café') },
      { id: 'c3_mission', n: 1, m: smAnyAct('msdone'), rw: { xp: 20, bond: 5, c: 20 }, t: () => tt('sm.c3_mission', "Finish the day's mission") }
    ] },
  { n: 4, place: 'dogpark', scene: 'ch4', rw: { xp: 60, bond: 20, c: 90 },
    old: (s) => smLvOf(s) >= 2 && (smSeen(s, 'dogpark') || (s.walks || 0) >= 10),
    tasks: [
      { id: 'c4_level', n: 1, chk: () => smLv() >= 2, rw: { xp: 20, bond: 6, c: 20 }, t: () => tt('sm.c4_level', 'Reach town level 2') },
      { id: 'c4_dogpark', n: 1, lv: 2, m: (a) => a.kind === 'travel' && a.place === 'dogpark', rw: { xp: 20, bond: 6, c: 20 }, t: () => tt('sm.c4_dogpark', 'Visit the Dog Park') },
      { id: 'c4_ball', n: 3, m: smAnyAct('fetch', 'floatfetch'), rw: { xp: 20, bond: 6, c: 20 }, t: () => tt('sm.c4_ball', 'Play ball three times') },
      { id: 'c4_friend', n: 1, m: (a) => a.kind === 'paw' || a.kind === 'frvisit' || (a.kind === 'pet' && (a.dogs || 0) >= 2), rw: { xp: 20, bond: 6, c: 20 }, t: () => tt('sm.c4_friend', 'Say hello to a visiting dog, or pet two dogs at once') }
    ] },
  { n: 5, place: 'sprout', scene: 'ch5', rw: { xp: 60, bond: 15, c: 90 },
    old: (s) => smHarvests(s) >= 1,
    tasks: [
      { id: 'c5_seeds', n: 1, lv: 2, m: (a) => a.kind === 'buy' && a.cat === 'seeds', rw: { xp: 20, bond: 5, c: 20 }, t: () => tt('sm.c5_seeds', "Buy seeds at Pip's Sprout Cart") },
      { id: 'c5_plant', n: 1, lv: 2, m: (a) => a.kind === 'garden' && a.what === 'plant', rw: { xp: 20, bond: 5, c: 20 }, t: () => tt('sm.c5_plant', 'Plant them in the veggie patch') },
      { id: 'c5_water', n: 3, lv: 2, m: (a) => a.kind === 'garden' && a.what === 'water', rw: { xp: 20, bond: 5, c: 20 }, t: () => tt('sm.c5_water', 'Water the patch three times') },
      { id: 'c5_harvest', n: 1, lv: 2, m: (a) => a.kind === 'garden' && a.what === 'harvest', rw: { xp: 20, bond: 5, c: 20 }, t: () => tt('sm.c5_harvest', 'Harvest what grew') }
    ] },
  { n: 6, place: 'training', scene: 'ch6', rw: { xp: 70, bond: 20, c: 100 },
    old: (s) => smTricked(s) && (smSeen(s, 'pool') || smSeen(s, 'training')),
    tasks: [
      { id: 'c6_pool', n: 1, lv: 3, m: (a) => a.kind === 'travel' && a.place === 'pool', rw: { xp: 25, bond: 6, c: 20 }, t: () => tt('sm.c6_pool', 'Visit the Splash Pool') },
      { id: 'c6_paddle', n: 1, lv: 3, m: smAnyAct('paddle'), rw: { xp: 25, bond: 6, c: 20 }, t: () => tt('sm.c6_paddle', 'Have a paddle in the pool') },
      { id: 'c6_trick', n: 1, m: (a) => a.kind === 'trick' && !!a.learned, rw: { xp: 25, bond: 6, c: 20 }, t: () => tt('sm.c6_trick', 'Learn a new trick') },
      { id: 'c6_agility', n: 1, lv: 4, m: smAnyAct('agility'), rw: { xp: 25, bond: 6, c: 20 }, t: () => tt('sm.c6_agility', 'Do an agility run at the Training Ground') }
    ] },
  { n: 7, place: 'station', scene: 'ch7', lv: 6, rw: { xp: 80, bond: 25, c: 120 },
    old: (s) => !!s.tk && (s.tk.rides || 0) >= 1 && smTopBond(s) >= 5,
    tasks: [
      { id: 'c7_fuji', n: 1, lv: 3, m: smAnyAct('gaze'), rw: { xp: 25, bond: 8, c: 25 }, t: () => tt('sm.c7_fuji', 'Gaze at Mt. Fuji from the Lookout') },
      { id: 'c7_bond5', n: 1, chk: () => smTopBond(S) >= 5, rw: { xp: 25, bond: 8, c: 25 }, t: () => tt('sm.c7_bond5', 'Reach Bond 5 with any dog') },
      { id: 'c7_ride', n: 1, lv: 6, m: smAnyAct('ride'), rw: { xp: 25, bond: 8, c: 25 }, t: () => tt('sm.c7_ride', 'Ride the Shinkansen') },
      { id: 'c7_hachi', n: 1, lv: 6, m: (a) => (a.kind === 'stamp' && a.key === 'hachiko') || (a.kind === 'travel' && a.place === 'shibuya'), rw: { xp: 25, bond: 8, c: 25 }, t: () => tt('sm.c7_hachi', 'Visit Hachikō at Shibuya') }
    ] },
  { n: 8, place: 'square', scene: 'ch8', rw: { xp: 120, bond: 30, c: 150 },
    old: (s) => smLvOf(s) >= 10 && ((s.ph && s.ph.n) || 0) >= 3,
    tasks: [
      { id: 'c8_level', n: 1, chk: () => smLv() >= 10, rw: { xp: 30, bond: 10, c: 30 }, t: () => tt('sm.c8_level', 'Reach town level 10 (Friendly Neighbour)') },
      { id: 'c8_walks', n: 10, m: (a) => a.kind === 'walk' && !a.early, rw: { xp: 30, bond: 10, c: 30 }, t: () => tt('sm.c8_walks', 'Go on ten walks') },
      { id: 'c8_photos', n: 3, m: smAnyAct('photo'), rw: { xp: 30, bond: 10, c: 30 }, t: () => tt('sm.c8_photos', 'Take three photos for the book') },
      { id: 'c8_gift', n: 1, m: smAnyAct('gift', 'wish'), rw: { xp: 30, bond: 10, c: 30 }, t: () => tt('sm.c8_gift', "Send a friend a gift, or grant a dog's wish") }
    ] }
];
SM_CH.forEach((c) => { c.title = () => smPlanTitle(c.n); });
function smPlanTitle(n) {
  switch (n) {
    case 1: return tt('sm.c1_title', 'A New Friend in Town');
    case 2: return tt('sm.c2_title', 'Walkies!');
    case 3: return tt('sm.c3_title', 'The Missing Shopping List');
    case 4: return tt('sm.c4_title', 'Paws at the Dog Park');
    case 5: return tt('sm.c5_title', 'The Sandwich Tree');
    case 6: return tt('sm.c6_title', 'Splash, Sit, Stay');
    case 7: return tt('sm.c7_title', 'The Mountain and the Train');
    default: return tt('sm.c8_title', 'The Big Book Party');
  }
}
function smTopBond(s) { return s && Array.isArray(s.dogs) && s.dogs.length ? Math.max(1, ...s.dogs.map((d) => (d && d.bond && +d.bond.level) || 1)) : (s && s.bond && +s.bond.level) || 1; }
const smChap = (n) => SM_CH.find((c) => c.n === n) || null;

/* ---------------- rewards: each task and each chapter pays once ---------------- */
function smPay(rw, quiet) {
  const got = { xp: 0, bond: 0, c: 0 };
  if (rw.xp && typeof lvGain === 'function') got.xp = lvGain('story', rw.xp) || 0;
  if (rw.bond) got.bond = addBond(rw.bond, { raw: true });
  if (rw.c) got.c = addCoins(rw.c, { raw: true });
  if (!quiet) updateHUD();
  return got;
}
function smRwText(rw) {
  const L = []; if (rw.xp && typeof lvOn === 'function' && lvOn()) L.push(tt('sm.rw_xp', '+{n} XP', { n: rw.xp }));
  if (rw.bond) L.push(tt('sm.rw_bond', '+{n} Bond', { n: rw.bond })); if (rw.c) L.push(tt('sm.rw_coins', '+{n, plural, one {# coin} other {# coins}}', { n: rw.c }));
  return L.join(' · ');
}
// a chapter waits (no task moves) while the town level is below its own (chapter 7: level 6)
const smWaits = (ch) => !!(ch && ch.lv && smLv() < ch.lv);
// a task moves by 1 (an act) or to the end (a state); done = paid once (S.story.t)
function smBump(k, full) {
  const T = S.story; T.p[k.id] = full ? k.n : Math.min(k.n, (T.p[k.id] || 0) + 1);
  if (T.p[k.id] >= k.n) {
    T.t[k.id] = jstISO(); smPay(k.rw);
    toast(tt('sm.task_done', 'Story: {task}. {reward}', { task: k.t(), reward: smRwText(k.rw) }), 'gold');
  }
}
// one act: moves the open chapter's tasks; a task done pays once (S.story.t), the last one finishes the chapter
function smOnAct(a) {
  if (!a || !S || !S.story || !smOn()) return;
  const T = S.story, ch = smChap(T.ch); if (!ch || smWaits(ch)) return;
  let moved = false;
  ch.tasks.forEach((k) => { if (T.t[k.id] || !k.m || !k.m(a)) return; smBump(k, false); moved = true; });
  if (moved) { markDirty(); smChapterCheck(); smSync(); }
}
on('act', smOnAct);
// the state tasks (a town level, Bond 5): checked every second while their chapter is open
function smStates() {
  const T = S.story, ch = smChap(T.ch); if (!ch || smWaits(ch) || T.c[ch.n]) return false;
  let moved = false;
  ch.tasks.forEach((k) => { if (T.t[k.id] || !k.chk) return; let ok = false; try { ok = !!k.chk(); } catch (e) { ok = false; } if (ok) { smBump(k, true); moved = true; } });
  if (moved) { markDirty(); smChapterCheck(); smSync(); }
  return moved;
}
function smChapterCheck() {
  const T = S.story, ch = smChap(T.ch); if (!ch || T.c[ch.n] || !ch.tasks.every((k) => T.t[k.id])) return false;
  T.c[ch.n] = jstISO(); smPay(ch.rw); scQueue(ch.scene); T.ch = ch.n + 1; markDirty();
  setTimeout(() => toast(tt('sm.ch_done', 'Chapter {n} done: {title}! {reward}', { n: ch.n, title: ch.title(), reward: smRwText(ch.rw) }), 'gold'), 500);
  if (ch.n === SM_N) setTimeout(() => toast(tt('sm.frame_got', "A new photo frame: Gerald's Big Book. Find it in photo mode."), 'gold'), 3200);
  try { SFX.kaching(); } catch (e) { /* audio off */ }
  saveNow(); return true;
}
/* ---------------- the start, and an old save's catch-up (one scene, one letter, no flood) ---------------- */
const SM_VISITS = { park: 'visit_park', market: 'visit_market', dogpark: 'visit_dogpark', pool: 'visit_pool', training: 'visit_training', fujihill: 'visit_fuji', station: 'visit_station', beach: 'visit_beach' };
// the big moments (part 2): each plays once by itself when it happens (after its own Bond or level card: the queue waits for those), then lives in Memories
const smLvAt = (n) => () => typeof lvOn === 'function' && lvOn() && !!S.lv && (S.lv.lv || 1) >= n;
const SM_BIG = [
  { id: 'big_bond5', ok: () => smTopBond(S) >= 5 }, { id: 'big_bond10', ok: () => smTopBond(S) >= 10 }, { id: 'big_pups', ok: () => (S.pupsBorn || 0) >= 1 },
  { id: 'big_lv5', ok: smLvAt(5) }, { id: 'big_lv10', ok: smLvAt(10) }, { id: 'big_lv15', ok: smLvAt(15) }, { id: 'big_lv20', ok: smLvAt(20) }
];
// what a save has already reached when its story starts goes into the album (unwatched) without playing: no flood.
// visits: also the first-visit scenes of the places the save has surely seen (an old save)
function smBigBase(visits) {
  const T = S.story; T.bmv = 1;
  SM_BIG.forEach((b) => { let ok = false; try { ok = b.ok(); } catch (e) { ok = false; } if (ok && !T.bm[b.id]) { T.bm[b.id] = 1; T.m[b.id] = T.m[b.id] || jstISO(); } });
  if (visits) Object.entries(SM_VISITS).forEach(([pl, id]) => { if (smSeen(S, pl) || (['park', 'market'].includes(pl) && (S.walks || 0) >= 3)) T.m[id] = T.m[id] || jstISO(); });
  markDirty();
}
function smBig() {
  const T = S.story; if (T.ch < 1) return;
  if (!T.bmv) smBigBase(T.from === 'old'); // a save whose story started before part 2
  SM_BIG.forEach((b) => { if (T.bm[b.id]) return; let ok = false; try { ok = b.ok(); } catch (e) { ok = false; } if (ok) { T.bm[b.id] = 1; scQueue(b.id); markDirty(); } });
}
function smStart() {
  if (!S || !S.story || !smOn() || S.story.ch > 0 || ['title', 'adopt'].includes(cur.mode)) return false;
  if (typeof gdLive === 'function' && gdLive() && gdAllowed()) return false; // after Puppy's first day with Gerald
  const T = S.story;
  if (T.from === 'old' && !T.cu) return smCatchUp();
  T.ch = 1; smBigBase(false); scQueue('prologue'); markDirty(); return true;
}
// an old save, once: the chapters it has earned (in order, stopping at the first one not earned) are marked 'old', their scenes, the big
// moments it has reached and the places it has seen go into the album unwatched, the XP comes at once, the coins (capped at 150 for the whole
// book) in one kept letter from Gerald, and only the catch-up scene plays
function smCatchUp() {
  const T = S.story; T.cu = 1;
  const won = []; for (const ch of SM_CH) { let ok = false; try { ok = !!ch.old(S); } catch (e) { ok = false; } if (!ok) break; won.push(ch); }
  if (!won.length) { T.ch = 1; smBigBase(true); scQueue('prologue'); markDirty(); return true; }
  let xp = 0, c = 0;
  won.forEach((ch) => { ch.tasks.forEach((k) => { T.t[k.id] = T.t[k.id] || 'old'; T.p[k.id] = k.n; xp += k.rw.xp; c += k.rw.c; }); xp += ch.rw.xp; c += ch.rw.c; T.c[ch.n] = 'old'; T.m[ch.scene] = T.m[ch.scene] || jstISO(); });
  T.ch = won[won.length - 1].n + 1; c = Math.min(SM_CATCH_CAP, c);
  if (typeof lvGain === 'function') lvGain('story', xp);
  T.m.prologue = T.m.prologue || jstISO();
  smBigBase(true); // after the XP: a level the catch-up itself reaches is in the album too, not a second scene
  mailPush({ kind: 'news', id: 'sm_catchup', keep: true, from: tt('ks.letter_from', 'Gerald'), title: tt('sm.cu_title', 'The story so far'),
    text: tt('sm.cu_text', 'Dear friend,\nI am writing a storybook about our town, and you and {name} are already in it! I wrote down the {n, plural, one {chapter} other {# chapters}} you have already lived, from memory. Mostly right.\nHere are {coins} coins for the pages so far. The next chapter starts today.\nWith a happy waddle,\nGerald', { name: NAME(), n: won.length, coins: c }),
    gift: { coins: c } });
  T.cuN = won.length; scQueue('catchup'); markDirty(); saveNow(); return true;
}
// a first visit to a place with a scene (once; an old save's earlier visits are already in the album)
function smVisit(a) {
  if (!a || !S || !S.story || !smOn() || S.story.ch < 1) return;
  const pl = a.kind === 'travel' ? a.place : null, id = SM_VISITS[pl]; if (!id || S.story.m[id]) return;
  scQueue(id);
}
on('act', smVisit);
function smTick() { if (!S || !S.story || !smOn() || !titleEl.hidden) return; smStart(); if (S.story.ch > 0) { smStates(); smBig(); } smSync(); }
setInterval(() => { try { smTick(); } catch (e) { console.warn('sm tick', e); } }, 1000);

/* ---------------- the Missions tab: one pinned Story line (the open chapter, its tasks done, the next task) ---------------- */
function smMsLine() {
  if (!S || !S.story || !smOn() || S.story.ch < 1) return '';
  const T = S.story, ch = smChap(T.ch);
  let txt;
  if (!ch) txt = tt('sm.ms_done', "Story: Gerald's Big Book is finished. Watch it again in Memories.");
  else if (smWaits(ch)) txt = tt('sm.ms_wait', 'Story, Chapter {n}: opens at level {lv}.', { n: ch.n, lv: ch.lv });
  else {
    const done = ch.tasks.filter((k) => T.t[k.id]).length, next = ch.tasks.find((k) => !T.t[k.id]);
    txt = tt('sm.ms_line', 'Story, Chapter {n}: {done} of {total} tasks.', { n: ch.n, done, total: ch.tasks.length }) + (next ? ' ' + tt('sm.ms_next', 'Next: {task}', { task: next.t() }) : '');
  }
  return `<button type="button" class="sm-msline" data-smopen="story"><span class="sm-msic" aria-hidden="true">${scBookSVG(false)}</span><span class="sm-mstx">${esc(txt)}</span></button>`;
}
document.addEventListener('click', (e) => { const b = e.target && e.target.closest && e.target.closest('[data-smopen]'); if (!b || !S) return; e.stopPropagation(); try { SFX.click(); } catch (x) { /* audio off */ } smOpen(b.dataset.smopen); });

/* ---------------- the chapter 8 keepsake: one photo frame, "Gerald's Big Book" (35_photo.js lists it) ---------------- */
const smFrameName = () => tt('sm.frame', "Gerald's Big Book");
function smFrameList() { return S && S.story && S.story.c && S.story.c[SM_N] ? [{ k: 'smbook', n: smFrameName(), c: '#F28FA5' }] : []; }
// art review 2: the name sits on a cream paper label in the middle of the top band (the stamp keeps the bottom right corner to itself);
// the doodles step aside for it. The label is one path, filled and outlined from the same d, so its fill stays inside its line.
function smPostcard(w, h, o) {
  const P = window.PawArt, svg = P.postcard(w, h, Object.assign({}, o, { color: 'rose' })), s = Math.max(w, h) / 450, n = 9, gap = (w - 60 * s) / n;
  const nm = smFrameName(), len = Math.max(4, [...nm].length), sz = Math.min(13, 150 / (len * 0.46)), half = (len * 0.46 * sz) / 2 + 9, cx = w / 2, cy = 13 * s;
  const f = (v) => (+v).toFixed(1), X0 = cx - half * s, X1 = cx + half * s, T = cy - 9.5 * s, B = cy + 8.5 * s;
  const lab = `M${f(X0)} ${f(T + 1.2 * s)} Q${f(cx)} ${f(T - 1.4 * s)} ${f(X1)} ${f(T)} L${f(X1 + 1.2 * s)} ${f(B - 1 * s)} Q${f(cx)} ${f(B + 1.4 * s)} ${f(X0 - 0.8 * s)} ${f(B)} Z`;
  const g = Array.from({ length: n }, (_, i) => [30 * s + gap * (i + 0.5), i]).filter(([x]) => x < X0 - 14 * s || x > X1 + 14 * s)
    .map(([x, i]) => doodle(['heart', 'paw', 'spark'][i % 3], +x.toFixed(1), +(12 * s).toFixed(1), 0.7 * s, i % 2 ? 10 : -10)).join('')
    + `<g transform="rotate(-1.5 ${f(cx)} ${f(cy)})"><path d="${lab}" fill="#FFFBF3"/><path d="${lab}" fill="none" stroke="${INKG}" stroke-width="${f(1.6 * s)}" stroke-linejoin="round"/>`
    + `<text x="${f(cx)}" y="${f(cy + sz * 0.34 * s)}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${f(sz * s)}" fill="${INKG}">${esc(nm)}</text></g>`;
  return svg.replace(/<\/svg>\s*$/, `<g class="sm-frame">${g}</g></svg>`);
}

/* ---------------- the Story page: the chapter, its tasks, the whole book, and the Memories album ---------------- */
let smTab = 'story';
function smTaskRow(k) {
  const T = S.story, p = T.p[k.id] || 0, done = !!T.t[k.id], gate = !done && k.lv && smLv() < k.lv; // a task behind a town level: "Opens at level N" (part 2)
  return `<li class="sm-task${done ? ' done' : ''}${gate ? ' gated' : ''}"><span class="sm-tick" aria-hidden="true">${done ? doodleSVG('tick') : ''}</span><span class="sm-tt"><b>${esc(k.t())}</b><span class="small sm-rw">${gate ? `<span class="sm-lvchip">${esc(tt('sm.opens_at', 'Opens at level {n}', { n: k.lv }))}</span> ` : ''}${esc(smRwText(k.rw))}</span></span><span class="sm-n" aria-label="${esc(tt('sm.prog_aria', '{n} of {total}', { n: p, total: k.n }))}">${tnum(p)}/${tnum(k.n)}</span></li>`;
}
function doodleSVG(k) { return k === 'tick' ? `<svg viewBox="0 0 24 24"><path d="M4 13 L10 19 L20 5" fill="none" stroke="#5FA35A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : `<svg viewBox="-20 -20 40 40">${scDoodle(k, 0, 0, 1, 0)}</svg>`; }
function smStoryHTML() {
  const T = S.story, ch = smChap(T.ch);
  const head = `<div class="sm-head"><span class="sm-duck" aria-hidden="true">${scGeraldSVG('point')}</span><span class="sm-ht"><b>${esc(tt('sm.book', "Gerald's Big Book of Town"))}</b><span class="small">${esc(T.ch > 0 && T.ch <= SM_N ? tt('sm.ch_of', 'Chapter {n} of {total}', { n: Math.min(T.ch, SM_N), total: SM_N }) : T.ch > SM_N ? tt('sm.all_done', 'The whole book is written. Thank you!') : tt('sm.not_yet', 'The story starts after your first day with Gerald.'))}</span></span></div>`;
  let cur1 = '';
  if (ch) cur1 = `<section class="sm-ch${smWaits(ch) ? ' sm-gate' : ''}"><h3>${esc(tt('sm.ch_head', 'Chapter {n}: {title}', { n: ch.n, title: ch.title() }))}</h3><p class="small sm-where">${esc(placeName(ch.place))}</p>${smWaits(ch) ? `<p class="sm-waitlv"><span class="sm-lvchip">${esc(tt('sm.opens_at', 'Opens at level {n}', { n: ch.lv }))}</span> ${esc(tt('sm.c7_wait', 'Gerald is packing for Tokyo. The chapter goes on once the Station opens. Everything else in town stays open.'))}</p>` : ''}<ol class="sm-tasks">${ch.tasks.map(smTaskRow).join('')}</ol>${ch.n === 3 && typeof prOn === 'function' && prOn() && typeof prCur === 'function' && prCur() ? `<p class="small sm-hint">${esc(tt('sm.c3_board2', 'Gerald: "The town is saving up for a project: {name}. The Town projects board in the Square takes any coins."', { name: prName(prCur().id) }))}</p>` : ''}<p class="small sm-end">${esc(tt('sm.ch_reward', 'All done: {reward} and a scene for your Memories.', { reward: smRwText(ch.rw) }))}</p></section>`;
  else if (T.ch > SM_N) cur1 = `<section class="sm-ch sm-fin"><p>${esc(tt('sm.fin', "The end (for now). Gerald made you a photo frame, Gerald's Big Book, and every scene waits in Memories."))}</p></section>`;
  const list = Array.from({ length: SM_N }, (_, i) => i + 1).map((n) => { const done = !!T.c[n], now = n === T.ch; return `<li class="${done ? 'done' : now ? 'now' : 'later'}"><span class="sm-cn">${tnum(n)}</span><span class="sm-ct">${esc(smPlanTitle(n))}</span>${done ? `<span class="sm-tick" aria-hidden="true">${doodleSVG('tick')}</span>` : ''}</li>`; }).join('');
  return head + cur1 + `<ol class="sm-book" aria-label="${esc(tt('sm.chapters', 'Chapters'))}">${list}</ol>`;
}
const SM_MEM = ['prologue', 'catchup', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'visit_park', 'visit_market', 'visit_dogpark', 'visit_pool', 'visit_training', 'visit_fuji', 'visit_station', 'visit_beach',
  'big_bond5', 'big_bond10', 'big_pups', 'big_lv5', 'big_lv10', 'big_lv15', 'big_lv20'];
function smMemList() { const T = S.story; return SM_MEM.concat(Object.keys(T.m).filter((k) => !SM_MEM.includes(k))).filter((id) => T.m[id] && SC_SCRIPTS[id]); }
function smMemHTML() {
  const T = S.story, L = smMemList();
  if (!L.length) return `<p class="sm-empty">${esc(tt('sm.mem_empty', 'Your Memories album is empty for now. Every scene you see is kept here to watch again.'))}</p>`;
  return `<ul class="sm-mem">${L.map((id) => { const sc = SC_SCRIPTS[id]; return `<li class="sm-mcard${T.w[id] ? '' : ' new'}"><span class="sm-mart" aria-hidden="true">${doodleSVG(sc.icon || 'heart')}</span><span class="sm-mt"><b>${esc(sc.title())}</b><span class="small">${esc(T.w[id] ? fmtDate(T.m[id]) : tt('sm.mem_new', 'Not watched yet'))}</span></span><button class="btn yes sm-play" type="button" data-smplay="${id}">${esc(tt('sm.watch', 'Watch'))}</button></li>`; }).join('')}</ul>`;
}
function fmtDate(iso) { try { return new Date(iso + 'T12:00:00').toLocaleDateString(typeof I18N !== 'undefined' && I18N.intl ? I18N.intl : undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return String(iso || ''); } }
function smOpen(tab) {
  if (!S) return null; if (!S.story) v229Fields(S, false); if (tab) smTab = tab;
  const n = smMemList().length;
  const tabs = `<div class="tabs sm-tabs" role="tablist"><button class="btn" role="tab" data-smt="story" aria-selected="${smTab === 'story'}">${esc(tt('sm.tab_story', 'Story'))}</button><button class="btn" role="tab" data-smt="mem" aria-selected="${smTab === 'mem'}">${esc(tt('sm.tab_mem', 'Memories ({n})', { n }))}</button></div>`;
  const p = openModal(esc(tt('sm.title', 'Story')), `<div class="sm-sheet">${tabs}${smTab === 'mem' ? smMemHTML() : smStoryHTML()}</div>`, { cls: 'sm-pop sm-t-' + smTab });
  p.querySelectorAll('[data-smt]').forEach((b) => { b.onclick = () => { SFX.click(); smOpen(b.dataset.smt); }; });
  p.querySelectorAll('[data-smplay]').forEach((b) => { b.onclick = () => { SFX.click(); smReplay(b.dataset.smplay); }; });
  return p;
}
// a replay from the album: the sheet closes, the scene plays (it counts as watched), the album comes back
function smReplay(id) {
  closeModal();
  setTimeout(() => { scPlay(id, { replay: true, onEnd: () => { if (S && S.story) { S.story.w[id] = 1; markDirty(); } setTimeout(() => smOpen('mem'), 120); } }); }, 60);
}
function smMenuBtn() { return S && smOn() ? `<button class="btn big" id="mmSm"><span class="ic">${doodleSVG('heart')}</span>${esc(tt('sm.menu', 'Story'))}</button>` : ''; }
// the desktop top-bar button (next to the camera); phones open the Story from the "..." menu
const smBtn = document.createElement('button');
smBtn.id = 'smBtn'; smBtn.className = 'iconbtn'; smBtn.type = 'button'; smBtn.hidden = true;
smBtn.onclick = () => { try { firstGesture(); } catch (e) { /* no gesture hook */ } SFX.click(); smOpen(); };
$('#muteBtn').insertAdjacentElement('afterend', smBtn);
function smSync() {
  const show = !!(S && smOn() && S.story && ['yard', 'market', 'map', 'shelter'].includes(cur.mode));
  if (smBtn.hidden === show) smBtn.hidden = !show;
  if (!show) return;
  const l = tt('sm.menu', 'Story'); if (smBtn.title !== l) { smBtn.title = l; smBtn.setAttribute('aria-label', l); smBtn.innerHTML = scBookSVG(false); }
  const T = S.story, ch = smChap(T.ch), left = ch && !smWaits(ch) ? ch.tasks.filter((k) => !T.t[k.id]).length : 0;
  smBtn.dataset.left = String(left);
}

/* ---------------- the scenes (SC_SCRIPTS for 57_scenes.js) ---------------- */
// coordinates are the 1000x600 scene box; the dog's feet stand near y 500 on the yard and the town scenes
Object.assign(SC_SCRIPTS, {
  prologue: { title: () => tt('sm.s_pro', "Gerald's big idea"), sting: 'discover', icon: 'sun', shots: () => [
    { d: 4, bg: 'card', cam: [[500, 300, 1], [500, 300, 1.08]], title: () => tt('sm.book', "Gerald's Big Book of Town"),
      cap: () => tt('sm.s_pro1', 'Gerald has a big idea: a storybook about the whole town.'),
      actors: [{ who: 'book', at: [600, 500], s: 1.6 }, { who: 'gerald', pose: 'wave', at: [380, 520], s: 1.5 }] },
    { d: 4.5, bg: 'yard', cam: [[500, 300, 1], [440, 380, 1.35]], cap: () => tt('sm.s_pro2', 'Every good book needs a hero. Gerald looked around the yard, and there was {name}.', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'idle', pose2: 'happy', at: [470, 500], t0: 0.55, t1: 0.6 }, { who: 'gerald', pose: 'wave', at: [-60, 505], to: [270, 505], t0: 0.1, t1: 0.7, hop: 6, s: 0.9 }] },
    { d: 4, bg: 'card', cam: [[500, 300, 1.05], [500, 300, 1]], title: () => tt('sm.ch_head', 'Chapter {n}: {title}', { n: 1, title: smPlanTitle(1) }),
      cap: () => tt('sm.s_pro3', 'Your story starts today. Gerald brought his best crayon.'),
      actors: [{ who: 'book', open: true, at: [500, 470], s: 1.1 }, { who: 'gerald', pose: 'cheer', at: [230, 540], s: 1.2 }, { who: 'dog', pose: 'sit', at: [780, 545], s: 0.9 }] }
  ] },
  ch1: { title: () => tt('sm.s_ch1', 'Home sweet home'), sting: 'levelup', icon: 'heart', shots: () => [
    { d: 4, bg: 'yard', cam: [[400, 360, 1.6], [470, 350, 1.25]], cap: () => tt('sm.s_ch1a', '{name} knows every corner of the yard now: the food bowl, the nap spot and the best patch of sun.', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'walk', pose2: 'sit', at: [330, 500], to: [470, 500], t1: 0.7, hop: 5 }] },
    { d: 4.5, bg: 'yard', cam: [[560, 340, 1.2], [580, 330, 1.3]], cap: () => tt('sm.s_ch1b', 'Gerald wrote it all down. Then he crossed some of it out. Then he wrote it down again, neater.'),
      actors: [{ who: 'dog', pose: 'happy', expr: 'hearts', at: [470, 500] }, { who: 'gerald', pose: 'point', face: 'left', at: [1080, 505], to: [720, 505], t1: 0.6, hop: 6, s: 0.9 },
        { who: 'doodle', k: 'heart', at: [470, 330], to: [450, 230], fade: 'out', s: 0.8 }, { who: 'doodle', k: 'heart', at: [520, 340], to: [560, 250], t0: 0.2, fade: 'out', s: 0.6 }] },
    { d: 4, bg: 'card', cam: [[500, 300, 1], [500, 300, 1.06]], title: () => tt('sm.s_done', 'Chapter {n} done: {title}', { n: 1, title: smPlanTitle(1) }),
      cap: () => tt('sm.s_ch1c', '{name} feels at home. Next: Chapter 2, {title}', { name: NAME(), title: smPlanTitle(2) }),
      actors: [{ who: 'book', open: true, at: [500, 470], s: 1.1 }, { who: 'dog', pose: 'sit', at: [790, 545], s: 0.9 }] }
  ] },
  ch2: { title: () => tt('sm.s_ch2', 'The big walk'), sting: 'levelup', icon: 'paw', shots: () => [
    { d: 4.5, bg: 'park', cam: [[260, 330, 1.4], [700, 330, 1.4]], cap: () => tt('sm.s_ch2a', 'Two walks, one treasure and a photo. {name} has seen a lot of the world this week.', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'walk', pose2: 'happy', at: [120, 505], to: [760, 505], t1: 0.92, hop: 10 }] },
    { d: 4.5, bg: 'park', cam: [[560, 360, 1.5], [560, 360, 1.6]], cap: () => tt('sm.s_ch2b', 'Gerald read the map upside down the whole way. Nobody told him. It was still a lovely walk.'),
      actors: [{ who: 'dog', pose: 'sit', at: [470, 505] }, { who: 'gerald', pose: 'sit', face: 'left', at: [660, 510], s: 0.9 }, { who: 'doodle', k: 'sun', at: [600, 330], to: [600, 310], s: 0.9 }] },
    { d: 3.5, bg: 'card', cam: [[500, 300, 1], [500, 300, 1.06]], title: () => tt('sm.s_done', 'Chapter {n} done: {title}', { n: 2, title: smPlanTitle(2) }),
      cap: () => tt('sm.s_ch2c', "Next time: Gerald's shopping list goes missing on Market Street."),
      actors: [{ who: 'book', open: true, at: [500, 470], s: 1.1 }, { who: 'gerald', pose: 'wave', at: [230, 540], s: 1.1 }] }
  ] },
  visit_park: { title: () => tt('sm.s_park', 'First day at Sunny Park'), sting: 'discover', icon: 'sun', shots: () => [
    { d: 5, bg: 'park', cam: [[500, 300, 1], [440, 350, 1.35]], cap: () => tt('sm.s_park1', '{name} sees Sunny Park for the very first time.', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'walk', pose2: 'happy', at: [-80, 505], to: [430, 505], t1: 0.75, hop: 8 }] },
    { d: 5, bg: 'park', cam: [[430, 400, 1.7], [430, 390, 1.9]], cap: () => tt('sm.s_park2', 'Grass to roll in, benches to sniff and room to run. {name} approves.', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'sniff', pose2: 'rollover', at: [430, 505], t0: 0.55, t1: 0.6 }] }
  ] },
  visit_market: { title: () => tt('sm.s_market', 'First stroll down Market Street'), sting: 'discover', icon: 'paw', shots: () => [
    { d: 5, bg: 'market', cam: [[300, 320, 1.3], [680, 320, 1.3]], cap: () => tt('sm.s_mkt1', 'Market Street smells of fresh bread, apples and adventure.'),
      actors: [{ who: 'dog', pose: 'walk', pose2: 'sniff', at: [150, 510], to: [660, 510], t1: 0.8, hop: 6 }] },
    { d: 5, bg: 'market', cam: [[660, 380, 1.7], [660, 380, 1.85]], cap: () => tt('sm.s_mkt2', '{name} would like one of everything, please.', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'beg', at: [660, 510] }, { who: 'doodle', k: 'heart', at: [700, 340], to: [720, 280], fade: 'out', s: 0.7 }] }
  ] },
  catchup: { title: () => tt('sm.cu_title', 'The story so far'), sting: 'discover', icon: 'sun', shots: () => [
    { d: 4, bg: 'card', cam: [[500, 300, 1], [500, 300, 1.06]], title: () => tt('sm.cu_title', 'The story so far'),
      cap: () => tt('sm.s_cu1', 'Gerald has been writing a storybook about the town, and you are already in it!'),
      actors: [{ who: 'book', at: [600, 500], s: 1.6 }, { who: 'gerald', pose: 'wave', at: [380, 520], s: 1.5 }] },
    { d: 4.5, bg: 'card', cam: [[500, 300, 1.06], [500, 300, 1]], title: () => smDoneTitles(),
      cap: () => tt('sm.s_cu2', '{n, plural, one {One chapter is} other {# chapters are}} already written. Gerald copied them out from memory. Mostly right.', { n: (S.story && S.story.cuN) || 1 }),
      actors: [{ who: 'book', open: true, at: [500, 560], s: 0.9 }] },
    { d: 4, bg: 'yard', cam: [[470, 360, 1.3], [470, 350, 1.45]], cap: () => tt('sm.s_cu3', 'On to the next page together, {name}!', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'happy', at: [470, 500] }, { who: 'gerald', pose: 'cheer', at: [250, 505], s: 0.9 }] }
  ] }
});
// the catch-up card: up to three chapter lines; a longer catch-up shows the range and its last chapter (it must fit at 360 px)
function smDoneTitles() {
  const T = S.story, L = SM_CH.filter((c) => T.c[c.n]), head = (c) => tt('sm.ch_head', 'Chapter {n}: {title}', { n: c.n, title: c.title() });
  return L.length <= 3 ? L.map(head).join('\n') : tt('sm.cu_range', 'Chapters 1 to {n}', { n: L[L.length - 1].n }) + '\n' + head(L[L.length - 1]);
}

/* ---------------- part 2: the scenes of chapters 3-8, six first visits and the big moments ---------------- */
const smDoneShot = (n, cap, d, more) => ({ d: d || 3.5, bg: 'card', cam: [[500, 300, 1], [500, 300, 1.06]], title: () => tt('sm.s_done', 'Chapter {n} done: {title}', { n, title: smPlanTitle(n) }),
  cap, actors: [{ who: 'book', open: true, at: [500, 470], s: 1.1 }].concat(more || []) });
const smNext = (n) => () => tt('sm.s_next', 'Next: Chapter {n}, {title}', { n, title: smPlanTitle(n) });
// a first visit: two shots on the place itself, 10 s
const smVisitScene = (bg, title, c1, c2, icon, pose2) => ({ title, sting: 'discover', icon: icon || 'paw', shots: () => [
  { d: 5, bg, cam: [[500, 300, 1], [460, 350, 1.3]], cap: c1, actors: [{ who: 'dog', pose: 'walk', pose2: 'happy', at: [-80, 505], to: [450, 505], t1: 0.75, hop: 8 }] },
  { d: 5, bg, cam: [[450, 390, 1.6], [450, 380, 1.8]], cap: c2, actors: [{ who: 'dog', pose: 'sniff', pose2: pose2 || 'sit', at: [450, 505], t0: 0.5, t1: 0.55 }, { who: 'doodle', k: 'heart', at: [470, 330], to: [450, 250], t0: 0.55, fade: 'out', s: 0.7 }] }
] });
// a big moment: the dog on the yard with floating doodles, then Gerald's page for it, 10-11 s
const smBigScene = (title, cardTitle, c1, c2, o) => ({ title, sting: 'levelup', icon: (o && o.icon) || 'spark', shots: () => [
  { d: 5.5, bg: (o && o.bg) || 'yard', cam: [[470, 360, 1.25], [470, 350, 1.5]], cap: c1,
    actors: [{ who: 'dog', pose: 'happy', expr: (o && o.expr) || 'hearts', at: [470, 500] }].concat((o && o.more) || [], [{ who: 'doodle', k: (o && o.k) || 'heart', at: [440, 330], to: [420, 230], fade: 'out', s: 0.8 }, { who: 'doodle', k: (o && o.k) || 'heart', at: [520, 340], to: [560, 240], t0: 0.25, fade: 'out', s: 0.6 }]) },
  { d: 5, bg: 'card', cam: [[500, 300, 1], [500, 300, 1.06]], title: cardTitle, cap: c2,
    actors: [{ who: 'book', open: true, at: [500, 470], s: 1.1 }, { who: 'gerald', pose: 'cheer', at: [230, 540], s: 1.1 }, { who: 'doodle', k: (o && o.k) || 'heart', at: [760, 420], s: 1.6 }] }
] });
const smLvScene = (n, c1) => smBigScene(() => tt('sm.s_lv', 'Town level {n}', { n }), () => tt('sm.s_lv', 'Town level {n}', { n }), c1, () => tt('sm.s_lv2', 'Gerald stuck a gold star on the page. Then another one, to be safe.'),
  { bg: 'square', k: 'spark', expr: 'proud', more: [{ who: 'gerald', pose: 'cheer', at: [250, 505], s: 0.9 }] });
Object.assign(SC_SCRIPTS, {
  ch3: { title: () => tt('sm.s_ch3', 'Found it!'), sting: 'levelup', icon: 'paw', shots: () => [
    { d: 4.5, bg: 'market', cam: [[300, 330, 1.3], [640, 330, 1.3]], cap: () => tt('sm.s_ch3a', 'Gerald lost his shopping list. He looked in every shop on Market Street. Twice.'),
      actors: [{ who: 'gerald', pose: 'point', at: [160, 510], to: [620, 510], t1: 0.9, hop: 6, s: 0.9 }, { who: 'dog', pose: 'sniff', at: [40, 510], to: [440, 510], t1: 0.95 }] },
    { d: 5, bg: 'square', cam: [[520, 380, 1.5], [540, 340, 1.75]], cap: () => tt('sm.s_ch3b', "{name} sniffed it out: the list was on top of Gerald's head all along. He had been wearing it like a hat.", { name: NAME() }),
      actors: [{ who: 'gerald', pose: 'sit', face: 'left', at: [600, 510], s: 1 }, { who: 'prop', k: 'list', at: [600, 400], to: [600, 330], t0: 0.35, t1: 0.75, s: 0.5 }, { who: 'dog', pose: 'sniff', pose2: 'happy', at: [420, 510], t1: 0.4 }] },
    smDoneShot(3, smNext(4), 3.5, [{ who: 'prop', k: 'list', at: [790, 520], s: 0.7 }])
  ] },
  ch4: { title: () => tt('sm.s_ch4', 'Best friends'), sting: 'levelup', icon: 'heart', shots: () => [
    { d: 5, bg: 'dogpark', cam: [[500, 330, 1.2], [500, 360, 1.4]], cap: () => tt('sm.s_ch4a', '{name} made a friend at the Dog Park. They found the same stick at the same time.', { name: NAME() }),
      actors: [{ who: 'prop', k: 'stick', at: [500, 520], s: 0.8 }, { who: 'dog', pose: 'walk', pose2: 'sniff', at: [-60, 505], to: [380, 505], t1: 0.8, hop: 6 }, { who: 'dog', dog: 'other', face: 'left', pose: 'walk', pose2: 'sniff', at: [1060, 505], to: [620, 505], t1: 0.8, hop: 6 }] },
    { d: 4.5, bg: 'dogpark', cam: [[500, 400, 1.7], [500, 400, 1.9]], cap: () => tt('sm.s_ch4b', 'They shared it. Mostly.'),
      actors: [{ who: 'dog', pose: 'sit', at: [400, 510] }, { who: 'dog', dog: 'other', face: 'left', pose: 'sit', at: [600, 510] }, { who: 'prop', k: 'stick', on: [[0, 'r', -0.07, 0.43], [1, 'l', 0.07, 0.43]], off: [0, 22], s: 0.8 }, { who: 'doodle', k: 'heart', at: [500, 330], to: [500, 250], fade: 'out', s: 0.8 }] },
    smDoneShot(4, smNext(5))
  ] },
  ch5: { title: () => tt('sm.s_ch5', 'Not a sandwich'), sting: 'levelup', icon: 'flower', shots: () => [
    { d: 4.5, bg: 'yard', cam: [[420, 380, 1.4], [440, 360, 1.5]], cap: () => tt('sm.s_ch5a', 'Gerald planted a seed and waited for a sandwich tree.'),
      actors: [{ who: 'gerald', pose: 'sit', at: [360, 510], s: 1 }, { who: 'prop', k: 'sandwich', at: [380, 330], to: [380, 300], fade: 'out', s: 0.6 }, { who: 'dog', pose: 'sit', at: [600, 510], s: 0.9 }] },
    { d: 5, bg: 'yard', cam: [[500, 400, 1.6], [500, 400, 1.8]], cap: () => tt('sm.s_ch5b', 'It grew a carrot. {name} thinks a carrot is even better. Pip waved from the Sprout Cart.', { name: NAME() }),
      actors: [{ who: 'prop', k: 'carrot', at: [500, 590], to: [500, 520], t0: 0.1, t1: 0.5, s: 0.6 }, { who: 'dog', pose: 'sniff', pose2: 'happy', at: [330, 510], t1: 0.55 }, { who: 'gerald', pose: 'point', face: 'left', at: [690, 510], s: 0.9 }] },
    smDoneShot(5, smNext(6), 3.5, [{ who: 'prop', k: 'carrot', at: [800, 560], s: 0.6 }])
  ] },
  ch6: { title: () => tt('sm.s_ch6', 'Gold rosette'), sting: 'levelup', icon: 'spark', shots: () => [
    { d: 5, bg: 'training', cam: [[380, 340, 1.3], [620, 330, 1.3]], cap: () => tt('sm.s_ch6a', '{name} cleared the last jump in slow motion. Well, it felt like slow motion.', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'jump', pose2: 'happy', at: [240, 505], to: [700, 505], t0: 0.1, t1: 0.9, hop: 60 }] },
    { d: 4.5, bg: 'training', cam: [[560, 380, 1.5], [560, 380, 1.65]], cap: () => tt('sm.s_ch6b', 'Gerald held up a 10. He drew it himself.'),
      actors: [{ who: 'dog', pose: 'sit', at: [440, 510] }, { who: 'prop', k: 'rosette', on: [[0, 'r', -0.37, 0.58]], off: [0, 45], s: 0.45 }, { who: 'gerald', pose: 'cheer', face: 'left', at: [700, 515], s: 0.9 }, { who: 'prop', k: 'sign10', on: [[2, 'r', -0.12, 0.3]], s: 0.6 }] },
    smDoneShot(6, smNext(7), 3.5, [{ who: 'prop', k: 'rosette', at: [810, 560], s: 0.55 }])
  ] },
  ch7: { title: () => tt('sm.s_ch7', 'Postcard from Tokyo'), sting: 'levelup', icon: 'sun', shots: () => [
    { d: 5, bg: 'fujihill', cam: [[500, 300, 1.05], [520, 320, 1.15]], cap: () => tt('sm.s_ch7a', 'The Shinkansen slid past Mt. Fuji. {name} kept a nose on the window the whole way.', { name: NAME() }),
      actors: [{ who: 'prop', k: 'train', at: [-260, 540], to: [1260, 540], s: 1 }] },
    { d: 4.5, bg: 'shibuya', cam: [[480, 360, 1.35], [480, 360, 1.5]], cap: () => tt('sm.s_ch7b', 'At Shibuya, {name} said hello to Hachikō, the most loyal dog in Tokyo.', { name: NAME() }),
      actors: [{ who: 'dog', pose: 'sit', at: [440, 510] }, { who: 'gerald', pose: 'wave', face: 'left', at: [640, 515], s: 0.9 }] },
    smDoneShot(7, smNext(8))
  ] },
  ch8: { title: () => tt('sm.s_ch8', 'The end (for now)'), sting: 'levelup', icon: 'heart', shots: () => [
    { d: 5, bg: 'square', cam: [[500, 330, 1.15], [500, 360, 1.3]], cap: () => tt('sm.s_ch8a', 'The whole town came to the Square for the Big Book party.'),
      actors: [{ who: 'prop', k: 'flags', at: [500, 250], s: 1.1 }, { who: 'dog', pose: 'happy', at: [420, 510] }, { who: 'dog', dog: 'other', face: 'left', pose: 'happy', at: [640, 510], s: 0.9 }, { who: 'gerald', pose: 'cheer', at: [-40, 515], to: [230, 515], t1: 0.6, hop: 6, s: 0.9 }] },
    { d: 4.5, bg: 'card', cam: [[500, 320, 1.05], [500, 340, 1.15]], cap: () => tt('sm.s_ch8b', 'Gerald opened the book, and out fell... his sandwich! He had used it as a bookmark on page one.'),
      actors: [{ who: 'book', open: true, at: [500, 420], s: 1.1 }, { who: 'prop', k: 'sandwich', at: [500, 330], to: [520, 560], t0: 0.3, t1: 0.75, s: 0.8 }, { who: 'gerald', pose: 'wave', at: [220, 560], s: 1 }] },
    { d: 4, bg: 'card', cam: [[500, 300, 1], [500, 300, 1.06]], title: () => tt('sm.s_ch8', 'The end (for now)'),
      cap: () => tt('sm.s_ch8c', "Thank you for being in Gerald's book, {name}. He made you a photo frame to keep.", { name: NAME() }),
      actors: [{ who: 'book', at: [500, 520], s: 1.2 }, { who: 'dog', pose: 'sit', at: [790, 545], s: 0.9 }, { who: 'gerald', pose: 'cheer', at: [220, 545], s: 1.1 }] }
  ] },
  visit_dogpark: smVisitScene('dogpark', () => tt('sm.s_vdp', 'First visit to the Dog Park'), () => tt('sm.s_vdp1', '{name} hears the Dog Park before seeing it: barks, squeaks and happy panting.', { name: NAME() }),
    () => tt('sm.s_vdp2', 'So many new noses to sniff. {name} has found the place.', { name: NAME() }), 'paw', 'happy'),
  visit_pool: smVisitScene('pool', () => tt('sm.s_vpool', 'First splash at the Splash Pool'), () => tt('sm.s_vpool1', '{name} looks at the Splash Pool. The Splash Pool looks back.', { name: NAME() }),
    () => tt('sm.s_vpool2', 'One careful paw, then four happy ones. Splash!'), 'sun', 'happy'),
  visit_training: smVisitScene('training', () => tt('sm.s_vtr', 'First day at the Training Ground'), () => tt('sm.s_vtr1', 'Jumps, tunnels and weave poles: the Training Ground is a playground with rules.'),
    () => tt('sm.s_vtr2', '{name} sits very nicely. A treat appears. This is a good system.', { name: NAME() }), 'spark', 'sit'),
  visit_fuji: smVisitScene('fujihill', () => tt('sm.s_vfuji', 'Mt. Fuji Lookout'), () => tt('sm.s_vfuji1', 'At the Lookout, Mt. Fuji fills the whole sky.'),
    () => tt('sm.s_vfuji2', '{name} sits and looks for a long time. Some views need no words.', { name: NAME() }), 'sun', 'sit'),
  visit_station: smVisitScene('station', () => tt('sm.s_vst', 'All aboard at the Station'), () => tt('sm.s_vst1', 'The Station hums with trains, bells and bento boxes.'),
    () => tt('sm.s_vst2', '{name} has a ticket, a window seat and a very waggy tail.', { name: NAME() }), 'paw', 'happy'),
  visit_beach: smVisitScene('beach', () => tt('sm.s_vbeach', 'First paws on Seashell Beach'), () => tt('sm.s_vbeach1', 'Sand! Waves! Shells! {name} does not know where to run first.', { name: NAME() }),
    () => tt('sm.s_vbeach2', 'So {name} runs everywhere first.', { name: NAME() }), 'sun', 'happy'),
  big_bond5: smBigScene(() => tt('sm.s_b5', 'Bond 5: best buddies'), () => tt('sm.s_b5', 'Bond 5: best buddies'), () => tt('sm.s_b5a', 'Bond 5! You and {name} trust each other a whole lot now.', { name: NAME() }),
    () => tt('sm.s_b5b', 'Gerald gave it a page of its own and drew a very big heart.')),
  big_bond10: smBigScene(() => tt('sm.s_b10', 'Bond 10: friends for ever'), () => tt('sm.s_b10', 'Bond 10: friends for ever'), () => tt('sm.s_b10a', 'Bond 10! {name} would follow you anywhere. Even to the bath.', { name: NAME() }),
    () => tt('sm.s_b10b', 'Gerald says this page is his favourite. He says that about every page.'), { k: 'spark' }),
  big_pups: smBigScene(() => tt('sm.s_pups', 'The first puppies'), () => tt('sm.s_pups', 'The first puppies'), () => tt('sm.s_pupsa', 'Tiny paws, big yawns: the first puppies are home!'),
    () => tt('sm.s_pupsb', 'Gerald wrote their names very carefully, with his best crayon.'), { expr: 'proud', more: [{ who: 'dog', dog: 'pup', pose: 'sit', at: [650, 505], s: 0.7 }] }),
  big_lv5: smLvScene(5, () => tt('sm.s_lv5', 'Town level 5! The neighbours wave at {name} by name now.', { name: NAME() })),
  big_lv10: smLvScene(10, () => tt('sm.s_lv10', 'Town level 10, Friendly Neighbour! Half the town knows {name}, and the other half wants to.', { name: NAME() })),
  big_lv15: smLvScene(15, () => tt('sm.s_lv15', 'Town level 15! Even the pigeons on the Square make room for {name}.', { name: NAME() })),
  big_lv20: smLvScene(20, () => tt('sm.s_lv20', 'Town level 20, Town Favourite! There is talk of a statue. A small one, in crayon.'))
});

/* ---------------- the hook ---------------- */
on('game:ready', () => { smExpose(); smSync(); });
setInterval(() => { try { smExpose(); } catch (e) { /* not booted */ } }, 1000);
function smExpose() {
  if (!window.__paw || window.__paw.sm) return;
  window.__paw.sm = { on: () => smOn(), test: (v) => { prefs.smTest = !!v; }, fields: (s, fresh) => v229Fields(s, !!fresh), start: () => smStart(), open: (t) => smOpen(t), chapters: () => SM_CH.map((c) => ({ n: c.n, lv: c.lv || 0, tasks: c.tasks.map((k) => ({ id: k.id, n: k.n, rw: k.rw, lv: k.lv || 0, state: !!k.chk })), rw: c.rw })),
    // part 2 test hooks: jump to chapter n (the chapters before it marked done without pay), the state tasks and big moments now, the frames
    goto: (n) => { const T = S.story; SM_CH.forEach((c) => { if (c.n < n) { T.c[c.n] = T.c[c.n] || 'test'; c.tasks.forEach((k) => { T.t[k.id] = T.t[k.id] || 'test'; T.p[k.id] = k.n; }); } }); T.ch = n; markDirty(); smSync(); return T.ch; },
    states: () => smStates(), big: () => smBig(), waits: () => smWaits(smChap(S.story.ch)), lv: () => smLv(), frames: () => smFrameList().map((f) => f.k), msline: () => smMsLine(), BIG: SM_BIG.map((b) => b.id), VISITS: Object.assign({}, SM_VISITS),
    act: (kind, d) => trackAct(kind, d || {}), titles: () => Array.from({ length: SM_N }, (_, i) => smPlanTitle(i + 1)), mem: () => smMemList(), replay: (id) => smReplay(id), CAP: SM_CATCH_CAP };
  window.__paw.sc = { test: (v) => { prefs.scTest = !!v; }, play: (id) => scPlay(id, { replay: true }), auto: (id) => scPlayAuto(id), queue: (id) => scQueue(id), on: () => (SC.on ? SC.on.id : null), skip: () => scEnd(true), calm: () => scCalmNow(),
    play: (id, o) => scPlay(id, o), ids: () => Object.keys(SC_SCRIPTS), dur: (id) => { const s = SC_SCRIPTS[id]; return s ? s.shots(D()).reduce((n, x) => n + (x.d || 4), 0) : 0; }, SKIP: SC_SKIP_MS, sd: (id) => { const s = SC_SCRIPTS[id]; return s ? s.shots(D()).map((x) => x.d || 4) : []; }, seek: (ms) => { if (SC.on) SC.on.t0 = performance.now() - ms; return !!SC.on; }, cur: () => { const P = SC.on; if (!P || P.shot < 0) return null; const off = (a) => { const pt = a.to || a.at || [500, 500]; return a.fit === false || a.fade === 'out' || pt[0] < 0 || pt[0] > 1000; }; return { shot: P.shot, off: P.shots[P.shot].actors.map(off), f: P.fit ? P.fit.f : 1 }; }, gap: (v) => { if (typeof v === 'number') SC.lastEnd = v; return SC.lastEnd; } };
}
