/* ======================= SETTINGS + DEV ======================= */
function openSettings() {
  const motionOff = document.documentElement.dataset.motion === 'off';
  const p = openModal('Settings', `
    <h4 style="margin:0;font-family:var(--font-hand);font-size:26px">Sound</h4>
    ${[['master', 'Master', 'volume'], ['music', 'Music', 'music'], ['sfx', 'Sound effects', 'sfx'], ['ambience', 'Ambience', 'ambience']].map(([k, l, ic]) => `<div class="vol"><span class="ic">${iconOr(ic, '<circle r="9" fill="#FCD8BC" stroke="#5B3D32" stroke-width="2"/>')}</span><label for="vol-${k}">${l}</label><input type="range" id="vol-${k}" min="0" max="100" step="5" value="${prefs.vol[k]}"><output id="out-${k}">${prefs.vol[k]}</output></div>`).join('')}
    <label class="tog"><input type="checkbox" id="setMute" ${prefs.mute ? 'checked' : ''}> Mute all</label>${PAU() ? '' : ' <span class="small">(Music arrives with the audio module.)</span>'}<br>
    <label class="tog"><input type="checkbox" id="setMotion" ${motionOff ? '' : 'checked'}> Motion and wobble</label>
    <div class="barkset"><span>Barking:</span>${[['normal', 'Normal'], ['fewer', 'Fewer'], ['off', 'Off']].map(([k, l]) => `<button class="btn ${barkMode() === k ? 'yes' : ''}" data-barkm="${k}" aria-pressed="${barkMode() === k}">${l}</button>`).join('')}</div>
    <p class="small">Time: 1 game hour = 1 real minute. Prototype economy: coins x${BOOST.coins}, Bond x${BOOST.bond}, naps x${BOOST.nap}.</p>
    <p class="small">Clock and weather follow your real local time (3 weather periods a day). Keys: 1-9 bottom buttons, Space pets / throws / walks, Esc closes things.</p>
    ${typeof clSection === 'function' ? clSection() : ''}
    <div class="foot" style="justify-content:space-between${isPhone() ? '' : ';position:sticky;bottom:-2px;z-index:2;margin-top:8px;padding:8px 0 2px;background:var(--paper);border-top:2px dashed rgba(91,61,50,.25)'}"><button class="btn red" id="setReset">Reset save</button><button class="btn" id="setTitle">Title screen</button></div>`);
  ['master', 'music', 'sfx', 'ambience'].forEach((k) => { const r = $('#vol-' + k, p); r.oninput = () => { prefs.vol[k] = +r.value; if (k === 'ambience') prefs.ambTouched = true; $('#out-' + k, p).textContent = r.value; applyAudioPrefs(); }; r.onchange = () => { savePrefs(); if (k === 'sfx' || k === 'master') SFX.boop(660); }; });
  $('#setMute', p).onchange = (e) => { prefs.mute = e.target.checked; savePrefs(); applyAudioPrefs(); updateMute(); };
  $('#setMotion', p).onchange = (e) => setMotion(e.target.checked);
  if (typeof clBind === 'function') clBind(p);
  p.querySelectorAll('[data-barkm]').forEach((b) => { b.onclick = () => { prefs.bark = b.dataset.barkm; savePrefs(); SFX.click(); p.querySelectorAll('[data-barkm]').forEach((x) => { x.classList.toggle('yes', x === b); x.setAttribute('aria-pressed', String(x === b)); }); }; });
  $('#setTitle', p).onclick = () => { saveNow(); closeModal(); go('title'); };
  $('#setReset', p).onclick = async () => {
    const ok = await confirmIn(p, `Delete ${esc(NAME())}'s save forever? Coins, clothes, houses, Bond: all gone.`, 'Yes, reset', 'No way'); if (!ok) return;
    lsDel(SAVE_KEY); S = null; levelQueue = []; closeModal(); toast('Save deleted. Fresh crayons.'); go('title');
  };
}
function setMotion(on) { document.documentElement.dataset.motion = on ? 'on' : 'off'; prefs.motion = on ? 'on' : 'off'; savePrefs(); }
function bindDev() { const b = $('#devBtn'); if (b) b.onclick = () => { devPanel.hidden = !devPanel.hidden; renderDev(); }; }
function renderDev() {
  devPanel.innerHTML = `<b>Dev panel</b><button class="btn" id="dvCoins">+500 coins</button><button class="btn" id="dvBond">+1 Bond level</button><button class="btn" id="dvFill">Fill all meters</button><button class="btn" id="dvDrain">Drain all meters</button><button class="btn" id="dvDay">Skip to next day</button><label class="devsel">Time <select id="dvTime">${['auto', 'dawn', 'day', 'dusk', 'night'].map((v) => `<option ${ENV.time === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label class="devsel">Weather <select id="dvWeather">${['auto', 'sunny', 'cloudy', 'rain', 'snow'].map((v) => `<option ${ENV.weather === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><button class="btn" id="dvMap">Grant all map pieces</button><label class="devsel">Garden <select id="dvGW">${['sunny', 'cloudy', 'rain', 'snow'].map((v) => `<option>${v}</option>`).join('')}</select></label><button class="btn" id="dvGHour">Garden: +1 hour</button><button class="btn" id="dvGStep">Garden: +1 period</button><button class="btn" id="dvGReady">Garden: all ready</button><button class="btn" id="dvGive">Give seeds and pantry x5</button><button class="btn" id="dvAge">Age +6 days</button><button class="btn" id="dvPack">Pack: Bond 3 + 2-dog house</button><button class="btn" id="dvPoop">Force poop</button><button class="btn" id="dvPee">Force pee</button><button class="btn" id="dvAccident">Force indoor accident</button><button class="btn" id="dvTreasure">Grant a random treasure</button><button class="btn no" id="dvX">Close</button>`;
  $('#dvCoins').onclick = () => { addCoins(500, { raw: true }); toast('+500 coins. Money printer goes brrr.', 'gold'); };
  $('#dvBond').onclick = () => { if (S.bond.level >= 10) { toast('Already max Bond.'); return; } addBond(BOND_TH[S.bond.level] - S.bond.pts, { raw: true }); };
  $('#dvFill').onclick = () => { for (const k in S.stats) S.stats[k] = 100; updateHUD(); markDirty(); };
  $('#dvDrain').onclick = () => { for (const k in S.stats) S.stats[k] = 15; updateHUD(); markDirty(); };
  $('#dvDay').onclick = () => { S.gameMin = (Math.floor(S.gameMin / 1440) + 1) * 1440 + 480; dailyCheck(); updateHUD(); toast('Good morning. Daily bonuses reset.'); };
  $('#dvMap').onclick = () => { TREASURES.filter((t) => t.kind === 'quest').forEach((t) => grantTreasure(t, t.piece)); toast('All 4 map pieces granted. Check the yard for an X.', 'gold'); if (cur.mode === 'yard') go('yard'); };
  $('#dvTreasure').onclick = () => { const c = TREASURES.filter((t) => !(isUnique(t) && hasTreasure(t)) && t.kind !== 'quest'); if (!c.length) { toast('You own every treasure. Legend.'); return; } const t = PICK(c); grantTreasure(t, PICK(t.routes)); toast(`Granted: ${t.n} (${RARITY[t.r]}).`, 'gold'); };
  $('#dvTime').onchange = (e) => { ENV.time = e.target.value; prefs.ovrTime = ENV.time === 'auto' ? null : ENV.time; savePrefs(); checkEnv(true); };
  $('#dvWeather').onchange = (e) => { ENV.weather = e.target.value; prefs.ovrWeather = ENV.weather === 'auto' ? null : ENV.weather; savePrefs(); checkEnv(true); };
  $('#dvGHour').onclick = () => { gardenDevStep(1, $('#dvGW').value); toast('Garden: +1 hour (' + $('#dvGW').value + ').'); };
  $('#dvGStep').onclick = () => { gardenDevStep(8, $('#dvGW').value); toast('Garden: +1 period, 8 hours (' + $('#dvGW').value + ').'); };
  $('#dvGReady').onclick = () => { gardenDevReady(); toast('Every planted crop is ready.'); };
  $('#dvGive').onclick = () => { cropsList().forEach((c) => { S.inv.seeds[c.id] = (S.inv.seeds[c.id] || 0) + 5; }); pantryList().forEach((x) => { S.inv.pantry[x.id] = (S.inv.pantry[x.id] || 0) + 5; }); markDirty(); if (gardenCtl && gardenCtl.update) gardenCtl.update({ seeds: seedCounts() }); toast('+5 of every seed and pantry item.'); };
  $('#dvAge').onclick = () => { const b = new Date(S.dog.born + 'T00:00:00'); b.setDate(b.getDate() - 6); S.dog.born = localISO(b); markDirty(); birthdayCheck(); toast(`${NAME()} is now ${ageText(ageMonths())} old.`); };
  $('#dvPoop').onclick = () => { devPanel.hidden = true; if (cur.mode !== 'yard') go('yard'); setTimeout(() => doPotty('poop'), 150); };
  $('#dvPee').onclick = () => { devPanel.hidden = true; if (cur.mode !== 'yard') go('yard'); setTimeout(() => doPotty('pee'), 150); };
  $('#dvAccident').onclick = () => { devPanel.hidden = true; if (S.place !== 'house') { toast('Go inside first (Cozy House). Accidents only happen indoors.'); return; } const P = S.potty; P.lastOut = S.gameMin - 300; P.peeDue = S.gameMin - 90; S.messes.house = []; lastPottyMin = -1; toast(`${NAME()} has needed to go for ages and nobody took ${PR().him} out...`); markDirty(); };
  $('#dvPack').onclick = () => { if (S.bond.level < 3) addBond(BOND_TH[2] - S.bond.pts, { raw: true }); if (!owns('houses', 'Classic Wooden Doghouse')) S.inv.houses.push('Classic Wooden Doghouse'); if ((HOUSE_CAP[S.house] || 1) < 2) S.house = 'Classic Wooden Doghouse'; markDirty(); toast(`Bond 3 and a ${S.house}: ${slotsFree() > 0 ? 'room for another dog' : 'all dog spots are taken'}.`); if (cur.mode === 'yard') go('yard'); };
  $('#dvX').onclick = () => { devPanel.hidden = true; };
}

