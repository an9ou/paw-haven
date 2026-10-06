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
  if (walk15 || dig1) { if (dig1 && S.outfit.head === 'Acorn Cap') { addStat('happy', 10); toast('Spinach power + Acorn Cap: digs are maxed, so +10 Happiness instead.', 'good'); } else toast(walk15 ? 'Carrot Crunchies power: +15 seconds on this walk!' : 'Spinach Scramble power: +1 dig on this walk!', 'good'); S.buff = null; markDirty(); }
  W = { mod: true, area, env: e, ended: false };
  const o = {
    area, time: e.time, weather: e.weather, dog: dogForMod(), durationSec: Math.round(R.secs * walkScale()) + (walk15 ? 15 : 0), firstWalk, // v2: 3 to 6 months x0.7
    skipTutorial: !!prefs.skipTut, setSkipTutorial: (v) => { prefs.skipTut = !!v; savePrefs(); },
    abilities: { extraDig: S.outfit.head === 'Acorn Cap' || dig1, goggles: S.outfit.eyes === 'Explorer Goggles', necklace: S.outfit.neck === 'Seashell Necklace', poncho: S.outfit.body === 'Mossy Poncho', clover: S.outfit.neck === 'Clover Collar', luckyPenny: S.outfit.charm === 'Lucky Penny', noseMul: noseMul(), raincoat: hasRaincoat(), rainHat: hasRainHat(), warm: isWarm() },
    rollTreasure: (ar) => {
      const L = rollTreasure(ar || area, { common: firstWalk && rolls === 0 }); rolls++;
      if (L.item) { const g = grantTreasure(L.item, area); audioCue('treasure'); return { name: L.item.n, rarity: RARITY[L.item.r], kind: L.item.kind, desc: `${L.item.ab}: ${L.item.txt}`, dup: !!g.dup }; }
      return { coins: L.coins, text: `A pouch of ${L.coins} coins (you own every ${RARITY[L.r]} treasure from this route).` };
    },
    junk: () => walkJunk(),
    bag: (S.inv.food['Wild Berries'] || 0) > 0 ? [{ name: 'Wild Berries', count: S.inv.food['Wild Berries'] }] : [],
    useBagItem: (name) => { if (name !== 'Wild Berries' || !(S.inv.food[name] > 0)) return false; S.inv.food[name]--; if (S.inv.food[name] <= 0) delete S.inv.food[name]; markDirty(); return true; },
    sfx, say: (t) => toast(t),
    onEnd: (r) => { if (ended) return; ended = true; W.ended = true; finishWalkMod(R, r || {}); }
  };
  try { modCtl = window.PawWalk.start(showHost(), o); }
  catch (err) { console.warn('PawWalk failed, using the classic walk', err); hideHost(); enterWalkClassic(area); return; }
  onCleanup(() => { const c = modCtl; modCtl = null; try { if (c && c.stop) c.stop(); } catch (er) { /* ignore */ } hideHost(); });
}
function finishWalkMod(R, r) {
  pottyWalked();
  const e = W.env, rainCoat = e.weather === 'rain' && hasRaincoat();
  const coins = addCoins(Math.max(0, +r.coins || 0));
  const happy = Math.round((+r.happiness || 0) + (rainCoat ? 5 : 0)); addStat('happy', happy);
  const bond = (+r.bond || 0) > 0 ? addBond(+r.bond) : 0;
  const en = Math.abs(+r.energy || 0) * (buffOn('cool') ? 0.75 : 1); addStat('energy', -en);
  let cl = Math.abs(+r.cleanliness || 0); if (rainCoat) cl = 0; else if (e.weather === 'rain') cl += 5; addStat('clean', -cl);
  S.walks = (S.walks || 0) + 1; dailyCare('play'); markDirty();
  const t = r.treasure && r.treasure.name ? tInfo(r.treasure.name) : null, dup = r.treasure && r.treasure.dup;
  let tre;
  if (t) tre = `<div class="tfind"><div class="tbig">${art('item', t.n)}</div><div><h3>${esc(t.n)}</h3>${stamp(t.r)}<p class="ab"><b>${esc(t.ab)}.</b> ${esc(t.txt)}</p>${dup ? '<p class="small">You already have one. A squirrel bought this one for 40 coins.</p>' : t.kind === 'quest' ? `<p class="small">Map pieces: ${S.mapPieces.length}/4.${S.mapPieces.length >= 4 ? ' The map is complete! Check your yard for an X.' : ''}</p>` : '<p class="small">It is in your Treasure Journal now.</p>'}</div></div>`;
  else if (r.treasure && r.treasure.coins) tre = `<div class="tfind"><div class="tbig">${artReal('collectible', 'chest') || art('collectible', 'coin')}</div><div><h3>A pouch of coins</h3><p class="ab">${esc(r.treasure.text || '')}</p></div></div>`;
  else tre = `<div class="tfind"><div class="tbig" style="filter:grayscale(1) opacity(.5)">${artReal('collectible', 'chest') || art('collectible', 'dig')}</div><div><h3>The treasure stayed hidden</h3><p class="ab">Watch the Nose-o-meter and dig when it says HOT.</p></div></div>`;
  const bonus = r.bonus && r.bonus.name ? `<p class="small">Bonus sparkle on the path: ${esc(r.bonus.name)}${r.bonus.dup ? ' (sold, duplicate)' : ''}.</p>` : '';
  const junk = Array.isArray(r.junk) && r.junk.length ? `<p class="small">Junk dug up: ${r.junk.map((j) => esc(typeof j === 'string' ? j : (j && j.text) || 'something odd')).join(' ')}</p>` : '';
  const wl = breedLine(WALK_LINES, D());
  const run = `${wl ? `<p class="small">${esc(wl)}</p>` : ''}<p class="small">${r.cleanRun ? 'Clean run! Not a single bonk. ' : r.obstaclesHit ? `Bonked into ${r.obstaclesHit} thing${r.obstaclesHit > 1 ? 's' : ''}. ` : ''}${r.timeLost ? `Bumps cost you ${Math.round(r.timeLost)}s. ` : ''}${r.puddlesCleared ? `Leapt over ${r.puddlesCleared} puddle${r.puddlesCleared > 1 ? 's' : ''}. ` : ''}${rainCoat ? 'The raincoat kept everything dry (+5 Happiness).' : e.weather === 'rain' ? 'No raincoat, so: soggy dog.' : ''}</p>`;
  const p = openModal(t ? `<span class="hl">Treasure found: ${esc(R.n)}</span>` : (r.early ? `Walk cut short: ${esc(R.n)}` : `Walk complete: ${esc(R.n)}`), `${tre}${bonus}${junk}${run}
    ${wfTiles([[`+${coins}`, 'Paw Coins', coins], [`+${happy}`, 'Happiness', happy], [`+${bond}`, 'Bond points', bond], [`-${Math.round(en)}`, 'Energy', Math.round(en)], [cl ? '-' + Math.round(cl) : '0', 'Cleanliness', cl]], 'results compact')}`,
    { cls: 'celebrate', keep: true, foot: `${t && !dup ? '<button class="btn" id="resJournal">Open Journal</button>' : ''}<button class="btn yes big" id="resOk">${t && !dup ? 'Add to Journal' : 'Back to ' + esc((PLACES[S.place] || PLACES.yard).n)}</button>`, onClose: () => go('yard') });
  $('#resOk', p).onclick = () => { SFX.boop(700); closeModal(); };
  const rj = $('#resJournal', p); if (rj) rj.onclick = () => { modalClose = null; closeModal(); go('yard'); setTimeout(() => openJournal('treasures'), 300); };
  SFX.fanfare();
}
const toySupported = (n) => { try { return !!(window.PawToys && typeof window.PawToys.open === 'function' && (!window.PawToys.supports || window.PawToys.supports(n))); } catch (e) { return false; } };
const toysPlayable = () => TOYS.map((t) => t.n).concat(TREASURES.filter((t) => t.kind === 'toy').map((t) => t.n)).filter((n) => owns('toys', n) && toySupported(n));
let toyCtl = null;
function enterToy(name) {
  barkDog(D(), 'play', {});
  setChrome(true, false); dock.innerHTML = ''; view.innerHTML = '';
  dailyCheck(); S.toyDay = S.toyDay || {};
  let td = S.toyDay[name]; if (!td || td.day !== day()) td = S.toyDay[name] = { day: day(), n: 0 };
  const k = td.n === 0 ? 1 : td.n === 1 ? 0.5 : 0.25; td.n++; markDirty();
  const fav = (S.dog.favToy === name ? 1.5 : 1) * (S.place === 'park' ? 1.2 : 1), e = envNow();
  let closed = false;
  const ctx = {
    dog: dogForMod(), time: e.time, weather: e.weather, sfx, say: (t) => toast(t),
    reward: (r) => {
      if (!r) return; const hp = (+r.happiness || 0) * k * fav * (S.place === 'dogpark' ? 1.3 : 1); if (hp) addStat('happy', hp);
      const b = (+r.bond || 0) > 0 ? addBond(r.bond * k) : 0; const c = (+r.coins || 0) > 0 ? addCoins(r.coins * k) : 0;
      if (r.energy) addStat('energy', +r.energy);
      dailyCare('play'); updateHUD(); markDirty();
      toast(`+${Math.round(hp)} Happiness${b ? `, +${b} Bond` : ''}${c ? `, +${c} coins` : ''}${fav > 1 ? ' (favourite toy!)' : ''}${k < 1 ? ` (x${k}: played already today)` : ''}`, 'good');
    },
    onClose: () => { if (closed) return; closed = true; if (cur.mode === 'toy') go('yard'); }
  };
  try { toyCtl = window.PawToys.open(showHost(), name, ctx); }
  catch (err) { console.warn('PawToys failed', err); hideHost(); go('yard'); return; }
  onCleanup(() => { const c = toyCtl; toyCtl = null; closed = true; try { if (c && c.close) c.close(); } catch (er) { /* ignore */ } hideHost(); });
}

