/* ======================= v2.11 TOKYO TRIP: the Station, the Shinkansen ride, the Japan map and the six Tokyo places (V211.md section 5) =======================
   Lane TRAVEL owns this file and game/css/41_tokyo.css (tag tk, test hook __paw.tk). Save field S.tk (v211Fields in 00_core.js; tkFields adds the two
   once-a-day fields of this lane, hanami and sunset, the same additive way).
   Flow: the Station pin on the town map (PLACES.station, Bond 3, pickArea in 08_map.js) -> tkStation (the day ticket, 60 coins once a day, S.tk.day)
   -> tkRide('out') -> go('japan') (enterJapan, the Japan map) -> travelTo(place) -> the place in the yard mode (S.place = a TK_PLACES key) -> the Map
   button opens the Japan map again (tkMapAct, the one 00_core.js line) -> the Tokyo Station pin "Ride home" -> tkRide('home') -> the yard.
   tkOn() does not wait for the art (Coordinator's brief): until world D / E draw them, the game draws its own doodle Japan map, ride, station pin
   and SCENE_FB-style stand-ins for the six places (tkSceneArt, called from sceneArt in 00_core.js) with doodle hot spots.
   Hot spots (data-hot, V211.md 5.3): stamp, hachiko, crossing, omikuji, nakamise, lantern, souvenir, hanami, sunset. The trip is a coin sink: no coins
   are earned here except the v2.10 ball play. Acts: trackAct('ride', { dir }), trackAct('stamp', { key }), travel { place } (core). */

const TK_STATION_BOND = 3, TK_TICKET = 60, TK_OMI_PRICE = 10, TK_STAMP_PTS = 20, TK_HACHI_PTS = 15;
const TK_RIDE_MS = 4000, TK_WALK_MAX = 6000, TK_HOLD_MS = 2400;
const TK_PLACES = {
  shibuya: { n: 'Shibuya Crossing', bond: 3 }, yoyogi: { n: 'Yoyogi Park Dog Run', bond: 3 }, asakusa: { n: 'Asakusa and Sensō-ji', bond: 4 },
  ueno: { n: 'Ueno Park', bond: 4 }, tokyotower: { n: 'Tokyo Tower', bond: 5 }, odaiba: { n: 'Odaiba Seaside', bond: 6 }
};
const TK_STATION = { n: 'Station', bond: TK_STATION_BOND, out: true, station: true };
const TK_STAMPS = ['shibuya', 'hachiko', 'yoyogi', 'asakusa', 'tokyotower', 'ueno', 'odaiba'];
const TK_STAMP_N = { shibuya: 'Shibuya', hachiko: 'Hachikō', yoyogi: 'Yoyogi Park', asakusa: 'Asakusa', tokyotower: 'Tokyo Tower', ueno: 'Ueno Park', odaiba: 'Odaiba' };
const TK = { busy: false, tok: 0, t: [], pending: 0, ride: null };
function tkLater(fn, ms) { TK.pending++; const id = setTimeout(() => { TK.pending--; TK.t = TK.t.filter((x) => x !== id); fn(); }, ms); TK.t.push(id); return id; }

/* ---- state ---- */
function tkOn() { return !navigator.webdriver || !!prefs.tkTest; }
function tkArtReady() { return !!(window.PawArt && Array.isArray(PawArt.WORLD_D_SCENES) && PawArt.WORLD_D_SCENES.includes('japanmap')); }
const tkHere = () => !!(S && TK_PLACES[S.place]);
const tkInPlace = () => cur.mode === 'yard' && tkHere() && !!$('#view svg.world');
function tkFields() { if (!S) return; v211Fields(S); ['hanami', 'sunset'].forEach((k) => { if (S.tk[k] === undefined) S.tk[k] = null; }); }
const tkToday = (k) => !!(S && S.tk && S.tk[k] === localISO());
const tkTicket = () => !!(S && S.tk && S.tk.day === todayKey());
const tkGdBusy = () => typeof gdActive === 'function' && gdActive();
// a toast that waits while Gerald's guide card is up
function tkToast(text, kind, tries = 0) { if (tkGdBusy() && tries < 120) { setTimeout(() => tkToast(text, kind, tries + 1), 1000); return; } toast(text, kind); }
const tkPack = () => (typeof rmDogs === 'function' ? rmDogs() : [D()]);
function tkPackHappy(n) { tkPack().forEach((d) => { d.stats.happy = clamp(d.stats.happy + n, 0, 100); }); markDirty(); updateHUD(); }
const tkPlural = (n, one, many) => (n === 1 ? one : many);

// PLACES gets the six places and the Station pin only while tkOn() (like jpPlaceSync). A save standing in Tokyo goes home when the trip is off
function tkPlaceSync() {
  if (tkOn()) { Object.keys(TK_PLACES).forEach((k) => { if (!PLACES[k]) PLACES[k] = Object.assign({ out: true, tokyo: true }, TK_PLACES[k]); }); if (!PLACES.station) PLACES.station = Object.assign({}, TK_STATION); }
  else { Object.keys(TK_PLACES).concat('station').forEach((k) => { delete PLACES[k]; }); if (S && TK_PLACES[S.place]) S.place = 'yard'; }
  return !!PLACES.station;
}
tkPlaceSync();

/* ---- care notes (S.tk.seen), once each: the first ride and the first visit to each place ---- */
const TK_CARE = {
  ride: 'On real trains in Japan, dogs ride in a closed carrier. In the game, everyone squeezes in by the window.',
  shibuya: 'Busy crossings are loud for dogs. Keep the lead short and cross at a quiet moment.',
  yoyogi: 'Dog runs have their own rules, like leads off only inside the fence. Stay close and watch the play.',
  asakusa: 'Some temples and shrines only welcome dogs in a carrier. Check the sign at the gate first.',
  ueno: 'Picnic food is for people, not dogs. Bring their own treats and fresh water.',
  tokyotower: 'City pavements get hot in summer. Touch the ground with your hand, and walk early or late.',
  odaiba: 'Sea water is salty, so it is not for drinking. Bring fresh water and rinse paws after the beach.'
};
function tkCare(k, delay = 900) {
  if (!S || !TK_CARE[k]) return false; tkFields(); if (S.tk.seen[k]) return false;
  S.tk.seen[k] = 1; markDirty(); setTimeout(() => tkToast(TK_CARE[k], 'gold'), delay); return true;
}

