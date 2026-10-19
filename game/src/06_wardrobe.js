/* ======================= WARDROBE ======================= */
function equip(n, quiet) {
  const c = ALL_WEAR.find((x) => x.n === n) || CHARMS.find((x) => x.n === n); if (!c) return;
  S.outfit[c.slot] = S.outfit[c.slot] === n ? null : n; markDirty(); SFX.pop();
  if (S.outfit[c.slot] && c.slot !== 'charm') { trackAct('wear', { name: n, slot: c.slot }); dailyCheck(); if (!S.daily.outfit) { S.daily.outfit = true; const tw = S.outfit.body === 'Tutu', lf = S.outfit.head === 'Leaf Beret' && S.outfit.neck === 'Autumn Scarf'; addStat('happy', tw || lf ? 10 : 5); toast(tt('wardrobe.fashion_bonus', '{kind, select, tutu {Fashion bonus! +10 Happiness. Twirl! {name} is feeling cute.} leaf {Fashion bonus! +10 Happiness. Autumn chic. {name} is feeling cute.} other {Fashion bonus! +5 Happiness. {name} is feeling cute.}}', { kind: tw ? 'tutu' : lf ? 'leaf' : 'other', name: NAME() }), 'good'); /* v2.5: Leaf Beret + Autumn Scarf, like the Tutu */ } else if (!quiet) toast(tt('wardrobe.on', '{item} on. {pick}', { item: shNameAny(n), pick: PICK([tt('wardrobe.on_1', 'Stunning.'), tt('wardrobe.on_2', 'Iconic.'), tt('wardrobe.on_3', 'A look.'), tt('wardrobe.on_4', 'Runway ready.')]) })); }
  if (S.outfit[c.slot] && c.slot === 'charm' && !quiet) toast(n === 'Sparkle Stone' ? tt('wardrobe.charm_sparkle', '{item} equipped as a charm. It hums. Ominously. Cutely.', { item: shNameAny(n) }) : tt('wardrobe.charm_other', '{item} equipped as a charm. Pocket luck activated.', { item: shNameAny(n) }), 'good');
  if (cur.mode === 'yard' && !pkDressing) renderDog(dogPoseNow()); // v2.9 PACK: a pack dog being dressed is redrawn by pkDress, the leader's picture stays
}
// did: v2.9 PACK, the dog picked in the picker (a pack dog is dressed under withDog and redrawn in place; the leader is never changed)
function openWardrobe(did) {
  const wd = pkWardDog(did), pick = pkPickHTML(wd ? wd.id : S.activeId, tt('wardrobe.who', 'Who to dress')); // the picker is built before withDog, so the heads keep their order
  if (wd) return withDog(wd, () => openWardrobeFor(wd, pick));
  return openWardrobeFor(null, pick);
}
function openWardrobeFor(wd, pick) {
  const act = (f) => { if (wd) pkDress(wd, f); else f(); }, again = () => openWardrobe(wd ? wd.id : undefined);
  const owned = ALL_WEAR.filter((c) => owns('clothes', c.n));
  const opt = (c, s) => `<button class="opt" data-eq="${esc(c.n)}" aria-pressed="${S.outfit[s] === c.n}"><span class="ic">${c.ed ? hwItemArt(c.n) : art('item', c.n)}</span>${esc(shNameAny(c.n))}${hwTag(c.n)}${c.treasure || s === 'charm' ? ` <span class="tstar" title="${tt('wardrobe.treasure', 'Treasure')}">&#10022;</span>` : ''}</button>`;
  const slotRow = (s, label, opts, empty) => `<div class="slot"><h4>${label}</h4>${opts.length ? `<button class="opt" data-un="${s}" aria-pressed="${!S.outfit[s]}">${tt('wardrobe.nothing', 'Nothing')}</button>` + opts.map((c) => opt(c, s)).join('') : `<span class="small">${empty}</span>`}${s === 'body' ? shPjToggle() : ''}</div>`;
  const slots = SLOTS.map((s) => slotRow(s, shSlotName(s), owned.filter((c) => c.slot === s), tt('wardrobe.none_owned', 'Nothing owned yet. Bow-Wow Boutique sells some, walks hide others.'))).join('')
    + slotRow('charm', tt('wardrobe.charm', 'Charm'), CHARMS.filter((c) => S.inv.charms.includes(c.n)), tt('wardrobe.no_charms', 'No charms yet. They are buried on walks.'));
  const perks = SLOTS.concat('charm').map((s) => S.outfit[s]).filter(Boolean).map((n) => { const c = ALL_WEAR.find((x) => x.n === n) || CHARMS.find((x) => x.n === n); return c ? tt('wardrobe.perk_line', '{item}: {perk}', { item: shNameAny(n), perk: shPerk(c) }) : ''; });
  audioPlace('wardrobe');
  const p = openModal(pick ? tt('wardrobe.title_dog', 'Wardrobe: {name}', { name: esc(D().name) }) : tt('wardrobe.title', 'Wardrobe'), `${pick}<div class="ward"><div class="preview">${dogSVG(D(), { pose: 'happy', outfit: dogOutfit() })}${S.outfit.charm ? `<div class="charmtag">${esc(tt('wardrobe.charm_tag', 'Charm: {charm}', { charm: shNameAny(S.outfit.charm) }))}</div>` : ''}</div><div>${slots}<p class="small">${perks.length ? esc(tt('wardrobe.perks', 'Perks: {list}', { list: perks.join(' ') })) : tt('wardrobe.nothing_worn', 'Wearing: nothing but confidence.')}</p></div></div>`);
  pkBindPick(p, (id) => openWardrobe(id));
  p.querySelectorAll('[data-eq]').forEach((b) => { b.onclick = () => { act(() => equip(b.dataset.eq)); again(); }; });
  const pj = $('#shPj', p); if (pj) pj.onclick = () => { S.pjAuto = S.pjAuto === false; markDirty(); SFX.click(); if (cur.mode === 'yard' && !wd) renderDog(dogPoseNow(), 'right', true); again(); };
  p.querySelectorAll('[data-un]').forEach((b) => { b.onclick = () => { act(() => { S.outfit[b.dataset.un] = null; markDirty(); SFX.click(); if (cur.mode === 'yard' && !pkDressing) renderDog(dogPoseNow()); }); again(); }; });
}


