/* ======================= v2.20 "Missions v2": 24e_notebook.js (MISSIONS lane, Part E: Gerald's town notebook) =======================
   Contract: V220.md (section 3, part E). Design: docs/design/missions-v2.md 3.4, 5 and its "Decided" section (14 days, old saves get NO notebook,
   rewards arrive by themselves). Only for a save that started with Puppy's first day (S.fw.fresh): S.missions.nb is null on an old save, kept so.
   One page opens for each day played (a local day with a paw on the calendar; a missed day costs nothing, earlier pages stay open), its steps in
   any order. A step whose place is still locked reads "Opens at Bond N" (the same Bond gates the next-unlock line reads: ROUTES, PLACES, the
   garden and kitchen unlocks, Tokyo). Page 1 is the five first-day steps (FW_STEPS), done already when the first day was walked.
   A finished page: a sticker on two "Notebook" pages of the sticker book (12 stickers, nbStickerAdd), or its gift from the design table:
   3 Carrot Seeds (day 3), the First Week frame and Gerald's letter (day 7, a popup), the title Town Regular and a Bond 1-2 decoration not owned
   (day 14, a popup, and its sticker). Each page carries one two-sentence lesson in Gerald's voice and a link to the matching How to play lesson.
   The Notebook tab shows while a new player has unfinished pages (msNbShown); the finished notebook moves under Badges (msNbDoneHTML).
   Calm: the soft dot for a new page or a finished one, batched toasts through ms2Say, popups only on days 7 and 14 and only in a quiet yard.
   Under the test harness all of it needs prefs.msTest (msAllowed). Save: S.missions.nb (v220Fields): pages, done, got + day, p, seen, pop, dec.
   Test hook: window.__paw.msn. */
const NB = { pg: 0, dot: false, fold: false };
const NB_N = 14, NB_ST_PAGES = ['nb1', 'nb2'];
const NB_STICKERS = [1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14]; // the 12 pages that give a sticker (day 3 gives seeds, day 7 the frame and the letter)
const NB_TITLE = 'Town Regular', NB_FRAME = 'nbw';
// the player's own day (the calendar's paws are local days). Through Date.now, so a clock stub moves it too
const nbDay = () => localISO(new Date(Date.now()));
// a Bond gate: 0 when it is open, else the Bond it opens at
const nbAt = (n) => (topBond() >= n ? 0 : n);
const nbRoute = (k) => nbAt((ROUTES[k] && ROUTES[k].bond) || 1);
const nbPlace = (k, b) => nbAt((PLACES[k] && PLACES[k].bond) || b || 1); // b: its Bond when the place is not on this map yet
const nbGarden = () => (gardenUnlocked() ? 0 : 2);
const nbKitchen = () => (kitchenUnlocked() ? 0 : 3);
const nbTokyo = () => nbAt(typeof TK_STATION_BOND === 'number' ? TK_STATION_BOND : 3);
const nbJob = () => nbAt(typeof FF_GAMES === 'object' ? Math.min(...Object.keys(FF_GAMES).filter((k) => FF_GAMES[k].job).map((k) => FF_GAMES[k].bond || 1)) : 2);
const nbFfGame = (a, job) => a.kind === 'funfair' && typeof FF_GAMES === 'object' && !!FF_GAMES[a.game] && !!FF_GAMES[a.game].job === job;
// page 1: a first-day step walked with Gerald (S.guide, 25_guide.js / FW_STEPS)
const nbFw = (i) => { const g = S.guide; return !!(g && g.fw && ((g.done && !g.skipped) || (typeof g.step === 'number' && g.step > i))); };
const nbMission = () => !!(S.missions && S.missions.date === jstISO() && S.missions.list.length && S.missions.list.every((x) => x && x.done));
/* the 14 pages. t: the title, l: Gerald's lesson (two kind sentences, true dog facts), how: the How to play lesson it links to, st: the sticker
   art, gift: 'seeds' | 'week' | 'regular' (else a sticker). Steps: k, t: the line, n: how many, m: does an act count, s: a state that counts,
   lock: 0 or the Bond its place opens at */
