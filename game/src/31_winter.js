/* ======================= v2.8 WINTER lane (tag wn): Snow Days, Winter Lights, the Winter Stall, the Ugly Sweater Contest. See V28.md sections 1, 2, 7 and 9 =======================
   Snow Days (festOn('snow'), 1 Dec to the end of February, JST): Pip's two snowdrifts in the yard (dive in) and a snow heap for a snowdog that looks like
   your dog (badly), Baker Bea's Winter Stall in the Square (the stall code is in 26_festival.js: fsStallItems, fsStallOpen0, fsChooser, fsSquareDraw).
   Winter Lights (festOn('lights'), 1 to 25 Dec): the Ugly Sweater Contest in the Square, Gerald's letter, Mrs. Plum's winter parcel.
   Data: S.wn { letters, drifts, snowdog, contest, tips } (v28Fields in 00_core.js). Acts: snowdrift {}, snowdog { stage, done }, sweater {}.
   Cross-lane names: wnActive, wnCanJump, wnSnowdogFree, wnContestOpen, wnLesson, wnJournalLine (V28.md section 2), and for 26_festival.js wnYardBoxes,
   wnBannerBox, wnBannerSVG, wnJudgedToday, wnIcon. Harness gate: the winter flags need prefs.wnTest (or __paw.wn.allow(true)).
   Art (WINTER ART, world B): PawArt.prop('snowdrift' | 'snowdog' | 'sweaterbanner', { ..., night }), icons snowdrift snowdog sweater wstall. A night:true
   prop is already night-washed by the art, so it never goes through propTint as well; dawn and dusk take the shared propTint like the leaf piles. */

/* ---- spots (world box x, y, w, h of the 1000x600 scene) ---- */
const WN_DRIFTS = FS_PILES.map((b) => b.slice()); // the as-built leaf pile spots (V25.md section 11)
// the snow heap: on the lawn in front of the dog (under #dogHit at rest, y 335-515), right of drift 0 and left of the porch step, the secret X
// and the nursery basket, its tap rect ends at y 592 like the drifts' (the phone place buttons start under the scene's bottom edge); inside the phone home crop at 390 and 360 px (x 171-545 and 151-565)
const WN_HEAP = [446, 516, 80, 80];
const WN_GAP = 20; // game minutes between two dives in the same drift
// the Ugly Sweater Contest banner: desktop as the v2.5 parade banner (between the clock tower and the right shopfront, right of Fuji). Phones: below the
// shop roofline instead of the v2.6 spot [196,142,300,74], which hid Mt. Fuji's cap (summit y 157, roofline y 197) in the 390 and 360 crops. Its plank
// stays above the Paws & Pages sign (y 282) and the Post Office sign (y 269); x follows the crop and stays clear of the look-right button
const WN_BANNER = { desk: [560, 150, 400, 90], phoneY: 196, phoneW: 300 };
const WN_CONTEST_MS = 6000;
const WN_OUTS = ['Very Ugly Sweater', 'Knit Winter Sweater', 'Reindeer Antlers', 'Pom-pom Beanie', 'Cozy Hoodie', 'Snowflake Snood'];
// the categories, the first that fits (V28.md section 7)
const WN_CATS = [['Ugliest Sweater in Town', 'Gerald had to sit down.'], ['Loudest Bell', "Gerald's ears are still ringing."], ['Cosiest Contestant', 'Gerald asked where to get one.'], ['Most Confident Walk', 'Gerald took notes.'], ['Best Natural Look', 'No sweater, all dog. Bold.']];
// the snowdog's ears, by breed key (prick or flop), the scarf is the dog's coat colour
const WN_EARS = { shiba: 'prick', corgi: 'prick', husky: 'prick', chihuahua: 'prick', frenchie: 'prick', samoyed: 'prick', collie: 'prick', golden: 'flop', dachs: 'flop', mutt: 'flop', pug: 'flop', greyhound: 'flop', beagle: 'flop', poodle: 'flop' };
const WN_LETTERS = {
  snow: { kind: 'news', from: 'Pip', title: 'Snow from the hills', text: 'It hardly ever snows down here, so I bring a cart of snow from the hills every morning. Two drifts by your fence and a heap for a snowdog. Dive in.' },
  contest: { kind: 'news', from: 'Gerald the duck', title: 'The Ugly Sweater Contest', text: 'The Ugly Sweater Contest is on in the Square until 25 December. I am the judge. I am a duck, so I am very fair.' },
  gift: { kind: 'gift', from: 'Mrs. Plum next door', title: 'A winter parcel from Mrs. Plum', text: 'Three Warm Carob Cups for {dog}. It is carob, not cocoa. I wrote it on the lids twice.', gift: { item: 'Warm Carob Cup', cat: 'food', id: 'Warm Carob Cup', n: 3 } }
};
const WN = { walking: false, walkT: [], driftT: {}, pending: 0, salt: false, hills: false, carrotT: 0, acts: [], sheetMO: null }; // pending: letter / tip timers still to run (tests wait on 0)
function wnLater(fn, ms) { WN.pending++; setTimeout(() => { WN.pending--; fn(); }, ms); }