/* ---- the arrival line per place for all 17 breeds, merged into PLACE_LINES[breed] (read by 03_yard.js placeAmbient) ---- */
const TK_LINES = {
  shiba: { shibuya: 'Hachikō was a very loyal dog. I am also loyal. When I feel like it.', yoyogi: 'A dog run full of strangers. I will pretend not to care. I care a little.', asakusa: 'That lantern is bigger than our house. I approve of big things.', ueno: 'The blossoms are falling on me. I look like a painting now.', tokyotower: 'A tall red tower. Tall, proud, a bit orange. Like me.', odaiba: 'Sand in my curl again. Tokyo sand, though. Very fancy.' },
  corgi: { shibuya: 'So many people! Someone here has a snack. I can feel it.', yoyogi: 'A whole lawn of friends! And a picnic over there. Hello, picnic.', asakusa: 'The snack street! Do they have dog snacks? They have dog snacks!', ueno: 'Picnic blankets everywhere. I will sit near every one. Politely.', tokyotower: 'From up there you could see every snack in Tokyo.', odaiba: 'Beach zoomies, city edition! My legs were made for this.' },
  golden: { shibuya: 'Everybody is crossing! Hello everybody! Hello, Hachikō!', yoyogi: 'SO MANY DOGS. I love all of them. I love the fence.', asakusa: 'A giant red lantern! I would like to fetch it. Gently.', ueno: 'Ducks on the pond! Blossoms on my nose! Best day!', tokyotower: 'A tower! Can I fetch the tower? I can try.', odaiba: 'The sea! The bridge! A ball! Everything is wonderful!' },
  dachs: { shibuya: 'Too many feet up here. I will investigate the ground.', yoyogi: 'This lawn has never been dug. That feels like a missed chance.', asakusa: 'The temple has a very old floor. I will sniff all of it.', ueno: 'Somebody buried a rice ball here in 1998. I am almost sure.', tokyotower: 'Under the tower is the best spot. Nobody digs there. Yet.', odaiba: 'City sand! I could tunnel to the other side of the bay.' },
  husky: { shibuya: 'AWOO, Hachikō! That is a howl of respect.', yoyogi: 'Every dog here gets a howl. AWOO. AWOO. AWOO.', asakusa: 'A quiet temple. I will howl quietly. awoo.', ueno: 'Pink snow falling from the trees! It is not cold. Disappointing.', tokyotower: 'At night it glows like the northern lights. Almost.', odaiba: 'The sea breeze is cool. Finally something for my coat.' },
  mutt: { shibuya: 'Hachikō waited for his person. I would wait for you too.', yoyogi: 'Lots of dogs. Can I stay near you while I say hello?', asakusa: 'A lucky lantern. I already feel lucky. I have you.', ueno: 'Petals in the pond. Can we sit here a while?', tokyotower: 'It is a very tall tower. I like the view of you better.', odaiba: 'I found a shell on a city beach. It is for you.' },
  chihuahua: { shibuya: 'So many people. I will bark at the crossing. The crossing is not listening.', yoyogi: 'Twelve big dogs and me. I am in charge of all of them.', asakusa: 'That lantern looks dangerous. I am keeping an eye on it.', ueno: 'A petal landed on me. I have decided it is a medal.', tokyotower: 'That tower is very tall. I am taller on the inside.', odaiba: 'The waves keep coming. I keep telling them off. City waves are rude.' },
  pug: { shibuya: 'Too many steps for one crossing. Carry me? snort.', yoyogi: 'I came to the dog run to lie down. In public.', asakusa: 'The snack street smells amazing. snort snort snort.', ueno: 'A picnic blanket under a pink tree. My dream. Goodnight.', tokyotower: 'I looked at the tower. Very nice. Can we sit now?', odaiba: 'Warm sand, cool breeze. A pug paradise. snort.' },
  greyhound: { shibuya: 'I could cross that in two strides. I will walk it with you instead.', yoyogi: 'A big lawn! ZOOM. ZOOM. ...okay, nap time.', asakusa: 'Long street, long legs, long nose over every stall.', ueno: 'I found the softest patch of grass in Tokyo. I am upside down on it.', tokyotower: 'A tall, thin, elegant thing. A tower after my own heart.', odaiba: 'A whole beach for a sprint. Then the whole bridge to look at.' },
  beagle: { shibuya: 'A thousand people and every one of them had breakfast. AROOO.', yoyogi: 'Every dog here smells different. I need to sniff all of them.', asakusa: 'Rice crackers, sweet potato, incense. My nose is on a temple trip.', ueno: 'Somebody has a picnic. Somebody else has a picnic. Everybody has a picnic.', tokyotower: 'I can smell the whole city from here. Mostly noodles.', odaiba: 'Seaweed, sunscreen and a hot dog stand on a bridge. AROOO!' },
  poodle: { shibuya: 'A famous crossing. I will cross it beautifully.', yoyogi: 'The other dogs run around. I prefer to be admired.', asakusa: 'A thousand years old. Older than my haircut. Barely.', ueno: 'Pink blossoms suit my coat. I have known this for years.', tokyotower: 'A tower with style. Red and white. Very tasteful.', odaiba: 'Sand in the curls. I will be brave. For the view.' },
  collie: { shibuya: 'Everyone crosses at once. In all directions. Nobody told me.', yoyogi: 'Twenty dogs and no line. I have work to do.', asakusa: 'The stalls are in a neat line. Somebody here understands.', ueno: 'The ducks on the pond are in a little row. Good ducks.', tokyotower: 'Every street from up there would look like a line. Lovely.', odaiba: 'The boats keep leaving the bay. I keep counting them back.' },
  samoyed: { shibuya: 'Hello, Hachikō! Hello, Tokyo! Everyone gets a smile.', yoyogi: 'So many friends to smile at. Woo-woo!', asakusa: 'The lantern is red and I am white. We look great together.', ueno: 'Petals are sticking to me. I am a blossom dog now.', tokyotower: 'At night it sparkles. I sparkle too, a bit.', odaiba: 'Too warm for me, but the sea breeze is a good friend.' },
  frenchie: { shibuya: 'Big crossing. Short legs. I will take my time. *snort*', yoyogi: 'I will sit by the fence and watch. That is my sport.', asakusa: 'A bench by the temple. Good bench. I sit.', ueno: 'Shady tree, soft grass. Wake me at sunset.', tokyotower: 'Very tall. I will look at it from down here, lying flat.', odaiba: 'Hot sand, flat face. Shade and water, please.' },
  akita: { shibuya: 'Hachikō was an Akita like me. I will sit with him a while.', yoyogi: 'I will stay near the gate and keep watch. That is my kind of play.', asakusa: 'An old temple, a calm crowd. I feel at home here.', ueno: 'The blossoms fall very slowly. I can wait. I am good at waiting.', tokyotower: 'The tower stands still and tall. So do I.', odaiba: 'The sea is calm today. So am I. Mostly.' },
  spitz: { shibuya: 'A famous crossing! Everybody watch me cross it. Pose!', yoyogi: 'A lawn full of dogs. I am the fluffiest one here. Probably.', asakusa: 'A red lantern and a white dog. It is a perfect photo.', ueno: 'Pink petals on a white coat. I planned this.', tokyotower: 'Red and white, like a show ring ribbon. I approve.', odaiba: 'Sand on my white coat. Someone will brush it. Right?' },
  pom: { shibuya: 'So many feet! I am small, so I go between them. Yip!', yoyogi: 'Big dogs everywhere. I will do a happy spin to say hello.', asakusa: 'A lantern as big as a house! I am as big as a lantern bow.', ueno: 'A petal fell on my head. Now I am a flower. Yip!', tokyotower: 'That tower is very tall. I did a spin about it.', odaiba: 'Little paws, big beach. Spin, spin, spin!' }
};
Object.keys(TK_LINES).forEach((k) => { PLACE_LINES[k] = Object.assign(PLACE_LINES[k] || {}, TK_LINES[k]); });

/* ---- the scenes: the world D / E art, else a stand-in (an existing scene of the same kind, its own hot spots taken off) with the place sign and
   doodle hot spots, so every feature works before the art lands. Called from sceneArt (00_core.js) for every scene name */
const TK_FB = { shibuya: 'square', tokyotower: 'square', yoyogi: 'dogpark', asakusa: 'market', ueno: 'park', odaiba: 'beach' };
// [x, y, w, h, label] in scene units: above the floor band (bottom edge at y 410 at most), so the pack can stand in front
const TK_FB_HOTS = {
  shibuya: { hachiko: [270, 280, 150, 130, 'Hachikō'], crossing: [440, 330, 150, 70, 'Crossing'], souvenir: [630, 300, 140, 100, 'Souvenirs'], stamp: [820, 310, 110, 90, 'Stamp'] },
  yoyogi: { stamp: [820, 310, 110, 90, 'Stamp'] },
  asakusa: { lantern: [420, 190, 160, 150, 'Lantern'], nakamise: [110, 300, 150, 100, 'Treats'], omikuji: [620, 300, 130, 100, 'Omikuji'], souvenir: [770, 300, 130, 100, 'Souvenirs'], stamp: [20, 310, 80, 90, 'Stamp'] },
  ueno: { hanami: [560, 300, 170, 100, 'Picnic'], stamp: [820, 310, 110, 90, 'Stamp'] },
  tokyotower: { souvenir: [630, 300, 140, 100, 'Souvenirs'], stamp: [820, 310, 110, 90, 'Stamp'] },
  odaiba: { sunset: [380, 280, 200, 100, 'Sunset'], stamp: [820, 310, 110, 90, 'Stamp'] }
};
function tkSceneReal(name) { const P = window.PawArt; return !!P && ['WORLD_D_SCENES', 'WORLD_E_SCENES'].some((k) => Array.isArray(P[k]) && P[k].includes(name)); }
function tkFbHot(id, [x, y, w, h, label]) {
  return `<g data-hot="${id}" class="tk-fbhot"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#FFFBF3" fill-opacity=".86" stroke="#5B3D32" stroke-width="3" stroke-dasharray="${id === 'stamp' ? '6 5' : 'none'}"/>${id === 'stamp' ? `<circle cx="${x + w / 2}" cy="${y + h / 2 - 8}" r="${Math.min(w, h) / 3}" fill="none" stroke="#C8463D" stroke-width="3"/>` : ''}<text x="${x + w / 2}" y="${y + h - 14}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${label.length > 8 ? 24 : 28}" fill="#5B3D32">${esc(label)}</text></g>`;
}
function tkSceneArt(name, o) {
  if (!TK_PLACES[name]) return '';
  if (tkSceneReal(name)) return place(art('scene', name, o), 0, 0, 1000, 600);
  const base = sceneArt(TK_FB[name], o, {}).replace(/\s(data-hot|data-shop|role|tabindex)="[^"]*"/g, '').replace(/<g class="fbsign"[\s\S]*?<\/g>/, ''); // the stand-in's own hot spots and sign come off
  const hots = TK_FB_HOTS[name] || {};
  return `<g class="tk-fb" data-tk-fb="${name}">${base}${Object.keys(hots).map((k) => tkFbHot(k, hots[k])).join('')}${placeSign(name)}</g>`;
}

// scenery on the floor band a dog must not stand in (feet only), added to RM_SCENERY (37_roam.js): the Tokyo Tower planters, the Odaiba sandcastle
Object.assign(RM_SCENERY, { tokyotower: [[14, 516, 100, 70, 'scene'], [890, 540, 110, 50, 'scene']], odaiba: [[70, 512, 70, 52, 'scene']] });

/* ---- the town map: the Station pin (Bond 3). mapArt passes { station: true } and the lock while PLACES.station exists (TOKYO ART D draws
   <g data-area="station"> and adds it to MAP_AREAS). Until it does, the game adds this doodle pin. big: the 2400 x 1500 art map, fb: the fallback map */