const MS_NB = [
  { id: 'p1', t: "Puppy's first day", l: 'A new puppy feels safest with a calm routine. Meals, play and naps at about the same times help a lot.', how: 'pet', st: 'i:pet', steps: [
    { k: 'pet', t: 'Say hello with a good rub', m: (a) => a.kind === 'pet', s: () => nbFw(0) },
    { k: 'feed', t: 'Fill the food bowl', m: (a) => a.kind === 'feed' && a.name !== 'Fresh Water', s: () => nbFw(1) },
    { k: 'ball', t: 'Throw the ball', m: (a) => a.kind === 'fetch', s: () => nbFw(2) },
    { k: 'tag', t: 'Make a name tag', m: (a) => a.kind === 'nametag', s: () => nbFw(3) },
    { k: 'walk', t: 'Go for a short walk', m: (a) => a.kind === 'walk', s: () => nbFw(4) }] },
  { id: 'p2', t: 'Settling in', l: 'Puppies sleep up to 18 hours a day. A tired dog is a happy dog.', how: 'nap', st: 'i:zzz', steps: [
    { k: 'bath', t: 'Bath time', m: (a) => a.kind === 'bath' },
    { k: 'nap', t: 'Tuck {dog} in for a nap', m: (a) => a.kind === 'nap' },
    { k: 'wear', t: 'Try on the Bond 2 party gift, or any outfit', m: (a) => a.kind === 'wear', lock: () => (S.inv.clothes.length ? 0 : 2) }] },
  { id: 'p3', t: 'The veggie patch', l: 'Carrots are a crunchy snack that dogs can eat safely. Onions and garlic are never safe for dogs, so they never grow here.', how: 'garden', gift: 'seeds', steps: [
    { k: 'plant', t: 'Plant a seed', m: (a) => a.kind === 'garden' && a.what === 'plant', lock: nbGarden },
    { k: 'water', t: 'Water it', m: (a) => a.kind === 'garden' && a.what === 'water', lock: nbGarden },
    { k: 'river', t: 'Walk the Riverside Trail', m: (a) => a.kind === 'walk' && a.area === 'river', lock: () => nbRoute('river') }] },
  { id: 'p4', t: 'Around town', l: 'Dogs see the world through their noses. A good sniff is great exercise for the brain.', how: 'map', st: 'i:dogpark', steps: [
    { k: 'dogpark', t: 'Visit the Dog Park', m: (a) => a.kind === 'travel' && a.place === 'dogpark', lock: () => nbPlace('dogpark', 2) },
    { k: 'mail', t: 'Open the mailbox', m: (a) => a.kind === 'mail' || a.kind === 'collect' },
    { k: 'snack', t: 'Buy a snack at Kibble Corner', m: (a) => a.kind === 'buy' && a.cat === 'food' }] },
  { id: 'p5', t: 'First trick', l: 'Short lessons work best, just a few minutes at a time. Praise and a small treat help a dog remember.', how: 'pet', st: 'i:star', steps: [
    { k: 'sit', t: 'Practise Sit three times', n: 3, m: (a) => a.kind === 'trick' && a.name === 'Sit' },
    { k: 'wish', t: "Make {dog}'s wish come true", m: (a) => a.kind === 'wish' }] },
  { id: 'p6', t: 'From garden to bowl', l: "Plain cooked chicken, rice and carrots are gentle on a dog's tummy. Treats stay small, about a tenth of the day's food.", how: 'garden', st: 'i:kitchen', steps: [
    { k: 'harvest', t: 'Harvest a crop', m: (a) => a.kind === 'garden' && a.what === 'harvest', lock: nbGarden },
    { k: 'cook', t: 'Cook a dish in the kitchen', m: (a) => a.kind === 'cook', lock: nbKitchen },
    { k: 'dish', t: 'Serve the dish to {dog}', m: (a) => a.kind === 'dish', lock: nbKitchen }] },
  { id: 'p7', t: 'One week together', l: 'Dogs talk with their whole body. Watch the tail, the ears and the eyes, and you will learn a lot.', how: 'missions', gift: 'week', steps: [
    { k: 'photo', t: 'Take a photo of your pack', m: (a) => a.kind === 'photo' },
    { k: 'mission', t: "Finish today's mission", s: nbMission }] },
  { id: 'p8', t: 'Splash!', l: 'Not every dog is a born swimmer. A life vest and shallow water keep a paddle safe and fun.', how: 'pool', st: 'i:water-spray', steps: [
    { k: 'paddle', t: 'Paddle at the Splash Pool', m: (a) => a.kind === 'paddle', lock: () => nbPlace('pool', 2) },
    { k: 'float', t: 'Play float fetch', m: (a) => a.kind === 'floatfetch', lock: () => nbPlace('pool', 2) }] },
  { id: 'p9', t: 'Fun Fair', l: 'Play helps dogs learn and keeps them happy. A few short games a day are plenty.', how: 'funfair', st: 't:Paper Kite', steps: [
    { k: 'game', t: 'Play a Fun Fair game', m: (a) => nbFfGame(a, false) },
    { k: 'job', t: 'Help with a town job', m: (a) => nbFfGame(a, true), lock: nbJob }] },
  { id: 'p10', t: 'Training Ground', l: 'Agility is great fun for fit, grown-up dogs. Puppies keep to the low jumps while their joints are still growing.', how: 'agility', st: 't:Agility Tunnel', steps: [
    { k: 'agility', t: 'Run the agility course', m: (a) => a.kind === 'agility', lock: () => nbPlace('training', 3) }] },
  { id: 'p11', t: 'All aboard', l: 'Most dogs travel best with something that smells like home. Start with short trips and lots of praise.', how: 'map', st: 't:Train Ticket', steps: [
    { k: 'ride', t: 'Ride the train to Tokyo', m: (a) => a.kind === 'ride', lock: nbTokyo },
    { k: 'stamp', t: 'Collect a station stamp', m: (a) => a.kind === 'stamp', lock: nbTokyo }] },
  { id: 'p12', t: 'Home sweet home', l: 'Every dog likes a quiet corner of its own. A soft bed away from busy doors helps it rest.', how: 'nap', st: 'i:sleep', steps: [
    { k: 'decor', t: 'Move a decoration', m: (a) => a.kind === 'decorate' },
    { k: 'move', t: 'Move into another house or bed', m: (a) => a.kind === 'house' || a.kind === 'bed' }] },
  { id: 'p13', t: 'A new trail', l: 'A new path is full of new smells. Let your dog stop and sniff, because sniffing is part of the walk.', how: 'walk', st: 'i:walk', steps: [
    { k: 'trail', t: 'Walk Sunflower Lanes or the Bamboo Grove', m: (a) => a.kind === 'walk' && (a.area === 'sunflower' || a.area === 'bamboo'), lock: () => { const a = nbRoute('sunflower'), b = nbRoute('bamboo'); return !a || !b ? 0 : Math.min(a, b); } }] },
  { id: 'p14', t: 'Town regular', l: 'Dogs love a friendly routine and familiar faces. You and {dog} are part of the town now.', how: 'missions', gift: 'regular', st: 'i:mail', steps: [
    { k: 'board', t: 'Fill two rows of the help-wanted board', s: () => typeof msWeekDone === 'function' && msWeekDone() >= 2 }] }
];
const nbPage = (n) => MS_NB[n - 1] || null;
const nbTitle = (p) => tdata('ms_nb.' + p.id + '.t', p.t);
const nbStepText = (p, s) => tdata('ms_nb.' + p.id + '.steps.' + s.k + '.t', s.t, { dog: NAME() });
const nbLesson = (p) => tdata('ms_nb.' + p.id + '.l', p.l, { dog: NAME() });

