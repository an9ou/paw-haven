/* ======================= v2.28 "Stories and stars": 56_stories.js (tag st) =======================
   Contract: V228.md. Save field S.st (v228Fields, called from freshState and migrate in 00_core.js). Test hook: window.__paw.st.
   1. Bond stars: after Bond 10 a star per 5,000 Bond points, on the Bond track (48_dogdays.js) and the journal profile card. Keepsakes at
      5 stars (the Framed Paw Print, a house wall decoration) and 10 stars (the Star Collar), once per save.
   2. Neighbour stories: four townsfolk, five steps each, told in mailbox letters with one small request per step. A step is done only by
      doing its request (the act bus). One story letter a day at most, the next step at least ST_GAP days after the last one was done,
      never a deadline. A finished story gives a photo frame keepsake and a page in the journal's Stories tab.
   3. Share postcard: the yard, the diary page and My Dog Card, through the v2.19 Share poster path (50_friends.js). Game words only.
   Under the test harness everything that shows needs prefs.stTest. Nothing is ever taken away. */
const ST_LIVE = true;
function stOn() { return (ST_LIVE && !navigator.webdriver && nwDue(NEWS_V228)) || !!prefs.stTest; } // goes live on NEWS_V228.date
const ST = { n: 0, pc: null, pcBusy: false, pcHow: '', pcErr: '', pcForce: '' };
const ST_STAR = 5000, ST_GAP = 3, ST_STEPS = 5;
const ST_PAW = 'Framed Paw Print', ST_COLLAR = 'Star Collar';
const ST_IDS = ['plum', 'rosa', 'post', 'pip']; // the order the stories start in
const stToday = () => localISO();
const stReady = () => !!(S && S.st && S.dogs && S.dogs.length && stOn());

/* ---------------- the save ---------------- */
function v228Fields(s) {
  if (!s) return s;
  if (!s.st || typeof s.st !== 'object') s.st = {};
  const st = s.st, num = (v) => (Number.isFinite(+v) ? Math.max(0, Math.min(ST_STEPS, Math.floor(+v))) : 0), str = (v) => (typeof v === 'string' ? v : '');
  if (!st.stars || typeof st.stars !== 'object' || Array.isArray(st.stars)) st.stars = {};
  if (!st.ks || typeof st.ks !== 'object' || Array.isArray(st.ks)) st.ks = {};
  if (!st.s || typeof st.s !== 'object' || Array.isArray(st.s)) st.s = {};
  ST_IDS.forEach((k) => {
    const r = st.s[k] && typeof st.s[k] === 'object' ? st.s[k] : {};
    const d = num(r.d), n = Math.max(d, num(r.n));
    st.s[k] = { n, d, at: str(r.at), dn: str(r.dn), fin: str(r.fin), ks: str(r.ks) };
  });
  if (typeof st.lt !== 'string') st.lt = '';
  if (!(st.pc >= 0)) st.pc = 0;
  // an old save past Bond 10: its stars are counted once here, quietly (a star never goes down: the most it ever had is kept)
  (Array.isArray(s.dogs) ? s.dogs : []).forEach((d) => { if (!d || !d.id) return; const n = stCount(d); if (n > (+st.stars[d.id] || 0)) st.stars[d.id] = n; });
  return s;
}