const TK_MAP_PIN = { big: [1990, 1150], fb: [260, 1330] };
function tkTownTip() { return topBond() < TK_STATION_BOND ? `Station: Bond ${TK_STATION_BOND}` : 'Station: the Shinkansen to Tokyo'; } // the town map tooltip
function tkMapOpts() { return PLACES.station ? { station: true } : {}; }
function tkTrainDoodle() {
  return '<g stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"><path d="M-40 14 L-40 -8 Q-40 -20 -26 -20 L18 -20 Q42 -18 46 6 L46 14 Z" fill="#FFFBF3"/><path d="M-40 2 H44" stroke="#3E6FB0" stroke-width="5"/><rect x="-30" y="-14" width="14" height="10" rx="2" fill="#BFE6FA" stroke-width="2"/><rect x="-10" y="-14" width="14" height="10" rx="2" fill="#BFE6FA" stroke-width="2"/><path d="M14 -14 L30 -14 Q36 -12 38 -4 L14 -4 Z" fill="#BFE6FA" stroke-width="2"/><path d="M-46 22 H52" stroke-width="3"/></g>';
}
function tkMapPin(raw, at) {
  if (!PLACES.station || /data-area="station"/.test(raw || '')) return '';
  const P = PLACES.station, lock = topBond() < P.bond, [x, y] = at;
  return `<g data-area="station" class="fbpin tk-pin${lock ? ' locked' : ''}" transform="translate(${x} ${y})"><circle r="78" fill="#FFFBF3" stroke="#5B3D32" stroke-width="5"/><g transform="translate(0 -18) scale(1.1)">${tkTrainDoodle()}</g><text y="${lock ? 62 : 58}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="30" fill="#5B3D32">${esc(P.n)}</text>${lock ? `<g transform="translate(40 -66) rotate(8)"><rect x="-44" y="-18" width="88" height="34" rx="8" fill="#F28FA5" stroke="#5B3D32" stroke-width="3"/><text y="8" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="24" fill="#fff">Bond ${P.bond}</text></g>` : ''}</g>`;
}

/* ---- the Station: the ticket window ---- */
function tkLeadHome() { const d = D(); return !!(d && typeof staysHome === 'function' && staysHome(d)); }
function tkStation() {
  if (!S || !PLACES.station) return null; tkFields();
  if (topBond() < TK_STATION_BOND) { nope(`Nope. The Station opens at Bond ${TK_STATION_BOND}. The trains are very fast, so the friendship has to be too.`); return null; }
  if (S.sleeping) { nope(`${NAME()} is asleep. The trains will still be there later.`); return null; }
  if (tkLeadHome()) { nope(stayHomeLine(D())); return null; }
  const paid = tkTicket(), n = tkRideDogs().length;
  const p = openModal('Station', `<div class="tk-ticket"><span class="tk-tix" aria-hidden="true">${tkTicketArt()}</span><div><p><b>Shinkansen day ticket, ${TK_TICKET} coins:</b> ride to Tokyo and back as often as you like today.</p>
    <p class="small">${paid ? 'Your ticket is good until midnight. Hop on.' : `${n > 1 ? `All ${n} dogs ride on one ticket.` : `${esc(NAME())} rides for free with you.`} You have ${fmtC(S.coins)} Paw Coins.`}</p></div></div>`,
  { cls: 'tk-station', foot: `<button class="btn no" id="tkNo">Not today</button><button class="btn yes big" id="tkGo">${paid ? 'Ride to Tokyo' : `Buy a ticket (${TK_TICKET})`}</button>` });
  $('#tkNo', p).onclick = () => { SFX.click(); closeModal(); };
  $('#tkGo', p).onclick = () => tkBuy();
  return p;
}
function tkBuy() {
  if (!S) return false; tkFields();
  if (!tkTicket()) {
    if (S.coins < TK_TICKET) { nope(`Not enough coins. A day ticket is ${TK_TICKET}. A good walk or two will do it.`); return false; }
    S.coins -= TK_TICKET; S.tk.day = todayKey(); SFX.kaching(); trackAct('buy', { name: 'Train Ticket', cat: 'ticket', qty: 1, shop: 'station' }); markDirty(); updateHUD();
  }
  closeModal(); tkRide('out', () => go('japan')); return true;
}
function tkTicketArt() { const a = typeof artReal === 'function' && artReal('item', 'Train Ticket'); return a || `<svg viewBox="0 0 64 64"><rect x="6" y="16" width="52" height="32" rx="5" fill="#BFE6FA" stroke="#5B3D32" stroke-width="2.6"/><path d="M42 16 V48" stroke="#5B3D32" stroke-width="2" stroke-dasharray="3 3"/><g transform="translate(24 32) scale(.32)">${tkTrainDoodle()}</g></svg>`; }