/* ---------------- state ---------------- */
// a new player's notebook (S.fw.fresh and nb not null), only while missions may progress (the harness: prefs.msTest)
function nbOk() { return !!(S && S.missions && S.missions.nb && S.fw && S.fw.fresh && Array.isArray(S.dogs) && S.dogs.length && msAllowed()); }
const nbNb = () => S.missions.nb;
const nbStepsDone = (n) => { const d = nbNb().done[n]; return Array.isArray(d) ? d : []; };
const nbFinished = (n) => nbNb().got.includes(n);
const nbAllDone = () => nbNb().got.length >= NB_N;
const nbLockOf = (s) => { try { return s.lock ? +s.lock() || 0 : 0; } catch (e) { return 0; } };
function msNbShown() { return nbOk() && !nbAllDone(); }
// a page opens for each day played (pages 1-14); a skipped day opens only the next page. Then the state steps (page 1, the mission, the board)
function msNbTick() {
  if (!nbOk() || cur.mode === 'title' || cur.mode === 'adopt') return false;
  const nb = nbNb(), d = nbDay(); let opened = false;
  if (nb.pages < NB_N && (!nb.day || d > nb.day)) {
    nb.pages++; nb.day = d; opened = true; markDirty();
    if (nb.pages > 1) { NB.pg = 0; ms2Say(tt('ms2n.new_page', "A new page in Gerald's notebook: {page}. Find it in Missions, under Notebook.", { page: nbTitle(nbPage(nb.pages)) }), 'good', 'msnp'); msHudSync(); }
  }
  const got = nbStates();
  if (opened || got) msRefresh();
  return opened;
}
// the steps that count by state: page 1 from the first-day guide, today's mission, the help-wanted board
function nbStates() {
  const nb = nbNb(); let any = false;
  for (let n = 1; n <= nb.pages; n++) {
    if (nbFinished(n)) continue;
    nbPage(n).steps.forEach((s, i) => { let ok = false; if (s.s && !nbStepsDone(n).includes(i)) { try { ok = !!s.s(); } catch (e) { ok = false; } } if (ok) { nbMark(n, i); any = true; } });
  }
  return any;
}
function nbMark(n, i) {
  const nb = nbNb(); if (!Array.isArray(nb.done[n])) nb.done[n] = [];
  if (nb.done[n].includes(i)) return false;
  nb.done[n].push(i); nb.done[n].sort((a, b) => a - b); markDirty();
  if (nb.done[n].length >= nbPage(n).steps.length) nbFinish(n);
  return true;
}
function msNbOnAct(a) {
  if (!a || !a.kind || !nbOk() || cur.mode === 'title') return;
  const nb = nbNb(); let changed = false;
  for (let n = 1; n <= nb.pages; n++) {
    if (nbFinished(n)) continue;
    nbPage(n).steps.forEach((s, i) => {
      if (!s.m || nbStepsDone(n).includes(i)) return;
      let hit = false; try { hit = !!s.m(a); } catch (e) { hit = false; }
      if (!hit) return;
      changed = true;
      if ((s.n || 1) > 1) { const k = n + '.' + i; nb.p[k] = Math.min(s.n, (nb.p[k] || 0) + 1); markDirty(); if (nb.p[k] < s.n) return; }
      nbMark(n, i);
    });
  }
  if (nbStates()) changed = true;
  if (changed) msRefresh();
}
on('act', msNbOnAct); // after msWeekOnAct (24d_week.js loads first), so the board's rows are counted before day 14 looks

