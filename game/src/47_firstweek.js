/* ======================= v2.16 "First Week": 47_firstweek.js (tag fw) =======================
   Contract: V216.md. Save field S.fw (v216Fields in 00_core.js). Test hook: window.__paw.fw.
   1. Puppy's first day: five guided steps for a new save (pet, feed, play ball, name tag, a short walk), drawn by Gerald's engine (25_guide.js)
      from FW_STEPS. Each step gives Bond, so Bond 2 lands at about minute 6. Skippable, resumes after a reload, never blocks anything.
   2. The "next unlock" line under the HUD Bond meter (#fwNext), built from TRICKS and the shop, walk and house tables.
   3. The Bond 2 party: the first time each dog reaches Bond 2 (fwParty, called from maybeLevelUp): confetti, a free small shop item, then Paw.
   4. The welcome week (new saves) and the monthly calendar (everyone): a paw stamp for every real day played, rewards claimed with a tap.
      Days never need to be in a row and a missed day never takes anything away. Calendar coins: at most 80 a month.
   5. "See you tomorrow": after 10 minutes of play, or when the page is hidden, the dog names a wish for tomorrow; the next day's first open shows it.
   6. The lighter phone dock: a save started on v2.16 shows Feed, Play, Care, Walk and Map at Bond 1; Wardrobe and Journal join at Bond 2 with a "new!" tag.
   Under the test harness all of it needs prefs.fwTest (the older suites never see it). The Bond thresholds (BOND_TH) are for everyone. */
function fwOn() { return !navigator.webdriver || !!prefs.fwTest; }
const FW = { play: 0, enterAt: 0, nextKey: '', confT: 0 };
const FW_STEP_PTS = 4; // raw Bond per first-day step (pet 9 + feed 6 + ball 24 + walk 24 + 5 x 4 = Bond 2 on the walk home)

/* ---------------- 1. Puppy's first day ---------------- */
const FW_STEPS = [
  { k: 'pet', pose: 'wave', ring: ['#dogHit'], on: ['pet'] },
  { k: 'feed', pose: 'point', ring: ['#bar [data-act=feed]'], tray: ['#dock [data-food="Basic Kibble"]', '#dock [data-food]:not([aria-disabled])'], on: ['feed'] },
  { k: 'ball', pose: 'point', ring: ['#bar [data-act=play]'], tray: ['#dock [data-play="ball:Tennis Ball"]', '#dock [data-play^="ball:"]'], on: ['fetch'] },
  { k: 'tag', pose: 'cheer', ring: ['#gdLayer .gd-next'], on: ['nametag'], btn: () => tt('fw.tag_btn', 'Make the tag'), act: () => fwTagOpen() },
  { k: 'walk', pose: 'point', ring: ['#bar [data-act=walk]'], on: ['walk'] }
];
function fwStepText(i) {
  const dog = NAME();
  switch ((FW_STEPS[i] || {}).k) {
    case 'pet': return tt('fw.step_pet', 'Hello, I am Gerald. {dog} is new here and a little shy. Rub {dog} with your finger or the mouse to say hello.', { dog });
    case 'feed': return tt('fw.step_feed', 'Lovely. Now tap Feed, then a food. {dog} is always a little bit hungry.', { dog });
    case 'ball': return tt('fw.step_ball', 'Play time! Tap Play, then the Tennis Ball. Drag the ball and let go to throw it.', { dog });
    case 'tag': return tt('fw.step_tag', 'Every good dog needs a name tag. Let us make one for {dog}.', { dog });
    case 'walk': return tt('fw.step_walk', 'Last one: a short walk. Tap Walk and try the Sunny Park. Walks earn the most coins.', { dog });
    default: return '';
  }
}
function fwStepDone(i) {
  if (!S || !S.guide || S.guide.step !== i) return;
  const last = i >= FW_STEPS.length - 1;
  let b = addBond(FW_STEP_PTS, { raw: true });
  if (last && S.bond.level < 2) b += addBond(Math.max(1, BOND_TH[1] - S.bond.pts), { raw: true }); // the first day always ends at Bond 2
  setTimeout(() => toast(tt('fw.step_done', 'First day: step {i} of {n} done. +{b} Bond.', { i: i + 1, n: FW_STEPS.length, b }), 'good'), 700);
  if (last) { S.guide.done = localISO(); markDirty(); gdBye(); } else gdGo(i + 1, true);
}
// the first day is over (done or skipped): the calendar opens once the yard is calm (fwMorningTry)
function fwGuideEnd(skipped) {
  if (!S || !S.fw) return; markDirty();
  if (!skipped) setTimeout(() => toast(tt('fw.first_day_done', "That was {name}'s first day! There is a gift in your calendar.", { name: NAME() }), 'gold'), 1600);
  FW.enterAt = Date.now();
}