/* ---- the Shinkansen ride: about 4 s, a tap skips it, instant with Motion off. Every dog's head at a window ---- */
function tkRideDogs() { if (!S) return []; const lead = D(); return [lead].concat(S.dogs.filter((d) => d !== lead && !staysHome(d))).slice(0, 6); }
// phones: the crop round the windows in use (at least three), so the heads are big on a narrow screen. [x, y, w, h] in scene units, null on desktop
const TK_WIN_X = [70, 220, 370, 520, 670, 820];
function tkRideCrop(n) {
  if (!isPhone()) return null; const k = clamp(n, 3, 6), A = PA().SHINKANSEN_WINDOWS;
  const wins = tkSceneReal('shinkansen') ? (Array.isArray(A) ? A.map((w) => (Array.isArray(w) ? w : [w.x, w.y, w.w, w.h])) : null) : TK_WIN_X.map((x) => [x - 14, 130, 140, 146]);
  if (!wins || wins.length < k) return null;
  const x0 = Math.max(0, wins[0][0] - 30), x1 = Math.min(1000, wins[k - 1][0] + wins[k - 1][2] + 30);
  return [x0, 90, x1 - x0, 470];
}
function tkRideSVG(dir, heads, still, crop) {
  if (tkSceneReal('shinkansen')) return art('scene', 'shinkansen', { dir, heads, still, time: timePhase(), weather: weatherNow(), season: seasonNow() });
  const W = TK_WIN_X, cx = crop ? crop[0] + crop[2] / 2 : 500, hole = W.map((x) => `M${x} 130 h112 a14 14 0 0 1 14 14 v118 a14 14 0 0 1 -14 14 h-112 a14 14 0 0 1 -14 -14 v-118 a14 14 0 0 1 14 -14 z`).join(' ');
  const hills = Array.from({ length: 14 }, (_, i) => `<path d="M${i * 220 - 40} 300 Q${i * 220 + 70} ${210 + (i % 3) * 18} ${i * 220 + 180} 300 Z" fill="${i % 2 ? '#BFD8A6' : '#A9CB8E'}" stroke="#5B3D32" stroke-width="2"/>`).join('');
  const poles = Array.from({ length: 22 }, (_, i) => `<path d="M${i * 140 + 30} 300 V170" stroke="#8A7468" stroke-width="4"/>`).join('');
  const fuji = '<g transform="translate(1500 300)"><path d="M-230 0 L-40 -190 Q0 -205 40 -190 L230 0 Z" fill="#9FB7D6" stroke="#5B3D32" stroke-width="3"/><path d="M-62 -168 L-40 -190 Q0 -205 40 -190 L62 -168 Q36 -150 20 -164 Q4 -146 -14 -162 Q-34 -146 -62 -168 Z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.4"/></g>';
  const strip = `<g class="tk-strip ${dir === 'home' ? 'home' : 'out'}${still ? ' still' : ''}"><rect x="-200" y="120" width="3400" height="200" fill="#CFE8F7"/>${hills}${fuji}<path d="M-200 300 H3200" stroke="#5B3D32" stroke-width="3"/>${poles}</g>`;
  const head = (h, i) => (h ? `<g class="tk-head">${place(h, W[i] + 10, 176, 90, 90)}</g>` : '');
  return `<svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg" class="tk-train"><defs><clipPath id="tkWin"><path d="${hole}"/></clipPath></defs><g clip-path="url(#tkWin)">${strip}</g>
    <path d="M0 0 H1000 V600 H0 Z ${hole}" fill="#F4EEE2" fill-rule="evenodd" stroke="#5B3D32" stroke-width="3"/><path d="M0 96 H1000" stroke="#3E6FB0" stroke-width="12"/><path d="M0 330 H1000" stroke="#3E6FB0" stroke-width="6"/>
    ${heads.map(head).join('')}${W.map((x) => `<path d="M${x - 10} 300 h132 v46 q0 14 -14 14 h-104 q-14 0 -14 -14 z" fill="#5E86B4" stroke="#5B3D32" stroke-width="3"/>`).join('')}
    <rect x="0" y="420" width="1000" height="180" fill="#E3D2BA" stroke="#5B3D32" stroke-width="3"/><text x="${cx}" y="500" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${crop ? 44 : 54}" fill="#5B3D32">${dir === 'home' ? 'Shinkansen home' : 'Shinkansen to Tokyo'}</text></svg>`;
}
function tkRide(dir, done) {
  if (!S || TK.ride) return false; tkFields();
  const fast = motionOff(), heads = tkRideDogs().map((d) => headSVG(d)), tok = ++TK.tok;
  S.tk.rides++; markDirty(); trackAct('ride', { dir });
  hideBubble(); if (typeof idleStop === 'function') idleStop();
  const finish = () => {
    if (!TK.ride || TK.ride.tok !== tok) return; const el = TK.ride.el; TK.ride = null; if (el) el.remove();
    if (typeof done === 'function') done();
    tkCare('ride', 700);
  };
  const el = document.createElement('div'); el.className = 'tk-ride' + (fast ? ' still' : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', dir === 'home' ? 'The Shinkansen ride home' : 'The Shinkansen ride to Tokyo');
  const crop = tkRideCrop(heads.length);
  el.innerHTML = `<div class="tk-ride-art">${tkRideSVG(dir, heads, fast, crop)}</div><button class="btn tk-skip" type="button">${fast ? 'Off we go' : 'Tap to skip'}</button>`;
  stage.appendChild(el); TK.ride = { el, tok, dir };
  const rs = crop && el.querySelector('.tk-ride-art > svg'); if (rs) rs.setAttribute('viewBox', crop.join(' '));
  el.addEventListener('click', () => { SFX.click(); finish(); });
  SFX.whoosh();
  if (fast) finish(); else tkLater(finish, TK_RIDE_MS);
  return true;
}

/* ---- the Japan map (go('japan')): the art map, else a doodle map, a pin per place (locked ones show the Bond), the Tokyo Station pin "Ride home",
   a Stamp book button. Pans and zooms like the town map (the same #mapPan / #mapInner and mapApply / mapZoomAt / mapCenter) ---- */
const TK_JP_W = 1600, TK_JP_H = 1000;
const TK_JP_PINS = { station: [900, 500], shibuya: [600, 610], yoyogi: [560, 390], asakusa: [1170, 330], ueno: [960, 250], tokyotower: [820, 730], odaiba: [1130, 830] };
function tkLocked() { return Object.keys(TK_PLACES).filter((k) => topBond() < TK_PLACES[k].bond); }
function tkJpPin(k, [x, y], lock, stamped) {
  const P = k === 'station' ? { n: 'Tokyo Station', bond: 1 } : TK_PLACES[k], label = P.n.replace(' and Sensō-ji', '').replace(' Dog Run', '');
  const ic = k === 'station' ? `<g transform="translate(0 -20) scale(1.05)">${tkTrainDoodle()}</g>` : `<g transform="translate(0 -14)"><circle r="26" fill="${lock ? '#E3D2BA' : '#F28FA5'}" stroke="#5B3D32" stroke-width="3"/><circle r="9" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2"/></g>`;
  return `<g data-area="${k}" class="fbpin tk-jpin${lock ? ' locked' : ''}" transform="translate(${x} ${y})"><circle r="78" fill="#FFFBF3" stroke="#5B3D32" stroke-width="5"/>${ic}<text y="${k === 'station' ? 40 : 46}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${label.length > 12 ? 27 : 30}" fill="#5B3D32">${esc(label)}</text>${k === 'station' ? '<text y="66" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="24" fill="#C8463D">Ride home</text>' : ''}${lock ? `<g transform="translate(40 -66) rotate(8)"><rect x="-44" y="-18" width="88" height="34" rx="8" fill="#F28FA5" stroke="#5B3D32" stroke-width="3"/><text y="8" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="24" fill="#fff">Bond ${P.bond}</text></g>` : ''}${stamped ? '<g transform="translate(-56 -56) rotate(-12)"><circle r="20" fill="#FFFBF3" stroke="#C8463D" stroke-width="3"/><path d="M-9 0 l6 7 l12 -14" fill="none" stroke="#C8463D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>' : ''}</g>`;
}
function tkJapanDoodle(locked, stamps) {
  const W = TK_JP_W, H = TK_JP_H;
  const bay = '<path d="M640 1000 C700 900 860 880 960 920 C1080 960 1200 900 1300 760 C1380 650 1500 600 1600 580 V1000 Z" fill="#CFE8F7" stroke="#5B3D32" stroke-width="4"/><text x="1380" y="900" font-family="Caveat,cursive" font-weight="700" font-size="40" fill="#5E86B4">Tokyo Bay</text>';
  const river = '<path d="M1240 0 C1220 140 1260 240 1220 380 C1190 500 1250 620 1220 760" fill="none" stroke="#9CC8EA" stroke-width="16" stroke-linecap="round"/>';
  const loop = '<ellipse cx="800" cy="470" rx="290" ry="250" fill="none" stroke="#7FB89A" stroke-width="8" stroke-dasharray="22 12"/><text x="800" y="200" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="30" fill="#5E8A6E">the Yamanote loop</text>';
  const fuji = '<g transform="translate(200 640)"><path d="M-170 120 L-30 -40 Q0 -54 30 -40 L170 120 Z" fill="#9FB7D6" stroke="#5B3D32" stroke-width="4"/><path d="M-48 -18 L-30 -40 Q0 -54 30 -40 L48 -18 Q26 -4 14 -16 Q2 0 -12 -14 Q-28 0 -48 -18 Z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="3"/><text y="164" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="34" fill="#5B3D32">Mt. Fuji</text></g>';
  const bridge = '<path d="M1010 900 Q1080 820 1150 900" fill="none" stroke="#F28FA5" stroke-width="6"/>';
  const pins = Object.keys(TK_JP_PINS).map((k) => tkJpPin(k, TK_JP_PINS[k], locked.includes(k), !!stamps[k])).join('');
  return `<rect width="${W}" height="${H}" fill="#FFFBF3"/><text x="${W / 2}" y="86" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="72" fill="#5B3D32">Tokyo, Japan</text>${bay}${river}${loop}${fuji}${bridge}<g id="sceneG" data-scene="japanmap" data-noenv="1"></g>${pins}`;
}
function tkJapanArt() {
  const locked = tkLocked(), bonds = {}, stamps = Object.assign({}, (S.tk && S.tk.stamps) || {});
  Object.keys(TK_PLACES).forEach((k) => { bonds[k] = TK_PLACES[k].bond; });
  if (tkArtReady()) {
    const raw = art('scene', 'japanmap', Object.assign({ locked, bonds, stamps }, envNow()));
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(raw || ''), W = m ? +m[1] : TK_JP_W, H = m ? +m[2] : TK_JP_H;
    return { W, H, svg: `<g id="sceneG" data-scene="japanmap" data-noenv="1">${place(raw, 0, 0, W, H)}</g>`, areas: Array.isArray(PA().JAPAN_AREAS) ? PA().JAPAN_AREAS : null };
  }
  return { W: TK_JP_W, H: TK_JP_H, svg: tkJapanDoodle(locked, stamps), areas: null };
}
function tkMapTip(k) {
  if (k === 'station') return 'Tokyo Station: ride home';
  const P = TK_PLACES[k]; if (!P) return k;
  if (S.place === k) return `${P.n}: you are here`;
  return topBond() < P.bond ? `${P.n}: Bond ${P.bond}` : `${P.n}: go and see`;
}
function tkPick(k) {
  SFX.click();
  if (k === 'station') { tkRide('home', () => { S.place = 'yard'; markDirty(); go('yard'); }); return true; }
  const P = TK_PLACES[k]; if (!P) return false;
  if (topBond() < P.bond) { nope(`Nope. ${P.n} opens at Bond ${P.bond}. Tokyo is big, there is no rush.`); return false; }
  if (S.place === k) { go('yard'); return true; }
  travelTo(k); return true;
}
// phones: tap a pin, then the confirm chip (as the town map)
function tkMapPick(k) {
  const chip = $('#mapGo'); if (!chip) return tkPick(k);
  const g = $(`#mapPan [data-area="${k}"]`); if (g) mapHighlight(g);
  const P = TK_PLACES[k], lock = P && topBond() < P.bond, here = S.place === k;
  chip.hidden = false; chip.dataset.k = k;
  chip.innerHTML = lock ? `<span>${esc(P.n)}: opens at Bond ${P.bond}</span>` : here ? `<span>You are here: ${esc(P.n)}</span><button class="btn" id="mapStay">Stay</button>` : `<button class="btn go big" id="mapGoBtn">${k === 'station' ? 'Ride home' : 'Go to ' + esc(P.n)}</button><button class="btn" id="mapNo" aria-label="Cancel">x</button>`;
  const gb = $('#mapGoBtn'); if (gb) gb.onclick = () => { chip.hidden = true; tkPick(k); };
  const st = $('#mapStay'); if (st) st.onclick = () => go('yard');
  const no = $('#mapNo'); if (no) no.onclick = () => { chip.hidden = true; const hi = $('#mapHi'); if (hi) hi.hidden = true; };
  SFX.click(); return true;
}
function enterJapan() {
  if (!S) return go('title');
  tkFields(); setChrome(true, false); hideBubble(); stage.classList.add('slimhud', 'tk-mapmode'); onCleanup(() => stage.classList.remove('tk-mapmode'));
  const A = tkJapanArt(), here = tkHere();
  view.innerHTML = `<div id="mapPan" class="mappan tk-jmap"><div id="mapInner" style="width:${A.W}px;height:${A.H}px"><svg class="world mapsvg" viewBox="0 0 ${A.W} ${A.H}" width="${A.W}" height="${A.H}" style="background:#FFFBF3">${A.svg}</svg><div id="mapHi" hidden></div><div id="mapPin" hidden>${PIN_SVG}<span>you are here</span></div></div></div>
    <button class="xbtn" id="mapX" aria-label="Back to ${esc(here ? TK_PLACES[S.place].n : 'Tokyo Station')}"${here ? '' : ' hidden'}>x</button>
    <div id="mapZoom"><button class="btn" id="mapZin" aria-label="Zoom in">+</button><span id="mapZoomLbl">100%</span><button class="btn" id="mapZout" aria-label="Zoom out">−</button></div>
    <button class="btn tk-bookbtn" id="tkBookBtn"><span class="ic" aria-hidden="true">${tkStampArt('shibuya', true, 30)}</span>Stamp book <b>${tkStampCount()}/7</b></button>
    <div id="mapTip" hidden role="tooltip"></div><div id="mapGo" hidden></div><div id="status"></div><button id="devBtn">dev</button>`;
  $('#mapX').onclick = () => { SFX.click(); if (tkHere()) go('yard'); };
  $('#tkBookBtn').onclick = () => { SFX.click(); tkBook(); };
  const pan = $('#mapPan'), inner = $('#mapInner'), svg = $('svg.world', view);
  const vw = pan.clientWidth || view.clientWidth, vh = pan.clientHeight || view.clientHeight;
  const base = isPhone() ? Math.max(vh / A.H, vw / A.W) * 0.98 : Math.min(vw / A.W, vh / A.H) * 0.98;
  MAPV = { W: A.W, H: A.H, vw, vh, base, z: 1, tx: 0, ty: 0, centers: {} };
  mapApply();
  const measure = () => { const s = MAPV.base * MAPV.z, ir = inner.getBoundingClientRect(); svg.querySelectorAll('[data-area]').forEach((g) => { const r = g.getBoundingClientRect(); MAPV.centers[g.getAttribute('data-area')] = [(r.left + r.width / 2 - ir.left) / s, (r.top + r.height / 2 - ir.top) / s]; }); (A.areas || []).forEach((a) => { MAPV.centers[a.id] = [a.x, a.y]; }); };
  measure(); mapCenter(here ? S.place : 'station', false); if (isPhone()) mapClearCtl();
  hotify(svg, '[data-area]', 'data-area', (k) => (isPhone() ? tkMapPick(k) : tkPick(k)), (k) => (k === 'station' ? 'Ride home from Tokyo Station' : TK_PLACES[k] ? `Go to ${TK_PLACES[k].n}${topBond() < TK_PLACES[k].bond ? ' (locked, Bond ' + TK_PLACES[k].bond + ')' : ''}` : k));
  tkMapDrag(pan);
  $('#mapZin').onclick = () => mapZoomAt(1.2, MAPV.vw / 2, MAPV.vh / 2); $('#mapZout').onclick = () => mapZoomAt(1 / 1.2, MAPV.vw / 2, MAPV.vh / 2);
  const onRs = () => { if (cur.mode !== 'japan') return; MAPV.vw = pan.clientWidth; MAPV.vh = pan.clientHeight; mapApply(); }; window.addEventListener('resize', onRs); onCleanup(() => window.removeEventListener('resize', onRs));
  tkMapOverlay(here ? S.place : 'station'); updateHUD(); bindDev();
  if (!here && !S.tk.seen.japan) { S.tk.seen.japan = 1; markDirty(); setTimeout(() => { if (cur.mode === 'japan') tkToast('Welcome to Tokyo! Pick a place on the map. Tokyo Station takes you home.', 'good'); }, 400); }
}
// drag pan, pinch and wheel zoom (pointer events), the same as the town map
function tkMapDrag(pan) {
  const pts = new Map(); let moved = 0, pinch = null, last = null;
  pan.addEventListener('pointerdown', (e) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) { moved = 0; last = { x: e.clientX, y: e.clientY }; } if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: MAPV.z }; } });
  pan.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size >= 2 && pinch) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = pan.getBoundingClientRect(); mapZoomAt((pinch.z * d / pinch.d) / MAPV.z, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); moved = 99; return; }
    const dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6) { if (!pan.classList.contains('dragging')) { pan.classList.add('dragging'); try { pan.setPointerCapture(e.pointerId); } catch (er) { /* none */ } } MAPV.tx += dx; MAPV.ty += dy; mapApply(); }
  });
  const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) setTimeout(() => pan.classList.remove('dragging'), 0); };
  pan.addEventListener('pointerup', up); pan.addEventListener('pointercancel', up);
  pan.addEventListener('click', (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);
  pan.addEventListener('wheel', (e) => { e.preventDefault(); const r = pan.getBoundingClientRect(); mapZoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
}
function tkMapOverlay(k) {
  const svg = $('svg.world', view); if (!svg) return;
  const tip = $('#mapTip'), hi = $('#mapHi'), pin = $('#mapPin'), inner = $('#mapInner');
  const rel = (g) => { const s = MAPV.base * MAPV.z, ir = inner.getBoundingClientRect(), r = g.getBoundingClientRect(); return { x: (r.left - ir.left) / s, y: (r.top - ir.top) / s, w: r.width / s, h: r.height / s }; };
  mapHighlight = (g) => { const r = rel(g); hi.hidden = false; Object.assign(hi.style, { left: r.x - 8 + 'px', top: r.y - 8 + 'px', width: r.w + 16 + 'px', height: r.h + 16 + 'px' }); };
  const show = (g) => { if ($('#mapPan').classList.contains('dragging')) return; mapHighlight(g); const a = g.getAttribute('data-area'), vr = view.getBoundingClientRect(), r = g.getBoundingClientRect(); tip.textContent = tkMapTip(a); tip.hidden = false; const tw = tip.offsetWidth; tip.style.left = clamp(r.left - vr.left + r.width / 2 - tw / 2, 8, vr.width - tw - 8) + 'px'; tip.style.top = Math.max(8, r.top - vr.top - 46) + 'px'; };
  const hide = () => { hi.hidden = true; tip.hidden = true; };
  svg.querySelectorAll('[data-area]').forEach((g) => { g.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !isPhone()) show(g); }); g.addEventListener('focus', () => { if (!isPhone()) show(g); }); g.addEventListener('pointerleave', hide); g.addEventListener('blur', hide); });
  const c = MAPV.centers[k];
  if (c && pin) {
    pin.hidden = false; pin.style.left = c[0] + 'px'; pin.style.top = (c[1] - 30) + 'px';
    const g = svg.querySelector(`[data-area="${k}"]`); if (isPhone() && g) { MAPV.pinBox = rel(g); mapApply(); } else MAPV.pinBox = null;
  }
}
// the Map button (the one 00_core.js line): in a Tokyo place it opens the Japan map, on a map it goes back to the place
function tkMapAct() {
  if (cur.mode === 'japan') { if (tkHere()) go('yard'); return; }
  if (cur.mode === 'map') return go('yard');
  return go(tkHere() ? 'japan' : 'map');
}