/* ---------------- gifts ---------------- */
function nbFinish(n) {
  const nb = nbNb(); if (nbFinished(n)) return; nb.got.push(n); markDirty();
  const p = nbPage(n), page = nbTitle(p);
  if (p.gift === 'seeds') {
    if (!S.inv.seeds || typeof S.inv.seeds !== 'object') S.inv.seeds = {}; S.inv.seeds.carrot = (S.inv.seeds.carrot || 0) + 3;
    ms2Say(tt('ms2n.done_seeds', 'Notebook page done: {page}. Gerald gives you 3 {seeds} for the veggie patch.', { page, seeds: nbSeedName() }), 'gold', 'msnd');
  } else if (p.gift === 'week') {
    if (S.dd && Array.isArray(S.dd.fr) && !S.dd.fr.includes(NB_FRAME)) S.dd.fr.push(NB_FRAME);
    nbLetter(); nb.pop.push(7);
  } else if (p.gift === 'regular') {
    jrFields(); if (!S.titles[NB_TITLE]) { S.titles[NB_TITLE] = localISO(); if (!S.title) { S.title = NB_TITLE; try { jrShowTitle(); } catch (e) { /* the HUD is not up */ } } }
    nb.dec = nbDecorGift(); nb.pop.push(14);
  }
  if (NB_STICKERS.includes(n)) {
    try { if (typeof ddStickers === 'function') { msPagesSync(); ddStickers(true); } } catch (e) { /* no sticker book yet */ }
    if (p.gift !== 'regular') ms2Say(tt('ms2n.done_sticker', 'Notebook page done: {page}. A new sticker for your sticker book.', { page }), 'gold', 'msnd', (k) => tt('ms2n.done_many', '{n} notebook pages done. New stickers in your sticker book.', { n: k }));
  }
  NB.dot = true; msHudSync(true);
  try { SFX.kaching(); } catch (e) { /* audio off */ }
}
const nbSeedName = () => (typeof fwDgSeedName === 'function' ? fwDgSeedName() : 'Carrot Seeds');
// day 14: the first Bond 1-2 shop decoration not owned (a yard or house decoration, not a festival one), else three biscuits
function nbDecorGift() {
  const n = Object.keys(HM_DECOR).find((k) => { const x = HM_DECOR[k]; return x.v27 && x.kind === 'decor' && !x.fest && !x.ed && !x.fm && !x.reward && (x.bond || 1) <= 2 && !(S.decor && S.decor[k]); });
  if (n) { if (typeof hmDecorFields === 'function') hmDecorFields(); S.decor = S.decor || {}; S.decor[n] = { got: localISO(), out: false }; markDirty(); return n; }
  S.inv.food['Bone-shaped Biscuit'] = (S.inv.food['Bone-shaped Biscuit'] || 0) + 3; markDirty(); return '';
}
function nbLetter() {
  if (typeof mailPush !== 'function') return;
  mailPush({ kind: 'news', id: 'nb_week', from: tt('ms2n.letter_from', 'Gerald'), title: tt('ms2n.letter_title', 'One week in town'),
    text: tt('ms2n.letter_text', 'Dear friend, it has been a whole week since {name} came home. You feed, you play, you walk, and {name} is happier every day. Seven more pages of my notebook are waiting for you, one for each day you play.', { name: NAME() }),
    ps: tt('ms2n.letter_ps', 'Gerald, who writes everything down') });
}
// the two gift popups (days 7 and 14), in a quiet yard: no modal, no guide, no level-up card
function nbPopTick() {
  if (!S || !S.missions || !S.missions.nb || !msAllowed()) return;
  const nb = S.missions.nb; if (!Array.isArray(nb.pop) || !nb.pop.length) return;
  if (cur.mode !== 'yard' || !modal.hidden || busy || msGuideBusy() || (typeof levelQueue !== 'undefined' && levelQueue.length) || (typeof MSB === 'object' && MSB.medal)) return;
  nbPopup(nb.pop.shift()); markDirty();
}
function nbPopup(day) {
  const nb = S.missions.nb, frame = typeof fwFrameSVG === 'function' ? fwFrameSVG('#C3B1E6') : ICON('camera');
  const title = day === 14 ? tt('ms2n.pop14_title', 'Town Regular!') : tt('ms2n.pop7_title', 'One week together!');
  const text = day === 14
    ? (nb.dec ? tt('ms2n.pop14_text', 'Fourteen pages! You and {name} know the whole town now. Your new title is Town Regular, and Gerald gives you the {decor} for your home. Put it out with Arrange the yard.', { name: NAME(), decor: tdata('hm_decor.' + tid(nb.dec) + '.n', nb.dec) })
      : tt('ms2n.pop14_food', 'Fourteen pages! You and {name} know the whole town now. Your new title is Town Regular, and Gerald gives you three {food}.', { name: NAME(), food: shNameAny('Bone-shaped Biscuit') }))
    : tt('ms2n.pop7_text', 'Seven pages, and {name} already feels at home. Gerald gives you the First Week photo frame for photo mode, and there is a letter for you in the mailbox.', { name: NAME() });
  const ic = day === 14 ? ((nb.dec && artReal('prop', (HM_DECOR[nb.dec] || {}).prop)) || iconOr('star', doodle('spark', 0, 0, 1))) : frame;
  const p = openModal(esc(title), `<div class="nb-pop"><span class="nb-popic" aria-hidden="true">${ic}</span><p>${esc(text)}</p></div>`, { cls: 'nb-giftpop', foot: `<button class="btn yes" type="button" id="nbPopOk">${esc(tt('ms2n.ok', 'Lovely'))}</button>` });
  try { SFX.fanfare(); } catch (e) { /* audio off */ }
  const o = p.querySelector('#nbPopOk'); if (o) o.onclick = () => { SFX.click(); closeModal(); };
  return p;
}

