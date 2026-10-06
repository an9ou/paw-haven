/* Paw Haven v1.3: GARDEN module -> window.PawGarden (v1.7.1: crops grow in real hours, hourly watering)
   Pure growth model (advance / plant / water / harvest) + the garden screen UI.
   Plain IIFE, no imports. CSS injected once (#pawgarden-css), classes prefixed pg-.
   Never touches browser storage or game state: everything goes through the callbacks in V13.md. */
(function () {
  'use strict';

  /* ======================================================================
     DATA (V13.md "Shared data": Crops; v1.7.1: real hours instead of days)
     hours  = grow time in real hours (in season, cloudy, watered)
     regrow = hours to regrow after a harvest (blueberries), picks = harvests per bush before it is spent
     ====================================================================== */
  var CROPS = [
    { id: 'peas', name: 'Peas', seasons: ['spring'], hours: 2, regrow: null, picks: null, yield: 3, seed: 2, sell: 1, hardy: false, seedItem: 'Pea Seeds', item: 'Peas' },
    { id: 'spinach', name: 'Spinach', seasons: ['winter', 'spring'], hours: 2, regrow: null, picks: null, yield: 2, seed: 2, sell: 2, hardy: true, seedItem: 'Spinach Seeds', item: 'Spinach' },
    { id: 'carrot', name: 'Carrot', seasons: ['spring', 'autumn'], hours: 3, regrow: null, picks: null, yield: 2, seed: 2, sell: 2, hardy: false, seedItem: 'Carrot Seeds', item: 'Carrot' },
    { id: 'blueberries', name: 'Blueberries', seasons: ['summer'], hours: 4, regrow: 2, picks: 4, yield: 4, seed: 8, sell: 1, hardy: false, seedItem: 'Blueberry Seeds', item: 'Blueberries' },
    { id: 'sweet-potato', name: 'Sweet Potato', seasons: ['summer', 'autumn'], hours: 4, regrow: null, picks: null, yield: 2, seed: 3, sell: 3, hardy: false, seedItem: 'Sweet Potato Seeds', item: 'Sweet Potato' },
    { id: 'pumpkin', name: 'Pumpkin', seasons: ['autumn'], hours: 6, regrow: null, picks: null, yield: 1, seed: 4, sell: 7, hardy: false, seedItem: 'Pumpkin Seeds', item: 'Pumpkin' }
  ];
  var BY_ID = {};
  CROPS.forEach(function (c) { BY_ID[c.id] = c; });
  var BUDDY = { shiba: 'inspect', corgi: 'guard', golden: 'fetch', dachs: 'dig', husky: 'snow', mutt: 'tend', chihuahua: 'guard', pug: 'tend', greyhound: 'fetch', beagle: 'inspect' };
  // v1.7: breed-flavoured opening lines (other breeds use the perk line)
  var BREED_LINE = { chihuahua: '{n} is the security system. Captain Fluff has been warned. Loudly.', pug: '{n} lies next to the thirsty plants and snorts until someone waters them.', greyhound: '{n} fetched the basket at 45 mph. Then lay down in it.', beagle: '{n} has sniffed every leaf. Twice. Quality is guaranteed.' };
  // quality points (0-3) -> [1 star, 2 stars, 3 stars] odds
  var STAR_ODDS = [[0.70, 0.25, 0.05], [0.55, 0.35, 0.10], [0.40, 0.40, 0.20], [0.25, 0.45, 0.30]];
  var SELL_MULT = [1, 1.5, 2];
  var WEATHERS = { sunny: 1, cloudy: 1, rain: 1, snow: 1 };
  var PLURAL = { carrot: 'carrots', peas: 'peas', spinach: 'spinach', blueberries: 'blueberries', 'sweet-potato': 'sweet potatoes', pumpkin: 'pumpkin' };
  var ONE = { carrot: 'carrot', peas: 'pea pod', spinach: 'spinach leaf', blueberries: 'blueberry', 'sweet-potato': 'sweet potato', pumpkin: 'pumpkin' };
  var IS_ONE = { spinach: 1, pumpkin: 1 };
  var EPS = 1e-9;
  // v1.7.1 hourly clock (V171.md Part A)
  var SQUIRREL_HOURS = 3;                       // a ready crop left this long loses 1 item
  var DRAIN = { sunny: 1, cloudy: 0.5, night: 1 / 3 }; // drops per hour (snow 0, rain refills)
  var MAX_HOURS = 720;                          // never process more than 30 days in one advance

  /* ======================================================================
     PURE HELPERS
     ====================================================================== */
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function hash(str) { var h = 2166136261 >>> 0; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function mulberry(seed) { var a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function seasonOf(month) { month = +month; return (month === 12 || month === 1 || month === 2) ? 'winter' : month <= 5 ? 'spring' : month <= 8 ? 'summer' : 'autumn'; }
  function inSeason(cropId, month) { var c = BY_ID[cropId]; return !!c && c.seasons.indexOf(seasonOf(month)) >= 0; }
  function sellPrice(cropId, stars) { var c = BY_ID[cropId]; if (!c) return 0; var s = Math.max(1, Math.min(3, stars | 0 || 1)); return Math.round(c.sell * SELL_MULT[s - 1]); }
  // the game's night (timePhase): 19:00-05:00
  function isNightHour(h) { return h >= 19 || h < 5; }

  function toDate(date) { var d = date instanceof Date ? date : new Date(date == null ? Date.now() : date); return isNaN(d.getTime()) ? new Date() : d; }
  // weather period key (8 h, the game's weatherPeriodKey format)
  function periodKey(date) { var d = toDate(date); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + '-' + Math.floor(d.getHours() / 8); }
  // v1.7.1 hour key 'YYYY-M-D-hH' (the 'h' keeps it apart from old period keys)
  function hourKey(date) { var d = toDate(date); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + '-h' + d.getHours(); }
  function parseKey(k) {
    if (typeof k !== 'string') return null;
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})-([0-2])$/.exec(k);
    if (!m) return null;
    return { y: +m[1], m: +m[2], d: +m[3], p: +m[4] };
  }
  function parseHour(k) {
    if (typeof k !== 'string') return null;
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})-h(\d{1,2})$/.exec(k);
    if (!m || +m[4] > 23) return null;
    return { y: +m[1], m: +m[2], d: +m[3], h: +m[4] };
  }
  function keyIdx(k) { var q = parseKey(k); if (!q) return null; return Math.round(Date.UTC(q.y, q.m - 1, q.d) / 864e5) * 3 + q.p; }
  function hourIdx(k) { var q = parseHour(k); if (!q) return null; return Math.round(Date.UTC(q.y, q.m - 1, q.d) / 864e5) * 24 + q.h; }
  function idxHour(i) { var day = Math.floor(i / 24), h = i - day * 24, d = new Date(day * 864e5); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate() + '-h' + h; }
  function hourToPeriod(k) { var q = parseHour(k); return q ? q.y + '-' + q.m + '-' + q.d + '-' + Math.floor(q.h / 8) : null; }
  // an old (v1) period key -> the hour index of the LAST hour of that period (the old model already counted the whole period)
  function periodEndHourIdx(k) { var i = keyIdx(k); return i == null ? null : Math.floor(i / 3) * 24 + (i % 3) * 8 + 7; }
  function anyIdx(k) { var h = hourIdx(k); return h != null ? h : null; }

  function emptyPlot() { return { crop: null, g: 0, water: 0, wd: 0, dry: 0, inSeason: true, inspected: false, ready: null, took: 0, planted: null, harvested: 0 }; }
  function newState(now) { return { v: 2, plots: [0, 1, 2, 3, 4, 5].map(emptyPlot), last: hourKey(now == null ? Date.now() : now), harvests: {} }; }

  // v1 (8-hour periods, days) -> v2 (hours). g is already the grown FRACTION, so a crop keeps its
  // progress and the rest of it takes (1 - g) x the new grow time: the proportional conversion.
  // The squirrel timer converts the same way (1 old period of its 3-period wait = 1 hour of the new 3-hour wait).
  function migrate(s) {
    if (!s || typeof s !== 'object' || s.v === 2) return s;
    var lastP = keyIdx(s.last), lastH = lastP != null ? periodEndHourIdx(s.last) : null;
    var nowH = hourIdx(hourKey(Date.now()));
    if (lastH == null) lastH = nowH;
    if (Array.isArray(s.plots)) s.plots.forEach(function (p) {
      if (!p || typeof p !== 'object') return;
      if (p.ready) {
        var ri = keyIdx(p.ready);
        if (ri != null && lastP != null) p.ready = idxHour(lastH - Math.max(0, Math.min(SQUIRREL_HOURS, lastP - ri)));
        else if (hourIdx(p.ready) == null) p.ready = idxHour(lastH);
      }
      var c = BY_ID[p.crop];
      if (c && c.regrow && c.picks && (p.harvested | 0) >= c.picks) p.harvested = c.picks - 1; // an old bush gets one more pick
      p.wd = 0;
    });
    s.last = idxHour(lastH);
    s.v = 2;
    s.migratedFrom = 1;
    return s;
  }

  // normalise a (cloned) state in place: always 6 complete plots, never drops unknown fields
  function norm(s) {
    if (!s || typeof s !== 'object') s = newState();
    if (s.v !== 2) migrate(s);
    if (!Array.isArray(s.plots)) s.plots = [];
    for (var i = 0; i < 6; i++) {
      var p = s.plots[i]; if (!p || typeof p !== 'object') p = s.plots[i] = emptyPlot();
      var e = emptyPlot();
      for (var k in e) if (p[k] === undefined) p[k] = e[k];
      p.g = Math.max(0, Math.min(1, +p.g || 0)); p.water = Math.max(0, Math.min(3, Math.floor(+p.water || 0))); p.wd = Math.max(0, Math.min(1, +p.wd || 0)); p.dry = Math.max(0, p.dry | 0); p.took = Math.max(0, p.took | 0);
    }
    if (typeof s.last !== 'string' || !parseHour(s.last)) s.last = hourKey(Date.now());
    if (!s.harvests || typeof s.harvests !== 'object') s.harvests = {};
    s.v = 2;
    return s;
  }
  function growing(p) { return !!(p && p.crop && BY_ID[p.crop] && p.g < 1); }
  function isReady(p) { return !!(p && p.crop && BY_ID[p.crop] && p.g >= 1); }
  function stage(p) { if (!p || !p.crop) return 0; var g = +p.g || 0; return g >= 1 ? 3 : g >= 0.4 ? 2 : g > 0 ? 1 : 0; }
  function safeWeather(fn, key) { var w; try { w = typeof fn === 'function' ? fn(key) : 'cloudy'; } catch (e) { w = 'cloudy'; } return WEATHERS[w] ? w : 'cloudy'; }
  // growth multiplier for one hour: sunny (in daylight) x1.5, snow pauses (hardy crops and the snow pup: half)
  function growFactor(c, w, night, buddy) {
    if (w === 'snow') return (c.hardy || buddy === 'snow') ? 0.5 : 0;
    if (w === 'sunny' && !night) return 1.5;
    return 1;
  }
  // drops a growing crop drinks in one hour: sunny 1 (1 drop / h), cloudy 0.5 (1 drop / 2 h), night 1/3 (1 drop / 3 h)
  function drainRate(w, night) { if (w === 'rain' || w === 'snow') return 0; if (night) return DRAIN.night; return w === 'sunny' ? DRAIN.sunny : DRAIN.cloudy; }
  function seasonMult(c, month) { return c.seasons.indexOf(seasonOf(month)) >= 0 ? 1 : 0.5; }
  // hours of growing left (watered, cloudy, at the given month), and hours the water lasts
  function hoursLeft(p, month) { var c = p && BY_ID[p.crop]; if (!c || p.g >= 1) return 0; return Math.max(0, 1 - p.g) * c.hours / seasonMult(c, month); }
  function waterHours(p, w, night) { var r = drainRate(w, night); if (!p || r <= 0) return Infinity; return Math.max(0, p.water - (p.wd || 0)) / r; }

  // one real hour (V171.md Part A)
  function stepHour(s, key, w, night, buddy, events) {
    var q = parseHour(key), ki = hourIdx(key);
    // 1. rain fills every plot
    if (w === 'rain') s.plots.forEach(function (p) { p.water = 3; p.wd = 0; });
    // 2. growing plots: a plot with at least 1 drop grows this hour, then drinks; a dry plot pauses (nothing dies)
    s.plots.forEach(function (p, i) {
      if (!growing(p)) return;
      var c = BY_ID[p.crop];
      if (p.water >= 1) {
        p.g += seasonMult(c, q.m) * growFactor(c, w, night, buddy) / c.hours;
        p.wd += drainRate(w, night);
        while (p.wd >= 1 - EPS && p.water > 0) { p.water -= 1; p.wd = Math.max(0, p.wd - 1); }
        if (p.water <= 0) { p.water = 0; p.wd = 0; }
      } else {
        p.dry += 1;
      }
      if (buddy === 'inspect') p.inspected = true;
      if (p.g >= 1 - EPS) { p.g = 1; p.ready = key; events.push({ type: 'ready', plot: i, crop: p.crop }); }
    });
    // 3. ready plots: Captain Fluff visits a crop left 3 hours or more, and takes 1
    s.plots.forEach(function (p, i) {
      if (!isReady(p)) return;
      var ri = hourIdx(p.ready); if (ri == null) { p.ready = key; ri = ki; }
      if (ki - ri >= SQUIRREL_HOURS && buddy !== 'guard' && !p.took) { p.took = 1; events.push({ type: 'squirrel', plot: i, crop: p.crop }); }
    });
    // 4. Pepper ("never fully dries"): the first plot that hits water 0 each calendar day gets a drink
    if (buddy === 'tend') {
      var day = q.y + '-' + q.m + '-' + q.d;
      if (s.tend !== day) {
        for (var j = 0; j < 6; j++) {
          var pp = s.plots[j];
          if (growing(pp) && pp.water === 0) { pp.water = 1; pp.wd = 0; s.tend = day; events.push({ type: 'tend', plot: j, crop: pp.crop }); break; }
        }
      }
    }
  }

  // ctx: { now, weatherAt(periodKey), buddy, maxHours (or legacy maxPeriods x 8), steps (DEV: hours), stepWeather, stepTime }
  function advance(state, ctx) {
    ctx = ctx || {};
    var s = norm(clone(state)), events = [], buddy = ctx.buddy || null;
    var max = ctx.maxHours > 0 ? Math.floor(ctx.maxHours) : ctx.maxPeriods > 0 ? Math.floor(ctx.maxPeriods) * 8 : MAX_HOURS;
    var keys = [];
    var steps = ctx.steps > 0 ? Math.floor(ctx.steps) : 0;
    if (steps > 0) {
      var li0 = hourIdx(s.last);
      for (var j = 1; j <= Math.min(steps, max); j++) keys.push(idxHour(li0 + j));
    } else {
      var cur = hourKey(ctx.now == null ? Date.now() : ctx.now), ci = hourIdx(cur), li = hourIdx(s.last);
      if (ci == null || li == null || ci <= li) return { state: s, events: events }; // clock went back: do nothing
      for (var i = Math.max(li + 1, ci - max + 1); i <= ci; i++) keys.push(idxHour(i));
    }
    var sw = WEATHERS[ctx.stepWeather] ? ctx.stepWeather : 'cloudy';
    keys.forEach(function (k) {
      var h = parseHour(k).h, night = isNightHour(h), w;
      if (steps > 0) { w = sw; if (ctx.stepTime) night = ctx.stepTime === 'night'; }
      else w = safeWeather(ctx.weatherAt, hourToPeriod(k));
      stepHour(s, k, w, night, buddy, events);
    });
    if (keys.length) s.last = keys[keys.length - 1];
    return { state: s, events: events };
  }

  function plant(state, plotIndex, cropId, ctx) {
    ctx = ctx || {};
    var s = norm(clone(state)), i = plotIndex | 0, c = BY_ID[cropId], p = s.plots[i];
    if (!c || plotIndex !== i || i < 0 || i > 5 || !p || p.crop) return { state: s, ok: false, bonusSeed: false };
    var month = ctx.month >= 1 && ctx.month <= 12 ? ctx.month | 0 : (new Date(ctx.now == null ? Date.now() : ctx.now).getMonth() + 1);
    var key = ctx.now != null ? hourKey(ctx.now) : s.last;
    var np = emptyPlot();
    np.crop = c.id; np.water = p.water; np.wd = p.wd || 0; // soil keeps whatever water it already had
    np.inSeason = c.seasons.indexOf(seasonOf(month)) >= 0; np.planted = key;
    np.inspected = ctx.buddy === 'inspect';
    s.plots[i] = np;
    var bonus = false;
    if (ctx.buddy === 'dig') { var r = typeof ctx.rng === 'function' ? ctx.rng : mulberry(hash('bonus|' + i + '|' + key + '|0')); bonus = r() < 0.1; }
    return { state: s, ok: true, bonusSeed: bonus };
  }

  function water(state, plotIndex) {
    var s = norm(clone(state)), p = s.plots[plotIndex | 0];
    if (p && plotIndex >= 0 && plotIndex <= 5) { p.water = 3; p.wd = 0; }
    return s;
  }

  function qualityPoints(p) { return (p.dry === 0 ? 1 : 0) + (p.inSeason ? 1 : 0) + (p.inspected ? 1 : 0); }
  function rollStars(qp, r) { var o = STAR_ODDS[Math.max(0, Math.min(3, qp))], x = r(); return x < o[0] ? 1 : x < o[0] + o[1] ? 2 : 3; }

  function harvest(state, plotIndex, ctx) {
    ctx = ctx || {};
    var s = norm(clone(state)), i = plotIndex | 0, p = s.plots[i];
    if (!p || plotIndex < 0 || plotIndex > 5 || !isReady(p)) return { state: s, items: [], took: 0, spent: false };
    var c = BY_ID[p.crop], took = p.took | 0, n = Math.max(1, c.yield - took), qp = qualityPoints(p);
    var r = typeof ctx.rng === 'function' ? ctx.rng : mulberry(hash('stars|' + i + '|' + p.planted + '|' + (p.harvested | 0)));
    var items = [], spent = false;
    for (var k = 0; k < n; k++) items.push({ crop: c.id, stars: rollStars(qp, r) });
    s.harvests[c.id] = (s.harvests[c.id] | 0) + 1;
    var picked = (p.harvested | 0) + 1;
    if (c.regrow && !(c.picks && picked >= c.picks)) {
      p.g = 1 - c.regrow / c.hours; p.ready = null; p.took = 0; p.dry = 0; p.harvested = picked;
    } else {
      spent = !!c.regrow;
      var w = p.water, wd = p.wd; s.plots[i] = emptyPlot(); s.plots[i].water = w; s.plots[i].wd = wd || 0;
    }
    return { state: s, items: items, took: took, spent: spent };
  }

  /* ======================================================================
     UI: CSS
     ====================================================================== */
  var INK = '#5B3D32';
  var RAIN_TILE = 'url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="160"><g stroke="#7E9CC4" stroke-width="1.6" stroke-linecap="round" opacity=".7"><path d="M10 6l-5 24"/><path d="M38 40l-5 24"/><path d="M24 92l-5 24"/><path d="M52 118l-5 24"/><path d="M6 128l-4 18"/></g></svg>') + '")';
  var SNOW_TILE = 'url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><g fill="#fff" stroke="#A8968A" stroke-width=".8"><circle cx="12" cy="14" r="3"/><circle cx="52" cy="40" r="2.4"/><circle cx="30" cy="76" r="3.2"/><circle cx="68" cy="98" r="2.6"/></g></svg>') + '")';
  var PANEL = 'background:#FFFBF3;border:2.5px solid ' + INK + ';border-radius:14px 10px 16px 9px/10px 15px 9px 14px;box-shadow:2px 3px 0 rgba(91,61,50,.16)';
  var CSS = [
    '.pg-root{position:absolute;inset:0;overflow:hidden;background:radial-gradient(#E3D2BA 1.1px,transparent 1.6px) 0 0/22px 22px,#FFFBF3;user-select:none;-webkit-user-select:none;font-family:"Patrick Hand","Trebuchet MS",sans-serif;color:' + INK + ';outline:none}',
    '.pg-stage{position:absolute;left:0;top:0;width:1240px;height:620px;transform-origin:0 0;overflow:hidden;border-radius:6px}',
    '.pg-scene,.pg-fx,.pg-anim,.pg-ui{position:absolute;left:0;top:0;width:1240px;height:620px}',
    '.pg-scene>svg{display:block;width:1240px;height:620px}',
    '.pg-fx,.pg-anim{pointer-events:none}.pg-ui{pointer-events:none}.pg-ui>*{pointer-events:auto}',
    '.pg-rain,.pg-snow{position:absolute;inset:0;pointer-events:none}',
    '.pg-rain{background-image:' + RAIN_TILE + ';animation:pg-rain .55s linear infinite;opacity:.85}',
    '.pg-snow{background-image:' + SNOW_TILE + ';animation:pg-snow 5s linear infinite}',
    '@keyframes pg-rain{from{background-position:0 0}to{background-position:-34px 160px}}',
    '@keyframes pg-snow{from{background-position:0 0}to{background-position:-20px 120px}}',
    /* plots */
    '.pg-plot{position:absolute;cursor:pointer;outline:none;border-radius:12px}',
    '.pg-plot::after{content:"";position:absolute;inset:-3px;border:2.5px dashed transparent;border-radius:14px 10px 15px 9px;pointer-events:none;transition:border-color .12s}',
    '.pg-plot:hover::after{border-color:rgba(91,61,50,.45)}',
    '.pg-plot.pg-sel::after{border-color:#F28FA5;border-width:3px;animation:pg-march 1.2s linear infinite}',
    '@keyframes pg-march{50%{border-color:#E46F8E}}',
    '.pg-plot:focus-visible::after{border-color:#F28FA5}',
    '.pg-art{position:absolute;left:0;top:-12px;width:100%;height:149px;pointer-events:none}',
    '.pg-soil,.pg-crop{position:absolute;left:0;width:100%;height:149px}.pg-soil{top:0}.pg-crop{top:-27px;transform-origin:50% 90%}',
    '.pg-soil>svg,.pg-crop>svg,.pg-iou>svg,.pg-sq>svg,.pg-ico>svg,.pg-tool i>svg,.pg-pk i>svg,.pg-head>svg,.pg-dog>svg,.pg-can>svg,.pg-fly>svg,.pg-drop>svg,.pg-chip i>svg{display:block;width:100%;height:100%;overflow:visible}',
    '.pg-crop.pg-grow{animation:pg-grow .45s ease-out}',
    '@keyframes pg-grow{0%{transform:scale(.6,.4)}60%{transform:scale(1.08,1.12)}100%{transform:none}}',
    '.pg-crop.pg-pluck{animation:pg-pluck .55s ease-in forwards}',
    '@keyframes pg-pluck{0%{transform:none}30%{transform:translateY(6px) scale(1.06,.9)}100%{transform:translateY(-70px) scale(.8);opacity:0}}',
    '.pg-num{position:absolute;left:6px;top:4px;width:24px;height:24px;line-height:21px;text-align:center;font-family:"Caveat",cursive;font-weight:700;font-size:20px;background:#FFFBF3;border:2px solid ' + INK + ';border-radius:50% 45% 52% 48%;opacity:.85}',
    '.pg-sel .pg-num{background:#F9D0D9;opacity:1}',
    '.pg-drops{position:absolute;left:50%;bottom:-23px;transform:translateX(-50%);display:flex;gap:3px;pointer-events:none;padding:1px 6px;background:rgba(255,251,243,.82);border-radius:10px}',
    '.pg-drop{width:17px;height:19px}',
    '.pg-iou{position:absolute;right:-6px;bottom:6px;width:66px;height:44px;transform:rotate(6deg);pointer-events:none;animation:pg-pop .35s ease-out}',
    '.pg-tag{position:absolute;left:50%;top:-30px;transform:translateX(-50%) rotate(-2deg);font-family:"Caveat",cursive;font-weight:700;font-size:20px;line-height:1;white-space:nowrap;padding:1px 9px 3px;' + PANEL + ';pointer-events:none}',
    '.pg-tag.pg-ready{background:#FFE3A1}.pg-tag.pg-thirsty{background:#CBE0F4}',
    '.pg-hole{position:absolute;left:50%;top:56%;width:54px;height:20px;margin-left:-27px;border-radius:50%;background:#6E4C38;border:2px solid ' + INK + ';box-shadow:inset 0 4px 0 rgba(0,0,0,.25);pointer-events:none;animation:pg-pop .3s ease-out}',
    '.pg-spark{position:absolute;font-size:20px;color:#F2C744;-webkit-text-stroke:1px ' + INK + ';pointer-events:none;animation:pg-twinkle 1.6s ease-in-out infinite}',
    '@keyframes pg-twinkle{0%,100%{transform:scale(.5) rotate(0);opacity:.2}50%{transform:scale(1.15) rotate(25deg);opacity:1}}',
    '@keyframes pg-pop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.12)}100%{opacity:1}}',
    /* dog */
    '.pg-dogw{position:absolute;left:38px;top:436px;width:220px;height:183px;cursor:pointer}',
    '.pg-dog{position:absolute;inset:0}',
    '.pg-bubble{position:absolute;left:28px;bottom:196px;max-width:330px;width:max-content;padding:5px 14px 7px;' + PANEL.replace('border-radius:14px 10px 16px 9px/10px 15px 9px 14px', 'border-radius:18px 14px 20px 12px/14px 20px 12px 18px') + ';font-family:"Caveat",cursive;font-weight:700;font-size:25px;line-height:1.05;opacity:0;transform:translateY(6px);transition:opacity .18s,transform .18s;pointer-events:none;z-index:3}',
    '.pg-bubble.pg-show{opacity:1;transform:none}',
    '.pg-bubble::after{content:"";position:absolute;left:34px;bottom:-9px;width:14px;height:14px;background:#FFFBF3;border-right:2.5px solid ' + INK + ';border-bottom:2.5px solid ' + INK + ';transform:rotate(40deg) skewX(12deg)}',
    /* header */
    '.pg-hud{position:absolute;left:14px;right:14px;top:10px;height:64px;display:flex;align-items:center;gap:12px;padding:0 10px 0 10px;' + PANEL + ';border-radius:16px 11px 18px 10px/11px 17px 10px 15px}',
    '.pg-hud::before{content:"";position:absolute;left:52px;top:-10px;width:92px;height:20px;background:repeating-linear-gradient(45deg,rgba(140,192,154,.55) 0 6px,rgba(200,233,207,.8) 6px 12px);transform:rotate(-4deg);pointer-events:none}',
    '.pg-ico{width:50px;height:50px;flex:none;transform:rotate(-6deg)}',
    '.pg-titles{flex:1;min-width:0;line-height:1}',
    '.pg-title{font-family:"Caveat",cursive;font-weight:700;font-size:33px;white-space:nowrap}',
    '.pg-hint{font-size:18px;color:#8A7468;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pg-tool,.pg-btn{font-family:"Caveat",cursive;font-weight:700;color:' + INK + ';border:2.5px solid ' + INK + ';border-radius:14px 9px 15px 8px/9px 14px 8px 13px;cursor:pointer;box-shadow:2px 3px 0 rgba(91,61,50,.25);white-space:nowrap;line-height:1.1;transition:transform .1s}',
    '.pg-tool{display:flex;align-items:center;gap:6px;height:48px;padding:0 13px 2px 7px;font-size:25px;background:#FFF4DF}',
    '.pg-tool i{display:block;width:36px;height:36px;flex:none}',
    '.pg-tool small{font-family:"Patrick Hand",sans-serif;font-size:15px;color:#8A7468;margin-left:2px}',
    '.pg-tool[data-t="seeds"]{background:#FFE9B8}.pg-tool[data-t="water"]{background:#D7E7F8}.pg-tool[data-t="basket"]{background:#D4EED9}',
    '.pg-tool.pg-on{outline:3px dashed #F28FA5;outline-offset:3px;transform:rotate(-2deg) translateY(-1px)}',
    '.pg-tool:hover,.pg-btn:hover{transform:translateY(-1px) rotate(-1.5deg)}.pg-tool:active,.pg-btn:active{transform:translateY(1px);box-shadow:1px 1px 0 rgba(91,61,50,.25)}',
    '.pg-tool:focus-visible,.pg-btn:focus-visible,.pg-pk:focus-visible{outline:2.5px dashed #F28FA5;outline-offset:3px}',
    '.pg-btn{font-size:25px;padding:0 16px 3px;background:#C8E9CF}',
    '.pg-btn.pg-pink{background:#F9D0D9}.pg-btn.pg-yel{background:#FFE3A1}.pg-btn.pg-blue{background:#D7E7F8}.pg-btn.pg-sm{font-size:21px;padding:0 10px 2px}',
    '.pg-btn[disabled]{opacity:.45;cursor:default;transform:none}',
    /* chips (left column) */
    '.pg-chips{position:absolute;left:14px;top:86px;display:flex;flex-direction:column;align-items:flex-start;gap:7px;pointer-events:none}',
    '.pg-chip{display:flex;align-items:center;gap:6px;padding:2px 11px 3px 5px;font-size:17px;line-height:1.1;' + PANEL + ';max-width:330px}',
    '.pg-chip i{display:block;width:30px;height:30px;flex:none}',
    '.pg-chip b{font-family:"Caveat",cursive;font-size:22px;font-weight:700;margin-right:3px}',
    '.pg-chip.pg-buddy{background:#FDF0F3}',
    '.pg-head{width:38px;height:38px;flex:none;margin:-2px 0}',
    /* info card */
    '.pg-info{position:absolute;right:14px;top:86px;width:214px;padding:8px 12px 10px;' + PANEL + ';transform:rotate(.8deg);font-size:16.5px;line-height:1.2}',
    '.pg-info::before{content:"";position:absolute;left:70px;top:-10px;width:70px;height:18px;background:repeating-linear-gradient(45deg,rgba(242,143,165,.5) 0 6px,rgba(249,208,217,.75) 6px 12px);transform:rotate(3deg)}',
    '.pg-info h3{margin:0;font-family:"Caveat",cursive;font-weight:700;font-size:26px;line-height:1}',
    '.pg-info .pg-sub{color:#8A7468;margin:1px 0 4px}',
    '.pg-bar{height:13px;border:2px solid ' + INK + ';border-radius:8px 6px 9px 5px;overflow:hidden;background:#FFF4DF;margin:3px 0 5px}',
    '.pg-bar i{display:block;height:100%;background:repeating-linear-gradient(-62deg,#8CC09A 0 2.4px,#C8E9CF 2.4px 4.8px)}',
    '.pg-q{display:flex;flex-wrap:wrap;gap:2px 8px;font-size:15px;color:#8A7468;margin-top:3px}',
    '.pg-q span.pg-ok{color:' + INK + '}',
    '.pg-acts{display:flex;gap:6px;margin-top:7px;flex-wrap:wrap}',
    /* seed pouch */
    '.pg-pouch{position:absolute;left:300px;top:84px;width:640px;padding:10px 14px 12px;' + PANEL + ';transform:rotate(-.5deg);animation:pg-drop .22s ease-out;z-index:5}',
    '.pg-pouch::before{content:"";position:absolute;left:46%;top:-11px;width:96px;height:20px;background:repeating-linear-gradient(45deg,rgba(242,199,68,.5) 0 6px,rgba(255,227,161,.8) 6px 12px);transform:rotate(-3deg)}',
    '@keyframes pg-drop{from{opacity:0;transform:translateY(-12px) rotate(-.5deg)}}',
    '.pg-pouch h3{margin:0 0 6px;font-family:"Caveat",cursive;font-weight:700;font-size:28px;line-height:1;display:flex;justify-content:space-between;align-items:center}',
    '.pg-pks{display:flex;flex-wrap:wrap;gap:10px}',
    '.pg-pk{position:relative;width:96px;padding:4px 4px 6px;text-align:center;background:#FFF4DF;border:2px solid ' + INK + ';border-radius:10px 7px 11px 6px;cursor:pointer;font-size:15px;line-height:1.05;box-shadow:2px 2px 0 rgba(91,61,50,.18)}',
    '.pg-pk:hover{transform:translateY(-2px) rotate(-1.5deg)}',
    '.pg-pk.pg-off{background:#F2ECE4}',
    '.pg-pk i{display:block;width:62px;height:62px;margin:0 auto}',
    '.pg-pk b{display:block;font-family:"Caveat",cursive;font-size:20px}',
    '.pg-pk em{position:absolute;right:-8px;top:-9px;font-style:normal;font-family:"Caveat",cursive;font-weight:700;font-size:19px;background:#FFFBF3;border:2px solid ' + INK + ';border-radius:50%;width:30px;height:30px;line-height:26px}',
    '.pg-stamp{position:absolute;left:-6px;top:6px;font-family:"Caveat",cursive;font-weight:700;font-size:15px;color:#C2577A;border:2px solid #C2577A;border-radius:6px;padding:0 4px;background:rgba(255,251,243,.9);transform:rotate(-14deg)}',
    '.pg-empty{font-size:19px;padding:6px 2px}',
    /* modal card */
    '.pg-veil{position:absolute;inset:0;background:rgba(91,61,50,.18);z-index:8}',
    '.pg-card{position:absolute;left:50%;top:46%;min-width:380px;max-width:520px;padding:18px 28px 18px;text-align:center;' + PANEL + ';border-width:3px;box-shadow:6px 7px 0 rgba(91,61,50,.2);transform:translate(-50%,-50%) rotate(-1deg);animation:pg-cardin .3s ease-out}',
    '.pg-card::before{content:"";position:absolute;left:50%;top:-12px;width:110px;height:24px;margin-left:-55px;background:repeating-linear-gradient(45deg,rgba(134,179,234,.5) 0 6px,rgba(203,224,244,.75) 6px 12px);transform:rotate(3deg)}',
    '@keyframes pg-cardin{from{opacity:0;transform:translate(-50%,-42%) scale(.9) rotate(-3deg)}}',
    '.pg-card h3{margin:0 0 6px;font-family:"Caveat",cursive;font-weight:700;font-size:36px;line-height:1}',
    '.pg-card p{margin:0 0 14px;font-size:20px}',
    '.pg-card .pg-row{display:flex;gap:12px;justify-content:center}',
    /* animation pieces */
    '.pg-sq{position:absolute;left:0;top:0;width:120px;height:120px;will-change:transform}',
    '.pg-can{position:absolute;width:96px;height:96px;transform-origin:70% 70%;animation:pg-pour 1s ease-in-out forwards}',
    '@keyframes pg-pour{0%{opacity:0;transform:translate(30px,-20px) rotate(0)}18%{opacity:1;transform:none}40%,75%{transform:rotate(-32deg)}100%{opacity:0;transform:translate(20px,-24px) rotate(0)}}',
    '.pg-wd{position:absolute;width:6px;height:11px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#86B3EA;border:1.5px solid ' + INK + ';opacity:0;animation:pg-wd .6s ease-in forwards}',
    '@keyframes pg-wd{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(46px)}}',
    '.pg-fly{position:absolute;width:52px;height:52px;will-change:transform}',
    '.pg-float{position:absolute;font-family:"Caveat",cursive;font-weight:700;font-size:30px;color:#F2C744;-webkit-text-stroke:1.2px ' + INK + ';white-space:nowrap;animation:pg-rise 1.5s ease-out forwards;pointer-events:none}',
    '.pg-float.pg-pinkt{color:#F28FA5}.pg-float.pg-bluet{color:#86B3EA}',
    '@keyframes pg-rise{0%{opacity:0;transform:translate(-50%,0) scale(.6)}15%{opacity:1;transform:translate(-50%,-10px) scale(1.1)}100%{opacity:0;transform:translate(-50%,-70px)}}',
    '.pg-dirt{position:absolute;width:9px;height:9px;border-radius:50%;background:#8A6248;border:1.5px solid ' + INK + ';animation:pg-dirt .6s ease-out forwards}',
    '@keyframes pg-dirt{0%{opacity:1;transform:none}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}',
    '@media (prefers-reduced-motion: reduce){.pg-rain,.pg-snow,.pg-spark,.pg-plot.pg-sel::after{animation:none}}',
    'html[data-motion="off"] .pg-rain,html[data-motion="off"] .pg-snow,html[data-motion="off"] .pg-spark{animation:none}',
    /* v1.5B portrait (phones): layout only */
    '.pg-sghost{position:fixed;z-index:99;width:64px;height:64px;pointer-events:none;transform:translate(-50%,-60%) rotate(-8deg)}.pg-sghost svg{width:100%;height:100%}',
    '.pg-pk{touch-action:none}',
    '.pg-portrait{overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch}',
    '.pg-portrait .pg-stage,.pg-portrait .pg-scene,.pg-portrait .pg-fx,.pg-portrait .pg-anim,.pg-portrait .pg-ui{width:420px;height:1000px}',
    '.pg-portrait .pg-scene>svg{width:420px;height:1000px}',
    '.pg-portrait .pg-plots::before{content:"";position:absolute;left:8px;top:168px;width:404px;height:380px;background:rgba(150,108,76,.93);border:3px solid ' + INK + ';border-radius:18px 12px 20px 14px}',
    '.pg-portrait .pg-art,.pg-portrait .pg-soil,.pg-portrait .pg-crop{height:112px}',
    '.pg-portrait .pg-hud{left:6px;right:6px;top:calc(8px + var(--pg-sy,0px));z-index:7;height:auto;flex-wrap:wrap;gap:6px 4px;padding:6px 6px 8px}',
    '.pg-portrait .pg-ico{width:40px;height:40px}',
    '.pg-portrait .pg-titles{flex:1 1 300px}',
    '.pg-portrait .pg-title{font-size:28px}',
    '.pg-portrait .pg-hint{font-size:15px}',
    '.pg-portrait .pg-tool{height:52px;font-size:18px;padding:0 5px 2px 3px;gap:1px;box-shadow:1px 2px 0 rgba(91,61,50,.25)}',
    '.pg-portrait .pg-tool small{font-size:15px;margin-left:0}',
    '.pg-portrait .pg-done{font-size:19px;padding:0 7px 3px;min-height:52px}',
    '.pg-portrait .pg-tool i{width:24px;height:24px}',
    '.pg-portrait .pg-btn{min-height:50px}',
    '.pg-portrait .pg-chips{left:8px;right:8px;top:702px;flex-direction:row;flex-wrap:wrap;gap:5px}',
    '.pg-portrait .pg-chip{font-size:17px;max-width:404px}',
    '.pg-portrait .pg-info{left:8px;right:8px;top:558px;width:auto}',
    '.pg-portrait .pg-dogw{left:4px;top:834px;width:166px;height:138px}',
    '.pg-portrait .pg-bubble{left:6px;bottom:100px;max-width:300px}',
    '.pg-portrait .pg-pouch{left:8px;right:8px;top:calc(184px + var(--pg-sy,0px));width:auto;max-height:calc(var(--pg-vh,700px) - 196px);overflow-y:auto}',
    '.pg-portrait .pg-pk{width:118px;font-size:17px}',
    '.pg-portrait .pg-card{min-width:0;width:380px;top:calc(var(--pg-vh,700px) / 2 + var(--pg-sy,0px))}'
  ].join('\n');
  function injectCSS() {
    if (typeof document === 'undefined' || document.getElementById('pawgarden-css')) return;
    var s = document.createElement('style'); s.id = 'pawgarden-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ======================================================================
     ART: PawArt with doodle fallbacks
     ====================================================================== */
  var PH_RE = /^\s*<svg[^>]*aria-label="(?:icon|item|prop|collectible|house) /;
  function art(fn, name, o, fb) {
    try {
      var P = typeof window !== 'undefined' && window.PawArt, f = P && P[fn];
      if (typeof f === 'function') {
        var s = f.call(P, name, o);
        if (typeof s === 'string' && s.indexOf('<svg') >= 0 && !PH_RE.test(s) && s.indexOf('data-placeholder') < 0) return s;
      }
    } catch (e) { /* fall back */ }
    return fb ? fb() : '';
  }
  // seeded wobbly pencil doodles for fallbacks
  function wob(pts, closed, seed, amp) {
    var r = mulberry(seed), a = amp == null ? 1.2 : amp, d = '';
    pts.forEach(function (p, i) { d += (i ? 'L' : 'M') + (p[0] + (r() - .5) * a).toFixed(1) + ' ' + (p[1] + (r() - .5) * a).toFixed(1); });
    return d + (closed ? 'Z' : '');
  }
  function sh(pts, fill, seed, w) {
    var a = wob(pts, true, seed), b = wob(pts, true, seed + 7, 2);
    return '<path d="' + a + '" fill="' + (fill || 'none') + '" stroke="' + INK + '" stroke-width="' + (w || 2.2) + '" stroke-linejoin="round"/>' +
      '<path d="' + b + '" fill="none" stroke="' + INK + '" stroke-width="' + ((w || 2.2) * .5) + '" opacity=".45"/>';
  }
  function ell(cx, cy, rx, ry, n) { var p = []; n = n || 16; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2; p.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); } return p; }
  function svgw(vb, inner, label) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" role="img" aria-label="' + (label || '') + '">' + inner + '</svg>'; }
  var SKY = { dawn: '#FBD9C9', day: '#CFE6F7', dusk: '#F3C3B2', night: '#3B4A72' };
  function fbScene(time, weather) {
    var sky = weather === 'rain' || weather === 'cloudy' ? (time === 'night' ? '#4A5270' : '#D5DBE3') : (SKY[time] || SKY.day);
    var s = '<rect width="1000" height="600" fill="#FFFBF3"/><rect width="1000" height="260" fill="' + sky + '"/>';
    for (var x = 150; x < 1000; x += 34) s += sh([[x, 252], [x, 130], [x + 14, 116], [x + 28, 130], [x + 28, 252]], '#E8CFAE', x, 1.6);
    s += sh([[-10, 262], [-10, 0], [176, 0], [176, 262]], '#F6E3C6', 3);
    s += '<rect y="248" width="1000" height="352" fill="#CFE3B4"/>';
    s += sh([[196, 228], [804, 228], [804, 516], [196, 516]], '#9C6E4E', 11);
    [[220, 250], [420, 250], [620, 250], [220, 390], [420, 390], [620, 390]].forEach(function (z, i) { s += sh([[z[0], z[1]], [z[0] + 160, z[1]], [z[0] + 160, z[1] + 110], [z[0], z[1] + 110]], '#C79E76', 20 + i, 1.4); });
    s += sh([[836, 250], [976, 250], [976, 470], [836, 470]], '#F3E2C8', 41, 1.6);
    s += '<text x="905" y="300" text-anchor="middle" font-family="Caveat,cursive" font-size="26" fill="' + INK + '">tools</text>';
    if (weather === 'snow') s += '<path d="M150 118h850M196 228h608" stroke="#fff" stroke-width="7" stroke-linecap="round"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Garden">' + s + '</svg>';
  }
  function fbPlot(w) {
    var col = ['#E2C59F', '#B98E66', '#9C7150', '#7E583E'][w] || '#B98E66';
    var s = sh([[14, 66], [146, 62], [150, 112], [12, 114]], col, 5 + w, 2.4);
    for (var i = 0; i < 3; i++) s += '<path d="' + wob([[26, 78 + i * 12], [134, 76 + i * 12]], false, 9 + i, 1.4) + '" stroke="' + INK + '" stroke-width="1" opacity=".35"/>';
    if (!w) s += '<path d="M40 84l8 6-4 6M104 80l-6 8 5 5" stroke="' + INK + '" stroke-width="1.2" fill="none" opacity=".6"/>';
    return svgw('0 0 160 120', s, 'plot');
  }
  var CROP_COL = { carrot: '#F29A4A', peas: '#8CC067', spinach: '#4F9A55', blueberries: '#5B6FB8', 'sweet-potato': '#B8645A', pumpkin: '#F08A3A' };
  function fbCrop(crop, st, dry) {
    var leaf = dry ? '#BDBE8E' : '#7DBA6A', s = '', c = CROP_COL[crop] || '#999', seed = hash(crop) % 1000;
    if (st === 0) {
      s += sh(ell(70, 108, 26, 6), '#8A6248', seed, 1.8) + '<path d="M106 110V78" stroke="' + INK + '" stroke-width="2.4"/>' + sh([[94, 66], [130, 66], [130, 82], [94, 82]], '#FFF4DF', seed + 1, 1.6) +
        '<text x="112" y="79" text-anchor="middle" font-family="Caveat,cursive" font-size="13" fill="' + INK + '">' + ((BY_ID[crop] || {}).name || '?') + '</text>';
    } else {
      var n = st === 1 ? 2 : st === 2 ? 5 : 6, h = st === 1 ? 18 : 40, droop = dry ? 10 : 0;
      for (var i = 0; i < n; i++) { var x = 80 + (i - (n - 1) / 2) * 13; s += sh([[x, 110], [x - 9 + droop, 110 - h * .6], [x + droop * .6, 110 - h], [x + 7, 110 - h * .5]], leaf, seed + i * 3, 1.6); }
      if (st === 3) {
        if (crop === 'pumpkin') s += sh(ell(80, 92, 30, 20), c, seed + 40);
        else if (crop === 'blueberries') { for (var j = 0; j < 7; j++) s += sh(ell(58 + (j % 4) * 14, 70 + Math.floor(j / 4) * 14, 6, 6, 10), c, seed + 50 + j, 1.4); }
        else if (crop === 'peas') { for (var k = 0; k < 4; k++) s += sh(ell(56 + k * 16, 80, 5, 12, 10), '#A9D47A', seed + 60 + k, 1.4); }
        else if (crop === 'spinach') s += sh(ell(80, 88, 26, 18), '#4F9A55', seed + 70);
        else for (var m = 0; m < 3; m++) s += sh([[60 + m * 20, 104], [72 + m * 20, 104], [66 + m * 20, 116]], c, seed + 80 + m, 1.6);
      }
    }
    return svgw('0 0 160 120', s, crop + ' stage ' + st);
  }
  function fbSquirrel() {
    return svgw('0 0 120 120', sh([[34, 76], [16, 52], [22, 22], [44, 18], [46, 40], [40, 60]], '#D9925C', 1) + sh(ell(60, 74, 22, 14), '#E3A06A', 2) + sh(ell(84, 56, 14, 13), '#E3A06A', 3) +
      '<circle cx="88" cy="52" r="2.4" fill="' + INK + '"/>' + sh([[94, 66], [106, 66], [100, 80]], '#B58560', 4, 1.4), 'Captain Fluff');
  }
  function fbIou() { return svgw('0 0 120 80', sh([[30, 8], [92, 4], [94, 52], [32, 56]], '#FFFBF3', 1) + '<text x="62" y="40" text-anchor="middle" font-family="Caveat,cursive" font-size="28" fill="' + INK + '">IOU</text>', 'IOU'); }
  function dropSvg(full) {
    var d = 'M32 6C40 22 50 32 50 42a18 18 0 0 1-36 0C14 32 24 22 32 6Z';
    return svgw('0 0 64 64', full ? '<path d="' + d + '" fill="#9CC4EE" stroke="' + INK + '" stroke-width="4"/><path d="M24 40q0 8 6 11" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>' : '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="3.5" stroke-dasharray="7 5" opacity=".65"/>', full ? 'water' : 'no water');
  }
  function fbCan() {
    return svgw('0 0 64 64', sh([[14, 28], [42, 28], [44, 54], [12, 54]], '#9CC4EE', 1) + '<path d="M42 34L58 22" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' + sh([[54, 18], [62, 16], [60, 26]], '#9CC4EE', 2, 1.4) +
      '<path d="M18 28q10-16 22 0" fill="none" stroke="' + INK + '" stroke-width="2.6"/>', 'watering can');
  }
  function fbIcon(name) {
    if (name === 'drop') return dropSvg(true);
    if (name === 'water-can') return fbCan();
    var lab = { seeds: 'S', basket: 'B', garden: 'G' }[name] || '?';
    if (name === 'basket') return svgw('0 0 64 64', sh([[8, 30], [56, 30], [50, 56], [14, 56]], '#E8C48A', 1) + '<path d="M16 30q16-26 32 0" fill="none" stroke="' + INK + '" stroke-width="3"/>' + sh(ell(26, 26, 7, 5), '#F29A4A', 3, 1.4), 'basket');
    if (name === 'seeds') return svgw('0 0 64 64', sh([[16, 8], [48, 8], [50, 58], [14, 58]], '#FFE3A1', 1) + '<path d="M32 46V30m0 6q-8-8-12-2m12 2q8-8 12-2" fill="none" stroke="#5E9A4E" stroke-width="3" stroke-linecap="round"/>', 'seeds');
    if (name === 'garden') return svgw('0 0 64 64', sh(ell(32, 50, 24, 8), '#B98E66', 1) + '<path d="M32 46V24m0 8q-12-12-16-2m16 2q12-12 16-2" fill="none" stroke="#5E9A4E" stroke-width="3.4" stroke-linecap="round"/>', 'garden');
    return svgw('0 0 64 64', sh(ell(32, 32, 24, 24), '#FFF4DF', 1) + '<text x="32" y="42" text-anchor="middle" font-family="Caveat,cursive" font-size="30" fill="' + INK + '">' + lab + '</text>', name);
  }
  function fbItem(name) {
    var id = null; CROPS.forEach(function (c) { if (c.item === name || c.seedItem === name) id = c.id; });
    var packet = /Seeds$/.test(name);
    var col = CROP_COL[id] || '#ccc';
    if (packet) return svgw('0 0 64 64', sh([[12, 6], [52, 6], [54, 60], [10, 60]], '#FFF4DF', 1) + sh(ell(32, 30, 12, 12), col, 2) + '<text x="32" y="54" text-anchor="middle" font-family="Caveat,cursive" font-size="11" fill="' + INK + '">' + name.replace(' Seeds', '') + '</text>', name);
    return svgw('0 0 64 64', sh(ell(32, 36, 18, 16), col, 3) + '<path d="M32 20q-6-12 4-14" stroke="#5E9A4E" stroke-width="3" fill="none"/>', name);
  }
  function fbDog(name) {
    return svgw('0 0 240 200', sh(ell(120, 120, 60, 34), '#E9B07A', 1, 3) + sh(ell(176, 86, 30, 26), '#E9B07A', 2, 3) + '<circle cx="184" cy="80" r="5" fill="' + INK + '"/>' +
      '<path d="M86 150v34M108 152v34M140 152v34M160 150v34" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M60 110q-26-20-14-40" stroke="' + INK + '" stroke-width="5" fill="none"/>', name || 'dog');
  }
  function fbHead() { return svgw('0 0 100 100', sh(ell(50, 54, 34, 30), '#E9B07A', 1, 3) + '<circle cx="40" cy="50" r="4" fill="' + INK + '"/><circle cx="62" cy="50" r="4" fill="' + INK + '"/>', 'dog'); }

  /* ======================================================================
     UI: words (the dog is always named, never "it")
     ====================================================================== */
  var PERK = {
    dig: 'Digger: one-tap planting and the odd bonus seed',
    guard: 'Guard: Captain Fluff never steals',
    fetch: 'Fetcher: the Basket picks every ready plot',
    inspect: 'Inspector: +1 quality on every crop',
    snow: 'Snow pup: crops grow at half speed in snow',
    tend: 'Helper: waters one thirsty plot a day'
  };
  var PERK_LINE = {
    dig: '{n} was born to dig. Point at a plot and stand back.',
    guard: '{n} is on squirrel patrol. Nobody touches the veggies.',
    fetch: '{n} brought the basket. {n} always brings the basket.',
    inspect: '{n} inspects every leaf. Quality control is a lifestyle.',
    snow: 'Snow? {n} calls that growing weather.',
    tend: '{n} keeps an eye on thirsty plants. Very responsible.'
  };
  var JOKES = [
    'The peas are thinking about it.',
    'Carrots grow downward. Very sneaky.',
    '{n} is supervising. Mostly the bees.',
    'A pumpkin is just a very ambitious orange.',
    'The spinach looks strong today.',
    'Somewhere, Captain Fluff is planning something.',
    'If you stare at a sprout, it grows slower. Probably.',
    '{n} dug a hole. Not on purpose. Kind of on purpose.',
    'Blueberries: tiny, round and extremely blue.',
    'Sweet potatoes hide underground. Shy veggies.',
    'Rain is the sky doing the watering for free.',
    '{n} sniffed a worm. The worm was not impressed.'
  ];
  var PLANT_LINES = ['Seed in. Now we wait.', '{n} pats the soil. Good soil.', 'Grow, little seed. {n} believes in you.'];
  var WATER_LINES = ['Glug glug.', 'The soil says thank you.', '{n} tries to drink from the can. Denied.'];
  var HARVEST_LINES = ['Fresh {p}! {n} approves.', '{n} sniffs the {p} with great respect.', 'Look at those {p}. {n} is impressed.'];
  var FLUFF_LINES = ['HEY! Captain Fluff took one {o} and left an IOU!', '{n} barks at Captain Fluff. Captain Fluff writes an IOU.'];
  var GUARD_LINES = ['{n} is on duty. Captain Fluff pretends to be just passing.', 'One look from {n} and Captain Fluff remembers an appointment.'];
  var NO_SEEDS = "No seeds: Pip's Sprout Cart is on Market Street";
  var WX_TXT = {
    sunny: ['Sunny', 'grows faster, dries faster'], night: ['Clear night', 'steady growing'], cloudy: ['Cloudy', 'steady growing'],
    rain: ['Rain', 'free watering'], snow: ['Snow', 'growth paused']
  };
  var STAGE_TXT = ['seed', 'sprout', 'leafy', 'ready!'];
  var SEASON_NAME = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // session memory (survives close/open within one page load)
  var SESSION = { offOK: false, fluffSeen: {}, guardShown: false };

  /* stage geometry: the 1000x600 scene sliced into 1240x620 -> scale 1.24, y offset -62 */
  var SC = 1.24, OY = -62;
  var ZONES_L = [[220, 250], [420, 250], [620, 250], [220, 390], [420, 390], [620, 390]].map(function (z) { return { x: z[0] * SC, y: z[1] * SC + OY, w: 160 * SC, h: 110 * SC }; });
  /* v1.5B portrait (phones): a 420-wide stage, plots in a 2x3 grid, scaled to the screen width and scrolled vertically */
  var ZONES_P = [[22, 186], [218, 186], [22, 300], [218, 300], [22, 414], [218, 414]].map(function (z) { return { x: z[0], y: z[1], w: 180, h: 108 }; });
  var ZONES = ZONES_L, SW = 1240, SH = 620, PORT = false;

  /* ======================================================================
     UI: open
     ====================================================================== */
  function open(el, o) {
    o = o || {};
    var closed = false, timers = [], cleanups = [];
    var ctl = { close: close, update: update };
    var root = null;
    try { injectCSS(); } catch (e) { /* ignore */ }
    var st = norm(clone(o.state) || newState());
    var env = { time: o.time || 'day', weather: WEATHERS[o.weather] ? o.weather : 'sunny', month: (o.month >= 1 && o.month <= 12) ? o.month : (new Date().getMonth() + 1) };
    var dog = o.dog || {}; var dogKey = dog.key || 'mutt', dogName = dog.name || 'Your dog', outfit = dog.outfit || {}; var dogCoat = dog.coat, dogSeed = dog.seed;
    var buddy = o.buddy !== undefined ? o.buddy : (BUDDY[dogKey] || null);
    var seeds = Object.assign({}, o.seeds || {});
    var sel = -1, tool = null, armed = null, dug = {}, pouchFor = -1, modal = null, pendingFluff = {}, busy = 0;
    var tempPose = null, tempTimer = 0, bubbleTimer = 0, lastPose = '';
    var R = mulberry(hash(dogKey + '|' + Date.now()));
    function call(fn) { var f = o[fn]; if (typeof f !== 'function') return undefined; try { return f.apply(null, [].slice.call(arguments, 1)); } catch (e) { if (typeof console !== 'undefined') console.warn('PawGarden callback ' + fn + ' failed', e); return undefined; } }
    function sfx(n) { call('sfx', n); }
    function later(fn, ms) { var t = setTimeout(function () { timers.splice(timers.indexOf(t), 1); if (!closed) try { fn(); } catch (e) { if (typeof console !== 'undefined') console.warn('PawGarden', e); } }, ms); timers.push(t); return t; }
    function fill(s, c) { return s.replace(/\{n\}/g, dogName).replace(/\{p\}/g, PLURAL[c] || 'veggies').replace(/\{o\}/g, ONE[c] || 'veggie'); }
    function pick(a) { return a[Math.floor(R() * a.length)]; }
    function q(sel2) { return root.querySelector(sel2); }

    try {
      PORT = (el.clientHeight || 620) > (el.clientWidth || 1240) * 1.1; ZONES = PORT ? ZONES_P : ZONES_L; SW = PORT ? 420 : 1240; SH = PORT ? 1000 : 620;
      root = document.createElement('div'); root.className = 'pg-root' + (PORT ? ' pg-portrait' : ''); root.tabIndex = -1;
      root.innerHTML =
        '<div class="pg-stage">' +
        '<div class="pg-scene"></div><div class="pg-plots"></div>' +
        '<div class="pg-dogw" title="Pet ' + esc(dogName) + '"><div class="pg-dog"></div><div class="pg-bubble"></div></div>' +
        '<div class="pg-fx"></div><div class="pg-anim"></div>' +
        '<div class="pg-ui">' +
        '<div class="pg-hud"><div class="pg-ico"></div><div class="pg-titles"><div class="pg-title">Veggie Patch</div><div class="pg-hint"></div></div>' +
        '<button type="button" class="pg-tool" data-t="seeds"><i></i>Seeds<small></small></button>' +
        '<button type="button" class="pg-tool" data-t="water"><i></i>Watering Can</button>' +
        '<button type="button" class="pg-tool" data-t="basket"><i></i>Basket<small></small></button>' +
        '<button type="button" class="pg-btn pg-pink pg-done">Done</button></div>' +
        '<div class="pg-chips"></div><div class="pg-info"></div>' +
        '</div></div>';
      el.appendChild(root);
      var stageEl = q('.pg-stage'), plotsEl = q('.pg-plots'), anim = q('.pg-anim');
      q('.pg-ico').innerHTML = art('icon', 'garden', null, function () { return fbIcon('garden'); });
      q('[data-t="seeds"] i').innerHTML = art('icon', 'seeds', null, function () { return fbIcon('seeds'); });
      q('[data-t="water"] i').innerHTML = art('icon', 'water-can', null, function () { return fbIcon('water-can'); });
      q('[data-t="basket"] i').innerHTML = art('icon', 'basket', null, function () { return fbIcon('basket'); });

      // plots
      ZONES.forEach(function (z, i) {
        var p = document.createElement('div'); p.className = 'pg-plot'; p.tabIndex = 0; p.setAttribute('role', 'button'); p.dataset.i = i;
        p.style.cssText = 'left:' + z.x.toFixed(1) + 'px;top:' + z.y.toFixed(1) + 'px;width:' + z.w.toFixed(1) + 'px;height:' + z.h.toFixed(1) + 'px';
        p.innerHTML = '<div class="pg-art"><div class="pg-soil"></div><div class="pg-crop"></div></div><div class="pg-extra"></div><div class="pg-num">' + (i + 1) + '</div><div class="pg-drops"></div>';
        p.addEventListener('click', function () { clickPlot(i); });
        plotsEl.appendChild(p);
      });

      // scale to the host
      var fit = function () {
        if (closed) return; if (typeof pin === 'function') pin();
        var w = el.clientWidth || SW, h = el.clientHeight || SH, s = (PORT ? w / SW : Math.min(w / SW, h / SH)) || 1;
        stageEl.style.transform = 'translate(' + Math.max(0, (w - SW * s) / 2).toFixed(1) + 'px,' + (PORT ? 0 : Math.max(0, (h - SH * s) / 2)).toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
      };
      // v2.2 phone: the 420 x 1000 stage scrolls, so the toolbar, seed pouch and cards follow the scroll position (--pg-sy, --pg-vh in stage pixels)
      var pin = function () { if (closed || !PORT) return; var s2 = (el.clientWidth || SW) / SW; root.style.setProperty('--pg-sy', (root.scrollTop / s2).toFixed(1) + 'px'); root.style.setProperty('--pg-vh', ((el.clientHeight || 700) / s2).toFixed(1) + 'px'); };
      if (PORT) { root.addEventListener('scroll', pin, { passive: true }); pin(); }
      fit();
      if (typeof ResizeObserver === 'function') { var ro = new ResizeObserver(fit); ro.observe(el); cleanups.push(function () { ro.disconnect(); }); }
      else { window.addEventListener('resize', fit); cleanups.push(function () { window.removeEventListener('resize', fit); }); }

      // events
      root.querySelectorAll('.pg-tool').forEach(function (b) { b.addEventListener('click', function () { toolClick(b.dataset.t); }); });
      q('.pg-done').addEventListener('click', function () { sfx('click'); call('onClose'); });
      q('.pg-dogw').addEventListener('click', petDog);
      var onKey = function (e) { if (!closed) keyDown(e); };
      document.addEventListener('keydown', onKey);
      cleanups.push(function () { document.removeEventListener('keydown', onKey); });

      // first selection: a ready plot, else an empty one
      sel = firstPlot(function (p) { return isReady(p); });
      if (sel < 0) sel = firstPlot(function (p) { return !p.crop; });
      if (sel < 0) sel = 0;

      renderScene(); renderChips(); renderAll(); renderDog();
      later(function () { say(fill((buddy && buddy === BUDDY[dogKey] && BREED_LINE[dogKey]) || PERK_LINE[buddy] || 'The veggie patch is all yours, {n}.', null), 3400); }, 450);
      // Captain Fluff left IOUs while we were away
      st.plots.forEach(function (p, i) { if (p.took > 0 && p.crop && !SESSION.fluffSeen[fluffKey(p, i)]) queueFluff(i); });
      if (!busy) maybeGuardBeat(1400);
      var chat = setInterval(function () { if (!closed && !modal && !busy && !tempPose) say(fill(pick(JOKES), null), 3200); }, 17000);
      cleanups.push(function () { clearInterval(chat); });
      try { root.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('PawGarden.open problem', err);
      try {
        if (!root) { root = document.createElement('div'); el.appendChild(root); }
        root.className = 'pg-root';
        root.innerHTML = '<div class="pg-card"><h3>The garden is having a nap</h3><p>Try again later.</p><div class="pg-row"><button type="button" class="pg-btn pg-pink">Close</button></div></div>';
        root.querySelector('button').onclick = function () { call('onClose'); };
      } catch (e2) { /* nothing more to do */ }
    }
    return ctl;

    /* ---------------- helpers ---------------- */
    function firstPlot(fn) { for (var i = 0; i < 6; i++) if (fn(st.plots[i])) return i; return -1; }
    function fluffKey(p, i) { return i + '|' + p.planted + '|' + (p.harvested | 0); }
    function changed() { call('onChange', clone(st)); }
    function plotEl(i) { return plotsEl.children[i]; }
    function zc(i) { var z = ZONES[i]; return { x: z.x + z.w / 2, y: z.y + z.h / 2 }; }
    function warm() { return outfit.head === 'Pom-pom Beanie' || outfit.body === 'Knit Winter Sweater'; }
    function basePose() {
      if (env.weather === 'snow' && !warm()) return 'cold';
      var h = new Date().getHours();
      if (env.weather === 'sunny' && env.time === 'day' && h >= 11 && h < 15) return 'hot';
      return 'idle';
    }
    function dogSvg(pose) {
      var s = art('dog', dogKey, { pose: pose, outfit: outfit, facing: 'right', coat: dogCoat, seed: dogSeed }, null);
      if (s && pose !== 'idle' && s.indexOf('pa-pose-' + pose) < 0) s = art('dog', dogKey, { pose: pose === 'dig' ? 'eat' : pose === 'cold' ? 'sad' : 'happy', outfit: outfit, coat: dogCoat, seed: dogSeed }, null);
      return s || fbDog(dogName);
    }
    function renderDog() {
      var pz = tempPose || basePose();
      if (pz === lastPose) return; lastPose = pz;
      q('.pg-dog').innerHTML = dogSvg(pz);
    }
    function pose(p, ms) {
      tempPose = p; renderDog(); clearTimeout(tempTimer);
      tempTimer = later(function () { tempPose = null; renderDog(); }, ms || 1400);
    }
    function say(t, ms) {
      if (closed || !t) return;
      var b = q('.pg-bubble'); b.textContent = t; b.classList.add('pg-show');
      clearTimeout(bubbleTimer); bubbleTimer = later(function () { b.classList.remove('pg-show'); }, ms || 2600);
    }
    function hint(t) { var h = q('.pg-hint'); if (h) h.textContent = t; }
    function float(x, y, text, cls) {
      var f = document.createElement('div'); f.className = 'pg-float' + (cls ? ' ' + cls : ''); f.textContent = text; f.style.left = x + 'px'; f.style.top = y + 'px';
      anim.appendChild(f); later(function () { f.remove(); }, 1600);
    }

    /* ---------------- render ---------------- */
    function renderScene() {
      var s = art('scene', 'garden', { time: env.time, weather: env.weather }, null);
      if (!s || !/garden/i.test(s.slice(0, 400))) s = fbScene(env.time, env.weather);
      q('.pg-scene').innerHTML = s;
      if (PORT) { var sv = q('.pg-scene>svg'); if (sv) sv.setAttribute('preserveAspectRatio', 'xMidYMax slice'); }
      var fx = q('.pg-fx'); fx.innerHTML = env.weather === 'rain' ? '<div class="pg-rain"></div>' : env.weather === 'snow' ? '<div class="pg-snow"></div>' : '';
    }
    function wxKey() { return env.weather === 'sunny' && env.time === 'night' ? 'night' : env.weather; }
    function renderChips() {
      var wk = wxKey(), wt = WX_TXT[wk].slice();
      if (wk === 'snow' && buddy === 'snow') wt[1] = 'half speed (thanks, ' + dogName + ')';
      else if (wk === 'snow') wt[1] = 'paused (spinach still grows)';
      var wIcon = wk === 'night' ? 'w-night' : wk === 'sunny' ? (env.time === 'dawn' ? 'w-dawn' : env.time === 'dusk' ? 'w-dusk' : 'w-sunny') : 'w-' + wk;
      var sz = seasonOf(env.month);
      var head = art('dogHead', dogKey, { coat: dogCoat, seed: dogSeed }, fbHead);
      q('.pg-chips').innerHTML =
        '<div class="pg-chip"><i>' + art('icon', wIcon, null, function () { return fbIcon('w'); }) + '</i><b>' + wt[0] + '</b>' + wt[1] + '</div>' +
        '<div class="pg-chip"><i>' + art('icon', 'season-' + sz, null, function () { return fbIcon('s'); }) + '</i><b>' + SEASON_NAME[sz] + '</b>' + inSeasonList(sz) + '</div>' +
        (buddy && PERK[buddy] ? '<div class="pg-chip pg-buddy"><span class="pg-head">' + head + '</span><b>' + esc(dogName) + '</b>' + PERK[buddy] + '</div>' : '');
    }
    function inSeasonList(sz) { var n = CROPS.filter(function (c) { return c.seasons.indexOf(sz) >= 0; }).map(function (c) { return c.name.toLowerCase(); }); return n.length ? n.join(', ') : ''; }
    function renderPlot(i, opts) {
      var p = st.plots[i], e = plotEl(i), c = BY_ID[p.crop], sg = stage(p), dry = p.water === 0 && sg < 3 && !!c;
      e.classList.toggle('pg-sel', i === sel);
      var soilK = 'w' + p.water;
      if (e.dataset.soil !== soilK) { e.dataset.soil = soilK; e.querySelector('.pg-soil').innerHTML = art('prop', 'plot', { water: p.water }, function () { return fbPlot(p.water); }); }
      var cropK = c ? c.id + sg + (dry ? 'd' : '') : (p.crop ? '?' : '');
      var ce = e.querySelector('.pg-crop');
      if (e.dataset.crop !== cropK && !ce.classList.contains('pg-pluck')) {
        var grew = e.dataset.crop != null && cropK && e.dataset.crop.replace(/d$/, '') !== cropK.replace(/d$/, '');
        e.dataset.crop = cropK;
        ce.innerHTML = c ? art('prop', 'crop', { crop: c.id, stage: sg, dry: dry }, function () { return fbCrop(c.id, sg, dry); }) : (p.crop ? fbCrop('?', 0, false) : '');
        ce.classList.remove('pg-grow'); if (grew && !(opts && opts.noGrow)) { void ce.offsetWidth; ce.classList.add('pg-grow'); }
      }
      // extras: tag, sparkles, hole, IOU
      var ex = '';
      if (c && sg === 3) ex += '<span class="pg-spark" style="left:18%;top:-6%">&#10022;</span><span class="pg-spark" style="left:76%;top:2%;animation-delay:.5s">&#10022;</span><span class="pg-spark" style="left:52%;top:-20%;animation-delay:1s;font-size:15px">&#10022;</span>';
      if (c && sg === 3) ex += '<div class="pg-tag pg-ready">' + c.name + ' ready!</div>';
      else if (dry) ex += '<div class="pg-tag pg-thirsty">thirsty</div>';
      if (!p.crop && dug[i]) ex += '<div class="pg-hole"></div>';
      if (c && p.took > 0 && !pendingFluff[i]) ex += '<div class="pg-iou">' + art('prop', 'iou', null, fbIou) + '</div>';
      var xe = e.querySelector('.pg-extra'); if (xe.dataset.k !== ex) { xe.dataset.k = ex; xe.innerHTML = ex; }
      var dk = 'd' + p.water;
      var de = e.querySelector('.pg-drops');
      if (de.dataset.k !== dk) { de.dataset.k = dk; var dh = ''; for (var k = 0; k < 3; k++) dh += '<span class="pg-drop">' + (k < p.water ? art('icon', 'drop', null, function () { return dropSvg(true); }) : dropSvg(false)) + '</span>'; de.innerHTML = dh; }
      e.setAttribute('aria-label', 'Plot ' + (i + 1) + ': ' + (c ? c.name + ', ' + STAGE_TXT[sg] : 'empty') + ', water ' + p.water + ' of 3');
    }
    function renderAll(opts) { for (var i = 0; i < 6; i++) renderPlot(i, opts); renderTools(); renderInfo(); renderHint(); }
    function totalSeeds() { var n = 0; CROPS.forEach(function (c) { n += Math.max(0, seeds[c.id] | 0); }); return n; }
    function readyCount() { return st.plots.filter(isReady).length; }
    function renderTools() {
      root.querySelectorAll('.pg-tool').forEach(function (b) { b.classList.toggle('pg-on', tool === b.dataset.t); });
      q('[data-t="seeds"] small').textContent = '×' + totalSeeds();
      q('[data-t="basket"] small').textContent = buddy === 'fetch' ? 'all!' : (readyCount() ? readyCount() + ' ready' : '');
    }
    function renderHint() {
      var t;
      if (tool === 'seeds' && armed) t = BY_ID[armed].seedItem + ' in paw: tap an empty plot' + (buddy === 'dig' || PORT ? '.' : ', dig, then tap again to drop the seed.');
      else if (tool === 'water') t = 'Watering Can: tap a plot to fill it to 3 drops. Esc puts it down.';
      else if (tool === 'basket') t = 'Basket: tap a sparkly plot to pick it.';
      else t = 'Pick a plot (1-6), then Seeds (P), Watering Can (W) or Basket (H).';
      hint(t);
    }
    function hoursText(h) { h = Math.max(1, Math.round(h)); return h + ' hour' + (h === 1 ? '' : 's'); }
    function etaText(p, c) {
      var h = hoursLeft(p, env.month);
      return h < 0.75 ? 'Ready in under an hour' : 'Ready in about ' + hoursText(h);
    }
    function waterText(p) {
      var night = env.time === 'night', h = waterHours(p, env.weather, night);
      if (!p.water || h === Infinity) return '';
      return ' (about ' + hoursText(h) + ' left)';
    }
    function renderInfo() {
      var box = q('.pg-info'), p = st.plots[sel], c = p && BY_ID[p.crop];
      if (!p) { box.innerHTML = ''; return; }
      var h = '<h3>Plot ' + (sel + 1) + (c ? ': ' + c.name : '') + '</h3>';
      if (!c) {
        h += '<div class="pg-sub">' + (p.crop ? 'Something mysterious grows here.' : 'Empty, tilled and waiting.') + '</div>';
        h += '<div>Water ' + p.water + ' / 3</div>';
        h += '<div class="pg-acts">' + (p.crop ? '' : '<button type="button" class="pg-btn pg-yel pg-sm" data-a="plant">Plant (P)</button>') + (p.water < 3 ? '<button type="button" class="pg-btn pg-blue pg-sm" data-a="water">Water (W)</button>' : '') + '</div>';
      } else {
        var sg = stage(p), snowStop = env.weather === 'snow' && !c.hardy && buddy !== 'snow';
        h += '<div class="pg-sub">' + cap(STAGE_TXT[sg]) + (p.inSeason ? '' : ' · off-season, half speed') + '</div>';
        h += '<div class="pg-bar"><i style="width:' + Math.round(p.g * 100) + '%"></i></div>';
        h += '<div>' + (sg === 3 ? (p.took ? 'Ready. Captain Fluff left an IOU.' : 'Ready to pick!') : p.water === 0 ? 'Thirsty: not growing until watered.' : snowStop ? 'Snow: resting until it melts.' : etaText(p, c) + '.') + '</div>';
        h += '<div>Water ' + p.water + ' / 3' + (sg < 3 ? waterText(p) : '') + (c.regrow ? ' · regrows in ' + hoursText(c.regrow) + (c.picks ? ', ' + Math.max(1, c.picks - (p.harvested | 0)) + ' pick' + (c.picks - (p.harvested | 0) === 1 ? '' : 's') + ' left' : '') : '') + '</div>';
        h += '<div class="pg-q"><span class="' + (p.dry === 0 ? 'pg-ok' : '') + '">' + (p.dry === 0 ? '&#10003;' : '&#10007;') + ' never dry</span><span class="' + (p.inSeason ? 'pg-ok' : '') + '">' + (p.inSeason ? '&#10003;' : '&#10007;') + ' in season</span><span class="' + (p.inspected ? 'pg-ok' : '') + '">' + (p.inspected ? '&#10003;' : '&#10007;') + ' inspected</span></div>';
        h += '<div class="pg-acts">' + (sg === 3 ? '<button type="button" class="pg-btn pg-sm" data-a="harvest">Harvest (H)</button>' : '') + (sg < 3 && p.water < 3 ? '<button type="button" class="pg-btn pg-blue pg-sm" data-a="water">Water (W)</button>' : '') + '</div>';
      }
      box.innerHTML = h;
      box.querySelectorAll('[data-a]').forEach(function (b) {
        b.addEventListener('click', function () { var a = b.dataset.a; if (a === 'plant') openPouch(sel); else if (a === 'water') doWater(sel); else if (a === 'harvest') doHarvest(sel); });
      });
    }

    /* ---------------- interaction ---------------- */
    function select(i) {
      if (i < 0 || i > 5) return;
      sel = i; for (var k = 0; k < 6; k++) plotEl(k).classList.toggle('pg-sel', k === sel);
      renderInfo();
    }
    function setTool(t) { tool = t; if (t !== 'seeds') armed = null; renderTools(); renderHint(); }
    function clickPlot(i) {
      if (closed || modal) return;
      var p = st.plots[i];
      select(i); sfx('click');
      if (tool === 'water') return doWater(i);
      if (tool === 'basket') return doHarvest(i);
      if (tool === 'seeds' && armed) { if (!p.crop) return tryPlant(i, armed); }
      if (isReady(p)) return doHarvest(i);
      if (!p.crop) return openPouch(i);
      if (p.water === 0) say('Plot ' + (i + 1) + ' looks thirsty. The Watering Can helps (W).', 2600);
    }
    function toolClick(t) {
      if (closed || modal) return;
      sfx('click');
      if (t === 'seeds') { if (q('.pg-pouch')) { closePouch(); return; } openPouch(st.plots[sel] && !st.plots[sel].crop ? sel : -1); return; }
      closePouch();
      if (t === 'water') {
        if (tool === 'water') { setTool(null); return; }
        setTool('water');
        if (st.plots[sel] && st.plots[sel].crop && st.plots[sel].water < 3 && !isReady(st.plots[sel])) doWater(sel);
        return;
      }
      if (t === 'basket') {
        if (buddy === 'fetch') { harvestAll(); return; }
        if (tool === 'basket') { setTool(null); return; }
        setTool('basket');
        if (isReady(st.plots[sel])) doHarvest(sel);
        else if (!readyCount()) say('Nothing is ready yet. The ' + pickGrowingPlural() + ' ' + (IS_ONE[pickGrowingCrop()] ? 'is' : 'are') + ' thinking about it.', 2600);
      }
    }
    function pickGrowingCrop() { var p = st.plots.filter(growing)[0]; return p ? p.crop : 'peas'; }
    function pickGrowingPlural() { return PLURAL[pickGrowingCrop()]; }

    function openPouch(target) {
      closePouch();
      pouchFor = target;
      var sz = seasonOf(env.month);
      var owned = CROPS.filter(function (c) { return (seeds[c.id] | 0) > 0; });
      owned.sort(function (a, b) { var ia = a.seasons.indexOf(sz) >= 0 ? 0 : 1, ib = b.seasons.indexOf(sz) >= 0 ? 0 : 1; return ia - ib || CROPS.indexOf(a) - CROPS.indexOf(b); });
      var box = document.createElement('div'); box.className = 'pg-pouch';
      var h = '<h3><span>Seed pouch' + (target >= 0 ? ' · plot ' + (target + 1) : '') + '</span><button type="button" class="pg-btn pg-pink pg-sm" data-x="1">Close</button></h3>';
      if (!owned.length) h += '<div class="pg-empty">' + NO_SEEDS + '.</div>';
      else {
        h += '<div class="pg-pks">';
        owned.forEach(function (c) {
          var ins = c.seasons.indexOf(sz) >= 0;
          h += '<button type="button" class="pg-pk' + (ins ? '' : ' pg-off') + '" data-c="' + c.id + '" title="' + c.seedItem + ': ready in about ' + hoursText(c.hours) + ', seasons: ' + c.seasons.join(', ') + '">' +
            (ins ? '<span class="pg-stamp">In season</span>' : '') + '<i>' + art('item', c.seedItem, null, function () { return fbItem(c.seedItem); }) + '</i><b>' + c.name + '</b>' + c.hours + ' hours' + (ins ? '' : '<br>half speed') + '<em>' + (seeds[c.id] | 0) + '</em></button>';
        });
        h += '</div>';
      }
      box.innerHTML = h;
      q('.pg-ui').appendChild(box);
      box.querySelector('[data-x]').addEventListener('click', function () { sfx('click'); closePouch(); });
      box.querySelectorAll('[data-c]').forEach(function (b) {
        b.addEventListener('pointerdown', function (e) { seedDrag(e, b.dataset.c, b); });
        b.addEventListener('click', function () { if (b._dragged) { b._dragged = false; return; }
          var id = b.dataset.c; sfx('click');
          armed = id; tool = 'seeds'; closePouch(); renderTools(); renderHint();
          var t = target >= 0 && !st.plots[target].crop ? target : (st.plots[sel] && !st.plots[sel].crop ? sel : firstPlot(function (p) { return !p.crop; }));
          if (t >= 0) { select(t); tryPlant(t, id); } else say('Every plot is busy. Harvest something first.', 2400);
        });
      });
      if (!owned.length) { call('say', NO_SEEDS, 3000); sfx('nope'); }
    }
    /* v1.5B: drag a seed packet onto a plot (touch or mouse); a plain tap still opens the old flow */
    function seedDrag(e, id, b) {
      var x0 = e.clientX, y0 = e.clientY, ghost = null, pid = e.pointerId;
      var move = function (ev) {
        if (ev.pointerId !== pid) return;
        if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10) { ghost = document.createElement('div'); ghost.className = 'pg-sghost'; ghost.innerHTML = art('item', BY_ID[id].seedItem, null, function () { return fbItem(BY_ID[id].seedItem); }); document.body.appendChild(ghost); var pz = q('.pg-pouch'); if (pz) pz.style.visibility = 'hidden'; }
        if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; ev.preventDefault(); }
      };
      var up = function (ev) {
        if (ev.pointerId !== pid) return;
        document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
        if (!ghost) return; ghost.remove(); b._dragged = true;
        var hit = document.elementFromPoint(ev.clientX, ev.clientY), pe = hit && hit.closest && hit.closest('.pg-plot');
        if (!pe) { var pz = q('.pg-pouch'); if (pz) pz.style.visibility = ''; return; } var t = +pe.dataset.i;
        armed = id; tool = 'seeds'; closePouch(); renderTools(); renderHint(); select(t); tryPlant(t, id);
      };
      document.addEventListener('pointermove', move, { passive: false }); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    }
    function closePouch() { var p = q('.pg-pouch'); if (p) p.remove(); pouchFor = -1; }

    function confirmOffSeason(c, yes) {
      modal = document.createElement('div'); modal.className = 'pg-veil';
      modal.innerHTML = '<div class="pg-card"><h3>' + c.seedItem + '</h3><p>This grows at half speed now. Plant anyway?</p><div class="pg-row"><button type="button" class="pg-btn pg-pink" data-n="1">Not now</button><button type="button" class="pg-btn" data-y="1">Plant anyway</button></div></div>';
      q('.pg-ui').appendChild(modal);
      var done = function (ok) { if (!modal) return; modal.remove(); modal = null; sfx('click'); if (ok) { SESSION.offOK = true; yes(); } };
      modal.querySelector('[data-y]').addEventListener('click', function () { done(true); });
      modal.querySelector('[data-n]').addEventListener('click', function () { done(false); });
      modal.addEventListener('click', function (e) { if (e.target === modal) done(false); });
      try { modal.querySelector('[data-y]').focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
    function dirt(i) {
      var c = zc(i);
      for (var k = 0; k < 7; k++) {
        var d = document.createElement('div'); d.className = 'pg-dirt';
        d.style.left = (c.x - 5 + (R() - .5) * 20) + 'px'; d.style.top = (c.y + 8) + 'px';
        d.style.setProperty('--dx', ((R() - .5) * 90).toFixed(0) + 'px'); d.style.setProperty('--dy', (-20 - R() * 50).toFixed(0) + 'px');
        anim.appendChild(d); (function (dd) { later(function () { dd.remove(); }, 700); })(d);
      }
    }
    function tryPlant(i, cropId) {
      var c = BY_ID[cropId], p = st.plots[i];
      if (!c || !p) return;
      if (p.crop) { say('Plot ' + (i + 1) + ' is busy growing. One veggie per bed.', 2200); return; }
      if ((seeds[cropId] | 0) <= 0) { armed = null; tool = null; renderTools(); renderHint(); call('say', NO_SEEDS, 3000); say(NO_SEEDS + '.', 3000); sfx('nope'); return; }
      if (!inSeason(cropId, env.month) && !SESSION.offOK) { confirmOffSeason(c, function () { tryPlant(i, cropId); }); return; }
      if (buddy !== 'dig' && !dug[i] && !PORT) { // v2.3 phone: no separate dig tap, the dog digs while it plants
        dug[i] = true; renderPlot(i); dirt(i); sfx('dig'); pose('dig', 900);
        hint('Hole dug in plot ' + (i + 1) + '. Tap it again (or P) to drop the ' + c.seedItem + '.');
        return;
      }
      var pre = plant(st, i, cropId, { month: env.month, buddy: buddy });
      if (!pre.ok) return;
      var ok = call('onPlant', i, cropId);
      if (ok === false) { seeds[cropId] = 0; armed = null; tool = null; renderAll(); call('say', NO_SEEDS, 3000); say(NO_SEEDS + '.', 3000); sfx('nope'); return; }
      st = pre.state; seeds[cropId] = Math.max(0, (seeds[cropId] | 0) - 1); dug[i] = false;
      if (buddy === 'dig' || PORT) dirt(i);
      sfx('plant'); pose('dig', 1100);
      if (pre.bonusSeed) { call('onBonusSeed', cropId); seeds[cropId] = (seeds[cropId] | 0) + 1; later(function () { say(dogName + ' dug up a bonus ' + c.seedItem.replace(/s$/, '') + '!', 2800); float(zc(i).x, zc(i).y - 40, '+1 seed', 'pg-pinkt'); }, 500); }
      else say(fill(pick(PLANT_LINES), cropId), 2200);
      if ((seeds[cropId] | 0) <= 0) { armed = null; tool = null; }
      renderAll(); changed();
    }
    function doWater(i) {
      var p = st.plots[i]; if (!p) return;
      if (p.water >= 3) { say('Plot ' + (i + 1) + ' is already soggy. Three drops is the max.', 2200); return; }
      if (isReady(p)) { say('That one is ready to pick, no water needed.', 2000); return; }
      st = water(st, i); sfx('water');
      var z = ZONES[i], can = document.createElement('div'); can.className = 'pg-can';
      can.style.left = (z.x + z.w * .55) + 'px'; can.style.top = (z.y - 66) + 'px';
      can.innerHTML = art('item', 'Watering Can', null, function () { return art('icon', 'water-can', null, fbCan); });
      anim.appendChild(can); later(function () { can.remove(); }, 1050);
      for (var k = 0; k < 9; k++) {
        var d = document.createElement('div'); d.className = 'pg-wd';
        d.style.left = (z.x + z.w * .3 + R() * z.w * .35) + 'px'; d.style.top = (z.y + 4 + R() * 14) + 'px'; d.style.animationDelay = (0.32 + k * 0.05).toFixed(2) + 's';
        anim.appendChild(d); (function (dd) { later(function () { dd.remove(); }, 1300); })(d);
      }
      later(function () { renderPlot(i); renderInfo(); }, 450);
      if (env.weather === 'rain' && R() < .6) say('It is raining, but extra love never hurts.', 2200);
      else say(fill(pick(WATER_LINES), p.crop), 1800);
      changed();
    }
    function doHarvest(i, quiet) {
      var p = st.plots[i]; if (!p) return false;
      if (!isReady(p)) {
        if (!quiet) { var c0 = BY_ID[p.crop]; say(c0 ? 'Not yet. The ' + PLURAL[c0.id] + ' ' + (IS_ONE[c0.id] ? 'is' : 'are') + ' thinking about it.' : 'Nothing to pick there yet.', 2200); }
        return false;
      }
      var cid = p.crop, r = harvest(st, i, {});
      if (!r.items.length) return false;
      st = r.state;
      // pluck: the crop jumps out, then items hop into the basket
      var e = plotEl(i), ce = e.querySelector('.pg-crop');
      ce.classList.remove('pg-grow'); void ce.offsetWidth; ce.classList.add('pg-pluck');
      later(function () { ce.classList.remove('pg-pluck'); e.dataset.crop = '~'; renderPlot(i, { noGrow: true }); }, 560);
      sfx('pluck'); pose('happy', 1700);
      var c = zc(i), bb = basketPos();
      r.items.forEach(function (it, k) {
        later(function () {
          var f = document.createElement('div'); f.className = 'pg-fly';
          f.innerHTML = art('item', BY_ID[cid].item, null, function () { return fbItem(BY_ID[cid].item); });
          f.style.left = (c.x - 26) + 'px'; f.style.top = (c.y - 40) + 'px';
          anim.appendChild(f);
          float(c.x + (k - (r.items.length - 1) / 2) * 34, c.y - 64, new Array(it.stars + 1).join('★'));
          if (typeof f.animate === 'function') {
            var dx = bb.x - c.x, dy = bb.y - c.y + 40;
            f.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (dx * .5) + 'px,' + (dy * .5 - 120) + 'px) scale(1.15)', offset: .5 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.5)', opacity: .3 }], { duration: 750, easing: 'ease-in', fill: 'forwards' });
          }
          later(function () { f.remove(); if (k === 0) sfx('pop'); }, 760);
        }, 180 + k * 130);
      });
      if (!quiet) say(fill(pick(HARVEST_LINES), cid) + (r.took ? ' (Minus one for Captain Fluff.)' : '') + (r.spent ? ' That bush is all picked out. Plant a new one.' : ''), 2600);
      call('onHarvest', i, r.items, r.took);
      changed();
      renderAll({ noGrow: true });
      return true;
    }
    function harvestAll() {
      var n = 0, last = null;
      for (var i = 0; i < 6; i++) if (isReady(st.plots[i])) { (function (k) { later(function () { doHarvest(k, true); }, n * 260); })(i); last = st.plots[i].crop; n++; }
      if (!n) { say('Nothing is ready yet. ' + dogName + ' holds the basket anyway.', 2400); return; }
      later(function () { say(dogName + ' fetched the whole harvest in one go. Showing off.', 2800); }, 300);
    }
    function basketPos() {
      try {
        var b = q('[data-t="basket"]').getBoundingClientRect(), s = stageEl.getBoundingClientRect(), k = s.width / SW || 1;
        return { x: (b.left - s.left + b.width / 2) / k, y: (b.top - s.top + b.height / 2) / k };
      } catch (e) { return { x: 900, y: 40 }; }
    }
    function petDog() {
      if (closed || modal) return;
      sfx('bark'); pose('happy', 1500);
      var p = st.plots.filter(isReady)[0];
      say(p ? dogName + ' thinks the ' + PLURAL[p.crop] + ' look ready. ' + dogName + ' is right.' : fill(pick(JOKES), null), 2600);
    }

    /* ---------------- Captain Fluff ---------------- */
    function queueFluff(i) {
      if (pendingFluff[i]) return;
      pendingFluff[i] = true; renderPlot(i);
      busy++;
      later(function () { runFluff(i, false, function () { busy--; }); }, 700 + busy * 1900);
    }
    function maybeGuardBeat(delay) {
      if (buddy !== 'guard' || SESSION.guardShown || !readyCount()) return;
      SESSION.guardShown = true; busy++;
      later(function () { runFluff(firstPlot(isReady), true, function () { busy--; }); }, delay || 1200);
    }
    function runFluff(i, guarded, done) {
      if (i < 0) { done(); return; }
      var p = st.plots[i], c = zc(i), sq = document.createElement('div'); sq.className = 'pg-sq';
      var img = art('prop', 'squirrel', null, fbSquirrel);
      sq.innerHTML = '<div style="width:100%;height:100%;transform:scaleX(-1)">' + img + '</div>';
      anim.appendChild(sq);
      var y = c.y - 70, x0 = 1260, xs = guarded ? c.x + 120 : c.x - 30;
      sfx('squirrel');
      var finish = function () {
        sq.remove();
        if (!guarded) { if (p && p.crop) SESSION.fluffSeen[fluffKey(p, i)] = 1; pendingFluff[i] = false; renderPlot(i); renderInfo(); float(c.x, c.y - 30, 'IOU', 'pg-pinkt'); }
        done();
      };
      if (typeof sq.animate !== 'function') { finish(); return; }
      var a1 = sq.animate([{ transform: 'translate(' + x0 + 'px,' + y + 'px)' }, { transform: 'translate(' + (xs + (x0 - xs) * .5) + 'px,' + (y - 30) + 'px)', offset: .5 }, { transform: 'translate(' + xs + 'px,' + y + 'px)' }], { duration: 750, easing: 'ease-out', fill: 'forwards' });
      a1.onfinish = function () {
        if (closed) return;
        if (guarded) { sfx('bark'); pose('happy', 1400); say(fill(pick(GUARD_LINES), null), 3000); }
        else { sfx('pop'); pose('happy', 1200); say(fill(pick(FLUFF_LINES), p && p.crop), 3000); }
        sq.firstChild.style.transform = 'none';
        later(function () {
          var a2 = sq.animate([{ transform: 'translate(' + xs + 'px,' + y + 'px)' }, { transform: 'translate(' + (xs + 60) + 'px,' + (y - 40) + 'px)', offset: .3 }, { transform: 'translate(' + (x0 + 40) + 'px,' + (y - 10) + 'px)' }], { duration: 800, easing: 'ease-in', fill: 'forwards' });
          a2.onfinish = finish;
        }, guarded ? 700 : 450);
      };
    }

    /* ---------------- keyboard ---------------- */
    function keyDown(e) {
      if (!root || !root.isConnected) return;
      var tg = e.target, tn = tg && tg.tagName;
      if (tn === 'INPUT' || tn === 'TEXTAREA' || tn === 'SELECT' || (tg && tg.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key, used = true;
      if (k === 'Escape') {
        if (modal) { modal.remove(); modal = null; }
        else if (q('.pg-pouch')) closePouch();
        else if (tool) setTool(null);
        else call('onClose');
      } else if (modal) { used = false; }
      else if (k >= '1' && k <= '6') { closePouch(); select(+k - 1); sfx('click'); }
      else if (k === 'p' || k === 'P') {
        var p = st.plots[sel];
        if (p && p.crop) say('Plot ' + (sel + 1) + ' is already growing something.', 2000);
        else if (armed && (seeds[armed] | 0) > 0) tryPlant(sel, armed);
        else openPouch(sel);
      } else if (k === 'w' || k === 'W') { closePouch(); doWater(sel); }
      else if (k === 'h' || k === 'H') {
        closePouch();
        if (buddy === 'fetch') harvestAll();
        else if (isReady(st.plots[sel])) doHarvest(sel);
        else { var r = firstPlot(isReady); if (r >= 0) { select(r); doHarvest(r); } else doHarvest(sel); }
      } else used = false;
      if (used) { e.preventDefault(); e.stopPropagation(); }
    }

    /* ---------------- controller ---------------- */
    function update(pt) {
      if (closed || !root) return;
      try {
        pt = pt || {};
        if (pt.seeds) seeds = Object.assign({}, pt.seeds);
        if (pt.month >= 1 && pt.month <= 12) env.month = pt.month;
        if (pt.buddy !== undefined) buddy = pt.buddy;
        var sceneDirty = false;
        if (pt.time && pt.time !== env.time) { env.time = pt.time; sceneDirty = true; }
        if (pt.weather && WEATHERS[pt.weather] && pt.weather !== env.weather) { env.weather = pt.weather; sceneDirty = true; }
        if (pt.state) {
          var old = st; st = norm(clone(pt.state));
          var newlyReady = null;
          st.plots.forEach(function (p, i) {
            var op = old.plots[i];
            if (p.crop) dug[i] = false;
            if (p.crop && p.took > 0 && !(op && op.took > 0 && op.crop === p.crop)) queueFluff(i);
            if (isReady(p) && !(op && isReady(op) && op.crop === p.crop)) newlyReady = p.crop;
          });
          if (newlyReady && !busy) { later(function () { say('The ' + PLURAL[newlyReady] + ' ' + (IS_ONE[newlyReady] ? 'is' : 'are') + ' ready! ' + dogName + ' does a little dance.', 2800); pose('happy', 1600); }, 200); }
          if (newlyReady) maybeGuardBeat(1800);
        }
        if (sceneDirty) { renderScene(); lastPose = ''; renderDog(); }
        renderChips(); renderAll();
      } catch (e) { if (typeof console !== 'undefined') console.warn('PawGarden.update problem', e); }
    }
    function close() {
      if (closed) return; closed = true;
      timers.forEach(clearTimeout); timers = [];
      cleanups.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); cleanups = [];
      if (root && root.parentNode) root.parentNode.removeChild(root);
      root = null;
    }
  }

  /* ======================================================================
     EXPORT
     ====================================================================== */
  var API = {
    CROPS: CROPS, BUDDY: BUDDY,
    newState: newState, periodKey: periodKey, stage: stage,
    advance: advance, harvest: harvest, plant: plant, water: water, open: open,
    // small extras (additive, optional): seasons, prices, odds
    seasonOf: seasonOf, inSeason: inSeason, sellPrice: sellPrice, STAR_ODDS: STAR_ODDS, qualityPoints: qualityPoints,
    // v1.7.1 hourly clock
    hourKey: hourKey, migrate: function (st) { return norm(clone(st)); }, hoursLeft: hoursLeft, waterHours: waterHours, drainRate: drainRate,
    SQUIRREL_HOURS: SQUIRREL_HOURS, DRAIN: DRAIN, VERSION: 2
  };
  if (typeof window !== 'undefined') window.PawGarden = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();