/* ---- state ---- */
function wnFields() { if (S) v28Fields(S); }
const wnSnow = () => !!S && festOn('snow');
const wnHere = () => cur.mode === 'yard' && !!S && S.place === 'yard' && !!$('#view svg.world');
const wnToday = () => localISO();
const wnGuideHold = () => typeof gdLive === 'function' && gdLive() && (typeof gdAllowed !== 'function' || gdAllowed());
const wnGdBusy = () => typeof gdActive === 'function' && gdActive();
// a toast that waits while Gerald's guide card is up (V28.md section 7: toasts wait while gdActive())
function wnToast(text, kind, tries = 0) { if (wnGdBusy() && tries < 120) { setTimeout(() => wnToast(text, kind, tries + 1), 1000); return; } toast(text, kind); }

/* ---- art (WINTER ART) with plain fallbacks ---- */
function wnArt(name, o) {
  const night = isNight(), opt = Object.assign({}, o || {});
  if (night) opt.night = true;
  const a = artReal('prop', name, opt) || art('prop', name, opt);
  return night ? a : propTint(a); // night: washed by the art itself; dawn / dusk: the shared time tint (day returns it unchanged)
}
function wnIcon(n) { return artReal('icon', n) || iconOr(n, n === 'sweater' ? '<path d="M-12 -10 l6 -4 h12 l6 4 l4 10 l-6 2 v12 h-20 v-12 l-6 -2z" fill="#E0605C" stroke="#5B3D32" stroke-width="2"/>' : '<path d="M-14 8 q4 -16 14 -16 q10 0 14 16z" fill="#EDF1F5" stroke="#5B3D32" stroke-width="2"/>'); }

/* ---- the yard: drifts and the snow heap ---- */
function wnYardBoxes() { return WN_DRIFTS.map((b) => b.slice()).concat([WN_HEAP.slice()]); }
function wnDriftSVG(i, state) {
  const [x, y, w, h] = WN_DRIFTS[i];
  return `<g class="hot wn-drift" data-drift="${i}" data-state="${state}" tabindex="0" role="button" aria-label="Snowdrift: dive in">${place(wnArt('snowdrift', { state, seed: i }), x, y, w, h)}${fsHit(x, y, w, h)}</g>`;
}
function wnDogOpts() {
  const sd = S.wn.snowdog, o = { stage: Math.max(0, Math.min(3, sd.stage | 0)) };
  if (o.stage === 3) { const d = (sd.by && dogById(sd.by)) || D(), c = coatInfo(d); o.ears = WN_EARS[d.key] || 'flop'; o.scarf = (c && c.coat && c.coat.base) || '#E0605C'; o.nose = sd.nose !== false; }
  return o;
}
function wnHeapSVG() {
  const [x, y, w, h] = WN_HEAP, o = wnDogOpts(), lbl = ['Snow heap: build a snowdog', 'Snowball: keep building', 'Half a snowdog: keep building', 'The snowdog'][o.stage];
  return `<g id="wnDogG" class="hot" data-stage="${o.stage}" tabindex="0" role="button" aria-label="${lbl}">${place(wnArt('snowdog', o), x, y, w, h)}${fsHit(x + 3, y + 2, w - 6, h - 6)}</g>`;
}
function wnYardDraw() {
  const svg = $('#view svg.world'); if (!svg) return;
  ['#wnDriftG', '#wnDogG'].forEach((s) => { const e = $(s, svg); if (e) e.remove(); });
  if (!wnSnow() || S.place !== 'yard') return;
  wnFields(); wnSnowdogSync(false);
  const html = `<g id="wnDriftG">${WN_DRIFTS.map((b, i) => wnDriftSVG(i, WN.driftT[i] ? 'scattered' : 'full')).join('')}</g>${wnHeapSVG()}`;
  const a = $('#decorG', svg) || $('#msCardG', svg); if (a) a.insertAdjacentHTML('afterend', html); else { const hg = $('#houseG', svg); if (hg) hg.insertAdjacentHTML('beforebegin', html); else return; }
  wnBind();
}
function wnBind() {
  fsHitFit();
  const key = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
  document.querySelectorAll('#wnDriftG [data-drift]').forEach((el) => { const go = (e) => { if (e && e.stopPropagation) e.stopPropagation(); wnDriftTap(+el.dataset.drift); }; el.onclick = go; el.onkeydown = key(go); });
  const g = $('#wnDogG'); if (g) { const go = (e) => { if (e && e.stopPropagation) e.stopPropagation(); wnHeapTap(); }; g.onclick = go; g.onkeydown = key(go); }
}
function wnHeapRedraw() { const g = $('#wnDogG'); if (g) { g.outerHTML = wnHeapSVG(); wnBind(); } }