/* ---------------- the two Notebook sticker pages ---------------- */
// in the book while the save has a notebook, just before the Badges pages (msPagesSync calls this before it orders the Badges pages)
function nbPagesSync() {
  if (typeof DD_PAGES === 'undefined' || !S) return;
  const want = msAllowed() && !!(S.missions && S.missions.nb && S.fw && S.fw.fresh) && Array.isArray(S.dogs) && S.dogs.length > 0, has = DD_PAGES.includes(NB_ST_PAGES[0]);
  if (want && !has) { const i = DD_PAGES.indexOf('msb1'); if (i >= 0) DD_PAGES.splice(i, 0, ...NB_ST_PAGES); else DD_PAGES.push(...NB_ST_PAGES); DD.defs = null; }
  else if (!want && has) { DD_PAGES.splice(DD_PAGES.indexOf(NB_ST_PAGES[0]), NB_ST_PAGES.length); DD.defs = null; }
}
function nbStickerAdd(add) {
  if (!S || !S.missions || !S.missions.nb || !DD_PAGES.includes(NB_ST_PAGES[0])) return;
  const pg = DD_PAGES.indexOf(NB_ST_PAGES[0]);
  NB_STICKERS.forEach((n, i) => { const p = nbPage(n); add('nb_' + p.id, pg + Math.floor(i / 6), p.st, () => nbTitle(p), () => !!(S.missions.nb && S.missions.nb.got.includes(n))); });
}
function nbPageTitle(k) { return k === 'nb2' ? tt('ms2n.pg_2', "Gerald's notebook: week two") : tt('ms2n.pg_1', "Gerald's notebook: week one"); }

