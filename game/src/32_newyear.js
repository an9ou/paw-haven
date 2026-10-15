/* ======================= v2.8 NEW YEAR lane (tag ny): New Year cards, the Fortune box, the year-end clean. See V28.md sections 1, 2, 8 and 9 =======================
   New Year cards (1-7 Jan JST, nyDays()): once per nyYear, three kinds of nengajo arrive in the mailbox: Gerald's (a Year of the Sheep Hood in 2027),
   Mrs. Plum's otoshidama (30 coins) and up to three from rehomed puppies (a photo, no gift). Gifts pay on Collect only (v2.7, 07b_mailbox.js).
   The cards carry `card: 'nengajo'`: the letter view (07b_mailbox.js, letterBody) calls nyCardHTML(m) and draws PawArt.prop('nengajo', { animal }) behind the card text.
   The Fortune box (Square, nyDays()): nySquareDraw (called by fsSquareDraw), nyFortuneBox (fsKeepOut), nyFortuneOpen (the sheet), nyJournalLine (fsJournalLine).
   One fortune a real day (S.ny.fortune.date), seeded by the date and the save, only good ones. Knots (up to 12) restart when S.ny.fortune.year changes.
   The year-end clean (26-31 Dec) is only the `yearclean` mission (24_missions.js): nyEve() makes it eligible and a bath completes it.
   Data: S.ny { cards, fortune { date, year, knots, tied } }. Acts: fortune {}. Test hook: window.__paw.ny.
   Art (WINTER ART, world B): PawArt.prop('fortunebox', { knots, night }) (already night-washed, never also propTint), PawArt.prop('nengajo', { animal }), icon 'fortune'. */

/* ---- data ---- */
// the year's animal and the hood (TODO: next year's animal is the Monkey, 2028 needs an entry and its item)
const NY_ZODIAC = { 2027: { animal: 'Sheep', item: 'Year of the Sheep Hood' } };
const NY_BOX_SPOT = { desk: [212, 344, 114, 105], phone: [212, 496, 100, 92] }; // the as-built pop-up spot (27_halloween.js HW_POP)
const NY_MAX_KNOTS = 12;
const NY_SHAKE_MS = 800;
const NY_PUP_LINES = [
  (p, f, pr) => `Happy New Year from ${p} and ${f}. ${pr.He} ate the paper on the shimekazari, but only a little.`,
  (p) => `Happy New Year! ${p} saw a kite and is still barking at it.`,
  (p) => `${p} wishes you a year full of sticks. Happy New Year.`
];
// the twelve fortunes, never bad ("Small luck" is the lowest)
const NY_FORTUNES = [
  'Great luck. A stick of exactly the right length is coming your way.',
  'Great luck. Someone will drop a whole piece of cheese.',
  'Good luck. The postman will finally say hello back.',
  'Good luck. Every puddle this year will be the perfect depth.',
  "Great luck. A sunny patch will find you on the floor at four o'clock.",
  'Good luck. The squirrel will make a mistake.',
  'Small luck. Small luck is still luck. Have a biscuit.',
  'Great luck. Your tail will be the fastest in town.',
  'Good luck. A new friend at the Dog Park, and they have a ball.',
  'Great luck. The bath will be quick and the towel will be warm.',
  'Good luck. A nap so good you forget what day it is.',
  'Great luck. Someone will say good dog and mean it every time.'
];
const NY = { pending: 0, shaking: false, acts: [], sent: 0 }; // pending: card timers still to run (tests wait on 0)
function nyLater(fn, ms) { NY.pending++; setTimeout(() => { NY.pending--; fn(); }, ms); }
function nyFields() { if (S) v28Fields(S); }
const nyGuideHold = () => typeof gdLive === 'function' && gdLive() && (typeof gdAllowed !== 'function' || gdAllowed());
const nyHere = () => cur.mode === 'yard' && !!S && S.place === 'square' && !!$('#view svg.world');
const nyMotionOff = () => document.documentElement.dataset.motion === 'off';