/* ---------------- 1. Bond stars ---------------- */
function stCount(d) { const b = d && d.bond; if (!b || (b.level || 1) < 10 || !Number.isFinite(+b.pts)) return 0; return Math.max(0, Math.floor((+b.pts - BOND_TH[9]) / ST_STAR)); }
function stStars(d) { if (!d) return 0; const kept = S && S.st && S.st.stars ? +S.st.stars[d.id] || 0 : 0; return Math.max(stCount(d), kept); }
const stTopStars = () => (S && S.dogs ? Math.max(0, ...S.dogs.map(stStars)) : 0);
// the points still needed for the next star (Bond 10 only)
function stNext(d) { const b = d.bond || {}; if ((b.level || 1) < 10) return 0; const n = stCount(d); return Math.max(0, BOND_TH[9] + (n + 1) * ST_STAR - b.pts); }
function stStarRow(n, max) { const k = Math.min(n, max || 10); return '★'.repeat(k) + (n > k ? '+' : ''); }
// a new star (a toast once), the keepsakes at 5 and 10 (once per save)
function stStarTick(quiet) {
  if (!stReady()) return [];
  const got = [];
  S.dogs.forEach((d) => {
    const n = stCount(d), was = +S.st.stars[d.id] || 0; if (n <= was) return;
    S.st.stars[d.id] = n; markDirty(); got.push(d.id);
    if (!quiet) toast(tt('st.star_new', '{name} earned a Bond star! {n, plural, one {# star} other {# stars}} now.', { name: d.name, n }), 'gold');
  });
  const top = stTopStars();
  [5, 10].forEach((L) => {
    if (top < L || S.st.ks[L]) return;
    S.st.ks[L] = stToday(); markDirty();
    if (L === 5) {
      if (typeof hmDecorFields === 'function') hmDecorFields(); S.decor = S.decor || {};
      if (!S.decor[ST_PAW]) { S.decor[ST_PAW] = { got: stToday(), out: true }; if (typeof hoFreeSpot === 'function') try { S.decor[ST_PAW].at = hoFreeSpot(ST_PAW); } catch (e) { /* its catalogue spot */ } } // a bare bit of wall, clear of what is already up (art 7)
      try { if (cur.mode === 'yard' && S.place === 'house' && typeof hmDecorRedraw === 'function') hmDecorRedraw(); } catch (e) { /* not in the house */ }
      if (!quiet) setTimeout(() => toast(tt('st.ks_5', '5 Bond stars! A {item} for the house. It is already on the wall.', { item: shNameAny(ST_PAW) }), 'gold'), 1200);
    } else {
      if (!owns('clothes', ST_COLLAR)) S.inv.clothes.push(ST_COLLAR);
      if (!quiet) setTimeout(() => toast(tt('st.ks_10', '10 Bond stars! The {item} is in the Wardrobe.', { item: shNameAny(ST_COLLAR) }), 'gold'), 1400);
    }
  });
  return got;
}
// the Bond track's stars block (ddTrackHTML, 48_dogdays.js): at Bond 10 only
function stTrackHTML(d) {
  if (!stReady() || !d || ((d.bond && d.bond.level) || 1) < 10) return '';
  const n = stStars(d), nx = stNext(d);
  const ks = [[5, ST_PAW, tt('st.tr_k5', '5 stars: a {item} for the house', { item: shNameAny(ST_PAW) })], [10, ST_COLLAR, tt('st.tr_k10', '10 stars: the {item}', { item: shNameAny(ST_COLLAR) })]];
  return `<div class="st-track"><p class="st-trh"><b>${esc(tt('st.tr_title', 'Bond stars'))}</b> <span class="st-stars" aria-hidden="true">${n ? stStarRow(n) : '☆'}</span></p>`
    + `<p class="small">${esc(n ? tt('st.tr_have', '{name} has {n, plural, one {# Bond star} other {# Bond stars}}.', { name: d.name, n }) : tt('st.tr_none', 'Past Bond 10, every {pts} Bond points make a star.', { pts: tnum(ST_STAR) }))} ${esc(tt('st.tr_next', 'Next star in {pts} Bond points.', { pts: tnum(nx) }))}</p>`
    + `<ul class="st-trks">${ks.map(([L, , t]) => `<li class="${S.st.ks[L] ? 'got' : ''}"><span aria-hidden="true">${S.st.ks[L] ? '★' : '☆'}</span> ${esc(t)}</li>`).join('')}</ul></div>`;
}
// the star badge on the dog's journal profile card (journalProfile, 11_garden_kitchen.js)
function stStarBadge(d) {
  if (!stReady() || !d) return ''; const n = stStars(d); if (!n) return '';
  return ` <span class="st-badge" title="${esc(tt('st.badge', '{n, plural, one {# Bond star} other {# Bond stars}}', { n }))}"><span aria-hidden="true">★</span> ${tnum(n)}</span>`;
}

