/* ======================= v2.29 "Story mode", part 1: 57b_story.js (tag sm) =======================
   Contract: V229.md. Design: docs/design/story-mode.md. Test hook: window.__paw.sm (and __paw.sc for the scene engine). Suite: v229_story.
   Gerald's Big Book of Town: a main story alongside free play, 8 chapters (SM_PLAN), each with 3-5 tasks built from things the game already
   tracks (the act bus), each task paying XP (lvGain 'story', outside the daily cap), Bond and coins once, and each chapter ending with a scene
   (57_scenes.js) that is kept in the Memories album. Part 1 builds chapters 1-2 (SM_CH) and two first-visit scenes (Sunny Park, Market Street).
   Free play is unchanged: nothing is locked behind the story, nothing runs out, a task only moves forward.
   Save field S.story (V229.md 2, additive; S.v stays 1). Under the harness everything that shows or pays needs prefs.smTest (scenes: prefs.scTest). */
const SM_LIVE = true, SM_CATCH_CAP = 150;
function smOn() { return SM_LIVE && (!navigator.webdriver || !!(typeof prefs !== 'undefined' && prefs && prefs.smTest)); }
const SM_N = 8; // chapters in the whole story; SM_CH holds the ones built so far

/* ---------------- save (additive) ---------------- */
// fresh: a brand-new save. An old save starts with from 'old': its first quiet moment works out the chapters it has already earned (smCatchUp)
function v229Fields(s, fresh) {
  if (!s) return s; const obj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  if (!obj(s.story)) s.story = { ch: 0, from: fresh ? 'fresh' : 'old' };
  const T = s.story;
  if (typeof T.ch !== 'number' || !(T.ch >= 0) || !isFinite(T.ch)) T.ch = 0;
  ['p', 't', 'c', 'm', 'w'].forEach((k) => { if (!obj(T[k])) T[k] = {}; });
  if (!Array.isArray(T.q)) T.q = [];
  if (T.from !== 'fresh' && T.from !== 'old') T.from = fresh ? 'fresh' : 'old';
  if (typeof T.cu !== 'number') T.cu = 0;
  return s;
}

/* ---------------- chapters 1-2 (built) and the plan for 3-8 ---------------- */
const smName = () => (S && S.dog ? NAME() : '');
const smAnyAct = (...kinds) => (a) => kinds.includes(a.kind);
const SM_CH = [
  { n: 1, place: 'yard', scene: 'ch1', title: () => tt('sm.c1_title', 'A New Friend in Town'), rw: { xp: 30, bond: 10, c: 40 },
    old: (s) => (s.walks || 0) >= 1 || smTopBond(s) >= 2,
    tasks: [
      { id: 'c1_feed', n: 1, m: smAnyAct('feed'), rw: { xp: 10, bond: 3, c: 10 }, t: () => tt('sm.c1_feed', 'Fill the food bowl for {name}', { name: smName() }) },
      { id: 'c1_pet', n: 3, m: smAnyAct('pet'), rw: { xp: 10, bond: 3, c: 10 }, t: () => tt('sm.c1_pet', 'Give {name} three good pets', { name: smName() }) },
      { id: 'c1_play', n: 1, m: smAnyAct('toy', 'fetch'), rw: { xp: 10, bond: 3, c: 10 }, t: () => tt('sm.c1_play', 'Play with a toy or a ball') },
      { id: 'c1_nap', n: 1, m: smAnyAct('nap'), rw: { xp: 10, bond: 3, c: 10 }, t: () => tt('sm.c1_nap', 'Let {name} have a nap', { name: smName() }) }
    ] },
  { n: 2, place: 'park', scene: 'ch2', title: () => tt('sm.c2_title', 'Walkies!'), rw: { xp: 40, bond: 15, c: 60 },
    old: (s) => (s.walks || 0) >= 5 && Object.keys(s.found || {}).length >= 1,
    tasks: [
      { id: 'c2_walk', n: 2, m: (a) => a.kind === 'walk' && !a.early, rw: { xp: 15, bond: 5, c: 15 }, t: () => tt('sm.c2_walk', 'Go on two walks') },
      { id: 'c2_park', n: 1, m: (a) => (a.kind === 'travel' && a.place === 'park') || (a.kind === 'walk' && a.area === 'park' && !a.early), rw: { xp: 15, bond: 5, c: 15 }, t: () => tt('sm.c2_park', 'Visit Sunny Park') },
      { id: 'c2_treasure', n: 1, m: smAnyAct('treasure'), rw: { xp: 15, bond: 5, c: 15 }, t: () => tt('sm.c2_treasure', 'Find a treasure on a walk') },
      { id: 'c2_photo', n: 1, m: smAnyAct('photo'), rw: { xp: 15, bond: 5, c: 15 }, t: () => tt('sm.c2_photo', 'Take a photo of {name}', { name: smName() }) }
    ] }
];
// the whole story, for the page (chapters past SM_CH are written in docs/design/story-mode.md and come in a later part)
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
// one act: moves the open chapter's tasks; a task done pays once (S.story.t), the last one finishes the chapter
function smOnAct(a) {
  if (!a || !S || !S.story || !smOn()) return;
  const T = S.story, ch = smChap(T.ch); if (!ch) return;
  let moved = false;
  ch.tasks.forEach((k) => {
    if (T.t[k.id] || !k.m(a)) return;
    T.p[k.id] = Math.min(k.n, (T.p[k.id] || 0) + 1); moved = true;
    if (T.p[k.id] >= k.n) {
      T.t[k.id] = jstISO(); smPay(k.rw);
      toast(tt('sm.task_done', 'Story: {task}. {reward}', { task: k.t(), reward: smRwText(k.rw) }), 'gold');
    }
  });
  if (moved) { markDirty(); smChapterCheck(); smSync(); }
}
on('act', smOnAct);
function smChapterCheck() {
  const T = S.story, ch = smChap(T.ch); if (!ch || T.c[ch.n] || !ch.tasks.every((k) => T.t[k.id])) return false;
  T.c[ch.n] = jstISO(); smPay(ch.rw); scQueue(ch.scene); T.ch = ch.n + 1; markDirty();
  setTimeout(() => toast(tt('sm.ch_done', 'Chapter {n} done: {title}! {reward}', { n: ch.n, title: ch.title(), reward: smRwText(ch.rw) }), 'gold'), 500);
  try { SFX.kaching(); } catch (e) { /* audio off */ }
  saveNow(); return true;
}