/* ---- stamps and the Stamp book ---- */
const tkStampCount = () => TK_STAMPS.filter((k) => S && S.tk && S.tk.stamps && S.tk.stamps[k]).length;
function tkStampArt(key, got, size = 120) {
  const a = window.PawArt && Array.isArray(PawArt.WORLD_E_PROPS) && PawArt.WORLD_E_PROPS.includes('ekistamp') ? art('prop', 'ekistamp', { key, got }) : '';
  if (a) return size === 120 ? a : `<svg viewBox="0 0 120 120" width="${size}" height="${size}">${place(a, 0, 0, 120, 120)}</svg>`;
  const lbl = (TK_STAMP_N[key] || key).split(' ');
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}"><circle cx="60" cy="60" r="50" fill="${got ? '#FDE3EA' : 'none'}" stroke="${got ? '#C8463D' : '#B7A79B'}" stroke-width="${got ? 5 : 3}" stroke-dasharray="${got ? 'none' : '8 7'}"/>${got ? `<circle cx="60" cy="60" r="40" fill="none" stroke="#C8463D" stroke-width="2"/>${lbl.map((w, i) => `<text x="60" y="${64 + (i - (lbl.length - 1) / 2) * 24}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${w.length > 7 ? 22 : 26}" fill="#C8463D">${esc(w)}</text>`).join('')}` : ''}</svg>`;
}
function tkStamp(key) {
  if (!S || !TK_STAMPS.includes(key)) return null; tkFields();
  if (S.tk.stamps[key]) { SFX.click(); toast(`The ${TK_STAMP_N[key]} stamp is already in your book.`); return false; }
  S.tk.stamps[key] = localISO(); const b = addBond(TK_STAMP_PTS, { raw: true }); SFX.boop(760); markDirty();
  tkToast(`Stamp! The ${TK_STAMP_N[key]} stamp is in your book (${tkStampCount()} of 7). +${b} Bond.`, 'good');
  trackAct('stamp', { key });
  if (TK_STAMPS.every((k) => S.tk.stamps[k]) && !S.tk.frame) { S.tk.frame = true; markDirty(); setTimeout(() => { SFX.fanfare(); tkToast('All seven stamps! The Tokyo photo frame is yours. Find it in photo mode.', 'gold'); }, 1400); }
  return true;
}
function tkBook() {
  if (!S) return null; tkFields(); const n = tkStampCount();
  const cells = TK_STAMPS.map((k) => { const got = S.tk.stamps[k]; return `<div class="tk-stamp${got ? ' got' : ''}" data-stamp="${k}"><span class="tk-sart">${tkStampArt(k, !!got)}</span><b>${esc(TK_STAMP_N[k])}</b><span class="small">${got ? 'Stamped' : 'Not yet'}</span></div>`; }).join('');
  return openModal('Stamp book', `<p class="small">${n === 7 ? 'All seven stamps. The Tokyo photo frame is in photo mode.' : `${n} of 7 stamps. Every place in Tokyo has its own station stamp, and Hachikō has one too. All seven unlock a photo frame.`}</p><div class="tk-book">${cells}</div>`, { cls: 'tk-bookpop' });
}

