/* ======================= v2.8 FUJI HILL lane (tag jp): Mt. Fuji Lookout, Look at Fuji, the first Fuji of the year, Gerald's letter. See V28.md section 12.4 =======================
   Core names: jpOn() (00_core.js: true in the game, false under the harness unless prefs.jpTest), envNow().jp, S.jp { letter, gazed, first, mochi } (v28Fields),
   PLACES.fujihill / jpPlaceSync() / jpHillOpen() (14_town_places.js: only while jpOn() and PawArt.scene('fujihill') exists), JP_MAP_PIN / jpMapPin (08_map.js),
   the missions gaze / hatsufuji / travel_fuji (24_missions.js). Acts: trackAct('gaze', { first }), travel { place: 'fujihill' } (core).
   The torii, the little shrine and the stone lanterns are quiet scenery (JAPAN SCENE ART, world C): no hotspot, nothing to do there but look.
   Look at Fuji: the dog walks to the bench (the scene root's data-spot-bench, the middle of the seat) and sits facing the view, the scene eases in a little
   for 6 s (motion off: no ease, a short pause), then the toast, +6 Happiness and +1 Bond, once per real day (S.jp.gazed = localISO()). The first look of
   the New Year (nyDays(), once per nyYear(), S.jp.first) is a gold toast with +10 Happiness and +2 Bond, then once a year the mochi lesson (S.jp.mochi). */

const JP_GAZE_MS = 6000, JP_GAZE_FAST = 900, JP_WALK_S = 1.6, JP_HOLD_MS = 2400;
const JP_BENCH = [530, 423.8]; // the as-built world C seat (FH_SPOT), used when the scene root has no data-spot-bench
const JP_SIT = 0.62; // the dog's scale on the bench (the bench stands further back than the path)
const JP = { gazing: false, paid: false, pending: 0, tok: 0, t: [] }; // pending: steps, toasts and letters still to come (tests wait on 0)
function jpLater(fn, ms) { JP.pending++; const id = setTimeout(() => { JP.pending--; JP.t = JP.t.filter((x) => x !== id); fn(); }, ms); JP.t.push(id); return id; }

/* ---- state ---- */
function jpFields() { if (S) v28Fields(S); }
const jpHere = () => cur.mode === 'yard' && !!S && S.place === 'fujihill' && !!$('#view svg.world');
const jpGazedToday = () => !!(S && S.jp && S.jp.gazed === localISO());
const jpGuideHold = () => typeof gdLive === 'function' && gdLive() && (typeof gdAllowed !== 'function' || gdAllowed());
const jpGdBusy = () => typeof gdActive === 'function' && gdActive();
// a toast that waits while Gerald's guide card is up
function jpToast(text, kind, tries = 0) { if (jpGdBusy() && tries < 120) { setTimeout(() => jpToast(text, kind, tries + 1), 1000); return; } toast(text, kind); }
const jpName = (s) => s.replace(/\{dog\}/g, NAME());