/* ---- the snowdog's day: a new localISO day starts at stage 0 (Pip brings fresh snow); the finished one "went up to the hills" ---- */
function wnSnowdogSync(show) {
  if (!S) return; wnFields(); const sd = S.wn.snowdog, t = wnToday(); if (sd.date === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1); const was = sd.stage === 3 && sd.date === localISO(y); // only yesterday's snowdog (not one from last winter or days ago)
  Object.assign(sd, { date: t, stage: 0, by: null, nose: true }); markDirty();
  if (!was || !wnSnow()) return;
  if (show === false) { WN.hills = true; return; } // drawn on the way into the yard: the toast comes from the yard:enter that follows
  wnHills();
}
function wnHills() { WN.hills = false; wnLater(() => { if (wnHere()) wnToast("Fresh snow from Pip. Yesterday's snowdog went up to the hills to see the others.", 'good'); }, 900); }

/* ---- who plays: an awake adult (3 months or older, not nursing); for a young puppy the first such dog of the pack ---- */
const wnAdult = (d) => !!d && ageMonths(d) >= 3 && !d.sleeping && !(typeof hmMumIn === 'function' && hmMumIn(d));
function wnCanJump() { return wnSnow() && Array.isArray(S.dogs) && S.dogs.some((d) => ageMonths(d) >= 3 && !(typeof hmMumIn === 'function' && hmMumIn(d))); }
function wnSnowdogFree() { if (!wnCanJump()) return false; const sd = S.wn && S.wn.snowdog; return !(sd && sd.date === wnToday() && sd.stage >= 3); }
function wnPlayer() { // { pup, adult } or null when nobody can (a kind line is shown)
  const pup = ageMonths(D()) < 3, adult = pup ? others().find(wnAdult) : null;
  if (pup && !adult) { const h = dogHeadWorld(); say('Sniff.', h.x, h.y, 1800); toast(`${NAME()} is too small for snow games yet. Puppies watch from the path for now.`); return null; }
  return { pup, adult };
}
const wnFree = () => !(busy || S.sleeping || (typeof curling !== 'undefined' && curling) || (typeof HO === 'object' && HO.pl));