/* ---------------- 2. neighbour stories ---------------- */
// the requests: k the kind, p the place
const ST_REQ = {
  plum: [{ k: 'walk' }, { k: 'go', p: 'market' }, { k: 'go', p: 'cafe', parcel: 1 }, { k: 'bath' }, { k: 'photo', p: 'park' }],
  rosa: [{ k: 'go', p: 'cafe' }, { k: 'walk' }, { k: 'photo', p: 'cafe' }, { k: 'trick' }, { k: 'go', p: 'park' }],
  post: [{ k: 'pet' }, { k: 'trick' }, { k: 'go', p: 'vet' }, { k: 'walk' }, { k: 'photo', p: 'yard' }],
  pip: [{ k: 'plant' }, { k: 'water' }, { k: 'harvest' }, { k: 'go', p: 'square', parcel: 1 }, { k: 'photo', p: 'square' }]
};
const ST_FCOL = { plum: '#E0D5F0', rosa: '#FCD8BC', post: '#CBE0F4', pip: '#D6EDC9' };
function stWho(id) {
  switch (id) {
    case 'plum': return tt('mail.nb_plum', 'Mrs. Plum next door');
    case 'rosa': return tt('ms2w.who_cafe', 'Rosa from the café');
    case 'post': return tt('st.who_post', 'the mail carrier');
    default: return tt('ms2w.who_pip', 'Pip the farmer');
  }
}
function stTitle(id) {
  switch (id) {
    case 'plum': return tt('st.plum_title', 'The sweater project');
    case 'rosa': return tt('st.rosa_title', 'A shy greyhound');
    case 'post': return tt('st.post_title', 'The left shoe');
    default: return tt('st.pip_title', 'The biggest carrot');
  }
}
function stKeepsake(id) {
  switch (id) {
    case 'plum': return tt('st.ks_plum', "Mrs. Plum's wool frame");
    case 'rosa': return tt('st.ks_rosa', 'The café wall frame');
    case 'post': return tt('st.ks_post', 'The stamp frame');
    default: return tt('st.ks_pip', "Pip's ribbon frame");
  }
}
// the photo frame keepsakes go in the Dog Days frame list (S.dd.fr, ids k_<story>); 48_dogdays.js asks stFrameName for their names
function stFrameName(f) { const m = /^k_([a-z]+)$/.exec(String(f || '')); return m && ST_REQ[m[1]] ? stKeepsake(m[1]) : ''; }
if (typeof DD_FCOL === 'object') ST_IDS.forEach((k) => { DD_FCOL['k_' + k] = ST_FCOL[k]; });
const stPlace = (p) => (p === 'yard' ? tt('st.your_yard', 'your yard') : typeof townPlaceName === 'function' ? townPlaceName(p) : tPlace(p));
function stReqText(r, dog) {
  dog = dog || NAME();
  switch (r.k) {
    case 'walk': return tt('st.rq_walk', 'Take {dog} for a walk', { dog });
    case 'go': return r.parcel ? tt('st.rq_parcel', 'Take the parcel to {place}', { place: stPlace(r.p) }) : tt('st.rq_go', 'Visit {place} with {dog}', { place: stPlace(r.p), dog });
    case 'photo': return tt('st.rq_photo', 'Take a photo at {place}', { place: stPlace(r.p) });
    case 'plant': return tt('st.rq_plant', 'Plant seeds in your veggie patch');
    case 'water': return tt('st.rq_water', 'Water your veggie patch');
    case 'harvest': return tt('st.rq_harvest', 'Harvest something from your veggie patch');
    case 'bath': return tt('st.rq_bath', 'Give {dog} a bath', { dog });
    case 'pet': return tt('st.rq_pet', 'Give {dog} a pet', { dog });
    default: return tt('st.rq_trick', 'Practise a trick with {dog}', { dog });
  }
}
// can the request be done now? (a letter waits while it cannot)
function stCan(r) {
  try {
    if ((r.k === 'go' || r.k === 'photo') && r.p !== 'yard') { const P = PLACES[r.p]; if (!P) return false; return typeof wOpen === 'function' ? wOpen('place', r.p, P.bond || 1) : topBond() >= (P.bond || 1); }
    if (r.k === 'plant' || r.k === 'water' || r.k === 'harvest') return gkOn() && gardenUnlocked();
    if (r.k === 'trick') return TRICKS.some((x) => x.bond <= topBond());
    return true;
  } catch (e) { return false; }
}
function stMatch(r, a) {
  switch (r.k) {
    case 'walk': return a.kind === 'walk';
    case 'go': return a.kind === 'travel' && a.place === r.p;
    case 'photo': return a.kind === 'photo' && S.place === r.p;
    case 'plant': case 'water': case 'harvest': return a.kind === 'garden' && a.what === r.k;
    default: return a.kind === r.k;
  }
}
// when a story may start: the first at Bond 3, each later one once the one before has two requests done (and its own gate)
function stStartOk(id) {
  const i = ST_IDS.indexOf(id); if (i < 0) return false;
  if (i === 0) return topBond() >= 3;
  if (S.st.s[ST_IDS[i - 1]].d < 2) return false;
  return id !== 'pip' || (gkOn() && gardenUnlocked());
}
/* the letters: step i (0-4) and the closing letter (i = 5). {dog} is the active dog's name when it arrives */
function stLetter(id, i, dog) {
  const a = { dog };
  switch (id + i) {
    case 'plum0': return [tt('st.plum_t0', 'A woolly idea'), tt('st.plum_0', 'Dear neighbour, I have decided to knit a sweater for a dog. I once knitted one for a teapot and it went badly. Could you walk {dog} past my window? I need to see how a dog bends in the middle.', a)];
    case 'plum1': return [tt('st.plum_t1', 'Notes on dogs'), tt('st.plum_1', 'Thank you! I took notes. Dogs bend everywhere. I need more wool now. Could you visit Market Street and look at the colours for me? Tell me which ones a dog would like. All of them, I suspect.', a)];
    case 'plum2': return [tt('st.plum_t2', 'The first sweater'), tt('st.plum_2', 'The first sweater is done. It has three sleeves. I am calling it modern art. It fits the cushion at the café, which is not a dog, but it sat very still. Could you take the parcel to Rosa for me?', a)];
    case 'plum3': return [tt('st.plum_t3', 'A fitting'), tt('st.plum_3', 'Rosa says the cushion has never been so cosy. Now the real thing. I need {dog} clean and fluffy for a fitting, so one bath, please. And no rolling in anything afterwards. I know. I ask a lot.', a)];
    case 'plum4': return [tt('st.plum_t4', 'It fits!'), tt('st.plum_4', 'It fits! It has two sleeves this time, which is the right number for front legs. Could you take a photo at Sunny Park? I want a dog in a park above my knitting chair.', a)];
    case 'plum5': return [tt('st.plum_t5', 'Thank you, from the knitting chair'), tt('st.plum_5', 'The photo is above my chair now. I look at it whenever I drop a stitch, which is often. I put a little frame aside for you, with wool round the edge. Thank you for being so patient with an old knitter.', a)];
    case 'rosa0': return [tt('st.rosa_t0', 'A face at the window'), tt('st.rosa_0', 'Hello from the café! A retired racing greyhound at the Shelter keeps looking at me through the window. Her name is Comet. I think I would like to adopt her. Could you bring {dog} to the café? I have questions for a dog person.', a)];
    case 'rosa1': return [tt('st.rosa_t1', 'How long is short?'), tt('st.rosa_1', 'Thank you for all the answers. My new book says greyhounds love soft beds and short walks. Could you take {dog} for a walk and tell me how long short is?', a)];
    case 'rosa2': return [tt('st.rosa_t2', 'Comet visits'), tt('st.rosa_2', 'Comet came to the café with the Shelter staff! She hid behind my legs for an hour, then ate one biscuit very slowly. She is shy, but she likes the café. Could you take a photo there for my wall?', a)];
    case 'rosa3': return [tt('st.rosa_t3', 'Comet comes home'), tt('st.rosa_3', 'The adoption papers are signed. No money, only a promise to love her. Comet is home and has found the sofa. Could {dog} practise a trick? I want to show her that dogs here have fun.', a)];
    case 'rosa4': return [tt('st.rosa_t4', 'A very fast walk'), tt('st.rosa_4', 'Comet walked to Sunny Park today, right next to me. Then she ran once, very fast, and lay down for a long rest. Could you meet us at the park? Just say hello. Slowly.', a)];
    case 'rosa5': return [tt('st.rosa_t5', 'A lean from Comet'), tt('st.rosa_5', 'Comet sends a lean. That is how greyhounds hug: they lean on your legs. Thank you for helping a shy dog find her sofa. There is a new frame on the café wall, and one for you too.', a)];
    case 'post0': return [tt('st.post_t0', 'A small confession'), tt('st.post_0', 'Dear {dog} and family, I bring letters to every house in town, and I am a tiny bit nervous of dogs. My left shoe is very nervous. Could you give {dog} a pet while I watch? I want to see what a calm dog looks like.', a)];
    case 'post1': return [tt('st.post_t1', 'Notes from the gate'), tt('st.post_1', 'I watched from the gate. {dog} leaned right into it! I wrote that down. Could {dog} practise a trick? If dogs sit when asked, I may sit too. Out of respect.', a)];
    case 'post2': return [tt('st.post_t2', 'A leaflet with a cartoon'), tt('st.post_2', 'I went to the open morning at the Vet Clinic to learn dog manners. They gave me a leaflet with a cartoon of a happy tail. Could you visit them with {dog} and say thank you from me?', a)];
    case 'post3': return [tt('st.post_t3', 'A wag back'), tt('st.post_3', 'A dog on Maple Lane wagged at me today and I wagged back. With my arm. Could you take {dog} for a walk on my round? I would like the company.', a)];
    case 'post4': return [tt('st.post_t4', 'Ready, nearly'), tt('st.post_4', 'I think I am ready to say hello properly. Could you take a photo in your yard, by the mailbox? I will keep it in my bag for courage.', a)];
    case 'post5': return [tt('st.post_t5', 'Friends, and a shoe'), tt('st.post_5', 'I said hello today and got a sniff on my left shoe. We are all friends now, the shoe too. Thank you. Here is a frame with stamps round the edge, from the post office cupboard. I asked first.', a)];
    case 'pip0': return [tt('st.pip_t0', 'The town show'), tt('st.pip_0', 'Howdy! I have entered the Biggest Carrot class at the town show. I have never won. Last year a snail ate my entry. Could you plant some seeds in your patch? Two gardens are luckier than one.', a)];
    case 'pip1': return [tt('st.pip_t1', 'The size of a pencil'), tt('st.pip_1', 'My carrot is growing! It is the size of a pencil. A short pencil. Could you water your patch too? I read that carrots like company.', a)];
    case 'pip2': return [tt('st.pip_t2', 'A tiny fence'), tt('st.pip_2', 'Bad news for snails: I built a tiny fence. Good news for me. The show wants a friendly table of vegetables. Could you harvest something from your patch for it?', a)];
    case 'pip3': return [tt('st.pip_t3', 'The show table'), tt('st.pip_3', 'What a basket! Could you take the parcel to the Town Square? The show table is by the fountain. Mind the pigeons, they are judges too, in their heads.', a)];
    case 'pip4': return [tt('st.pip_t4', 'For luck'), tt('st.pip_4', 'The show is tomorrow and I am too nervous to look at my carrot. Could you take a photo at the Town Square, by the show table, for luck?', a)];
    default: return [tt('st.pip_t5', 'Second place!'), tt('st.pip_5', 'I came second! First place was a carrot shaped like a duck, and nobody can beat that. Second is the best I ever did. The ribbon is on my barn door, and here is a little frame for you, with a carrot in the corner.', a)];
  }
}
function stLetterPush(id, i) {
  if (typeof mailPush !== 'function') return null;
  const dog = NAME(), [title, text] = stLetter(id, i, dog), r = ST_REQ[id][i];
  return mailPush({ kind: 'news', id: 'st_' + id + '_' + i, from: capFirst(stWho(id)), title, text, keep: i === ST_STEPS,
    ps: i < ST_STEPS ? tt('st.letter_ps', 'Request: {req}. Whenever you like, there is no hurry.', { req: stReqText(r, dog) }) : tt('st.letter_ps_end', 'Your keepsake: {item}. Find it in photo mode, and the story in your journal.', { item: stKeepsake(id) }) });
}
// at most one story letter a day, in a quiet yard (stTick): a closing letter first, else the next step of the first story that can go on
function stLetters(force) {
  if (!stReady() || typeof mailPush !== 'function') return null;
  const t = stToday(); if (S.st.lt === t && !force) return null;
  for (const id of ST_IDS) {
    const r = S.st.s[id];
    if (r.d >= ST_STEPS) { if (!r.fin && isoDays(r.dn || t, t) >= 1) { r.fin = t; S.st.lt = t; markDirty(); stLetterPush(id, ST_STEPS); return id + ':end'; } continue; }
    if (r.n !== r.d) continue; // a request is still open
    if (r.n === 0 ? !stStartOk(id) : isoDays(r.dn || t, t) < ST_GAP) continue;
    if (!stCan(ST_REQ[id][r.n])) continue;
    stLetterPush(id, r.n); r.n++; r.at = t; S.st.lt = t; markDirty(); return id + ':' + (r.n - 1);
  }
  return null;
}
// the open request of a story, or null
function stOpen(id) { const r = S && S.st && S.st.s[id]; return r && r.n === r.d + 1 && r.d < ST_STEPS ? ST_REQ[id][r.d] : null; }
function stOnAct(a) {
  if (!a || !a.kind || !stReady() || cur.mode === 'title') return;
  ST_IDS.forEach((id) => {
    const q = stOpen(id); if (!q || !stMatch(q, a)) return;
    const r = S.st.s[id]; r.d++; r.dn = stToday(); markDirty(); SFX.boop(820);
    if (r.d >= ST_STEPS) stFinish(id);
    else toast(tt('st.step_done', 'Done for {who}: {req}. A letter will come in a few days.', { who: stWho(id), req: stReqText(q) }), 'good');
  });
}
on('act', stOnAct);
function stFinish(id) {
  const r = S.st.s[id]; if (r.ks) return false;
  r.ks = stToday(); const f = 'k_' + id;
  if (S.dd && Array.isArray(S.dd.fr) && !S.dd.fr.includes(f)) S.dd.fr.push(f);
  markDirty(); if (typeof lvGain === 'function') try { lvGain('story', 40, { once: 'st:' + id }); } catch (e) { /* no town levels */ }
  toast(tt('st.finished', 'A story is finished: {title}. A keepsake for you, {item}, and a page in your journal.', { title: stTitle(id), item: stKeepsake(id) }), 'gold');
  return true;
}