/* ---- the dog's line on arrival, by breed key (all 17 breeds), merged into PLACE_LINES[breed].fujihill (read by 03_yard.js placeAmbient) ---- */
const jpPlaceLines = {
  shiba: 'Fuji is very tall. I am very proud. We understand each other.',
  corgi: 'Fuji looks like a giant rice ball. I am not hungry. I am a little hungry.',
  golden: 'A mountain! Hello, mountain! I love you, mountain!',
  dachs: 'Somebody should dig a tunnel through that mountain. I volunteer.',
  husky: 'Snow on the top. That mountain understands me. AWOO, Fuji.',
  mutt: 'Can we sit here a while? It is nice up here with you and Fuji.',
  chihuahua: 'That mountain is very big. I am not scared. I am behind your leg for other reasons.',
  pug: 'A bench with a view. The best kind of bench. snort.',
  greyhound: 'I could run all the way to Fuji. I will look at it lying down instead.',
  beagle: 'I can smell the whole valley from up here. And somebody\'s rice cracker.',
  poodle: 'Fuji has a perfect white top. We go to the same hairdresser.',
  collie: 'Everything is in its place from up here. The mountain is behaving very well.',
  samoyed: 'Fuji is white and fluffy on top. Like me! We are twins. Woo!',
  frenchie: 'Good bench. Good view. I will sit here and climb nothing.',
  akita: 'What a fine mountain. I will sit here with you and look at it for a long time.',
  spitz: 'Fuji wears a white cap. I wear a white everything. Hello, Fuji!',
  pom: 'That mountain is bigger than everything. Yip! I like it a lot.',
  afghan: 'Fuji has beautiful lines and no tangles at all. I am a little jealous.',
  dane: 'I can nearly see over the mountain. Nearly. Hello, Fuji!',
  mastiff: 'A very big hill. I like it. I will sit and look at it slowly.',
  gsd: 'A mountain! I will keep watch from here. Fuji is safe.',
  // v2.12 Fourteen New Friends
  dobie: 'A great mountain. Straight and tall. I respect it. I will keep watch.',
  corso: 'A very big mountain. A calm one. We will sit together. Slowly.',
  pitbull: 'A mountain! With a snow hat! Hello, mountain! Do you want a hug?',
  minpin: 'That mountain is huge. I am not scared. I am prancing. In place.',
  lab: 'Is that a big hill? A BIG hill! Is there a ball at the top?',
  malamute: 'Snow on the top! That mountain and I are going to be friends. Woo!',
  chow: 'A mountain. White hat. Dignified. I am willing to be seen with it.',
  stdpoodle: 'Fuji has the most perfect shape. Tall, slim and elegant. Like me.',
  schnauzer: 'A mountain! I will inspect it from here. It looks well kept.',
  westie: 'A very big hill! With snow on! I would like to dig up there. Later.',
  yorkie: 'That mountain is bigger than everything. I am still in charge here.',
  bichon: 'Fuji wears a white puff on top! We match! Boing!',
  maltese: 'A graceful mountain with a white veil. I understand it completely.',
  shihtzu: 'A nice mountain. A nice bench. I will look at one while sitting on the other.'
};
Object.keys(jpPlaceLines).forEach((k) => { if (PLACE_LINES[k]) PLACE_LINES[k].fujihill = jpPlaceLines[k]; });

/* ---- the toast (V28.md section 12.4 table, checked in this order) ---- */
const JP_TOASTS = {
  wet: 'Fuji is shy today. It is behind the clouds. {dog} looked anyway.',
  cloudy: 'Only the top of Fuji is in the clouds. {dog} is sure it is still there.',
  dusk: 'Fuji has turned pink. {dog} is not sure why but approves.',
  night: 'Fuji is a dark shape with a star on top. {dog} said goodnight to it.',
  winter: 'Fuji has its winter hat on. So does half of Doodle Doggo Town.',
  summer: 'Fuji has nearly no snow. It is too warm for hats.',
  other: 'Fuji. Very big. Very still. {dog} sat very still too, for nearly a minute.'
};
const JP_FIRST = 'The first Fuji of the year. In Japan that is very lucky. {dog} feels lucky too.';
const JP_MOCHI = 'Mochi is for people at New Year. It is far too sticky for dogs to swallow, so {dog} gets a pat instead.';
function jpToastKey() {
  const w = weatherNow(), t = timePhase(), so = seasonNow();
  if (w === 'rain' || w === 'snow') return 'wet';
  if (w === 'cloudy') return 'cloudy';
  if (t === 'dusk') return 'dusk';
  if (t === 'night') return 'night';
  if (t === 'day' && so === 'winter') return 'winter';
  if (t === 'day' && so === 'summer') return 'summer';
  return 'other';
}