/* ---- a dive into a snowdrift ---- */
function wnDriftTap(i) { return fsTry(wnDriftTap0, i); }
function wnDriftTap0(i) {
  if (!WN_DRIFTS[i] || !wnSnow() || cur.mode !== 'yard' || S.place !== 'yard' || !wnFree()) return;
  wnFields(); const last = S.wn.drifts[i];
  if (typeof last === 'number' && S.gameMin - last >= 0 && S.gameMin - last < WN_GAP) { toast('Pip is fluffing that one up again.'); return; }
  const who = wnPlayer(); if (!who) return;
  const { pup, adult } = who, [x, y, w, h] = WN_DRIFTS[i], cx = x + w / 2, gy = y + h * 0.8, face = cx < 430 ? 'left' : 'right';
  busy = true; hideBubble(); SFX.click();
  const tx = pup ? cx - 430 + (face === 'left' ? 120 : -120) : cx - 430, ty = Math.max(0, gy - 500) - (pup ? 0 : 6);
  dogTo(tx, ty, 1, 0.8); renderDog('walk', face);
  const T = (fn, ms) => setTimeout(() => { if (cur.mode === 'yard' && S.place === 'yard') fn(); }, ms);
  T(() => {
    if (pup) { renderDog('sit', face, true); fsPackJump(adult, cx, gy); } else { renderDog('jump', face, true); const fx = $('#dogFx'); if (fx) { fx.classList.remove('tk-pounce'); void fx.getBBox(); fx.classList.add('tk-pounce'); } }
    try { SFX.snowCrunch(); setTimeout(() => SFX.snowCrunch(), 180); } catch (e) { /* audio off */ }
    wnScatter(i);
  }, 850);
  T(() => {
    addStat('happy', 6); addBond(1); S.wn.drifts[i] = S.gameMin; markDirty(); updateHUD();
    const hw = dogHeadWorld(); say(pup ? `${adult.name} did the diving. ${NAME()} did the cheering.` : PICK(['Floof.', 'Snow in my ears. Worth it.', 'I am a snow dog now.']), hw.x, hw.y, 2600);
    trackAct('snowdrift', {});
    const y = wnYear(); if (!isWarm() && S.wn.tips.cold !== y) { S.wn.tips.cold = y; markDirty(); wnLater(() => wnToast('Short coats feel the cold fast. A sweater or a snood makes snow play cosy.', 'good'), 1500); }
  }, 1600);
  T(() => { const fx = $('#dogFx'); if (fx) fx.classList.remove('tk-pounce'); dogTo(0, 0, 1, 0.8); renderDog('walk', face === 'left' ? 'right' : 'left'); }, 2400);
  setTimeout(() => { busy = false; if (cur.mode === 'yard') renderDog(dogPoseNow(), 'right', true); }, 3300);
}
function wnScatter(i) {
  const g = $(`#wnDriftG [data-drift="${i}"]`); if (!g) return;
  clearTimeout(WN.driftT[i]); WN.driftT[i] = setTimeout(() => { delete WN.driftT[i]; const o = $(`#wnDriftG [data-drift="${i}"]`); if (o) { o.outerHTML = wnDriftSVG(i, 'full'); wnBind(); } }, 4000);
  g.outerHTML = wnDriftSVG(i, 'scattered'); wnBind();
  if (fsMotionOff()) return;
  const fx = $('#fx'); if (!fx) return; const [x, y, w, h] = WN_DRIFTS[i], cx = x + w / 2, cy = y + h * 0.5;
  for (let k = 0; k < 12; k++) {
    const a = -Math.PI * (0.1 + 0.8 * (k / 11)) + (Math.random() - 0.5) * 0.3, d = 60 + Math.random() * 60, r = 5 + Math.random() * 6;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'wn-puff');
    el.style.setProperty('--dx', f1(Math.cos(a) * d) + 'px'); el.style.setProperty('--dy', f1(Math.sin(a) * d) + 'px'); el.style.animationDelay = Math.round(k * 25) + 'ms';
    el.innerHTML = `<circle cx="${f1(cx + (Math.random() - 0.5) * 40)}" cy="${f1(cy)}" r="${f1(r)}" fill="#F6F7F3" stroke="#8397B0" stroke-width="1.4"/>`; fx.appendChild(el); setTimeout(() => el.remove(), 1700);
  }
}

