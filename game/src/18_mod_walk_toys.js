/* ======================= MODULES: PawWalk + PawToys ======================= */
function showHost() { const h = $('#modHost'); h.style.top = hud.offsetHeight + 'px'; h.innerHTML = ''; h.hidden = false; return h; }
function hideHost() { const h = $('#modHost'); h.hidden = true; h.innerHTML = ''; }
function dogForMod() { const c = coatInfo(D()); return Object.assign({ key: artKey(S.dog.key), name: S.dog.name, outfit: dogOutfit(), sex: S.dog.sex || 'male', pronouns: PR() }, lookOpts(D(), c)); }
let modCtl = null;
function enterWalkMod(area) {
  setChrome(true, false); dock.innerHTML = ''; view.innerHTML = '';
  const R = ROUTES[area], e = envNow(), firstWalk = !S.walks;
  let rolls = 0, ended = false;
  const walk15 = buffOn('walk15'), dig1 = buffOn('dig1');
  if (walk15 || dig1) { if (dig1 && S.outfit.head === 'Acorn Cap') { addStat('happy', 10); toast(tt('toys.spinach_cap', 'Spinach power + Acorn Cap: digs are maxed, so +10 Happiness instead.'), 'good'); } else toast(walk15 ? tt('toys.carrot_power', 'Carrot Crunchies power: +15 seconds on this walk!') : tt('toys.spinach_power', 'Spinach Scramble power: +1 dig on this walk!'), 'good'); S.buff = null; markDirty(); }
  W = { mod: true, area, env: e, ended: false };
  const o = {
    area, time: e.time, weather: e.weather, season: e.season, halloween: e.halloween, lights: e.lights, newyear: e.newyear, jp: e.jp, dog: Object.assign(dogForMod(), { size: sizeK(D()) }), durationSec: Math.round(R.secs * pkWalkScale()) + (walk15 ? 15 : 0), firstWalk, pack: pkWalkLooks().map((l, i) => Object.assign(l, { size: sizeK(pkWalkers()[i]) })), // v2: 3 to 6 months x0.7 (v2.9 PACK: the shortest walker decides; pack: the followers' looks, [] with one dog). v2.11.1: size = each walker's size class (sizeK), the runner draws the followers by it
    skipTutorial: !!prefs.skipTut, setSkipTutorial: (v) => { prefs.skipTut = !!v; savePrefs(); },
    abilities: { extraDig: S.outfit.head === 'Acorn Cap' || S.outfit.charm === 'Lucky Horseshoe' || dig1, goggles: S.outfit.eyes === 'Explorer Goggles', necklace: S.outfit.neck === 'Seashell Necklace' || S.outfit.charm === 'Sea Glass', poncho: S.outfit.body === 'Mossy Poncho' || S.outfit.neck === 'Sunflower Collar', clover: S.outfit.neck === 'Clover Collar', luckyPenny: S.outfit.charm === 'Lucky Penny', noseMul: noseMul(), raincoat: hasRaincoat(), rainHat: hasRainHat(), warm: isWarm() },
    rollTreasure: (ar) => {
      const L = rollTreasure(ar || area, { common: firstWalk && rolls === 0 }); rolls++;
      // v2.14 i18n: name stays the English id (finishWalkMod looks it up); label is the shown name, rarity and desc are already shown text
      if (L.item) { const g = grantTreasure(L.item, area); audioCue('treasure'); return { name: L.item.n, label: jrTN(L.item), rarityKey: RARITY[L.item.r], rarity: tdata('rarity.' + L.item.r, RARITY[L.item.r]), kind: L.item.kind, desc: tt('toys.treasure_desc', '{ab}: {txt}', { ab: jrTAb(L.item), txt: jrTTxt(L.item) }), dup: !!g.dup }; }
      return { coins: L.coins, text: tt('toys.pouch_text', 'A pouch of {n, plural, one {# coin} other {# coins}} (you own every {rarity} treasure from this route).', { n: L.coins, rarity: tdata('rarity.' + L.r, RARITY[L.r]) }) };
    },
    junk: () => walkJunk(),
    bag: (S.inv.food['Wild Berries'] || 0) > 0 ? [{ name: 'Wild Berries', label: shNameAny('Wild Berries'), count: S.inv.food['Wild Berries'] }] : [],
    useBagItem: (name) => { if (name !== 'Wild Berries' || !(S.inv.food[name] > 0)) return false; S.inv.food[name]--; if (S.inv.food[name] <= 0) delete S.inv.food[name]; markDirty(); return true; },
    sfx, say: (t) => toast(t),
    onRun: () => { if (isPhone()) toasts.innerHTML = ''; }, // the strip is clear when the dog starts running (a late yard hint must not sit on it)
    onEnd: (r) => { if (ended) return; ended = true; W.ended = true; finishWalkMod(R, r || {}); }
  };
  try { modCtl = window.PawWalk.start(showHost(), o); }
  catch (err) { console.warn('PawWalk failed, using the classic walk', err); hideHost(); enterWalkClassic(area); return; }
  onCleanup(() => { const c = modCtl; modCtl = null; try { if (c && c.stop) c.stop(); } catch (er) { /* ignore */ } hideHost(); });
}
function finishWalkMod(R, r) {
  pottyWalked();
  const e = W.env, rainCoat = e.weather === 'rain' && hasRaincoat();
  const coins = addCoins(pkWalkCoins(Math.max(0, +r.coins || 0))); // v2.9 PACK: one walk's pay, +10% (rounded down) when 2 or more dogs walk
  const happy = Math.round((+r.happiness || 0) + (rainCoat ? 5 : 0)); addStat('happy', happy);
  const bond = (+r.bond || 0) > 0 ? addBond(+r.bond) : 0;
  const en = Math.abs(+r.energy || 0) * (buffOn('cool') ? 0.75 : 1); addStat('energy', -en);
  let cl = Math.abs(+r.cleanliness || 0); if (rainCoat) cl = 0; else if (e.weather === 'rain') cl += 5; addStat('clean', -cl);
  const pkFol = pkWalkDone(r, e); // v2.9 PACK: each follower gets the walk's stats and Bond
  S.walks = (S.walks || 0) + 1; dailyCare('play'); markDirty(); trackAct('walk', { area: W.area, early: !!r.early });
  const t = r.treasure && r.treasure.name ? tInfo(r.treasure.name) : null, dup = r.treasure && r.treasure.dup;
  let tre;
  if (t) tre = `<div class="tfind"><div class="tbig">${art('item', t.n)}</div><div><h3>${esc(jrTN(t))}</h3>${stamp(t.r)}<p class="ab"><b>${esc(jrTAb(t))}.</b> ${esc(jrTTxt(t))}</p>${dup ? `<p class="small">${esc(tt('walk.res_dup', 'You already have one. A squirrel bought this one for 40 coins.'))}</p>` : t.kind === 'quest' ? `<p class="small">${esc(tt('walk.res_map', 'Map pieces: {n}/4.{done, select, yes { The map is complete! Check your yard for an X.} other {}}', { n: S.mapPieces.length, done: S.mapPieces.length >= 4 ? 'yes' : 'no' }))}</p>` : `<p class="small">${esc(tt('toys.in_journal', 'It is in your Treasure Journal now.'))}</p>`}</div></div>`;
  else if (r.treasure && r.treasure.coins) tre = `<div class="tfind"><div class="tbig">${artReal('collectible', 'chest') || art('collectible', 'coin')}</div><div><h3>${esc(tt('walk.res_pouch', 'A pouch of coins'))}</h3><p class="ab">${esc(r.treasure.text || '')}</p></div></div>`;
  else tre = `<div class="tfind"><div class="tbig" style="filter:grayscale(1) opacity(.5)">${artReal('collectible', 'chest') || art('collectible', 'dig')}</div><div><h3>${esc(tt('walk.res_hidden', 'The treasure stayed hidden'))}</h3><p class="ab">${esc(tt('toys.res_hidden_txt', 'Watch the Nose-o-meter and dig when it says HOT.'))}</p></div></div>`;
  const bonus = r.bonus && r.bonus.name ? `<p class="small">${esc(tt('toys.bonus', 'Bonus sparkle on the path: {item}{dup, select, yes { (sold, duplicate)} other {}}.', { item: shNameAny(r.bonus.name), dup: r.bonus.dup ? 'yes' : 'no' }))}</p>` : '';
  const junk = Array.isArray(r.junk) && r.junk.length ? `<p class="small">${esc(tt('toys.junk_dug_up', 'Junk dug up: {list}', { list: r.junk.map((j) => (typeof j === 'string' ? j : (j && j.text) || tt('toys.something_odd', 'something odd'))).join(' ') }))}</p>` : '';
  const wl = breedLine(WALK_LINES, D());
  const runBits = [r.cleanRun ? tt('toys.clean_run', 'Clean run! Not a single bonk.') : r.obstaclesHit ? tt('toys.bonked', 'Bonked into {n, plural, one {# thing} other {# things}}.', { n: r.obstaclesHit }) : '', r.timeLost ? tt('toys.bumps', 'Bumps cost you {n}s.', { n: Math.round(r.timeLost) }) : '', r.puddlesCleared ? tt('toys.leapt', 'Leapt over {n, plural, one {# puddle} other {# puddles}}.', { n: r.puddlesCleared }) : '', rainCoat ? tt('toys.raincoat_dry', 'The raincoat kept everything dry (+5 Happiness).') : e.weather === 'rain' ? tt('toys.soggy', 'No raincoat, so: soggy dog.') : ''].filter(Boolean);
  const run = `${pkWalkLine(pkFol)}${wl ? `<p class="small">${esc(wl)}</p>` : ''}<p class="small">${esc(runBits.join(' '))}</p>`;
  const rn = townRouteName(W.area), here = (PLACES[S.place] && S.place) || 'yard';
  const p = openModal(t ? `<span class="hl">${esc(tt('walk.res_title_found', 'Treasure found: {route}', { route: rn }))}</span>` : esc(r.early ? tt('walk.res_title_short', 'Walk cut short: {route}', { route: rn }) : tt('walk.res_title_done', 'Walk complete: {route}', { route: rn })), `${tre}${bonus}${junk}${run}
    ${wfTiles([[`+${tnum(coins)}`, esc(tt('walk.res_coins', 'Paw Coins')), coins], [`+${happy}`, esc(tt('walk.res_happy', 'Happiness')), happy], [`+${bond}`, esc(tt('walk.res_bond', 'Bond points')), bond], [`-${Math.round(en)}`, esc(tt('walk.res_energy', 'Energy')), Math.round(en)], [cl ? '-' + Math.round(cl) : '0', esc(tt('walk.res_clean', 'Cleanliness')), cl]], 'results compact')}`,
    { cls: 'celebrate', keep: true, foot: `${t && !dup ? `<button class="btn" id="resJournal">${esc(tt('walk.res_journal', 'Open Journal'))}</button>` : ''}<button class="btn yes big" id="resOk">${esc(t && !dup ? tt('walk.res_add', 'Add to Journal') : tt('walk.back_to', 'Back to {place}', { place: townPlaceName(here) }))}</button>`, onClose: () => go('yard') });
  $('#resOk', p).onclick = () => { SFX.boop(700); closeModal(); };
  const rj = $('#resJournal', p); if (rj) rj.onclick = () => { modalClose = null; closeModal(); go('yard'); setTimeout(() => openJournal('treasures'), 300); };
  SFX.fanfare();
}
const toySupported = (n) => { try { return !!(window.PawToys && typeof window.PawToys.open === 'function' && (!window.PawToys.supports || window.PawToys.supports(n))); } catch (e) { return false; } };
const BL_BALLS = ['Tennis Ball', 'Glow Ball'];
const toysPlayable = () => TOYS.map((t) => t.n).concat(TREASURES.filter((t) => t.kind === 'toy').map((t) => t.n)).filter((n) => owns('toys', n) && toySupported(n) && !BL_BALLS.includes(n)); // v2.10: Tennis Ball and Glow Ball are free ball play now (38_ball.js)
let toyCtl = null;
function enterToy(name) {
  barkDog(D(), 'play', {});
  setChrome(true, false); dock.innerHTML = ''; view.innerHTML = '';
  dailyCheck(); S.toyDay = S.toyDay || {};
  let td = S.toyDay[name]; if (!td || td.day !== day()) td = S.toyDay[name] = { day: day(), n: 0 };
  const k = td.n === 0 ? 1 : td.n === 1 ? 0.5 : 0.25; td.n++; markDirty();
  const fav = (S.dog.favToy === name ? 1.5 : 1) * (S.place === 'park' ? 1.2 : 1), e = envNow();
  let closed = false, acted = false, capSaid = false; // v2.4: one 'toy' act per play session; the toy-coin cap line once
  const crew = pkDogs('play').slice(1); if (PKS.skip.length) pkSkipSay(PKS.skip, 900, 'toy'); // v2.9 PACK: every ticked dog gets the effects
  const ctx = {
    label: tdata('toys.' + tid(name) + '.n', name), dog: dogForMod(), time: e.time, weather: e.weather, season: e.season, halloween: e.halloween, lights: e.lights, newyear: e.newyear, jp: e.jp, sfx, say: (t) => toast(t),
    reward: (r) => {
      if (!r) return; const hp = (+r.happiness || 0) * k * fav * (S.place === 'dogpark' ? 1.3 : 1); if (hp) addStat('happy', hp);
      const b = (+r.bond || 0) > 0 ? addBond(r.bond * k) : 0;
      // coins (x the BOOST as before) under one shared daily cap for every toy game (FF_CAPS.toys, 49_funfair.js): past it play still gives Happiness and Bond
      const want = (+r.coins || 0) > 0 ? Math.round(r.coins * k * BOOST.coins) : 0, c = want ? ffToyPay(want) : 0;
      if (want && !c && !capSaid) { capSaid = true; toast(tt('ff.left_none', 'All {cap} coins earned today. Playing is still fun, and still gives Bond.', { cap: FF_CAPS.toys.day })); }
      if (r.energy) addStat('energy', +r.energy);
      if (crew.length) pkToyFx(crew, r, k, name);
      if (r.clean) addStat('clean', +r.clean); if (r.cool) S.coolUntil = S.gameMin + 60; // v2.4 Paddling Pool: +Cleanliness and a cool hour
      dailyCare('play'); updateHUD(); markDirty(); if (!acted) { acted = true; trackAct('toy', { name }); }
      if (Math.round(hp) || b || c) toast(tt('toys.reward', '+{happy} Happiness{hasBond, select, yes {, +{bond} Bond} other {}}{hasCoins, select, yes {, +{coins} coins} other {}}{fav, select, yes { (favourite toy!)} other {}}{repeat, select, yes { (x{k}: played already today)} other {}}{crew, select, yes { (each dog)} other {}}', { happy: Math.round(hp), hasBond: b ? 'yes' : 'no', bond: b, hasCoins: c ? 'yes' : 'no', coins: c, fav: fav > 1 ? 'yes' : 'no', repeat: k < 1 ? 'yes' : 'no', k: String(k), crew: crew.length ? 'yes' : 'no' }), 'good');
    },
    onClose: () => { if (closed) return; closed = true; if (cur.mode === 'toy') go('yard'); }
  };
  try { toyCtl = window.PawToys.open(showHost(), name, ctx); }
  catch (err) { console.warn('PawToys failed', err); hideHost(); go('yard'); return; }
  onCleanup(() => { const c = toyCtl; toyCtl = null; closed = true; try { if (c && c.close) c.close(); } catch (er) { /* ignore */ } hideHost(); });
}