/* ---------------- the Stories tab of the journal, and the board notes ---------------- */
function stDots(r) { return `<span class="st-dots" aria-hidden="true">${Array.from({ length: ST_STEPS }, (_, i) => `<i class="${i < r.d ? 'on' : i < r.n ? 'open' : ''}"></i>`).join('')}</span>`; }
function stKeepsakeSVG(id) {
  const c = ST_FCOL[id] || '#F7B2C4', ink = '#5B3D32', sym = { plum: doodle('heart', 30, 30, 0.8), rosa: doodle('paw', 30, 31, 0.8), post: doodle('spark', 30, 30, 0.85), pip: doodle('flower', 30, 30, 0.8) }[id] || '';
  return `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M7 8 Q30 5 53 8 L52 52 Q30 55 8 52 Z" fill="${c}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M15 16 Q30 14 45 16 L44 44 Q30 46 16 44 Z" fill="#FFFBF3" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>${sym}</svg>`;
}
function stCardHTML(id) {
  const r = S.st.s[id], q = stOpen(id), fin = r.d >= ST_STEPS;
  const line = fin ? tt('st.j_fin', 'Finished. Keepsake: {item}.', { item: stKeepsake(id) }) : q ? tt('st.j_now', 'Now: {req}', { req: stReqText(q) }) : tt('st.j_wait', 'Done for now. The next letter comes in a few days.');
  const letters = Array.from({ length: Math.min(r.n + (r.fin ? 1 : 0), ST_STEPS + 1) }, (_, i) => { const [ti, tx] = stLetter(id, i, NAME()); return `<li><b>${esc(ti)}</b> ${esc(tx)}</li>`; }).join('');
  return `<article class="st-card${fin ? ' fin' : ''}" data-story="${id}">${fin ? `<span class="st-ks">${stKeepsakeSVG(id)}</span>` : ''}<p class="st-who">${esc(capFirst(stWho(id)))}</p><h3 class="st-tt">${esc(stTitle(id))}</h3>${stDots(r)}`
    + `<p class="st-line">${esc(line)}</p><details class="st-lets"><summary>${esc(tt('st.j_letters', 'The letters so far ({n})', { n: r.n + (r.fin ? 1 : 0) }))}</summary><ol>${letters}</ol></details></article>`;
}
function stJournalHTML() {
  if (!stReady()) return '';
  const on = ST_IDS.filter((id) => S.st.s[id].n > 0), left = ST_IDS.length - on.length;
  const intro = on.length ? tt('st.j_intro', 'Your neighbours write when something happens. Each story has five small requests, and there is never a hurry.') : tt('st.j_empty', 'No stories yet. Once {name} reaches Bond 3, a neighbour will write to you.', { name: NAME() });
  return `<div class="st-j"><p class="small st-jintro">${esc(intro)}</p>${on.map(stCardHTML).join('')}${on.length && left ? `<p class="small st-more">${esc(tt('st.j_more', '{n, plural, one {# more neighbour has} other {# more neighbours have}} a story to tell, when the time is right.', { n: left }))}</p>` : ''}</div>`;
}
// Gerald's help-wanted board (24d_week.js msWeekHTML): the open story requests as pinned notes under the five board notes. They do not count for the board
function stWeekHTML() {
  if (!stReady()) return '';
  const open = ST_IDS.map((id) => [id, stOpen(id)]).filter((x) => x[1]); if (!open.length) return '';
  return `<div class="st-wk"><h4>${esc(tt('st.wk_title', 'Neighbour stories'))}</h4><ul>${open.map(([id, q]) => `<li class="st-wkn" data-story="${id}"><span class="st-pin" aria-hidden="true"></span><p class="st-who">${esc(capFirst(stWho(id)))} · ${esc(stTitle(id))}</p><p>${esc(stReqText(q))}</p></li>`).join('')}</ul><p class="small">${esc(tt('st.wk_note', 'Story notes are not part of the board. Do them whenever you like.'))}</p></div>`;
}

