/* Paw Haven v1.2: WALK MINI-GAME (runner + treasure hunt)  ->  window.PawWalk
   PawWalk.start(el, o) -> { stop() }   (contract: V12.md)
   The dog auto-runs right. Three height bands: LOW (walk to grab, jump to avoid), MID (walk or hop),
   HIGH (jump to grab, crouch to avoid). Tap jump = hop, HOLD jump = long floaty jump that clears puddles.
   Fixed 120 Hz timestep, coyote time, jump buffering, ~70% hitboxes, no fail state.
   The v1.1 treasure hunt lives inside the run: Nose-o-meter, sniff clues, 3-4 X dig spots, 2-3 digs. */
(function () {
'use strict';
if (typeof window === 'undefined') return;

/* ------------------------------------------------------------------ tuning */
const INK = '#5B3D32', PAPER = '#FFFBF3';
const G = 330;                  // ground line (world units, same as walkStrip)
const VIEW_H = 400;             // world units shown vertically
const STEP = 1 / 120;           // fixed timestep
const PH = { V0: 450, GRAV: 950, GLONG: 520, LONG_T: 0.1, FAST: 2.6, COYOTE: 0.1, BUFFER: 0.12 };
const DOG = { x: 200, off: 6, hw: 22, feet: 15, hStand: 70, hCrouch: 40 };
const HIGH_BOTTOM = 58;         // drawn bottom of HIGH obstacles above the ground
const COIN_H = { low: 18, mid: 50, high: 120 };
const COIN_R = 16;
const AREAS = {
  park:  { v: [190, 225], gap: [1.5, 2.2, 1.05, 1.6], combo: 0.5,  low: ['log', 'sprinkler'], wide: ['puddle'], high: ['branch', 'kite'], w: [0.45, 0.2, 0.35], happy: 15, energy: 15, clean: 5, bond: 8 },
  river: { v: [195, 235], gap: [1.4, 2.1, 1.0, 1.55], combo: 0.45, low: ['rock'], wide: ['puddle', 'mud'], high: ['bird', 'sign'], w: [0.38, 0.3, 0.32], happy: 20, energy: 25, clean: 10, bond: 11 },
  woods: { v: [200, 240], gap: [1.35, 2.0, 0.95, 1.5], combo: 0.4,  low: ['log', 'rock'], wide: ['mud'], high: ['branch', 'bird'], w: [0.45, 0.2, 0.35], happy: 25, energy: 30, clean: 15, bond: 13 },
  beach: { v: [210, 250], gap: [1.3, 1.9, 0.9, 1.4], combo: 0.35, low: ['crab', 'sandcastle'], wide: ['puddle'], high: ['kite', 'bunting'], w: [0.45, 0.2, 0.35], happy: 30, energy: 30, clean: 20, bond: 15 },
  // v1.6 routes. len = default length (s) when the game passes no durationSec; lamps:false = no street lamps at night (open trail);
  // fg = foreground strip style; rainWide = what rain adds (default puddle + mud)
  town:    { v: [185, 220], gap: [1.6, 2.3, 1.1, 1.7], combo: 0.55, low: ['cat', 'trashcan', 'hydrant'], wide: ['bicycle'], high: ['awning', 'sign'], w: [0.5, 0.14, 0.36], rainWide: ['puddle'], len: 60, fg: 'town', happy: 15, energy: 15, clean: 5, bond: 8 },
  hilltop: { v: [200, 240], gap: [1.35, 2.0, 0.95, 1.5], combo: 0.4, low: ['rock', 'log', 'molehill'], wide: [], high: ['kite', 'bird'], w: [0.55, 0, 0.45], rainWide: ['mud'], len: 75, lamps: false, happy: 22, energy: 28, clean: 10, bond: 12 },
  pier:    { v: [205, 245], gap: [1.3, 1.9, 0.9, 1.45], combo: 0.38, low: ['crate', 'ropecoil'], wide: ['puddle'], high: ['seagull', 'fishingline'], w: [0.45, 0.2, 0.35], rainWide: ['puddle'], len: 75, fg: 'pier', happy: 26, energy: 28, clean: 12, bond: 14 }
};
// obstacle art: viewBox (per V12.md) and draw scale k (world units = vb * k)
const OBS = {
  log: { vb: [120, 50], k: 0.7, cat: 'low' }, rock: { vb: [80, 50], k: 0.8, cat: 'low' },
  sprinkler: { vb: [70, 70], k: 0.85, cat: 'low' }, snowdrift: { vb: [140, 60], k: 0.65, cat: 'low' },
  crab: { vb: [70, 44], k: 0.95, cat: 'low' }, sandcastle: { vb: [90, 70], k: 0.7, cat: 'low' },
  puddle: { vb: [220, 24], k: 1.1, cat: 'wide' }, mud: { vb: [180, 24], k: 1.2, cat: 'wide' },
  branch: { vb: [240, 80], k: 0.9, cat: 'high' }, bird: { vb: [80, 50], k: 0.9, cat: 'high' },
  sign: { vb: [140, 80], k: 0.85, cat: 'high' }, kite: { vb: [160, 90], k: 0.9, cat: 'high' },
  bunting: { vb: [260, 60], k: 0.85, cat: 'high' },
  cat: { vb: [70, 50], k: 0.95, cat: 'low' }, trashcan: { vb: [60, 70], k: 0.75, cat: 'low' }, hydrant: { vb: [50, 60], k: 0.8, cat: 'low' },
  bicycle: { vb: [200, 80], k: 0.85, cat: 'wide', solid: true }, // a solid but long thing: needs the long jump, bumps (no splash)
  awning: { vb: [240, 80], k: 0.9, cat: 'high' }, molehill: { vb: [80, 36], k: 0.9, cat: 'low' },
  crate: { vb: [80, 70], k: 0.72, cat: 'low' }, ropecoil: { vb: [80, 40], k: 0.85, cat: 'low' },
  seagull: { vb: [90, 50], k: 0.85, cat: 'high' }, fishingline: { vb: [220, 70], k: 0.9, cat: 'high' }
};
const HINT = { low: 'jump!', high: 'duck!', wide: 'long jump! (hold)' };
const HINT_NAME = { cat: 'hop the cat!', trashcan: 'jump!', hydrant: 'jump!', bicycle: 'bike! long jump (hold)', awning: 'duck!', molehill: 'hop!', crate: 'jump!', ropecoil: 'hop!', seagull: 'gull! duck!', fishingline: 'duck the line!' };
const FLYERS = ['bird', 'seagull'];
// tutorial card 2: per-route hint text under each obstacle name (routes without notes keep the plain action word)
const ROUTE_NOTES = {
  town: { cat: 'jump (it won\u2019t move)', trashcan: 'jump!', hydrant: 'jump!', bicycle: 'long jump (hold): it\u2019s wide', puddle: 'long jump: dry paws', awning: 'duck!', sign: 'duck!' },
  hilltop: { rock: 'jump!', log: 'jump!', molehill: 'hop it!', snowdrift: 'jump!', mud: 'long jump: stay clean', kite: 'duck the string!', bird: 'duck!' },
  pier: { crate: 'jump!', ropecoil: 'hop it!', puddle: 'long jump (hold)', seagull: 'duck!', fishingline: 'duck the line!' }
};
const ROUTE_WX = {
  town: { rain: 'Rain: puddles on the sidewalk.', night: 'Night: street lamps light the way.' },
  hilltop: { rain: 'Rain: muddy patches on the trail.', snow: 'Snow: snowdrifts and cold paws.', night: 'Night: no lamps up here, just fireflies. Fewer birds.' },
  pier: { rain: 'Rain: more puddles on the boards.', night: 'Night: lamps and the lighthouse. Fewer seagulls.' }
};

/* ------------------------------------------------------------------ lines */
const L = {
  bonk: ['Bonk. The log wins this round.', 'Ow. Dignity: minus one.', 'I meant to do that.', 'That came out of nowhere. (It did not.)', 'Everything is fine. Keep walking.', 'Ow! Rude object.', 'Who put THAT there?'],
  bonkName: {
    cat: ['The cat did not move. The cat never moves.', 'Sorry, cat. The cat is not sorry.'],
    trashcan: ['CLANG. Very loud. Very embarrassing.'], hydrant: ['Not now, hydrant.', 'Ow. Hydrants are harder than they smell.'],
    bicycle: ['Ding ding! Sorry, bicycle.', 'Wheels: 2. Dignity: 0.'], awning: ['Bonk! Shops should warn you.'],
    molehill: ['A mole says hi. Rudely.'], crate: ['Thunk. Crate: unbothered.'], ropecoil: ['Tangled in rope. Pirate dog now.'],
    seagull: ['The seagull wins. Seagulls always win.', 'SQUAWK. Fair.'], fishingline: ['Tangled! Not a fish, honest.']
  },
  bonkHigh: ['Head, meet thing. Thing, meet head.', 'Ducking is for ducks. Apparently also for me.', 'Bonk! Ears first, as always.', 'Ow. Low-flying problem.'],
  splash: ['Splash! Very muddy. Very proud.', 'SPLOOSH. That was on purpose.', 'Wet paws. Wet everything.', 'Puddle: found. Cleanliness: lost.'],
  dry: ['Splash! The coat kept everything clean.', 'Puddle-proof. Smug dog.'],
  squeaky: ['Squeaky clean!', 'Paws stay dry!', 'Clean leap!'],
  far: ['Sniff... grass. Just grass. Keep going.', 'Smells like... nothing much. Yet.', 'The nose says: not here. Not even close.', 'Sniff. A bee was here. Not helpful.'],
  warm: ['Ooh. Something interesting is up ahead.', 'Sniff sniff... getting warmer!', 'Smells like... adventure. And ducks.', 'There is a smell. A GOOD smell. Ahead.'],
  hot: ['HOT! It is right around here!', 'The nose is going wild. Dig at the next X!', 'Sniff SNIFF. It is close. So close.'],
  past: ['Hmm. We may have walked past it.', 'The smell is behind us now. Oops.'],
  done: ['Smells like... a job well done.', 'Sniff sniff. Just happy smells now.'],
  cold: ['Brrr.', 'Cold paws!', 'Brrrrr. A sweater would be nice.']
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ------------------------------------------------------------------ art helpers */
function PA() { return window.PawArt || {}; }
function call(fn) { try { const P = PA(); if (typeof P[fn] !== 'function') return ''; const s = P[fn].apply(P, [].slice.call(arguments, 1)); return typeof s === 'string' ? s : ''; } catch (e) { return ''; } }
const isFallback = (s) => !s || />\s*\?\s*<\/text>/.test(s);
const URI = {};
function toUri(svg) {
  if (!svg) return '';
  if (svg.indexOf('xmlns=') < 0) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function svgWrap(vb, body) { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb[0]} ${vb[1]}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`; }
// simple doodle fallbacks if PawArt.obstacle is missing or returns the "?" placeholder
const DOODLE = {
  log: () => svgWrap([120, 50], '<rect x="6" y="14" width="104" height="32" rx="14" fill="#D9A877"/><ellipse cx="106" cy="30" rx="10" ry="16" fill="#F1D3A8"/><path d="M102 30a4 6 0 1 0 8 0M20 24q20 -4 40 0M30 36q20 3 44 -1"/>'),
  rock: () => svgWrap([80, 50], '<path d="M8 47q-2 -22 18 -32q16 -10 32 2q16 10 14 30z" fill="#C9C2B8"/><path d="M24 24q8 -6 16 -2"/>'),
  sprinkler: () => svgWrap([70, 70], '<path d="M28 68v-12h14v12z" fill="#F4A262"/><path d="M35 54q-30 -40 -30 6M35 54q30 -40 30 6" stroke="#86B3EA" stroke-dasharray="4 5"/>'),
  snowdrift: () => svgWrap([140, 60], '<path d="M4 58q20 -46 66 -44q50 2 66 44z" fill="#F7FBFF"/><path d="M40 34q10 -6 20 -4"/>'),
  crab: () => svgWrap([70, 44], '<ellipse cx="35" cy="28" rx="18" ry="11" fill="#F28B7A"/><path d="M17 26q-10 -8 -6 -16M53 26q10 -8 6 -16M22 38l-6 5M48 38l6 5"/><circle cx="29" cy="14" r="3" fill="#fff"/><circle cx="41" cy="14" r="3" fill="#fff"/>'),
  sandcastle: () => svgWrap([90, 70], '<path d="M8 68v-30h12v-8h10v8h30v-8h10v8h12v30z" fill="#F2D49B"/><path d="M45 30v-22l12 5l-12 5" fill="#F28FA5"/><path d="M40 68v-12q5 -6 10 0v12"/>'),
  puddle: () => svgWrap([220, 24], '<path d="M6 13q10 -10 60 -9q60 -3 110 1q42 2 38 9q-4 8 -60 8q-70 2 -120 -1q-32 -2 -28 -8z" fill="#AFD6F0"/><path d="M50 12q20 -3 40 0M130 13q16 -3 30 0" stroke="#FFFBF3"/>'),
  mud: () => svgWrap([180, 24], '<path d="M6 13q8 -9 50 -9q50 -2 90 2q34 2 28 9q-6 7 -48 7q-60 2 -96 -1q-28 -2 -24 -8z" fill="#9C6B4A"/><circle cx="60" cy="11" r="3" fill="#7d533a"/><circle cx="120" cy="13" r="2" fill="#7d533a"/>'),
  branch: () => svgWrap([240, 80], '<path d="M0 10q120 -6 240 4" stroke-width="6"/><path d="M40 12q-6 30 6 50M100 12q4 34 -4 66M160 14q-6 26 4 44M210 14q6 24 -2 40" stroke="#6E9E62"/><ellipse cx="46" cy="62" rx="10" ry="14" fill="#B9DD92"/><ellipse cx="96" cy="66" rx="10" ry="13" fill="#B9DD92"/><ellipse cx="164" cy="58" rx="10" ry="14" fill="#B9DD92"/><ellipse cx="208" cy="54" rx="9" ry="13" fill="#B9DD92"/>'),
  bird: () => svgWrap([80, 50], '<ellipse cx="38" cy="30" rx="18" ry="12" fill="#B9D3F2"/><circle cx="54" cy="22" r="8" fill="#B9D3F2"/><path d="M62 22l8 2l-8 3" fill="#F4A262"/><path d="M30 26q-8 -22 -22 -14q10 6 22 14z" fill="#fff"/>'),
  sign: () => svgWrap([140, 80], '<path d="M4 6h130" stroke-width="5"/><path d="M40 6v16M100 6v16"/><rect x="18" y="22" width="104" height="54" rx="6" fill="#EBCDA4"/><text x="70" y="56" text-anchor="middle" font-size="18" font-family="cursive" fill="#5B3D32" stroke="none">DUCK!</text>'),
  kite: () => svgWrap([160, 90], '<path d="M130 6l22 22l-22 30l-22 -30z" fill="#F9D0D9"/><path d="M130 58q-30 30 -128 30" stroke-width="2"/>'),
  cat: () => svgWrap([70, 50], '<ellipse cx="30" cy="36" rx="20" ry="12" fill="#C9C2B8"/><circle cx="52" cy="24" r="10" fill="#C9C2B8"/><path d="M45 17l2 -9l5 6M55 15l4 -8l2 9M10 34q-10 -16 2 -24"/><circle cx="55" cy="24" r="1.6" fill="#5B3D32"/>'),
  trashcan: () => svgWrap([60, 70], '<path d="M12 22h36l-4 46h-28z" fill="#B9D3F2"/><path d="M8 14h44v8h-44z" fill="#9CB9DA"/><path d="M24 30v32M36 30v32"/>'),
  hydrant: () => svgWrap([50, 60], '<path d="M15 58v-36q0 -12 10 -12q10 0 10 12v36z" fill="#F28B7A"/><path d="M8 32h34M10 58h30" stroke-width="4"/>'),
  bicycle: () => svgWrap([200, 80], '<circle cx="45" cy="56" r="22" fill="#fff"/><circle cx="155" cy="56" r="22" fill="#fff"/><path d="M45 56l35 -32h50l25 32M80 24l20 32h30M128 18h14M74 18h16" stroke="#E86A5C" stroke-width="4"/>'),
  awning: () => svgWrap([240, 80], '<path d="M0 6h240v10h-240z" fill="#C9A07A"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${i * 30} 16h30v50q-15 12 -30 0z" fill="${i % 2 ? '#FFFBF3' : '#F28FA5'}"/>`).join('')),
  molehill: () => svgWrap([80, 36], '<path d="M4 34q36 -44 72 0z" fill="#B88A64"/><circle cx="30" cy="22" r="2" fill="#7d533a"/><circle cx="48" cy="26" r="2" fill="#7d533a"/>'),
  crate: () => svgWrap([80, 70], '<rect x="8" y="10" width="64" height="58" fill="#E7B987"/><path d="M8 10l64 58M72 10l-64 58M8 39h64"/>'),
  ropecoil: () => svgWrap([80, 40], '<ellipse cx="40" cy="28" rx="34" ry="10" fill="#E9CF96"/><ellipse cx="40" cy="22" rx="26" ry="8" fill="#E9CF96"/><ellipse cx="40" cy="17" rx="16" ry="5" fill="#E9CF96"/>'),
  seagull: () => svgWrap([90, 50], '<ellipse cx="44" cy="30" rx="20" ry="11" fill="#fff"/><circle cx="62" cy="22" r="8" fill="#fff"/><path d="M70 22l10 2l-10 3" fill="#F4C542"/><path d="M36 26q-14 -24 -30 -14q14 4 30 14z" fill="#C9C2B8"/>'),
  fishingline: () => svgWrap([220, 70], '<path d="M218 2l-40 30" stroke="#A97E5A" stroke-width="5"/><path d="M178 32q-80 38 -176 34" stroke-width="1.6"/><path d="M4 60l6 8l-8 0z" fill="#E86A5C"/>'),
  bunting: () => svgWrap([260, 60], '<path d="M2 6q128 14 256 0"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${14 + i * 30} ${9 + Math.sin(i / 7 * 3.14) * 6}l12 44l12 -44z" fill="${['#F9D0D9', '#FFE3A1', '#C8E9CF', '#CBE0F4'][i % 4]}"/>`).join(''))
};
const ST_PAD = 7;
function obstacleUri(name) { // sticker look: warm-dark outline + white edge around the silhouette, baked into the image once
  const key = 'o:' + name; if (URI[key]) return URI[key];
  let s = call('obstacle', name); if (isFallback(s) || s.indexOf('data-obstacle') < 0) s = (DOODLE[name] || DOODLE.rock)();
  const vb = (OBS[name] || OBS.rock).vb, W = vb[0] + ST_PAD * 2, H = vb[1] + ST_PAD * 2;
  const inner = s.replace(/<svg([^>]*?)\s(width|height)="[^"]*"/g, '<svg$1').replace(/<svg([^>]*?)\s(width|height)="[^"]*"/g, '<svg$1')
    .replace('<svg', `<svg x="${ST_PAD}" y="${ST_PAD}" width="${vb[0]}" height="${vb[1]}" overflow="visible"`);
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><filter id="pwst" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB">`
    + '<feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="a1"/><feFlood flood-color="#FFFFFF"/><feComposite in2="a1" operator="in" result="wh"/>'
    + '<feMorphology in="SourceAlpha" operator="dilate" radius="4.4" result="a2"/><feFlood flood-color="#4A2F26"/><feComposite in2="a2" operator="in" result="dk"/>'
    + `<feMerge><feMergeNode in="dk"/><feMergeNode in="wh"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#pwst)">${inner}</g></svg>`;
  return (URI[key] = toUri(out));
}
function stickerImg(name) { const vb = (OBS[name] || OBS.rock).vb, px2 = (a, b) => (a / b * 100).toFixed(2) + '%';
  return `<img class="pw-st" alt="" draggable="false" src="${obstacleUri(name)}" style="left:-${px2(ST_PAD, vb[0])};top:-${px2(ST_PAD, vb[1])};width:${px2(vb[0] + 2 * ST_PAD, vb[0])};height:${px2(vb[1] + 2 * ST_PAD, vb[1])}">`; }
const BADGE = {
  low: ['#F4A262', 'jump', '<path d="M12 21V6M6 11l6-6l6 6"/>'],
  wide: ['#E86A5C', 'long jump', '<path d="M6 13l6-6l6 6M6 20l6-6l6 6"/>'],
  high: ['#6FA0DA', 'duck', '<path d="M12 3v15M6 13l6 6l6-6"/>']
};
function badgeHtml(cat, style) { const b = BADGE[cat]; return `<span class="pw-badge" style="background:${b[0]};${style || ''}" title="${b[1]}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${b[2]}</svg></span>`; }
const COL_FB = {
  coin: () => svgWrap([60, 60], '<circle cx="30" cy="30" r="20" fill="#F7D46B"/><circle cx="30" cy="30" r="13"/>'),
  sniff: () => svgWrap([60, 60], '<path d="M12 46q-6 -14 10 -14q2 -12 16 -8q14 -2 12 12q10 4 2 12z" fill="#E0D5F0"/><path d="M24 22q-4 -8 2 -14M36 22q4 -8 -2 -14" stroke="#B49AD8"/>'),
  dig: () => svgWrap([60, 60], '<path d="M6 52q24 -26 48 0z" fill="#C9A07A"/><path d="M22 18l16 16M38 18l-16 16" stroke="#E86A5C" stroke-width="4"/>'),
  'sparkle-spot': () => svgWrap([60, 60], '<path d="M30 6q3 21 24 24q-21 3 -24 24q-3 -21 -24 -24q21 -3 24 -24z" fill="#FFE3A1"/>'),
  chest: () => svgWrap([60, 60], '<rect x="10" y="26" width="40" height="26" rx="3" fill="#D9A877"/><path d="M10 26q20 -22 40 0z" fill="#E7B987"/><rect x="26" y="30" width="8" height="10" fill="#F7D46B"/>')
};
function colSvg(name) { let s = call('collectible', name); if (isFallback(s)) s = (COL_FB[name] || COL_FB.coin)(); return s; }
function colUri(name) { const k = 'c:' + name; return URI[k] || (URI[k] = toUri(colSvg(name))); }
function lampUri() {
  return URI.lamp || (URI.lamp = toUri(svgWrap([40, 160], '<path d="M20 158v-128" stroke-width="3.2"/><path d="M12 158h16"/><path d="M8 30l6 -14h12l6 14z" fill="#FFE3A1"/><path d="M14 16q6 -8 12 0"/>')));
}

/* ------------------------------------------------------------------ CSS */
const CSS = `
.pw-root{position:absolute;inset:0;overflow:hidden;background:${PAPER};color:${INK};font-family:'Patrick Hand','Trebuchet MS',sans-serif;user-select:none;-webkit-user-select:none;touch-action:none;contain:strict}
.pw-root *{box-sizing:border-box}
.pw-stage{position:absolute;inset:0;overflow:hidden}
.pw-layer{position:absolute;left:0;top:0;will-change:transform;pointer-events:none}
.pw-tile{position:absolute;top:0}
.pw-tile>svg{display:block;width:100%;height:100%}
.pw-objs{pointer-events:auto}
.pw-obj{position:absolute;pointer-events:none}
.pw-obj>img{position:absolute;left:0;top:0;width:100%;height:100%;display:block;-webkit-user-drag:none}
.pw-obj .pw-sup{position:absolute;left:0;top:0;overflow:visible}
.pw-shadow{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(91,61,50,.32),rgba(91,61,50,0))}
.pw-obj.pw-x{pointer-events:auto;cursor:pointer}
.pw-obj.pw-got{animation:pw-got .45s ease-out forwards}
@keyframes pw-got{to{transform:translateY(-40px) scale(1.25);opacity:0}}
.pw-obj.pw-dug>img{opacity:.35;filter:grayscale(.6)}
.pw-fly>img{animation:pw-fly .9s ease-in-out infinite alternate}
@keyframes pw-fly{from{transform:translateY(-4%)}to{transform:translateY(8%)}}
.pw-scuttle>img{animation:pw-scut .7s ease-in-out infinite alternate}
@keyframes pw-scut{from{transform:translateX(-7%)}to{transform:translateX(7%)}}
.pw-spin>img{animation:pw-bob 1.4s ease-in-out infinite alternate}
@keyframes pw-bob{from{transform:translateY(0)}to{transform:translateY(-10%)}}
.pw-glow>img{animation:pw-glow 1s ease-in-out infinite alternate}
.pw-obj>img.pw-st{position:absolute}
.pw-badge{position:absolute;width:34em;height:34em;margin-left:-17em;border-radius:50%;border:2.5em solid #4A2F26;box-shadow:0 0 0 2em #fff,2em 3em 0 2em rgba(74,47,38,.25);display:flex;align-items:center;justify-content:center;animation:pw-bdg .6s ease-in-out infinite alternate}
.pw-badge svg{width:24em;height:24em}
@keyframes pw-bdg{to{transform:translateY(-4em)}}
.pw-coin>img{filter:drop-shadow(0 0 5px rgba(255,214,102,.95)) drop-shadow(0 0 2px rgba(255,255,255,.9));animation:pw-cbob 1.1s ease-in-out infinite alternate}
@keyframes pw-cbob{from{transform:translateY(6%)}to{transform:translateY(-10%)}}
.pw-ring2{position:absolute;left:-14%;top:38%;width:128%;height:58%;border:3.5em dotted #d2483b;border-radius:50%;animation:pw-ring 1.1s ease-in-out infinite;pointer-events:none}
@keyframes pw-ring{0%{transform:scale(.85);opacity:.95}100%{transform:scale(1.15);opacity:.35}}
.pw-obj.pw-dug .pw-ring2{display:none}
.pw-veil{position:absolute;left:0;right:0;top:0;pointer-events:none;background:rgba(255,251,243,.24)}
.pw-shadow.light{opacity:.55}
.pw-card.pw-tut{width:min(860px,94%);max-width:none;padding:14px 30px 12px;text-align:left}
.pw-card.pw-tut p{margin:4px 0}
.pw-card.pw-tut h2{text-align:center;font-size:40px}
.pw-card.pw-tut .pw-sub{text-align:center;font-family:'Caveat',cursive;font-size:24px;margin:0 0 6px;color:#8A7468}
.pw-card.pw-tut h3{text-align:center;font-size:32px;margin:0 0 6px}
.pw-trow{display:flex;align-items:center;gap:16px;margin:8px 0;font-size:19px;line-height:1.25}
.pw-trow b{font-family:'Caveat',cursive;font-size:27px}
.pw-mini{position:relative;width:150px;height:96px;flex:none;border:2px dashed #C9BDB2;border-radius:12px;overflow:hidden;background:#FFFDF8}
.pw-mini .pw-md{position:absolute;left:30px;bottom:6px;width:84px;height:70px}
.pw-mini .pw-md>svg{width:100%;height:100%;display:block;overflow:visible}
.pw-mini .pw-mp{position:absolute;bottom:4px}
.pw-mini .pw-mp img{width:100%;height:100%;display:block}
.pw-mini.jump .pw-md{animation:pw-mj 1.2s ease-in-out infinite}
@keyframes pw-mj{0%,100%{transform:translateY(0)}45%{transform:translateY(-34px)}}
.pw-mini.long .pw-md{left:0;animation:pw-ml 1.8s ease-in-out infinite}
@keyframes pw-ml{0%{transform:translate(0,0)}50%{transform:translate(32px,-40px)}100%{transform:translate(66px,0)}}
.pw-mini.duck .pw-md{animation:pw-mdk 1.4s ease-in-out infinite alternate}
@keyframes pw-mdk{from{transform:translateX(-8px)}to{transform:translateX(8px)}}
.pw-obsgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px 14px;margin:6px 0}
.pw-obsc{display:flex;align-items:center;gap:8px;font-size:18px;border:2px solid #E3D2BA;border-radius:12px;padding:6px 8px;background:#FFFDF8}
.pw-obsc .pw-oi{position:relative;width:64px;height:44px;flex:none}
.pw-obsc .pw-oi img{position:absolute}
.pw-obsc .pw-badge{position:relative;width:26px;height:26px;margin:0;border-width:2px;box-shadow:0 0 0 1.5px #fff;animation:none;flex:none}
.pw-obsc .pw-badge svg{width:17px;height:17px}
.pw-obsc span b{display:block;font-family:'Caveat',cursive;font-size:24px;line-height:1}
.pw-notes{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}
.pw-notes .pw-obsc{position:relative;padding:6px 8px 6px 6px;font-size:16px;line-height:1.15;min-height:64px}
.pw-notes .pw-obsc i{display:block;font-style:normal}
.pw-notes .pw-obsc .pw-badge{position:absolute;left:52px;top:4px}
.pw-tic{width:52px;height:52px;flex:none}
.pw-tic img,.pw-tic svg{width:100%;height:100%;display:block}
.pw-nm{display:flex;gap:4px;flex:none}
.pw-nm i{font-style:normal;font-family:'Caveat',cursive;font-size:22px;padding:0 8px;border-radius:8px;border:2px solid #5B3D32}
.pw-tfoot{display:flex;align-items:center;gap:10px;margin-top:12px}
.pw-tfoot .pw-dots{flex:1;text-align:center;font-size:22px;letter-spacing:4px;color:#C9BDB2}
.pw-tfoot .pw-dots i{font-style:normal}.pw-tfoot .pw-dots i.on{color:#5B3D32}
.pw-skip{display:flex;align-items:center;gap:6px;font-size:17px;cursor:pointer}
.pw-skip input{width:18px;height:18px;accent-color:#F28FA5}
.pw-remind{position:absolute;left:50%;top:30%;transform:translateX(-50%);font-size:20px;white-space:nowrap}
.pw-remind b{font-weight:400;color:#d2483b}
.pw-lg-touch{display:none}
.pw-touchui .pw-lg-touch{display:inline}.pw-touchui .pw-lg-desk{display:none}
.pw-root.pw-touchui{-webkit-touch-callout:none}
.pw-pt .pw-stage{border-top:2.5px solid ${INK};border-bottom:2.5px solid ${INK};box-shadow:0 3px 0 rgba(91,61,50,.15)}
.pw-pt .pw-hud,.pw-cp .pw-hud{left:6px;right:6px;top:6px;gap:4px 10px;padding:4px 10px;font-size:15px}
.pw-pt .pw-hud{flex-wrap:wrap}
.pw-pt .pw-hud .pw-sep,.pw-cp .pw-hud .pw-sep,.pw-touchui .pw-hud .pw-k,.pw-pt .pw-bt,.pw-pt .pw-nose .pw-wl{display:none}
.pw-pt .pw-time{flex:1 1 100%;min-width:0}
.pw-cp .pw-time{min-width:110px}
.pw-pt .pw-hud b,.pw-cp .pw-hud b{font-size:22px}
.pw-pt .pw-ic,.pw-cp .pw-ic{width:24px;height:24px}
.pw-pt .pw-nose,.pw-cp .pw-nose{min-width:0;gap:4px}
.pw-pt .pw-nose .pw-bar,.pw-cp .pw-nose .pw-bar{width:56px}
.pw-pt .pw-nose .pw-nl,.pw-cp .pw-nose .pw-nl{font-size:21px;min-width:40px}
.pw-pt .pw-xm,.pw-cp .pw-xm{font-size:22px}
.pw-touchui .pw-hud .pw-btn{min-height:44px;min-width:44px;padding:2px 8px;justify-content:center}
.pw-pt .pw-coins{margin-right:auto}
@media (max-width:400px){.pw-pt .pw-hud{gap:4px 6px;padding:4px 8px}.pw-pt .pw-nose .pw-bar{width:36px}.pw-pt .pw-nose .pw-nl{min-width:0}.pw-pt .pw-digs{font-size:15px;gap:3px}.pw-pt .pw-coins{gap:3px}.pw-touchui .pw-hud .pw-btn{padding:2px 5px}}
.pw-pt .pw-legend{font-size:15px;padding:2px 10px;white-space:normal;text-align:center;width:max-content;max-width:94%}
.pw-cp .pw-legend,.pw-coarse:not(.pw-pt) .pw-legend{display:none}
.pw-coarse .pw-lg-desk{display:none}.pw-coarse .pw-lg-touch{display:inline}
.pw-coarse.pw-tab .pw-legend{display:block}
.pw-tab .pw-stage{border-bottom:2.5px solid ${INK};box-shadow:0 3px 0 rgba(91,61,50,.15)}
.pw-tab .pw-ctrls{bottom:auto}
.pw-tab .pw-dig{margin-bottom:0;min-width:200px}
.pw-pt .pw-mini.jump .pw-mp{left:64px!important}
.pw-pt .pw-mini.long .pw-mp{left:18px!important}
.pw-pt .pw-mini.long .pw-md{animation-name:pw-mlS}
@keyframes pw-mlS{0%{transform:translate(-6px,0)}50%{transform:translate(18px,-26px)}100%{transform:translate(42px,0)}}
.pw-pt .pw-mini.jump .pw-md{animation-name:pw-mjS}
@keyframes pw-mjS{0%,100%{transform:translateY(0)}45%{transform:translateY(-20px)}}
.pw-pt .pw-ctrls{bottom:0;display:grid;grid-template-columns:1fr 1.25fr;grid-template-rows:auto 1fr;gap:10px;padding:0 10px calc(10px + env(safe-area-inset-bottom,0px))}
.pw-pt .pw-ctrls{align-items:stretch}
.pw-pt .pw-legend{text-wrap:balance}
.pw-pt .pw-big{height:auto;min-height:88px;max-height:190px;min-width:0;font-size:38px}
.pw-pt .pw-big .pw-k,.pw-cp .pw-big .pw-k{font-size:15px}
.pw-touchui .pw-tfoot .pw-k{font-size:15px}
.pw-pt .pw-dig{grid-column:1/3;grid-row:2;margin:0;min-height:72px;max-height:80px}
.pw-pt .pw-duck{grid-column:1;grid-row:1}.pw-pt .pw-jump{grid-column:2;grid-row:1}
.pw-cp .pw-ctrls{bottom:8px;padding:0 10px}
.pw-cp .pw-big{min-width:104px;height:62px;font-size:28px;opacity:.93}
.pw-cp .pw-dig{margin-bottom:0;min-width:160px;height:72px}
.pw-pt .pw-hint,.pw-cp .pw-hint{font-size:24px;padding:0 7px}
.pw-pt .pw-say{font-size:15px;max-width:220px;padding:4px 8px}
.pw-pt .pw-prompt{font-size:26px}
.pw-pt .pw-pop{font-size:22px}
.pw-pt .pw-cd,.pw-cp .pw-cd{font-size:72px}
.pw-pt .pw-ov:not(.dim){inset:auto 0 auto 0;top:var(--pw-st,0);height:var(--pw-sh,100%)}
.pw-pt .pw-remind,.pw-cp .pw-remind{white-space:normal;width:92%;max-width:520px;text-align:center;font-size:16px}
.pw-touchui .pw-card{max-width:94%;max-height:92%;overflow-y:auto;touch-action:pan-y;padding:12px 14px}
.pw-touchui .pw-card h2{font-size:34px}
.pw-touchui .pw-card .pw-art{width:110px;height:110px}
.pw-touchui .pw-card .pw-btn{min-height:44px}
.pw-touchui .pw-card.pw-tut{width:96%;padding:10px 12px}
.pw-pt .pw-card.pw-tut h2{font-size:32px}
.pw-pt .pw-card.pw-tut h3{font-size:26px}
.pw-pt .pw-trow{gap:10px;font-size:15px;margin:8px 0}
.pw-pt .pw-mini{width:108px;height:74px}
.pw-pt .pw-mini .pw-md{left:18px;width:66px;height:55px}
.pw-pt .pw-tic{width:42px;height:42px}
.pw-touchui .pw-tfoot{position:sticky;bottom:-12px;background:${PAPER};padding:8px 0 10px;margin-bottom:-10px;border-top:2px dashed #E3D2BA}
.pw-pt .pw-trow b{font-size:23px}
.pw-trow b{padding-right:.14em}
.pw-pt .pw-tic.pw-neg{font-size:26px!important;line-height:42px!important}
.pw-pt .pw-card.pw-tut{height:min(88%,660px);display:flex;flex-direction:column;overflow-y:auto}
.pw-pt .pw-card.pw-tut .pw-tfoot{margin-top:auto}
.pw-pt .pw-obsgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.pw-pt .pw-obsc{flex-wrap:nowrap;justify-content:flex-start;text-align:left;font-size:15px;padding:3px 6px;gap:4px;min-height:0}
.pw-pt .pw-obsc .pw-oi{width:50px;height:36px}
.pw-pt .pw-obsc span b{font-size:21px}
.pw-pt .pw-obsgrid{gap:6px 8px;margin:4px 0}
.pw-pt .pw-notes .pw-obsc{min-height:0}
.pw-pt .pw-notes .pw-obsc .pw-badge{left:38px;top:2px;width:22px;height:22px}
.pw-pt .pw-mini[style*="width:150px"] img:nth-of-type(1){bottom:6px!important}.pw-pt .pw-mini[style*="width:150px"] img:nth-of-type(2){bottom:22px!important}.pw-pt .pw-mini[style*="width:150px"] img:nth-of-type(3){bottom:38px!important}
.pw-pt .pw-tfoot,.pw-cp .pw-tfoot{flex-wrap:wrap;justify-content:center}
.pw-pt .pw-tfoot .pw-dots{flex:1 1 100%;order:-1}
.pw-touchui .pw-skip{min-height:44px}
.pw-touchui .pw-skip input{width:22px;height:22px}
@keyframes pw-glow{from{opacity:.55;transform:scale(.9)}to{opacity:1;transform:scale(1.1)}}
.pw-dog{position:absolute;will-change:transform;pointer-events:none}
.pw-pose{position:absolute;inset:0;visibility:hidden}
.pw-pose.on{visibility:visible}
.pw-pose>svg{display:block;width:100%;height:100%;overflow:visible}
.pw-dog.pw-blink{animation:pw-blink .18s steps(1,end) infinite}
@keyframes pw-blink{50%{opacity:.3}}
.pw-tint{position:absolute;inset:0;pointer-events:none}
.pw-pool{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(255,236,170,.55),rgba(255,226,150,.18) 60%,rgba(255,220,140,0));mix-blend-mode:screen}
.pw-ff{position:absolute;width:6px;height:6px;border-radius:50%;background:#FFF3A8;box-shadow:0 0 8px 3px rgba(255,240,150,.7);animation:pw-ff 5s ease-in-out infinite alternate}
@keyframes pw-ff{0%{transform:translate(0,0);opacity:.2}50%{opacity:1}100%{transform:translate(40px,-30px);opacity:.3}}
.pw-wx{position:absolute;left:0;right:0;top:-100%;height:200%;pointer-events:none;will-change:transform}
.pw-rain{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='160'%3E%3Cg stroke='%237FA8D8' stroke-width='2' stroke-linecap='round' opacity='.6'%3E%3Cpath d='M20 10l-6 18M70 40l-6 18M105 90l-6 18M40 100l-6 18M88 4l-5 15M10 140l-5 15M60 128l-6 18'/%3E%3C/g%3E%3C/svg%3E");animation:pw-fall .5s linear infinite}
.pw-snow{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='180'%3E%3Cg fill='%23fff' stroke='%23A8968A' stroke-width='.8'%3E%3Ccircle cx='20' cy='20' r='3.5'/%3E%3Ccircle cx='90' cy='60' r='2.8'/%3E%3Ccircle cx='140' cy='20' r='3'/%3E%3Ccircle cx='50' cy='120' r='3.2'/%3E%3Ccircle cx='120' cy='150' r='2.5'/%3E%3Ccircle cx='10' cy='170' r='2.6'/%3E%3C/g%3E%3C/svg%3E");animation:pw-fall 6s linear infinite}
@keyframes pw-fall{from{transform:translateY(0)}to{transform:translateY(50%)}}
.pw-snow{animation-name:pw-fallS}
@keyframes pw-fallS{from{transform:translate(0,0)}to{transform:translate(-40px,50%)}}
.pw-panel{background:${PAPER};border:2.5px solid ${INK};border-radius:16px 20px 14px 22px/20px 14px 22px 16px;box-shadow:3px 4px 0 rgba(91,61,50,.18)}
.pw-hud{position:absolute;left:12px;right:12px;top:10px;display:flex;align-items:center;gap:16px;padding:6px 14px;font-size:18px;z-index:5}
.pw-hud .pw-sep{width:2px;align-self:stretch;background:repeating-linear-gradient(${INK} 0 5px,transparent 5px 9px);opacity:.35}
.pw-hud b{font-family:'Caveat',cursive;font-size:26px;line-height:1}
.pw-ic{width:30px;height:30px;display:inline-block;flex:none}
.pw-ic svg,.pw-ic img{width:100%;height:100%;display:block}
.pw-time{display:flex;align-items:center;gap:8px;flex:1 1 200px;min-width:150px}
.pw-bar{position:relative;height:14px;flex:1;border:2px solid ${INK};border-radius:9px 7px 10px 6px;overflow:hidden;background:#fff}
.pw-bar>i{position:absolute;inset:0;transform-origin:0 50%;background:repeating-linear-gradient(-58deg,rgba(255,255,255,.4) 0 2px,transparent 2px 6px),#C8E9CF}
.pw-time.pw-low .pw-bar>i{background:repeating-linear-gradient(-58deg,rgba(255,255,255,.4) 0 2px,transparent 2px 6px),#F9B8A8}
.pw-coins,.pw-digs{display:flex;align-items:center;gap:6px;white-space:nowrap}
.pw-nose{display:flex;align-items:center;gap:8px;min-width:230px}
.pw-nose .pw-bar{width:110px;flex:none}
.pw-nose .pw-bar>i{background:#86B3EA;transition:transform .15s}
.pw-nose.warm .pw-bar>i{background:#F4A262}
.pw-nose.hot .pw-bar>i{background:#E86A5C}
.pw-nose .pw-nl{font-family:'Caveat',cursive;font-size:24px;min-width:56px;color:#5c86b8}
.pw-nose.warm .pw-nl{color:#d27a35}
.pw-nose.hot .pw-nl{color:#d2483b}
.pw-nose.hot{animation:pw-wig .25s ease-in-out infinite alternate}
@keyframes pw-wig{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}
.pw-nose .pw-wl{opacity:0;font-family:'Caveat',cursive;color:#d2483b;font-size:22px}
.pw-nose.hot .pw-wl{opacity:1}
.pw-xm{font-family:'Caveat',cursive;font-weight:700;font-size:26px;color:#E86A5C;line-height:1}
.pw-xm.used{color:#C9BDB2;text-decoration:line-through}
.pw-btn{font-family:'Patrick Hand',sans-serif;font-size:18px;color:${INK};background:${PAPER};border:2.5px solid ${INK};border-radius:14px 18px 12px 16px/16px 12px 18px 14px;padding:4px 12px;cursor:pointer;box-shadow:2px 3px 0 rgba(91,61,50,.2);display:inline-flex;align-items:center;gap:6px;line-height:1.1}
.pw-btn:hover{background:#FFF4DF}
.pw-btn:active,.pw-btn.down{transform:translate(1px,2px);box-shadow:1px 1px 0 rgba(91,61,50,.2)}
.pw-btn.yes{background:#C8E9CF}
.pw-btn.gold{background:#FFE3A1}
.pw-btn .pw-k{font-size:14px;opacity:.7}
.pw-ctrls{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:space-between;align-items:flex-end;padding:0 16px;z-index:5;pointer-events:none}
.pw-ctrls>*{pointer-events:auto}
.pw-big{min-width:150px;height:74px;justify-content:center;flex-direction:column;font-family:'Caveat',cursive;font-size:32px;font-weight:700;gap:0}
.pw-big .pw-k{font-family:'Patrick Hand',sans-serif;font-size:14px;font-weight:400}
.pw-jump{background:#CBE0F4}
.pw-duck{background:#E0D5F0}
.pw-dig{background:#FFE3A1;position:relative;margin-bottom:52px}
.pw-time{position:relative}
.pw-tpop{position:absolute;right:-6px;top:30px;font-family:'Caveat',cursive;font-weight:700;font-size:34px;color:#d2483b;pointer-events:none;animation:pw-tp 1.25s ease-out forwards;text-shadow:0 0 3px #fff}
@keyframes pw-tp{0%{transform:translateY(-6px) scale(.6) rotate(-8deg);opacity:0}15%{transform:translateY(0) scale(1.15) rotate(-4deg);opacity:1}100%{transform:translateY(18px) scale(1) rotate(-4deg);opacity:0}}
.pw-time.pw-hit .pw-bar{animation:pw-flash .3s steps(1,end) 4}
@keyframes pw-flash{50%{background:#F9B8A8;border-color:#d2483b}}
.pw-dig[hidden]{display:none}
.pw-dig .pw-ring{position:absolute;left:6px;right:6px;bottom:4px;height:5px;border-radius:3px;background:${INK};transform-origin:0 50%;opacity:.55}
.pw-legend{position:absolute;bottom:12px;left:50%;transform:translateX(-50%) rotate(-.6deg);font-size:18px;white-space:nowrap;z-index:4;background:${PAPER};border:2px solid ${INK};padding:3px 14px;border-radius:12px 16px 10px 14px/14px 10px 16px 12px;box-shadow:2px 3px 0 rgba(91,61,50,.18)}
.pw-legend b{font-weight:400;color:#d2483b}
.pw-say{position:absolute;max-width:280px;padding:7px 12px;font-size:18px;line-height:1.2;z-index:4;transform:translate(-10%,-100%);pointer-events:none;transition:opacity .2s}
.pw-say::after{content:'';position:absolute;left:22px;bottom:-12px;width:16px;height:14px;background:${PAPER};border-right:2.5px solid ${INK};border-bottom:2.5px solid ${INK};transform:skewX(-30deg) rotate(20deg)}
.pw-say[hidden]{display:none}
.pw-hint{position:absolute;left:50%;transform:translate(-50%,-100%) rotate(-3deg);background:${PAPER};border:2px solid ${INK};border-radius:12px 14px 10px 16px;padding:0 10px;font-family:'Caveat',cursive;font-size:32px;line-height:1.15;font-weight:700;white-space:nowrap;color:#d2483b;box-shadow:2px 3px 0 rgba(91,61,50,.2);animation:pw-hb .5s ease-in-out infinite alternate}
@keyframes pw-hb{to{transform:translate(-50%,-112%) rotate(2deg)}}
.pw-pop{position:absolute;font-family:'Caveat',cursive;font-weight:700;font-size:28px;color:${INK};pointer-events:none;white-space:nowrap;z-index:4;animation:pw-pop 1s ease-out forwards;text-shadow:0 0 3px #fff,0 0 6px #fff}
@keyframes pw-pop{0%{transform:translate(-50%,0) scale(.7);opacity:0}15%{transform:translate(-50%,-8px) scale(1.1);opacity:1}100%{transform:translate(-50%,-60px) scale(1);opacity:0}}
.pw-drop{position:absolute;width:10px;height:10px;border-radius:50%;border:2px solid ${INK};pointer-events:none;animation:pw-drop .6s ease-out forwards;z-index:3}
@keyframes pw-drop{to{transform:translate(var(--dx),var(--dy));opacity:0}}
.pw-ov{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:8;pointer-events:none}
.pw-ov[hidden]{display:none}
.pw-ov.dim{background:rgba(255,251,243,.45);pointer-events:auto}
.pw-cd{font-family:'Caveat',cursive;font-weight:700;font-size:110px;color:${INK};text-shadow:0 0 8px #fff,0 0 16px #fff;animation:pw-cd 1s ease-out}
@keyframes pw-cd{0%{transform:scale(.5) rotate(-6deg);opacity:0}25%{transform:scale(1.1) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0)}}
.pw-card{padding:18px 26px;max-width:520px;text-align:center;position:relative;pointer-events:auto}
.pw-card::before{content:'';position:absolute;left:50%;top:-12px;width:110px;height:24px;transform:translateX(-50%) rotate(-3deg);background:rgba(242,143,165,.55);border-left:2px dashed rgba(255,255,255,.7);border-right:2px dashed rgba(255,255,255,.7)}
.pw-card h2{font-family:'Caveat',cursive;font-size:44px;margin:0;line-height:1}
.pw-card h3{font-family:'Caveat',cursive;font-size:32px;margin:4px 0 2px}
.pw-card p{margin:6px 0;font-size:18px}
.pw-card .pw-art{width:150px;height:150px;margin:6px auto}
.pw-card .pw-art svg{width:100%;height:100%}
.pw-card .pw-row{display:flex;gap:12px;justify-content:center;margin-top:12px;flex-wrap:wrap}
.pw-card ul{text-align:left;margin:8px 0;padding-left:20px;font-size:17px;line-height:1.35}
.pw-stamp{display:inline-block;font-family:'Caveat',cursive;font-weight:700;font-size:22px;padding:0 10px;border:3px double currentColor;border-radius:6px;transform:rotate(-6deg);letter-spacing:1px;text-transform:uppercase}
.pw-stamp.common{color:#8A7F78}.pw-stamp.uncommon{color:#4F9A5C}.pw-stamp.rare{color:#4D7FC0}.pw-stamp.legendary{color:#C9971A;text-shadow:0 0 6px #FFE3A1}
.pw-bagrow{display:flex;align-items:center;gap:12px;justify-content:center;margin:8px 0}
.pw-bagrow .pw-ic{width:44px;height:44px}
.pw-prompt{position:absolute;font-family:'Caveat',cursive;font-weight:700;font-size:34px;color:#d2483b;transform:translate(-50%,-100%);pointer-events:none;z-index:4;text-shadow:0 0 4px #fff,0 0 8px #fff;animation:pw-hb .35s ease-in-out infinite alternate}
.pw-prompt[hidden]{display:none}
html[data-motion="off"] .pw-root *{animation-duration:0s!important}
`;
function injectCSS() {
  if (document.getElementById('pawwalk-css')) return;
  const st = document.createElement('style'); st.id = 'pawwalk-css'; st.textContent = CSS; document.head.appendChild(st);
}

/* ------------------------------------------------------------------ physics helpers (also used for the arc guide) */
function simJump(hold, v) { // returns [{dx,h}] of a jump at horizontal speed v
  let h = 0, vh = PH.V0, t = 0; const pts = [{ dx: 0, h: 0 }];
  while (t < 3) {
    t += STEP; const g = hold && t > PH.LONG_T ? PH.GLONG : PH.GRAV;
    vh -= g * STEP; h += vh * STEP; if (h <= 0) { pts.push({ dx: v * t, h: 0 }); break; }
    pts.push({ dx: v * t, h });
  }
  return pts;
}

/* ================================================================== start */
function start(el, o) {
  if (!el) throw new Error('PawWalk.start needs an element');
  o = o || {};
  injectCSS();
  const noop = () => {};
  const area = AREAS[o.area] ? o.area : 'park', A = AREAS[area];
  const time = ['dawn', 'day', 'dusk', 'night'].includes(o.time) ? o.time : 'day';
  const weather = ['sunny', 'cloudy', 'rain', 'snow'].includes(o.weather) ? o.weather : 'sunny';
  const season = ['spring', 'autumn', 'winter'].includes(o.season) ? o.season : 'summer'; // v2.5: the world art turns with the season
  const ab = o.abilities || {};
  const dogInfo = o.dog || { key: 'shiba', name: 'Mochi', outfit: {} };
  const sfx = (n) => { try { (o.sfx || noop)(n); } catch (e) { /* ignore */ } };
  const sayExt = (t, ms) => { try { (o.say || noop)(t, ms); } catch (e) { /* ignore */ } };
  let D = Math.max(10, +o.durationSec || A.len || 75);
  const bag = (Array.isArray(o.bag) ? o.bag : []).map((b) => ({ name: b && b.name, count: +(b && b.count) || 0 })).filter((b) => b.name);
  const night = time === 'night', rain = weather === 'rain', snow = weather === 'snow';
  const dryCoat = !!(ab.poncho || ab.raincoat);
  const snowMul = snow && !ab.warm ? 0.92 : 1;

  /* ---------- state ---------- */
  const S = {
    mode: 'countdown', cd: 3.0, cdShown: -1, t: 0, camX: 0, slow: 1, slowT: 0,
    h: 0, vh: 0, grounded: true, airT: 0, coyT: 0, bufT: 0, longOK: false, isLong: false,
    jumpHeld: false, crouchHeld: false, invT: 0, stumbleT: 0, poseT: 0, poseO: null, slideX: 0,
    coins: 0, junkCoins: 0, treasureCoins: 0, hits: 0, splashes: 0, puddlesCleared: 0, squeaky: 0, sniffs: 0,
    hapPen: 0, digsUsed: 0, digsMax: 2 + (ab.extraDig ? 1 : 0), treasure: null, bonus: null, junk: [], found: false,
    hazards: 0, touched: 0, prompt: null, promptT: 0, sniffT: 0, digT: 0, digObj: null, revealT: 0,
    endT: 0, ended: false, stopped: false, nudge: 0, hints: { low: 0, high: 0, wide: 0 }, seenTypes: {}, hitLog: [], arcShown: false, ts: 1, slowmoT: 0, played: 0, timeLost: 0,
    shiverNext: 10, lastSec: -1, outOfDigsSaid: false, coinTimes: []
  };

  /* ---------- DOM ---------- */
  const root = document.createElement('div'); root.className = 'pw-root'; root.setAttribute('role', 'application'); root.setAttribute('aria-label', 'Walk mini-game');
  root.innerHTML = `<div class="pw-stage">
      <div class="pw-layer pw-strip"></div><div class="pw-layer pw-far"></div><div class="pw-veil"></div>
      <div class="pw-layer pw-objs"></div><div class="pw-dog"></div><div class="pw-layer pw-fg"></div>
      <div class="pw-tint"></div><div class="pw-layer pw-lights"></div><div class="pw-ffs"></div><div class="pw-wx"></div>
      <div class="pw-fx"></div>
      <div class="pw-say pw-panel" hidden></div>
      <div class="pw-prompt" hidden>Dig! (D)</div>
    </div>
    <div class="pw-hud pw-panel">
      <div class="pw-time"><span class="pw-ic pw-clock"></span><div class="pw-bar"><i></i></div><b class="pw-secs">75</b></div>
      <span class="pw-sep"></span>
      <div class="pw-coins"><span class="pw-ic"><img alt="" src="${colUri('coin')}"></span><b class="pw-cn">0</b></div>
      <span class="pw-sep"></span>
      <div class="pw-nose cold" title="Nose-o-meter"><span class="pw-ic pw-noseic"></span><span class="pw-nl">Cold</span><div class="pw-bar"><i></i></div><span class="pw-wl">~~</span></div>
      <span class="pw-sep"></span>
      <div class="pw-digs" title="Digs left"><span>Digs</span><span class="pw-xs"></span></div>
      <button class="pw-btn pw-bagb" tabindex="-1" aria-label="Bag (B)"><span class="pw-ic pw-bagic"></span><span class="pw-bt">Bag</span> <span class="pw-k">B</span></button>
      <button class="pw-btn pw-pauseb" tabindex="-1" aria-label="Pause (Esc)">II <span class="pw-k">Esc</span></button>
    </div>
    <div class="pw-ctrls">
      <button class="pw-btn pw-big pw-duck" tabindex="-1" aria-label="Crouch">Duck<span class="pw-k" data-desk="hold &darr; or S" data-touch="hold, or swipe down">hold &darr; or S</span></button>
      <button class="pw-btn pw-big pw-dig" tabindex="-1" hidden aria-label="Dig">Dig!<span class="pw-k" data-desk="press D" data-touch="tap here!">press D</span><span class="pw-ring"></span></button>
      <button class="pw-btn pw-big pw-jump" tabindex="-1" aria-label="Jump">Jump<span class="pw-k" data-desk="tap = hop &middot; hold = long" data-touch="tap = hop &middot; hold = long">tap = hop &middot; hold = long</span></button>
    </div>
    <div class="pw-legend"><span class="pw-lg-desk"><b>Space/&uarr;</b> jump (hold = long jump) &middot; <b>&darr;/S</b> duck &middot; <b>D</b> dig &middot; <b>B</b> bag &middot; <b>Esc</b> pause</span><span class="pw-lg-touch"><b>Tap the scene</b> to jump &middot; <span style="white-space:nowrap"><b>hold</b> = long jump</span> &middot; <b>swipe down</b> to duck</span></div>
    <div class="pw-ov"></div>`;
  el.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const E = {
    stage: $('.pw-stage'), strip: $('.pw-strip'), far: $('.pw-far'), objs: $('.pw-objs'), dog: $('.pw-dog'), fg: $('.pw-fg'),
    tint: $('.pw-tint'), veil: $('.pw-veil'), lights: $('.pw-lights'), ffs: $('.pw-ffs'), wx: $('.pw-wx'), fx: $('.pw-fx'),
    time: $('.pw-time'), timeBar: $('.pw-time .pw-bar>i'), secs: $('.pw-secs'), cn: $('.pw-cn'), nose: $('.pw-nose'), noseBar: $('.pw-nose .pw-bar>i'), nl: $('.pw-nl'),
    xs: $('.pw-xs'), say: $('.pw-say'), prompt: $('.pw-prompt'), ov: $('.pw-ov'),
    hud: $('.pw-hud'), ctrls: $('.pw-ctrls'), legend: $('.pw-legend'), jumpB: $('.pw-jump'), duckB: $('.pw-duck'), digB: $('.pw-dig'), ring: $('.pw-dig .pw-ring'), bagB: $('.pw-bagb'), pauseB: $('.pw-pauseb')
  };
  // HUD icons (G-style art, with fallbacks)
  const icon = (n, fb) => { const s = call('icon', n); return isFallback(s) ? fb : s; };
  $('.pw-noseic').innerHTML = icon('nose', svgWrap([64, 64], '<ellipse cx="32" cy="36" rx="20" ry="14" fill="#5B3D32"/>'));
  $('.pw-bagic').innerHTML = icon('bag', svgWrap([64, 64], '<path d="M14 24h36l4 32h-44z" fill="#FCD8BC"/><path d="M24 24q8 -18 16 0"/>'));
  $('.pw-clock').innerHTML = icon('speed', svgWrap([64, 64], '<circle cx="32" cy="34" r="22" fill="#fff"/><path d="M32 34v-12M32 34l9 6"/>'));

  /* ---------- world look: strip, far layer, foreground, tint, weather ---------- */
  let stripSvg = call('walkStrip', area, season === 'summer' ? { time, weather } : { time, weather, season });
  let artTW = false; // does the strip art itself draw time/weather?
  if (stripSvg && (time !== 'day' || weather !== 'sunny')) {
    const plain = call('walkStrip', area, season === 'summer' ? undefined : { season }); const norm = (s) => s.replace(/pw[a-z]*\d+x?\d*/g, '');
    artTW = plain && norm(plain).length !== norm(stripSvg).length;
  }
  if (!stripSvg) stripSvg = svgWrap([1200, 400], `<rect width="1200" height="400" fill="#D3E9F6" stroke="none"/><rect y="250" width="1200" height="80" fill="#CBE5A6" stroke="none"/><rect y="330" width="1200" height="70" fill="#EFDDBA" stroke="none"/><path d="M0 330h1200"/>`);
  const TW = 1200, FARW = 1000, FGW = 600;
  const farSvg = (() => {
    let b = '';
    if (night && !artTW) {
      for (let i = 0; i < 26; i++) { const x = (i * 137) % FARW, y = 14 + (i * 53) % 150, r = 1.2 + (i % 3) * 0.6; b += i % 4 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFF6C9" stroke="none"/>` : `<path d="M${x} ${y - 5}l1.5 3.5l3.5 1.5l-3.5 1.5l-1.5 3.5l-1.5 -3.5l-3.5 -1.5l3.5 -1.5z" fill="#FFF6C9" stroke="none"/>`; }
    }
    if (!night || rain) {
      const grey = rain || weather === 'cloudy';
      [[90, 50, 1], [430, 30, 0.8], [760, 64, 1.1]].forEach(([x, y, s]) => {
        b += `<path transform="translate(${x} ${y}) scale(${s})" d="M0 30q4 -26 34 -18q14 -22 40 -6q26 -6 26 16q14 6 2 18q-40 6 -96 2q-14 -4 -6 -12z" fill="${grey ? '#E4E4EA' : '#FFFFFF'}" fill-opacity=".9"/>`;
      });
    }
    // v2.5: a few leaves (autumn) or petals (spring) drifting past in the far layer
    if ((season === 'autumn' || season === 'spring') && !night) {
      for (let i = 0; i < 7; i++) {
        const x = 60 + i * 140 + (i * 37) % 50, y = 110 + (i * 61) % 170, r = (i * 47) % 360;
        const fill = season === 'autumn' ? ['#F2B25C', '#E8895A', '#F3CB58', '#DE6650'][i % 4] : ['#F9C6D4', '#FFF1F4', '#F7B6C8'][i % 3];
        b += `<path transform="translate(${x} ${y}) rotate(${r})" d="${season === 'autumn' ? 'M-7 0q7 -6 14 0q-7 6 -14 0z' : 'M-5 0q4 -4 9 -1l-1 1l1 1q-5 3 -9 -1z'}" fill="${fill}" stroke-width="1"/>`;
        b += `<path d="M${x - 30} ${y - 10}q10 12 20 4" fill="none" stroke-width="1.2" stroke-dasharray="4 4" opacity=".6"/>`;
      }
    }
    return svgWrap([FARW, 400], b);
  })();
  const fgSvg = (() => {
    const col = snow ? '#FFFFFF' : area === 'beach' ? '#E9CF96' : season === 'autumn' ? '#D9963F' : season === 'winter' ? '#B9C4B6' : season === 'spring' ? '#86C26A' : area === 'woods' ? '#7FA26A' : '#8DBE73';
    let b = '';
    for (let i = 0; i < 12; i++) {
      const x = i * 50 + (i * 17) % 23, y = 392 - (i * 7) % 10;
      if (A.fg === 'town') b += (i % 3 === 0 ? `<path d="M${x} 400q1 -9 -2 -13M${x + 5} 400q0 -10 4 -14" stroke="#8DBE73" stroke-width="2.2"/>` : '') + (i % 4 === 1 ? `<path d="M${x + 14} ${y - 2}q6 -6 12 -1q-5 5 -12 1z" fill="#F4C27A" stroke-width="1.4"/>` : `<ellipse cx="${x + 20}" cy="${y}" rx="${3 + i % 3}" ry="1.8" fill="#D3C9BC" stroke="none"/>`);
      else if (A.fg === 'pier') b += (i % 4 === 2 ? `<path d="M${x} ${y}q6 -7 12 0q-6 5 -12 0z" fill="#FFFFFF" stroke-width="1.4"/><path d="M${x + 3} ${y - 1}h6" stroke-width="1"/>` : '') + `<circle cx="${x + 24}" cy="${y + 1}" r="1.5" fill="${INK}" stroke="none" opacity=".45"/>` + (i % 5 === 0 ? `<path d="M${x + 30} ${y}q8 -5 16 0q-8 4 -16 0z" fill="#F9D0D9" stroke-width="1.3"/>` : '');
      else if (area === 'beach') b += `<ellipse cx="${x}" cy="${y}" rx="${4 + i % 3}" ry="2.4" fill="#D9BC86" stroke="none"/>` + (i % 4 === 0 ? `<path d="M${x + 20} ${y - 2}q4 -8 8 0z" fill="#F9D0D9" stroke-width="1.6"/>` : '');
      else if (season === 'summer') b += `<path d="M${x} 400q2 -16 -3 -24M${x + 6} 400q1 -18 7 -26M${x + 12} 400q-1 -12 4 -16" stroke="${col}" stroke-width="2.6"/>` + (i % 5 === 2 ? `<circle cx="${x + 26}" cy="${y - 4}" r="3.4" fill="#F9D0D9" stroke-width="1.4"/>` : '');
      // v2.5 season tufts: blossom dots in spring, orange tufts and fallen leaves in autumn, short bare tufts in winter
      else if (season === 'winter') b += `<path d="M${x} 400q1 -10 -2 -15M${x + 6} 400q1 -11 4 -16" stroke="${col}" stroke-width="2.4"/>`;
      else b += `<path d="M${x} 400q2 -16 -3 -24M${x + 6} 400q1 -18 7 -26M${x + 12} 400q-1 -12 4 -16" stroke="${col}" stroke-width="2.6"/>` + (season === 'spring' ? (i % 2 ? `<circle cx="${x + 26}" cy="${y - 4}" r="3.4" fill="${i % 4 === 1 ? '#FFFFFF' : '#F9C6D4'}" stroke-width="1.4"/><circle cx="${x + 26}" cy="${y - 4}" r="1.2" fill="#F7C65E" stroke="none"/>` : '') : (i % 2 ? `<path d="M${x + 18} ${y - 1}q7 -6 14 0q-7 5 -14 0z" fill="${['#F2B25C', '#E8895A', '#F3CB58'][i % 3]}" stroke-width="1.2"/>` : ''));
    }
    if (snow) b += `<path d="M0 396q150 -10 300 -2t300 0v8h-600z" fill="#FFFFFF" fill-opacity=".85" stroke="none"/>`;
    return svgWrap([FGW, 400], b);
  })();
  // tint: night darker, dusk/dawn warm, rain grey (stronger when the strip art itself does not handle it)
  const tints = [];
  if (night) tints.push(artTW ? 'rgba(28,36,84,.22)' : 'rgba(22,30,78,.46)');
  if (time === 'dusk') tints.push(artTW ? 'rgba(240,140,90,.08)' : 'rgba(236,128,96,.18)');
  if (time === 'dawn') tints.push(artTW ? 'rgba(250,170,170,.08)' : 'rgba(250,170,160,.16)');
  if (rain && !artTW) tints.push('rgba(90,110,140,.16)');
  if (tints.length) { E.tint.style.background = tints.map((c) => `linear-gradient(${c},${c})`).join(','); E.tint.style.mixBlendMode = 'multiply'; }
  if (rain) E.wx.classList.add('pw-rain');
  if (snow) E.wx.classList.add('pw-snow');
  if (night) { let f = ''; for (let i = 0; i < 12; i++) f += `<i class="pw-ff" style="left:${(i * 83) % 100}%;top:${30 + (i * 37) % 45}%;animation-delay:${-i * 0.7}s;animation-duration:${4 + (i % 4)}s"></i>`; E.ffs.innerHTML = f; }

  /* ---------- the dog: every pose rendered ONCE, swapped by visibility ---------- */
  const POSES = ['walk', 'jump', 'crouch', 'dig', 'sad', 'happy', 'shake', 'eat', 'cold', 'idle'];
  const POSE_FB = { crouch: ['sit', 'idle'], dig: ['eat', 'idle'], shake: ['happy', 'idle'], cold: ['sad', 'idle'], eat: ['idle'], sad: ['idle'], jump: ['happy', 'idle'], happy: ['idle'], walk: ['idle'] };
  const poseEls = {};
  function dogSvg(p) {
    const tries = [p].concat(POSE_FB[p] || []);
    for (const q of tries) {
      const s = call('dog', dogInfo.key, { pose: q, outfit: dogInfo.outfit || {}, facing: 'right', coat: dogInfo.coat, seed: dogInfo.seed });
      if (s && (s.indexOf('pa-pose-' + q) >= 0 || q === 'idle')) return s;
      if (s && s.indexOf('pa-pose-') < 0) return s; // unknown art module: take whatever it gives
    }
    return svgWrap([240, 200], '<ellipse cx="120" cy="140" rx="60" ry="30" fill="#F4A262"/><circle cx="175" cy="110" r="26" fill="#F4A262"/><path d="M80 170v16M100 170v16M140 170v16M160 170v16"/>');
  }
  const poseStr = {};
  POSES.forEach((p) => { const d = document.createElement('div'); d.className = 'pw-pose'; d.innerHTML = poseStr[p] = dogSvg(p); E.dog.appendChild(d); poseEls[p] = d; });
  let curPose = null;
  function setPose(p) { if (p === curPose) return; if (curPose) poseEls[curPose].classList.remove('on'); poseEls[p].classList.add('on'); curPose = p; }
  setPose('idle');
  // normalise the breed size so every dog reads at the same height (the hitbox is the same for all)
  let dogSc = 0.68;
  try {
    const g = poseEls.walk.querySelector('svg>g') || poseEls.walk.querySelector('svg');
    poseEls.walk.style.width = '240px'; poseEls.walk.style.height = '200px'; poseEls.walk.style.position = 'absolute';
    const b = g.getBBox(); poseEls.walk.style.cssText = '';
    if (b && b.height > 20) dogSc = clamp(Math.min(90 / (186 - b.y), 158 / b.width), 0.55, 0.8);
  } catch (e) { /* keep default */ }

  /* ---------- layout (px per world unit) ---------- */
  let s = 1.5, LW = 800, elW = 1240, elH = 620, mode = '', coarse = false;
  let sayY = 0;
  try { coarse = !!(window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || (window.matchMedia('(hover: none)').matches && navigator.maxTouchPoints > 0))); } catch (e) { coarse = false; }
  const COARSE0 = coarse; // the touch-tablet layout is chosen from the pointer the device starts with, never from a first touch mid-run (that made the strip jump on touch laptops)
  const PT_LW = 620; // world units across in portrait: >= 1.8 s of warning at top speed
  const px = (u) => (u * s).toFixed(2) + 'px';
  function layout() {
    const r = root.getBoundingClientRect(); elW = Math.max(280, r.width || el.clientWidth || 1240); elH = Math.max(240, r.height || el.clientHeight || 620);
    // layout mode: 'desk' (unchanged laptop view), 'cp' (compact landscape phone), 'pt' (portrait: letterboxed landscape strip)
    const prevMode = mode;
    if (elW >= 820) mode = COARSE0 && elH >= 440 ? 'tab' : elH < 500 ? 'cp' : 'desk';
    else mode = (elH / elW > 0.75 || elW / (elH / VIEW_H) < PT_LW) ? 'pt' : 'cp';
    root.classList.toggle('pw-coarse', coarse); root.classList.toggle('pw-pt', mode === 'pt'); root.classList.toggle('pw-cp', mode === 'cp'); root.classList.toggle('pw-touchui', mode !== 'desk'); root.classList.toggle('pw-tab', mode === 'tab');
    DOG.x = mode === 'pt' ? 120 : mode === 'cp' ? 170 : 200;
    E.stage.style.cssText = ''; E.ctrls.style.cssText = ''; E.legend.style.cssText = ''; root.style.removeProperty('--pw-st'); root.style.removeProperty('--pw-sh');
    if (mode === 'pt') {
      s = elW / PT_LW; LW = PT_LW;
      const hudB = E.hud.offsetTop + E.hud.offsetHeight + 8, sh = Math.round(VIEW_H * s);
      // the strip, the legend and the controls are one group, centred in the space under the HUD; spare height makes the buttons taller (up to 150 px)
      const lgH = E.legend.offsetHeight, DIGH = 72, GAP = 10, avail = elH - hudB;
      const fixed = sh + 8 + lgH + 8, bigH = clamp(avail - fixed - DIGH - GAP - 24, 88, 150);
      const group = fixed + bigH + GAP + DIGH, top = hudB + Math.max(0, Math.min(Math.round((avail - fixed - bigH) / 2), avail - group));
      Object.assign(E.stage.style, { inset: 'auto', left: '0', right: '0', top: top + 'px', height: sh + 'px' });
      root.style.setProperty('--pw-st', top + 'px'); root.style.setProperty('--pw-sh', sh + 'px'); // the countdown stays on the strip, clear of the legend
      Object.assign(E.legend.style, { top: (top + sh + 8) + 'px', bottom: 'auto' });
      Object.assign(E.ctrls.style, { top: (top + sh + 8 + lgH + 8) + 'px', bottom: 'auto', height: (bigH + GAP + DIGH) + 'px', gridTemplateRows: bigH + 'px ' + DIGH + 'px', paddingBottom: '0' });
    } else if (mode === 'cp') {
      // compact landscape: the world sits under the slim HUD; the dog stands clear of the Duck button
      const top = E.hud.offsetTop + E.hud.offsetHeight + 4, sh = Math.max(160, elH - top);
      Object.assign(E.stage.style, { inset: 'auto', left: '0', right: '0', top: top + 'px', height: sh + 'px' });
      s = sh / VIEW_H; LW = elW / s; if (LW < PT_LW) { s = elW / PT_LW; LW = PT_LW; }
      DOG.x = Math.max(170, Math.min(LW * 0.4, (E.duckB.offsetWidth + 22) / s + 95));
    } else if (mode === 'tab') {
      // touch tablet: the controls and the legend sit under the strip, never on the path
      const lgH = E.legend.offsetHeight, bh = E.duckB.offsetHeight || 74, sh = Math.max(260, elH - (6 + lgH + 8 + bh + 14));
      Object.assign(E.stage.style, { inset: 'auto', left: '0', right: '0', top: '0', height: sh + 'px' });
      s = sh / VIEW_H; LW = elW / s;
      Object.assign(E.legend.style, { top: (sh + 6) + 'px', bottom: 'auto' });
      Object.assign(E.ctrls.style, { top: (sh + 6 + lgH + 8) + 'px', bottom: 'auto' });
    } else { s = elH / VIEW_H; LW = elW / s; }
    if (mode !== prevMode || coarse !== S.coarseShown) {
      S.coarseShown = coarse; const touch = mode !== 'desk' || coarse;
      root.querySelectorAll('[data-touch]').forEach((k) => { k.innerHTML = k.getAttribute(touch ? 'data-touch' : 'data-desk'); });
      E.prompt.textContent = touch ? 'Dig! (tap)' : 'Dig! (D)';
    }
    const tiles = (w, svg, layer) => { const n = Math.ceil(LW / w) + 1; let h = ''; for (let i = 0; i < n; i++) h += `<div class="pw-tile" style="left:${px(i * w)};width:${px(w)};height:${px(VIEW_H)}">${svg}</div>`; layer.innerHTML = h; };
    tiles(TW, stripSvg, E.strip); tiles(FARW, farSvg, E.far); tiles(FGW, fgSvg, E.fg);
    E.veil.style.height = px(G - 3); E.far.style.opacity = '.6';
    E.dog.style.left = px(DOG.x - 120 * dogSc); E.dog.style.top = px(G - 186 * dogSc); E.dog.style.width = px(240 * dogSc); E.dog.style.height = px(200 * dogSc);
    live.forEach(placeEl); lamps.forEach((l) => { l.k = -99; });
    E.say.style.left = px(DOG.x + 10); sayY = (G - 186 * dogSc) * s - 16; E.say.style.top = sayY.toFixed(1) + "px";
    E.prompt.style.left = px(DOG.x + 10);
  }

  /* ---------- level plan ---------- */
  const vAt = (t) => lerp(A.v[0], A.v[1], clamp(t / (0.75 * D), 0, 1)) * snowMul;
  function expectedDist(dur) { let d = 0; for (let t = 0; t < dur; t += 0.1) d += vAt(t) * 0.1; return d; }
  const ED = expectedDist(D), PLAN = ED * 0.88;
  const START_X = 0;
  // specials: dig spots, sniff spots, bonus sparkle
  const specials = [];
  const nDig = Math.random() < 0.5 ? 3 : 4;
  for (let i = 0; i < nDig; i++) specials.push({ t: 'dig', x: START_X + PLAN * (0.16 + 0.68 * (i + rand(0.2, 0.8)) / nDig) });
  const digs = specials.slice();
  const treasureDig = o.firstWalk ? digs[0] : pick(digs); treasureDig.treasure = true;
  const nSniff = D >= 60 ? (Math.random() < 0.5 ? 4 : 5) : D >= 40 ? 3 : 2;
  for (let i = 0; i < nSniff; i++) {
    let x = START_X + PLAN * (0.07 + 0.86 * (i + rand(0.25, 0.75)) / nSniff);
    for (const d of digs) if (Math.abs(d.x - x) < 700) x = d.x + (x < d.x ? -700 : 700);
    specials.push({ t: 'sniff', x });
  }
  if (Math.random() < 0.1 || o._forceBonus) {
    let x = START_X + PLAN * rand(0.3, 0.7);
    for (let k = 0; k < 6; k++) { const near = specials.some((q) => Math.abs(q.x - x) < 650); if (!near) break; x += 700; }
    specials.push({ t: 'bonus', x });
  }
  specials.sort((a, b) => a.x - b.x);

  /* ---------- generator (lazy, by distance) ---------- */
  const items = []; // generated objects not yet materialised
  const live = [];  // objects with DOM
  const coinTarget = Math.round(rand(24, 32));
  const gen = { x: START_X + 700 + vAt(0) * 1.6, n: 0, coins: 0, si: 0, teach: ['low', 'high', 'wide'].filter((c) => c !== 'wide' || A.wide.length || rain), band: 0 };
  let uid = 0;
  function speedAtX(x) { const p = clamp(x / Math.max(1, ED), 0, 1); return vAt(p * D); }
  function addObstacle(name, x) {
    const d = OBS[name], w = d.vb[0] * d.k, h = d.vb[1] * d.k;
    const ins = d.cat === 'low' || d.solid ? 0.175 : 0.15; // low obstacles: 65% wide hitbox
    const ob = { id: ++uid, kind: 'obs', name, cat: d.cat, x0: x, w, h, ex0: x + w * ins, ex1: x + w * (1 - ins) };
    if (d.cat === 'low') { ob.top = G - h + 3; ob.etop = h * 0.7; }
    else if (d.solid) { ob.top = G - h + 3; ob.etop = h * 0.62; ob.solid = true; }
    else if (d.cat === 'wide') { ob.top = G - h * 0.55; }
    else { ob.top = G - HIGH_BOTTOM - h; ob.ebot = HIGH_BOTTOM + 4; }
    const firstOfType = !S.seenTypes[name]; S.seenTypes[name] = true;
    if (S.hints[d.cat] < 3 || firstOfType) { S.hints[d.cat]++; ob.hint = (firstOfType && HINT_NAME[name]) || HINT[d.cat]; }
    if (firstOfType) ob.slowmo = true;
    if (d.cat === 'wide' && !S.arcShown) { S.arcShown = true; ob.arc = true; }
    items.push(ob); return ob;
  }
  function addCoin(x, hgt) { gen.coins++; items.push({ id: ++uid, kind: 'coin', x0: x - 17, w: 34, h: 34, top: G - hgt - 17, cx: x, ch: hgt }); }
  function coinBudget(n) { const allowed = coinTarget * clamp(gen.x / PLAN, 0, 1.25) + 4 - gen.coins; return allowed >= n && gen.coins + n <= 38; }
  function pickName(cat) {
    let names = A[cat].slice();
    if (cat === 'wide' && rain) { names = names.concat(A.rainWide || ['puddle', 'mud']); }
    if (cat === 'low' && snow) names = names.concat(['snowdrift', 'snowdrift']);
    if (cat === 'high' && night) { const nb = names.filter((n) => !FLYERS.includes(n)); if (nb.length && Math.random() < 0.7) names = nb; }
    return pick(names);
  }
  function pickCat(p) {
    if (gen.teach.length) return gen.teach.shift();
    let w = A.w.slice(); if (rain) w[1] = Math.max(w[1], 0.12) * 1.9; if (snow) w[1] *= 0.6;
    if (!A.wide.length && !rain) w[1] = 0;
    const tot = w[0] + w[1] + w[2]; let r = Math.random() * tot;
    return r < w[0] ? 'low' : r < w[0] + w[1] ? 'wide' : 'high';
  }
  function hazardPattern(x, p, v) { // returns end x
    const cat = pickCat(p), name = pickName(cat), ob = addObstacle(name, x);
    let end = x + ob.w;
    if (cat === 'low' && Math.random() < 0.45 && coinBudget(3)) {
      const c = x + ob.w / 2; [-46, 0, 46].forEach((dx, i) => addCoin(c + dx, i === 1 ? 108 : 82));
    } else if (cat === 'wide' && Math.random() < 0.6 && coinBudget(4)) {
      const a = ob.ex0, b = ob.ex1; [0.1, 0.37, 0.63, 0.9].forEach((f, i) => addCoin(lerp(a, b, f), i === 0 || i === 3 ? 95 : 135));
    } else if (cat === 'high' && Math.random() < 0.5 && coinBudget(3)) {
      const c = x + ob.w / 2; [-40, 0, 40].forEach((dx) => addCoin(c + dx, COIN_H.low));
    }
    // later in the walk: a second hazard right after (still ~1 s apart)
    if (v && p > A.combo && Math.random() < 0.35 && cat !== 'wide') {
      const cat2 = Math.random() < 0.5 ? 'low' : 'high';
      const gap = v * rand(1.0, 1.25) + (cat === 'low' && cat2 === 'low' ? 0 : 20);
      const ob2 = addObstacle(pickName(cat2), end + gap); end = ob2.x0 + ob2.w;
    }
    if (cat === 'wide') end += speedAtX(x) * 0.45; // long jump lands later
    return end;
  }
  function coinLine(x, n) {
    const band = ['low', 'mid', 'high'][gen.band++ % 3];
    for (let i = 0; i < n; i++) addCoin(x + i * 40, COIN_H[band] + (band === 'high' ? Math.sin(i / (n - 1) * Math.PI) * 14 : 0));
    return x + n * 40;
  }
  function genUntil(limit) {
    let guard = 0;
    while (gen.x < limit && guard++ < 50) {
      const p = clamp(gen.x / PLAN, 0, 1), v = speedAtX(gen.x);
      const sp = specials[gen.si];
      const big = sp && sp.t === 'dig', clearBefore = v * (big ? 1.2 : 0.5), clearAfter = v * (big ? 1.3 : 0.45);
      if (sp && sp.x - gen.x < clearBefore) {
        // special zone: nothing dangerous around it
        if (sp.t === 'dig') items.push({ id: ++uid, kind: 'dig', x0: sp.x - 34, w: 68, h: 68, top: G - 46, cx: sp.x, treasure: !!sp.treasure, sp });
        else if (sp.t === 'sniff') items.push({ id: ++uid, kind: 'sniff', x0: sp.x - 30, w: 60, h: 60, top: G - 50, cx: sp.x });
        else if (sp.t === 'bonus') {
          items.push({ id: ++uid, kind: 'bonus', x0: sp.x - 34, w: 68, h: 68, top: G - 118 - 34, cx: sp.x, ch: 118 });
          if (coinBudget(3)) [-120, -80, -40].forEach((dx, i) => addCoin(sp.x + dx, 60 + i * 22));
        }
        gen.x = Math.max(gen.x, sp.x + clearAfter); gen.si++; continue;
      }
      const g = A.gap, gap = rand(lerp(g[0], g[2], p), lerp(g[1], g[3], p));
      const firstGap = gen.n < 3 ? 1.0 : 0; // gentle tutorial spacing for the first three hazards
      // would the next hazard (plus a possible combo) run into a special zone? then fill with a coin line instead
      const room = sp ? sp.x - clearBefore - gen.x : 1e9;
      if (room < 480) {
        if (room > 200 && coinBudget(4)) coinLine(gen.x + 20, 4);
        gen.x = sp.x - clearBefore + 1; continue;
      }
      const end = hazardPattern(gen.x, p, room > v * 1.4 + 650 ? v : 0); gen.n++;
      let next = end + v * (gap + firstGap);
      if (gap > 2.0 && coinBudget(4) && Math.random() < 0.75) { const mid = end + (next - end) * 0.5 - 80; coinLine(mid, 4); }
      gen.x = next;
    }
  }

  /* ---------- DOM for objects ---------- */
  function supportSvg(ob) { // poles / trunks for hanging things (drawn faint, behind the dog)
    const hgt = G - ob.top, w = ob.w; let b = '';
    if (ob.name === 'branch') b = `<path d="M${w * 0.03} ${ob.h * 0.12}q-6 ${hgt * 0.5} 2 ${hgt}M${w * 0.09} ${ob.h * 0.12}q4 ${hgt * 0.5} 6 ${hgt}" stroke="#A97E5A" stroke-width="3"/>`;
    else if (ob.name === 'sign') b = `<path d="M${w * 0.06} ${ob.h * 0.08}V${hgt}" stroke="${INK}" stroke-width="3" opacity=".7"/>`;
    else if (ob.name === 'bunting' || ob.name === 'awning') b = `<path d="M3 ${ob.h * 0.1}V${hgt}M${w - 3} ${ob.h * 0.1}V${hgt}" stroke="${INK}" stroke-width="3" opacity=".7"/>`;
    else return '';
    return `<svg class="pw-sup" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}" fill="none" stroke-linecap="round" style="width:${px(w)};height:${px(hgt)}">${b}</svg>`;
  }
  function arcSvg(ob) { // dotted long-jump guide shown on the first puddle
    const v = speedAtX(ob.x0), pts = simJump(true, v);
    const takeoff = ob.ex0 - DOG.feet - v * 0.25; // feet front reaches the puddle ~0.25 s after takeoff
    const ox = takeoff - ob.x0, oy = G - ob.top;
    const d = pts.filter((q, i) => i % 6 === 0).map((q, i) => `${i ? 'L' : 'M'}${(ox + q.dx).toFixed(1)} ${(oy - q.h - 8).toFixed(1)}`).join('');
    const minX = Math.min(0, ox) - 20, W2 = pts[pts.length - 1].dx + Math.abs(minX) + ob.w;
    return `<svg class="pw-sup" viewBox="${minX} ${oy - 190} ${W2} 200" style="left:${px(minX)};top:${px(oy - 190)};width:${px(W2)};height:${px(200)}" fill="none"><path d="${d}" stroke="${INK}" stroke-width="2.4" stroke-dasharray="2 9" stroke-linecap="round"/><text x="${ox}" y="${oy - 20}" font-family="Caveat,cursive" font-size="22" font-weight="700" fill="#d2483b">hold jump here!</text><path d="M${ox + 6} ${oy - 12}v10" stroke="#d2483b" stroke-width="2.4"/></svg>`;
  }
  function makeEl(ob) {
    const d = document.createElement('div'); d.className = 'pw-obj';
    let src = '';
    if (ob.kind === 'obs') { src = obstacleUri(ob.name); if (FLYERS.includes(ob.name)) d.classList.add('pw-fly'); if (ob.name === 'crab') d.classList.add('pw-scuttle'); if (ob.name === 'kite') d.classList.add('pw-spin'); }
    else if (ob.kind === 'coin') { src = colUri('coin'); d.classList.add('pw-coin'); }
    else if (ob.kind === 'sniff') src = colUri('sniff');
    else if (ob.kind === 'dig') { src = colUri('dig'); d.classList.add('pw-x'); d.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (S.prompt === ob) doDig(); }); }
    else if (ob.kind === 'bonus') { src = colUri('sparkle-spot'); d.classList.add('pw-glow'); }
    let html = '';
    if (ob.kind === 'obs') {
      const gy = G - ob.top; // ground line inside the element (units)
      html += supportSvg(ob);
      if (ob.cat === 'low' || ob.solid) html += `<i class="pw-shadow" style="left:${(ob.w * 0.02).toFixed(1)}em;top:${(gy - 8).toFixed(1)}em;width:${(ob.w * 0.96).toFixed(1)}em;height:15em"></i>`;
      if (ob.cat === 'high') html += `<i class="pw-shadow light" style="left:${(ob.w * 0.12).toFixed(1)}em;top:${(gy - 6).toFixed(1)}em;width:${(ob.w * 0.76).toFixed(1)}em;height:12em"></i>`;
      html += stickerImg(ob.name);
      const bt = ob.cat === 'high' ? ob.h + 8 : ob.cat === 'wide' ? -40 : -42;
      html += badgeHtml(ob.cat, `left:50%;top:${bt}em`);
    } else {
      if (ob.kind === 'dig') html += '<i class="pw-ring2"></i>';
      html += `<img alt="" draggable="false" src="${src}"${ob.kind === 'coin' ? ` style="animation-delay:${(-(ob.cx % 600) / 300).toFixed(2)}s"` : ''}>`;
    }
    if (ob.kind === 'dig' && ob.treasure && ab.goggles) html += `<div class="pw-obj pw-glow" style="left:${px(4)};top:${px(-58)};width:${px(60)};height:${px(60)}"><img alt="" src="${colUri('sparkle-spot')}"></div>`;
    if (ob.kind === 'bonus') html += `<div class="pw-obj" style="left:${px(18)};top:${px(18)};width:${px(32)};height:${px(32)}"><img alt="" src="${colUri('chest')}"></div>`;
    if (ob.arc) html += arcSvg(ob);
    if (ob.hint) html += `<div class="pw-hint" style="top:${px(ob.cat === 'high' ? -8 : ob.cat === 'wide' ? -150 : -120)}">${esc(ob.hint)}</div>`;
    d.innerHTML = html; if (ob.hint || ob.arc) d.style.zIndex = 3; ob.el = d; placeEl(ob); E.objs.appendChild(d);
  }
  function placeEl(ob) {
    if (!ob.el) return; const st = ob.el.style;
    st.left = px(ob.x0); st.top = px(ob.top); st.width = px(ob.w); st.height = px(ob.h); st.fontSize = px(1);
  }
  function killEl(ob) { if (ob.el) { ob.el.remove(); ob.el = null; } }
  function syncObjects() {
    genUntil(S.camX + LW + 1800);
    items.sort((a, b) => a.x0 - b.x0);
    // materialise what is about to enter the view
    while (items.length && items[0].x0 < S.camX + LW + 160) { const ob = items.shift(); makeEl(ob); live.push(ob); }
    for (let i = live.length - 1; i >= 0; i--) { const ob = live[i];
      if (ob.slowmo && ob.x0 < S.camX + LW - 40 && S.mode === 'run' && !S.endT) { ob.slowmo = false; S.slowmoT = 1.0; }
      if (ob.x0 + ob.w < S.camX - 260) { killEl(ob); live.splice(i, 1); } }
  }
  // night: street lamps + pools of light (recycled pool of 3)
  const lamps = [];
  if (night && A.lamps !== false) for (let i = 0; i < 3; i++) {
    const le = document.createElement('div'); le.className = 'pw-obj'; le.innerHTML = `<img alt="" src="${lampUri()}">`; E.objs.appendChild(le);
    const pe = document.createElement('div'); pe.className = 'pw-pool'; E.lights.appendChild(pe);
    lamps.push({ le, pe, k: -99 });
  }
  function syncLamps() {
    if (!lamps.length) return; const SP = 900, base = Math.floor((S.camX - 200) / SP);
    for (let k = base; k < base + 3; k++) {
      const l = lamps[((k % 3) + 3) % 3]; if (l.k === k) continue; l.k = k; const x = k * SP + 520;
      Object.assign(l.le.style, { left: px(x - 20), top: px(G - 160), width: px(40), height: px(160), zIndex: 0 });
      Object.assign(l.pe.style, { left: px(x - 150), top: px(G - 200), width: px(300), height: px(250) });
    }
  }

  /* ---------- feedback helpers ---------- */
  let sayTimer = 0;
  function say(t, ms) { E.say.textContent = t; E.say.hidden = false; clearTimeout(sayTimer); sayTimer = setTimeout(() => { E.say.hidden = true; }, ms || 1800); }
  function pop(text, uX, uY, color) {
    const p = document.createElement('div'); p.className = 'pw-pop'; p.textContent = text; p.style.left = px(uX); p.style.top = px(uY); if (color) p.style.color = color;
    E.fx.appendChild(p); setTimeout(() => p.remove(), 1050);
  }
  function splashFx(muddy) {
    for (let i = 0; i < 9; i++) {
      const d = document.createElement('i'); d.className = 'pw-drop';
      d.style.left = px(DOG.x + rand(-30, 30)); d.style.top = px(G - 8); d.style.background = muddy ? '#9C6B4A' : '#AFD6F0';
      d.style.setProperty('--dx', rand(-60, 60).toFixed(0) + 'px'); d.style.setProperty('--dy', rand(-90, -30).toFixed(0) + 'px');
      E.fx.appendChild(d); setTimeout(() => d.remove(), 650);
    }
  }
  function poseFor(p, dur) { S.poseO = p; S.poseT = dur; }
  function updateCoinsHud() { E.cn.textContent = String(S.coins); }
  function updateDigsHud() {
    let h = ''; for (let i = 0; i < S.digsMax; i++) h += `<span class="pw-xm${i < S.digsUsed ? ' used' : ''}">X</span>`;
    E.xs.innerHTML = S.found ? '<b style="font-size:22px">found!</b>' : h;
  }
  updateCoinsHud(); updateDigsHud();

  /* ---------- nose-o-meter ---------- */
  const noseRange = 1500 * (ab.necklace ? 2 : 1) * (+ab.noseMul > 0 ? +ab.noseMul : 1); // noseMul: breed flavour (beagle 1.25, v1.7)
  function heat() {
    if (S.found || treasureDig.done) return null;
    const dx = S.camX + DOG.x; return clamp(1 - Math.abs(treasureDig.x - dx) / noseRange + S.nudge, 0, 1);
  }
  let noseT = 0, noseK = '';
  function updateNose() {
    const h = heat();
    let k, w;
    if (h === null) { k = 'warm'; w = 1; E.nl.textContent = S.found ? 'Found!' : 'Dug'; }
    else { k = h > 0.72 ? 'hot' : h > 0.38 ? 'warm' : 'cold'; w = 0.06 + h * 0.94; E.nl.textContent = k === 'hot' ? 'HOT' : k === 'warm' ? 'Warm' : 'Cold'; }
    if (k !== noseK) { E.nose.className = 'pw-nose ' + k; noseK = k; }
    E.noseBar.style.transform = `scaleX(${w.toFixed(3)})`;
  }
  function sniffClue() {
    if (S.found || treasureDig.done) return pick(L.done);
    S.nudge = Math.min(0.25, S.nudge + 0.18);
    const dx = S.camX + DOG.x; if (treasureDig.x < dx - 200) return pick(L.past);
    const h = heat(); return pick(h > 0.72 ? L.hot : h > 0.38 ? L.warm : L.far);
  }

  /* ---------- actions ---------- */
  function jumpPress() {
    if (S.jumpHeld) return; S.jumpHeld = true; E.jumpB.classList.add('down');
    if (S.mode === 'reveal') { closeReveal(); return; }
    if (S.mode !== 'run' || S.endT) return;
    if (S.prompt) skipPrompt();
    S.bufT = PH.BUFFER;
  }
  function jumpRelease() { S.jumpHeld = false; E.jumpB.classList.remove('down'); }
  function crouchPress() { if (S.crouchHeld) return; S.crouchHeld = true; E.duckB.classList.add('down'); if (S.mode === 'run' && S.grounded) sfx('crouch'); }
  function crouchRelease() { S.crouchHeld = false; E.duckB.classList.remove('down'); }
  function doJump() {
    S.grounded = false; S.vh = PH.V0; S.airT = 0; S.bufT = 0; S.coyT = 0; S.longOK = true; S.isLong = false; sfx('jump');
  }
  function land() {
    S.grounded = true; S.vh = 0; S.h = 0; S.isLong = false;
    sfx(snow ? 'snow-crunch' : 'land');
    if (snow) S.slideX = 10; // tiny cosmetic skid on snow
  }
  function stumble(ob) {
    S.hitLog.push([ob.name, Math.round(S.played * 10) / 10, Math.round(S.h), S.crouchHeld ? 1 : 0, Math.round(S.v)]);
    S.hits++; S.invT = 1.3; S.stumbleT = 0.4; poseFor('sad', 0.45); sfx('bonk');
    const lost = Math.min(3, Math.max(0, D - S.t)); S.t += lost; S.timeLost += lost;
    pop('Bonk!', DOG.x - 70, G - 150, '#d2483b');
    timePenaltyFx();
    say(pick(L.bonkName[ob.name] && Math.random() < 0.6 ? L.bonkName[ob.name] : ob.cat === 'high' ? L.bonkHigh : L.bonk), 1700);
  }
  function timePenaltyFx() {
    const t = document.createElement('span'); t.className = 'pw-tpop'; t.textContent = '\u22123s'; E.time.appendChild(t); setTimeout(() => t.remove(), 1300);
    E.time.classList.remove('pw-hit'); void E.time.offsetWidth; E.time.classList.add('pw-hit');
  }
  function splash(ob) {
    S.splashes++; const mud = ob.name === 'mud'; splashFx(mud); sfx('splash');
    if (dryCoat) { pop('Dry!', DOG.x, G - 110, '#4D7FC0'); say(pick(L.dry), 1500); }
    else { S.cleanLoss = (S.cleanLoss || 0) + (mud ? 9 : 6); pop(mud ? 'Muddy!' : 'Soggy!', DOG.x, G - 110, '#7d533a'); say(pick(L.splash), 1600); }
    poseFor('shake', 0.5); setTimeout(() => { if (!S.stopped) sfx('shake'); }, 120);
  }
  function collectCoin(ob) {
    ob.got = true; S.coins++; updateCoinsHud(); sfx('coin'); if (ob.el) ob.el.classList.add('pw-got');
  }
  function startSniff(ob) {
    ob.done = true; S.sniffs++; S.sniffT = 0.6; sfx('sniff'); poseFor('eat', 0.55);
    if (ob.el) ob.el.classList.add('pw-got');
    const clue = sniffClue(); say(clue, 2400); sayExt(clue, 2400);
  }
  function startPrompt(ob) {
    ob.prompted = true;
    if (S.found) return;
    if (S.digsUsed >= S.digsMax) { if (!S.outOfDigsSaid) { S.outOfDigsSaid = true; say('Out of digs. The nose sighs.', 1800); } return; }
    S.prompt = ob; S.promptT = 1.5; E.digB.hidden = false; E.prompt.hidden = false; sfx('pop');
    if (o.firstWalk && ob.treasure && !S.firstHintSaid) { S.firstHintSaid = true; say(mode !== 'desk' || coarse ? 'This X smells AMAZING. Tap Dig!' : 'This X smells AMAZING. Press D to dig!', 2200); }
  }
  function skipPrompt() { if (!S.prompt) return; S.prompt.skipped = true; S.prompt = null; E.digB.hidden = true; E.prompt.hidden = true; }
  function doDig() {
    if (S.mode !== 'run' || !S.prompt || S.endT) return;
    const ob = S.prompt; S.prompt = null; E.digB.hidden = true; E.prompt.hidden = true;
    ob.done = true; S.digsUsed++; updateDigsHud(); S.mode = 'digging'; S.digT = 1.15; S.digObj = ob; S.h = 0; S.vh = 0; S.grounded = true;
    setPose('dig'); sfx('dig'); setTimeout(() => { if (!S.stopped) sfx('dig'); }, 420);
  }
  function rarityClass(r) { return String(r || 'common').toLowerCase().replace(/[^a-z]/g, ''); }
  function showCard(html, secs) {
    E.ov.className = 'pw-ov dim'; E.ov.hidden = false; E.ov.innerHTML = `<div class="pw-card pw-panel">${html}</div>`;
    const b = E.ov.querySelector('[data-ok]'); if (b) b.addEventListener('click', closeReveal);
    S.mode = 'reveal'; S.revealT = secs;
  }
  function treasureHtml(r, title) {
    if (r && r.name) {
      const art = call('item', r.name);
      return `<h2>${esc(title)}</h2><div class="pw-art">${art || ''}</div><h3>${esc(r.name)}</h3>${r.rarity ? `<span class="pw-stamp ${rarityClass(r.rarity)}">${esc(r.rarity)}</span>` : ''}<p>${esc(r.desc || '')}</p>${r.dup ? '<p><i>You already have one. A squirrel will buy it.</i></p>' : ''}<div class="pw-row"><button class="pw-btn yes" data-ok tabindex="-1">Keep walking <span class="pw-k">Space</span></button></div>`;
    }
    const c = r && r.coins ? +r.coins : 0;
    return `<h2>${esc(title)}</h2><div class="pw-art">${colSvg('chest')}</div><p>${esc((r && r.text) || 'A pouch of coins!')}</p><h3>+${c} coins</h3><div class="pw-row"><button class="pw-btn yes" data-ok tabindex="-1">Keep walking <span class="pw-k">Space</span></button></div>`;
  }
  function finishDig() {
    const ob = S.digObj; S.digObj = null; if (ob && ob.el) ob.el.classList.add('pw-dug');
    if (ob && ob.treasure) {
      let r = null; try { r = (o.rollTreasure || noop)(area); } catch (e) { r = null; }
      if (!r) r = { coins: 40, text: 'A pouch of coins!' };
      S.treasure = r; S.found = true; updateDigsHud();
      if (!r.name && r.coins) S.treasureCoins += +r.coins || 0;
      sfx('treasure'); poseFor('happy', 1.2);
      showCard(treasureHtml(r, 'TREASURE!'), 3.2);
    } else {
      let j = null; try { j = (o.junk || noop)(); } catch (e) { j = null; }
      if (!j) j = { text: 'A rock shaped like a slightly different rock.', coins: 5 };
      S.junk.push({ text: j.text, coins: +j.coins || 0 }); S.junkCoins += +j.coins || 0;
      sfx('nope'); poseFor('sad', 0.6);
      showCard(`<h2>No treasure here...</h2><p>${esc(j.text)}</p><h3>+${+j.coins || 0} coins</h3><p style="font-size:16px;opacity:.8">${S.digsUsed >= S.digsMax ? 'That was the last dig.' : `Digs left: ${S.digsMax - S.digsUsed}. Watch the Nose-o-meter.`}</p><div class="pw-row"><button class="pw-btn yes" data-ok tabindex="-1">Onwards <span class="pw-k">Space</span></button></div>`, 2.2);
    }
  }
  function collectBonus(ob) {
    ob.done = true; if (ob.el) ob.el.classList.add('pw-got');
    let r = null; try { r = (o.rollTreasure || noop)(area); } catch (e) { r = null; }
    if (!r) return;
    r.bonus = true; S.bonus = r; if (!r.name && r.coins) S.treasureCoins += +r.coins || 0;
    sfx('treasure'); showCard(treasureHtml(r, 'Bonus sparkle!'), 2.6);
  }
  function closeReveal() {
    if (S.mode !== 'reveal') return; E.ov.hidden = true; E.ov.innerHTML = ''; E.ov.className = 'pw-ov'; S.mode = 'run';
    if (o.firstWalk && S.found && !S.firstDoneSaid) { S.firstDoneSaid = true; say('You found it! Every walk hides one.', 2200); }
  }

  /* ---------- pause / bag ---------- */
  let prevMode = 'run';
  function openPause() {
    if (S.ended || S.mode === 'paused' || S.mode === 'bag') return;
    prevMode = S.mode; S.mode = 'paused'; sfx('click'); releaseAll();
    E.ov.className = 'pw-ov dim'; E.ov.hidden = false;
    const TP = mode !== 'desk' || coarse, highs = esc(A.high.map((n) => OBS_LABEL[n].toLowerCase()).join(', '));
    E.ov.innerHTML = `<div class="pw-card pw-panel"><h2>Paused</h2><ul>${TP ? `
      <li><b>Jump</b>: tap the scene or Jump to hop, <b>hold</b> for a long jump (clears puddles).</li>
      <li><b>Duck</b>: swipe down, or hold Duck, to crouch under ${highs}.</li>
      <li><b>Dig!</b>: tap it when the dog stands on an X. The Nose-o-meter says HOT near the treasure.</li>
      <li><b>Bag</b>: opens the bag. <b>II</b>: pauses.</li>` : `
      <li><b>Space / &uarr; / Jump</b>: tap to hop, <b>hold</b> for a long jump (clears puddles).</li>
      <li><b>&darr; / S / Duck</b>: hold to crouch under ${highs}.</li>
      <li><b>D</b>: dig when the dog stands on an X. The Nose-o-meter says HOT near the treasure.</li>
      <li><b>B</b>: bag. <b>Esc</b>: pause.</li>`}</ul>
      <div class="pw-row"><button class="pw-btn yes" data-res tabindex="-1">Keep walking</button><button class="pw-btn" data-home tabindex="-1">Head home early</button></div></div>`;
    E.ov.querySelector('[data-res]').addEventListener('click', resume);
    E.ov.querySelector('[data-home]').addEventListener('click', () => { resume(); finish(true); });
  }
  function openBag() {
    if (S.ended || S.mode === 'paused' || S.mode === 'bag' || S.mode === 'countdown') return;
    prevMode = S.mode; S.mode = 'bag'; sfx('click'); releaseAll();
    const usable = bag.filter((b) => b.count > 0);
    const rows = usable.length ? usable.map((b) => `<div class="pw-bagrow"><span class="pw-ic">${call('item', b.name)}</span><span>${esc(b.name)} x${b.count}</span>${b.name === 'Wild Berries' ? `<button class="pw-btn yes" data-use="${esc(b.name)}" tabindex="-1">Eat: +15 s</button>` : '<span style="opacity:.7">not for walks</span>'}</div>`).join('')
      : '<p>The bag is empty. Wild Berries (a treasure) add +15 seconds.</p>';
    E.ov.className = 'pw-ov dim'; E.ov.hidden = false;
    E.ov.innerHTML = `<div class="pw-card pw-panel"><h2>Bag</h2>${rows}<div class="pw-row"><button class="pw-btn" data-res tabindex="-1">Close <span class="pw-k">B</span></button></div></div>`;
    E.ov.querySelector('[data-res]').addEventListener('click', resume);
    E.ov.querySelectorAll('[data-use]').forEach((b) => b.addEventListener('click', () => {
      const name = b.getAttribute('data-use'); let ok = false; try { ok = !!(o.useBagItem || noop)(name); } catch (e) { ok = false; }
      const it = bag.find((x) => x.name === name);
      if (ok) { if (it) it.count--; D += 15; sfx('crunch'); resume(); pop('+15 s', DOG.x, G - 130, '#4F9A5C'); say('Berries! Fuel for 15 more seconds.', 1800); }
      else { sfx('nope'); b.disabled = true; b.textContent = 'Can\'t use that now'; }
    }));
  }
  function resume() { if (S.mode !== 'paused' && S.mode !== 'bag') return; E.ov.hidden = true; E.ov.innerHTML = ''; E.ov.className = 'pw-ov'; S.mode = prevMode; last = performance.now(); acc = 0; }
  function releaseAll() { jumpRelease(); crouchRelease(); }

  /* ---------- results ---------- */
  function results() {
    const frac = clamp(S.t / D, 0, 1);
    const coinsRaw = S.coins + S.junkCoins + S.treasureCoins;
    const happiness = Math.max(0, Math.round(A.happy * frac + S.sniffs + S.digsUsed * 2 + (S.found ? 5 : 0) + S.squeaky - S.hapPen));
    const bond = Math.max(0, Math.round(A.bond * frac + S.sniffs + S.digsUsed * 2 + (S.found ? 3 : 0)));
    const energy = Math.round(A.energy * frac * (snow && !ab.warm ? 1.1 : 1));
    const cleanliness = Math.round(A.clean * 0.5 * frac + (S.cleanLoss || 0));
    return {
      coins: Math.round(coinsRaw * (ab.luckyPenny ? 1.1 : 1)), treasure: S.treasure, bonus: S.bonus, junk: S.junk.slice(), digsUsed: S.digsUsed,
      happiness, bond, energy, cleanliness, obstaclesHit: S.hits, timeLost: Math.round(S.timeLost), cleanRun: S.hits === 0 && (dryCoat || S.splashes === 0),
      distance: Math.round(S.camX / 130), puddlesCleared: S.puddlesCleared
    };
  }
  function finish(early) {
    if (S.ended) return; S.ended = true; S.mode = 'end'; detach();
    const r = results(); r.early = !!early; // the game words the sheet "Walk cut short" for Head home early
    try { (o.onEnd || noop)(r); } catch (e) { setTimeout(() => { throw e; }); }
  }
  function startEnding() {
    S.endT = 1.4; skipPrompt(); releaseAll(); sfx('bark');
    E.ov.className = 'pw-ov'; E.ov.hidden = false; E.ov.innerHTML = `<div class="pw-cd" style="font-size:80px">What a walk!</div>`;
  }

  /* ---------- "How to walk" tutorial (before the countdown) ---------- */
  const ROUTE_NAME = { park: 'Sunny Park', river: 'Riverside Trail', woods: 'Maple Woods', beach: 'Seashell Beach', town: 'Town Loop', hilltop: 'Hilltop Trail', pier: 'Pier Boardwalk' };
  const OBS_LABEL = { log: 'Log', rock: 'Rock', sprinkler: 'Sprinkler', snowdrift: 'Snowdrift', crab: 'Crab', sandcastle: 'Sandcastle', puddle: area === 'beach' ? 'Tide pool' : 'Puddle', mud: 'Mud', branch: 'Branch', bird: area === 'river' ? 'Duck' : 'Bird', sign: 'Sign', kite: 'Kite string', bunting: 'Bunting', cat: 'Cat', trashcan: 'Trash can', hydrant: 'Hydrant', bicycle: 'Bicycle', awning: 'Awning', molehill: 'Molehill', crate: 'Crate', ropecoil: 'Rope coil', seagull: 'Seagull', fishingline: 'Fishing line' };
  function routeObstacles() {
    const out = [], add = (n) => { if (!out.includes(n)) out.push(n); };
    A.low.forEach(add); if (snow) add('snowdrift'); A.wide.forEach(add); if (rain) (A.rainWide || ['puddle', 'mud']).forEach(add); A.high.forEach(add);
    return out;
  }
  function fitBox(name, bw, bh) { const vb = OBS[name].vb, k = Math.min(bw / vb[0], bh / vb[1]); return `width:${(vb[0] * k).toFixed(0)}px;height:${(vb[1] * k).toFixed(0)}px`; }
  const tut = { i: 0, n: 4 };
  function tutPage(i) {
    const T = mode !== 'desk' || coarse;
    const mLow = A.low[0], mWide = A.wide.find((n) => !OBS[n].solid) || 'puddle', mHigh = A.high[0];
    const lows = A.low.concat(snow ? ['snowdrift'] : []).map((n) => OBS_LABEL[n].toLowerCase()).join(', ');
    const highs = A.high.map((n) => OBS_LABEL[n].toLowerCase()).join(', ');
    if (i === 0) return `<h3>1. Your moves</h3>
      <div class="pw-trow"><div class="pw-mini jump"><div class="pw-mp" style="left:92px;${fitBox(mLow, 44, 24)}">${stickerImg(mLow)}</div><div class="pw-md">${poseStr.jump}</div></div>
        <div><b>Jump</b> &mdash; ${T ? 'tap the <b>scene</b> (or Jump)' : 'tap <b>Space</b> / <b>&uarr;</b> (or the Jump button)'}.<br>Hop over low things: ${esc(lows)}.</div></div>
      <div class="pw-trow"><div class="pw-mini long"><div class="pw-mp" style="left:40px;${fitBox(mWide, 76, 14)}">${stickerImg(mWide)}</div><div class="pw-md">${poseStr.jump}</div></div>
        <div><b>Long jump</b> &mdash; <b>hold</b> ${T ? 'the scene (or Jump)' : 'Space'}.<br>${A.wide.includes('bicycle') ? 'Clears parked bicycles, and floats over puddles to keep you clean.' : 'Floats over puddles and mud, and keeps you clean.'}</div></div>
      <div class="pw-trow"><div class="pw-mini duck"><div class="pw-mp" style="left:22px;top:2px;bottom:auto;${fitBox(mHigh, 110, 38)}">${stickerImg(mHigh)}</div><div class="pw-md" style="left:34px">${poseStr.crouch}</div></div>
        <div><b>Duck</b> &mdash; ${T ? '<b>swipe down</b>, or hold Duck' : 'hold <b>&darr;</b> / <b>S</b> (or the Duck button)'}.<br>Slide under high things: ${esc(highs)}.</div></div>`;
    if (i === 1) {
      const RN = ROUTE_NOTES[area], RW = ROUTE_WX[area] || {};
      const cells = routeObstacles().map((n) => { const c = OBS[n].cat; return `<div class="pw-obsc"><div class="pw-oi"><div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);${fitBox(n, 62, 42)}">${stickerImg(n)}</div></div><span><b>${esc(OBS_LABEL[n])}</b>${RN && RN[n] ? `<i>${esc(RN[n])}</i>` : BADGE[c][1]}</span>${badgeHtml(c)}</div>`; }).join('');
      const notes = [rain ? RW.rain || 'Rain: extra puddles and mud.' : '', snow ? RW.snow || 'Snow: snowdrifts and cold paws.' : '', night ? RW.night || 'Night: lamps light the path. Fewer birds.' : ''].filter(Boolean).join(' ');
      return `<h3>2. On this route</h3><p style="text-align:center;margin:0 0 6px">Every obstacle wears a badge: <span style="color:#d27a35">&uarr; jump</span>, <span style="color:#d2483b">&uarr;&uarr; long jump</span>, <span style="color:#4D7FC0">&darr; duck</span>.</p><div class="pw-obsgrid${RN ? ' pw-notes' : ''}">${cells}</div>${notes ? `<p style="text-align:center;margin:4px 0 0">${esc(notes)}</p>` : ''}`;
    }
    if (i === 2) return `<h3>3. The hidden treasure</h3>
      <div class="pw-trow"><span class="pw-tic">${$('.pw-noseic').innerHTML}</span><div><b>Nose-o-meter</b> (top bar) <span class="pw-nm"><i style="color:#5c86b8">Cold</i><i style="color:#d27a35">Warm</i><i style="color:#d2483b">HOT</i></span>It gets hotter near the treasure${ab.necklace ? ', and your Seashell Necklace smells it from twice as far' : ''}.</div></div>
      <div class="pw-trow"><span class="pw-tic"><img alt="" src="${colUri('sniff')}"></span><div><b>Sniff spots</b> &mdash; run through them for a clue.</div></div>
      <div class="pw-trow"><span class="pw-tic"><img alt="" src="${colUri('dig')}"></span><div><b>X marks a dig spot</b> &mdash; ${T ? 'tap <b>Dig!</b>' : 'press <b>D</b> or tap <b>Dig!</b>'} while standing on it.<br>Only ONE X hides the treasure.${ab.goggles ? ' Your Explorer Goggles make the right X sparkle.' : ''}${o.firstWalk ? ' Psst: on your first walk, try the first X.' : ''}</div></div>
      <div class="pw-trow"><span class="pw-tic" style="display:flex;align-items:center;justify-content:center"><span class="pw-xm" style="font-size:36px">X${S.digsMax > 2 ? 'XX' : 'X'}</span></span><div><b>Digs left: ${S.digsMax}</b> (${ab.extraDig ? 'the Acorn Cap gives you an extra dig' : '3 with the Acorn Cap'}). Choose wisely!</div></div>`;
    return `<h3>4. Bumps and coins</h3>
      <div class="pw-trow"><span class="pw-tic pw-neg" style="font-family:Caveat,cursive;font-weight:700;font-size:44px;color:#d2483b;line-height:52px;text-align:center">&minus;3s</span><div><b>Each bump costs 3 seconds</b> off the walk clock, then a short blink where nothing can bump you.</div></div>
      <div class="pw-trow"><div class="pw-mini" style="width:150px"><img alt="" src="${colUri('coin')}" style="position:absolute;left:14px;bottom:8px;width:26px"><img alt="" src="${colUri('coin')}" style="position:absolute;left:62px;bottom:34px;width:26px"><img alt="" src="${colUri('coin')}" style="position:absolute;left:110px;bottom:62px;width:26px"></div>
        <div><b>Coins sit at 3 heights</b><br>low: just walk &middot; middle: walk or hop &middot; high: jump.</div></div>
      <div class="pw-trow"><span class="pw-tic">${$('.pw-bagic').innerHTML}</span><div>${T ? 'The <b>bag</b> button' : '<b>B</b>'} opens the bag (Wild Berries add 15 s). ${T ? 'The <b>II</b> button' : '<b>Esc</b>'} pauses.</div></div>`;
  }
  function showTutorial() {
    S.mode = 'tutorial'; E.ov.className = 'pw-ov dim'; E.ov.hidden = false;
    const i = tut.i, last = i === tut.n - 1;
    E.ov.innerHTML = `<div class="pw-card pw-panel pw-tut" role="dialog" aria-label="How to walk"><h2>${esc(ROUTE_NAME[area] || 'Walk')}</h2><p class="pw-sub">How to walk</p>${tutPage(i)}
      <div class="pw-tfoot"><label class="pw-skip"><input type="checkbox" tabindex="-1" data-skip ${o.skipTutorial ? 'checked' : ''}> Skip next time</label>
      <span class="pw-dots">${[0, 1, 2, 3].map((k) => `<i class="${k === i ? 'on' : ''}">&#9679;</i>`).join('')}</span>
      ${i > 0 ? '<button class="pw-btn" data-back tabindex="-1">Back</button>' : ''}${last ? '' : '<button class="pw-btn" data-next tabindex="-1">Next <span class="pw-k">&rarr;</span></button>'}
      <button class="pw-btn yes" data-go tabindex="-1" style="font-family:Caveat,cursive;font-size:24px;font-weight:700">Let's go!</button></div></div>`;
    const q = (a) => E.ov.querySelector(a);
    q('[data-skip]').addEventListener('change', (e) => { e.target.blur(); o.skipTutorial = !!e.target.checked; try { if (typeof o.setSkipTutorial === 'function') o.setSkipTutorial(!!e.target.checked); } catch (er) { /* ignore */ } });
    if (q('[data-back]')) q('[data-back]').addEventListener('click', () => tutGo(-1));
    if (q('[data-next]')) q('[data-next]').addEventListener('click', () => tutGo(1));
    q('[data-go]').addEventListener('click', endTutorial);
  }
  function tutGo(d) { const n = clamp(tut.i + d, 0, tut.n - 1); if (n === tut.i) { if (d > 0) endTutorial(); return; } tut.i = n; sfx('click'); showTutorial(); }
  function endTutorial() { if (S.mode !== 'tutorial') return; sfx('click'); E.ov.hidden = true; E.ov.innerHTML = ''; E.ov.className = 'pw-ov'; S.mode = 'countdown'; S.cd = 3.0; S.cdShown = -1; last = performance.now(); acc = 0; }

  /* ---------- simulation step ---------- */
  function step(dt) {
    if (S.mode === 'countdown') {
      S.cd -= dt; const n = Math.ceil(S.cd);
      if (n !== S.cdShown) {
        S.cdShown = n; const w = n >= 3 ? 'Ready' : n === 2 ? 'sniff' : n === 1 ? 'GO!' : '';
        if (w) { E.ov.className = 'pw-ov'; E.ov.hidden = false; E.ov.innerHTML = `<div class="pw-cd">${w}</div>` + (S.remind ? (mode !== 'desk' || coarse ? '<div class="pw-remind pw-panel" style="padding:4px 14px"><b>Tap</b> jump &middot; <span style="white-space:nowrap"><b>hold</b> = long jump</span> &middot; <b>swipe down</b> duck &middot; <b>Dig!</b> at an X</div>' : '<div class="pw-remind pw-panel" style="padding:4px 14px"><b>Space/&uarr;</b> jump &middot; <b>hold</b> = long jump &middot; <b>&darr;/S</b> duck &middot; <b>D</b> dig at an X</div>') : ''); sfx(n === 1 ? 'bark' : 'click'); }
      }
      if (S.cd <= 0.15) { S.mode = 'run'; try { (o.onRun || noop)(); } catch (e) { /* ignore */ } E.ov.hidden = true; E.ov.innerHTML = ''; if (o.firstWalk) say('Psst: the FIRST X smells amazing. Follow your nose!', 2600); else if (rain) say(dryCoat ? 'Rain! Good thing about the coat.' : `Rain means ${(A.rainWide || ['puddle']).includes('puddle') ? 'puddles' : 'mud'}. Hold jump to leap ${(A.rainWide || ['puddle']).includes('puddle') ? 'them' : 'it'}!`, 2400); }
      return;
    }
    if (S.mode === 'reveal') { S.revealT -= dt; if (S.revealT <= 0) closeReveal(); return; }
    if (S.mode === 'digging') { S.digT -= dt; if (S.digT <= 0) { S.mode = 'run'; finishDig(); } return; }
    if (S.mode !== 'run') return;

    // timers
    if (!S.endT) { S.t += dt; S.played += dt; }
    if (S.invT > 0) S.invT -= dt;
    if (S.stumbleT > 0) S.stumbleT -= dt;
    if (S.poseT > 0) { S.poseT -= dt; if (S.poseT <= 0) S.poseO = null; }
    if (S.sniffT > 0) S.sniffT -= dt;
    if (S.slideX > 0) S.slideX = Math.max(0, S.slideX - dt * 40);
    S.nudge *= Math.pow(0.4, dt);
    if (S.prompt) { S.promptT -= dt; if (S.promptT <= 0) skipPrompt(); }

    // speed
    let target = 1;
    if (S.endT) target = 0; else if (S.prompt) target = 0.2; else if (S.sniffT > 0) target = 0.35; else if (S.stumbleT > 0) target = 0.65;
    S.slow += (target - S.slow) * Math.min(1, dt * (target < S.slow ? 14 : 5));
    const v = vAt(S.played) * S.slow;
    S.v = v; S.camX += v * dt;

    // jump physics
    if (S.bufT > 0) S.bufT -= dt;
    if (S.grounded) S.coyT = PH.COYOTE; else if (S.coyT > 0) S.coyT -= dt;
    if (S.bufT > 0 && (S.grounded || S.coyT > 0) && !S.endT && S.stumbleT < 0.25) doJump();
    if (!S.grounded) {
      S.airT += dt;
      if (!S.jumpHeld) S.longOK = false;
      let g = PH.GRAV;
      if (S.crouchHeld) g = PH.GRAV * PH.FAST;
      else if (S.jumpHeld && S.longOK && S.airT > PH.LONG_T) { g = PH.GLONG; if (!S.isLong) { S.isLong = true; sfx('longjump'); } }
      S.vh -= g * dt; S.h += S.vh * dt;
      if (S.h <= 0) land();
    }

    // shiver in snow without a warm outfit (cosmetic; the 8% slowdown is in vAt)
    if (snow && !ab.warm) { S.shiverNext -= dt; if (S.shiverNext <= 0 && S.grounded && !S.poseO) { S.shiverNext = rand(11, 16); if (!dangerAhead(1.6)) { poseFor('cold', 0.6); say(pick(L.cold), 1000); } } }

    // collisions (none while the walk winds down)
    if (S.endT) { S.endT -= dt; if (S.endT <= 0) finish(false); return; }
    const dxw = S.camX + DOG.x, bx0 = dxw + DOG.off - DOG.hw, bx1 = dxw + DOG.off + DOG.hw;
    const crouch = S.crouchHeld && S.grounded;
    const top = S.h + (crouch ? DOG.hCrouch : DOG.hStand), bot = S.h;
    const fx0 = dxw - DOG.feet, fx1 = dxw + DOG.feet;
    for (let i = 0; i < live.length; i++) {
      const ob = live[i]; if (ob.done) continue;
      if (ob.kind === 'coin') {
        if (ob.got) continue;
        const cxp = clamp(ob.cx, bx0, bx1), cyp = clamp(ob.ch, bot, top);
        if ((ob.cx - cxp) ** 2 + (ob.ch - cyp) ** 2 < (COIN_R + 4) ** 2) collectCoin(ob);
        else if (ob.cx < bx0 - 40) ob.done = true;
        continue;
      }
      if (ob.kind === 'obs') {
        if (ob.ex1 < (ob.cat === 'wide' && !ob.solid ? fx0 : bx0)) {
          ob.done = true; S.hazards++; if (ob.touched) S.touched++;
          if (ob.cat === 'wide' && !ob.solid && !ob.touched && !S.endT) { S.puddlesCleared++; S.squeaky++; pop(pick(L.squeaky), DOG.x, G - 150, '#4D7FC0'); sfx('kaching'); }
          continue;
        }
        if (ob.touched) continue;
        if (ob.cat === 'wide' && !ob.solid) { if (S.grounded && fx1 > ob.ex0 && fx0 < ob.ex1) { ob.touched = true; splash(ob); } continue; }
        if (bx1 < ob.ex0 || bx0 > ob.ex1) continue;
        const hit = ob.cat === 'high' ? top > ob.ebot : bot < ob.etop;
        if (hit) { ob.touched = true; if (S.invT <= 0 && !S.endT) stumble(ob); }
        continue;
      }
      if (ob.kind === 'sniff') { if (dxw >= ob.cx - 10 && !S.endT) startSniff(ob); continue; }
      if (ob.kind === 'dig') { if (!ob.prompted && dxw >= ob.cx - 50 && !S.endT) startPrompt(ob); if (ob.cx < dxw - 120) ob.done = true; continue; }
      if (ob.kind === 'bonus') {
        const cxp = clamp(ob.cx, bx0, bx1), cyp = clamp(ob.ch, bot, top);
        if ((ob.cx - cxp) ** 2 + (ob.ch - cyp) ** 2 < 36 * 36 && !S.endT) collectBonus(ob);
        else if (ob.cx < bx0 - 40) ob.done = true;
      }
    }
    if (S.mode !== 'run') return; // a card opened mid-step
    if (S.t >= D) startEnding(); // end of walk
  }
  function dangerAhead(sec) {
    const dxw = S.camX + DOG.x, lim = dxw + (S.v || 300) * sec;
    return live.some((ob) => ob.kind === 'obs' && !ob.done && ob.ex0 < lim && ob.ex1 > dxw - 40) || items.some((ob) => ob.kind === 'obs' && ob.ex0 < lim);
  }

  /* ---------- render ---------- */
  let wxY = 0;
  function render(now) {
    const cx = S.camX;
    E.strip.style.transform = `translate3d(${(-(cx % TW) * s).toFixed(1)}px,0,0)`;
    E.far.style.transform = `translate3d(${(-((cx * 0.25) % FARW) * s).toFixed(1)}px,0,0)`;
    E.fg.style.transform = `translate3d(${(-((cx * 1.15) % FGW) * s).toFixed(1)}px,0,0)`;
    const ox = `translate3d(${(-cx * s).toFixed(1)}px,0,0)`; E.objs.style.transform = ox; if (night) E.lights.style.transform = ox;
    // dog pose
    let p;
    if (S.mode === 'countdown') p = 'idle';
    else if (S.mode === 'digging') p = 'dig';
    else if (S.endT || S.mode === 'end') p = 'happy';
    else if (S.poseO && !(S.poseO === 'cold' && !S.grounded)) p = S.poseO;
    else if (!S.grounded) p = 'jump';
    else if (S.crouchHeld) p = 'crouch';
    else p = 'walk';
    if (S.mode === 'run' && !S.grounded && S.poseO !== 'sad') p = 'jump';
    if (S.mode === 'run' && S.grounded && S.crouchHeld && (S.poseO === 'shake' || S.poseO === 'eat')) p = 'crouch';
    setPose(p);
    const walking = S.mode === 'run' && S.grounded && p === 'walk' && S.slow > 0.3;
    const bob = walking ? -Math.abs(Math.sin(S.camX / 34)) * 3 : 0;
    const tilt = S.stumbleT > 0 ? Math.sin(S.stumbleT * 40) * 4 : !S.grounded ? clamp(-S.vh / 90, -8, 6) : 0;
    E.dog.style.transform = `translate3d(${(S.slideX * s).toFixed(1)}px,${((-S.h + bob) * s).toFixed(1)}px,0) rotate(${tilt.toFixed(1)}deg)`;
    const blink = S.invT > 0 && S.mode === 'run';
    if (blink !== E.dog._blink) { E.dog._blink = blink; E.dog.classList.toggle('pw-blink', blink); }
    // HUD
    const rem = Math.max(0, D - S.t);
    E.timeBar.style.transform = `scaleX(${(rem / D).toFixed(4)})`;
    const sec = Math.ceil(rem); if (sec !== S.lastSec) { S.lastSec = sec; E.secs.textContent = sec + 's'; E.time.classList.toggle('pw-low', sec <= 10); }
    if (now - noseT > 100) { noseT = now; updateNose(); }
    // an obstacle's hint fades out as the obstacle reaches the dog, so it never sits on the dog (or its jump)
    for (let i = 0; i < live.length; i++) { const ob = live[i]; if (!ob.el) continue; if (ob.hintEl === undefined) ob.hintEl = ob.el.querySelector('.pw-hint');
      if (ob.hintEl) { const op = clamp((Math.abs(ob.x0 + ob.w / 2 - cx - DOG.x) - 90) / 80, 0, 1); const v = op.toFixed(2); if (ob.hintOp !== v) { ob.hintOp = v; ob.hintEl.style.opacity = v; } } }
    // an obstacle hint steps aside (hides) while the dog's speech bubble would sit on it: the bubble carries the lesson ("Tap Dig!"), the hint is only a nudge
    { const sayUp = !E.say.hidden, sr = sayUp ? E.say.getBoundingClientRect() : null;
      for (let i = 0; i < live.length; i++) { const he = live[i].hintEl; if (!he) continue; let hide = false;
        if (sayUp && +he.style.opacity >= 0.05) { const hr = he.getBoundingClientRect(); hide = hr.width > 0 && hr.left < sr.right && hr.right > sr.left && hr.top < sr.bottom && hr.bottom > sr.top; }
        if (live[i].hintHide !== hide) { live[i].hintHide = hide; he.style.visibility = hide ? 'hidden' : ''; } } }
    if (S.prompt) { E.ring.style.transform = `scaleX(${clamp(S.promptT / 1.5, 0, 1).toFixed(3)})`; E.prompt.style.left = px(S.prompt.cx - cx); E.prompt.style.top = ((E.say.hidden ? sayY + 8 : sayY - E.say.offsetHeight) - 8).toFixed(1) + "px"; }
  }

  /* ---------- loop ---------- */
  let raf = 0, last = performance.now(), acc = 0;
  function frame(now) {
    if (S.stopped) return;
    raf = requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now; if (!(dt > 0)) dt = 0; if (dt > 0.1) dt = 0.1;
    if (S.mode !== 'paused' && S.mode !== 'bag' && S.mode !== 'end' && S.mode !== 'tutorial') {
      acc += dt; let n = 0;
      while (acc >= STEP && n < 20) {
        if (S.slowmoT > 0 && S.mode === 'run') S.slowmoT -= STEP;
        const tgt = S.slowmoT > 0 && S.mode === 'run' && !S.endT ? 0.5 : 1; S.ts += (tgt - S.ts) * Math.min(1, STEP * 8);
        step(STEP * S.ts); acc -= STEP; n++; if (S.ended) break;
      }
      if (!S.ended) syncObjects();
      syncLamps();
    }
    render(now);
    if (S.ended) { cancelAnimationFrame(raf); raf = 0; }
  }

  /* ---------- input ---------- */
  const isJump = (k) => k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'w' || k === 'W';
  const isDuck = (k) => k === 'ArrowDown' || k === 's' || k === 'S';
  function onKey(e) {
    if (S.ended || S.stopped) return;
    const t = e.target, tag = t && t.tagName; if ((tag === 'INPUT' && t.type !== 'checkbox') || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const k = e.key;
    if (S.mode === 'tutorial') {
      if (k === 'ArrowRight' || k === 'Enter' || k === ' ') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) tutGo(1); }
      else if (k === 'ArrowLeft') { e.preventDefault(); tutGo(-1); }
      else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); endTutorial(); }
      return;
    }
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); if (S.mode === 'paused' || S.mode === 'bag') resume(); else if (S.mode === 'reveal') closeReveal(); else openPause(); return; }
    if (S.mode === 'paused') { if (isJump(k) || k === 'Enter') { e.preventDefault(); resume(); } return; }
    if (k === 'b' || k === 'B') { e.preventDefault(); if (S.mode === 'bag') resume(); else openBag(); return; }
    if (S.mode === 'bag') return;
    if (isJump(k)) { e.preventDefault(); if (!e.repeat) jumpPress(); return; }
    if (isDuck(k)) { e.preventDefault(); crouchPress(); return; }
    if (k === 'd' || k === 'D' || k === 'Enter') { e.preventDefault(); if (S.mode === 'reveal') closeReveal(); else doDig(); }
  }
  function onKeyUp(e) {
    if (isJump(e.key)) jumpRelease();
    if (isDuck(e.key)) crouchRelease();
  }
  function onBlur() { releaseAll(); if (S.mode === 'run' && !S.endT) openPause(); }
  function onVis() { if (document.hidden) onBlur(); }
  const hold = (btn, down, up) => {
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); try { btn.setPointerCapture(e.pointerId); } catch (er) { /* none */ } down(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((n) => btn.addEventListener(n, up));
  };
  hold(E.jumpB, jumpPress, jumpRelease);
  hold(E.duckB, crouchPress, crouchRelease);
  E.digB.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); doDig(); });
  E.bagB.addEventListener('click', (e) => { e.stopPropagation(); if (S.mode === 'bag') resume(); else openBag(); });
  E.pauseB.addEventListener('click', (e) => { e.stopPropagation(); if (S.mode === 'paused') resume(); else openPause(); });
  // pressing on the scene itself also jumps (hold for long)
  // touch: tap the scene to jump (hold = long jump), swipe down anywhere to duck
  const JUMP_WAIT = 90, gest = { id: null, y0: 0, jump: false, duck: false, mouse: false, pend: 0, swipe: false };
  root.addEventListener('pointerdown', (e) => {
    if (S.ended || e.target.closest('button,input,label,.pw-hud,.pw-card,.pw-x')) return;
    if (e.pointerType === 'touch' && !coarse) { coarse = true; layout(); }
    const touchy = e.pointerType === 'touch' || mode !== 'desk';
    if (!touchy) { if (e.button !== 0 || !E.stage.contains(e.target)) return; e.preventDefault(); gest.id = e.pointerId; gest.mouse = true; gest.jump = true; jumpPress(); return; }
    e.preventDefault(); gest.id = e.pointerId; gest.y0 = e.clientY; gest.mouse = false; gest.duck = false;
    // the whole scene jumps, but the jump waits a moment so the start of a swipe-down (duck) never hops first: it commits after JUMP_WAIT ms, or on release for a quick tap
    gest.jump = false; gest.pend = setTimeout(() => { gest.pend = 0; if (gest.id === e.pointerId && !gest.duck) { gest.jump = true; jumpPress(); } }, JUMP_WAIT);
  });
  root.addEventListener('pointermove', (e) => {
    if (e.pointerId !== gest.id || gest.mouse || gest.duck) return;
    const dy = e.clientY - gest.y0;
    if (dy > 6 && gest.pend) { clearTimeout(gest.pend); gest.pend = 0; gest.swipe = true; } // heading down: this is a duck, not a jump
    if (dy > 26) { if (gest.jump) { jumpRelease(); gest.jump = false; } gest.duck = true; crouchPress(); }
  });
  const gEnd = (e) => {
    if (e.pointerId !== gest.id) return;
    if (gest.pend) { clearTimeout(gest.pend); gest.pend = 0; if (e.type === 'pointerup' && !gest.swipe && !gest.duck) { jumpPress(); jumpRelease(); } } // a quick tap is a hop
    if (gest.jump) jumpRelease(); if (gest.duck) crouchRelease(); gest.id = null; gest.jump = gest.duck = gest.mouse = gest.swipe = false;
  };
  root.addEventListener('pointerup', gEnd); root.addEventListener('pointercancel', gEnd);
  E.stage.addEventListener('pointerleave', (e) => { if (gest.mouse) gEnd(e); });
  root.addEventListener('contextmenu', (e) => { if (mode !== 'desk' || e.pointerType === 'touch') e.preventDefault(); });
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVis);
  let ro = null;
  if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(() => { if (!S.stopped) layout(); }); ro.observe(root); }
  let detached = false;
  function detach() {
    if (detached) return; detached = true;
    window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('blur', onBlur); document.removeEventListener('visibilitychange', onVis);
    if (ro) { ro.disconnect(); ro = null; }
    clearTimeout(sayTimer);
  }

  /* ---------- go ---------- */
  layout(); syncObjects(); syncLamps(); render(performance.now());
  if (o.firstWalk || !o.skipTutorial) showTutorial(); else S.remind = true;
  // warm the image cache so nothing pops in late
  const pre = []; Object.keys(OBS).forEach((n) => { if ([].concat(A.low, A.wide, A.high, ['snowdrift', 'puddle', 'mud']).includes(n)) pre.push(obstacleUri(n)); });
  ['coin', 'sniff', 'dig', 'sparkle-spot', 'chest'].forEach((n) => pre.push(colUri(n)));
  pre.forEach((u) => { const im = new Image(); im.src = u; if (im.decode) im.decode().catch(() => {}); });
  raf = requestAnimationFrame((t) => { last = t; frame(t); });

  const ctl = {
    stop() {
      if (S.stopped) return; S.stopped = true; S.ended = true; detach();
      if (raf) cancelAnimationFrame(raf); raf = 0;
      if (root.parentNode) root.parentNode.removeChild(root);
    },
    // test/debug hook (not part of the contract; read-only snapshot)
    _peek() {
      return {
        mode: S.mode, t: S.t, D, ts: S.ts, timeLost: S.timeLost, hitLog: S.hitLog, v: S.v || 0, camX: S.camX, dogX: S.camX + DOG.x, h: S.h, grounded: S.grounded, crouch: S.crouchHeld,
        hazards: S.hazards, touched: S.touched, hits: S.hits, splashes: S.splashes, coins: S.coins, prompt: !!S.prompt, found: S.found,
        heat: heat(), digsUsed: S.digsUsed, coinsSpawned: gen.coins, coinTarget,
        bonus: live.filter((q) => q.kind === 'bonus' && !q.done).map((q) => ({ x: q.cx, h: q.ch })),
        obs: live.filter((q) => q.kind === 'obs' && !q.done).map((q) => ({ id: q.id, cat: q.cat, name: q.name, ex0: q.ex0, ex1: q.ex1 })),
        box: { off: DOG.off, hw: DOG.hw, feet: DOG.feet }
      };
    }
  };
  return ctl;
}

window.PawWalk = { start, version: '1.2' };
})();