/* ---------------- the Notebook tab ---------------- */
function msNbDot() { if (!nbOk()) return false; const nb = nbNb(); return NB.dot || nb.pages > Math.max(1, nb.seen || 0); }
// the How to play lesson a page links to: its title (the eight lessons, the Training Ground, the Splash Pool, the Fun Fair cards)
function nbHowTitle(k) {
  const r = GD_LESSONS.find((x) => x[0] === k); if (r) return tdata('gd_lessons.' + r[0] + '_' + r[1] + '.2', r[2]);
  let l = null; try { l = k === 'agility' && typeof agLesson === 'function' ? agLesson() : k === 'pool' && typeof plLesson === 'function' ? plLesson() : k === 'funfair' && typeof ffLesson === 'function' ? ffLesson() : null; } catch (e) { l = null; }
  return Array.isArray(l) ? l[2] : tt('journal.tab_howto', 'How to play');
}
// the plain notebook page (lined paper, a red margin, every fill inside its outline) until the art lane's PawArt.MISSIONS.page is merged
function nbPageFB() {
  const lines = Array.from({ length: 9 }, (_, i) => `<path d="M8 ${24 + i * 14} H192" stroke="#CBE0F4" stroke-width="1.4"/>`).join('');
  return `<svg viewBox="0 0 200 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="196" height="146" rx="5" fill="#FFFDF6" stroke="#5B3D32" stroke-width="2"/>${lines}<path d="M28 4 V146" stroke="#F28FA5" stroke-width="1.6"/></svg>`;
}
function nbStepHTML(n, s, i) {
  const nb = nbNb(), done = nbStepsDone(n).includes(i), lock = done ? 0 : nbLockOf(s), cnt = (s.n || 1) > 1 && !done ? Math.min(s.n, nb.p[n + '.' + i] || 0) : -1;
  const right = done ? `<span class="nb-ok">${esc(tt('ms2n.step_done', 'Done'))}</span>` : lock ? `<span class="nb-lock">${esc(tt('ms2n.opens_at', 'Opens at Bond {n}', { n: lock }))}</span>` : cnt >= 0 ? `<span class="nb-cnt">${tnum(cnt)} / ${tnum(s.n)}</span>` : '';
  return `<li class="nb-step${done ? ' done' : ''}${lock ? ' locked' : ''}" data-step="${esc(s.k)}">${MS_TICK}<span class="nb-st">${esc(nbStepText(nbPage(n), s))}</span>${right}</li>`;
}
function nbGiftText(p) {
  if (p.gift === 'seeds') return tt('ms2n.gift_seeds', '3 {seeds}', { seeds: nbSeedName() });
  if (p.gift === 'week') return tt('ms2n.gift_week', 'the First Week photo frame and a letter from Gerald');
  if (p.gift === 'regular') return tt('ms2n.gift_regular', 'the title Town Regular, a decoration for your home and a sticker');
  return tt('ms2n.gift_sticker', 'a sticker for your sticker book');
}
// the whole tab (or, with all, the finished notebook under Badges): one page at a time, Back and Next
function msNbHTML(all) {
  if (!S || !S.missions || !S.missions.nb) return '';
  const nb = nbNb(), open = Math.max(1, nb.pages);
  if (!all && (nb.seen || 0) < nb.pages) { nb.seen = nb.pages; markDirty(); }
  if (NB.dot && !all) { NB.dot = false; setTimeout(() => msHudSync(), 0); }
  let n = NB.pg; if (!(n >= 1 && n <= open)) { n = 0; for (let i = 1; i <= open; i++) if (!nbFinished(i)) { n = i; break; } if (!n) n = open; } NB.pg = n;
  const p = nbPage(n), fin = nbFinished(n), pa = ms2Art('page');
  const head = `<div class="nb-head"><div class="nb-headtxt"><h3>${esc(tt('ms2n.title', "Gerald's town notebook"))}</h3><p class="nb-count"><b>${esc(tt('ms2n.count', '{n} of {total} pages done', { n: nb.got.length, total: NB_N }))}</b></p>`
    + `<p class="nb-intro">${esc(tt('ms2n.intro', 'A new page opens on each day you play. The days do not need to be in a row, and the steps can go in any order.'))}</p></div></div>`;
  const steps = p.steps.map((s, i) => nbStepHTML(n, s, i)).join('');
  const gift = `<p class="nb-gift${fin ? ' got' : ''}"><span class="nb-gic" aria-hidden="true">${p.gift === 'week' && typeof fwFrameSVG === 'function' ? fwFrameSVG('#C3B1E6') : p.gift === 'seeds' ? art('item', 'Carrot Seeds') : iconOr('star', doodle('spark', 0, 0, 1))}</span><span>${esc(fin ? tt('ms2n.gift_got', 'Page done. Your gift: {gift}.', { gift: nbGiftText(p) }) : tt('ms2n.gift_todo', 'Finish this page for {gift}.', { gift: nbGiftText(p) }))}</span></p>`;
  const page = `<article class="nb-page${pa ? ' art' : ''}${fin ? ' done' : ''}" data-page="${n}" aria-label="${esc(nbTitle(p))}"><span class="nb-pageart" aria-hidden="true">${pa || nbPageFB()}</span>`
    + `<header class="nb-phead"><span class="nb-day">${esc(tt('ms2n.day', 'Day {n}', { n }))}</span><h4>${esc(nbTitle(p))}</h4></header><ul class="nb-steps">${steps}</ul>${gift}`
    + `<p class="nb-lesson"><b>${esc(tt('ms2n.gerald_says', 'Gerald says'))}</b> ${esc(nbLesson(p))}</p>`
    + `<p class="nb-howrow"><button class="btn nb-how" type="button" data-nbhow="${esc(p.how)}">${esc(tt('ms2n.how', 'How to play: {lesson}', { lesson: nbHowTitle(p.how) }))}</button></p></article>`;
  const more = !all && n === open && nb.pages < NB_N ? `<p class="nb-next">${esc(tt('ms2n.next_day', 'Page {n} opens on the next day you play.', { n: nb.pages + 1 }))}</p>` : '';
  const flip = `<div class="nb-flip"><button class="btn" type="button" data-nbpg="${n - 1}"${n <= 1 ? ' disabled' : ''}><span aria-hidden="true">‹</span> ${esc(tt('dd.prev', 'Back'))}</button><span class="nb-pgn">${esc(tt('ms2n.page_n', 'Page {i} of {n}', { i: n, n: open }))}</span><button class="btn" type="button" data-nbpg="${n + 1}"${n >= open ? ' disabled' : ''}>${esc(tt('dd.next', 'Next'))} <span aria-hidden="true">›</span></button></div>`;
  return `<div class="nb${all ? ' all' : ''}">${head}${page}${more}${flip}</div>`;
}
// the finished notebook, folded at the bottom of Badges (24c_badges.js msBadgesHTML)
function msNbDoneHTML() {
  if (!S || !S.missions || !S.missions.nb || !msAllowed() || S.missions.nb.got.length < NB_N) return '';
  return `<details class="nb-fold"${NB.fold ? ' open' : ''}><summary>${esc(tt('ms2n.fold', "Gerald's town notebook: all {n} pages done", { n: NB_N }))}</summary>${msNbHTML(true)}</details>`;
}
// the How to play page, at the lesson the notebook page links to
function nbHowOpen(k) {
  SFX.click(); openJournal('howto');
  setTimeout(() => { const li = document.querySelector(`#modal .gd-lesson[data-lesson="${CSS.escape(k)}"]`); if (!li) return; li.classList.add('nb-hl'); try { li.scrollIntoView({ block: 'center' }); } catch (e) { /* old browser */ } }, 60);
}
document.addEventListener('click', (e) => {
  const t = e.target && e.target.closest; if (!t || !S) return;
  const f = e.target.closest('[data-nbpg]'); if (f && f.closest('.nb')) { e.stopPropagation(); if (f.disabled) return; SFX.click(); NB.pg = +f.dataset.nbpg; msRefresh(); return; }
  const h = e.target.closest('.nb-how[data-nbhow]'); if (h) { e.stopPropagation(); nbHowOpen(h.dataset.nbhow); return; }
  const s = e.target.closest('.nb-fold > summary'); if (s) NB.fold = !s.parentElement.open;
});