/* ---- the tokyo photo frame (35_photo.js lists it once S.tk.frame): TOKYO ART E's postcard prop, else world B's rose card with the seven stamps
   doodled along the top edge ---- */
function tkFrameList() { return S && S.tk && S.tk.frame ? [{ k: 'tokyo', n: 'Tokyo stamps', c: '#E46A5E' }] : []; }
function tkPostcard(w, h, o) {
  const P = window.PawArt;
  if (Array.isArray(P.WORLD_E_PROPS) && P.WORLD_E_PROPS.includes('postcard')) { const a = P.prop('postcard', Object.assign({}, o, { frame: 'tokyo', w, h })); if (a) return a; }
  const svg = P.postcard(w, h, Object.assign({}, o, { color: 'rose' })), s = Math.max(w, h) / 450, r = 11 * s, gap = (w - 60 * s) / 7;
  const row = TK_STAMPS.map((k, i) => `<g transform="translate(${(30 * s + gap * (i + 0.5)).toFixed(1)} ${(8 * s).toFixed(1)}) rotate(${(i % 2 ? 8 : -8)})"><circle r="${r.toFixed(1)}" fill="#FDE3EA" stroke="#C8463D" stroke-width="${(1.6 * s).toFixed(1)}"/><circle r="${(r * 0.72).toFixed(1)}" fill="none" stroke="#C8463D" stroke-width="${(0.7 * s).toFixed(1)}"/><text y="${(3.4 * s).toFixed(1)}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${(10 * s).toFixed(1)}" fill="#C8463D">${esc(TK_STAMP_N[k].slice(0, 1))}</text></g>`).join('');
  return svg.replace(/<\/svg>\s*$/, `<g class="tk-frame">${row}</g></svg>`);
}

/* ---- walking the pack to a spot (Hachikō, the crossing, the lantern, the picnic, the shore). Holds roaming (rmPause('tk')) while it runs ---- */
function tkHotBox(id) {
  const svg = $('#view > svg.world'), el = svg && svg.querySelector(`#sceneG [data-hot="${id}"]`); if (!el || !svg.getScreenCTM()) return null;
  return rmWorldBox(svg, svg.getScreenCTM().inverse(), el);
}
// spots for the pack: in front of box b (feet just below it, inside the floor band), the leader in the middle, the others either side
function tkSpotsBy(b, dogs) {
  const z = rmZoneOf(S.place), cx = b ? clamp(b[0] + b[2] / 2, 140, 860) : 500, y = b ? clamp(b[1] + b[3] + 26, z.y0 + 10, z.y1 - 6) : z.y0 + 40;
  return dogs.map((d, i) => [clamp(cx + [0, -120, 120, -230, 230, -330][i % 6], 90, 910), clamp(y + (i % 2) * 20, z.y0, z.y1)]);
}
function tkGather(dogs, spots, o, then) {
  const tok = ++TK.tok, fast = motionOff(); let left = dogs.length;
  TK.busy = true; busy = true; rmPause('tk'); hideBubble(); if (typeof idleStop === 'function') idleStop();
  const arrive = () => { if (--left > 0 || tok !== TK.tok) return; then(tok); };
  dogs.forEach((d, i) => {
    let [x, y] = spots[i], q = rmNear(d, x, y, false); const far = (a) => !a || Math.hypot(a[0] - x, a[1] - y) > 150;
    if (far(q)) q = rmNear(d, x, y, 'loose'); if (!far(q)) [x, y] = q; else if (rmHard(x, y)) y = rmZoneOf(S.place).y1 - 4; // a free spot near the target, else the target itself (never inside a box)
    const face = o.faceAt != null ? (o.faceAt < x ? 'left' : 'right') : o.face || 'right';
    if (fast) { rmSet(d, { x, y, face, pose: o.pose || 'idle' }); const r = rmSt(d); r.hx = x; r.hy = y; arrive(); }
    else rmTo(d, x, y, { pose: o.pose || 'idle', face, anchor: true, done: arrive });
  });
  if (!fast) tkLater(() => { if (tok === TK.tok && left > 0) { left = 1; arrive(); } }, TK_WALK_MAX); // a dog that could not get there in time never holds the rest
  return tok;
}
function tkRelease(tok, ms) {
  tkLater(() => { if (tok !== TK.tok) return; TK.busy = false; busy = false; rmResume('tk'); if (tkInPlace()) { renderDog(dogPoseNow(), rmSt(D()).face, true); tkPlaceBtns(); } }, motionOff() ? 200 : ms == null ? TK_HOLD_MS : ms);
}
// the scene was rebuilt or left mid-action: the reward is already paid at arrival, roaming simply goes on
function tkReset() { TK.t.forEach(clearTimeout); TK.t = []; TK.pending = 0; TK.tok++; if (TK.busy) { TK.busy = false; busy = false; } RM.paused.delete('tk'); }
const tkCan = () => tkInPlace() && !TK.busy && !busy && !S.sleeping && !(typeof blOn === 'function' && blOn());
function tkCant() { if (S && S.sleeping) { nope(`${NAME()} is asleep. Tokyo can wait a minute.`); return true; } if (!tkCan()) return true; return false; }

/* ---- Hachikō (Shibuya): once a day the pack sits by the statue, +15 Bond points, the hachiko stamp. The first time, the story ---- */
const TK_HACHI_STORY = 'Hachikō waited at Shibuya Station for his person every day for years. People still meet here, by his statue.';
function tkHachiko() {
  if (!S || S.place !== 'shibuya' || tkCant()) return null; tkFields();
  if (tkToday('hachi')) { SFX.click(); toast(`${NAME()} already sat with Hachikō today. He will be here tomorrow too. He always is.`); return false; }
  const b = tkHotBox('hachiko'), dogs = tkPack(), first = !S.tk.stamps.hachiko;
  tkGather(dogs, tkSpotsBy(b, dogs), { pose: 'sit', faceAt: b ? b[0] + b[2] / 2 : 300 }, (tok) => {
    S.tk.hachi = localISO(); const pts = addBond(TK_HACHI_PTS, { raw: true }); markDirty(); SFX.boop(620);
    tkToast(`${dogs.length > 1 ? 'The pack sat' : `${NAME()} sat`} quietly with Hachikō for a while. +${pts} Bond.`, 'good');
    tkStamp('hachiko');
    if (first) setTimeout(() => tkToast(TK_HACHI_STORY, 'gold'), 1600);
    tkRelease(tok, 3200);
  });
  return true;
}
// the scramble: every dog walks to the far side together, then roams again
function tkCross() {
  if (!S || S.place !== 'shibuya' || tkCant()) return null;
  const dogs = tkPack(), z = rmZoneOf(S.place), lead = rmSt(D()), toLeft = lead.x > 500;
  const spots = dogs.map((d, i) => [toLeft ? 150 + (i % 3) * 110 : 850 - (i % 3) * 110, clamp(z.y0 + 40 + i * 30, z.y0, z.y1)]);
  tkGather(dogs, spots, { pose: 'happy', face: toLeft ? 'left' : 'right' }, (tok) => {
    SFX.boop(700); const h = rmHead(D()); say(PICK(['We crossed! All of us! Together!', 'That was the busiest road ever. We did it.', 'Everybody made it. Good pack.']), h.x, h.y, 2600);
    tkRelease(tok, 1400);
  });
  return true;
}
// the photo spot under the giant lantern: the pack gathers, then photo mode opens
function tkLantern() {
  if (!S || S.place !== 'asakusa' || tkCant()) return null;
  const b = tkHotBox('lantern'), dogs = tkPack();
  tkGather(dogs, tkSpotsBy(b, dogs), { pose: 'sit', face: 'right' }, (tok) => {
    TK.busy = false; busy = false; rmResume('tk'); TK.tok++;
    if (typeof phOpen === 'function' && !phOpen()) toast('Everyone is under the lantern. Say cheese.');
  });
  return true;
}