/* ---- building the snowdog: one stage per tap ---- */
function wnHeapTap() { return fsTry(wnHeapTap0); }
function wnHeapTap0() {
  if (!wnSnow() || cur.mode !== 'yard' || S.place !== 'yard' || !wnFree()) return;
  wnFields(); wnSnowdogSync(); const sd = S.wn.snowdog;
  if (sd.stage >= 3) { const h = dogHeadWorld(); say(PICK(['It is perfect. Do not touch it.', 'Good snowdog.']), h.x, h.y, 2200); return; }
  const who = wnPlayer(); if (!who) return;
  const { pup, adult } = who, builder = pup ? adult : D(), [x, y, , h] = WN_HEAP, gy = y + h * 0.92;
  busy = true; hideBubble(); SFX.click();
  if (pup) { renderDog('sit', 'right', true); fsPackJump(adult, x - 30, gy); } else { dogTo(x - 66 - 430, Math.max(0, gy - 500), 1, 0.5); renderDog('walk', 'right'); }
  const T = (fn, ms) => setTimeout(() => { if (cur.mode === 'yard' && S.place === 'yard') fn(); }, ms);
  T(() => { if (!pup) renderDog('crouch', 'right', true); }, 520);
  T(() => {
    wnFields(); const s = S.wn.snowdog; s.stage = Math.min(3, (s.stage | 0) + 1); s.date = wnToday(); if (s.stage === 3) s.by = builder.id; markDirty();
    wnHeapRedraw(); try { SFX.pop(); } catch (e) { /* audio off */ }
    const hw = dogHeadWorld();
    if (s.stage < 3) { say(s.stage === 1 ? 'Roll, roll, roll.' : 'Head on.', hw.x, hw.y, 2000); trackAct('snowdog', { stage: s.stage, done: false }); return; }
    addStat('happy', 10); addBond(1); markDirty(); updateHUD();
    toast(`Done. It looks just like ${builder.name}. Nobody can tell which is which.`, 'gold');
    trackAct('snowdog', { stage: 3, done: true });
    clearTimeout(WN.carrotT); WN.carrotT = setTimeout(() => wnCarrot(), 8000);
  }, 1200);
  T(() => { if (!pup) { dogTo(0, 0, 1, 0.5); renderDog('walk', 'left'); } }, 1350);
  setTimeout(() => { busy = false; if (cur.mode === 'yard') renderDog(dogPoseNow(), 'right', true); }, 1900);
}
// once a day, 1 in 3 (seeded by the date): the builder eats the carrot nose of a finished snowdog
const wnCarrotDay = (dk) => seeded(hashId('carrot|' + dk))() < 1 / 3;
function wnCarrot(force) {
  if (!S || !wnSnow()) return false; wnFields(); const sd = S.wn.snowdog;
  if (sd.stage !== 3 || sd.nose === false || sd.date !== wnToday() || !(force || wnCarrotDay(sd.date))) return false;
  if (!wnHere()) return false; // away: the next yard:enter checks again
  if (busy) { if (!force) { clearTimeout(WN.carrotT); WN.carrotT = setTimeout(() => { if (wnHere()) wnCarrot(); }, 6000); } return false; }
  const d = (sd.by && dogById(sd.by)) || D(); sd.nose = false; markDirty(); wnHeapRedraw();
  wnToast(`${d.name} ate the carrot nose. Carrots are good for dogs, so fine.`, 'good'); return true;
}

/* ---- the Square: the Ugly Sweater Contest banner (fsSquareDraw draws it after the stall) ---- */
function wnBannerBox() {
  if (!isPhone()) return WN_BANNER.desk.slice();
  const [c0, c1] = fsCrop(), w = Math.min(WN_BANNER.phoneW, c1 - c0 - 50);
  return [Math.max(196, c0 + 8), WN_BANNER.phoneY, w, f1(w * 74 / 300)];
}
function wnBannerSVG() { const [x, y, w, h] = wnBannerBox(); return `<g id="wnBannerG" pointer-events="none" data-night="${isNight() ? 1 : 0}">${place(wnArt('sweaterbanner', {}), x, y, w, h)}</g>`; }

