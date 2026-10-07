/* Paw Haven v1.2 - PawAudio: generative cozy lo-fi music + ambience.
   Everything is synthesized live with WebAudio (no files, no hosts). Plain IIFE, attaches only window.PawAudio.
   Palette (shared by every variant): FM Rhodes with tremolo, warm round bass, brushed lo-fi drums,
   generative kalimba / glockenspiel / flute / bird / bubble topline, vinyl crackle, tape wobble, lowpass warmth.
   Key centre: F major / D minor, 68-86 bpm, swung 16ths. */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;

  /* ---------------- shared names (V12 contract) ---------------- */
  var PLACES = ['title', 'yard', 'house', 'garden', 'kitchen', 'park', 'river', 'woods', 'beach', 'shelter', 'market', 'shop', 'map', 'walk', 'fetch', 'toy', 'bath', 'sleep', 'journal', 'wardrobe',
    'square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier',   // v1.6 town places
    'nursery'];   // v2 puppy nursery: soft lullaby variant of the home music
  var HANGOUTS = { park: 1, river: 1, woods: 1, beach: 1, hilltop: 1, pier: 1 };   // v1.2.1 hub places: yard-style music + that area's ambience
  var TIMES = ['dawn', 'day', 'dusk', 'night'];
  var WEATHERS = ['sunny', 'cloudy', 'rain', 'snow'];
  var AREAS = ['park', 'river', 'woods', 'beach', 'town', 'hilltop', 'pier'];
  var STINGERS = ['treasure', 'levelup', 'adopt', 'harvest', 'cooked', 'discover'];
  var STINGS = ['birth', 'sparkle', 'playdate'];   // v2 sfx-bus stings (PawAudio.sting)
  var INDOOR = { nursery: 1, house: 1, kitchen: 1, cafe: 1, vet: 1, salon: 1, shelter: 1, shop: 1, bath: 1, sleep: 1, journal: 1, wardrobe: 1 };
  var LAYERS = ['keys', 'pad', 'bass', 'kick', 'snare', 'hats', 'top', 'crackle'];
  var AMBS = ['rain', 'wind', 'birds', 'crickets', 'river', 'waves', 'market', 'window', 'bees', 'leaves', 'simmer', 'clock', 'gulls', 'cafe', 'salon', 'vet'];
  var INSIDE_AMB = { window: 1, simmer: 1, clock: 1, cafe: 1, salon: 1, vet: 1 };   // sounds inside the room: they skip the indoor muffle
  var AMB_CONT = { rain: 1, wind: 1, river: 1, waves: 1, market: 1, simmer: 1, salon: 1, vet: 1 };   // ambiences with a continuous noise bed

  /* ---------------- helpers ---------------- */
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function chance(p) { return Math.random() < p; }
  function copy(o) { var r = {}, k; for (k in o) r[k] = (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) ? copy(o[k]) : o[k]; return r; }
  function hold(p, t) {
    try { if (p.cancelAndHoldAtTime) { p.cancelAndHoldAtTime(t); return; } } catch (e) { /* fall through */ }
    p.cancelScheduledValues(t);
  }
  function ramp(p, v, t, tc) { hold(p, t); p.setTargetAtTime(v, t, tc); }

  /* ---------------- harmony: F major / D minor family ---------------- */
  // r = bass root (midi), v = rootless keys voicing around C4, f = bass "fifth" interval
  var CH = {
    Fmaj9: { r: 41, v: [57, 60, 64, 67] },
    F69: { r: 41, v: [57, 62, 67, 72] },
    Dm9: { r: 38, v: [53, 57, 60, 64] },
    Gm9: { r: 43, v: [58, 62, 65, 69] },
    C13: { r: 36, v: [58, 62, 64, 69] },
    C9sus: { r: 36, v: [58, 62, 65, 67] },
    Bbmaj9: { r: 46, v: [57, 60, 62, 65] },
    Am9: { r: 45, v: [55, 60, 64, 71] },
    A7b13: { r: 45, v: [55, 61, 65, 67], f: 10 },
    Em7b5: { r: 40, v: [55, 58, 62, 64], f: 6 },
    Bbm6: { r: 46, v: [56, 61, 65, 67] }
  };
  Object.keys(CH).forEach(function (k) {
    var c = CH[k]; c.name = k; c.pcs = {}; c.pcs[c.r % 12] = 1;
    c.v.forEach(function (m) { c.pcs[m % 12] = 1; });
    if (c.f == null) c.f = 7;
  });
  var PROGS = {   // all 8 bars, so swaps keep the phrase position
    bright: ['Fmaj9', 'Am9', 'Bbmaj9', 'C13', 'Fmaj9', 'Dm9', 'Gm9', 'C13'],
    bright2: ['Fmaj9', 'Dm9', 'Gm9', 'C13', 'Am9', 'Dm9', 'Gm9', 'C9sus'],
    playful: ['Fmaj9', 'Dm9', 'Gm9', 'C13', 'Fmaj9', 'Am9', 'Bbmaj9', 'C9sus'],
    gentle: ['Fmaj9', 'Fmaj9', 'Bbmaj9', 'Bbmaj9', 'F69', 'Dm9', 'Gm9', 'C9sus'],
    warm: ['Bbmaj9', 'Am9', 'Gm9', 'Fmaj9', 'Bbmaj9', 'Am9', 'Gm9', 'C13'],
    dark: ['Dm9', 'Bbmaj9', 'Gm9', 'A7b13', 'Dm9', 'Gm9', 'Bbm6', 'A7b13'],
    mellow: ['Dm9', 'Gm9', 'Bbmaj9', 'C9sus', 'Dm9', 'Am9', 'Bbmaj9', 'A7b13'],
    glassy: ['F69', 'Bbmaj9', 'F69', 'Gm9', 'F69', 'Bbmaj9', 'Am9', 'C9sus'],
    lullaby: ['Fmaj9', 'Dm9', 'Bbmaj9', 'C9sus', 'Fmaj9', 'Am9', 'Bbmaj9', 'C13'],
    jazz: ['Gm9', 'C13', 'Fmaj9', 'Dm9', 'Gm9', 'C13', 'Am9', 'A7b13']   // ii-V-I cafe changes
  };
  var PENTA = [0, 2, 4, 7, 9];   // F pentatonic offsets from F
  function pentaMidi(i) { var o = Math.floor(i / 5), k = ((i % 5) + 5) % 5; return 65 + o * 12 + PENTA[k]; }
  // keep a topline note off a semitone clash with the current chord
  function fit(m, ch) {
    var pc = ((m % 12) + 12) % 12;
    if (!ch || ch.pcs[pc]) return m;
    if (ch.pcs[(pc + 11) % 12]) return m - 1;
    if (ch.pcs[(pc + 1) % 12]) return m + 1;
    return m;
  }

  /* ---------------- the "Paw Haven theme" + motif bank ([step16, pentaIndex, lenSteps, vel]) ---------------- */
  // C A C D . C A | G A C ~ A | F A C D C A | G F ~~
  var THEME = [[0, 3, 2, 0.9], [2, 2, 2, 0.75], [4, 3, 2, 0.85], [6, 4, 4, 0.9], [11, 3, 1, 0.6], [12, 2, 4, 0.8],
    [16, 1, 2, 0.75], [18, 2, 2, 0.8], [20, 3, 8, 0.9], [30, 2, 2, 0.6],
    [32, 0, 2, 0.8], [34, 2, 2, 0.75], [36, 3, 4, 0.85], [42, 4, 2, 0.7], [44, 3, 2, 0.75], [46, 2, 2, 0.7],
    [48, 1, 4, 0.8], [52, 0, 10, 0.85]];
  var MOTIFS = [   // relative pentatonic degrees, 2 bars
    [[0, 0, 2], [2, 1, 2], [4, 2, 4], [10, 1, 2], [12, 0, 4]],
    [[0, 2, 3], [3, 1, 1], [4, 0, 4], [8, -1, 2], [10, 0, 6]],
    [[0, 0, 1], [2, 0, 1], [4, 2, 2], [6, 3, 2], [8, 2, 4], [14, 1, 2], [16, 0, 6]],
    [[2, 3, 2], [4, 2, 2], [6, 1, 2], [8, 0, 6], [20, 1, 2], [22, 0, 6]],
    [[0, 0, 2], [3, 2, 2], [6, 3, 4], [16, 2, 2], [19, 1, 2], [22, 0, 6]],
    [[0, 2, 6], [8, 0, 8]],
    [[0, 4, 1], [1, 3, 1], [2, 2, 2], [6, 0, 2], [8, 1, 4], [16, -1, 2], [18, 0, 8]],
    [[4, 0, 2], [6, 1, 2], [8, 2, 2], [10, 4, 4], [14, 2, 2], [18, 3, 6]],
    [[0, 3, 2], [2, 2, 2], [4, 3, 2], [6, 4, 6]]   // theme head, quoted inside motifs too
  ];
  var BUBBLES = [
    [[0, 0, 1], [1, 2, 1], [2, 4, 1], [4, 3, 1], [6, 1, 1], [8, 5, 1], [9, 4, 1], [12, 2, 2]],
    [[0, 2, 1], [2, 3, 1], [3, 4, 1], [6, 2, 1], [8, 0, 1], [10, 2, 1], [11, 3, 1], [16, 4, 1], [17, 5, 1], [18, 7, 2]],
    [[0, 4, 1], [1, 3, 1], [2, 2, 1], [3, 1, 1], [4, 0, 2], [10, 2, 1], [12, 4, 2]]
  ];
  var TOP_OCT = { kalimba: 0, flute: 0, bubble: 0, box: 5, glock: 5, bird: 10 };

  /* ---------------- rhythm patterns (16 steps) ---------------- */
  var KEYS = {
    comp: [[0, 7, 1], [7, 3, 0.7], [10, 6, 0.8]],
    bouncy: [[0, 2, 0.9], [3, 2, 0.6], [6, 3, 0.8], [10, 2, 0.6], [12, 3, 0.75]],
    sustain: [[0, 16, 0.85]],
    sparse: [[0, 16, 0.6]],
    arp: []
  };
  var BASS = {
    full: [[0, 0, 6, 1], [7, 0, 2, 0.6], [8, 'f', 4, 0.8], [14, 'A', 2, 0.6]],
    bouncy: [[0, 0, 2, 1], [3, 0, 1, 0.6], [6, 'f', 2, 0.8], [8, 12, 2, 0.75], [11, 'f', 1, 0.5], [12, 0, 3, 0.8], [15, 'A', 1, 0.5]],
    walk: [[0, 0, 4, 1], [4, 'f', 4, 0.8], [8, 12, 4, 0.8], [12, 'A', 4, 0.7]],
    sparse: [[0, 0, 14, 0.9]],
    lullaby: [[0, 0, 8, 0.8], [8, 'f', 8, 0.6]]
  };
  var KICK = { std: [[0, 1], [7, 0.45], [10, 0.8]], bouncy: [[0, 1], [6, 0.6], [8, 0.5], [10, 0.9]], lazy: [[0, 1], [10, 0.7]], min: [[0, 0.8]] };
  var SNARE = { std: [[4, 1], [12, 1]], ghost: [[4, 1], [7, 0.18], [12, 1], [15, 0.22]] };
  var HATS = {
    std: [[0, 0.8], [2, 0.5], [4, 0.7], [6, 0.5], [8, 0.8], [10, 0.5], [12, 0.7], [14, 0.5]],
    busy: [[0, 0.8], [2, 0.5], [3, 0.3], [4, 0.7], [6, 0.5], [7, 0.35], [8, 0.8], [10, 0.5], [11, 0.3], [12, 0.7], [14, 0.55, 1], [15, 0.4]],
    light: [[2, 0.6], [6, 0.5], [10, 0.6], [14, 0.5]]
  };

  /* ---------------- variants ---------------- */
  var DEF = { bpm: 78, swing: 0.6, prog: 'bright', keys: 'comp', bass: 'full', kick: 'std', snare: 'std', hats: 'std', top: 'kalimba', dens: 0.5,
    themeChance: 0.3, themeGap: 16, cut: 7000, drumCut: 9000, mix: 1, brush: false,
    L: { keys: 0.9, pad: 0, bass: 0.85, kick: 0.8, snare: 0.65, hats: 0.55, top: 0.85, crackle: 1 } };
  function V(o) { var v = copy(DEF), k; for (k in o) { if (k === 'L') { for (var j in o.L) v.L[j] = o.L[j]; } else v[k] = o[k]; } return v; }
  var BASE = {
    theme: V({ bpm: 76, kick: 'lazy', dens: 0.55, themeChance: 0.9, themeGap: 8, cut: 6000, L: { pad: 0.25, kick: 0.7, snare: 0.55, hats: 0.45, top: 1 } }),
    yard: V({ bpm: 80, hats: 'busy', dens: 0.5, cut: 7500 }),
    house: V({ bpm: 74, swing: 0.58, prog: 'gentle', kick: 'lazy', hats: 'light', dens: 0.45, themeChance: 0.3, cut: 5200, brush: true,
      L: { keys: 0.9, pad: 0.3, bass: 0.75, kick: 0.5, snare: 0.4, hats: 0.35, top: 0.8 } }),
    garden: V({ bpm: 78, swing: 0.6, prog: 'bright', keys: 'comp', kick: 'lazy', hats: 'std', dens: 0.45, themeChance: 0.3, cut: 7000,
      L: { keys: 0.9, pad: 0.15, bass: 0.8, kick: 0.65, snare: 0.5, hats: 0.45, top: 0.85 } }),
    kitchen: V({ bpm: 76, swing: 0.6, prog: 'gentle', keys: 'bouncy', bass: 'bouncy', kick: 'lazy', hats: 'light', dens: 0.5, themeChance: 0.3, cut: 5600, brush: true,
      L: { keys: 0.85, pad: 0.25, bass: 0.75, kick: 0.5, snare: 0.4, hats: 0.4, top: 0.8 } }),
    square: V({ bpm: 82, swing: 0.6, prog: 'bright2', hats: 'busy', dens: 0.55, themeChance: 0.35, cut: 7500, L: { kick: 0.75, snare: 0.6, hats: 0.5 } }),
    cafe: V({ bpm: 80, swing: 0.64, prog: 'jazz', keys: 'comp', bass: 'walk', kick: 'lazy', hats: 'std', top: 'flute', dens: 0.4, themeChance: 0.25, cut: 5600, brush: true,
      L: { keys: 0.95, pad: 0.1, bass: 0.8, kick: 0.45, snare: 0.5, hats: 0.45, top: 0.75 } }),
    dogpark: V({ bpm: 84, swing: 0.64, prog: 'playful', keys: 'bouncy', bass: 'bouncy', kick: 'bouncy', snare: 'ghost', hats: 'busy', dens: 0.6, cut: 7800 }),
    vet: V({ bpm: 70, swing: 0.56, prog: 'gentle', keys: 'sustain', bass: 'sparse', kick: 'min', hats: 'light', top: 'box', dens: 0.3, themeChance: 0.2, cut: 3800, brush: true,
      L: { keys: 0.8, pad: 0.4, bass: 0.55, kick: 0.25, snare: 0.25, hats: 0.15, top: 0.65 } }),
    salon: V({ bpm: 80, keys: 'bouncy', bass: 'bouncy', kick: 'lazy', hats: 'light', top: 'bubble', dens: 0.75, themeChance: 0.2, cut: 6500, L: { kick: 0.5, snare: 0.4, hats: 0.45, top: 0.85 } }),
    nursery: V({ bpm: 70, swing: 0.55, prog: 'gentle', keys: 'arp', bass: 'lullaby', kick: 'min', hats: 'light', top: 'box', dens: 0.45, themeChance: 0.4, themeGap: 12, cut: 3300, brush: true, mix: 0.8,
      L: { keys: 0.8, pad: 0.5, bass: 0.5, kick: 0.12, snare: 0, hats: 0.1, top: 0.8, crackle: 0.8 } }),
    hill: V({ bpm: 76, swing: 0.58, prog: 'gentle', keys: 'sustain', kick: 'lazy', hats: 'light', top: 'flute', dens: 0.45, cut: 6500, L: { pad: 0.35, kick: 0.55, snare: 0.45, hats: 0.4 } }),
    pier: V({ bpm: 74, swing: 0.58, prog: 'warm', keys: 'sustain', bass: 'sparse', kick: 'lazy', hats: 'light', dens: 0.4, cut: 5500, L: { pad: 0.3, kick: 0.5, snare: 0.4, hats: 0.35 } }),
    home: V({ bpm: 76, prog: 'gentle', kick: 'lazy', hats: 'light', dens: 0.4, cut: 5500, L: { kick: 0.6, snare: 0.5, hats: 0.45, pad: 0.2 } }),
    market: V({ bpm: 84, swing: 0.58, prog: 'bright2', keys: 'bouncy', bass: 'bouncy', kick: 'bouncy', snare: 'ghost', hats: 'busy', top: 'glock', dens: 0.6, cut: 8000 }),
    walk: V({ bpm: 82, prog: 'playful', bass: 'walk', hats: 'busy', top: 'flute', dens: 0.5, cut: 7000 }),
    play: V({ bpm: 86, swing: 0.66, prog: 'playful', keys: 'bouncy', bass: 'bouncy', kick: 'bouncy', snare: 'ghost', hats: 'busy', dens: 0.7, cut: 8000 }),
    bath: V({ bpm: 78, keys: 'bouncy', bass: 'bouncy', kick: 'lazy', hats: 'light', top: 'bubble', dens: 0.85, themeChance: 0.2, cut: 6500, L: { kick: 0.5, snare: 0.4, hats: 0.45, top: 0.9 } }),
    sleep: V({ bpm: 68, swing: 0.55, prog: 'lullaby', keys: 'arp', bass: 'lullaby', top: 'box', dens: 0.5, themeChance: 0.35, cut: 2600, mix: 0.75,
      L: { keys: 0.75, pad: 0.55, bass: 0.5, kick: 0, snare: 0, hats: 0, top: 0.75, crackle: 0.8 } }),
    calm: V({ bpm: 72, swing: 0.57, prog: 'gentle', keys: 'sustain', bass: 'sparse', kick: 'min', hats: 'light', dens: 0.35, cut: 4500, brush: true,
      L: { keys: 0.85, pad: 0.35, bass: 0.6, kick: 0.35, snare: 0.35, hats: 0.25, top: 0.7 } })
  };
  var PLACE_BASE = { title: 'theme', yard: 'yard', house: 'house', garden: 'garden', kitchen: 'kitchen', park: 'yard', river: 'yard', woods: 'yard', beach: 'yard',
    square: 'square', cafe: 'cafe', dogpark: 'dogpark', vet: 'vet', salon: 'salon', hilltop: 'hill', pier: 'pier', map: 'yard', shelter: 'home', market: 'market', shop: 'market', walk: 'walk',
    fetch: 'play', nursery: 'nursery', toy: 'play', bath: 'bath', sleep: 'sleep', journal: 'calm', wardrobe: 'calm' };
  var KEEP_PROG = { nursery: 1, theme: 1, market: 1, play: 1, bath: 1, sleep: 1, cafe: 1, dogpark: 1, salon: 1 };
  var STRONG = { market: 1, play: 1, bath: 1, cafe: 1, dogpark: 1, salon: 1, square: 1 };   // places whose character survives time-of-day changes

  function norm(c) {
    c = c || {};
    var place = PLACES.indexOf(c.place) >= 0 ? c.place : 'yard';
    return {
      place: place,
      area: place === 'walk' ? (AREAS.indexOf(c.area) >= 0 ? c.area : 'park') : (HANGOUTS[place] ? place : null),
      time: TIMES.indexOf(c.time) >= 0 ? c.time : 'day',
      weather: WEATHERS.indexOf(c.weather) >= 0 ? c.weather : 'sunny'
    };
  }
  function scaleL(L, m) { for (var k in m) L[k] = (L[k] || 0) * m[k]; }

  function resolve(c0) {
    var c = norm(c0), place = c.place, time = c.time, weather = c.weather, area = c.area;
    var bn = PLACE_BASE[place] || 'yard', v = copy(BASE[bn]), L = v.L, indoor = !!INDOOR[place];
    var tags = [bn];
    if (place === 'map') { v.themeChance = 0.45; v.themeGap = 8; }
    if (HANGOUTS[place]) {
      tags.push(place + ' hangout');
      if (place === 'beach') v.swing += 0.02;
      else if (place === 'woods') v.top = 'flute';
      else if (place === 'river') v.top = 'kalimba';
    }
    if (place === 'walk') {
      if (area === 'river') { v.top = 'kalimba'; v.keys = 'bouncy'; }
      else if (area === 'woods') { v.cut *= 0.9; v.L.pad = 0.2; }
      else if (area === 'beach') { v.bpm += 2; v.swing += 0.02; v.top = 'kalimba'; }
      else if (area === 'town') { v.top = 'glock'; v.dens *= 0.9; }
      else if (area === 'hilltop') { v.keys = 'sustain'; v.L.pad = 0.3; }
      else if (area === 'pier') { v.bpm -= 2; v.top = 'kalimba'; v.swing += 0.01; }
      tags.push(area);
    }
    // time of day
    if (time === 'dawn') {
      v.bpm -= 4; v.dens *= 0.8; v.cut *= 0.75; v.brush = true; L.pad = Math.max(L.pad, 0.35);
      scaleL(L, { kick: 0.5, snare: 0.5, hats: 0.5 });
      if (!KEEP_PROG[bn]) v.prog = 'gentle';
      if (v.keys === 'comp') v.keys = 'sustain';
      if (!indoor && (v.top === 'kalimba' || v.top === 'flute')) v.top = 'bird';
      tags.push('dawn: gentle, sparse');
    } else if (time === 'dusk') {
      v.bpm -= 3; v.swing += 0.03; v.cut *= 0.72; L.pad = Math.max(L.pad, 0.25);
      scaleL(L, { hats: 0.7, kick: 0.85 });
      if (!KEEP_PROG[bn]) v.prog = 'warm';
      tags.push('dusk: warm, lazy');
    } else if (time === 'night') {
      if (bn === 'sleep' || bn === 'nursery') { v.bpm -= 2; v.cut *= 0.85; tags.push('night'); }
      else if (STRONG[bn]) {
        v.bpm -= 5; v.cut *= 0.6; v.brush = true; v.dens *= 0.8; L.pad = Math.max(L.pad, 0.35);
        scaleL(L, { kick: 0.4, snare: 0.5, hats: 0.35 });
        tags.push('night: softer');
      } else {
        v.bpm -= 8; v.cut *= 0.5; v.brush = true; v.dens *= 0.6; v.prog = 'dark';
        v.keys = 'sparse'; v.bass = 'sparse'; v.kick = 'min'; v.hats = 'light';
        L.pad = Math.max(L.pad, 0.55); L.kick = 0; L.hats = 0; L.snare = Math.min(L.snare, 0.3); L.bass *= 0.75;
        if (v.top === 'bird' || v.top === 'flute') v.top = 'kalimba';
        tags.push('night: slow, minimal, dark');
      }
    }
    // weather
    if (!indoor) {
      if (weather === 'cloudy') { v.cut *= 0.85; v.dens *= 0.9; tags.push('cloudy'); }
      else if (weather === 'rain') {
        v.drumCut = 1200; v.cut *= 0.65; v.brush = true; v.dens *= 0.8; L.pad = Math.max(L.pad, 0.4);
        scaleL(L, { kick: 0.6, hats: 0.35 });
        if (!KEEP_PROG[bn] && time !== 'night') v.prog = 'mellow';
        if (v.top === 'bird') v.top = 'flute';
        tags.push('rain: mellow, muted drums');
      } else if (weather === 'snow') {
        v.top = 'glock'; v.dens *= 0.75; v.brush = true; v.cut *= 0.9;
        scaleL(L, { kick: 0.45, hats: 0.4 });
        if (v.keys === 'comp') v.keys = 'sustain';
        if (!KEEP_PROG[bn] && time !== 'night') v.prog = 'glassy';
        tags.push('snow: glassy bells, sparse');
      }
    } else if (weather === 'rain') { v.cut *= 0.9; L.pad = Math.max(L.pad, 0.3); tags.push('rain outside'); }
    v.cut = clamp(v.cut, 1200, 9000);
    v.swing = clamp(v.swing, 0.5, 0.7);

    // ambience
    var a = { rain: 0, wind: 0, birds: 0, crickets: 0, river: 0, waves: 0, market: 0, window: 0, bees: 0, leaves: 0, simmer: 0, clock: 0, gulls: 0, cafe: 0, salon: 0, vet: 0 }, birdRate = 0.35;
    if (weather === 'rain') a.rain = 1;
    if (weather === 'snow') a.wind = 0.55;
    if (weather === 'cloudy') a.wind = 0.2;
    if (time === 'night' && weather !== 'rain' && weather !== 'snow') a.crickets = 0.8;
    if (time !== 'night' && (weather === 'sunny' || weather === 'cloudy')) {
      a.birds = { dawn: 1, day: 0.55, dusk: 0.3 }[time] * (weather === 'cloudy' ? 0.7 : 1);
      if (time === 'dawn') birdRate = 0.6;
    }
    if (place === 'market') a.market = 1;
    if (place === 'shop') a.market = 0.55;
    if (place === 'walk' || HANGOUTS[place]) {
      if (area === 'park') a.birds *= 1.3;
      else if (area === 'river') { a.river = 0.85; a.birds *= 0.6; }
      else if (area === 'woods') { a.wind = Math.max(a.wind, 0.45); a.birds *= 1.3; }
      else if (area === 'beach') { a.waves = 0.9; a.wind = Math.max(a.wind, 0.25); a.birds = 0; if (a.crickets) a.crickets = 0.3; }
      else if (area === 'town') { a.market = 0.35; a.birds *= 0.6; }
      else if (area === 'hilltop') { a.wind = Math.max(a.wind, 0.55); a.birds *= 0.9; }
      else if (area === 'pier') { a.waves = 0.75; a.wind = Math.max(a.wind, 0.25); a.birds = 0; if (time !== 'night') a.gulls = weather === 'rain' ? 0.35 : 0.7; if (a.crickets) a.crickets = 0.2; }
    }
    if (HANGOUTS[place]) { for (var kh in a) a[kh] *= 0.7; }   // hangouts sit quieter than walks
    if (indoor) { for (var k in a) if (k !== 'market') a[k] *= (k === 'birds' ? 0.3 : 0.5); }
    if ((place === 'house' || place === 'kitchen') && weather === 'rain') a.window = place === 'house' ? 0.8 : 0.5;   // gentle taps on the window glass
    if (place === 'garden') {
      var mon = c0 && c0._month != null ? c0._month : new Date().getMonth();
      a.birds *= 1.1;
      if (weather === 'rain') a.leaves = 0.7;   // rain pattering on leaves
      if (mon >= 5 && mon <= 7 && (time === 'day' || time === 'dusk') && (weather === 'sunny' || weather === 'cloudy')) a.bees = time === 'day' ? 0.6 : 0.35;
    }
    if (place === 'kitchen') { a.simmer = 0.5; a.clock = 0.45; }
    if (place === 'square') { a.market = 0.4; a.river = 0.35; }   // gentle crowd + the fountain
    if (place === 'dogpark') a.birds *= 1.1;
    if (place === 'cafe') { a.cafe = 0.7; if (weather === 'rain') a.window = 0.4; }   // cups and chatter inside, outside muffled
    if (place === 'vet') { a.clock = 0.3; a.vet = 0.7; if (weather === 'rain') a.window = 0.35; }   // clinic hush + gentle clinic bed
    if (place === 'salon') a.salon = 0.7;
    if (place === 'title') { for (var k2 in a) a[k2] *= 0.6; }
    for (var k3 in a) a[k3] = Math.round(clamp(a[k3], 0, 1) * 100) / 100;
    v.amb = a; v.birdRate = birdRate; v.indoor = indoor;
    v.bpm = Math.round(clamp(v.bpm, 64, 90));
    v.ctx = c; v.base = bn; v.tags = tags;
    v.label = place + (area && place === 'walk' ? '/' + area : '') + ' · ' + time + ' · ' + weather + '  →  ' + tags.join(' + ');
    var sigL = LAYERS.map(function (n) { return Math.round((L[n] || 0) * 100); }).join(',');
    var sigA = AMBS.map(function (n) { return Math.round(a[n] * 100); }).join(',');
    v.sig = [v.bpm, Math.round(v.swing * 100), v.prog, v.keys, v.bass, v.kick, v.snare, v.hats, v.top, Math.round(v.dens * 100),
      Math.round(v.cut), v.drumCut, v.mix, v.brush, sigL, sigA, indoor, v.themeChance].join('|');
    return v;
  }

  /* ---------------- buffers ---------------- */
  function whiteBuf(ac, sec) {
    var n = (ac.sampleRate * sec) | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function pinkBuf(ac, sec) {
    var n = (ac.sampleRate * sec) | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    }
    // crossfade the loop seam
    var f = Math.min(2048, n >> 2);
    for (var j = 0; j < f; j++) { var x = j / f; d[j] = d[j] * x + d[n - f + j] * (1 - x); }
    return b;
  }
  function crackleBuf(ac, sec) {
    var n = (ac.sampleRate * sec) | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), sr = ac.sampleRate;
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.012;
    var pops = (sec * 14) | 0;
    for (var p = 0; p < pops; p++) {
      var at = (Math.random() * (n - 200)) | 0, amp = rnd(0.08, 0.45) * (chance(0.1) ? 1.8 : 1), len = (rnd(0.0004, 0.0018) * sr) | 0, sg = chance(0.5) ? 1 : -1;
      for (var k = 0; k < len; k++) d[at + k] += sg * amp * Math.exp(-k / (len * 0.3)) * (k % 2 ? -0.6 : 1);
    }
    return b;
  }
  function reverbBuf(ac, sec) {
    var n = (ac.sampleRate * sec) | 0, b = ac.createBuffer(2, n, ac.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), lp = 0;
      for (var i = 0; i < n; i++) {
        var e = Math.pow(1 - i / n, 3.2);
        lp += ((Math.random() * 2 - 1) - lp) * (0.55 - 0.4 * i / n);   // tail gets darker
        d[i] = lp * e * (i < ac.sampleRate * 0.012 ? i / (ac.sampleRate * 0.012) : 1);
      }
    }
    return b;
  }

  /* ================================================================
     Engine: one full graph on any (Online|Offline)AudioContext
     ================================================================ */
  function Engine(ac, offline) {
    var E = this;
    E.ac = ac; E.offline = !!offline;
    function G(v) { var g = ac.createGain(); g.gain.value = v == null ? 1 : v; return g; }
    function F(type, f, q) { var b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
    function P(v) { if (!ac.createStereoPanner) return G(1); var p = ac.createStereoPanner(); p.pan.value = v; return p; }
    function O(type, f) { var o = ac.createOscillator(); o.type = type; o.frequency.value = f; return o; }
    E.G = G; E.F = F; E.O = O;

    // --- buses: master -> mute -> vis -> limiter -> soft clip -> out
    E.master = G(0.8); E.music = G(0.5); E.sfx = G(0.8); E.amb = G(0.25);
    E.muteG = G(1); E.visG = G(1);
    E.comp = ac.createDynamicsCompressor();
    E.comp.threshold.value = -12; E.comp.knee.value = 8; E.comp.ratio.value = 8; E.comp.attack.value = 0.004; E.comp.release.value = 0.22;
    E.clip = ac.createWaveShaper();
    var cv = new Float32Array(2049), C = 0.89;
    for (var i = 0; i < 2049; i++) { var x = (i / 1024) - 1; cv[i] = C * Math.tanh((x * 1.25) / C); }
    E.clip.curve = cv;
    E.music.connect(E.master); E.sfx.connect(E.master); E.amb.connect(E.master);
    E.master.connect(E.muteG); E.muteG.connect(E.visG); E.visG.connect(E.comp); E.comp.connect(E.clip); E.clip.connect(ac.destination);

    // --- music chain: mIn -> hp -> lp(warmth) -> tape wobble -> duck -> music bus
    E.mIn = G(1); E.hp = F('highpass', 45, 0.7); E.lp = F('lowpass', 5000, 0.5);
    E.wob = ac.createDelay(0.1); E.wob.delayTime.value = 0.025;
    E.duckG = G(1);
    E.mIn.connect(E.hp); E.hp.connect(E.lp); E.lp.connect(E.wob); E.wob.connect(E.duckG); E.duckG.connect(E.music);
    var w1 = O('sine', 0.55), w1g = G(0.0011), w2 = O('sine', 0.19), w2g = G(0.0018), w3 = O('sine', 6.3), w3g = G(0.00006);
    w1.connect(w1g); w1g.connect(E.wob.delayTime); w2.connect(w2g); w2g.connect(E.wob.delayTime); w3.connect(w3g); w3g.connect(E.wob.delayTime);
    w1.start(); w2.start(); w3.start();
    // reverb send
    E.verb = ac.createConvolver(); E.verb.buffer = reverbBuf(ac, 2.2);
    E.verbIn = G(1); E.verbOut = G(0.28);
    E.verbIn.connect(E.verb); E.verb.connect(E.verbOut); E.verbOut.connect(E.mIn);
    // stingers: own warm lowpass, after the duck so they stay on top
    E.stIn = G(1); E.stLP = F('lowpass', 5200, 0.5); E.stIn.connect(E.stLP); E.stLP.connect(E.music);
    var stv = G(0.3); E.stIn.connect(stv); stv.connect(E.verbIn);
    // drums sub-bus (rain filters it)
    E.drumLP = F('lowpass', 9000, 0.6); E.drumLP.connect(E.mIn);

    // --- layers
    E.L = {};
    function layer(name, inNode, outChain, send) {
      var g = G(0);
      inNode.connect(g);
      var last = g;
      (outChain || []).forEach(function (n) { last.connect(n); last = n; });
      last.connect(name === 'kick' || name === 'snare' || name === 'hats' ? E.drumLP : E.mIn);
      if (send) { var s = G(send); g.connect(s); s.connect(E.verbIn); }
      E.L[name] = { g: g, in: inNode, target: 0, end: 0 };
    }
    // keys: tremolo
    E.tremG = G(1); var tl = O('sine', 4.4), tlg = G(0.13); tl.connect(tlg); tlg.connect(E.tremG.gain); tl.start();
    layer('keys', E.tremG, [P(-0.08)], 0.35);
    layer('pad', F('lowpass', 1300, 0.4), [P(0.1)], 0.5);
    layer('bass', F('lowpass', 460, 0.8), null, 0);
    layer('kick', G(1), null, 0);
    var snHP = F('highpass', 260, 0.7), snLP = F('lowpass', 3400, 0.6); snHP.connect(snLP);
    layer('snare', snLP, null, 0.22);
    E.L.snare.in = snHP;   // snare: in -> HP -> LP -> layer gain
    var hHP = F('highpass', 4200, 0.6);
    layer('hats', hHP, [P(0.28)], 0);
    layer('top', G(1), [P(-0.18)], 0.45);
    // crackle: one looping buffer, always running (cheap)
    var crHP = F('highpass', 900, 0.5);
    layer('crackle', crHP, null, 0);
    var cr = ac.createBufferSource(); cr.buffer = crackleBuf(ac, 5); cr.loop = true; cr.connect(crHP); cr.start();
    E.L.crackle.gainK = 0.55;

    // --- ambience: per-type gain -> ambLP -> amb bus
    E.openHz = Math.min(16000, ac.sampleRate * 0.45);
    E.ambLP = F('lowpass', E.openHz, 0.5); E.ambHP = F('highpass', 40, 0.7); E.ambLP.connect(E.ambHP); E.ambHP.connect(E.amb);
    E.ag = {}; E.ambT = {}; E.ambNodes = {};
    E.evPan = [P(-0.6), P(0), P(0.6)];
    AMBS.forEach(function (n) { E.ag[n] = G(0); E.ag[n].connect(INSIDE_AMB[n] ? E.ambHP : E.ambLP); E.ambT[n] = 0; });   // window taps skip the indoor muffle
    E.evOut = {};
    AMBS.forEach(function (n) {   // three pan positions per ambience for scheduled events
      E.evOut[n] = [-0.6, 0, 0.6].map(function (p) { var pn = P(p); pn.connect(E.ag[n]); return pn; });
    });

    E.white = whiteBuf(ac, 2);
    E.pink = pinkBuf(ac, 4);

    // --- scheduler state
    E.step = 0; E.steps = 0; E.late = 0; E.nextTime = 0; E.bpm = 78; E.bpmTarget = 78; E.swing = 0.6; E.swingTarget = 0.6;
    E.progName = 'bright'; E.nextProg = null; E.chord = CH.Fmaj9; E.nextChord = CH.Am9; E.pi = 0; E.bar = 0;
    E.pat = { keys: 'comp', bass: 'full', kick: 'std', snare: 'std', hats: 'std' };
    E.topQ = {}; E.topBusy = 0; E.lastTheme = -9999; E.themes = 0;
    E.v = null; E.sig = ''; E.pending = null; E.voices = []; E.dropped = 0; E.birdRate = 0.35; E.applied = 0;
  }

  var EP = Engine.prototype;

  /* --- polyphony: cost = oscillator-ish units; low priority notes are dropped above the cap --- */
  var CAP = 80;
  EP.alloc = function (t, dur, cost, prio) {
    var vs = this.voices, sum = 0, keep = [];
    for (var i = 0; i < vs.length; i++) if (vs[i][0] > t) { keep.push(vs[i]); sum += vs[i][1]; }
    this.voices = keep;
    if (sum + cost > (prio < 0 ? CAP - 16 : CAP) && !(prio > 0)) { this.dropped++; return false; }
    keep.push([t + dur, cost]);
    return true;
  };
  EP.activeVoices = function (t) { var s = 0; this.voices.forEach(function (v) { if (v[0] > t) s += v[1]; }); return s; };
  EP.env = function (g, t, a, pk, dec, rel, end) {   // attack -> exp decay -> release
    var p = g.gain;
    p.setValueAtTime(0, t); p.linearRampToValueAtTime(pk, t + a);
    p.setTargetAtTime(pk * dec[1], t + a, dec[0]);
    p.setTargetAtTime(0, end, rel);
  };

  /* ---------------- instruments ---------------- */
  EP.rhodes = function (dest, t, m, dur, vel) {
    if (!this.alloc(t, dur + 0.5, 2, 0)) return;
    var ac = this.ac, f = mtof(m) * Math.pow(2, rnd(-5, 5) / 1200);
    var c = this.O('sine', f), mo = this.O('sine', f * 1.0006), mg = ac.createGain(), g = ac.createGain();
    mg.gain.setValueAtTime(f * (0.8 + vel * 1.3), t);
    mg.gain.setTargetAtTime(f * 0.1, t, 0.18);
    mo.connect(mg); mg.connect(c.frequency);
    var pk = 0.085 * vel * clamp(1.25 - (m - 60) / 40, 0.7, 1.3);
    this.env(g, t, 0.005, pk, [0.6, 0.35], 0.12, t + dur);
    c.connect(g); g.connect(dest);
    c.start(t); mo.start(t); c.stop(t + dur + 0.6); mo.stop(t + dur + 0.6);
    c.onended = function () { g.disconnect(); };
  };
  EP.padNote = function (dest, t, m, dur, vel) {
    if (!this.alloc(t, dur + 1.5, 1, 0)) return;
    var o = this.O('triangle', mtof(m) * Math.pow(2, rnd(-7, 7) / 1200)), g = this.ac.createGain(), p = g.gain, pk = 0.04 * vel;
    p.setValueAtTime(0, t); p.linearRampToValueAtTime(pk, t + 0.9); p.setTargetAtTime(0, t + dur, 0.45);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 2.2);
    o.onended = function () { g.disconnect(); };
  };
  EP.bassNote = function (t, m, dur, vel) {
    if (!this.alloc(t, dur + 0.2, 2, 1)) return;
    var f = mtof(m), dest = this.L.bass.in, ac = this.ac;
    var o1 = this.O('triangle', f), o2 = this.O('sine', f * 2), g = ac.createGain(), g2 = ac.createGain();
    g2.gain.value = 0.3;   // octave partial so the bass reads on laptop speakers
    this.env(g, t, 0.008, 0.17 * vel, [0.25, 0.65], 0.05, t + dur);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.3); o2.stop(t + dur + 0.3);
    o1.onended = function () { g.disconnect(); };
  };
  EP.kick = function (t, vel) {
    if (!this.alloc(t, 0.5, 1, 1)) return;
    var o = this.O('sine', 120), g = this.ac.createGain();
    o.frequency.setValueAtTime(125, t); o.frequency.exponentialRampToValueAtTime(54, t + 0.09);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3 * vel, t + 0.004); g.gain.setTargetAtTime(0, t + 0.01, 0.1);
    o.connect(g); g.connect(this.L.kick.in); o.start(t); o.stop(t + 0.6);
    o.onended = function () { g.disconnect(); };
  };
  EP.noiseHit = function (dest, t, a, pk, tc, len) {
    var s = this.ac.createBufferSource(), g = this.ac.createGain();
    s.buffer = this.white;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + a); g.gain.setTargetAtTime(0, t + a, tc);
    s.connect(g); g.connect(dest); s.start(t, Math.random() * 1.5); s.stop(t + len);
    s.onended = function () { g.disconnect(); };
  };
  EP.snare = function (t, vel, brush) {
    if (!this.alloc(t, 0.4, 1, 0)) return;
    if (brush) { this.noiseHit(this.L.snare.in, t, 0.022, 0.13 * vel, 0.09, 0.45); return; }
    this.noiseHit(this.L.snare.in, t, 0.002, 0.2 * vel, 0.055, 0.35);
    var o = this.O('sine', 190), g = this.ac.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07 * vel, t + 0.003); g.gain.setTargetAtTime(0, t + 0.004, 0.03);
    o.connect(g); g.connect(this.L.snare.in); o.start(t); o.stop(t + 0.2);
  };
  EP.hat = function (t, vel, open) {
    if (!this.alloc(t, open ? 0.3 : 0.1, 1, 0)) return;
    this.noiseHit(this.L.hats.in, t, 0.001, 0.09 * vel, open ? 0.07 : 0.014, open ? 0.35 : 0.12);
  };
  // toplines
  EP.kalimba = function (dest, t, m, dur, vel, long) {
    if (!this.alloc(t, 1.6, 2, 0)) return;
    var ac = this.ac, f = mtof(m), o = this.O('sine', f), o2 = this.O('sine', f * 5.43), g = ac.createGain(), g2 = ac.createGain();
    var pk = 0.13 * vel * clamp(1.2 - (m - 72) / 36, 0.6, 1.2);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.003); g.gain.setTargetAtTime(0, t + 0.004, long ? 0.6 : 0.32);
    g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(pk * 0.28, t + 0.002); g2.gain.setTargetAtTime(0, t + 0.003, 0.025);
    o.connect(g); o2.connect(g2); g.connect(dest); g2.connect(dest);
    var end = t + (long ? 3 : 1.7);
    o.start(t); o2.start(t); o.stop(end); o2.stop(t + 0.25);
    o.onended = function () { g.disconnect(); };
  };
  EP.glock = function (dest, t, m, dur, vel, soft) {
    if (!this.alloc(t, 2.2, 3, 0)) return;
    var ac = this.ac, f = mtof(m), pk = (soft ? 0.06 : 0.08) * vel * clamp(1.2 - (m - 77) / 36, 0.6, 1.2);
    var parts = soft ? [[1, 1, 0.75], [2.756, 0.12, 0.2]] : [[1, 1, 0.65], [2.756, 0.28, 0.22], [5.404, 0.1, 0.09]];
    var end = t + 2.4, first = null;
    for (var i = 0; i < parts.length; i++) {
      var o = this.O('sine', f * parts[i][0]), g = ac.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk * parts[i][1], t + 0.002); g.gain.setTargetAtTime(0, t + 0.003, parts[i][2]);
      o.connect(g); g.connect(dest); o.start(t); o.stop(i === 0 ? end : t + 1.2);
      if (!first) { first = o; (function (gg) { o.onended = function () { gg.disconnect(); }; })(g); }
    }
  };
  EP.flute = function (dest, t, m, dur, vel) {
    if (!this.alloc(t, dur + 0.3, 3, 0)) return;
    var ac = this.ac, f = mtof(m), o = this.O('sine', f), o2 = this.O('triangle', f), g = ac.createGain(), g2 = ac.createGain();
    var lfo = this.O('sine', 5.2), lg = ac.createGain();
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.005, t + Math.min(0.35, dur));
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    g2.gain.value = 0.25;
    var pk = 0.09 * vel, d = Math.max(0.12, dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.035); g.gain.setTargetAtTime(pk * 0.55, t + 0.04, d * 0.5); g.gain.setTargetAtTime(0, t + d, 0.08);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    var end = t + d + 0.5;
    o.start(t); o2.start(t); lfo.start(t); o.stop(end); o2.stop(end); lfo.stop(end);
    o.onended = function () { g.disconnect(); };
  };
  EP.bird = function (dest, t, m, dur, vel) {
    if (!this.alloc(t, 0.35, 2, 0)) return;
    var ac = this.ac, f = mtof(m), o = this.O('sine', f), mo = this.O('sine', 26), mg = ac.createGain(), g = ac.createGain();
    o.frequency.setValueAtTime(f * 0.82, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
    o.frequency.setTargetAtTime(f * 0.97, t + 0.05, 0.08);
    mg.gain.value = f * 0.018; mo.connect(mg); mg.connect(o.frequency);
    var pk = 0.045 * vel, len = Math.min(0.32, Math.max(0.12, dur));
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.012); g.gain.setTargetAtTime(0, t + len * 0.5, len * 0.25);
    o.connect(g); g.connect(dest); o.start(t); mo.start(t); o.stop(t + len + 0.4); mo.stop(t + len + 0.4);
    o.onended = function () { g.disconnect(); };
  };
  EP.bubble = function (dest, t, m, dur, vel) {
    if (!this.alloc(t, 0.3, 1, 0)) return;
    var f = mtof(m), o = this.O('sine', f), g = this.ac.createGain();
    o.frequency.setValueAtTime(f * 0.6, t); o.frequency.exponentialRampToValueAtTime(f * 1.22, t + 0.06); o.frequency.setTargetAtTime(f * 1.15, t + 0.06, 0.1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.085 * vel, t + 0.006); g.gain.setTargetAtTime(0, t + 0.03, 0.06);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.4);
    o.onended = function () { g.disconnect(); };
  };
  EP.topNote = function (instr, dest, t, m, dur, vel) {
    if (instr === 'glock') this.glock(dest, t, m, dur, vel, false);
    else if (instr === 'box') this.glock(dest, t, m, dur, vel * 0.9, true);
    else if (instr === 'flute') this.flute(dest, t, m, dur, vel);
    else if (instr === 'bird') this.bird(dest, t, m, dur, vel);
    else if (instr === 'bubble') this.bubble(dest, t, m, dur, vel);
    else this.kalimba(dest, t, m, dur, vel, false);
  };

  /* ---------------- ambience ---------------- */
  EP.ambStart = function (name, t) {
    var E = this, ac = E.ac, out = E.ag[name], srcs = [];
    function noise(buf) { var s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(t, Math.random() * (buf.duration - 0.2)); srcs.push(s); return s; }
    function osc(f) { var o = E.O('sine', f); o.start(t); srcs.push(o); return o; }
    function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); }
    var F = E.F, G = E.G;
    if (name === 'rain') {
      chain(noise(E.white), F('highpass', 700, 0.5), F('lowpass', 5200, 0.4), G(0.067), out);
      chain(noise(E.pink), F('lowpass', 520, 0.5), G(0.225), out);
    } else if (name === 'wind') {
      var bp = F('bandpass', 480, 0.7), wg = G(0.39);
      chain(noise(E.pink), bp, wg, out);
      var l1 = G(260); osc(0.07).connect(l1); l1.connect(bp.frequency);
      var l2 = G(0.21); osc(0.113).connect(l2); l2.connect(wg.gain);
    } else if (name === 'river') {
      var lp = F('lowpass', 850, 0.6), rg = G(0.45);
      chain(noise(E.pink), lp, rg, out);
      var l3 = G(240); osc(0.21).connect(l3); l3.connect(lp.frequency);
      var bp2 = F('bandpass', 2400, 1.2), rg2 = G(0.035);
      chain(noise(E.white), bp2, rg2, out);
      var l4 = G(0.025); osc(0.37).connect(l4); l4.connect(rg2.gain);
    } else if (name === 'waves') {
      var lp2 = F('lowpass', 650, 0.5), sg = G(0.34), lfo = osc(0.075);
      chain(noise(E.pink), lp2, sg, out);
      var l5 = G(480); lfo.connect(l5); l5.connect(lp2.frequency);
      var l6 = G(0.3); lfo.connect(l6); l6.connect(sg.gain);
    } else if (name === 'simmer') {
      var sbp = F('bandpass', 950, 0.9), sgn = G(0.12);
      chain(noise(E.pink), sbp, sgn, out);
      var l7 = G(0.05); osc(0.31).connect(l7); l7.connect(sgn.gain);
    } else if (name === 'market') {
      chain(noise(E.pink), F('bandpass', 520, 0.9), G(0.4), out);
    } else if (name === 'vet') {   // soft clinic hum: mains-ish drone + a breath of air handling
      var vg1 = G(0.01), vg2 = G(0.0042), vg3 = G(0.0025);
      osc(118).connect(vg1); osc(236.5).connect(vg2); osc(354).connect(vg3); vg1.connect(out); vg2.connect(out); vg3.connect(out);
      var vbp = F('bandpass', 360, 0.8), vag = G(0.06);
      chain(noise(E.pink), vbp, vag, out);
      var vl = G(0.02); osc(0.09).connect(vl); vl.connect(vag.gain);
    } else if (name === 'salon') {   // hair dryer: a wide whoosh that swells in and out, with a warm motor under it
      var dbp = F('bandpass', 1700, 0.45), dg = G(0.023);
      chain(noise(E.white), dbp, dg, out);
      var dl = G(0.018); osc(0.06).connect(dl); dl.connect(dg.gain);
      var dl2 = G(500); osc(0.06).connect(dl2); dl2.connect(dbp.frequency);
      var dm = F('lowpass', 260, 0.7), dmg = G(0.026);
      chain(noise(E.pink), dm, dmg, out);
    }
    E.ambNodes[name] = srcs;
  };
  EP.ambStop = function (name, t) {
    (this.ambNodes[name] || []).forEach(function (s) { try { s.stop(t); } catch (e) { /* already stopped */ } });
    this.ambNodes[name] = null;
  };
  EP.evDest = function (name) { return this.evOut[name][(Math.random() * 3) | 0]; };
  EP.drop = function (t) {
    if (!this.alloc(t, 0.08, 1, -1)) return;
    var f = rnd(1600, 4200), o = this.O('sine', f), g = this.ac.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.03);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.007, 0.022), t + 0.002); g.gain.setTargetAtTime(0, t + 0.003, 0.012);
    o.connect(g); g.connect(this.evDest('rain')); o.start(t); o.stop(t + 0.1);
  };
  EP.pane = function (t) {   // soft rain tap on glass: a short damped tick plus a tiny dull knock
    if (!this.alloc(t, 0.1, 1, -1)) return;
    var f = rnd(900, 1700), o = this.O('triangle', f), g = this.ac.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.75, t + 0.04);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.012, 0.03), t + 0.002); g.gain.setTargetAtTime(0, t + 0.003, 0.014);
    o.connect(g); g.connect(this.evDest('window')); o.start(t); o.stop(t + 0.12);
  };
  EP.leafTick = function (t) {   // rain on leaves: tiny bandpassed noise taps
    if (!this.alloc(t, 0.06, 1, -1)) return;
    var s = this.ac.createBufferSource(), bp = this.F('bandpass', rnd(1500, 3800), 2.5), g = this.ac.createGain();
    s.buffer = this.white;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.02, 0.06), t + 0.002); g.gain.setTargetAtTime(0, t + 0.003, 0.01);
    s.connect(bp); bp.connect(g); g.connect(this.evDest('leaves')); s.start(t, Math.random() * 1.8); s.stop(t + 0.07);
  };
  EP.bee = function (t) {   // a bee drifting past: soft buzzing sawtooth swelling in and out
    var d = rnd(1.4, 2.8);
    if (!this.alloc(t, d, 3, -1)) return;
    var ac = this.ac, f = rnd(180, 250), o = this.O('sawtooth', f), lfo = this.O('sine', rnd(5, 9)), lg = ac.createGain(), bp = this.F('bandpass', 420, 2), g = ac.createGain();
    lg.gain.value = f * 0.03; lfo.connect(lg); lg.connect(o.frequency);
    o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * rnd(0.92, 1.08), t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.03, 0.05), t + d * 0.5); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(bp); bp.connect(g); g.connect(this.evDest('bees')); o.start(t); lfo.start(t); o.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
  };
  EP.simmerPop = function (t, name) {
    if (!this.alloc(t, 0.1, 1, -1)) return;
    var f = rnd(500, 900), o = this.O('sine', f), g = this.ac.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.04);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.01, 0.025), t + 0.004); g.gain.setTargetAtTime(0, t + 0.012, 0.015);
    o.connect(g); g.connect(this.evDest(name || 'simmer')); o.start(t); o.stop(t + 0.12);
  };
  EP.tick2 = function (t, tock) {   // wall clock
    if (!this.alloc(t, 0.06, 1, -1)) return;
    var o = this.O('triangle', tock ? 1700 : 2100), g = this.ac.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.001); g.gain.setTargetAtTime(0, t + 0.002, 0.008);
    o.connect(g); g.connect(this.evOut.clock[1]); o.start(t); o.stop(t + 0.06);
  };
  EP.birdPhrase = function (t) {
    var n = 2 + ((Math.random() * 4) | 0), f0 = rnd(2600, 4200), dest = this.evDest('birds'), up = chance(0.5);
    for (var i = 0; i < n; i++) {
      var tt = t + i * rnd(0.09, 0.16);
      if (!this.alloc(tt, 0.2, 2, -1)) return;
      var f = f0 * rnd(0.92, 1.1), o = this.O('sine', f), mo = this.O('sine', rnd(40, 90)), mg = this.ac.createGain(), g = this.ac.createGain(), d = rnd(0.05, 0.11);
      o.frequency.setValueAtTime(up ? f * 0.8 : f * 1.15, tt); o.frequency.exponentialRampToValueAtTime(up ? f * 1.15 : f * 0.82, tt + d);
      mg.gain.value = f * 0.03; mo.connect(mg); mg.connect(o.frequency);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.13, tt + 0.01); g.gain.setTargetAtTime(0, tt + d * 0.6, d * 0.3);
      o.connect(g); g.connect(dest); o.start(tt); mo.start(tt); o.stop(tt + d + 0.15); mo.stop(tt + d + 0.15);
    }
  };
  EP.cricket = function (t) {
    if (!this.alloc(t, 0.2, 1, -1)) return;
    var o = this.O('sine', rnd(4300, 4900)), g = this.ac.createGain(), p = g.gain, n = 3 + ((Math.random() * 2) | 0), pk = rnd(0.035, 0.06);
    p.setValueAtTime(0, t);
    for (var i = 0; i < n; i++) { var s = t + i * 0.04; p.setValueAtTime(0, s); p.linearRampToValueAtTime(pk, s + 0.006); p.linearRampToValueAtTime(0, s + 0.022); }
    o.connect(g); g.connect(this.evDest('crickets')); o.start(t); o.stop(t + n * 0.04 + 0.05);
  };
  EP.bloop = function (t) {
    if (!this.alloc(t, 0.12, 1, -1)) return;
    var f = rnd(260, 520), o = this.O('sine', f), g = this.ac.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.05);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 0.005); g.gain.setTargetAtTime(0, t + 0.02, 0.02);
    o.connect(g); g.connect(this.evDest('river')); o.start(t); o.stop(t + 0.15);
  };
  EP.murmur = function (t, name, lvl) {
    if (!this.alloc(t, 0.5, 1, -1)) return;
    var ac = this.ac, s = ac.createBufferSource(), bp = this.F('bandpass', rnd(280, 1000), rnd(3, 6)), g = ac.createGain(), d = rnd(0.15, 0.45);
    bp.frequency.setTargetAtTime(bp.frequency.value * rnd(0.8, 1.25), t, d * 0.5);
    s.buffer = this.white;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.07, 0.16) * (lvl || 1), t + 0.04); g.gain.setTargetAtTime(0, t + d * 0.6, d * 0.25);
    s.connect(bp); bp.connect(g); g.connect(this.evDest(name || 'market')); s.start(t, Math.random() * 1.4); s.stop(t + d + 0.2);
  };
  EP.gull = function (t) {   // seagull 'kyow' calls, 2-4 in a row
    var n = 2 + ((Math.random() * 3) | 0), f0 = rnd(1300, 1700), dest = this.evDest('gulls');
    for (var i = 0; i < n; i++) {
      var tt = t + i * rnd(0.28, 0.4), d = rnd(0.22, 0.32);
      if (!this.alloc(tt, d + 0.05, 3, -1)) return;
      var o = this.O('sawtooth', f0), bp = this.F('bandpass', 1900, 2.2), g = this.ac.createGain(), f = f0 * rnd(0.95, 1.05);
      o.frequency.setValueAtTime(f * 0.8, tt); o.frequency.linearRampToValueAtTime(f * 1.12, tt + 0.04); o.frequency.exponentialRampToValueAtTime(f * 0.62, tt + d);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.05, tt + 0.03); g.gain.linearRampToValueAtTime(0.035, tt + d * 0.6); g.gain.linearRampToValueAtTime(0, tt + d);
      o.connect(bp); bp.connect(g); g.connect(dest); o.start(tt); o.stop(tt + d + 0.02);
    }
  };
  EP.clink = function (t) {   // cup on saucer / spoon tap
    var n = chance(0.35) ? 2 : 1, dest = this.evDest('cafe');
    for (var i = 0; i < n; i++) {
      var tt = t + i * rnd(0.09, 0.14), f = rnd(2500, 3400);
      if (!this.alloc(tt, 0.25, 2, -1)) return;
      var o = this.O('sine', f), o2 = this.O('sine', f * 2.71), g = this.ac.createGain();
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(rnd(0.015, 0.03), tt + 0.001); g.gain.setTargetAtTime(0, tt + 0.002, 0.05);
      o.connect(g); o2.connect(g); g.connect(dest); o.start(tt); o2.start(tt); o.stop(tt + 0.3); o2.stop(tt + 0.3);
    }
  };
  EP.spray = function (t) {   // grooming water spray / rinse swish
    var d = rnd(0.3, 0.7);
    if (!this.alloc(t, d, 1, -1)) return;
    var s = this.ac.createBufferSource(), hp = this.F('highpass', rnd(2500, 3500), 0.7), g = this.ac.createGain();
    s.buffer = this.white;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.012, 0.025), t + d * 0.3); g.gain.linearRampToValueAtTime(0, t + d);
    s.connect(hp); hp.connect(g); g.connect(this.evDest('salon')); s.start(t, Math.random()); s.stop(t + d + 0.02);
  };
  EP.bell = function (t) {   // distant reception bell: a soft double 'ding' through a bit of distance
    var dest = this.evDest('vet'), n = chance(0.4) ? 2 : 1, f = rnd(1750, 2000);
    for (var i = 0; i < n; i++) {
      var tt = t + i * 0.34;
      if (!this.alloc(tt, 1.4, 2, -1)) return;
      var o = this.O('sine', f), o2 = this.O('sine', f * 2.4), g = this.ac.createGain(), g2 = this.ac.createGain(), lp = this.F('lowpass', 3200, 0.5);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.03, tt + 0.003); g.gain.setTargetAtTime(0, tt + 0.004, 0.28);
      g2.gain.setValueAtTime(0, tt); g2.gain.linearRampToValueAtTime(0.008, tt + 0.002); g2.gain.setTargetAtTime(0, tt + 0.003, 0.07);
      o.connect(g); o2.connect(g2); g.connect(lp); g2.connect(lp); lp.connect(dest);
      o.start(tt); o2.start(tt); o.stop(tt + 1.6); o2.stop(tt + 0.5);
    }
  };
  EP.rustle = function (t) {   // paper rustle: a few tiny bandpassed noise crinkles
    var n = 3 + ((Math.random() * 5) | 0), dest = this.evDest('vet');
    for (var i = 0; i < n; i++) {
      var tt = t + i * rnd(0.04, 0.11), d = rnd(0.02, 0.06);
      if (!this.alloc(tt, d + 0.05, 1, -1)) return;
      var s = this.ac.createBufferSource(), bp = this.F('bandpass', rnd(2600, 6200), rnd(0.7, 1.4)), g = this.ac.createGain();
      s.buffer = this.white;
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(rnd(0.012, 0.028), tt + 0.004); g.gain.setTargetAtTime(0, tt + 0.006, d * 0.4);
      s.connect(bp); bp.connect(g); g.connect(dest); s.start(tt, Math.random() * 1.5); s.stop(tt + d + 0.05);
    }
  };
  EP.snip = function (t) {   // scissor snips: 2-5 quick metallic clicks
    var n = 2 + ((Math.random() * 4) | 0), dest = this.evDest('salon'), gap = rnd(0.11, 0.17);
    for (var i = 0; i < n; i++) {
      var tt = t + i * gap;
      if (!this.alloc(tt, 0.1, 2, -1)) return;
      var s = this.ac.createBufferSource(), hp = this.F('highpass', 4200, 0.8), g = this.ac.createGain(), o = this.O('triangle', rnd(4300, 5200)), og = this.ac.createGain();
      s.buffer = this.white;
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.03, tt + 0.001); g.gain.setTargetAtTime(0, tt + 0.002, 0.007);
      og.gain.setValueAtTime(0, tt); og.gain.linearRampToValueAtTime(0.012, tt + 0.001); og.gain.setTargetAtTime(0, tt + 0.002, 0.012);
      s.connect(hp); hp.connect(g); g.connect(dest); o.connect(og); og.connect(dest);
      s.start(tt, Math.random() * 1.5); s.stop(tt + 0.06); o.start(tt); o.stop(tt + 0.1);
    }
  };
  EP.ambEvents = function (t, dt) {
    var a = this.ambT, self = this;
    function times(rate, fn) { var x = rate * dt, n = Math.floor(x) + (chance(x - Math.floor(x)) ? 1 : 0); for (var i = 0; i < n; i++) fn.call(self, t + Math.random() * dt); }
    if (a.rain > 0) times(9, this.drop);
    if (a.birds > 0) times(this.birdRate, this.birdPhrase);
    if (a.crickets > 0) times(2.4, this.cricket);
    if (a.river > 0) times(1.4, this.bloop);
    if (a.window > 0) times(3.2, this.pane);
    if (a.leaves > 0) times(12, this.leafTick);
    if (a.bees > 0) times(0.3, this.bee);
    if (a.simmer > 0) times(3, this.simmerPop);
    if (a.clock > 0) {   // a steady tick-tock, once per second on the audio clock
      if (!this.clockNext || this.clockNext < t - 1) this.clockNext = t;
      while (this.clockNext < t + dt) { this.tick2(this.clockNext, this.clockTock = !this.clockTock); this.clockNext += 1; }
    }
    if (a.gulls > 0) times(0.12, this.gull);
    if (a.cafe > 0) { times(2.5, function (tt) { this.murmur(tt, 'cafe', 0.6); }); times(0.6, this.clink); }
    if (a.salon > 0) {
      times(0.35, this.spray); times(2, function (tt) { this.simmerPop(tt, 'salon'); });
      times(0.3, this.snip); times(1.4, function (tt) { this.murmur(tt, 'salon', 0.8); });   // scissors + soft chatter
    }
    if (a.vet > 0) { times(0.05, this.bell); times(0.22, this.rustle); }
    if (a.market > 0) {
      times(5.5, this.murmur);
      times(0.035, function (tt) { this.glock(this.evDest('market'), tt, pick([77, 81, 84]), 0.5, 0.35, true); });
    }
  };

  /* ---------------- scheduler ---------------- */
  EP.on = function (n, t) { var L = this.L[n]; return L.target > 0.001 || t < L.end; };
  EP.start = function (t, v) { this.nextTime = t; this.apply(v, t, true); };
  EP.queue = function (v) {
    if (v.sig === this.sig) { this.pending = null; return false; }
    if (this.pending && this.pending.sig === v.sig) return false;
    this.pending = v; return true;
  };
  EP.apply = function (v, t, first) {
    var E = this, tc = first ? 0.7 : 1.15;   // ~4-6 s to settle
    E.v = v; E.sig = v.sig; E.applied++;
    LAYERS.forEach(function (n) {
      var L = E.L[n], tgt = (v.L[n] || 0) * v.mix * (L.gainK || 1);
      ramp(L.g.gain, tgt, t, tc);
      L.target = tgt; L.end = t + tc * 6;
      if (tgt > 0.001 && E.pat[n] != null && v[n]) E.pat[n] = v[n];
    });
    E.brush = v.brush; E.top = v.top;
    E.bpmTarget = v.bpm; E.swingTarget = v.swing;
    if (first) { E.bpm = v.bpm; E.swing = v.swing; }
    if (v.prog !== E.progName) { if (first) E.progName = v.prog; else E.nextProg = v.prog; } else E.nextProg = null;
    ramp(E.lp.frequency, v.cut, t, first ? 0.3 : 1.4);
    ramp(E.drumLP.frequency, v.drumCut, t, first ? 0.3 : 1.4);
    AMBS.forEach(function (n) {
      var tgt = v.amb[n] || 0;
      if (tgt > 0.001 && AMB_CONT[n] && !E.ambNodes[n]) E.ambStart(n, t);
      ramp(E.ag[n].gain, tgt, t, first ? 0.9 : 1.5);
      if (tgt <= 0.001 && E.ambNodes[n]) E.ambStop(n, t + 10);
      E.ambT[n] = tgt;
    });
    ramp(E.ambLP.frequency, v.indoor ? 1100 : E.openHz, t, first ? 0.2 : 1.5);
    E.birdRate = v.birdRate;
  };
  EP.barStart = function (bar, step, t) {
    var E = this;
    if (E.pending) { E.apply(E.pending, t, false); E.pending = null; }
    if (E.nextProg && bar % 2 === 0) { E.progName = E.nextProg; E.nextProg = null; }
    E.bpm += clamp(E.bpmTarget - E.bpm, -2.5, 2.5);
    E.swing += clamp(E.swingTarget - E.swing, -0.03, 0.03);
    var pr = PROGS[E.progName] || PROGS.bright;
    E.pi = bar % 8; E.bar = bar;
    E.chord = CH[pr[E.pi]]; E.nextChord = CH[pr[(bar + 1) % 8]];
    if (bar % 2 === 0 && step >= E.topBusy) E.planTop(step);
  };
  EP.planTop = function (start) {
    var E = this, v = E.v, instr = E.top || 'kalimba', phrase, base = 0, len;
    if (!v) return;
    if (instr !== 'bubble' && v.themeChance > 0 && E.pi % 4 === 0 && start - E.lastTheme >= v.themeGap * 16 && chance(v.themeChance)) {
      phrase = THEME; len = 64; E.lastTheme = start; E.themes++;
    } else if (chance(v.dens)) {
      phrase = pick(instr === 'bubble' ? BUBBLES : MOTIFS); len = 32;
      var cands = [];
      for (var i = 1; i <= 5; i++) if (E.chord.pcs[pentaMidi(i) % 12]) cands.push(i);
      base = cands.length ? pick(cands) : 2;
    } else { E.topBusy = start + 32; return; }
    var oct = TOP_OCT[instr] || 0;
    phrase.forEach(function (n) {
      var st = start + n[0];
      (E.topQ[st] = E.topQ[st] || []).push({ i: base + n[1] + oct, len: n[2], vel: n[3] || rnd(0.65, 0.9), instr: instr });
    });
    E.topBusy = start + len;
  };
  EP.scheduleStep = function (step, t0, sd) {
    var E = this, s = step & 15, bar = step >> 4;
    if (s === 0) E.barStart(bar, step, t0);
    var t = t0 + ((s & 1) ? (E.swing - 0.5) * 2 * sd : 0);   // swung 16ths
    var ch = E.chord, P = E.pat, i, p;
    function hum() { return rnd(-0.004, 0.006); }
    // keys
    if (E.on('keys', t)) {
      if (P.keys === 'arp') {
        if (!(s & 1)) {
          var order = [0, 1, 2, 3, 2, 1, 3, 2], k = order[s >> 1];
          E.rhodes(E.L.keys.in, t + hum(), ch.v[k], sd * 3.5, (s === 0 ? 0.75 : 0.55) * rnd(0.85, 1));
          if (s === 0) E.rhodes(E.L.keys.in, t, ch.r + 12, sd * 12, 0.5);
        }
      } else {
        var kp = KEYS[P.keys] || KEYS.comp, strum = (P.keys === 'sustain' || P.keys === 'sparse') ? 0.03 : 0.009;
        for (i = 0; i < kp.length; i++) if (kp[i][0] === s) {
          var vel = kp[i][2] * rnd(0.85, 1.05), th = t + hum();
          for (var j = 0; j < ch.v.length; j++) E.rhodes(E.L.keys.in, th + j * strum, ch.v[j], kp[i][1] * sd, vel * (j === ch.v.length - 1 ? 0.85 : 1));
        }
      }
    }
    if (s === 0 && E.on('pad', t)) for (i = 0; i < 3; i++) E.padNote(E.L.pad.in, t, ch.v[i], sd * 16 + 0.2, 1);
    if (E.on('bass', t)) {
      var bp = BASS[P.bass] || BASS.full;
      for (i = 0; i < bp.length; i++) if (bp[i][0] === s) {
        var iv = bp[i][1], m;
        if (iv === 'A') {
          var nr = E.nextChord.r;
          while (nr - ch.r > 6) nr -= 12;
          while (nr - ch.r < -6) nr += 12;
          m = nr + (chance(0.5) ? -1 : 1);
          if (nr === ch.r) m = ch.r + 12;
        } else m = ch.r + (iv === 'f' ? ch.f : iv);
        E.bassNote(t + hum() * 0.5, m, bp[i][2] * sd * 0.92, bp[i][3]);
      }
    }
    if (E.on('kick', t)) { p = KICK[P.kick] || KICK.std; for (i = 0; i < p.length; i++) if (p[i][0] === s) E.kick(t, p[i][1] * rnd(0.9, 1)); }
    if (E.on('snare', t)) { p = SNARE[P.snare] || SNARE.std; for (i = 0; i < p.length; i++) if (p[i][0] === s) E.snare(t + hum(), p[i][1] * rnd(0.85, 1), E.brush); }
    if (E.on('hats', t)) { p = HATS[P.hats] || HATS.std; for (i = 0; i < p.length; i++) if (p[i][0] === s) E.hat(t + hum(), p[i][1] * rnd(0.75, 1), !!p[i][2] && chance(0.4)); }
    var q = E.topQ[step];
    if (q) {
      delete E.topQ[step];
      if (E.on('top', t)) for (i = 0; i < q.length; i++) {
        var n = q[i], mm = fit(pentaMidi(n.i), ch);
        E.topNote(n.instr, E.L.top.in, t + hum(), mm, n.len * sd, n.vel * rnd(0.85, 1));
      }
    }
    E.ambEvents(t0, sd);
  };
  EP.tick = function (until) {
    var guard = 0;
    while (this.nextTime < until && guard++ < 64) {
      var t = this.nextTime;
      if (!this.offline && t < this.ac.currentTime) this.late++;
      this.scheduleStep(this.step, t, 60 / this.bpm / 4);
      this.nextTime += 60 / this.bpm / 4;
      this.step++; this.steps++;
    }
  };

  /* ---------------- stingers (same palette, built on the current chord, resolving to F) ---------------- */
  EP.stinger = function (name, t) {
    var E = this, ch = E.chord || CH.Fmaj9, out = E.stIn, sd = 60 / 96 / 4, i;
    var tones = [];
    for (var m = 64; tones.length < 6 && m < 100; m++) if (ch.pcs[m % 12]) tones.push(m);
    if (name === 'treasure') {
      ch.v.forEach(function (n, j) { E.rhodes(out, t + j * 0.02, n, 1.2, 0.5); });
      tones.forEach(function (n, j) { E.kalimba(out, t + j * sd, n, 0.5, 0.75 + j * 0.04, j === tones.length - 1); });
      var tt = t + tones.length * sd;
      E.glock(out, tt, tones[tones.length - 1] + 12, 1, 0.7);
      E.glock(out, tt + sd * 0.5, tones[tones.length - 2] + 12, 1, 0.45);
    } else if (name === 'levelup') {
      [3, 2, 3, 4].forEach(function (d, j) { E.glock(out, t + j * sd * 1.5, fit(pentaMidi(d + 5), ch), 0.4, 0.75); });
      ch.v.forEach(function (n, j) { E.rhodes(out, t + j * 0.015, n, 0.55, 0.55); });
      var t2 = t + sd * 6;
      CH.Fmaj9.v.forEach(function (n, j) { E.rhodes(out, t2 + j * 0.02, n, 1.6, 0.6); });
      E.bassNote(t2, 41, 1.4, 0.7);
      [77, 81, 84, 89].forEach(function (n, j) { E.kalimba(out, t2 + j * sd * 0.75, n, 0.6, 0.7, j === 3); });
    } else if (name === 'harvest') {   // pluck-pluck-pop: a bright little pick-up
      [0, 2, 4].forEach(function (k, j) { E.kalimba(out, t + j * sd, tones[k], 0.4, 0.8 + j * 0.05, false); });
      E.bubble(out, t + 3 * sd, tones[4] + 12, 0.2, 0.9);
      E.glock(out, t + 4 * sd, tones[5] + 12, 1, 0.55);
      ch.v.forEach(function (n, j) { E.rhodes(out, t + 3 * sd + j * 0.015, n, 0.9, 0.45); });
      E.bassNote(t + 3 * sd, ch.r, 0.8, 0.5);
    } else if (name === 'cooked') {   // oven-timer ding-ding, then a warm IV - I with the theme's last notes
      E.glock(out, t, 81, 0.6, 0.8); E.glock(out, t + sd * 2, 77, 0.6, 0.7);
      var t3 = t + sd * 5;
      CH.Bbmaj9.v.forEach(function (n, j) { E.rhodes(out, t3 + j * 0.02, n, 0.7, 0.55); });
      E.bassNote(t3, 46, 0.6, 0.6);
      var t4 = t3 + sd * 4;
      CH.Fmaj9.v.forEach(function (n, j) { E.rhodes(out, t4 + j * 0.025, n, 1.6, 0.6); });
      E.bassNote(t4, 41, 1.4, 0.65);
      E.kalimba(out, t3 + sd * 2, 67, 0.4, 0.7, false); E.kalimba(out, t4, 65, 0.8, 0.8, true);
    } else if (name === 'discover') {   // curious shimmer: Dm9 -> F69 with a rising glock arpeggio and the theme head
      CH.Dm9.v.forEach(function (n, j) { E.rhodes(out, t + j * 0.04, n, 0.9, 0.45); });
      [69, 72, 74, 79, 81, 84].forEach(function (n, j) { E.glock(out, t + j * sd * 0.75, n, 0.5, 0.45 + j * 0.05, true); });
      var t5 = t + sd * 6;
      CH.F69.v.forEach(function (n, j) { E.rhodes(out, t5 + j * 0.03, n, 1.8, 0.55); });
      E.bassNote(t5, 41, 1.6, 0.55);
      [[0, 3], [1, 2], [2, 3], [3, 4]].forEach(function (q) { E.kalimba(out, t5 + q[0] * sd, pentaMidi(q[1] + 5), 0.4, 0.7, q[0] === 3); });
    } else if (name === 'adopt') {
      CH.Fmaj9.v.forEach(function (n, j) { E.rhodes(out, t + j * 0.05, n, 2.4, 0.55); });
      E.bassNote(t, 41, 2.2, 0.6);
      for (i = 0; i < 12; i++) {
        var nn = THEME[i];
        E.kalimba(out, t + nn[0] * sd * 0.9, fit(pentaMidi(nn[1]), CH.Fmaj9), 0.5, nn[3], i === 9);
      }
      E.glock(out, t + 20 * sd * 0.9, 84, 1, 0.4, true);
    }
  };

  /* ---------------- v2 stings: own chain -> sfx bus (so they follow the sfx volume + mute), a short private reverb ---------------- */
  EP.stingBus = function () {
    if (this.sgIn) return this.sgIn;
    var E = this, ac = E.ac;
    E.sgIn = E.G(1); E.sgLP = E.F('lowpass', 7200, 0.5); E.sgIn.connect(E.sgLP);
    E.sgOut = E.G(0.62); E.sgLP.connect(E.sgOut); E.sgOut.connect(E.sfx);
    E.sgVerb = ac.createConvolver(); E.sgVerb.buffer = reverbBuf(ac, 1.6);
    var vs = E.G(0.3); E.sgLP.connect(vs); vs.connect(E.sgVerb); E.sgVerb.connect(E.sgOut);
    return E.sgIn;
  };
  // bell-like voices; prio 1 so a busy music bed never drops a sting note
  EP.sbell = function (dest, t, m, vel, kind) {
    var ac = this.ac, f = mtof(m), parts, dec, i, first = null;
    if (kind === 'box') { parts = [[1, 1, 1], [2.0, 0.22, 0.5], [4.02, 0.1, 0.2]]; dec = 0.55; }   // music-box tine
    else if (kind === 'glit') { parts = [[1, 1, 0.6], [2.756, 0.3, 0.2], [5.404, 0.12, 0.08]]; dec = 0.5; }   // glittery bell
    else { parts = [[1, 1, 1], [3.0, 0.2, 0.25], [5.43, 0.08, 0.06]]; dec = 0.35; }   // happy pluck
    if (!this.alloc(t, dec * 6, 2, 1)) return;
    var pk = 0.1 * vel * clamp(1.3 - (m - 72) / 40, 0.6, 1.3);
    for (i = 0; i < parts.length; i++) {
      if (f * parts[i][0] > ac.sampleRate * 0.45) break;   // never above Nyquist
      var o = this.O('sine', f * parts[i][0] * (i ? 1 : Math.pow(2, rnd(-3, 3) / 1200))), g = ac.createGain(), tau = dec * parts[i][2];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk * parts[i][1], t + 0.003); g.gain.setTargetAtTime(0, t + 0.004, tau);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + tau * 7 + 0.1);
      if (!first) { first = o; (function (gg) { o.onended = function () { gg.disconnect(); }; })(g); }
    }
  };
  EP.sting = function (name, t) {
    var E = this, out = E.stingBus(), u = 0.3;   // u = one lullaby eighth
    if (name === 'birth') {   // music-box lullaby phrase in F: C A C D | C - A G | F, about 2.5 s with the tail
      [[0, 84, 0.8], [1, 81, 0.65], [2, 84, 0.8], [3, 86, 0.85], [4, 84, 0.75], [6, 81, 0.6], [7, 79, 0.65], [8, 77, 0.8]].forEach(function (n) { E.sbell(out, t + n[0] * u, n[1], n[2], 'box'); });
      [53, 57, 60].forEach(function (m, j) { E.padNote(out, t + 8 * u + j * 0.03, m, 1.2, 0.9); });
      E.sbell(out, t + 8 * u + 0.02, 65, 0.5, 'box');
    } else if (name === 'sparkle') {   // glittery arpeggio up the F major 9, a few stray twinkles
      [72, 76, 79, 83, 84, 88, 91, 95, 96].forEach(function (m, j) { E.sbell(out, t + j * 0.075, m, 0.45 + j * 0.05, 'glit'); });
      for (var i = 0; i < 4; i++) E.sbell(out, t + 0.55 + i * rnd(0.06, 0.12), pick([100, 103, 105, 108]), rnd(0.18, 0.3), 'glit');
    } else if (name === 'playdate') {   // two happy notes, up
      E.sbell(out, t, 77, 0.85, 'pluck'); E.sbell(out, t + 0.17, 84, 1, 'pluck');
      E.sbell(out, t + 0.17, 88, 0.3, 'glit');
    }
  };

  /* ---------------- dog voices (v1.6): formant-filtered noise + pitched glide ---------------- */
  // f0 = speaking pitch, F = formants (Hz), mouth = open-mouth lowpass, noise = breathiness, K = loudness trim
  var BREEDS = {
    shiba: { f0: 500, F: [950, 1800, 3100], mouth: 3600, noise: 0.22, K: 1 },      // sharp
    corgi: { f0: 320, F: [680, 1350, 2600], mouth: 3000, noise: 0.28, K: 1 },      // surprisingly big
    golden: { f0: 170, F: [470, 1020, 2300], mouth: 2200, noise: 0.3, K: 1 },      // deep, warm
    dachshund: { f0: 225, F: [540, 1150, 2400], mouth: 2700, noise: 0.32, K: 1 },  // deep, loud
    husky: { f0: 280, F: [600, 1200, 2500], mouth: 2600, noise: 0.2, K: 1 },       // talker
    mutt: { f0: 300, F: [620, 1250, 2500], mouth: 2300, noise: 0.24, K: 1 },       // medium, soft
    chihuahua: { f0: 650, F: [1100, 2100, 3400], mouth: 3800, noise: 0.2, K: 1 },  // high, sharp, yappy (v1.7)
    pug: { f0: 260, F: [500, 1000, 2200], mouth: 1500, noise: 0.45, K: 1 },        // snorty, grunty, muffled
    greyhound: { f0: 200, F: [480, 1000, 2200], mouth: 1900, noise: 0.25, K: 1 },  // quiet, low 'roo'
    beagle: { f0: 300, F: [650, 1300, 2600], mouth: 2800, noise: 0.2, K: 1 },      // loud musical bay
    poodle: { f0: 430, F: [860, 1700, 3000], mouth: 3500, noise: 0.16, K: 1 },     // clear, bright yip (v2.5)
    collie: { f0: 360, F: [720, 1450, 2750], mouth: 3300, noise: 0.22, K: 1 },     // sharp, quick bark (v2.5)
    samoyed: { f0: 250, F: [560, 1150, 2400], mouth: 2500, noise: 0.2, K: 1 },     // "woo-woo" talker (v2.5)
    frenchie: { f0: 250, F: [500, 1000, 2200], mouth: 1700, noise: 0.42, K: 1 }    // snorty little bark (v2.5)
  };
  var BARK_KINDS = ['woof', 'yip', 'alert', 'demand', 'play', 'howl', 'talk', 'scream', 'whine', 'growl-play', 'sneeze', 'yawn', 'snore', 'pant', 'huff', 'whimper'];
  // loudness trims in dB per breed, in BARK_KINDS order: measured offline so every voice sits at its target level
  // (barks ~ -22 dB short-term RMS at default volumes, corgi/dachshund a touch louder, mutt softer; whines, sneezes, snores, pants softer)
  var KIND_LVL = { woof: 1, yip: 0.85, alert: 1, demand: 1, play: 0.95, howl: 0.8, talk: 0.85, scream: 0.85, whine: 0.6, 'growl-play': 0.55,
    sneeze: 0.5, yawn: 0.5, snore: 0.3, pant: 0.3, huff: 0.5, whimper: 0.7 };   // base level per kind; TRIM below was measured on top of it
  var TRIM = {
    shiba: [-0.3, -3.7, 0.6, 1.6, -0.8, -0.3, 0.1, -1.1, 4.2, 5.6, 0.1, 4.6, 8.1, 3, 1.9],
    corgi: [1.3, -1.3, 0.7, 1.8, 3.3, 0.8, 1.7, -1.4, -4.4, 5.5, 1.4, -1.4, 8.4, 4.5, 2.6],
    golden: [2.7, 3.2, 3, 1.2, 1.4, -4.7, -3.7, -3.8, -1.7, 7.8, 2.5, -1.3, 9, 5.6, 5.3],
    dachshund: [3.1, 2.3, 2.9, 1.9, 4.6, -4.8, -4.5, -3.6, -0.6, 6.6, 2.7, -1.1, 9, 5.6, 4.1],
    husky: [-0.7, -2.1, -1, 0.1, 2.3, -3.3, -1.7, -3.3, -3.9, 6.5, 1.3, -2.1, 9, 4.6, 3.6],
    mutt: [-1.7, -4.5, -2.2, 0.0, 0.2, -2.3, -1.3, -3.7, -4.6, 6.4, 0.9, -1.9, 9, 4.1, 3.9],
    chihuahua: [1.8, -2.5, 1.6, 1.7, 1.6, 0.5, 0.3, -4.1, 4.4, 4.7, -1.2, 1.8, 8.3, 2.5, 1.3],
    pug: [1.0, -5.7, 0.5, 1.1, 1.9, -5.7, -5.7, -2.3, 3.2, 6.8, 3.4, -1.6, 8.1, 7.1, 7.9],
    greyhound: [0.6, -1.8, 0.7, 0.8, 0.7, 2.4, 2.3, -1.2, 3.4, 7.0, 2.8, -0.9, 10.1, 5.8, 4.3],
    beagle: [1.1, -0.3, 2.4, 1.9, 4.0, 2.5, 0.6, -3.1, -4.6, 6.5, 1.2, -1.6, 8.6, 4.9, 3.1],
    // v2.5: measured the same way (4 offline renders each, to the median level of the ten breeds above)
    poodle: [1.6, -3.5, -0.6, 1.3, 2.0, 0.3, 0.2, -3.6, 1.3, 5.4, 0.8, 2.9, 8.1, 3.7, 2.2],
    collie: [0.6, -3.5, 0.3, 0.6, 1.9, 2.1, 2.3, -2.8, -4.1, 5.7, 1.4, -1.2, 8.5, 4.4, 3.2],
    samoyed: [-0.2, -1.2, -1.1, -0.4, 2.4, -4.4, -4.8, -4.0, -2.1, 6.3, 2.2, -1.3, 8.7, 4.8, 4.2],
    frenchie: [1.1, -3.6, 0.9, 1.4, 2.2, -5.5, -5.5, -2.0, 2.5, 7.1, 2.1, -1.3, 7.3, 6.1, 7.4]
  };
  function breedOf(voice) {
    var b = String((voice && voice.breed) || '').toLowerCase(), k;
    if (b.indexOf('shiba') >= 0) k = 'shiba';
    else if (b.indexOf('corgi') >= 0) k = 'corgi';
    else if (b.indexOf('golden') >= 0 || b.indexOf('retriever') >= 0) k = 'golden';
    else if (b.indexOf('dachs') >= 0 || b.indexOf('sausage') >= 0) k = 'dachshund';
    else if (b.indexOf('husky') >= 0) k = 'husky';
    else if (b.indexOf('mutt') >= 0) k = 'mutt';
    else if (b.indexOf('chihua') >= 0 || b === 'chi') k = 'chihuahua';
    else if (b.indexOf('pug') >= 0) k = 'pug';
    else if (b.indexOf('grey') >= 0 || b.indexOf('gray') >= 0) k = 'greyhound';
    else if (b.indexOf('beag') >= 0) k = 'beagle';
    else if (b.indexOf('poodle') >= 0) k = 'poodle';
    else if (b.indexOf('collie') >= 0) k = 'collie';
    else if (b.indexOf('samoyed') >= 0 || b.indexOf('sammy') >= 0) k = 'samoyed';
    else if (b.indexOf('frenchie') >= 0 || b.indexOf('french') >= 0) k = 'frenchie';
    var B = copy(BREEDS[k || 'mutt']);
    if (!k) B.f0 *= ({ small: 1.3, medium: 1, large: 0.68 })[voice && voice.size] || 1;   // unknown breed: size decides
    B.key = k || 'mutt';
    var p = clamp(Number(voice && voice.pitch) || 1, 0.7, 1.35) * rnd(0.975, 1.025);   // seeded per dog + a touch of life
    B.f0 *= p; B.F = B.F.map(function (f) { return f * Math.sqrt(p); }); B.mouth *= Math.sqrt(p);
    return B;
  }
  // syllable: d = dur, f = pitch contour [[frac, xf0]], m = mouth contour [[frac, xmouth]], a = attack, n = noise, g = gain, p = pitch mul,
  //           fm = formant mul, vib = [Hz, depth], am = [Hz, depth] (rrr), r = release fraction
  function adultPlan(voice, kind) {
    var B = breedOf(voice), S = [], lk = Math.sqrt(clamp(300 / B.f0, 0.75, 1.7));
    var hm = clamp(450 / B.f0, 0.9, 2.2);   // head-voice range for howls and talk
    function add(at, o) { o.at = at; if (o.n == null) o.n = B.noise; S.push(o); }
    function bark(at, d, p, g, peak) {
      add(at, { d: d * lk, p: p, g: g, a: 0.01, f: [[0, 0.82], [0.18, 1.12], [0.6, 1.0], [1, 0.72]], m: [[0, 0.35], [0.2, peak || 1], [1, 0.4]] });
    }
    var bk = B.key, loudK = kind === 'woof' || kind === 'alert' || kind === 'demand' || kind === 'play', handled = true, i2;
    function snort(at, g) { add(at, { d: 0.07, p: 0.5, g: g || 0.55, a: 0.01, r: 0.5, n: 0.95, f: [[0, 1], [1, 1]], m: [[0, 0.45], [1, 0.3]] }); }
    if (bk === 'chihuahua' && loudK) {   // rapid yappy bursts; alert = 4-5 yaps
      var ny = kind === 'alert' ? 4 + (chance(0.5) ? 1 : 0) : kind === 'play' ? 3 : kind === 'demand' ? 1 : (chance(0.6) ? 2 : 1);
      for (i2 = 0; i2 < ny; i2++) add(i2 * 0.11, { d: 0.085, p: (kind === 'play' ? 1.15 : 1) * rnd(0.97, 1.03), g: i2 ? 0.85 : 1, a: 0.004, f: [[0, 0.9], [0.25, 1.18], [1, 0.85]], m: [[0, 0.5], [0.25, 1.15], [1, 0.5]] });
    } else if (bk === 'pug' && loudK) {   // snort + short grunty muffled "rrf"
      var np = kind === 'alert' || kind === 'play' ? 2 : 1;
      for (i2 = 0; i2 < np; i2++) {
        snort(i2 * 0.24, 0.5);
        add(i2 * 0.24 + 0.05, { d: 0.13, p: kind === 'play' ? 1.15 : 1, g: 1, a: 0.01, n: 0.4, am: [32, 0.35], f: [[0, 0.85], [0.2, 1.1], [1, 0.75]], m: [[0, 0.3], [0.25, 0.8], [1, 0.3]] });
      }
    } else if (bk === 'pug' && kind === 'snore') {   // big snorty snore
      add(0, { d: 0.8, p: 0.32, g: 0.7, a: 0.25, r: 0.4, n: 0.75, am: [18, 0.8], f: [[0, 1], [1, 1]], m: [[0, 0.2], [0.5, 0.35], [1, 0.15]] });
      snort(0.85, 0.6);
      add(1.05, { d: 0.6, p: 1, g: 0.3, a: 0.15, r: 0.6, n: 1, f: [[0, 1], [1, 1]], m: [[0, 0.25], [1, 0.12]] });
    } else if (bk === 'pug' && kind === 'sneeze') {   // sneeze + a snorty reverse-sneeze tail
      add(0, { d: 0.12, p: 1, g: 0.25, a: 0.08, n: 1, f: [[0, 1], [1, 1]], m: [[0, 0.3], [1, 0.6]] });
      add(0.15, { d: 0.08, p: 1.6, g: 0.9, a: 0.003, r: 0.6, n: 0.85, f: [[0, 1.2], [1, 0.8]], m: [[0, 1.5], [1, 0.6]] });
      snort(0.32, 0.5); snort(0.43, 0.45);
    } else if (bk === 'pug' && kind === 'huff') {   // grunt + snort
      add(0, { d: 0.3, p: 0.5, g: 0.8, a: 0.015, r: 0.6, n: 0.7, am: [30, 0.5], f: [[0, 1.1], [1, 0.8]], m: [[0, 0.45], [0.15, 0.7], [1, 0.25]] });
      snort(0.27, 0.5);
    } else if (bk === 'greyhound' && loudK) {   // a single quiet woof
      bark(0, 0.22, 0.95, 0.8, 0.8);
    } else if (bk === 'greyhound' && (kind === 'howl' || kind === 'talk')) {   // soft low "roo" (talk = roo-roo)
      var rr = kind === 'talk' ? [[0, 0.45], [0.5, 0.55]] : [[0, 1.4]];
      rr.forEach(function (q) { add(q[0], { d: q[1], p: 1.25, g: 0.8, a: Math.min(0.2, q[1] * 0.3), r: 0.35, n: 0.1, fm: 0.8, vib: [4.5, 0.01], f: [[0, 0.8], [0.3, 1.0], [0.7, 1.02], [1, 0.75]], m: [[0, 0.3], [0.35, 0.65], [1, 0.25]] }); });
    } else if (bk === 'beagle' && (kind === 'alert' || kind === 'howl')) {   // the bay: a bark onset, then a long musical "aroooo"
      add(0, { d: 0.12, p: 1.05, g: 0.9, a: 0.008, f: [[0, 0.85], [0.3, 1.1], [1, 1.0]], m: [[0, 0.4], [0.3, 1.0], [1, 0.7]] });
      var bl = kind === 'howl' ? 1.8 : 1.0;
      add(0.1, { d: bl, p: clamp(420 / B.f0, 1, 1.8), g: 1, a: 0.06, r: 0.3, n: 0.08, fm: 0.9, vib: [5.5, 0.015],
        f: kind === 'howl' ? [[0, 0.9], [0.08, 1.0], [0.4, 1.0], [0.45, 1.12], [0.75, 1.12], [0.8, 1.0], [1, 0.8]] : [[0, 0.9], [0.1, 1.0], [0.6, 1.02], [1, 0.82]],
        m: [[0, 0.6], [0.15, 1.0], [0.8, 0.85], [1, 0.35]] });
    } else if (bk === 'poodle' && (kind === 'woof' || kind === 'play')) {   // v2.5: a clear, bright yip (play = two)
      add(0, { d: 0.1 * lk, p: 1.18, g: 1, a: 0.006, n: 0.12, f: [[0, 0.95], [0.25, 1.22], [1, 0.9]], m: [[0, 0.55], [0.25, 1.2], [1, 0.55]] });
      if (kind === 'play') add(0.15 * lk, { d: 0.09 * lk, p: 1.3, g: 0.9, a: 0.006, n: 0.12, f: [[0, 0.95], [0.25, 1.25], [1, 0.9]], m: [[0, 0.55], [0.25, 1.2], [1, 0.55]] });
    } else if (bk === 'collie' && loudK) {   // v2.5: sharp, quick barks close together (alert = 3, play = 2)
      var nc = kind === 'alert' ? 3 : kind === 'play' ? 2 : 1;
      for (i2 = 0; i2 < nc; i2++) bark(i2 * 0.14 * lk, 0.12, (kind === 'play' ? 1.12 : 1.04) * rnd(0.98, 1.02), i2 ? 0.88 : 1, 1.15);
    } else if (bk === 'samoyed' && (kind === 'talk' || kind === 'howl')) {   // v2.5: "woo-woo", two rising woos (howl = a long third woo)
      var ws = kind === 'howl' ? [[0, 0.32], [0.38, 0.32], [0.78, 1.1]] : [[0, 0.3], [0.36, 0.38]];
      ws.forEach(function (q, j) { add(q[0], { d: q[1], p: hm * (j ? 0.98 : 0.9), g: j ? 0.85 : 0.9, a: 0.04, r: 0.35, n: 0.1, fm: 0.85, vib: [5, 0.012], f: [[0, 0.78], [0.35, 1.12], [0.75, 1.05], [1, 0.8]], m: [[0, 0.35], [0.35, 0.95], [1, 0.35]] }); });
    } else if (bk === 'frenchie' && loudK) {   // v2.5: a snort, then a short proper bark (snortier than a pug's rrf)
      var nf = kind === 'alert' || kind === 'play' ? 2 : 1;
      for (i2 = 0; i2 < nf; i2++) { snort(i2 * 0.26, 0.55); bark(i2 * 0.26 + 0.06, 0.15, kind === 'play' ? 1.12 : 1, 0.95, 0.85); }
    } else if (bk === 'frenchie' && (kind === 'snore' || kind === 'huff')) {   // v2.5: snorty like the pug
      if (kind === 'snore') {
        add(0, { d: 0.75, p: 0.34, g: 0.7, a: 0.25, r: 0.4, n: 0.72, am: [20, 0.8], f: [[0, 1], [1, 1]], m: [[0, 0.2], [0.5, 0.35], [1, 0.15]] });
        snort(0.8, 0.6);
      } else {
        add(0, { d: 0.28, p: 0.55, g: 0.8, a: 0.015, r: 0.6, n: 0.7, am: [30, 0.5], f: [[0, 1.1], [1, 0.8]], m: [[0, 0.45], [0.15, 0.7], [1, 0.25]] });
        snort(0.25, 0.55); snort(0.36, 0.45);
      }
    } else handled = false;
    if (!handled) switch (kind) {
      case 'yip':
        add(0, { d: 0.09, p: 1.7, g: 0.9, a: 0.006, n: 0.14, f: [[0, 1], [0.3, 1.22], [1, 0.85]], m: [[0, 0.6], [0.3, 1.2], [1, 0.6]] });
        add(0.15, { d: 0.08, p: 1.85, g: 0.8, a: 0.006, n: 0.14, f: [[0, 1], [0.3, 1.2], [1, 0.9]], m: [[0, 0.6], [0.3, 1.2], [1, 0.6]] });
        break;
      case 'alert':
        bark(0, 0.14, 1.05, 1); bark(0.2 * lk, 0.13, 1.0, 0.85);
        if (chance(0.7)) bark(0.38 * lk, 0.13, 0.97, 0.78);
        break;
      case 'demand':
        add(0, { d: 0.24 * lk, p: 1.12, g: 1, a: 0.008, f: [[0, 0.9], [0.12, 1.18], [0.6, 1.05], [1, 0.8]], m: [[0, 0.4], [0.15, 1.15], [1, 0.45]] });
        break;
      case 'play':
        add(0, { d: 0.12 * lk, p: 1.32, g: 0.95, a: 0.008, f: [[0, 0.95], [0.25, 1.2], [1, 1.0]], m: [[0, 0.45], [0.25, 1.1], [1, 0.5]] });
        add(0.17 * lk, { d: 0.12 * lk, p: 1.4, g: 0.9, a: 0.008, f: [[0, 0.95], [0.25, 1.25], [1, 1.0]], m: [[0, 0.45], [0.25, 1.1], [1, 0.5]] });
        break;
      case 'howl':
        add(0, { d: 2, p: hm, g: 0.9, a: 0.25, r: 0.3, n: 0.06, fm: 0.85, vib: [5, 0.012], f: [[0, 0.7], [0.25, 1.0], [0.6, 1.06], [0.85, 0.92], [1, 0.7]], m: [[0, 0.35], [0.3, 0.9], [0.75, 0.8], [1, 0.3]] });
        break;
      case 'talk':   // a-woo, wa, woo
        add(0, { d: 0.38, p: hm * 0.9, g: 0.9, a: 0.04, n: 0.1, fm: 0.9, f: [[0, 0.8], [0.3, 1.15], [1, 1.0]], m: [[0, 0.5], [0.3, 1], [1, 0.45]] });
        add(0.4, { d: 0.16, p: hm * 0.9, g: 0.8, a: 0.02, n: 0.1, f: [[0, 1.05], [1, 0.95]], m: [[0, 0.4], [0.4, 1], [1, 0.5]] });
        add(0.6, { d: 0.5, p: hm * 0.9, g: 0.85, a: 0.04, r: 0.4, n: 0.1, fm: 0.88, vib: [5.5, 0.01], f: [[0, 1.1], [0.3, 1.2], [1, 0.75]], m: [[0, 0.5], [0.3, 0.85], [1, 0.3]] });
        break;
      case 'scream': {   // short comedic yodel with register breaks
        var alt = [1, 1.45, 1.0, 1.5, 1.05, 1.55, 1.1, 1.4, 0.9], f = [[0, alt[0]]];
        for (var i = 1; i < alt.length; i++) { var fr = i / alt.length; f.push([fr, alt[i - 1]]); f.push([Math.min(1, fr + 0.012), alt[i]]); }
        f.push([1, 0.8]);
        add(0, { d: 0.85, p: hm * 1.25, g: 0.85, a: 0.03, r: 0.15, n: 0.12, f: f, m: [[0, 0.6], [0.1, 1.2], [0.9, 1.1], [1, 0.5]], am: [9, 0.25] });
        break;
      }
      case 'whine':
        add(0, { d: 0.75, p: clamp(800 / B.f0, 1.4, 4), g: 0.7, a: 0.06, r: 0.3, n: 0.05, fm: 1.25, vib: [6, 0.02], f: [[0, 0.9], [0.3, 1.12], [0.65, 1.05], [1, 0.78]], m: [[0, 0.45], [0.3, 0.6], [1, 0.4]] });
        break;
      case 'growl-play':
        add(0, { d: 0.9, p: 0.42, g: 0.75, a: 0.08, r: 0.3, n: 0.45, am: [26, 0.7], f: [[0, 0.95], [0.5, 1.05], [1, 0.9]], m: [[0, 0.5], [0.5, 0.7], [1, 0.4]] });
        break;
      case 'sneeze':
        add(0, { d: 0.14, p: 1, g: 0.25, a: 0.1, n: 1, fm: 1.3, f: [[0, 1], [1, 1]], m: [[0, 0.2], [1, 0.45]] });
        add(0.17, { d: 0.09, p: 1.8, g: 0.9, a: 0.003, r: 0.6, n: 0.8, f: [[0, 1.2], [1, 0.8]], m: [[0, 1.6], [1, 0.6]] });
        break;
      case 'yawn':   // squeaky at the end
        add(0, { d: 1.0, p: clamp(600 / B.f0, 1.2, 3), g: 0.7, a: 0.12, r: 0.15, n: 0.25, f: [[0, 0.85], [0.35, 1.25], [0.7, 1.05], [0.88, 0.8], [1, 1.3]], m: [[0, 0.25], [0.4, 0.9], [0.85, 0.5], [1, 0.35]] });
        break;
      case 'snore':
        add(0, { d: 0.9, p: 0.3, g: 0.6, a: 0.3, r: 0.4, n: 0.7, am: [22, 0.5], f: [[0, 1], [1, 1]], m: [[0, 0.15], [0.5, 0.25], [1, 0.12]] });
        add(1.0, { d: 0.7, p: 1, g: 0.3, a: 0.15, r: 0.6, n: 1, f: [[0, 1], [1, 1]], m: [[0, 0.2], [1, 0.1]] });
        break;
      case 'pant':
        for (var j = 0; j < 4; j++) add(j * 0.17, { d: 0.11, p: 1, g: 0.6, a: 0.02, r: 0.6, n: 0.95, fm: 1.1, f: [[0, 1], [1, 1]], m: j % 2 ? [[0, 0.4], [1, 0.3]] : [[0, 0.55], [1, 0.4]] });
        break;
      case 'whimper':   // soft, short, falling sighs of worry (all ages; puppies get the pitch lift on top)
        add(0, { d: 0.42, p: clamp(560 / B.f0, 1.1, 3), g: 0.6, a: 0.09, r: 0.4, n: 0.18, fm: 1.15, vib: [6.5, 0.03], f: [[0, 0.95], [0.3, 1.1], [1, 0.72]], m: [[0, 0.35], [0.3, 0.55], [1, 0.3]] });
        add(0.52, { d: 0.34, p: clamp(520 / B.f0, 1.05, 2.8), g: 0.45, a: 0.07, r: 0.45, n: 0.2, fm: 1.12, vib: [6.5, 0.03], f: [[0, 0.9], [0.3, 1.05], [1, 0.66]], m: [[0, 0.3], [0.3, 0.5], [1, 0.25]] });
        break;
      case 'huff':
        add(0, { d: 0.38, p: 0.55, g: 0.8, a: 0.015, r: 0.6, n: 0.75, f: [[0, 1.1], [1, 0.8]], m: [[0, 0.5], [0.15, 0.7], [1, 0.2]] });
        add(0.3, { d: 0.12, p: 0.6, g: 0.35, a: 0.02, n: 0.2, f: [[0, 1], [1, 0.9]], m: [[0, 0.3], [1, 0.25]] });
        break;
      default:   // woof
        kind = 'woof';
        bark(0, 0.2, 1, 1);
    }
    var dur = 0;
    S.forEach(function (o) { dur = Math.max(dur, o.at + o.d); });
    return { B: B, S: S, dur: dur, kind: kind };
  }
  /* ---- v2 puppy voices: voice.age = 'newborn' | 'puppy' (anything else = adult, byte-identical to v1.7) ---- */
  function planDur(S) { var d = 0; S.forEach(function (o) { d = Math.max(d, o.at + o.d); }); return d; }
  // newborn: tiny squeaks and mews. Only whine (mew), whimper and yip (squeak pair) are distinct; every other kind is one squeak.
  function newbornPlan(voice, kind) {
    var B = breedOf(voice), S = [], f1 = 1250 * Math.pow(B.f0 / 300, 0.25);   // a hint of breed: bigger-voiced breeds are a little lower
    B.F = [B.F[0] * 1.9, B.F[1] * 1.55, B.F[2] * 1.2]; B.mouth = Math.min(6500, B.mouth * 1.8); B.noise = 0.12;
    B.f0 = f1;
    function add(at, o) { o.at = at; if (o.n == null) o.n = 0.1; S.push(o); }
    function squeak(at, d, p, g) { add(at, { d: d, p: p, g: g, a: 0.008, f: [[0, 0.88], [0.25, 1.18], [1, 0.9]], m: [[0, 0.6], [0.25, 1.1], [1, 0.6]], vib: [9, 0.012] }); }
    var k;
    if (kind === 'whine') {   // mew: a thin rising-falling "miaow"
      k = 'whine';
      add(0, { d: 0.5, p: 1, g: 0.8, a: 0.07, r: 0.4, n: 0.1, vib: [7.5, 0.025], f: [[0, 0.8], [0.35, 1.2], [0.7, 1.05], [1, 0.72]], m: [[0, 0.5], [0.35, 1.0], [1, 0.45]] });
    } else if (kind === 'whimper') {
      k = 'whimper';
      add(0, { d: 0.3, p: 0.9, g: 0.6, a: 0.06, r: 0.4, n: 0.12, vib: [8, 0.03], f: [[0, 1], [0.3, 1.1], [1, 0.7]], m: [[0, 0.5], [0.3, 0.8], [1, 0.4]] });
      add(0.38, { d: 0.26, p: 0.85, g: 0.45, a: 0.05, r: 0.45, n: 0.12, vib: [8, 0.03], f: [[0, 0.95], [0.3, 1.05], [1, 0.66]], m: [[0, 0.45], [0.3, 0.7], [1, 0.35]] });
    } else if (kind === 'yip') {
      k = 'yip';
      squeak(0, 0.08, 1.05, 0.85); squeak(0.13, 0.07, 1.2, 0.75);
    } else {
      k = 'yip';   // anything else: one squeak
      squeak(0, 0.1, 1.1, 0.85);
    }
    return { B: B, S: S, dur: planDur(S), kind: k, noTrim: true, gk: 0.9, age: 'newborn' };
  }
  // puppy: the breed's own plan, lifted +5..7 semitones, shorter and squeakier, plus a clumsy bark-hiccup
  function puppyPlan(voice, kind) {
    var plan = adultPlan(voice, kind), B = plan.B, semi = rnd(5, 7), r = Math.pow(2, semi / 12), S = plan.S, last = null, loud = false;
    B.f0 *= r; B.F = B.F.map(function (f) { return f * Math.pow(r, 0.55); }); B.mouth = Math.min(7000, B.mouth * Math.pow(r, 0.6));
    var k = plan.kind, shrink = (k === 'howl' || k === 'talk' || k === 'scream') ? 0.55 : (k === 'woof' || k === 'alert' || k === 'demand' || k === 'play' || k === 'yip' || k === 'growl-play') ? 0.72 : 0.85;
    S.forEach(function (o) {
      o.at *= shrink; o.d = Math.max(0.045, o.d * shrink);
      if (o.n < 0.5) o.n *= 0.7;   // squeakier: cleaner pitched tone
      if (!o.vib && o.d < 0.3) o.vib = [10, 0.015];   // a little wobble
      if (o.f && o.d < 0.3) o.f = o.f.map(function (q) { return [q[0], q[0] === 0 ? q[1] : q[1] * 1.08]; });
      if (!last || o.at + o.d > last.at + last.d) last = o;
    });
    loud = k === 'woof' || k === 'alert' || k === 'demand' || k === 'play';
    if (loud && last && (k === 'woof' ? chance(0.7) : chance(0.55))) {   // hiccup: an inhaled little "hic" that cracks upward, then a tiny squeak
      var at = last.at + last.d + 0.07;
      S.push({ at: at, d: 0.05, p: 1.15, g: 0.55, a: 0.006, n: 0.35, f: [[0, 0.7], [1, 1.35]], m: [[0, 0.5], [1, 1.1]] });
      S.push({ at: at + 0.08, d: 0.07, p: 1.5, g: 0.5, a: 0.006, n: 0.1, vib: [12, 0.02], f: [[0, 1.3], [0.4, 0.95], [1, 1.15]], m: [[0, 0.8], [1, 0.8]] });
    }
    plan.dur = planDur(S); plan.noTrim = true; plan.gk = 0.8; plan.age = 'puppy';
    return plan;
  }
  function barkPlan(voice, kind) {
    var age = voice && voice.age;
    if (age === 'newborn') return newbornPlan(voice, kind);
    if (age === 'puppy') return puppyPlan(voice, kind);
    return adultPlan(voice, kind);
  }
  EP.vsyl = function (out, t, B, o) {
    var ac = this.ac, d = o.d, f0 = B.f0 * (o.p || 1), end = t + d, fm = o.fm || 1, i;
    var src = this.O('sawtooth', f0), nz = ac.createBufferSource(), vg = ac.createGain(), ng = ac.createGain(), pre = ac.createGain();
    o.f.forEach(function (q, k) { var tt = t + q[0] * d; if (k === 0) src.frequency.setValueAtTime(f0 * q[1], tt); else src.frequency.linearRampToValueAtTime(f0 * q[1], tt); });
    var extra = [];
    if (o.vib) { var lfo = this.O('sine', o.vib[0]), lg = ac.createGain(); lg.gain.value = f0 * o.vib[1]; lfo.connect(lg); lg.connect(src.frequency); extra.push(lfo); }
    nz.buffer = this.white;
    vg.gain.value = (1 - o.n) * 0.9; ng.gain.value = o.n * 1.6;
    src.connect(vg); nz.connect(ng); vg.connect(pre); ng.connect(pre);
    var sum = ac.createGain(), FG = [1, 0.7, 0.35], FQ = [4, 5, 6];
    for (i = 0; i < 3; i++) { var bp = this.F('bandpass', B.F[i] * fm, FQ[i]), bg = ac.createGain(); bg.gain.value = FG[i] * 2.2; pre.connect(bp); bp.connect(bg); bg.connect(sum); }
    var body = this.F('lowpass', B.F[0] * fm * 1.1, 0.7), bdg = ac.createGain(); bdg.gain.value = 0.45; pre.connect(body); body.connect(bdg); bdg.connect(sum);
    var mouth = this.F('lowpass', B.mouth, 0.8);
    o.m.forEach(function (q, k) { var v = clamp(B.mouth * q[1], 200, 9000), tt = t + q[0] * d; if (k === 0) mouth.frequency.setValueAtTime(v, tt); else mouth.frequency.linearRampToValueAtTime(v, tt); });
    var env = ac.createGain(), pk = o.g, a = Math.min(o.a, d * 0.5), rs = end - d * (o.r || 0.35);
    env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(pk, t + a);
    env.gain.setValueAtTime(pk, Math.max(t + a, rs)); env.gain.linearRampToValueAtTime(0, end);
    var last = env;
    if (o.am) {   // rolling rrr
      var am = ac.createGain(), al = this.O('sine', o.am[0]), alg = ac.createGain();
      am.gain.value = 1 - o.am[1] * 0.5; alg.gain.value = o.am[1] * 0.5; al.connect(alg); alg.connect(am.gain); extra.push(al);
      env.connect(am); last = am;
    }
    sum.connect(mouth); mouth.connect(env); last.connect(out);
    src.start(t); nz.start(t, Math.random() * 1.5); src.stop(end + 0.02); nz.stop(end + 0.02);
    extra.forEach(function (x) { x.start(t); x.stop(end + 0.02); });
    src.onended = function () { try { last.disconnect(); } catch (e) { /* ignore */ } };
  };
  // plays a plan into bus.sfx; returns its duration
  EP.bark = function (plan, t, opts) {
    var ac = this.ac, E = this, o = opts || {}, dist = clamp(Number(o.distance) || 0, 0, 1);
    var vol = clamp(o.volume == null ? 1 : Number(o.volume) || 0, 0, 1);
    var g = ac.createGain(), lp = this.F('lowpass', 600 + 8400 * Math.pow(1 - dist, 2), 0.6);
    var tr = plan.noTrim ? 0 : (TRIM[plan.B.key] || TRIM.mutt)[BARK_KINDS.indexOf(plan.kind)] || 0;
    g.gain.value = (plan.gk || 1) * 0.16 * vol * (1 - 0.8 * dist) * (KIND_LVL[plan.kind] || 1) * Math.pow(10, tr / 20);
    g.connect(lp); lp.connect(this.sfx);
    plan.S.forEach(function (s) { E.vsyl(g, t + s.at, plan.B, s); });
    setTimeoutSafe(function () { try { lp.disconnect(); } catch (e) { /* ignore */ } }, (plan.dur + 1) * 1000, E.offline);
    return plan.dur;
  };
  function setTimeoutSafe(fn, ms, offline) { if (!offline) setTimeout(fn, ms); }

  function renderBarks(opts) {
    opts = opts || {};
    if (!OAC) return Promise.reject(new Error('OfflineAudioContext unavailable'));
    var breeds = opts.breeds || Object.keys(BREEDS), kinds = opts.kinds || BARK_KINDS, gap = opts.gap || 0.45, sr = opts.sampleRate || 24000;
    var items = [], t = 0.2;
    breeds.forEach(function (b) {
      kinds.forEach(function (k) { var pl = barkPlan({ breed: b, pitch: 1, age: opts.age }, k); items.push({ breed: b, kind: k, at: t, dur: pl.dur, plan: pl }); t += pl.dur + gap; });
      t += 0.6;
    });
    var off = new OAC(1, Math.ceil((t + 0.5) * sr), sr), e = new Engine(off, true);
    e.master.gain.value = 0.8; e.sfx.gain.value = 0.8;
    items.forEach(function (it) { e.bark(it.plan, it.at, { volume: 1, distance: opts.distance || 0 }); });
    return off.startRendering().then(function (buf) {
      var d = buf.getChannelData(0), W = Math.round(sr * 0.05), r = analyse(buf);
      r.items = items.map(function (it) {
        var a = Math.floor(it.at * sr), b = Math.min(d.length, Math.ceil((it.at + it.dur + 0.15) * sr)), pk = 0, best = 0;
        for (var i = a; i < b; i++) { var x = Math.abs(d[i]); if (x > pk) pk = x; }
        for (var w = a; w + W <= b; w += (W >> 1)) { var s = 0; for (var j = w; j < w + W; j++) s += d[j] * d[j]; best = Math.max(best, s / W); }
        return { breed: it.breed, kind: it.kind, at: Math.round(it.at * 100) / 100, dur: Math.round(it.dur * 100) / 100, peak: Math.round(pk * 1000) / 1000, loud50msDb: Math.round(10 * Math.log10(Math.max(best, 1e-12)) * 10) / 10 };
      });
      if (opts.wav) r.wav = encodeWav(buf);
      return r;
    });
  }

  /* ---------------- offline render + analysis (coordinator / tests) ---------------- */
  function encodeWav(buf) {
    var ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, bytes = 44 + n * ch * 2;
    var ab = new ArrayBuffer(bytes), dv = new DataView(ab), o = 0;
    function s(str) { for (var i = 0; i < str.length; i++) dv.setUint8(o++, str.charCodeAt(i)); }
    function u32(v) { dv.setUint32(o, v, true); o += 4; }
    function u16(v) { dv.setUint16(o, v, true); o += 2; }
    s('RIFF'); u32(bytes - 8); s('WAVE'); s('fmt '); u32(16); u16(1); u16(ch); u32(sr); u32(sr * ch * 2); u16(ch * 2); u16(16); s('data'); u32(n * ch * 2);
    var data = []; for (var c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    for (var i = 0; i < n; i++) for (c = 0; c < ch; c++) { var x = clamp(data[c][i], -1, 1); dv.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2; }
    var u8 = new Uint8Array(ab), bin = '', CHK = 0x8000;
    for (var k = 0; k < u8.length; k += CHK) bin += String.fromCharCode.apply(null, u8.subarray(k, k + CHK));
    return btoa(bin);
  }
  function analyse(buf) {
    var peak = 0, sum = 0, n = buf.length, ch = buf.numberOfChannels, sr = buf.sampleRate, win = sr, wsum = 0, maxWin = 0, clipped = 0, D = [];
    for (var c0 = 0; c0 < ch; c0++) D.push(buf.getChannelData(c0));
    for (var i = 0; i < n; i++) {
      var fr = 0;
      for (var c = 0; c < ch; c++) { var x = D[c][i], a = Math.abs(x); if (a > peak) peak = a; if (a >= 0.999) clipped++; fr += x * x; }
      fr /= ch; sum += fr; wsum += fr;
      if ((i + 1) % win === 0) { maxWin = Math.max(maxWin, Math.sqrt(wsum / win)); wsum = 0; }
    }
    var rms = Math.sqrt(sum / n);
    function db(v) { return Math.round(20 * Math.log10(Math.max(v, 1e-9)) * 10) / 10; }
    return { peak: Math.round(peak * 1000) / 1000, peakDb: db(peak), rms: Math.round(rms * 10000) / 10000, rmsDb: db(rms), loudest1sRmsDb: db(maxWin), clippedSamples: clipped };
  }
  function render(opts) {
    opts = opts || {};
    if (!OAC) return Promise.reject(new Error('OfflineAudioContext unavailable'));
    var sec = opts.seconds || 20, sr = opts.sampleRate || 44100, off = new OAC(2, Math.ceil(sec * sr), sr);
    var e = new Engine(off, true), vv = opts.vols || {};
    e.master.gain.value = vv.master != null ? vv.master : 0.8;
    e.music.gain.value = vv.music != null ? vv.music : 0.5;
    e.amb.gain.value = vv.ambience != null ? vv.ambience : 0.25;
    var segs = (opts.segments || [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }]).slice().sort(function (a, b) { return a.at - b.at; });
    var stings = (opts.stingers || []).slice().sort(function (a, b) { return a.at - b.at; });
    e.start(0.05, resolve(segs[0].ctx));
    var si = 1, gi = 0, log = [];
    for (var t = 0; t < sec; t += 0.05) {
      while (si < segs.length && segs[si].at <= t) { e.queue(resolve(segs[si].ctx)); si++; }
      while (gi < stings.length && stings[gi].at <= t) {
        var dt = stings[gi].at; e.duckG.gain.setTargetAtTime(0.6, dt, 0.06); e.duckG.gain.setTargetAtTime(1, dt + 1.8, 0.35);
        if (STINGS.indexOf(stings[gi].name) >= 0) e.sting(stings[gi].name, dt + 0.03); else e.stinger(stings[gi].name, dt + 0.03);
        gi++;
      }
      var before = e.applied;
      e.tick(t + 0.12);
      if (e.applied !== before) log.push({ at: Math.round(e.nextTime * 100) / 100, variant: e.v.label, bpm: e.v.bpm });
    }
    return off.startRendering().then(function (buf) {
      var r = analyse(buf);
      r.seconds = sec; r.variants = log; r.steps = e.steps; r.dropped = e.dropped; r.themes = e.themes;
      if (opts.wav) r.wav = encodeWav(buf);
      return r;
    });
  }

  /* ================================================================
     Public API: window.PawAudio
     ================================================================ */
  var PA = { ctx: null, bus: null, contexts: [], stingers: [], stingLog: [], STINGS: STINGS, PLACES: PLACES, TIMES: TIMES, WEATHERS: WEATHERS, AREAS: AREAS };
  var eng = null, vols = { master: 0.8, music: 0.5, sfx: 0.8, ambience: 0.25 }, muted = false;
  var cur = norm({ place: 'title', time: 'day', weather: 'sunny' }), deb = null, timer = null, hidden = false, suspendT = null;

  function loop() {
    timer = setTimeout(loop, 25);
    if (!eng || PA.ctx.state !== 'running' || hidden) return;
    var now = PA.ctx.currentTime;
    if (eng.nextTime < now - 0.25) { eng.nextTime = now + 0.06; eng.resyncs = (eng.resyncs || 0) + 1; }
    eng.tick(now + 0.11);
  }
  function applyVols(instant) {
    if (!eng) return;
    var t = PA.ctx.currentTime, tc = instant ? 0.005 : 0.06;
    ramp(eng.master.gain, vols.master, t, tc);
    ramp(eng.music.gain, vols.music, t, tc);
    ramp(eng.sfx.gain, vols.sfx, t, tc);
    ramp(eng.amb.gain, vols.ambience, t, tc);
    ramp(eng.muteG.gain, muted ? 0 : 1, t, instant ? 0.005 : 0.08);
  }
  function resume() {
    var c = PA.ctx;
    if (c && c.state !== 'running' && c.state !== 'closed' && !hidden) { try { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) { /* ignore */ } }
  }
  function onVis() {
    if (!eng) return;
    var c = PA.ctx, t = c.currentTime;
    if (document.hidden) {
      hidden = true;
      ramp(eng.visG.gain, 0, t, 0.08);
      clearTimeout(suspendT);
      suspendT = setTimeout(function () { if (hidden && c.state === 'running') { try { c.suspend(); } catch (e) { /* ignore */ } } }, 450);
    } else {
      hidden = false; clearTimeout(suspendT);
      var go = function () {
        var n = c.currentTime;
        if (eng.nextTime < n) eng.nextTime = n + 0.06;
        ramp(eng.visG.gain, 1, n, 0.3);
      };
      try { var p = c.resume(); if (p && p.then) p.then(go, go); else go(); } catch (e) { go(); }
    }
  }
  function commit() {
    deb = null;
    if (!eng) return;
    eng.queue(resolve(cur));
  }

  PA.init = function () {
    if (eng) { resume(); return PA; }
    if (!AC) return PA;
    var c;
    try { c = new AC(); } catch (e) { return PA; }
    eng = new Engine(c, false);
    PA.ctx = c;
    PA.bus = { master: eng.master, music: eng.music, sfx: eng.sfx, ambience: eng.amb };
    applyVols(true);
    eng.start(c.currentTime + 0.08, resolve(cur));
    hidden = !!document.hidden;
    document.addEventListener('visibilitychange', onVis);
    var unlock = function () { resume(); if (c.state === 'running') { window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true); } };
    window.addEventListener('pointerdown', unlock, true); window.addEventListener('keydown', unlock, true);
    resume();
    loop();
    return PA;
  };
  PA.setContext = function (o) {
    o = o || {};
    var n = { place: cur.place, area: cur.area, time: cur.time, weather: cur.weather };
    ['place', 'area', 'time', 'weather'].forEach(function (k) { if (k in o && o[k] !== undefined) n[k] = o[k] == null ? null : String(o[k]).toLowerCase(); });
    if ('place' in o && !('area' in o) && n.place !== 'walk') n.area = null;
    cur = norm(n);
    PA.contexts.push({ place: cur.place, area: cur.area, time: cur.time, weather: cur.weather });
    if (PA.contexts.length > 40) PA.contexts.shift();
    if (!eng) return;
    clearTimeout(deb);
    deb = setTimeout(commit, 250);   // coalesce bursts of calls; the change itself lands on the next bar
  };
  PA.setVolumes = function (o) {
    o = o || {};
    ['master', 'music', 'sfx', 'ambience'].forEach(function (k) { var v = Number(o[k]); if (k in o && isFinite(v)) vols[k] = clamp(v, 0, 1); });
    applyVols(false);
  };
  PA.getVolumes = function () { return { master: vols.master, music: vols.music, sfx: vols.sfx, ambience: vols.ambience }; };
  PA.setMuted = function (m) { muted = !!m; applyVols(false); };
  PA.isMuted = function () { return muted; };
  PA.duck = function (amount, ms) {
    if (!eng) return;
    var a = clamp(amount == null ? 0.5 : Number(amount) || 0, 0, 1), d = Math.max(50, ms == null ? 1500 : Number(ms) || 0) / 1000, t = PA.ctx.currentTime;
    ramp(eng.duckG.gain, 1 - a, t, 0.06);
    duckUntil = t + d + 0.8;
    eng.duckG.gain.setTargetAtTime(1, t + d, 0.35);
  };
  // v1.6 dog voices: PawAudio.bark(voice, kind, opts) -> routed through bus.sfx; never throws; max 2 voices at once
  var barkEnds = [], duckUntil = 0, barkCount = 0;
  PA.bark = function (voice, kind, opts) {
    try {
      if (!eng || hidden) return;
      resume();
      var now = PA.ctx.currentTime, t = now + 0.02;
      barkEnds = barkEnds.filter(function (e) { return e > now; });
      if (barkEnds.length >= 2) return;
      var plan = barkPlan(voice || {}, BARK_KINDS.indexOf(kind) >= 0 ? kind : 'woof');
      var dur = eng.bark(plan, t, opts);
      barkEnds.push(t + dur + 0.05); barkCount++;
      if (now >= duckUntil && !muted) {   // ~ -3 dB music dip, unless a bigger duck is running
        ramp(eng.duckG.gain, 0.71, now, 0.03);
        eng.duckG.gain.setTargetAtTime(1, t + dur + 0.1, 0.25);
      }
    } catch (e) { /* never throws */ }
  };
  // v2: sfx-bus stings 'birth' | 'sparkle' | 'playdate'; never throws; ducks the music a little like a bark
  PA.sting = function (name) {
    try {
      name = String(name);
      if (STINGS.indexOf(name) < 0) return;
      PA.stingLog.push(name); if (PA.stingLog.length > 40) PA.stingLog.shift();
      if (!eng || hidden) return;
      resume();
      var now = PA.ctx.currentTime;
      eng.sting(name, now + 0.03);
      if (now >= duckUntil && !muted) {
        var len = name === 'birth' ? 2.6 : name === 'sparkle' ? 1.1 : 0.7;
        ramp(eng.duckG.gain, 0.75, now, 0.04);
        eng.duckG.gain.setTargetAtTime(1, now + len, 0.3);
      }
    } catch (e) { /* never throws */ }
  };
  PA.stinger = function (name) {
    if (STINGERS.indexOf(name) < 0) return;
    PA.stingers.push(name); if (PA.stingers.length > 40) PA.stingers.shift();
    if (!eng || hidden) return;
    resume();
    eng.stinger(name, PA.ctx.currentTime + 0.03);
  };
  // read-only diagnostics for test pages (not part of the contract)
  PA.state = function () {
    if (!eng) return { inited: false, ctx: cur, vols: PA.getVolumes(), muted: muted };
    var L = {}, A = {}, v = eng.v || {};
    LAYERS.forEach(function (n) { L[n] = Math.round(eng.L[n].target * 100) / 100; });
    AMBS.forEach(function (n) { A[n] = eng.ambT[n]; });
    return {
      inited: true, ctxState: PA.ctx.state, time: Math.round(PA.ctx.currentTime * 100) / 100, ctx: cur, variant: v.label, base: v.base, tags: v.tags,
      pending: eng.pending ? eng.pending.label : null, bpm: Math.round(eng.bpm * 10) / 10, bpmTarget: eng.bpmTarget, swing: Math.round(eng.swing * 100) / 100,
      prog: eng.progName, chord: eng.chord.name, bar: eng.bar, step: eng.step, steps: eng.steps, late: eng.late, resyncs: eng.resyncs || 0,
      top: eng.top, themes: eng.themes, patterns: copy(eng.pat), brush: eng.brush, cutoff: v.cut, layers: L, ambience: A,
      barkVoices: barkEnds.filter(function (e) { return e > PA.ctx.currentTime; }).length, barks: barkCount,
      voices: eng.activeVoices(PA.ctx.currentTime), dropped: eng.dropped, vols: PA.getVolumes(), muted: muted, hidden: hidden,
      gains: { master: eng.master.gain.value, mute: eng.muteG.gain.value, duck: eng.duckG.gain.value, vis: eng.visG.gain.value }
    };
  };
  PA.describe = function (c) { var v = resolve(c); return { label: v.label, bpm: v.bpm, prog: v.prog, top: v.top, layers: v.L, ambience: v.amb, sig: v.sig }; };
  PA._render = render;
  PA._renderBarks = renderBarks;
  PA._barkPlan = function (voice, kind) { return barkPlan(voice || {}, BARK_KINDS.indexOf(kind) >= 0 ? kind : 'woof'); };   // test hook: the plan only, no audio
  PA.BARK_KINDS = BARK_KINDS;

  window.PawAudio = PA;
})();