/* ---- Omikuji (Asakusa): once a day, 10 coins, always a kind fortune for the leader ---- */
const TK_FORTUNES = ['Great luck! Naps will be long and sunny.', 'Great luck! A new friend is waiting around the next corner.', 'Good luck! Every stick found this week will be the best stick.', 'Great luck! The softest cushion in the house will be free when you want it.', 'Small luck, which is still luck! Your tail will wag at least a hundred times today.', 'Great luck! Someone you love will say good dog many times today.'];
function tkOmikuji() {
  if (!S || S.place !== 'asakusa' || tkCant()) return null; tkFields();
  if (tkToday('omi')) { SFX.click(); toast(`${NAME()} has today's fortune already. One a day keeps the luck fresh.`); return false; }
  if (S.coins < TK_OMI_PRICE) { nope(`An omikuji is ${TK_OMI_PRICE} coins. A walk or two will cover it.`); return false; }
  S.coins -= TK_OMI_PRICE; S.tk.omi = localISO(); addStat('happy', 5); SFX.kaching(); markDirty(); updateHUD();
  const f = PICK(TK_FORTUNES), p = openModal('Omikuji', `<div class="tk-omi"><span class="tk-omipaper" aria-hidden="true"><svg viewBox="0 0 60 120"><rect x="8" y="4" width="44" height="112" rx="4" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.6"/><rect x="16" y="12" width="28" height="16" fill="#C8463D"/><path d="M18 40 H42 M18 52 H42 M18 64 H36 M18 76 H42 M18 88 H32" stroke="#8A7468" stroke-width="2.4"/></svg></span><div><p>${esc(NAME())} gives the box a shake and a little paper slip drops out.</p><p class="tk-fortune"><b>${esc(f)}</b></p><p class="small">In Japan you tie the slip to a rack at the temple before you go. +5 Happiness.</p></div></div>`, { foot: '<button class="btn yes big" id="tkOmiOk">Lucky dog!</button>' });
  $('#tkOmiOk', p).onclick = () => { SFX.boop(720); closeModal(); };
  setTemp('happy', 1400); return f;
}

/* ---- Nakamise (Asakusa): one dog-safe treat a day for every dog here, served like the café ---- */
const TK_SNACKS = ['Sweet Potato Chew', 'Dog Senbei'];
function tkNakamise() {
  if (!S || S.place !== 'asakusa' || tkCant()) return null; tkFields();
  const done = tkToday('snack'), dogs = tkPack(), n = dogs.length;
  const items = TK_SNACKS.map((nm) => FOOD.find((f) => f.n === nm)).filter(Boolean);
  const p = openModal('Nakamise treats', `<p class="small">"Welcome! One treat a day for every dog, made just for dogs." ${done ? '<b>The pack already had today\'s treat.</b>' : `${n > 1 ? `${n} dogs, one treat each.` : ''}`} You have ${fmtC(S.coins)} Paw Coins.</p><div class="shopgrid">${items.map((it) => `<div class="sitem"><span class="art">${itemArt(it.n)}</span><b>${esc(it.n)}</b><span class="desc">${esc(it.note)}</span><span class="small sh-tip">${esc(it.tip)}</span>${priceHTML(it.price * n)}<button class="btn yes" data-tksnack="${esc(it.n)}" ${done ? 'aria-disabled="true"' : ''}>${n > 1 ? 'Treat everyone' : 'Order and serve'}</button></div>`).join('')}</div>`, { cls: 'shop tk-snackpop' });
  p.querySelectorAll('[data-tksnack]').forEach((b) => { b.onclick = () => tkSnackBuy(b.dataset.tksnack); });
  return p;
}
function tkSnackBuy(name) {
  const it = FOOD.find((f) => f.n === name); if (!S || !it) return false; tkFields();
  if (tkToday('snack')) { nope('One Nakamise treat per dog a day. Everybody is pretending not to know that.'); return false; }
  const dogs = tkPack(), cost = it.price * dogs.length;
  if (S.coins < cost) { nope('Not enough coins. The stall keeper smiles and says come back later.'); return false; }
  S.coins -= cost; S.tk.snack = localISO(); SFX.kaching(); closeModal(); markDirty();
  dogs.forEach((d) => { d.stats.hunger = clamp(d.stats.hunger + (it.hunger || 0), 0, 100); d.stats.happy = clamp(d.stats.happy + (it.happy || 0), 0, 100); });
  trackAct('feed', { name: it.n, tokyo: true }); renderDog('eat', rmSt(D()).face, true); SFX.slurp(); setTimeout(() => { if (tkInPlace()) { setTemp('happy', 1400); } }, 1300);
  updateHUD(); toast(`${dogs.length > 1 ? 'Everyone' : NAME()} crunched a ${it.n}. ${it.n === 'Dog Senbei' ? 'Crunch, crunch, gone.' : 'Chewy and sweet, and gone in a minute.'} +${it.happy} Happiness.`, 'good');
  return true;
}

/* ---- souvenir stands: sold here only, never in the town shops (tokyo: true, fest: 'tokyo' keeps them off every shop list) ---- */
const TK_SOUVENIRS = { shibuya: ['Shibuya Bandana'], asakusa: ['Asakusa Bandana', 'Lucky Cat'], tokyotower: ['Tokyo Tower Bandana', 'Shinkansen Plush'] };
function tkSouvenirItems(pl) {
  return (TK_SOUVENIRS[pl] || []).map((n) => { const c = CLOTHES.find((x) => x.n === n), t = TOYS.find((x) => x.n === n), d = HM_DECOR[n];
    return c ? { cat: 'clothes', n, price: c.price, desc: `${SLOT_NAME[c.slot]}. ${c.perk}` } : t ? { cat: 'toys', n, price: t.price, desc: t.note } : d ? { cat: 'decor', n, price: d.price, desc: d.story } : null; }).filter(Boolean);
}
function tkOwned(it) { return it.cat === 'decor' ? !!(S.decor && S.decor[it.n]) : owns(it.cat, it.n); }
function tkShop() {
  if (!S || !TK_SOUVENIRS[S.place]) return null;
  const items = tkSouvenirItems(S.place);
  const card = (it) => `<div class="sitem" data-cat="${it.cat}"><span class="art">${itemArt(it.n)}</span><b>${esc(it.n)}</b><span class="desc">${esc(it.desc)}</span>${priceHTML(it.price)}${tkOwned(it) ? '<span class="chip own">Owned</span>' : `<button class="btn yes" data-tkbuy="${esc(it.n)}">Buy</button>`}</div>`;
  const p = openModal('Souvenirs', `<p class="small">"Only here, only in Tokyo." You have ${fmtC(S.coins)} Paw Coins.</p><div class="shopgrid">${items.map(card).join('')}</div>`, { cls: 'shop tk-shop' });
  p.querySelectorAll('[data-tkbuy]').forEach((b) => { b.onclick = () => tkShopBuy(b.dataset.tkbuy, p); });
  return p;
}
async function tkShopBuy(name, p) {
  const it = tkSouvenirItems(S.place).find((x) => x.n === name); if (!it || tkOwned(it)) return false; SFX.click();
  const q = p ? await buyWindow(p, { art: itemArt(it.n), name: it.n, desc: it.desc, price: it.price, stack: false, owned: false, have: 0, haveLabel: 'Owned' }) : 1; if (!q || tkOwned(it)) return false;
  if (S.coins < it.price) { nope('Not enough coins. The souvenirs will still be here on your next trip.'); return false; }
  S.coins -= it.price; SFX.kaching(); trackAct('buy', { name: it.n, cat: it.cat, qty: 1, shop: 'tokyo' });
  if (it.cat === 'decor') { hmDecorFields(); S.decor[it.n] = { got: localISO(), out: false }; } else S.inv[it.cat].push(it.n);
  markDirty(); updateHUD();
  toast(`Bought the ${it.n}. ${it.cat === 'decor' ? 'It is waiting at home, ready to put out in the yard or the house.' : it.cat === 'toys' ? 'It is in the Play menu now.' : 'Wrapped in paper with a little stamp on it.'}`, 'gold');
  const pp = tkShop(), pn = pp && $('.panel', modal);
  if (it.cat === 'clothes' && pn) confirmIn(pn, `Put the ${esc(it.n)} on ${esc(NAME())} now?`, 'Wear it', 'Later').then((w) => { if (w) equip(it.n, true); }); // not awaited: the purchase is done either way
  return true;
}