/* ---- the place button (44 px, before Go home) ---- */
function jpBtnHTML() {
  const done = jpGazedToday();
  return `<button class="btn ${done ? 'jp-done' : 'yes'} jp-gaze" data-jp="gaze" ${done || JP.gazing ? 'aria-disabled="true"' : ''}>${done ? 'Fuji says see you tomorrow.' : 'Look at Mt. Fuji'}</button>`;
}
function jpPlaceBtn() {
  const pb = $('#placeBtns'); if (!pb) return;
  pb.querySelectorAll('[data-jp]').forEach((b) => b.remove());
  pb.classList.toggle('jp-row', jpHere()); // the hill's row: 44 px buttons (36_japan.css)
  if (!jpHere()) return;
  const home = pb.querySelector('[data-pb="yard"]');
  if (home) home.insertAdjacentHTML('beforebegin', jpBtnHTML()); else pb.insertAdjacentHTML('beforeend', jpBtnHTML());
  const b = pb.querySelector('[data-jp]'); if (b) b.onclick = () => jpGaze();
}

/* ---- Look at Fuji ---- */
function jpBenchSpot() {
  const r = $('#view svg.world #sceneG [data-spot-bench]'), m = r && /^([\d.]+),([\d.]+)$/.exec(r.getAttribute('data-spot-bench') || '');
  return m ? [+m[1], +m[2]] : JP_BENCH.slice();
}
// dogTo(tx, ty, scale): the dog box's feet line (y 500) and centre (x 430) land on the middle of the seat
function jpSitMove() { const [bx, by] = jpBenchSpot(); return [Math.round(bx - 430 * JP_SIT), Math.round(by + 4 - 500 * JP_SIT), JP_SIT]; }
function jpGaze() {
  if (!S || !jpHere()) return null;
  jpFields();
  if (JP.gazing) return null;
  if (jpGazedToday()) { SFX.click(); toast(`${NAME()} already looked at Fuji today. Fuji says see you tomorrow.`); return null; }
  if (busy) return null;
  if (S.sleeping) { nope(`${NAME()} is asleep. Fuji will wait.`); return null; }
  if (typeof idleStop === 'function') idleStop();
  if (typeof clearCurl === 'function') clearCurl();
  JP.gazing = true; JP.paid = false; busy = true; hideBubble(); const tok = ++JP.tok, fast = motionOff();
  SFX.click(); jpPlaceBtn();
  const [tx, ty, sc] = jpSitMove();
  renderDog('walk', 'right', true); dogTo(tx, ty, sc, fast ? 0 : JP_WALK_S);
  const sit = () => {
    if (tok !== JP.tok) return;
    renderDog('sit', 'left', true); // facing the view: Fuji is up and to the left of the bench
    const svg = $('#view > svg.world'); if (svg && !motionOff()) { void svg.getBoundingClientRect(); svg.classList.add('jp-ease'); }
    jpLater(() => jpGazeEnd(tok), motionOff() ? JP_GAZE_FAST : JP_GAZE_MS);
  };
  if (fast) sit(); else jpLater(sit, JP_WALK_S * 1000 + 60);
  return true;
}
// the reward, once per look (also when the player leaves mid-look)
function jpPay() {
  if (JP.paid || !S) return; JP.paid = true; jpFields();
  const ny = nyYear(), first = nyDays() && S.jp.first !== ny;
  S.jp.gazed = localISO();
  if (first) {
    S.jp.first = ny; addStat('happy', 10); const b = addBond(2); SFX.fanfare();
    jpToast(`${jpName(JP_FIRST)} +10 Happiness, +${b} Bond.`, 'gold');
    if (S.jp.mochi !== ny) { S.jp.mochi = ny; markDirty(); setTimeout(() => jpToast(jpName(JP_MOCHI), 'good'), 2600); }
  } else {
    addStat('happy', 6); const b = addBond(1); SFX.boop(660);
    jpToast(`${jpName(JP_TOASTS[jpToastKey()])} +6 Happiness, +${b} Bond.`, 'good');
  }
  markDirty(); updateHUD(); trackAct('gaze', { first: !!first });
}
function jpGazeEnd(tok) {
  if (tok !== JP.tok || !S) return;
  jpPay();
  if (jpHere()) { setTemp('happy', 1200); renderDog('sit', 'left', true); jpPlaceBtn(); }
  jpLater(() => jpGazeBack(tok), motionOff() ? 300 : JP_HOLD_MS);
}
function jpGazeBack(tok) {
  if (tok !== JP.tok) return;
  const svg = $('#view > svg.world'); if (svg) svg.classList.remove('jp-ease');
  if (jpHere()) { const fast = motionOff(); renderDog('walk', 'right', true); dogTo(0, 0, 1, fast ? 0 : 1.1); jpLater(() => jpGazeDone(tok), fast ? 0 : 1150); }
  else jpGazeDone(tok);
}
function jpGazeDone(tok) {
  if (tok !== JP.tok) return;
  JP.gazing = false; busy = false;
  if (jpHere()) { renderDog(dogPoseNow(), 'right', true); jpPlaceBtn(); }
}
// the scene was rebuilt mid-look (the player went somewhere): the look still counts, the dog is simply home again
function jpGazeReset() {
  if (!JP.gazing) return;
  JP.t.forEach(clearTimeout); JP.t = []; JP.pending = 0; JP.tok++;
  jpPay(); JP.gazing = false; busy = false;
}