/* ---- art ---- */
function nyIcon() { return artReal('icon', 'fortune') || iconOr('fortune', '<rect x="-9" y="-12" width="18" height="24" rx="3" fill="#E2B57A" stroke="#5B3D32" stroke-width="2"/><path d="M-9 -4 h18" stroke="#5B3D32" stroke-width="1.6"/><rect x="-4" y="-18" width="8" height="8" fill="#FFFBF3" stroke="#5B3D32" stroke-width="1.6"/>'); }
// the box: a night:true drawing is already washed by the art, so it never goes through propTint as well (dawn and dusk take the shared tint)
function nyBoxArt(knots, night) {
  const opt = { knots: Math.max(0, Math.min(NY_MAX_KNOTS, knots | 0)) }; if (night) opt.night = true;
  const a = artReal('prop', 'fortunebox', opt) || art('prop', 'fortunebox', opt);
  return night ? a : propTint(a);
}

/* ---- where the box stands: the pop-up spot, with the same visitor fallback as the v2.6 pop-up (hwPopBox) ---- */
// phones: the pop-up spots first, then, when a visitor shifts and zooms the crop (the v2.6 TODO case), two more on the foreground row, right of the dog:
// the first that sits inside the crop and clear of the dog, the visitor, the stall and the pack dogs, else the same without the pack, else the desktop spot
const nyPackBoxes = () => [...document.querySelectorAll('#pack .packdog .pd-wander > rect')].map((r) => { try { const b = r.getBBox(); return [b.x, b.y, b.width, b.height]; } catch (e) { return null; } }).filter(Boolean);
function nyFortuneBox() {
  if (!isPhone()) return NY_BOX_SPOT.desk.slice();
  const [c0, c1] = fsCrop(), dog = [DX + 30, DY + 40, DW - 60, DH - 40], vis = fsVisitorBox(), stall = fsAnyOn() ? fsStallBox() : null, pack = nyPackBoxes();
  const cands = [NY_BOX_SPOT.phone, [c0 + 6, 496, 100, 92], [c1 - 240, 496, 100, 92], [c1 - 112, 496, 100, 92]];
  const ok = (b, withPack) => b[0] >= c0 && b[0] + b[2] <= c1 && !fsOver(b, dog) && !fsOver(b, vis) && !fsOver(b, stall) && !(withPack && pack.some((p) => fsOver(b, p)));
  return (cands.find((b) => ok(b, true)) || cands.find((b) => ok(b, false)) || NY_BOX_SPOT.desk).slice();
}

/* ---- the Fortune box in the Square (fsSquareDraw calls this after the stall, banner and buttons) ---- */
function nySquareDraw() {
  const svg = $('#view svg.world'); if (!svg) return;
  const old = $('#nyFortuneG', svg); if (old) old.remove();
  const pb = $('#placeBtns'); if (pb) pb.querySelectorAll('[data-ny]').forEach((b) => b.remove());
  if (!S || S.place !== 'square' || !nyDays() || (typeof fsActive === 'function' && fsActive())) return;
  nyFields(); nyKnotsSync();
  const at = typeof fsSlot === 'function' ? fsSlot() : ($('#bowlG', svg) || $('#pack', svg)); if (!at) return;
  const [x, y, w, h] = nyFortuneBox(), night = isNight(), k = S.ny.fortune.knots;
  at.insertAdjacentHTML('beforebegin', `<g id="nyFortuneG" class="hot" data-knots="${k}" data-night="${night ? 1 : 0}" tabindex="0" role="button" aria-label="Fortune box: shake it for a New Year fortune">${place(nyBoxArt(k, night), x, y, w, h)}${fsHit(x, y, w, h)}${isPhone() && typeof hwChip === 'function' ? fsChipAbove('Fortune box', [x, y, w, h], fsAnyOn() ? [fsStallBox()] : []) : ''}</g>`);
  if (typeof fsHitFit === 'function') fsHitFit();
  const g = $('#nyFortuneG', svg), go = () => { SFX.click(); nyFortuneOpen(); };
  g.onclick = (e) => { e.stopPropagation(); go(); }; g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  if (pb && !isPhone()) { // phones: the Fortune box row of the Festival chooser instead, so the Square row stays one line
    const home = pb.querySelector('[data-pb="yard"]'), btn = '<button class="btn yes" data-ny="fortune" aria-label="Fortune box">Fortune box</button>';
    if (home) home.insertAdjacentHTML('beforebegin', btn); else pb.insertAdjacentHTML('beforeend', btn);
    const b = pb.querySelector('[data-ny]'); if (b) b.onclick = () => { SFX.click(); nyFortuneOpen(); };
  }
}
// the knots start again every New Year
function nyKnotsSync() { if (!S) return; nyFields(); const f = S.ny.fortune, y = nyYear(); if (f.year !== y) { f.year = y; f.knots = 0; markDirty(); } }

