/* ======================= WARDROBE ======================= */
function equip(n, quiet) {
  const c = ALL_WEAR.find((x) => x.n === n) || CHARMS.find((x) => x.n === n); if (!c) return;
  S.outfit[c.slot] = S.outfit[c.slot] === n ? null : n; markDirty(); SFX.pop();
  if (S.outfit[c.slot] && c.slot !== 'charm') { trackAct('wear', { name: n, slot: c.slot }); dailyCheck(); if (!S.daily.outfit) { S.daily.outfit = true; const tw = S.outfit.body === 'Tutu', lf = S.outfit.head === 'Leaf Beret' && S.outfit.neck === 'Autumn Scarf'; addStat('happy', tw || lf ? 10 : 5); toast(tt('wardrobe.fashion_bonus', '{kind, select, tutu {Fashion bonus! +10 Happiness. Twirl! {name} is feeling cute.} leaf {Fashion bonus! +10 Happiness. Autumn chic. {name} is feeling cute.} other {Fashion bonus! +5 Happiness. {name} is feeling cute.}}', { kind: tw ? 'tutu' : lf ? 'leaf' : 'other', name: NAME() }), 'good'); /* v2.5: Leaf Beret + Autumn Scarf, like the Tutu */ } else if (!quiet) toast(tt('wardrobe.on', '{item} on. {pick}', { item: shNameAny(n), pick: PICK([tt('wardrobe.on_1', 'Stunning.'), tt('wardrobe.on_2', 'Iconic.'), tt('wardrobe.on_3', 'A look.'), tt('wardrobe.on_4', 'Runway ready.')]) })); }
  if (S.outfit[c.slot] && c.slot === 'charm' && !quiet) toast(n === 'Sparkle Stone' ? tt('wardrobe.charm_sparkle', '{item} equipped as a charm. It hums. Ominously. Cutely.', { item: shNameAny(n) }) : tt('wardrobe.charm_other', '{item} equipped as a charm. Pocket luck activated.', { item: shNameAny(n) }), 'good');
  if (cur.mode === 'yard' && !pkDressing) renderDog(dogPoseNow()); // v2.9 PACK: a pack dog being dressed is redrawn by pkDress, the leader's picture stays
}
// did: v2.9 PACK, the dog picked in the picker (a pack dog is dressed under withDog and redrawn in place; the leader is never changed)
// Tidy wardrobe (owner, 9 Nov 2026: "more beautiful and tidy"): one tab per slot (plus All), equal square tiles, a crayon tick on what is worn, "new!" on clothes not seen here yet.
// WD: the open sheet's tab and grid scroll, kept while it redraws itself after a tap (a fresh open starts on All at the top)
const WD = { tab: 'all', y: 0, keep: false, focus: null };
const WD_TABS = ['all'].concat(SLOTS, 'charm');
const WD_GHOST = { all: null, head: 'Party Hat', eyes: 'Heart Sunglasses', neck: 'Red Bandana', body: 'Knit Winter Sweater', charm: 'Lucky Penny' }; // a tab's pale icon while its slot is empty
// crayon doodles: the worn tick (its paper fill sits inside the pencil ring) and the empty hanger on the "Nothing" tile
const WD_TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.9" fill="#FFFDF6"/><path d="M12 1.9c5.3-.2 10.3 4 10.1 10.3-.1 5.6-4.4 10-10.2 9.9C6 22 1.8 17.6 1.9 11.8 2 6.2 6.4 2 12 1.9Z" fill="none" stroke="#5B3D32" stroke-width="1.6" stroke-linecap="round"/><path d="M6.9 12.6l3.4 3.5 6.9-7.6" fill="none" stroke="#3E9A5B" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const WD_HANGER = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M17.6 10.6c-.4-2.6 1.4-4.3 3.3-4 1.9.3 2.6 2.5 1.4 3.9-1 1.1-2.4 1.5-2.3 3.4M20 13.7 5.6 25.4c-1.6 1.3-.9 3 1.1 3h26.6c2 .1 2.6-1.6 1-2.9L20 13.7" fill="none" stroke="#5B3D32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3.2 3.4"/></svg>';
// the picked tab is always fully in view in its row (the row scrolls sideways on narrow phones and in long languages; nothing else moves)
function wdTabShow(p) {
  const row = $('.wd-tabs', p), b = row && $('[aria-selected="true"]', row); if (!b) return;
  const r = row.getBoundingClientRect(), c = b.getBoundingClientRect(), pad = 6;
  if (c.left < r.left + pad) row.scrollLeft -= r.left + pad - c.left; else if (c.right > r.right - pad) row.scrollLeft += c.right - (r.right - pad);
}
function openWardrobe(did) {
  if (!WD.keep) { WD.tab = 'all'; WD.y = 0; }
  const wd = pkWardDog(did), pick = pkPickHTML(wd ? wd.id : S.activeId, tt('wardrobe.who', 'Who to dress')); // the picker is built before withDog, so the heads keep their order
  if (wd) return withDog(wd, () => openWardrobeFor(wd, pick));
  return openWardrobeFor(null, pick);
}
function openWardrobeFor(wd, pick) {
  const keep = WD.keep; WD.keep = false;
  // a redraw after a tap keeps the tab and the grid's scroll; the dog picker redraws on its own row
  const fkey = (x) => x.dataset.eq || x.dataset.un || x.id;
  const again = (from) => { const g = $('#modal .wd-scroll'); WD.y = g ? g.scrollTop : 0; WD.keep = true; WD.focus = from ? fkey(from) : null; openWardrobe(wd ? wd.id : undefined); };
  const act = (f) => { if (wd) pkDress(wd, f); else f(); };
  if (typeof S.wardN !== 'number') S.wardN = S.inv.clothes.length; // clothes are only ever added, so the ones past this count are new here (a save's first open: none)
  const isNew = (n) => S.inv.clothes.indexOf(n) >= S.wardN;
  const itemArt = (c) => (c.ed ? hwItemArt(c.n) : art('item', c.n));
  const owned = ALL_WEAR.filter((c) => owns('clothes', c.n));
  const listOf = (s) => (s === 'charm' ? CHARMS.filter((c) => S.inv.charms.includes(c.n)) : owned.filter((c) => c.slot === s).sort((a, b) => (isNew(b.n) - isNew(a.n)) || (isNew(a.n) ? S.inv.clothes.indexOf(b.n) - S.inv.clothes.indexOf(a.n) : 0))); // new ones first, newest first; the rest in shop order
  const tile = (c, s) => { const on = S.outfit[s] === c.n, nm = shNameAny(c.n), fresh = s !== 'charm' && isNew(c.n);
    return `<button class="wd-tile${fresh ? ' wd-new' : ''}" data-eq="${esc(c.n)}" aria-pressed="${on}"><span class="wd-art" aria-hidden="true">${itemArt(c)}</span><span class="wd-name">${esc(nm)}</span>${hwTag(c.n)}${c.treasure || s === 'charm' ? `<span class="tstar" title="${tt('wardrobe.treasure', 'Treasure')}">&#10022;</span>` : ''}${fresh ? `<span class="wd-flag">${esc(tt('fw.new_tag', 'new!'))}</span>` : ''}<span class="wd-tick">${WD_TICK}</span></button>`; };
  const none = (s) => `<button class="wd-tile wd-off" data-un="${s}" aria-pressed="${!S.outfit[s]}"><span class="wd-art" aria-hidden="true">${WD_HANGER}</span><span class="wd-name">${tt('wardrobe.nothing', 'Nothing')}</span><span class="wd-tick">${WD_TICK}</span></button>`;
  const label = (s) => (s === 'all' ? tt('wardrobe.tab_all', 'All') : s === 'charm' ? tt('wardrobe.charm', 'Charm') : shSlotName(s));
  const empty = (s) => `<p class="wd-empty"><span class="wd-art" aria-hidden="true">${WD_HANGER}</span><span>${s === 'charm' ? tt('wardrobe.no_charms', 'No charms yet. They are buried on walks.') : tt('wardrobe.none_owned', 'Nothing owned yet. Bow-Wow Boutique sells some, walks hide others.')}</span></p>`;
  const SL = SLOTS.concat('charm'), lists = {}; SL.forEach((s) => { lists[s] = listOf(s); });
  const total = SL.reduce((n, s) => n + lists[s].length, 0);
  const section = (s) => { const L = lists[s]; return `<section class="slot${L.length ? '' : ' wd-none'}" data-slot="${s}"><h4>${label(s)}<span class="wd-n">${L.length}</span></h4>${L.length ? `<div class="wd-grid">${none(s)}${L.map((c) => tile(c, s)).join('')}</div>` : empty(s)}${s === 'body' ? shPjToggle() : ''}</section>`; };
  const tabIc = (s) => { if (s === 'all') return `<span class="wd-ti wd-on">${art('icon', 'wardrobe')}</span>`; const w = S.outfit[s], c = w && (ALL_WEAR.find((x) => x.n === w) || CHARMS.find((x) => x.n === w));
    return `<span class="wd-ti${c ? ' wd-on' : ''}">${c ? itemArt(c) : art('item', WD_GHOST[s])}${lists[s].length ? `<span class="wd-n">${lists[s].length}</span>` : ''}</span>`; };
  const tabs = `<div class="wd-tabs" role="tablist" aria-label="${esc(tt('wardrobe.title', 'Wardrobe'))}">${WD_TABS.map((s) => `<button class="btn wd-tab" role="tab" data-wt="${s}" aria-selected="${WD.tab === s}">${tabIc(s)}<span class="wd-tl">${label(s)}</span></button>`).join('')}</div>`;
  const perks = SL.map((s) => S.outfit[s]).filter(Boolean).map((n) => { const c = ALL_WEAR.find((x) => x.n === n) || CHARMS.find((x) => x.n === n); return c ? tt('wardrobe.perk_line', '{item}: {perk}', { item: shNameAny(n), perk: shPerk(c) }) : ''; });
  const perkP = `<p class="small wd-perks">${perks.length ? esc(tt('wardrobe.perks', 'Perks: {list}', { list: perks.join(' ') })) : tt('wardrobe.nothing_worn', 'Wearing: nothing but confidence.')}</p>`;
  const ph = isPhone(); // phones: the perks close the list (the sheet is short); wide screens: under the dog
  audioPlace('wardrobe');
  const body = `<div class="ward${total ? '' : ' wd-bare'}" data-tab="${WD.tab}"><div class="wd-stage">${pick}<div class="preview">${dogSVG(D(), { pose: 'happy', outfit: dogOutfit() })}${S.outfit.charm ? `<div class="charmtag">${esc(tt('wardrobe.charm_tag', 'Charm: {charm}', { charm: shNameAny(S.outfit.charm) }))}</div>` : ''}</div>${ph ? '' : perkP}</div><div class="wd-shelf">${tabs}<div class="wd-scroll" role="tabpanel">${SL.map(section).join('')}${ph ? perkP : ''}</div></div></div>`;
  const p = openModal(pick ? tt('wardrobe.title_dog', 'Wardrobe: {name}', { name: esc(D().name) }) : tt('wardrobe.title', 'Wardrobe'), body, { cls: 'wd-pop' + (keep ? ' wd-still' : ''), onClose: () => { if (S && S.wardN !== S.inv.clothes.length) { S.wardN = S.inv.clothes.length; markDirty(); } } });
  if (keep) p.classList.remove('pop'); // a redraw stays put: no pop, no sheet slide
  const ward = $('.ward', p), sc = $('.wd-scroll', p);
  if (keep && sc) sc.scrollTop = WD.y;
  wdTabShow(p);
  if (keep && WD.focus) { const k = WD.focus; WD.focus = null; setTimeout(() => { const f = p.isConnected && [...p.querySelectorAll('[data-eq],[data-un],#shPj')].find((x) => fkey(x) === k); if (f) f.focus({ preventScroll: true }); }, 40); } // after openModal's own focus (30 ms): the keyboard stays on the tile it pressed
  pkBindPick(p, (id) => { WD.keep = true; WD.y = 0; openWardrobe(id); });
  p.querySelectorAll('[data-wt]').forEach((b) => { b.onclick = () => { if (WD.tab === b.dataset.wt) return; WD.tab = b.dataset.wt; SFX.click(); ward.dataset.tab = WD.tab; p.querySelectorAll('[data-wt]').forEach((x) => x.setAttribute('aria-selected', String(x === b))); sc.scrollTop = 0; wdTabShow(p); }; });
  p.querySelectorAll('[data-eq]').forEach((b) => { b.onclick = () => { act(() => equip(b.dataset.eq)); again(b); }; });
  const pj = $('#shPj', p); if (pj) pj.onclick = () => { S.pjAuto = S.pjAuto === false; markDirty(); SFX.click(); if (cur.mode === 'yard' && !wd) renderDog(dogPoseNow(), 'right', true); again(pj); };
  p.querySelectorAll('[data-un]').forEach((b) => { b.onclick = () => { act(() => { S.outfit[b.dataset.un] = null; markDirty(); SFX.click(); if (cur.mode === 'yard' && !pkDressing) renderDog(dogPoseNow()); }); again(b); }; });
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