/* ---------------- 3. the Share postcard (the v2.19 Share poster path, 50_friends.js) ---------------- */
const ST_SITE = 'https://doodledoggo.app';
function stPcDog(src, id) {
  if (src === 'card' && S.dc && Array.isArray(S.dc.dogs)) { const x = S.dc.dogs.map((c) => dogById(c.id)).find(Boolean); if (x && !id) return x; }
  return (id && dogById(id)) || S.dog;
}
function stPcCardName() { try { return S.dc && Array.isArray(S.dc.name) && S.dc.name.length === 2 ? dcCardName({ name: S.dc.name }) : ''; } catch (e) { return ''; } }
function stPcHead(src) {
  if (src === 'diary') return tt('st.pc_head_diary', "A page from my dog's diary in Doodle Doggo!");
  if (src === 'card') return tt('st.pc_head_card', 'Meet my Dog Card in Doodle Doggo!');
  return tt('st.pc_head_yard', 'Greetings from our yard in Doodle Doggo!');
}
function stPcSVG(src, id, dno) {
  if (!S || typeof frPB !== 'function') return '';
  const B = frPB(), hand = FR_FONT, read = "'Patrick Hand','DD Local',cursive", code = (S.fr && S.fr.code) || '', d = stPcDog(src, id);
  let back = '';
  try { back = window.PawArt && PawArt.FRIENDS && typeof PawArt.FRIENDS.poster === 'function' ? PawArt.FRIENDS.poster() : ''; } catch (e) { back = ''; }
  back = back ? back.replace(/^<svg\b([^>]*)>/, (m, a) => `<svg${a.replace(/\s(?:width|height|x|y)="[^"]*"/g, '')} x="0" y="0" width="450" height="800">`) : `<rect width="450" height="800" fill="#FFFBF3"/>`;
  let dog = '';
  try { if (d) dog = place(dogSVG(d, { pose: src === 'diary' ? 'sit' : 'happy', outfit: outfitOf(d), facing: 'right', anim: false }), B.dog.x, B.dog.y, B.dog.w, B.dog.h); } catch (e) { dog = ''; }
  const n = d ? stStars(d) : 0;
  // the line under the dog: the Dog Card name (picked words), the friend name (picked words), the diary day, else a greeting. Never a typed name
  const sub = src === 'card' && stPcCardName() ? stPcCardName() : src === 'diary' ? tt('st.pc_day', 'Diary, day {day}', { day: dno || (typeof day === 'function' ? day() : 1) })
    : code && typeof frPairName === 'function' && frPairName(S.fr.name) ? frPairName(S.fr.name) : tt('st.pc_wish', 'Wish you were here!');
  const stars = n ? `<text x="${B.name.cx}" y="${B.name.y - 36}" text-anchor="middle" font-size="22" fill="#E9A93B" stroke="#5B3D32" stroke-width=".8">${stStarRow(n, 10)}</text>` : '';
  const link = code ? frLinkOf(code) : ST_SITE, scan = code ? tt('fr.poster_scan', 'Scan or add {code}', { code: '' }) : tt('st.pc_come', 'Come and play with us!');
  const txt = [
    `<text x="${B.logo.cx - 58}" y="${B.logo.y}" text-anchor="middle" font-size="44" font-weight="700" fill="${INKG}" style="font-family:'Caveat',cursive" transform="rotate(-3 ${B.logo.cx - 58} ${B.logo.y})">Doodle</text>`,
    `<text x="${B.logo.cx + 62}" y="${B.logo.y + 3}" text-anchor="middle" font-size="44" font-weight="700" fill="${INKG}" style="font-family:'Caveat',cursive" transform="rotate(2 ${B.logo.cx + 62} ${B.logo.y})">Doggo</text>`,
    frPosterLine([[stPcHead(src), hand]], B.head.cx, B.head.y, 25, B.head.max),
    stars, frPosterLine([[sub, hand]], B.name.cx, B.name.y, 29, B.name.max),
    code ? frPosterLine([[code, FR_CODE_FONT]], B.code.cx, B.code.y, 30, B.code.max, { ls: 0.6 }) : frPosterLine([['doodledoggo.app', hand]], B.code.cx, B.code.y, 24, B.code.max),
    frPosterLine(code ? frPosterCodeLine(scan, code, hand) : [[scan, hand]], B.scan.cx, B.scan.y, /[฀-๿]/.test(scan) ? 20 : 24, B.scan.max),
    frPosterLine(code ? frPosterCodeLine(link.replace(/^https?:\/\//, '').replace(code, ''), code, read) : [[link.replace(/^https?:\/\//, ''), read]], B.link.cx, B.link.y, 15, B.link.max, { weight: 400, col: '#7A6358' })
  ].join('');
  const qr = typeof frQRSVG === 'function' ? frQRSVG(link, B.qr) : '';
  const style = `<style>${typeof PH_FONT_CSS === 'string' ? PH_FONT_CSS : ''}${tfontCSS()}${code ? FR_CODE_FONT_CSS : ''}.pa-d-f1,.pa-d-f2{opacity:0}*{animation:none!important;transition:none!important}</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 800" width="${FR_POSTER.w}" height="${FR_POSTER.h}">${style}${back}${dog}${qr}${txt}</svg>`;
}
async function stPcDraw(src, id, dno) {
  const fw = typeof phFonts === 'function' ? phFonts() : null; if (fw) await fw;
  try { if (document.fonts && document.fonts.load) await Promise.race([Promise.all(['700 30px Caveat', '400 15px "Patrick Hand"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* measure with what is there */ }
  const svg = stPcSVG(src, id, dno); if (!svg) return null;
  const im = await phLoad(phDataURL(svg));
  const cv = document.createElement('canvas'); cv.width = FR_POSTER.w; cv.height = FR_POSTER.h;
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#FFFBF3'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(im, 0, 0, cv.width, cv.height);
  return new Promise((res) => { try { cv.toBlob((b) => res(b), 'image/png'); } catch (e) { res(null); } });
}
async function stPcDeliver(blob) {
  const code = (S.fr && S.fr.code) || '', file = new File([blob], 'doodle-doggo-postcard.png', { type: 'image/png' });
  if (ST.pcForce !== 'none' && navigator.share && navigator.canShare) {
    const full = { files: [file], text: tt('st.pc_share_text', 'A postcard from Doodle Doggo.'), url: code ? frLinkOf(code) : ST_SITE };
    let data = null; try { data = navigator.canShare(full) ? full : navigator.canShare({ files: [file] }) ? { files: [file] } : null; } catch (e) { data = null; }
    if (data) { try { await navigator.share(data); return 'share'; } catch (e) { if (e && e.name === 'AbortError') return null; } }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = file.name; a.rel = 'noopener'; a.style.display = 'none';
  document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
  return 'download';
}
// the postcard sheet: a preview of the PNG and a Share button. src: 'yard' | 'diary' | 'card'. From the diary or the card, Back returns there
function stPcOpen(src, id, dno) {
  if (!stReady()) return null;
  src = ['diary', 'card'].includes(src) ? src : 'yard'; SFX.click();
  const back = src === 'diary' ? () => openJournal('diary') : src === 'card' && typeof dcSettings === 'function' ? () => dcSettings() : null;
  const p = openModal(esc(tt('st.pc_title', 'Send a postcard')), `<div class="st-pc"><div class="st-pcprev" aria-busy="true"><span class="st-pcwait">${esc(tt('st.pc_drawing', 'Drawing your postcard...'))}</span></div>`
    + `<p class="small st-pcnote">${esc(tt('st.pc_note', 'Only the drawing and game words go on the card, never a name you typed.'))}</p></div>`,
  { cls: 'st-pcpop', foot: `${back ? `<button class="btn" type="button" id="stPcBack">${esc(tt('st.pc_back', 'Back'))}</button>` : ''}<button class="btn yes big" type="button" id="stPcGo" aria-disabled="true">${esc(tt('st.pc_share', 'Share postcard'))}</button>` });
  p.dataset.stSrc = src;
  const rec = { src, blob: null, url: '' }; ST.pc = rec;
  const go = $('#stPcGo', p), bk = $('#stPcBack', p);
  if (bk) bk.onclick = () => { SFX.click(); closeModal(); setTimeout(back, 40); };
  stPcDraw(src, id, dno).then((b) => {
    if (ST.pc !== rec) return; rec.blob = b; const box = $('.st-pcprev', p); if (!box || !box.isConnected) return;
    if (!b) { box.innerHTML = `<span class="st-pcwait">${esc(tt('st.pc_fail', 'The postcard got stuck. Try again.'))}</span>`; return; }
    rec.url = URL.createObjectURL(b); box.removeAttribute('aria-busy');
    box.innerHTML = `<img class="st-pcimg" alt="${esc(tt('st.pc_alt', 'Your postcard: {head}', { head: stPcHead(src) }))}" src="${rec.url}">`;
    go.removeAttribute('aria-disabled');
  }).catch((e) => { ST.pcErr = String((e && e.message) || e); });
  go.onclick = async () => {
    if (go.getAttribute('aria-disabled') === 'true' || !rec.blob || ST.pcBusy) return;
    ST.pcBusy = true;
    try { const how = await stPcDeliver(rec.blob); ST.pcHow = how || ''; if (how) { S.st.pc = (S.st.pc || 0) + 1; markDirty(); } if (how === 'download') toast(tt('st.pc_saved', 'Postcard saved. Look in your downloads.'), 'good'); else if (how === 'share') SFX.boop(760); }
    finally { ST.pcBusy = false; }
  };
  return p;
}
function stPcBtnHTML(src, id, dno) {
  if (!stReady()) return '';
  return `<button class="btn st-pcb" type="button" data-stpc="${src}"${id ? ` data-stdog="${esc(id)}"` : ''}${dno ? ` data-stday="${esc(String(dno))}"` : ''}><span class="st-pcic" aria-hidden="true">${stPcIcon()}</span>${esc(tt('st.pc_btn', 'Postcard'))}</button>`;
}
function stPcIcon() {
  return '<svg viewBox="0 0 32 24"><path d="M2.5 3.5 Q16 2 29.5 3.5 L29 21 Q16 22.5 3 21 Z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2" stroke-linejoin="round"/><path d="M21 6.5 h5.5 v6 h-5.5 Z" fill="#F7B2C4" stroke="#5B3D32" stroke-width="1.5"/><path d="M6 10 h11 M6 14 h9 M6 18 h12" stroke="#8A7566" stroke-width="1.6" stroke-linecap="round"/></svg>';
}
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest && e.target.closest('[data-stpc]'); if (!b || !S) return;
  e.stopPropagation(); stPcOpen(b.dataset.stpc, b.dataset.stdog || '', b.dataset.stday || '');
});
// the yard button: desktop, the top bar after the camera (phones: the "..." menu below)
const stPcTop = document.createElement('button');
stPcTop.id = 'stPcBtn'; stPcTop.className = 'iconbtn'; stPcTop.type = 'button'; stPcTop.hidden = true; stPcTop.innerHTML = stPcIcon();
stPcTop.onclick = () => { firstGesture(); stPcOpen('yard'); };
(($('#phBtn') || $('#muteBtn'))).insertAdjacentElement('afterend', stPcTop);
const stPcCan = () => stReady() && cur.mode === 'yard' && (S.place === 'yard' || S.place === 'house') && modal.hidden && !busy && !hud.hidden && !(typeof PH === 'object' && PH && PH.on) && !(typeof HO === 'object' && HO && HO.pl);
function stPcTopSync() {
  const on = stPcCan(), l = tt('st.pc_yard', 'Send a postcard from the yard');
  if (on && stPcTop.title !== l) { stPcTop.title = l; stPcTop.setAttribute('aria-label', l); }
  if (stPcTop.hidden === on) stPcTop.hidden = !on;
}
// phones: a "Send a postcard" row in the "..." menu (22c_phone_shell.js openMore), added here so that file stays as it is
if (typeof openMore === 'function') {
  const stMorePrev = openMore;
  openMore = function () {
    const r = stMorePrev.apply(this, arguments);
    try {
      const m = document.querySelector('#modal .moremenu');
      if (m && stReady() && cur.mode === 'yard' && (S.place === 'yard' || S.place === 'house') && !m.querySelector('#mmPc')) {
        const b = document.createElement('button'); b.className = 'btn big'; b.id = 'mmPc'; b.type = 'button';
        b.innerHTML = `<span class="ic">${stPcIcon()}</span>${esc(tt('st.pc_menu', 'Send a postcard'))}`;
        b.onclick = (e) => { e.stopPropagation(); closeModal(); setTimeout(() => stPcOpen('yard'), 60); };
        const ph = m.querySelector('#mmPhoto'); if (ph) ph.insertAdjacentElement('afterend', b); else m.insertBefore(b, m.querySelector('#mmCloud') || null);
      }
    } catch (e) { /* the menu changed */ }
    return r;
  };
}

/* the Framed Paw Print (the 5-star keepsake, a house wall decoration): drawn by the world kit, PawArt prop 'stpawframe' (world/pawart_world_b.js) */

/* ---------------- the loop and hooks ---------------- */
function stTick() {
  stExpose(); stPcTopSync();
  if (!stReady() || ['title', 'adopt'].includes(cur.mode) || !titleEl.hidden) return;
  ST.n++;
  if (ST.n % 5 === 2) stStarTick(false);
  if (cur.mode === 'yard' && modal.hidden && !busy && ST.n % 5 === 4 && !ST.hold) stLetters(false); // ST.hold: a test drives the letters itself
}
setInterval(() => { try { stTick(); } catch (e) { console.warn('st tick', e); } }, 1000);
on('game:ready', () => { ST.n = 0; });
function stExpose() {
  if (!window.__paw || window.__paw.st) return;
  window.__paw.st = {
    on: () => stOn(), test: (v) => { prefs.stTest = !!v; stTick(); }, state: () => S && S.st, fields: (s) => v228Fields(s), count: (d) => stCount(d), stars: (id) => stStars(id ? dogById(id) : D()), next: (id) => stNext(id ? dogById(id) : D()),
    tick: (q) => stStarTick(!!q), track: (id) => stTrackHTML(id ? dogById(id) : D()), badge: (id) => stStarBadge(id ? dogById(id) : D()), STAR: ST_STAR, GAP: ST_GAP, ids: ST_IDS.slice(), req: (id, i) => ST_REQ[id][i],
    letters: (f) => stLetters(f), open: (id) => stOpen(id), act: (a) => stOnAct(a), journal: () => stJournalHTML(), week: () => stWeekHTML(), reqText: (r) => stReqText(r), frame: (f) => stFrameName(f),
    pc: (src, id) => stPcOpen(src, id), pcSVG: (src, id) => stPcSVG(src, id), pcDraw: (src, id) => stPcDraw(src, id), pcRec: () => (ST.pc ? { src: ST.pc.src, blob: !!ST.pc.blob, size: ST.pc.blob ? ST.pc.blob.size : 0 } : null),
    pcHow: () => ST.pcHow, pcForce: (f) => { ST.pcForce = f || ''; }, pcBtn: () => stPcTopSync(), hold: (v) => { ST.hold = !!v; }, paw: ST_PAW, collar: ST_COLLAR
  };
}