/* ---- the fortune: one per real day, seeded by the date and the save ---- */
function nySaveKey() { return String((S.dogs && S.dogs[0] && S.dogs[0].id) || (S.dog && S.dog.id) || (S.dog && S.dog.name) || 'doggo'); }
function nyFortuneIdx(day) { return Math.floor(seeded(hashId('fortune|' + (day || localISO()) + '|' + nySaveKey()))() * NY_FORTUNES.length); }
const nyDrawnToday = () => !!(S && S.ny && S.ny.fortune && S.ny.fortune.date === localISO());
const nyTiedToday = () => !!(S && S.ny && S.ny.fortune && S.ny.fortune.tied === localISO());
function nySlipHTML(txt) {
  const i = txt.indexOf('. '), head = txt.slice(0, i + 1), body = txt.slice(i + 2);
  return `<div class="ny-slip" role="note" aria-label="Your fortune"><span class="ny-slip-bar" aria-hidden="true"></span><b class="ny-luck">${esc(head)}</b><p class="ny-ftxt">${esc(body)}</p></div>`;
}
function nyFortuneOpen() { return fsTry(nyFortuneOpen0); }
function nyFortuneOpen0() {
  if (!S) return null;
  if (!nyDays()) { toast('The Fortune box has gone back to the shed until next New Year.'); return null; }
  nyFields(); nyKnotsSync(); SFX.boop(620); if (typeof audioPlace === 'function') audioPlace('journal');
  const drawn = nyDrawnToday(), tied = nyTiedToday(), k = S.ny.fortune.knots, fz = nyFortuneIdx();
  const intro = !drawn ? `Shake the box and see what the new year has for ${esc(NAME())}. Every fortune in here is a good one.`
    : tied ? 'Come back tomorrow for another.' : `${esc(NAME())}'s fortune for today. Tie it on the rail to keep the luck close.`;
  const foot = !drawn ? '<button class="btn yes big" id="nyShake">Shake the box</button>' : tied ? '<button class="btn big" id="nyDone">Close</button>' : '<button class="btn yes big" id="nyTie">Tie it on the rail</button>';
  const p = openModal('Fortune box', `<div class="ny-fbox"><div class="ny-boxart" aria-hidden="true">${nyBoxArt(k, false)}</div><p class="ny-intro">${intro}</p><div class="ny-slipwrap">${drawn ? nySlipHTML(NY_FORTUNES[fz]) : ''}</div></div>`, { cls: 'ny-fortunepop', foot });
  const sh = $('#nyShake', p), tie = $('#nyTie', p), dn = $('#nyDone', p);
  if (sh) sh.onclick = () => nyShake(p);
  if (tie) tie.onclick = () => nyTie();
  if (dn) dn.onclick = () => { SFX.click(); closeModal(); };
  return p;
}
function nyShake(p) {
  if (NY.shaking || nyDrawnToday() || !nyDays()) return;
  NY.shaking = true; SFX.click();
  const sh = $('#nyShake', p); if (sh) sh.setAttribute('aria-disabled', 'true');
  const art = $('.ny-boxart', p); if (art && !nyMotionOff()) art.classList.add('ny-shaking'); // motion off: no wobble, the slip opens at once
  try { SFX.boop(380); setTimeout(() => SFX.boop(470), 160); setTimeout(() => SFX.boop(420), 320); } catch (e) { /* audio off */ }
  setTimeout(() => nyReveal(p), nyMotionOff() ? 0 : NY_SHAKE_MS);
}
function nyReveal(p) {
  NY.shaking = false; if (!S) return;
  nyFields(); const f = S.ny.fortune; if (f.date === localISO()) return;
  f.date = localISO(); f.tied = null; markDirty();
  addStat('happy', 5); updateHUD(); trackAct('fortune', {}); NY.acts.push({ kind: 'fortune' }); if (NY.acts.length > 20) NY.acts.shift();
  try { SFX.pop(); } catch (e) { /* audio off */ }
  if (!p || modal.hidden || !$('#modal .panel.ny-fortunepop')) return; // the sheet was closed during the shake: the luck is drawn, the slip opens when the box is opened again
  const art = $('.ny-boxart', p); if (art) art.classList.remove('ny-shaking');
  const wrap = $('.ny-slipwrap', p), intro = $('.ny-intro', p), foot = $('.foot', p);
  if (wrap) wrap.innerHTML = nySlipHTML(NY_FORTUNES[nyFortuneIdx()]);
  if (intro) intro.textContent = `${NAME()}'s fortune for today. Tie it on the rail to keep the luck close.`;
  if (foot) { foot.innerHTML = '<button class="btn yes big" id="nyTie">Tie it on the rail</button>'; const t = $('#nyTie', foot); t.onclick = () => nyTie(); try { t.focus({ preventScroll: true }); } catch (e) { /* no focus */ } }
}
function nyTie() {
  if (!S) return; nyFields(); const f = S.ny.fortune;
  if (f.date !== localISO() || f.tied === localISO()) { closeModal(); return; }
  f.tied = localISO(); f.knots = Math.min(NY_MAX_KNOTS, (f.knots | 0) + 1); f.year = nyYear(); markDirty(); SFX.pop();
  closeModal(); if (nyHere()) fsSquareDraw();
  toast(`Tied on the rail. That is ${f.knots} fortune${f.knots === 1 ? '' : 's'} of luck for the year.`, 'good');
}