/* ---------------- the name tag (first-day step 4) ---------------- */
const FW_TAGS = [['sun', '#F2C744'], ['rose', '#F28FA5'], ['mint', '#8FD0A0'], ['sky', '#8EC0EA'], ['lilac', '#C3B1E6']];
const fwTagCol = (k) => (FW_TAGS.find((t) => t[0] === k) || FW_TAGS[0])[1];
function fwTagSVG(name, col) {
  const two = (d, fill, w = 2.6) => `<path d="${d}" fill="${fill}" stroke="none" transform="translate(4 3)"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="1.1" opacity=".45" transform="translate(-1.4 1)"/>`;
  const tag = 'M40 22 Q60 10 92 14 L208 16 Q236 18 240 52 Q242 88 210 92 L92 94 Q58 96 40 82 Q22 70 24 52 Q24 32 40 22Z';
  return `<svg viewBox="0 0 260 112" class="fw-tagsvg" aria-hidden="true"><path d="M8 54 Q2 30 18 26" fill="none" stroke="#B8B0A6" stroke-width="3" stroke-linecap="round"/>${two(tag, col)}<circle cx="46" cy="54" r="8" fill="#FFFBF3" stroke="${INKG}" stroke-width="2.2"/><path d="M66 30 Q120 26 196 30 M66 80 Q130 84 200 78" stroke="#FFFBF3" stroke-width="2" opacity=".6" fill="none" stroke-linecap="round"/><text x="142" y="66" text-anchor="middle" font-family="Caveat,'Patrick Hand',cursive" font-weight="700" font-size="${String(name).length > 9 ? 30 : 38}" fill="${INKG}">${esc(name)}</text></svg>`;
}
function fwTagOpen() {
  if (!S) return; const d = D(); let col = d.fwTag || 'sun';
  const sw = FW_TAGS.map(([k, c]) => `<button type="button" class="fw-tagcol" data-tagcol="${k}" aria-pressed="${k === col}" aria-label="${esc(fwTagName(k))}" style="--c:${c}"></button>`).join('');
  const p = openModal(esc(tt('fw.tag_title', 'Name tag')), `<div class="fw-tagsheet"><div class="fw-tagart">${fwTagSVG(d.name, fwTagCol(col))}</div>
    <div class="fw-tagform"><label for="fwTagName" class="small">${esc(tt('adopt.name_12_letters_max', 'Name (12 letters max)'))}</label><input id="fwTagName" class="namebox" maxlength="12" value="${esc(d.name)}" autocomplete="off">
    <span class="small">${esc(tt('fw.tag_colour', 'Tag colour'))}</span><div class="fw-tagcols" role="group" aria-label="${esc(tt('fw.tag_colour', 'Tag colour'))}">${sw}</div></div></div>`,
  { cls: 'fw-tagpop', foot: `<button class="btn yes big" id="fwTagOk">${esc(tt('fw.tag_ok', 'Hang it on'))}</button>` });
  const inp = $('#fwTagName', p), draw = () => { $('.fw-tagart', p).innerHTML = fwTagSVG(inp.value.trim() || d.name, fwTagCol(col)); };
  inp.oninput = draw;
  p.querySelectorAll('[data-tagcol]').forEach((b) => { b.onclick = () => { SFX.click(); col = b.dataset.tagcol; p.querySelectorAll('[data-tagcol]').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(); }; });
  $('#fwTagOk', p).onclick = () => {
    const v = inp.value.replace(/\s+/g, ' ').trim().slice(0, 12); if (v) d.name = v; d.fwTag = col; markDirty(); SFX.boop(720);
    hudDogKey = ''; setHudDog(); closeModal();
    toast(tt('fw.tag_on', '{name} wears the new name tag. Very official.', { name: d.name }), 'good'); trackAct('nametag', { id: d.id });
  };
}
function fwTagName(k) {
  switch (k) {
    case 'rose': return tt('photo.frame_rose', 'Rose');
    case 'mint': return tt('photo.frame_mint', 'Mint');
    case 'sky': return tt('photo.frame_sky', 'Sky');
    case 'lilac': return tt('photo.frame_lilac', 'Lilac');
    default: return tt('photo.frame_sun', 'Sunny');
  }
}
// the HUD portrait wears the tag (setHudDog calls this after it draws the head)
function fwHudTag() {
  const h = $('#hudHead'); if (!h || !S) return; const old = h.querySelector('.fw-htag'); if (old) old.remove();
  const k = S.dog.fwTag; if (!k) return;
  h.insertAdjacentHTML('beforeend', `<i class="fw-htag" style="--c:${fwTagCol(k)}" aria-hidden="true"></i>`);
}

/* ---------------- 2. the next unlock line under the Bond meter ---------------- */
function fwNextParts(n) {
  const out = [], tr = TRICKS.find((t) => t.bond === n);
  if (tr) out.push(tr.n === 'Signature' ? tt('fw.next_sig', 'a signature trick') : tt('fw.next_trick', 'learns {trick}', { trick: tTrick(tr.n) }));
  const cl = CLOTHES.filter((c) => c.bond === n && !c.ed && !c.fest && !c.reward && !c.tokyo).length;
  if (cl) out.push(tt('fw.next_outfits', '{n, plural, one {a new outfit} other {# new outfits}}', { n: cl }));
  if (Object.keys(ROUTES).some((k) => ROUTES[k].bond === n)) out.push(tt('fw.next_walk', 'a new walk'));
  if (n === 2) out.push(tt('fw.next_garden', 'the veggie patch'));
  if (HOUSES.some((h) => h.bond === n && !h.reward)) out.push(tt('fw.next_house', 'a new house'));
  if (TOYS.some((t) => t.bond === n && !t.ed && !t.fest && !t.tokyo)) out.push(tt('fw.next_toy', 'a new toy'));
  if (n === 10) out.push(tt('fw.next_badge', 'the Best Friends badge'));
  return out;
}
function fwNextText(L, short) { if (L >= 10) return ''; const n = L + 1, p = fwNextParts(n).slice(0, short ? 1 : 2); return tt('fw.next_line', 'Bond {n}: {what}', { n, what: p.join(' + ') || tt('fw.next_love', 'even more love') }); }
function fwNextSync() {
  const b = $('#hud .bond'); if (!b) return; let el = $('#fwNext');
  const txt = S && fwOn() && S.bond.level < 10 ? fwNextText(S.bond.level) : '';
  if (!txt) { if (el) el.hidden = true; FW.nextKey = ''; return; }
  if (!el) { el = document.createElement('span'); el.id = 'fwNext'; el.className = 'fw-next'; b.appendChild(el); }
  if (FW.nextKey !== txt) { FW.nextKey = txt; const sh = fwNextText(S.bond.level, true); el.innerHTML = `<span class="fw-nl">${esc(tt('fw.next', 'Next'))}</span> <span class="fw-nlong">${esc(txt)}</span><span class="fw-nshort">${esc(sh)}</span>`; el.title = txt; el.setAttribute('data-tip', txt); } // phones show the short line (one unlock)
  el.hidden = false;
}