/* ---------------- the start, and an old save's catch-up (one scene, one letter, no flood) ---------------- */
const SM_VISITS = { park: 'visit_park', market: 'visit_market' };
function smStart() {
  if (!S || !S.story || !smOn() || S.story.ch > 0 || ['title', 'adopt'].includes(cur.mode)) return false;
  if (typeof gdLive === 'function' && gdLive() && gdAllowed()) return false; // after Puppy's first day with Gerald
  const T = S.story;
  if (T.from === 'old' && !T.cu) return smCatchUp();
  T.ch = 1; scQueue('prologue'); markDirty(); return true;
}
function smCatchUp() {
  const T = S.story; T.cu = 1;
  const won = []; for (const ch of SM_CH) { if (!ch.old(S)) break; won.push(ch); }
  // first-visit scenes for places an old save has surely seen: into the album, not played
  Object.entries(SM_VISITS).forEach(([pl, id]) => { if ((S.lv && S.lv.seen && S.lv.seen[pl]) || (S.walks || 0) >= 3) T.m[id] = T.m[id] || jstISO(); });
  if (!won.length) { T.ch = 1; scQueue('prologue'); markDirty(); return true; }
  let xp = 0, c = 0;
  won.forEach((ch) => { ch.tasks.forEach((k) => { T.t[k.id] = T.t[k.id] || 'old'; T.p[k.id] = k.n; xp += k.rw.xp; c += k.rw.c; }); xp += ch.rw.xp; c += ch.rw.c; T.c[ch.n] = 'old'; T.m[ch.scene] = T.m[ch.scene] || jstISO(); });
  T.ch = won[won.length - 1].n + 1; c = Math.min(SM_CATCH_CAP, c);
  if (typeof lvGain === 'function') lvGain('story', xp);
  T.m.prologue = T.m.prologue || jstISO();
  mailPush({ kind: 'news', id: 'sm_catchup', keep: true, from: tt('ks.letter_from', 'Gerald'), title: tt('sm.cu_title', 'The story so far'),
    text: tt('sm.cu_text', 'Dear friend,\nI am writing a storybook about our town, and you and {name} are already in it! I wrote down the {n, plural, one {chapter} other {# chapters}} you have already lived, from memory. Mostly right.\nHere are {coins} coins for the pages so far. The next chapter starts today.\nWith a happy waddle,\nGerald', { name: NAME(), n: won.length, coins: c }),
    gift: { coins: c } });
  T.cuN = won.length; scQueue('catchup'); markDirty(); saveNow(); return true;
}
// a first visit to Sunny Park or Market Street: its scene (once; an old save's earlier visits are already in the album)
function smVisit(a) {
  if (!a || !S || !S.story || !smOn()) return;
  const pl = a.kind === 'travel' ? a.place : null, id = SM_VISITS[pl]; if (!id || S.story.m[id]) return;
  scQueue(id);
}
on('act', smVisit);
function smTick() { if (!S || !S.story || !smOn() || !titleEl.hidden) return; smStart(); smSync(); }
setInterval(() => { try { smTick(); } catch (e) { console.warn('sm tick', e); } }, 1000);