/* ---- the Ugly Sweater Contest (Square, Winter Lights) ---- */
const wnJudgedToday = () => !!(S && S.wn && S.wn.contest && S.wn.contest.date === wnToday());
function wnActive() { return WN.walking; }
function wnCategory(o) {
  const w = SLOTS.map((k) => o && o[k]).filter(Boolean);
  return w.includes('Very Ugly Sweater') ? 0 : w.includes('Reindeer Antlers') ? 1 : w.some((n) => WARM_WEAR.includes(n)) ? 2 : w.length ? 3 : 4;
}
const wnCatText = (c) => WN_CATS[c].join('. ');
function wnContestDogs(dk = wnToday()) {
  const r = seeded(hashId('sweater|' + dk));
  return fsParadeDogs(dk).map((n) => { const it = WN_OUTS[Math.floor(r() * WN_OUTS.length)], slot = (CLOTHES.find((x) => x.n === it) || {}).slot || 'body', outfit = { [slot]: it }; return Object.assign({}, n, { sweater: it, outfit, cat: wnCategory(outfit) }); });
}
function wnContestOpen() { return fsTry(wnContestOpen0); }
function wnContestOpen0() {
  if (!S) return null;
  if (!festOn('lights')) { toast('The Ugly Sweater Contest is over for this winter. Gerald is still recovering.'); return null; }
  SFX.boop(700); wnFields(); const dogs = wnContestDogs(), me = D(), done = wnJudgedToday(), mc = wnCategory(outfitOf(me));
  const card = (n) => `<div class="fs-npc wn-npc" role="listitem"><span class="fs-pdog">${dogSVG(n, { pose: 'sit', outfit: n.outfit, facing: 'right' })}</span><b>${esc(n.name)}</b><span class="small">${esc(n.sweater)}</span><span class="small wn-cat">${esc(WN_CATS[n.cat][0])}</span></div>`;
  const duck = typeof gdDuck === 'function' ? gdDuck('sit') : '', words = SLOTS.map((k) => outfitOf(me)[k]).filter(Boolean);
  const p = openModal('Ugly Sweater Contest', `<div class="fs-banner wn-cbanner" aria-hidden="true">${artReal('prop', 'sweaterbanner', {}) || art('prop', 'sweaterbanner', {})}</div>
    <div class="wn-judge"><span class="wn-duck" aria-hidden="true">${duck}</span><p><b>Gerald:</b> "I am the judge. I am a duck, so I am very fair."</p></div>
    <p class="small wn-intro">Five town dogs in their worst knits, and you. Everyone wins a category.</p>
    <div class="wn-rowwrap"><div class="fs-row wn-line" role="list" aria-label="Today's contestants">${dogs.map(card).join('')}</div><span class="wn-cue" aria-hidden="true">Swipe for all five ›</span></div>
    <div class="fs-you wn-you"><span class="fs-pdog">${dogSVG(me, { pose: 'sit', outfit: outfitOf(me), facing: 'right' })}</span><div><b>${esc(NAME())}</b><span class="small">${esc(words.length ? 'Wearing ' + words.join(' and ') + '.' : 'No sweater. Going as a dog.')}</span><span class="small wn-cat">Up for: ${esc(WN_CATS[mc][0])}</span>${done ? '<span class="small">Judged today. Come back tomorrow for another go.</span>' : ''}</div></div>`,
  { cls: 'fs-paradepop wn-contest', foot: `<button class="btn yes big" id="wnEnter" ${done ? 'aria-disabled="true"' : ''}>${done ? 'Judged today' : 'Enter the contest'}</button>` });
  $('#wnEnter', p).onclick = () => {
    if (wnJudgedToday()) { nope('Gerald judges once a day. He needs a long sit-down after.'); return; }
    if (busy || S.sleeping) { nope(S.sleeping ? `${NAME()} is asleep. The contest can wait one nap.` : `Hold on, ${NAME()} is busy.`); return; }
    SFX.click(); closeModal(); wnContestWalk(dogs);
  };
  return p;
}
function wnContestWalk(dogs) {
  wnFields(); // the day is spent at the payout (wnContestDone), so a reload mid-walk loses nothing. WN.walking and busy stop a second entry meanwhile
  if (fsMotionOff() || !fsHere('square')) { wnContestDone(); return; }
  const svg = $('#view svg.world'), fx = $('#fx', svg); if (!fx) { wnContestDone(); return; }
  WN.walking = true; busy = true; hideBubble();
  ['#dogPos', '#pack', '#visitorG', '#placeBtns'].map((s) => $(s, view)).filter(Boolean).forEach((e) => { e.style.visibility = 'hidden'; });
  fsSquareDraw(); // the stall and the banner step aside while the line walks (fsActive)
  const sc = 0.56, w = 264 * sc, hgt = 220 * sc, gap = 104, feetY = 505, line = [D()].concat(dogs);
  const [c0, c1] = fsCrop(), ph = isPhone(), lead = ph ? c0 - w / 2 : 200, dist = ph ? (c1 + w / 2 + (line.length - 1) * gap) - lead : 700;
  const parts = line.map((d, i) => { const x = lead - i * gap - w / 2, y = feetY - hgt * (205 / 220); return `<g class="fs-pd" data-i="${i}">${place(dogSVG(d, { pose: 'walk', outfit: i ? d.outfit : outfitOf(d), facing: 'right' }), f1(x), f1(y), f1(w), f1(hgt))}</g>`; }).join('');
  fx.insertAdjacentHTML('beforebegin', `<g id="wnWalkG" pointer-events="none"><g class="fs-line" style="transform:translateX(0px)">${parts}</g><g class="wn-flakes"></g></g>`);
  const lg = $('#wnWalkG .fs-line'), fl = $('#wnWalkG .wn-flakes');
  for (let k = 0; k < 12; k++) { const el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'fs-drop wn-flake'); el.style.animationDelay = (k * 0.5).toFixed(2) + 's'; el.style.setProperty('--sway', (k % 2 ? 36 : -36) + 'px'); el.innerHTML = wnFlake(120 + ((k * 89) % 800), 150 + (k % 3) * 20, 9 + (k % 3) * 2, k * 17); fl.appendChild(el); }
  requestAnimationFrame(() => requestAnimationFrame(() => { if (lg) { lg.style.transition = `transform ${WN_CONTEST_MS}ms linear`; lg.style.transform = `translateX(${dist}px)`; } }));
  const sayAt = 1800; WN.walkT.push(setTimeout(() => { if (fsHere('square')) say(PICK(['Is that a sweater or a blanket?', 'Gerald is taking notes.']), lead + dist * sayAt / WN_CONTEST_MS, feetY - hgt * 0.85, 2400); }, sayAt));
  WN.walkT.push(setTimeout(() => wnContestEnd(true), WN_CONTEST_MS + 200));
  onCleanup(() => { if (WN.walking) wnContestEnd(false); });
}
// a paper snowflake (six crayon spokes with little ticks)
function wnFlake(x, y, r, rot) {
  const sp = [0, 60, 120].map((a) => `<path d="M${-r} 0 H${r} M${f1(-r * 0.55)} -3 l3 3 l-3 3 M${f1(r * 0.55)} -3 l-3 3 l3 3" transform="rotate(${a})"/>`).join('');
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})" fill="none" stroke-linecap="round"><g stroke="#8397B0" stroke-width="5">${sp}</g><g stroke="#FFFBF3" stroke-width="3">${sp}</g></g>`;
}
function wnContestEnd(here) {
  WN.walkT.splice(0).forEach(clearTimeout); if (!WN.walking) return;
  WN.walking = false; busy = false;
  const g = $('#wnWalkG'); if (g) g.remove();
  ['#dogPos', '#pack', '#visitorG', '#placeBtns'].forEach((s) => { const e = $(s, view); if (e) e.style.visibility = ''; });
  if (here && fsHere('square')) renderDog(dogPoseNow(), 'right', true);
  wnContestDone();
}
function wnContestDone() {
  wnFields(); S.wn.contest.date = wnToday();
  const c = wnCategory(outfitOf(D())), n = addCoins(10, { raw: true }); addStat('happy', 10); addBond(2); markDirty(); updateHUD(); SFX.kaching();
  toast(`${NAME()} wins ${wnCatText(c)} +${n} coins.`, 'gold'); trackAct('sweater', {});
  if (fsHere('square')) fsSquareDraw();
  const y = wnYear(); if (S.wn.contest.year === y) return;
  S.wn.contest.year = y; const fresh = !owns('clothes', 'Ugly Sweater Rosette'); if (fresh) S.inv.clothes.push('Ugly Sweater Rosette'); markDirty(); saveNow();
  const show = () => {
    SFX.fanfare();
    const p = openModal('<span class="hl">The Ugly Sweater Rosette!</span>', `<div class="ms-prize"><span class="ms-prize-art">${itemArt('Ugly Sweater Rosette')}</span><div><p>${fresh ? `Gerald pins a rosette on ${esc(NAME())}. It is uglier than any sweater in town, and that is the point.` : 'A winner again this winter. Gerald adds one more knitted bobble to the rosette.'}</p><p class="small">Ugly Sweater Rosette: neck. It is in the Wardrobe.</p></div></div>`, { cls: 'celebrate wn-rosette', foot: '<button class="btn no" id="wnLater">Later</button><button class="btn yes big" id="wnWear">Wear it</button>' });
    $('#wnLater', p).onclick = () => { SFX.click(); closeModal(); };
    $('#wnWear', p).onclick = () => { closeModal(); equip('Ugly Sweater Rosette', true); toast(`${NAME()} is wearing the Ugly Sweater Rosette. Very proud, very ugly.`, 'good'); };
  };
  if (typeof msWhenFree === 'function') msWhenFree(show); else setTimeout(show, 600);
}