/* ---- the New Year cards ---- */
function nyCardMsgs() {
  const y = nyYear(), nm = NAME(), z = NY_ZODIAC[y], animal = z ? z.animal.toLowerCase() : 'pine';
  const msgs = [];
  msgs.push({ kind: z ? 'gift' : 'news', id: `ny_gerald_${y}`, from: 'Gerald the duck', title: 'A New Year card from Gerald', card: 'nengajo', animal, cardText: [`To ${nm}`, 'from Gerald'], duck: true,
    text: z ? `Happy New Year. It is the Year of the ${z.animal}. The Border Collie has been told. A woolly hood for ${nm}, so nobody gets herded by mistake.` : 'Happy New Year. I hope it is a year of long walks.',
    gift: z ? { item: z.item, cat: 'clothes', n: 1 } : undefined });
  msgs.push({ kind: 'gift', id: `ny_plum_${y}`, from: 'Mrs. Plum next door', title: 'Otoshidama from Mrs. Plum', card: 'nengajo', animal, cardText: ['For the youngest,', nm], envelope: true,
    text: `A New Year envelope, the way my grandmother did it. The youngest in the house gets one, and that is ${nm}.`, gift: { coins: 30 } });
  // up to three rehomed pups, the most recent first (a later move, or a later slot on the same day, is more recent)
  const pups = (S.rehomed || []).map((r, i) => [r, i]).filter(([r]) => r && r.id).sort((a, b) => String(b[0].since || '').localeCompare(String(a[0].since || '')) || b[1] - a[1]).slice(0, 3).map(([r]) => r);
  pups.forEach((r) => {
    const pr = prOf(r), fam = shortFam(mailFamName(r.family)), i = hashId(r.id + '|' + y) % NY_PUP_LINES.length;
    msgs.push({ kind: 'postcard', id: `ny_pup_${r.id}_${y}`, from: `${r.name} & ${fam}`, title: `Happy New Year from ${r.name}`, card: 'nengajo', animal, cardText: [`from ${r.name}`],
      text: NY_PUP_LINES[i](r.name, fam, pr), dog: jrPupDog(r), pose: 'happy', nyPup: r.id });
  });
  return msgs;
}
function nyCards(force) {
  if (!S || typeof mailPush !== 'function' || !nyDays()) return 0; nyFields();
  if (!force && (S.ny.cards === nyYear() || nyGuideHold())) return 0;
  S.ny.cards = nyYear(); markDirty(); let n = 0;
  nyCardMsgs().reverse().forEach((m) => { if (S.mail.some((x) => x.id === m.id)) return; if (!m.gift) delete m.gift; mailPush(m); n++; }); // pushed last-first: Gerald's card ends on top of the list
  NY.sent += n; return n;
}
const nyCardTick = () => { if (S && cur.mode === 'yard' && nyDays()) nyCards(); };