/* ---- v2.4 SHOP: the Pyjamas at nap time, nap perks ---- */
// the outfit a dog is drawn in: while it sleeps (its nap flag or the sleep pose; dogSVG turns a greyhound's sleep into rollover after this), owned Pyjamas go on with the Nightcap unless the Wardrobe toggle is off
function shSleepOutfit(d, pose) {
  d = d || D(); const o = outfitOf(d);
  if ((d.sleeping || pose === 'sleep') && S && owns('clothes', 'Pyjamas') && S.pjAuto !== false) { o.body = 'Pyjamas'; o.sleepwear = true; }
  return o;
}
const shPjOn = () => S.outfit.body === 'Pyjamas' || (owns('clothes', 'Pyjamas') && S.pjAuto !== false);
function shPjToggle() {
  if (!owns('clothes', 'Pyjamas')) return '';
  const on = S.pjAuto !== false;
  return `<button class="opt sh-pj" id="shPj" aria-pressed="${on}"><span class="ic">${art('item', 'Pyjamas')}</span>${tt('wardrobe.pj_toggle', 'Pyjamas at nap time: {state, select, on {on} other {off}}', { state: on ? 'on' : 'off' })}</button>`;
}
// Cowboy Hat: outdoor naps x1.1. Pyjamas: x1.15 (worn, or put on at nap time)
function shNapMul() { return (S.outfit.head === 'Cowboy Hat' && S.place !== 'house' ? 1.1 : 1) * (shPjOn() ? 1.15 : 1); }
function shNapNote() { return `${S.outfit.head === 'Cowboy Hat' && S.place !== 'house' ? tt('wardrobe.nap_cowboy', ', +10% {item}', { item: shNameAny('Cowboy Hat') }) : ''}${shPjOn() ? tt('wardrobe.nap_pj', ', +15% {item}', { item: shNameAny('Pyjamas') }) : ''}`; }
on('game:ready', () => { if (S && typeof S.pjAuto !== 'boolean') S.pjAuto = true; });