/* ---- letters (once per winter year each), held while Gerald's guide runs ---- */
function wnLetters() {
  if (!S || typeof mailPush !== 'function' || wnGuideHold()) return; wnFields();
  const y = wnYear(), L = S.wn.letters, push = (k) => { L[k] = y; markDirty(); const m = WN_LETTERS[k]; mailPush(Object.assign({}, m, { id: `wn_${k}_${y}`, text: m.text.replace('{dog}', NAME()) }, m.gift ? { gift: Object.assign({}, m.gift) } : {})); };
  if (festOn('snow') && L.snow !== y) push('snow');
  if (festOn('lights')) { if (L.contest !== y) push('contest'); if (L.gift !== y) push('gift'); }
}

/* ---- tips: road salt after the first winter walk, once per winter year ---- */
function wnSaltTip() {
  if (!WN.salt || !S) return; wnFields(); const y = wnYear();
  if (S.wn.tips.salt === y) { WN.salt = false; return; }
  wnLater(() => {
    if (!WN.salt || cur.mode !== 'yard') return;
    if (!modal.hidden) return wnAfterSheet(wnSaltTip); // still on the results sheet (or a sheet after it): the tip comes when it closes
    WN.salt = false; S.wn.tips.salt = y; markDirty(); wnToast('Wipe paws after a winter walk. Road salt stings, and nobody wants to lick it.', 'good');
  }, 900);
}