/* ---------------- 3. the Bond 2 party ---------------- */
const FW_GIFTS = [['clothes', 'Bow Tie'], ['clothes', 'Red Bandana'], ['clothes', 'Sailor Collar'], ['toys', 'Squeaky Duck'], ['toys', 'Plush Bone']];
function fwParty(id) {
  if (!S || !fwOn() || !S.fw) return null; const d = (id && dogById(id)) || null; if (!d || S.fw.b2[d.id]) return null;
  S.fw.b2[d.id] = 1;
  const g = FW_GIFTS.find(([cat, n]) => !owns(cat, n)), gift = g ? g[1] : 'Bone-shaped Biscuit';
  if (g) S.inv[g[0]].push(gift); else S.inv.food[gift] = (S.inv.food[gift] || 0) + 3;
  markDirty();
  const html = `<li class="fw-gift"><span class="fw-gart">${art('item', gift)}</span><span>${esc(g ? tt('fw.party_gift', 'A party gift: {item}! It is in your bag.', { item: tItem(gift) }) : tt('fw.party_gift_food', 'A party gift: {item} x3! They are in your bag.', { item: tItem(gift) }))}</span></li>`;
  return {
    html,
    open: (panel) => { fwConfetti(); if (panel) panel.insertAdjacentHTML('afterbegin', `<p class="fw-partyhead">${esc(tt('fw.party_title', 'Bond 2 party for {name}!', { name: d.name }))}</p>`); },
    after: () => { FW.enterAt = Date.now() + 1200; setTimeout(() => fwPaw(d), 350); } // the morning page waits for the Paw
  };
}
// crayon confetti over the whole stage for about 2.5 s (still bits with Motion off)
function fwConfetti() {
  const old = $('#fwConfetti'); if (old) old.remove(); clearTimeout(FW.confT);
  const L = document.createElement('div'); L.id = 'fwConfetti'; L.setAttribute('aria-hidden', 'true');
  const cols = ['#F28FA5', '#F2C744', '#8FD0A0', '#8EC0EA', '#C3B1E6', '#F4A262'], rnd = seeded(Date.now() % 9973);
  let h = ''; for (let i = 0; i < 42; i++) { const shape = i % 3 === 0 ? 'M-6 -3 Q0 -6 6 -3 L5 3 Q0 6 -5 3Z' : i % 3 === 1 ? 'M-7 2 Q-2 -6 7 -2' : 'M0 -6 L2 -1 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -1Z'; const c = cols[i % cols.length], line = i % 3 === 1;
    h += `<svg class="fw-cf" viewBox="-9 -9 18 18" style="left:${(rnd() * 100).toFixed(1)}%;--dl:${(rnd() * 0.9).toFixed(2)}s;--dx:${(rnd() * 80 - 40).toFixed(0)}px;--r:${(rnd() * 720 - 360).toFixed(0)}deg;--y0:${(rnd() * 30).toFixed(0)}%"><path d="${shape}" fill="${line ? 'none' : c}" stroke="${line ? c : INKG}" stroke-width="${line ? 3.4 : 1.4}" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
  L.innerHTML = h; stage.appendChild(L); FW.confT = setTimeout(() => L.remove(), 3200);
}
function fwPaw(d) {
  if (!S || cur.mode !== 'yard' || !d || S.dog !== d || busy || S.sleeping || !modal.hidden) return;
  try { playPose(trickPose('Paw')); const h = dogHeadWorld(); say(tt('fw.paw_say', '*offers a paw* Party!'), h.x, h.y, 2600); setTimeout(() => { if (cur.mode === 'yard' && !busy) endPose(); }, 1900); } catch (e) { /* the yard changed */ }
}

/* ---------------- 6. the lighter phone dock ---------------- */
const FW_DOCK = { wardrobe: 2, journal: 2 }; // Bond that shows the button on a v2.16 save's phone dock (Feed, Play, Care, Walk, Map from the start)
const fwLite = () => !!(S && S.fw && S.fw.fresh && fwOn() && isPhone());
function fwDockApply() {
  const lite = fwLite(); let n = 0;
  bar.querySelectorAll('.act').forEach((b) => {
    const a = b.dataset.act, hide = lite && S.fw.dock < (FW_DOCK[a] || 1); b.hidden = hide; if (!hide) n++;
    const isNew = lite && !hide && !!S.fw.dockNew[a]; b.classList.toggle('fw-new', isNew);
    let t = b.querySelector('.fw-newtag'); if (isNew && !t) b.insertAdjacentHTML('beforeend', `<span class="fw-newtag" aria-hidden="true">${esc(tt('fw.new_tag', 'new!'))}</span>`); else if (!isNew && t) t.remove();
  });
  bar.classList.toggle('fw-lite', lite && n < bar.querySelectorAll('.act').length); bar.style.setProperty('--acts', n || 7);
}
function fwDockSync() {
  if (!S || !S.fw || !S.fw.fresh) return; const top = Math.max(...S.dogs.map((d) => (d.bond && d.bond.level) || 1));
  if (top <= S.fw.dock) return;
  Object.keys(FW_DOCK).forEach((a) => { if (S.fw.dock < FW_DOCK[a] && top >= FW_DOCK[a]) S.fw.dockNew[a] = 1; });
  S.fw.dock = top; markDirty(); fwDockApply();
}
bar.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.act'); if (!b || !S || !S.fw || !S.fw.dockNew[b.dataset.act]) return; delete S.fw.dockNew[b.dataset.act]; markDirty(); fwDockApply(); }, true);
on('phone:layout', () => fwDockApply());

/* ---------------- 4. the calendars ---------------- */
const FW_BAG = [['Bone-shaped Biscuit', 3], ['Carrot Sticks', 2], ['Blueberry Bites', 2]]; // the treat bag: dog-safe snacks only
const FW_WEL_DAYS = [1, 3, 5, 7], FW_CAL_DAYS = [3, 7, 12, 18, 24], FW_CAL_COIN_CAP = 80;
const FW_WEL_TOYS = ['Squeaky Duck', 'Rope Tug', 'Plush Bone', 'Snuffle Mat'];
const FW_WEL_WEAR = ['Flower Crown', 'Rain Hat', 'Chef Hat', 'Sailor Collar', 'Red Bandana'];
const FW_SEASON_TOYS = { spring: ['Bubble Machine', 'Squeaky Duck', 'Snuffle Mat'], summer: ['Frisbee', 'Paddling Pool', 'Bubble Machine'], autumn: ['Snuffle Mat', 'Rope Tug', 'Treat Cone'], winter: ['Plush Bone', 'Treat Cone', 'Rope Tug'] };
// the month's outfit (all existing items, one a month, collectable) and the page theme: colour, doodle, postcard base colour
const FW_MONTHS = [null,
  { wear: 'Pom-pom Beanie', c: '#CBE0F4', d: 'snow', pc: 'sky' }, { wear: 'Knit Scarf', c: '#F9D0D9', d: 'heart', pc: 'rose' }, { wear: 'Flower Crown', c: '#DDEFD3', d: 'flower', pc: 'mint' },
  { wear: 'Polka-dot Raincoat', c: '#D3E4F4', d: 'rain', pc: 'sky' }, { wear: 'Bumblebee Suit', c: '#FFF0C2', d: 'flower', pc: 'sun' }, { wear: 'Frog Raincoat', c: '#E3DAF2', d: 'rain', pc: 'lilac' },
  { wear: 'Sailor Collar', c: '#FFE3A1', d: 'sun', pc: 'sun' }, { wear: 'Heart Sunglasses', c: '#D4ECEE', d: 'sun', pc: 'sky' }, { wear: 'Leaf Beret', c: '#FCD8BC', d: 'leaf', pc: 'rose' },
  { wear: 'Autumn Scarf', c: '#F9C99E', d: 'leaf', pc: 'sun' }, { wear: 'Cozy Hoodie', c: '#EBDCCB', d: 'leaf', pc: 'lilac' }, { wear: 'Snowflake Snood', c: '#D6E8D2', d: 'snow', pc: 'mint' }];
function fwTheme(m) {
  switch (m) {
    case 1: return tt('fw.theme_1', 'Snow and mittens');
    case 2: return tt('fw.theme_2', 'Hearts and warm socks');
    case 3: return tt('fw.theme_3', 'The first flowers');
    case 4: return tt('fw.theme_4', 'Puddles and rain boots');
    case 5: return tt('fw.theme_5', 'Bees and blossoms');
    case 6: return tt('fw.theme_6', 'Rainy-day rainbows');
    case 7: return tt('fw.theme_7', 'Sunshine and splashes');
    case 8: return tt('fw.theme_8', 'Ice lollies and sea shells');
    case 9: return tt('fw.theme_9', 'Apples and acorns');
    case 10: return tt('fw.theme_10', 'Crunchy leaves');
    case 11: return tt('fw.theme_11', 'Cozy blankets');
    default: return tt('fw.theme_12', 'Twinkly lights');
  }
}
const fwYM = (iso = localISO()) => iso.slice(0, 7);
const fwMonthOf = (ym) => +ym.slice(5, 7) || 1;
function fwMonthName(ym) { const y = +ym.slice(0, 4), m = fwMonthOf(ym); return tdate(new Date(y, m - 1, 15), { month: 'long', year: 'numeric' }); }
const fwDaysIn = (ym) => new Date(+ym.slice(0, 4), fwMonthOf(ym), 0).getDate();
function fwPick(cat, list) { const n = list.find((x) => !owns(cat, x)); return n || null; }
// what a page gives on a milestone day (resolved when shown and again when claimed: an item bought in between moves the pick on)
function fwReward(page, n, ym) {
  if (page === 'wel') {
    if (n === 1) return { t: 'food', n: 'Chicken & Rice Bowl', q: 2 };
    if (n === 3) { const x = fwPick('toys', FW_WEL_TOYS); return x ? { t: 'toy', n: x } : { t: 'bag' }; }
    if (n === 5) { const x = fwPick('clothes', FW_WEL_WEAR); return x ? { t: 'cloth', n: x } : { t: 'bag' }; }
    return { t: 'frame', f: 'name' };
  }
  const M = FW_MONTHS[fwMonthOf(ym)];
  if (n === 3) return { t: 'coins', c: 30 };
  if (n === 7) { const x = fwPick('toys', FW_SEASON_TOYS[seasonOf(fwMonthOf(ym))] || []); return x ? { t: 'toy', n: x } : { t: 'bag' }; }
  if (n === 12) return { t: 'coins', c: 50, bag: true };
  if (n === 18) return { t: 'frame', f: ym };
  return owns('clothes', M.wear) ? { t: 'bag' } : { t: 'cloth', n: M.wear };
}
function fwRewLabel(r) {
  if (r.t === 'food') return tt('fw.rew_food', '{item} x{q}', { item: tItem(r.n), q: r.q });
  if (r.t === 'toy' || r.t === 'cloth') return tItem(r.n);
  if (r.t === 'bag') return tt('fw.rew_bag', 'A treat bag');
  if (r.t === 'coins') return r.bag ? tt('fw.rew_coins_bag', '{n, plural, one {# coin} other {# coins}} and a treat bag', { n: r.c }) : tt('fw.rew_coins', '{n, plural, one {# coin} other {# coins}}', { n: r.c });
  return r.f === 'name' ? tt('fw.rew_frame_name', 'A photo frame with {name} on it', { name: (S.fw.frames.name || NAME()) }) : tt('fw.rew_frame_month', 'A {month} photo frame', { month: fwMonthName(r.f) });
}
function fwRewArt(r) {
  if (r.t === 'food' || r.t === 'toy' || r.t === 'cloth') return art('item', r.n);
  if (r.t === 'coins') return r.bag ? `<span class="fw-two">${ICON('coin')}${fwBagSVG()}</span>` : ICON('coin');
  if (r.t === 'bag') return fwBagSVG();
  return fwFrameSVG(r.f === 'name' ? '#F2C744' : FW_MONTHS[fwMonthOf(r.f)].c);
}
// give a reward; returns the toast text. Calendar coins stop at 80 a month (S.fw.cal.coins)
function fwGive(r, cal) {
  if (r.t === 'food') S.inv.food[r.n] = (S.inv.food[r.n] || 0) + r.q;
  if (r.t === 'toy' && !owns('toys', r.n)) S.inv.toys.push(r.n);
  if (r.t === 'cloth' && !owns('clothes', r.n)) S.inv.clothes.push(r.n);
  if (r.t === 'bag' || r.bag) FW_BAG.forEach(([n, q]) => { S.inv.food[n] = (S.inv.food[n] || 0) + q; });
  let coins = 0; if (r.t === 'coins' && cal) { coins = Math.max(0, Math.min(r.c, FW_CAL_COIN_CAP - cal.coins)); if (coins) { cal.coins += coins; addCoins(coins, { raw: true }); } }
  if (r.t === 'frame') { if (r.f === 'name') S.fw.frames.name = S.fw.frames.name || NAME(); else if (!S.fw.frames.months.includes(r.f)) S.fw.frames.months.push(r.f); }
  markDirty(); updateHUD();
  return r.t === 'coins' ? (r.bag ? tt('fw.got_coins_bag', 'Calendar gift: +{n} coins and a treat bag.', { n: coins }) : tt('fw.got_coins', 'Calendar gift: +{n} coins.', { n: coins })) : r.t === 'frame' ? tt('fw.got_frame', 'Calendar gift: {what}. Find it in photo mode.', { what: fwRewLabel(r) }) : tt('fw.got_item', 'Calendar gift: {what}. It is in your bag.', { what: fwRewLabel(r) });
}
function fwClaim(page, n) {
  if (!S || !S.fw) return false;
  if (page === 'wel') { const w = S.fw.wel; if (!w || w.days.length < n || w.got.includes(n) || !FW_WEL_DAYS.includes(n)) return false; w.got.push(n); if (n === 7) S.fw.frames.name = NAME(); toast(fwGive(fwReward('wel', n)), 'gold'); }
  else { const c = S.fw.cal; if (c.days.length < n || c.got.includes(n) || !FW_CAL_DAYS.includes(n)) return false; c.got.push(n); toast(fwGive(fwReward('cal', n, c.ym), c), 'gold'); }
  SFX.kaching(); markDirty(); saveNow(); return true;
}
// a stamp for today (any real day played). A new month starts a new page; last month's unclaimed gifts go to the bag, never lost
function fwStamp() {
  if (!S || !S.fw) return false; const today = localISO(), ym = fwYM(today), d = +today.slice(8, 10), f = S.fw; let fresh = false;
  if (f.cal.ym !== ym) {
    const old = f.cal, owed = old.ym ? FW_CAL_DAYS.filter((n) => old.days.length >= n && !old.got.includes(n)) : [];
    owed.forEach((n) => { old.got.push(n); fwGive(fwReward('cal', n, old.ym), old); });
    if (owed.length) setTimeout(() => toast(tt('fw.last_month', "Last month's calendar gifts are in your bag."), 'gold'), 2400);
    f.cal = { ym, days: [], got: [], coins: 0 };
  }
  if (!f.cal.days.includes(d)) { f.cal.days.push(d); fresh = true; }
  if (f.wel && f.wel.days.length < 7 && !f.wel.days.includes(today)) { f.wel.days.push(today); fresh = true; }
  if (fresh) { f.morning = today; markDirty(); }
  return fresh;
}
const fwWelOpen = () => !!(S && S.fw && S.fw.wel && S.fw.wel.got.length < FW_WEL_DAYS.length);
const fwClaimable = () => !!(S && S.fw && ((S.fw.wel && FW_WEL_DAYS.some((n) => S.fw.wel.days.length >= n && !S.fw.wel.got.includes(n))) || FW_CAL_DAYS.some((n) => S.fw.cal.days.length >= n && !S.fw.cal.got.includes(n))));

/* small crayon icons (the doodle() hand: a flat fill drifting off a two-stroke pencil outline) */
function fwTwo(d, fill, w = 2) { return `<path d="${d}" fill="${fill}" stroke="none" transform="translate(1.5 1.2)"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width=".8" opacity=".45" transform="translate(-.8 .6)"/>`; }
function fwPawSVG(col) { return `<svg viewBox="-16 -16 32 32" class="fw-paw" aria-hidden="true">${fwTwo('M0 13 Q-9 13 -9 6 Q-9 0 0 -1 Q9 0 9 6 Q9 13 0 13Z', col)}${['M-11 -3 a4 5 0 1 0 0.1 0Z', 'M-4 -9 a4 5 0 1 0 0.1 0Z', 'M4 -9 a4 5 0 1 0 0.1 0Z', 'M11 -3 a4 5 0 1 0 0.1 0Z'].map((d) => fwTwo(d, col, 1.6)).join('')}</svg>`; }
function fwBagSVG() { return `<svg viewBox="0 0 64 64" class="fw-ic" aria-hidden="true">${fwTwo('M14 24 Q12 52 20 56 Q32 60 44 56 Q52 52 50 24 Q32 20 14 24Z', '#F4D3A8', 2.4)}${fwTwo('M18 24 Q22 14 32 18 Q40 12 46 24', 'none', 2.2)}<path d="M20 26 Q32 31 46 26" stroke="#F28FA5" stroke-width="3" fill="none" stroke-linecap="round"/>${fwTwo('M24 38 l4 -3 l4 3 l4 -3 l4 3', 'none', 1.8)}<g transform="translate(32 47) scale(.55)">${fwTwo('M-14 -4 Q-20 -10 -14 -12 Q-11 -14 -10 -8 L10 -8 Q11 -14 14 -12 Q20 -10 14 -4 Q20 2 14 4 Q11 6 10 0 L-10 0 Q-11 6 -14 4 Q-20 2 -14 -4Z', '#FFF4DF', 2.4)}</g></svg>`; }
function fwFrameSVG(col) { return `<svg viewBox="0 0 64 64" class="fw-ic" aria-hidden="true">${fwTwo('M10 12 L54 10 L56 52 L8 54Z', col, 2.4)}${fwTwo('M17 19 L47 18 L48 44 L16 45Z', '#CBE0F4', 1.8)}<path d="M18 40 Q26 30 32 38 Q38 30 46 40" stroke="#8FD0A0" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="25" r="3.2" fill="#FFE3A1" stroke="${INKG}" stroke-width="1.2"/></svg>`; }
function fwDoodle(kind, x, y, s = 1, rot = 0) {
  const t = `transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"`;
  if (kind === 'leaf') return `<g ${t}>${fwTwo('M0 12 Q-12 2 -8 -8 Q0 -14 8 -8 Q12 2 0 12Z', '#F4A262')}<path d="M0 12 L0 -8" stroke="${INKG}" stroke-width="1.4"/></g>`;
  if (kind === 'snow') return `<g ${t}><path d="M0 -11v22M-9.5 -5.5l19 11M9.5 -5.5l-19 11" stroke="#3F76C0" stroke-width="2.4" stroke-linecap="round"/><path d="M-3 -9l3 3l3 -3M-3 9l3 -3l3 3" stroke="#3F76C0" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
  if (kind === 'sun') return `<g ${t}><circle r="7" fill="#FFE3A1" stroke="${INKG}" stroke-width="2"/><path d="M0 -13v3M0 10v3M-13 0h3M10 0h3M-9 -9l2 2M7 7l2 2M9 -9l-2 2M-7 7l-2 2" stroke="${INKG}" stroke-width="1.8" stroke-linecap="round"/></g>`;
  if (kind === 'rain') return `<g ${t}>${fwTwo('M0 -11 Q8 0 7 5 Q5 11 0 11 Q-5 11 -7 5 Q-8 0 0 -11Z', '#8EC0EA')}</g>`;
  return doodle(kind, x, y, s, rot);
}

// one page each: the welcome week (new saves) and this month. `morning`: the page that opened by itself on the first visit of the day
function fwCalHTML(morning) {
  if (!S || !S.fw) return ''; fwStamp(); const f = S.fw, today = localISO(), ym = f.cal.ym || fwYM(today), M = FW_MONTHS[fwMonthOf(ym)];
  const row = (page, n, have, got, ymx) => {
    const r = fwReward(page, n, ymx), can = have >= n && !got.includes(n), done = got.includes(n);
    const what = page === 'wel' ? tt('fw.day_n', 'Day {n}', { n }) : tt('fw.days_n', '{n, plural, one {# day} other {# days}}', { n });
    return `<li class="fw-rew${can ? ' can' : ''}${done ? ' got' : ''}" data-rew="${page}:${n}"><span class="fw-when">${esc(what)}</span><span class="fw-rart">${fwRewArt(r)}</span><span class="fw-rname">${esc(fwRewLabel(r))}</span>${can ? `<button class="btn yes fw-claim" type="button" data-fwclaim="${page}:${n}">${esc(tt('fw.claim', 'Claim'))}</button>` : done ? `<span class="fw-got">${esc(tt('fw.got', 'Got it'))}</span>` : `<span class="fw-wait small">${esc(tt('fw.to_go', '{n, plural, one {# more day} other {# more days}}', { n: n - have }))}</span>`}</li>`;
  };
  let wel = '';
  if (fwWelOpen() || (f.wel && morning)) {
    const w = f.wel, cells = Array.from({ length: 7 }, (_, i) => { const on = i < w.days.length, isT = on && w.days[i] === today; return `<li class="fw-wd${on ? ' on' : ''}${isT ? ' today' : ''}"><span class="fw-pc">${on ? fwPawSVG(isT ? '#F28FA5' : '#E0D5F0') : `<b>${i + 1}</b>`}</span>${FW_WEL_DAYS.includes(i + 1) ? '<i class="fw-dot" aria-hidden="true"></i>' : ''}</li>`; }).join('');
    wel = `<section class="fw-page fw-welp" aria-label="${esc(tt('fw.wel_title', 'Welcome week'))}"><h3>${esc(tt('fw.wel_title', 'Welcome week'))}</h3><p class="small">${esc(tt('fw.wel_sub', 'Play on any 7 days for a welcome gift on days 1, 3, 5 and 7. They do not need to be in a row.'))}</p>
      <ol class="fw-wdays" aria-label="${esc(tt('fw.wel_count', '{n} of 7 days', { n: w.days.length }))}">${cells}</ol><ul class="fw-rews">${FW_WEL_DAYS.map((n) => row('wel', n, w.days.length, w.got)).join('')}</ul></section>`;
  }
  const dn = fwDaysIn(ym), tdy = fwYM(today) === ym ? +today.slice(8, 10) : 0, have = f.cal.days.length;
  const grid = Array.from({ length: dn }, (_, i) => { const d = i + 1, on = f.cal.days.includes(d); return `<li class="fw-md${on ? ' on' : ''}${d === tdy ? ' today' : ''}">${on ? fwPawSVG(d === tdy ? '#F28FA5' : '#C8E9CF') : `<b>${d}</b>`}</li>`; }).join('');
  const border = `<svg class="fw-border" viewBox="0 0 300 40" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${[24, 84, 150, 216, 276].map((x, i) => fwDoodle(i === 2 ? 'paw' : M.d, x, 20, i === 2 ? 0.8 : 1, i % 2 ? 12 : -10)).join('')}</svg>`;
  const mon = `<section class="fw-page fw-monp" style="--fwc:${M.c}" aria-label="${esc(fwMonthName(ym))}">${border}<h3>${esc(fwMonthName(ym))}</h3><p class="fw-theme">${esc(fwTheme(fwMonthOf(ym)))}</p>
    <ol class="fw-mgrid" aria-label="${esc(tt('fw.mon_count', '{n, plural, one {# day played this month} other {# days played this month}}', { n: have }))}">${grid}</ol>
    <ul class="fw-rews">${FW_CAL_DAYS.map((n) => row('cal', n, have, f.cal.got, ym)).join('')}</ul>
    <p class="small fw-cap">${esc(tt('fw.mon_sub', 'Any day you play stamps a paw. Coins from the calendar this month: {c} of {max}.', { c: f.cal.coins, max: FW_CAL_COIN_CAP }))}</p></section>`;
  let note = '';
  const wi = f.wish;
  if (wi && !wi.done && wi.for <= today) {
    const dog = dogById(wi.id) || D();
    note = `<div class="fw-wish"><span class="fw-whead">${headSVG(dog)}</span><div class="fw-wsay"><p><b>${esc(tt('fw.wish_remember', '{name} remembered yesterday:', { name: dog.name }))}</b> ${esc(fwWishLine(wi.k, true))}</p><p class="small">${esc(tt('fw.wish_hint', 'Make it come true today for a happy bonus.'))}</p></div></div>`;
  }
  const hello = morning ? `<p class="fw-hello">${esc(tt('fw.morning', 'A new paw for today! Thanks for coming back.'))}</p>` : '';
  return `<div class="fw-cal">${hello}${note}<div class="fw-pages">${wel}${mon}</div></div>`;
}
function fwCalBind(root, redraw) {
  root.querySelectorAll('[data-fwclaim]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); const [pg, n] = b.dataset.fwclaim.split(':'); if (fwClaim(pg, +n)) redraw(); }; });
}
function fwCalOpen(morning) {
  if (!S || !fwOn()) return;
  const draw = () => { const p = openModal(esc(tt('fw.cal_title', 'Calendar')), fwCalHTML(morning), { cls: 'fw-calpop', foot: `<button class="btn yes big" id="fwCalOk">${esc(tt('fw.cal_ok', 'See you tomorrow'))}</button>` }); fwCalBind(p, () => { const st = p.querySelector('.panel-body') ? p.querySelector('.panel-body').scrollTop : 0; draw(); const b = $('#modal .panel .panel-body'); if (b) b.scrollTop = st; }); $('#fwCalOk', p).onclick = () => { SFX.click(); closeModal(); }; };
  if (S.fw.wish && !S.fw.wish.done && S.fw.wish.for <= localISO()) { S.fw.wish.shown = true; markDirty(); }
  draw();
}
function fwMenuBtn() { return fwOn() && S ? `<button class="btn big" id="mmCal"><span class="ic">${fwCalIcon()}</span>${esc(tt('fw.cal_title', 'Calendar'))}${fwClaimable() ? ' <span class="fw-newtag inl">' + esc(tt('fw.new_tag', 'new!')) + '</span>' : ''}</button>` : ''; }
function fwCalIcon() { return `<svg viewBox="0 0 64 64" class="fw-ic" aria-hidden="true">${fwTwo('M10 14 L54 12 L55 54 L9 55Z', '#FFFBF3', 2.4)}${fwTwo('M10 14 L54 12 L54 24 L10 25Z', '#F28FA5', 2.2)}<path d="M20 8 v10 M44 7 v10" stroke="${INKG}" stroke-width="3" stroke-linecap="round"/><g transform="translate(32 40) scale(.7)">${doodle('paw', 0, 0, 1)}</g></svg>`; }
// the morning page: once a day, on the first calm moment in the yard (never during the first-day guide, a level-up or another popup)
function fwMorningTry() {
  const f = S.fw; if (!f.morning || f.shown === f.morning) return;
  if (cur.mode !== 'yard' || !modal.hidden || popOpen() || busy || levelQueue.length || Date.now() - FW.enterAt < 2200) return;
  if (gdLive() && gdAllowed()) return; if (typeof phActive === 'function' && phActive()) return; if (typeof blOn === 'function' && blOn()) return;
  f.shown = f.morning; markDirty(); fwCalOpen(true);
}

/* ---------------- frames for photo mode (35_photo.js lists them) ---------------- */
function fwFrameList() {
  const f = S && S.fw && S.fw.frames, l = []; if (!f) return l;
  if (f.name) l.push({ k: 'fwname', n: tt('fw.frame_name', 'Name tag: {name}', { name: f.name }), c: '#F2C744' });
  f.months.forEach((ym) => l.push({ k: 'fwm' + ym.replace('-', ''), n: fwMonthName(ym), c: FW_MONTHS[fwMonthOf(ym)].c }));
  return l;
}
function fwPostcard(w, h, o) {
  const P = window.PawArt, k = o.color, isName = k === 'fwname', ym = isName ? '' : k.slice(3, 7) + '-' + k.slice(7, 9), M = isName ? null : FW_MONTHS[fwMonthOf(ym)] || FW_MONTHS[1];
  const svg = P.postcard(w, h, Object.assign({}, o, { color: isName ? 'sun' : M.pc })), s = Math.max(w, h) / 450;
  let g = '';
  if (isName) {
    const nm = (S && S.fw && S.fw.frames.name) || NAME(), tw = Math.min(w * 0.5, (nm.length * 11 + 70) * s), x0 = (w - tw) / 2;
    g = `<g transform="translate(${x0.toFixed(1)} ${(4 * s).toFixed(1)}) scale(${(tw / 260).toFixed(3)})">${fwTagSVG(nm, '#F2C744').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
  } else {
    const n = 7, gap = (w - 60 * s) / n;
    g = Array.from({ length: n }, (_, i) => fwDoodle(i === 3 ? 'paw' : M.d, +(30 * s + gap * (i + 0.5)).toFixed(1), +(12 * s).toFixed(1), 0.75 * s, i % 2 ? 10 : -10)).join('')
      + `<text x="${(w - 22 * s).toFixed(1)}" y="${(h - 9 * s).toFixed(1)}" text-anchor="end" font-family="Caveat,cursive" font-weight="700" font-size="${(13 * s).toFixed(1)}" fill="${INKG}">${esc(fwMonthName(ym))}</text>`;
  }
  return svg.replace(/<\/svg>\s*$/, `<g class="fw-frame">${g}</g></svg>`);
}

/* ---------------- 5. see you tomorrow ---------------- */
const FW_WISH = { walk: 'walk', ball: 'fetch', pet: 'pet', snack: 'feed' }; // wish -> the act that makes it come true
function fwWishLine(k, today) {
  if (today) switch (k) {
    case 'walk': return tt('fw.wish_today_walk', 'Today, can we go for a walk?');
    case 'ball': return tt('fw.wish_today_ball', 'Today, can we play ball?');
    case 'pet': return tt('fw.wish_today_pet', 'Today, a long belly rub?');
    default: return tt('fw.wish_today_snack', 'Today, a crunchy snack?');
  }
  switch (k) {
    case 'walk': return tt('fw.wish_walk', 'Tomorrow, can we go for a walk?');
    case 'ball': return tt('fw.wish_ball', 'Tomorrow, can we play ball?');
    case 'pet': return tt('fw.wish_pet', 'Tomorrow, a long belly rub?');
    default: return tt('fw.wish_snack', 'Tomorrow, a crunchy snack?');
  }
}
function fwWishName(loud) {
  if (!S || !S.fw || !fwOn()) return; const today = localISO(); if (S.fw.named === today) return;
  const ks = Object.keys(FW_WISH), last = S.fw.wish && S.fw.wish.k, k = PICK(ks.filter((x) => x !== last)), t = new Date(); t.setDate(t.getDate() + 1);
  S.fw.wish = { k, id: S.dog.id, name: NAME(), for: localISO(t), shown: false, done: false }; S.fw.named = today; markDirty();
  if (loud && cur.mode === 'yard' && !busy) { try { const h = dogHeadWorld(); say(fwWishLine(k, false), h.x, h.y, 4200); } catch (e) { /* no dog on screen */ } setTimeout(() => toast(tt('fw.wish_named', 'See you tomorrow! {name} is already looking forward to it.', { name: NAME() }), 'gold'), 600); }
  else saveNow();
}
on('act', (d) => {
  if (!S || !S.fw || !fwOn() || !d) return; const w = S.fw.wish;
  if (!w || w.done || w.for > localISO() || FW_WISH[w.k] !== d.kind) return;
  const dog = dogById(w.id) || D(); w.done = true; markDirty();
  const b = withDog(dog, () => { addStat('happy', 10); return addBond(2); });
  setTimeout(() => toast(tt('fw.wish_done', 'Wish come true! {name} is so happy: +10 Happiness, +{b} Bond.', { name: dog.name, b }), 'gold'), 900);
});
window.addEventListener('pagehide', () => { if (S && cur.mode !== 'title' && cur.mode !== 'adopt') fwWishName(false); });

/* ---------------- the loop and hooks ---------------- */
function fwTick() {
  fwExpose();
  if (!S || !S.fw || !fwOn()) { const el = $('#fwNext'); if (el) el.hidden = true; return; }
  if (['title', 'adopt'].includes(cur.mode) || !titleEl.hidden) return;
  fwStamp(); fwDockSync(); fwNextSync();
  if (document.visibilityState !== 'hidden' && ['walk', 'fetch', 'toy', 'bath', 'yard', 'market', 'map', 'shelter', 'japan', 'garden', 'kitchen', 'routes'].includes(cur.mode)) FW.play++; // seconds of real play this session
  if (FW.play >= 600 && S.fw.named !== localISO()) fwWishName(true);
  fwMorningTry();
}
setInterval(() => { try { fwTick(); } catch (e) { console.warn('fw tick', e); } }, 1000);
on('yard:enter', () => { FW.enterAt = Date.now(); if (S && S.fw && fwOn()) { fwDockApply(); fwNextSync(); } });
on('game:ready', () => { FW.enterAt = Date.now(); FW.play = 0; fwDockApply(); });
function fwExpose() {
  if (!window.__paw || window.__paw.fw) return;
  window.__paw.fw = {
    on: () => fwOn(), state: () => S && S.fw, steps: FW_STEPS.length, stepText: (i) => fwStepText(i), stamp: () => fwStamp(), claim: (pg, n) => fwClaim(pg, n),
    reward: (pg, n, ym) => fwReward(pg, n, ym), open: (m) => fwCalOpen(!!m), html: (m) => fwCalHTML(!!m), next: (L) => fwNextText(L), dock: () => fwDockApply(),
    wish: (loud) => fwWishName(!!loud), tag: () => fwTagOpen(), confetti: () => fwConfetti(), frames: () => fwFrameList(), postcard: (w, h, o) => fwPostcard(w, h, o),
    test: (v) => { prefs.fwTest = !!v; fwDockApply(); fwNextSync(); }, bond: (n) => addBond(n, { raw: true }),
    bondFix: (s) => { fwBondFix(s); return s; }, migrate: (s) => migrate(s), BOND_TH: BOND_TH.slice(), play: (n) => { if (typeof n === 'number') FW.play = n; return FW.play; }
  };
}