/* ---------------- the Story page: the chapter, its tasks, the whole book, and the Memories album ---------------- */
let smTab = 'story';
function smTaskRow(k) {
  const T = S.story, p = T.p[k.id] || 0, done = !!T.t[k.id];
  return `<li class="sm-task${done ? ' done' : ''}"><span class="sm-tick" aria-hidden="true">${done ? doodleSVG('tick') : ''}</span><span class="sm-tt"><b>${esc(k.t())}</b><span class="small sm-rw">${esc(smRwText(k.rw))}</span></span><span class="sm-n" aria-label="${esc(tt('sm.prog_aria', '{n} of {total}', { n: p, total: k.n }))}">${tnum(p)}/${tnum(k.n)}</span></li>`;
}
function doodleSVG(k) { return k === 'tick' ? `<svg viewBox="0 0 24 24"><path d="M4 13 L10 19 L20 5" fill="none" stroke="#5FA35A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : `<svg viewBox="-20 -20 40 40">${doodle(k, 0, 0, 1, 0)}</svg>`; }
function smStoryHTML() {
  const T = S.story, ch = smChap(T.ch);
  const head = `<div class="sm-head"><span class="sm-duck" aria-hidden="true">${scGeraldSVG('point')}</span><span class="sm-ht"><b>${esc(tt('sm.book', "Gerald's Big Book of Town"))}</b><span class="small">${esc(T.ch > 0 && T.ch <= SM_N ? tt('sm.ch_of', 'Chapter {n} of {total}', { n: Math.min(T.ch, SM_N), total: SM_N }) : T.ch > SM_N ? tt('sm.all_done', 'The whole book is written. Thank you!') : tt('sm.not_yet', 'The story starts after your first day with Gerald.'))}</span></span></div>`;
  let cur1 = '';
  if (ch) cur1 = `<section class="sm-ch"><h3>${esc(tt('sm.ch_head', 'Chapter {n}: {title}', { n: ch.n, title: ch.title() }))}</h3><p class="small sm-where">${esc(placeName(ch.place))}</p><ol class="sm-tasks">${ch.tasks.map(smTaskRow).join('')}</ol><p class="small sm-end">${esc(tt('sm.ch_reward', 'All done: {reward} and a scene for your Memories.', { reward: smRwText(ch.rw) }))}</p></section>`;
  else if (T.ch > 0) cur1 = `<section class="sm-ch sm-wait"><p>${esc(tt('sm.writing', 'Gerald is still writing Chapter {n}. It comes in an update, and nothing you do in the meantime is lost.', { n: T.ch }))}</p></section>`;
  const list = Array.from({ length: SM_N }, (_, i) => i + 1).map((n) => { const done = !!T.c[n], now = n === T.ch; return `<li class="${done ? 'done' : now ? 'now' : 'later'}"><span class="sm-cn">${tnum(n)}</span><span class="sm-ct">${esc(done || now || n <= SM_CH.length ? smPlanTitle(n) : tt('sm.later', 'A page still to come'))}</span>${done ? `<span class="sm-tick" aria-hidden="true">${doodleSVG('tick')}</span>` : ''}</li>`; }).join('');
  return head + cur1 + `<ol class="sm-book" aria-label="${esc(tt('sm.chapters', 'Chapters'))}">${list}</ol>`;
}
const SM_MEM = ['prologue', 'ch1', 'ch2', 'visit_park', 'visit_market', 'catchup'];
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
  const p = openModal(esc(tt('sm.title', 'Story')), `<div class="sm-sheet">${tabs}${smTab === 'mem' ? smMemHTML() : smStoryHTML()}</div>`, { cls: 'sm-pop sm-' + smTab });
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
  const T = S.story, ch = smChap(T.ch), left = ch ? ch.tasks.filter((k) => !T.t[k.id]).length : 0;
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
function smDoneTitles() { const T = S.story; return SM_CH.filter((c) => T.c[c.n]).map((c) => tt('sm.ch_head', 'Chapter {n}: {title}', { n: c.n, title: c.title() })).join('\n'); }

/* ---------------- the hook ---------------- */
on('game:ready', () => { smExpose(); smSync(); });
setInterval(() => { try { smExpose(); } catch (e) { /* not booted */ } }, 1000);
function smExpose() {
  if (!window.__paw || window.__paw.sm) return;
  window.__paw.sm = { on: () => smOn(), fields: (s, fresh) => v229Fields(s, !!fresh), start: () => smStart(), open: (t) => smOpen(t), chapters: () => SM_CH.map((c) => ({ n: c.n, tasks: c.tasks.map((k) => ({ id: k.id, n: k.n, rw: k.rw })), rw: c.rw })),
    act: (kind, d) => trackAct(kind, d || {}), titles: () => Array.from({ length: SM_N }, (_, i) => smPlanTitle(i + 1)), mem: () => smMemList(), replay: (id) => smReplay(id), CAP: SM_CATCH_CAP };
  window.__paw.sc = { test: (v) => { prefs.scTest = !!v; }, play: (id) => scPlay(id, { replay: true }), auto: (id) => scPlayAuto(id), queue: (id) => scQueue(id), on: () => (SC.on ? SC.on.id : null), skip: () => scEnd(true), calm: () => scCalmNow(),
    ids: () => Object.keys(SC_SCRIPTS), dur: (id) => { const s = SC_SCRIPTS[id]; return s ? s.shots(D()).reduce((n, x) => n + (x.d || 4), 0) : 0; }, SKIP: SC_SKIP_MS, gap: (v) => { if (typeof v === 'number') SC.lastEnd = v; return SC.lastEnd; } };
}