function wnAfterSheet(fn) { // once, when the open sheet closes
  if (WN.sheetMO || typeof MutationObserver !== 'function') return;
  WN.sheetMO = new MutationObserver(() => { if (!modal.hidden) return; WN.sheetMO.disconnect(); WN.sheetMO = null; fn(); });
  WN.sheetMO.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
}

/* ---- Gerald's How to play card and the Journal line ---- */
function wnLesson() { return S && festOn('snow') ? ['winter', 'snowdrift', 'Winter', "Pip's snowdrifts by the fence are for diving in. Short coats like a sweater in the snow. Wipe paws after a winter walk."] : ''; }
function wnJournalLine() {
  if (!S || !festOn('lights')) return '';
  return `<p class="fs-jline wn-jline"><span class="ic" aria-hidden="true">${wnIcon('sweater')}</span><b>Contest:</b> Ugly Sweater Contest in the Square until 25 December.</p>`;
}

/* ---- bus ---- */
on('game:ready', () => { wnFields(); setTimeout(wnExpose, 0); wnLater(() => { if (cur.mode === 'yard') wnLetters(); }, 1300); });
on('yard:enter', () => {
  wnFields(); wnExpose();
  if (S.place === 'yard') { wnYardDraw(); if (WN.hills && wnSnow()) wnHills(); if (wnSnow()) wnLater(() => wnCarrot(), 2500); }
  wnLater(() => { if (cur.mode === 'yard') wnLetters(); }, 1300);
  wnSaltTip();
});
on('scene:redraw', () => { if (cur.mode === 'yard' && S && S.place === 'yard' && !busy) wnYardDraw(); });
on('env:fest', () => { if (cur.mode === 'yard') { if (S.place === 'yard') wnYardDraw(); wnLater(wnLetters, 500); } });
on('day:new', () => { if (wnHere() && wnSnow()) { wnSnowdogSync(); wnHeapRedraw(); } });
on('act', (a) => {
  if (!a || !S) return;
  if (['snowdrift', 'snowdog', 'sweater'].includes(a.kind) || (a.kind === 'buy' && a.shop === 'stall')) { WN.acts.push(a); if (WN.acts.length > 30) WN.acts.shift(); }
  if (a.kind === 'walk' && seasonNow() === 'winter') { wnFields(); if (S.wn.tips.salt !== wnYear()) WN.salt = true; }
});

/* ---- tests: window.__paw.wn ---- */
function wnExpose() {
  if (!window.__paw) return;
  window.__paw.wn = {
    allow: (v) => { prefs.wnTest = !!v; checkEnv(true); return festNow(); }, // the harness gate at run time (the occlusion hooks)
    auto: (j) => wnAuto(j), tap: (i) => wnDriftTap(i), dog: () => wnHeapTap(), contestOpen: () => wnContestOpen(), stallItems: () => fsStallItems().map((x) => x.n),
    keepOut: (pl) => fsKeepOut(pl), journal: () => (typeof fsJournalLine === 'function' ? fsJournalLine() : wnJournalLine()), lesson: () => wnLesson(), letters: () => wnLetters(),
    carrot: (f) => wnCarrot(f), carrotDay: (dk) => wnCarrotDay(dk), sync: () => { wnSnowdogSync(); wnYardDraw(); }, draw: () => wnYardDraw(), dogs: (dk) => wnContestDogs(dk).map((n) => ({ name: n.name, sweater: n.sweater, cat: n.cat })),
    category: (o) => wnCategory(o), cats: WN_CATS.map((c) => c.join('. ')), canJump: () => wnCanJump(), free: () => wnSnowdogFree(), heap: WN_HEAP.slice(), drifts: WN_DRIFTS.map((b) => b.slice()), banner: () => wnBannerBox(),
    get walking() { return WN.walking; }, get pending() { return WN.pending; }, get scattered() { return Object.keys(WN.driftT).map(Number); }, get acts() { return WN.acts.slice(); }
  };
}
setTimeout(wnExpose, 0);