/* ---------------- wiring ---------------- */
setInterval(() => { if (!S || cur.mode === 'title') return; try { if (titleEl.hidden) msNbTick(); nbPopTick(); } catch (e) { console.warn('notebook', e); } }, 1000);
function nbExpose() {
  if (!window.__paw) return;
  window.__paw.msn = {
    pages: () => MS_NB.map((p) => p.id), shown: () => msNbShown(), tick: () => msNbTick(), day: () => nbDay(), nb: () => S.missions.nb, html: (all) => msNbHTML(all), doneHtml: () => msNbDoneHTML(), dot: () => msNbDot(),
    mark: (n, i) => nbMark(n, i), finish: (n) => { const p = nbPage(n); p.steps.forEach((s, i) => nbMark(n, i)); return nbFinished(n); }, lock: (n, i) => nbLockOf(nbPage(n).steps[i]), page: (n) => { NB.pg = n; msRefresh(); return n; },
    stickers: NB_STICKERS.slice(), title: NB_TITLE, frame: NB_FRAME, popTick: () => nbPopTick(), sync: () => nbPagesSync(), how: (k) => nbHowTitle(k), gift: () => nbDecorGift()
  };
}
on('game:ready', () => { NB.pg = 0; NB.dot = false; setTimeout(nbExpose, 0); });
on('yard:enter', () => { if (window.__paw && !window.__paw.msn) nbExpose(); });