/* ---- Ueno: hanami (spring), momiji (autumn) or a rest by the pond, once a day. Odaiba: a sunset walk along the shore, once a day ---- */
function tkUenoKind() { const s = seasonNow(); return s === 'spring' ? 'hanami' : s === 'autumn' ? 'momiji' : 'pond'; }
const TK_UENO = { hanami: ['Hanami picnic', 'A blanket under the cherry blossoms. Petals land on every nose. +8 Happiness for the pack.'], momiji: ['Momiji walk', 'Red maple leaves crunch under every paw. +8 Happiness for the pack.'], pond: ['Rest by the pond', 'A quiet sit by Shinobazu pond, watching the ducks. +8 Happiness for the pack.'] };
function tkHanami() {
  if (!S || S.place !== 'ueno' || tkCant()) return null; tkFields();
  const k = tkUenoKind();
  if (tkToday('hanami')) { SFX.click(); toast('The pack had its Ueno rest today. The park will be just as lovely tomorrow.'); return false; }
  const b = tkHotBox('hanami'), dogs = tkPack();
  tkGather(dogs, tkSpotsBy(b, dogs), { pose: k === 'momiji' ? 'happy' : 'down', faceAt: b ? b[0] + b[2] / 2 : 500 }, (tok) => {
    S.tk.hanami = localISO(); tkPackHappy(8); SFX.boop(660); if (k !== 'pond') tkPetals(k);
    tkToast(TK_UENO[k][1], 'good'); tkRelease(tok, 3000);
  });
  return true;
}
function tkPetals(k) {
  const fx = $('#fx'); if (!fx || motionOff()) return;
  for (let i = 0; i < 14; i++) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'tk-petal');
    el.style.setProperty('--dx', RINT(-60, 60) + 'px'); el.style.animationDelay = (i * 120) + 'ms';
    el.innerHTML = k === 'momiji' ? `<path transform="translate(${RINT(150, 850)} ${RINT(60, 200)}) rotate(${RINT(0, 360)})" d="M0 -10 L3 -3 L10 -4 L5 2 L7 9 L0 5 L-7 9 L-5 2 L-10 -4 L-3 -3 Z" fill="#E4553F" stroke="#5B3D32" stroke-width="1"/>` : `<ellipse transform="translate(${RINT(150, 850)} ${RINT(60, 200)}) rotate(${RINT(0, 360)})" rx="7" ry="4.5" fill="#F7B2C4" stroke="#5B3D32" stroke-width="1"/>`;
    fx.appendChild(el); setTimeout(() => el.remove(), 3600);
  }
}
function tkSunset() {
  if (!S || S.place !== 'odaiba' || tkCant()) return null; tkFields();
  if (tkToday('sunset')) { SFX.click(); toast('The pack had its sunset walk today. The sun sets again tomorrow, right on time.'); return false; }
  const dogs = tkPack(), z = rmZoneOf(S.place), lead = rmSt(D()), toLeft = lead.x > 500, svg = $('#view > svg.world');
  if (svg && !motionOff()) svg.classList.add('tk-dusk');
  const spots = dogs.map((d, i) => [toLeft ? 160 + i * 90 : 840 - i * 90, z.y1 - 20 - (i % 2) * 24]);
  tkGather(dogs, spots, { pose: 'idle', face: toLeft ? 'left' : 'right' }, (tok) => {
    S.tk.sunset = localISO(); tkPackHappy(8); SFX.boop(560);
    tkToast(`${dogs.length > 1 ? 'The pack' : NAME()} walked along the shore as the sun went down behind the Rainbow Bridge. +8 Happiness${dogs.length > 1 ? ' for the pack' : ''}.`, 'good');
    tkLater(() => { const s2 = $('#view > svg.world'); if (s2) s2.classList.remove('tk-dusk'); }, motionOff() ? 0 : 2000);
    tkRelease(tok, 2200);
  });
  return true;
}
function tkBall() { if (!S || S.place !== 'yoyogi' || tkCant()) return null; const t = Object.keys(BL_TOYS).find((n) => owns('toys', n)) || 'Tennis Ball'; return blStart(t); }

/* ---- the hot spots and the place buttons ---- */
function tkHot(id) {
  if (!tkInPlace()) return null;
  const f = { stamp: () => tkStamp(S.place), hachiko: tkHachiko, crossing: tkCross, omikuji: tkOmikuji, nakamise: tkNakamise, lantern: tkLantern, souvenir: tkShop, hanami: tkHanami, sunset: tkSunset }[id];
  return f ? f() : null;
}
const TK_HOT_LABEL = { stamp: 'Get the station stamp', hachiko: 'Sit with Hachikō', crossing: 'Cross the scramble together', omikuji: 'Draw an omikuji fortune', nakamise: 'Nakamise treats', lantern: 'Photo under the lantern', souvenir: 'Souvenirs', hanami: 'The picnic spot', sunset: 'A sunset walk' };
function tkBindHots() {
  const svg = $('#view > svg.world'); if (!svg || !tkHere()) return;
  svg.querySelectorAll('#sceneG [data-hot]').forEach((g) => {
    const k = g.getAttribute('data-hot'); if (g.dataset.tkb) return; g.dataset.tkb = '1';
    g.classList.add('hot'); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', TK_HOT_LABEL[k] || k);
    if (!g.dataset.tkh) { g.dataset.tkh = '1'; g.addEventListener('click', () => { SFX.init(); tkHot(k); }); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tkHot(k); } }); }
  });
}
function tkPlaceBtns() {
  const pb = $('#placeBtns'); if (!pb) return; pb.querySelectorAll('[data-tk]').forEach((b) => b.remove()); pb.classList.toggle('tk-row', tkHere());
  if (!tkHere() || cur.mode !== 'yard') return;
  const home = pb.querySelector('[data-pb="yard"]'); if (home) home.remove(); // from Tokyo, home is a train ride away (Tokyo Station on the Japan map)
  const P = S.place, b = [];
  if (P === 'shibuya') b.push(['hachiko', tkToday('hachi') ? 'Sat with Hachikō' : 'Sit with Hachikō', tkToday('hachi')]);
  if (P === 'yoyogi') b.push(['ball', 'Ball play', false]);
  if (P === 'asakusa') b.push(['omikuji', tkToday('omi') ? 'Fortune drawn' : `Omikuji (${TK_OMI_PRICE})`, tkToday('omi')], ['nakamise', 'Treats', false]);
  if (P === 'ueno') b.push(['hanami', TK_UENO[tkUenoKind()][0], tkToday('hanami')]);
  if (P === 'tokyotower') b.push(['souvenir', 'Souvenirs', false]);
  if (P === 'odaiba') b.push(['sunset', tkToday('sunset') ? 'Walked at sunset' : 'Sunset walk', tkToday('sunset')]);
  b.push(['map', 'Japan map', false]);
  pb.insertAdjacentHTML('beforeend', b.map(([k, t, done]) => `<button class="btn ${k === 'map' ? '' : done ? 'tk-done' : 'yes'}" data-tk="${k}"${done ? ' aria-disabled="true"' : ''}>${esc(t)}</button>`).join(''));
  pb.querySelectorAll('[data-tk]').forEach((x) => { x.onclick = () => { const k = x.dataset.tk; if (k === 'map') { SFX.click(); go('japan'); } else if (k === 'ball') tkBall(); else tkHot(k); }; });
}

/* ---- bus ---- */
on('game:ready', () => { tkFields(); tkPlaceSync(); setTimeout(tkExpose, 0); });
on('yard:enter', () => {
  tkFields(); tkExpose(); tkReset();
  const svg = $('#view > svg.world'); if (svg) svg.classList.remove('tk-dusk');
  tkPlaceBtns(); tkBindHots();
  if (tkHere()) { tkCare(S.place, 1600); requestAnimationFrame(() => requestAnimationFrame(tkLeadClear)); }
});
// the leader steps off a hot spot it was put on (rmValidate leaves the leader alone under the harness): Hachikō, the signal, a stall stay tappable
function tkLeadClear() {
  if (!tkInPlace() || TK.busy || busy || S.sleeping) return; const d = D(), r = rmSt(d); if (r.tw || rmOk(d, r.x, r.y, rmK(r))) return;
  const q = rmNear(d, r.x, r.y) || rmNear(d, r.x, r.y, false); if (!q) return; rmSet(d, { x: q[0], y: q[1] }); r.hx = q[0]; r.hy = q[1]; if (isPhone()) phHomeRefit();
}
on('scene:redraw', () => { if (tkInPlace()) { tkBindHots(); if (!$('#placeBtns [data-tk]')) tkPlaceBtns(); } });
on('day:new', () => { if (tkInPlace() && !TK.busy) tkPlaceBtns(); });

/* ---- tests: window.__paw.tk ---- */
function tkExpose() {
  if (!window.__paw) return;
  window.__paw.tk = {
    allow: (v) => { prefs.tkTest = !!v; tkPlaceSync(); return tkOn(); }, on: () => tkOn(), here: () => tkHere(), artReady: () => tkArtReady(),
    ride: (dir) => tkRide(dir || 'out', dir === 'home' ? () => { S.place = 'yard'; go('yard'); } : () => go('japan')), get riding() { return !!TK.ride; },
    stamps: () => Object.assign({}, S && S.tk ? S.tk.stamps : {}), book: () => !!tkBook(), places: () => Object.keys(TK_PLACES).filter((k) => !!PLACES[k]),
    station: () => !!tkStation(), buy: () => tkBuy(), pick: (k) => tkPick(k), hot: (id) => tkHot(id), stamp: (k) => tkStamp(k), shop: () => !!tkShop(), shopBuy: (n) => tkShopBuy(n), snack: (n) => tkSnackBuy(n),
    mapAct: () => tkMapAct(), care: Object.assign({}, TK_CARE), story: TK_HACHI_STORY, fortunes: TK_FORTUNES.slice(), lines: JSON.parse(JSON.stringify(TK_LINES)), souvenirs: JSON.parse(JSON.stringify(TK_SOUVENIRS)),
    fbHots: JSON.parse(JSON.stringify(TK_FB_HOTS)), pins: JSON.parse(JSON.stringify(TK_JP_PINS)), real: (n) => tkSceneReal(n), get busy() { return TK.busy; }, get pending() { return TK.pending; }
  };
}
setTimeout(tkExpose, 0);