/* ---- Gerald's letter (news, once) when the hill first opens: Bond 2, jpOn(); held while Gerald's guide runs ---- */
const JP_LETTER = { kind: 'news', from: 'Gerald the duck', title: 'A hill with a view', text: 'There is a hill past the meadow where you can see Fuji. Bring {dog}. Bring a snack. Not for Fuji.' };
function jpLetter() {
  if (!S || typeof mailPush !== 'function' || !jpHillOpen() || jpGuideHold()) return null; jpFields();
  if (S.jp.letter) return null;
  S.jp.letter = localISO(); markDirty();
  return mailPush(Object.assign({}, JP_LETTER, { id: 'jp_hill', text: jpName(JP_LETTER.text) }));
}

/* ---- bus ---- */
on('game:ready', () => { jpFields(); setTimeout(jpExpose, 0); jpLater(() => { if (cur.mode === 'yard') jpLetter(); }, 1700); });
on('yard:enter', () => {
  jpFields(); jpExpose(); jpGazeReset();
  jpPlaceBtn();
  jpLater(() => { if (cur.mode === 'yard') jpLetter(); }, 1700);
});
on('scene:redraw', () => { if (jpHere() && !$('#placeBtns [data-jp]')) jpPlaceBtn(); });
on('clock:minute', () => { if (S && S.jp && !S.jp.letter && cur.mode === 'yard' && modal.hidden && jpHillOpen()) jpLetter(); }); // a level-up to Bond 2 while in the yard
on('day:new', () => { if (jpHere() && !JP.gazing) jpPlaceBtn(); });

/* ---- tests: window.__paw.jp ---- */
function jpExpose() {
  if (!window.__paw) return;
  // allow(v): the harness gate at run time (prefs.jpTest), then the place table and the scene follow
  window.__paw.jp = {
    allow: (v) => { prefs.jpTest = !!v; jpPlaceSync(); checkEnv(true); return jpOn(); }, on: () => jpOn(), open: () => jpHillOpen(), place: () => (PLACES.fujihill ? Object.assign({}, PLACES.fujihill) : null),
    gaze: () => jpGaze(), letter: () => jpLetter(), toastKey: () => jpToastKey(), toasts: Object.assign({ first: JP_FIRST, mochi: JP_MOCHI }, JP_TOASTS), lines: Object.assign({}, jpPlaceLines),
    bench: () => jpBenchSpot(), sit: () => jpSitMove(), get gazing() { return JP.gazing; }, get pending() { return JP.pending; }
  };
}
setTimeout(jpExpose, 0);