// the card picture of a New Year letter (07b_mailbox.js letterBody calls this when a letter has card: 'nengajo'): the nengajo behind a short card text, a pup's photo or Gerald
function nyCardHTML(m) {
  if (!m || m.card !== 'nengajo') return '';
  const o = { animal: m.animal === 'sheep' ? 'sheep' : 'pine' }, bg = artReal('prop', 'nengajo', o) || art('prop', 'nengajo', o);
  let inner = '';
  if (m.dog) { let ph = ''; try { ph = dogSVG(m.dog, { pose: m.pose || 'happy' }); } catch (e) { ph = art('dog', m.dog.key || 'mutt'); } inner += `<div class="pc-photo ny-photo">${ph}</div>`; }
  else if (m.duck && typeof gdDuck === 'function') inner += `<div class="ny-mini" aria-hidden="true">${gdDuck('sit')}</div>`;
  else if (m.envelope) inner += '<div class="ny-mini" aria-hidden="true"><svg viewBox="0 0 60 60"><rect x="10" y="6" width="40" height="48" rx="4" fill="#FFF3F0" stroke="#5B3D32" stroke-width="2.4"/><path d="M10 6 H50 V24 Q30 36 10 24Z" fill="#E0605C" stroke="#5B3D32" stroke-width="2.4" stroke-linejoin="round"/><circle cx="30" cy="26" r="6" fill="#E9B44C" stroke="#5B3D32" stroke-width="2"/></svg></div>';
  const lines = (m.cardText || []).map((l) => `<span>${esc(l)}</span>`).join('');
  return `<div class="pc pc-real ny-card" data-card="nengajo"><div class="pc-bg">${bg}</div>${inner}<div class="ny-cardtx">${lines}</div></div>`;
}

/* ---- the Journal line ---- */
function nyJournalLine() {
  if (!S || !nyDays()) return '';
  return `<p class="fs-jline ny-jline"><span class="ic" aria-hidden="true">${nyIcon()}</span><b>Fortune box:</b> Fortune box in the Square until 7 January.</p>`;
}

/* ---- bus ---- */
on('game:ready', () => { nyFields(); setTimeout(nyExpose, 0); nyLater(nyCardTick, 1500); });
on('yard:enter', () => { nyFields(); nyExpose(); nyLater(nyCardTick, 1500); });
on('env:fest', () => { if (cur.mode === 'yard') { nyLater(nyCardTick, 600); if (nyHere()) fsSquareDraw(); } });
on('day:new', () => { if (cur.mode === 'yard') nyLater(nyCardTick, 600); });

/* ---- tests: window.__paw.ny ---- */
function nyExpose() {
  if (!window.__paw) return;
  window.__paw.ny = {
    cards: (force) => nyCards(force), fortuneOpen: () => nyFortuneOpen(), draw: () => nySquareDraw(), journal: () => nyJournalLine(),
    get knots() { return S && S.ny && S.ny.fortune ? S.ny.fortune.knots : 0; }, zodiac: NY_ZODIAC,
    box: () => nyFortuneBox(), spot: NY_BOX_SPOT, fortunes: NY_FORTUNES.slice(), fortuneFor: (day) => NY_FORTUNES[nyFortuneIdx(day)], drawn: () => nyDrawnToday(),
    msgs: () => nyCardMsgs().map((m) => ({ id: m.id, title: m.title, from: m.from, text: m.text, gift: m.gift || null, kind: m.kind })), cardHTML: (m) => nyCardHTML(m),
    get pending() { return NY.pending; }, get acts() { return NY.acts.slice(); }, get sent() { return NY.sent; }
  };
}
setTimeout(nyExpose, 0);
