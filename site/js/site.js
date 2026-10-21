// doodledoggo.app v2: the live Shelter Playroom on the home page, the seasonal leaves and the Mt. Fuji Lookout season.
// Site v3 (every page): falling momiji behind the paper (sakura mixed in in spring), crayon dogs peeking round the paper sheet and a few still
// momiji in the margins (#deco), never over text; a wiggle on the /dogs pictures.
// Plain JS, no libraries, no requests beyond the site's own art (site/img/art, made by tools/site_art.js from the game's art).
// World units are the game's playroom: 1000 x 600, feet y 450..596 (SR_ROOM.floor in game/src/30_shelter.js).
// prefers-reduced-motion: no animation at all (the static scene in the HTML stays, no falling leaves, the peeking dogs just sit there).
(function () {
  'use strict';
  var motion = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var phone = !!(window.matchMedia && matchMedia('(max-width: 700px)').matches);
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  // v2.14: a translated page carries its barks in <script type="application/json" id="dd-i18n"> (tools/site_i18n.js); English needs none
  var T = {}; try { T = JSON.parse(document.getElementById('dd-i18n').textContent) || {}; } catch (e) { T = {}; }
  var tr = function (k, en) { return typeof T[k] === 'string' && T[k] ? T[k] : en; };

  // ---- the season by the date in Japan (JST = UTC+9)
  var month = new Date(Date.now() + 9 * 3600e3).getUTCMonth() + 1;
  var season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  var fuji = document.getElementById('fujiImg');
  if (fuji && season !== 'autumn') fuji.src = '/img/art/fuji-' + season + '.webp';

  var sheet = document.querySelector('.sheet'), root = document.documentElement;
  // the side gutters: the desk to the left and right of the paper sheet (px); decoration lives there, behind the sheet's edge, or nowhere
  var gutter = function () { if (!sheet) return 0; var r = sheet.getBoundingClientRect(); return Math.max(0, Math.min(r.left, root.clientWidth - r.right)); };

  // ---- a few falling momiji (every season; spring mixes in sakura). They fall behind the paper (site/style.css z-index), through the gutters where
  // there is room, a few times, then stop
  var petals = document.getElementById('petals');
  if (petals && motion) {
    var g0 = gutter(), W0 = root.clientWidth;
    for (var i = 0, n = phone ? 4 : 7; i < n; i++) {
      var p = document.createElement('img');
      p.className = 'petal'; p.alt = ''; p.src = '/img/art/' + (season === 'spring' && i % 2 ? 'sakura' : 'momiji') + '.svg';
      var sz = rnd(16, 26), x = g0 >= 60 ? (i % 2 ? rnd(4, g0 - sz - 30) : W0 - g0 + rnd(4, g0 - sz - 30)) : rnd(0.02, 0.94) * W0;
      p.style.cssText = 'left:' + x.toFixed(0) + 'px;width:' + sz.toFixed(0) + 'px;height:' + sz.toFixed(0) + 'px;animation-duration:' + rnd(13, 22).toFixed(1) + 's;animation-delay:' + rnd(0, 12).toFixed(1) + 's;animation-iteration-count:' + (2 + (i % 2));
      petals.appendChild(p);
    }
  }

  // ---- the decoration (#deco, behind the sheet): crayon dogs peeking round the paper and still momiji in the margins.
  // Wide gutters (desktop): heads lean out from behind the sheet's left and right edges, two to five down the page. Narrow (phones): one small head
  // peeks up from the bottom edge of the page, under the footer, where there is no text; two leaves tucked under the sheet's edges.
  var PEEKS = ['dachs', 'shiba', 'corgi', 'golden', 'pug', 'samoyed', 'beagle', 'husky', 'frenchie', 'chihuahua'];
  var deco = document.getElementById('deco'), items = [], wide = null;
  function decoBuild() {
    deco.textContent = ''; items = []; wide = gutter() >= 84;
    var r = sheet.getBoundingClientRect(), keys = PEEKS.slice().sort(function () { return Math.random() - 0.5; });
    var n = wide ? Math.max(2, Math.min(5, Math.round(r.height / 650))) : 1, side = Math.random() < 0.5 ? -1 : 1;
    for (var i = 0; i < n; i++) {
      var im = document.createElement('img'); im.className = 'peek' + (wide ? '' : ' pb'); im.alt = ''; im.src = '/img/art/peek/' + keys[i] + '.svg'; im.width = 100; im.height = 100;
      var it = { el: im, kind: wide ? 'side' : 'bottom', side: side, at: (i + 0.5) / n + rnd(-0.12, 0.12) / n, rot: wide ? side * rnd(10, 20) : rnd(-6, 6) };
      im.style.setProperty('--r', it.rot.toFixed(1) + 'deg'); im.style.setProperty('--d', (0.6 + i * 0.5 + rnd(0, 0.6)).toFixed(2) + 's');
      im.style.setProperty('--hx', wide ? (side < 0 ? '62%' : '-62%') : '0px'); im.style.setProperty('--hy', wide ? '0px' : '70%');
      deco.appendChild(im); items.push(it); side = -side;
    }
    for (var j = 0, m = wide ? 4 : 2; j < m; j++) {
      var lf = document.createElement('img'); lf.className = 'leaf'; lf.alt = ''; lf.src = '/img/art/momiji.svg'; lf.width = 32; lf.height = 32;
      var lt = { el: lf, kind: 'leaf', side: j % 2 ? 1 : -1, at: wide ? (j + rnd(0.25, 0.75)) / m : rnd(0.15, 0.85), tuck: !wide || Math.random() < 0.5, out: rnd(0.15, 0.8), size: wide ? rnd(22, 32) : 22 };
      lf.style.setProperty('--r', rnd(-70, 70).toFixed(0) + 'deg'); lf.style.width = lf.style.height = lt.size.toFixed(0) + 'px';
      deco.appendChild(lf); items.push(lt);
    }
    decoPlace();
  }
  function decoPlace() {
    var r = sheet.getBoundingClientRect(), sy = window.scrollY || 0, top = r.top + sy, H = r.height, docH = document.body.offsetHeight, foot = document.querySelector('.foot');
    var footBottom = foot ? foot.getBoundingClientRect().bottom + sy : 0;
    var peeks = items.filter(function (x) { return x.kind === 'side'; }).map(function (x) { return top + 140 + x.at * Math.max(0, H - 300); });
    items.forEach(function (it) {
      var e = it.el, x, y, s;
      if (it.kind === 'side') {
        s = Math.max(72, Math.min(110, gutter() * 0.9)); y = top + 140 + it.at * Math.max(0, H - 300) - s / 2;
        x = it.side < 0 ? r.left - s * 0.62 : r.right - s * 0.38;
      } else if (it.kind === 'bottom') { // the bottom of the page, under the footer; only when nothing is there
        s = 64; y = docH - s * 0.6; x = root.clientWidth - s - 22;
        e.hidden = y < footBottom + 4;
      } else { // a leaf: tucked under the sheet's edge, or loose in a wide gutter, away from the peeking heads
        s = it.size; y = top + 60 + it.at * Math.max(0, H - 120);
        for (var k = 0; k < peeks.length; k++) if (Math.abs(peeks[k] - y) < 90) y = peeks[k] + (y < peeks[k] ? -95 : 95);
        var g = gutter();
        x = it.tuck ? (it.side < 0 ? r.left - s * 0.55 : r.right - s * 0.45) : (it.side < 0 ? r.left - s - 6 - it.out * Math.max(0, g - s - 16) : r.right + 6 + it.out * Math.max(0, g - s - 16));
      }
      e.style.width = e.style.height = s.toFixed(0) + 'px'; e.style.left = x.toFixed(0) + 'px'; e.style.top = y.toFixed(0) + 'px';
    });
  }
  if (deco && sheet) {
    var lastW = 0, tid = 0;
    var relayout = function () { var w = root.clientWidth; if (w !== lastW) { lastW = w; if ((gutter() >= 84) !== wide) decoBuild(); else decoPlace(); } else decoPlace(); };
    var start = function () { lastW = root.clientWidth; decoBuild(); };
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
    window.addEventListener('resize', function () { clearTimeout(tid); tid = setTimeout(relayout, 150); });
    if ('ResizeObserver' in window) new ResizeObserver(function () { if (items.length) decoPlace(); }).observe(document.body);
  }

  // ---- /dogs: a tap on a dog's picture makes it wiggle (hover does it too, site/style.css); not with reduced motion
  if (motion) document.addEventListener('click', function (e) {
    var pic = e.target.closest && e.target.closest('.pics, .dognav a img, .dcard .dimg, .abdog');
    if (!pic) return;
    pic.classList.remove('wig'); void pic.offsetWidth; pic.classList.add('wig');
    setTimeout(function () { pic.classList.remove('wig'); }, 700);
  });

  // ---- the live playroom
  var scene = document.getElementById('scene'), stage = document.getElementById('stage');
  if (!scene || !stage || !motion) return;
  var KEYS = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle', 'poodle', 'collie', 'samoyed', 'frenchie'];
  // energy, zoomies and ball speed from the game's personality table (V210.md 5.1); the bark is a short line in the dog's voice
  var P = {
    shiba: [0.6, 0.4, 1.0, 'heh.'], corgi: [0.7, 0.5, 0.9, 'snack?'], golden: [0.8, 0.3, 1.15, 'BALL!'], dachs: [0.5, 0.2, 0.8, 'pet me?'],
    husky: [0.9, 0.6, 1.05, 'AWOO!'], mutt: [0.6, 0.3, 1.0, '♥'], chihuahua: [0.7, 0.4, 0.85, 'ワン！'], pug: [0.2, 0.1, 0.7, 'snort.'],
    greyhound: [0.3, 0.9, 1.4, 'zoom!'], beagle: [0.7, 0.3, 0.95, 'sniff sniff'], poodle: [0.6, 0.2, 1.0, 'ta-da!'], collie: [0.9, 0.4, 1.2, 'everyone, here!'],
    samoyed: [0.7, 0.5, 0.95, ':)'], frenchie: [0.35, 0.5, 0.8, 'snort!']
  };
  var STEAL = { shiba: 0.3, corgi: 0.15, golden: 0.05, dachs: 0.2, husky: 0.3, mutt: 0.1, chihuahua: 0.3, pug: 0.1, greyhound: 0.05, beagle: 0.25, poodle: 0.05, collie: 0.1, samoyed: 0.15, frenchie: 0.3 }; // V210.md 5.1 steal
  var POSES = ['walk', 'jump', 'sit', 'happy', 'sniff', 'sleep'];
  var X0 = phone ? 210 : 70, X1 = phone ? 790 : 930, Y0 = 462, Y1 = 590, BASKET = [868, 404], FRONT = [500, 584];
  var N_DOGS = phone ? 5 : 8, N_BALLS = phone ? 2 : 3, MAX_BALLS = 4;
  var scaleAt = function (y) { return (0.5 + (y - 450) / 146 * 0.22) * (phone ? 1.25 : 1.05); }; // a little bigger than the game's playroom (srScale), more on phones
  var clampX = function (x) { return Math.max(X0, Math.min(X1, x)); }, clampY = function (y) { return Math.max(Y0, Math.min(Y1, y)); };
  var dist2 = function (ax, ay, bx, by) { var dx = ax - bx, dy = (ay - by) * 1.6; return Math.sqrt(dx * dx + dy * dy); };

  // the static dogs and ball leave; the live ones come in (a random few each visit)
  Array.prototype.forEach.call(stage.querySelectorAll('.dd, .ball'), function (e) { e.remove(); });
  var keys = KEYS.slice().sort(function () { return Math.random() - 0.5; }).slice(0, N_DOGS);
  var balls = [], dogs = keys.map(function (key, i) {
    var el = document.createElement('div'); el.className = 'dd'; el.dataset.key = key;
    var imgs = {};
    POSES.forEach(function (pose) { var im = document.createElement('img'); im.src = '/img/art/dogs/' + key + '-' + (pose === 'sleep' ? 'sleep' : pose) + '.svg'; im.alt = ''; im.width = 240; im.height = 200; im.hidden = true; el.appendChild(im); imgs[pose] = im; });
    stage.appendChild(el);
    var x = X0 + (X1 - X0) * (i + 0.5) / keys.length + rnd(-25, 25), y = rnd(Y0 + 10, Y1);
    var p = P[key], d = { key: key, el: el, imgs: imgs, x: x, y: y, face: Math.random() < 0.5 ? 1 : -1, pose: '', lift: 0, task: null, p: p,
      want: Math.min(0.95, 0.2 + 0.55 * p[0] + 0.25 * (p[2] - 0.7)), fav: i % MAX_BALLS, steal: STEAL[key] || 0.1 };
    setPose(d, 'happy'); idle(d, 'happy', rnd(0.4, 2)); return d;
  });
  var k = 1, last = 0, running = false, raf = 0, catches = 0, steals = 0;

  function setPose(d, pose) { if (d.pose === pose) return; if (d.pose) d.imgs[d.pose].hidden = true; d.imgs[pose].hidden = false; d.pose = pose; }
  function idle(d, pose, dur) { d.task = { kind: 'idle', pose: pose, t: 0, dur: dur }; }
  function walkTo(d, x, y, speed, run, then) { d.task = { kind: 'walk', x: clampX(x), y: clampY(y), speed: speed, run: run, t: 0, then: then }; }
  function hop(d, n) { d.task = { kind: 'hop', t: 0, dur: 0.55, n: n || 1, dx: rnd(-40, 40) }; }
  function busy(d) { return d.task && (d.task.kind === 'carry' || d.task.kind === 'chase' || d.task.kind === 'steal'); }
  var talking = 0;
  function bark(d, text) {
    if (talking >= (phone ? 1 : 2)) return; // a bubble or two at a time, so they never pile up
    talking++; setTimeout(function () { talking--; }, 1700);
    var b = document.createElement('span'); b.className = 'bark'; b.textContent = text || tr('bark.' + d.key, d.p[3]);
    var s = scaleAt(d.y); b.style.transform = 'translate(' + (d.x * k) + 'px,' + ((d.y - 175 * s) * k) + 'px) translate(-50%,-100%)';
    stage.appendChild(b); setTimeout(function () { b.remove(); }, 1700);
  }
  function heart(d) {
    var h = document.createElement('span'); h.className = 'heart'; h.textContent = '♥';
    var s = scaleAt(d.y); h.style.transform = 'translate(' + ((d.x + rnd(-20, 20)) * k) + 'px,' + ((d.y - 150 * s) * k) + 'px)';
    stage.appendChild(h); setTimeout(function () { h.remove(); }, 1200);
  }
  // what a dog does next, weighted by its personality; a keen dog may go after a ball lying about
  function next(d) {
    var e = d.p[0], z = d.p[1], free = open();
    if (free.length && Math.random() < d.want * 0.2) { chase(d, pickBall(d, free)); return; }
    var near = dogs.filter(function (o) { return o !== d && dist2(o.x, o.y, d.x, d.y) < 110; }).length;
    if (near >= 2) { walkTo(d, d.x < 500 ? rnd(X0, d.x - 60) : rnd(d.x + 60, X1), rnd(Y0, Y1), 90 + e * 60, false); return; } // too crowded: wander off
    var w = [['walk', 0.35], ['zoom', z * 0.3], ['hop', 0.08 + e * 0.1], ['sit', (1 - e) * 0.45], ['nap', (1 - e) * 0.3], ['sniff', d.key === 'beagle' ? 0.45 : 0.14], ['happy', 0.14]];
    var tot = w.reduce(function (a, b) { return a + b[1]; }, 0), r = Math.random() * tot, c = w[0][0];
    for (var i = 0; i < w.length; i++) { r -= w[i][1]; if (r <= 0) { c = w[i][0]; break; } }
    if (c === 'walk') walkTo(d, d.x + rnd(-240, 240), d.y + rnd(-60, 60), 80 + e * 70, false);
    else if (c === 'zoom') walkTo(d, d.x < 500 ? rnd(650, X1) : rnd(X0, 350), rnd(Y0, Y1), 240 + z * 120, true, function () { if (Math.random() < 0.5) hop(d, 1); });
    else if (c === 'hop') hop(d, Math.random() < 0.4 ? 2 : 1);
    else if (c === 'sit') idle(d, 'sit', rnd(2, 5));
    else if (c === 'nap') idle(d, 'sleep', rnd(4, 9));
    else if (c === 'sniff') idle(d, 'sniff', rnd(1.5, 3));
    else { idle(d, 'happy', rnd(1.2, 2.2)); if (Math.random() < 0.35) bark(d); }
  }

  // ---- the balls: where one will land, which one a dog wants, throwing
  function landing(b) { var a = b.arcs[b.arcs.length - 1]; return a ? [a.x1, a.y1] : [b.x, b.y]; }
  function pickBall(d, list) { // the nearest landing spot, with its favourite colour counting as a bit closer
    var best = null, bd = 1e9;
    list.forEach(function (b) { var l = landing(b), dd = dist2(d.x, d.y, l[0], l[1]) * (b.n === d.fav ? 0.7 : 1); if (dd < bd) { bd = dd; best = b; } });
    return best;
  }
  function chase(d, b) { if (b) d.task = { kind: 'chase', ball: b, t: -rnd(0, 0.35), look: 0 }; }
  function chasers(b) { return dogs.filter(function (d) { return d.task && (d.task.kind === 'chase' || d.task.kind === 'steal') && d.task.ball === b; }).length; }
  function open() { return balls.filter(function (b) { return !b.holder && chasers(b) < 2; }); } // free balls with room for another chaser (two at most)
  function newBall() {
    var el = document.createElement('img'); el.className = 'ball b' + balls.length; el.src = '/img/art/ball.svg'; el.alt = ''; el.width = 60; el.height = 60;
    stage.appendChild(el);
    var b = { n: balls.length, el: el, x: BASKET[0], y: BASKET[1], h: 70, arcs: [], holder: null, rest: 0 }; balls.push(b); return b;
  }
  // throw ball b (from where it is, or from the toy basket) to (tx, ty); the dogs that feel like it give chase
  function toss(b, tx, ty) {
    if (b.holder) { idle(b.holder, 'happy', 0.6); b.holder = null; }
    var sx = b.x, sy = b.y, h0 = Math.max(b.h, 40);
    tx = clampX(tx == null ? rnd(X0 + 40, X1 - 120) : tx); ty = clampY(ty == null ? rnd(Y0 + 10, Y1 - 10) : ty);
    var bx = clampX(tx + (tx - sx) * 0.18), by = clampY(ty + rnd(-8, 8));
    b.h = h0; b.rest = rnd(7, 11);
    b.arcs = [{ x0: sx, y0: sy, h0: h0, x1: tx, y1: ty, H: 170, T: 0.85, t: 0 }, { x0: tx, y0: ty, h0: 0, x1: bx, y1: by, H: 34, T: 0.38, t: 0 }];
    dogs.forEach(function (d) {
      if (busy(d) && !(d.task.kind === 'chase' && d.task.ball === b)) return;
      if (d.pose === 'sleep' && Math.random() < 0.8) return; // a napping dog mostly naps on
      var o = open(); if (o.length && Math.random() < d.want) chase(d, pickBall(d, o));
      else if (Math.random() < 0.4) idle(d, 'sit', rnd(1.5, 3)); // just watches
    });
    return b;
  }
  // a tap or the button: another ball while there are fewer than MAX_BALLS, else the nearest free one goes again
  function throwOne(tx, ty) {
    if (balls.length < MAX_BALLS) return toss(newBall(), tx, ty);
    var free = balls.filter(function (b) { return !b.holder; }), b = null, bd = 1e9;
    (free.length ? free : balls).forEach(function (x) { var dd = tx == null ? Math.random() : dist2(x.x, x.y, tx, ty); if (dd < bd) { bd = dd; b = x; } });
    return toss(b, tx, ty);
  }

  function step(d, dt) {
    var T = d.task; T.t += dt; d.lift = 0;
    if (T.kind === 'idle') { setPose(d, T.pose); if (T.t >= T.dur) next(d); return; }
    if (T.kind === 'hop') {
      setPose(d, 'jump'); var f = Math.min(1, T.t / T.dur);
      d.lift = Math.sin(f * Math.PI) * 38; d.x = clampX(d.x + T.dx * dt / T.dur); if (T.dx) d.face = T.dx > 0 ? 1 : -1;
      if (f >= 1) { if (--T.n > 0) { T.t = 0; T.dx = rnd(-40, 40); } else idle(d, Math.random() < 0.5 ? 'happy' : 'sit', rnd(0.6, 1.6)); }
      return;
    }
    var tx, ty, speed, run = false, b = T.ball;
    if (T.kind === 'walk') { tx = T.x; ty = T.y; speed = T.speed; run = T.run; }
    else if (T.kind === 'chase') {
      if (T.t < 0) return;
      if (b.holder) { // someone got there first: try to steal it, go for another ball, or let it go
        if (b.holder !== d && Math.random() < d.steal * 0.6 && steals * 3 < catches + 1) { d.task = { kind: 'steal', ball: b, t: 0 }; return; }
        var others = open();
        if (others.length && Math.random() < d.want) { chase(d, pickBall(d, others)); return; }
        idle(d, Math.random() < 0.5 ? 'happy' : 'sit', rnd(0.8, 2)); if (Math.random() < 0.25) bark(d, pick([tr('aww', 'aww.'), tr('next_time', 'next time!'), tr('woof', 'ワン！')])); return;
      }
      if ((T.look += dt) > 0.4) { // a closer ball? switch
        T.look = 0; var alt = pickBall(d, open());
        if (alt && alt !== b) { var la = landing(alt), lb = landing(b); if (dist2(d.x, d.y, la[0], la[1]) < dist2(d.x, d.y, lb[0], lb[1]) * 0.6) { T.ball = b = alt; if (Math.random() < 0.3) bark(d, tr('ooh', 'ooh!')); } }
      }
      var l = b.arcs.length ? landing(b) : [b.x, b.y];
      tx = l[0] - d.face * 30 * scaleAt(d.y); ty = l[1]; speed = 230 * d.p[2] * (0.7 + 0.3 * d.p[0]); run = true;
      if (b.h < 14 && Math.abs(b.x - d.x) < 46 && Math.abs(b.y - d.y) < 26) { // got it: trot it back to the front and drop it
        b.holder = d; b.arcs = []; b.h = 0; catches++;
        d.task = { kind: 'carry', ball: b, x: clampX(rnd(X0 + 40, X1 - 40)), y: clampY(FRONT[1] - rnd(0, 24)), t: 0 }; bark(d, pick([tr('got_it', 'got it!'), tr('mine', 'mine!'), tr('bark.' + d.key, d.p[3])])); // back to the front, anywhere along it
        return;
      }
    } else if (T.kind === 'steal') { // run at the carrier; close enough and the ball changes mouths
      if (b.holder === d) { d.task = { kind: 'carry', ball: b, x: clampX(rnd(X0 + 40, X1 - 40)), y: clampY(rnd(Y0 + 20, Y1)), t: 0 }; return; }
      if (!b.holder || T.t > 4) { idle(d, 'happy', rnd(0.6, 1.4)); return; }
      var v = b.holder; tx = v.x - d.face * 30 * scaleAt(v.y); ty = v.y; speed = 260 * d.p[2]; run = true;
      if (Math.abs(v.x - d.x) < 50 && Math.abs(v.y - d.y) < 28) {
        b.holder = d; steals++; idle(v, 'sit', rnd(1.2, 2.2)); bark(v, pick([tr('hey', 'hey!'), tr('my_ball', 'my ball!')])); bark(d, tr('hehe', 'hehe.'));
        d.task = { kind: 'carry', ball: b, x: clampX(d.x < 500 ? rnd(560, X1) : rnd(X0, 440)), y: clampY(rnd(Y0 + 20, Y1)), t: 0 };
        return;
      }
    } else if (T.kind === 'carry') { if (b.holder !== d) { idle(d, 'happy', 0.8); return; } tx = T.x; ty = T.y; speed = 130; }
    var dx = tx - d.x, dy = ty - d.y, dd = Math.sqrt(dx * dx + dy * dy);
    if (dd < 4) {
      if (T.kind === 'walk') { if (T.then) { var fn = T.then; idle(d, 'happy', 0.5); fn(); } else idle(d, Math.random() < 0.5 ? 'sniff' : 'happy', rnd(0.6, 1.8)); }
      else if (T.kind === 'carry') { b.holder = null; b.x = d.x + d.face * 44 * scaleAt(d.y); b.y = d.y; b.h = 0; b.rest = rnd(0.8, 1.6); idle(d, 'sit', rnd(1.2, 2.5)); if (Math.random() < 0.6) heart(d); }
      return;
    }
    setPose(d, 'walk');
    if (Math.abs(dx) > 3) d.face = dx > 0 ? 1 : -1;
    var mv = Math.min(dd, speed * dt); d.x += dx / dd * mv; d.y += dy / dd * mv;
    if (run) d.lift = Math.abs(Math.sin(T.t * 14)) * 7;
  }
  function stepBall(b, dt) {
    if (b.holder) { var d = b.holder, s = scaleAt(d.y); b.x = d.x + d.face * 66 * s; b.y = d.y; b.h = 70 * s + d.lift; return; }
    var a = b.arcs[0];
    if (a) {
      a.t += dt; var f = Math.min(1, a.t / a.T);
      b.x = a.x0 + (a.x1 - a.x0) * f; b.y = a.y0 + (a.y1 - a.y0) * f; b.h = a.h0 * (1 - f) + 4 * a.H * f * (1 - f);
      if (f >= 1) b.arcs.shift();
      return;
    }
    b.h = 0; b.rest -= dt; if (b.rest <= 0) toss(b); // dropped at the front (or left lying): it gets thrown again
  }
  function render() {
    dogs.forEach(function (d) {
      var s = scaleAt(d.y);
      d.el.style.transform = 'translate3d(' + (d.x * k).toFixed(1) + 'px,' + ((d.y - d.lift) * k).toFixed(1) + 'px,0) translate(-50%,-93%) scale(' + s.toFixed(3) + ')';
      d.el.style.zIndex = Math.round(d.y);
      var flip = d.face < 0; if (flip !== d.el.classList.contains('flip')) d.el.classList.toggle('flip', flip);
    });
    balls.forEach(function (b) {
      var bs = 0.75 + (b.y - 450) / 146 * 0.35;
      b.el.style.transform = 'translate3d(' + (b.x * k).toFixed(1) + 'px,' + ((b.y - b.h) * k).toFixed(1) + 'px,0) translate(-50%,-92%) scale(' + bs.toFixed(3) + ')';
      b.el.style.zIndex = b.holder ? Math.round(b.holder.y) + 1 : Math.round(b.y) + (b.h > 20 ? 600 : 1);
    });
  }
  function frame(t) {
    var dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    dogs.forEach(function (d) { step(d, dt); }); balls.forEach(function (b) { stepBall(b, dt); }); render();
    raf = running ? requestAnimationFrame(frame) : 0;
  }
  function measure() { k = stage.clientWidth / 1000; }
  function setRun(on) { if (on === running) return; running = on; last = 0; if (on && !raf) raf = requestAnimationFrame(frame); }
  // where a tap lands, in world units
  function worldAt(ev) { var r = stage.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * 1000, (ev.clientY - r.top) / r.height * 600]; }

  for (var i = 0; i < N_BALLS; i++) { var b0 = newBall(); b0.x = rnd(X0 + 60, X1 - 60); b0.y = rnd(Y0 + 20, Y1); b0.h = 0; b0.rest = 1.5 + i * 2.5; }
  measure(); render(); scene.classList.add('live');
  window.addEventListener('resize', function () { measure(); render(); });
  var visible = true, onScreen = true;
  var sync = function () { setRun(visible && onScreen); };
  document.addEventListener('visibilitychange', function () { visible = !document.hidden; sync(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { onScreen = es[es.length - 1].isIntersecting; sync(); }).observe(scene);
  sync();
  // tap a dog to pet it; tap the floor to throw a ball there (another one, up to four)
  scene.addEventListener('click', function (ev) {
    var w = worldAt(ev), best = null, bd = 1e9;
    dogs.forEach(function (d) { var s = scaleAt(d.y), dx = w[0] - d.x, dy = w[1] - (d.y - 70 * s); var dd = Math.sqrt(dx * dx + dy * dy); if (dd < 90 * s && dd < bd) { bd = dd; best = d; } });
    if (best) { balls.forEach(function (b) { if (b.holder === best) { b.holder = null; b.h = 0; b.rest = rnd(1, 2); } }); idle(best, 'happy', 1.8); heart(best); if (Math.random() < 0.5) bark(best); return; }
    throwOne(w[0], Math.max(Y0, w[1]));
  });
  // owner: no button; now and then a ball flies in by itself (while the scene is on screen and running)
  setInterval(function () { if (running && Math.random() < 0.6) throwOne(); }, 7000);
  window.__dd = { dogs: dogs, balls: balls, max: MAX_BALLS, throwOne: throwOne, tr: tr, running: function () { return running; }, stats: function () { return { catches: catches, steals: steals }; } };
})();

// owner (site v3.1): the Dogs page opens each profile in a pop-up; the long list below is hidden when this runs
(function () {
  var nav = document.querySelector('.dognav'); if (!nav || !window.HTMLDialogElement) return;
  document.documentElement.classList.add('js');
  var dlg = document.createElement('dialog'); dlg.className = 'dogpop';
  var x = document.createElement('button'); x.type = 'button'; x.className = 'chip x'; x.textContent = '✕'; x.setAttribute('aria-label', nav.getAttribute('data-close') || 'Close');
  x.addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); // a tap outside the card
  dlg.addEventListener('close', function () { if (location.hash) history.replaceState(null, '', location.pathname + location.search); });
  document.body.appendChild(dlg);
  function open(id) {
    var src = document.getElementById(id); if (!src || !src.classList.contains('prof')) return false;
    var c = src.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    var h = c.querySelector('h2'); if (h) { h.id = 'pop-h'; dlg.setAttribute('aria-labelledby', 'pop-h'); }
    dlg.textContent = ''; dlg.appendChild(x); dlg.appendChild(c);
    if (!dlg.open) dlg.showModal(); dlg.scrollTop = 0; return true;
  }
  nav.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    if (open(a.getAttribute('href').slice(1))) { e.preventDefault(); history.replaceState(null, '', '#' + a.getAttribute('href').slice(1)); }
  });
  if (location.hash) open(location.hash.slice(1));
})();

/* owner (site v3.2): the menu sticks to the top on every screen (on phones too: it no longer slides away while scrolling); once stuck it gets the small logo (.stuck) */
(function () {
  var h = document.getElementById('sitehead'), ticking = false; if (!h) return;
  function upd() { ticking = false; h.classList.toggle('stuck', h.getBoundingClientRect().top <= 1 && window.scrollY > 0); }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();

/* owner (site v3.2): the game plays right on the home page and starts by itself; the button makes it full screen.
   Not full screen, the game is drawn at the size it is made for and shrunk to fit the box (owner: in a small box its buttons and
   text looked too big next to the scene): 1280 px wide on computers, at least 390 px wide on phones. The browser maps taps and
   clicks into the shrunk frame, so the game itself never knows. */
(function () {
  var box = document.getElementById('gameframe'), btn = document.getElementById('fsbtn'), x = document.getElementById('fsx'),
      src = box && box.getAttribute('data-src'), f = null;
  if (!box) return;
  var root = document.documentElement, DESK = 1280, PHONE = 390;
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function isOn() { return !!fsEl() || box.classList.contains('fake'); }
  function fit() {
    if (!f) return;
    var w = box.clientWidth, h = box.clientHeight;
    if (isOn() || !w || !h) { f.style.width = f.style.height = f.style.transform = ''; return; }
    var v = w > 820 ? DESK : Math.max(w, PHONE), k = w / v; // more than 820 px: the game's computer layout, else its phone layout
    f.style.width = v + 'px'; f.style.height = (h / k) + 'px'; f.style.transform = k === 1 ? '' : 'scale(' + k + ')';
  }
  function load() {
    f = document.createElement('iframe');
    f.src = src; f.title = box.getAttribute('data-title') || 'Doodle Doggo'; f.setAttribute('allow', 'fullscreen; autoplay'); f.setAttribute('allowfullscreen', '');
    box.insertBefore(f, box.firstChild);
    fit();
  }
  function label() { btn.setAttribute('aria-pressed', isOn() ? 'true' : 'false'); fit(); }
  function fake(on) {
    box.classList.toggle('fake', on); root.classList.toggle('gamefs', on); label();
    if (on) { try { x.focus(); } catch (e) {} }
  }
  function enter() {
    var rq = box.requestFullscreen || box.webkitRequestFullscreen;
    if (!rq) return fake(true);
    try {
      var p = rq.call(box);
      if (p && p.catch) p.catch(function () { fake(true); });
    } catch (e) { fake(true); }
  }
  function leave() {
    if (box.classList.contains('fake')) return fake(false);
    var ex = document.exitFullscreen || document.webkitExitFullscreen;
    if (fsEl() && ex) { try { var p = ex.call(document); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  }
  load();
  if (window.ResizeObserver) new ResizeObserver(fit).observe(box); else window.addEventListener('resize', fit);
  btn.addEventListener('click', function () { isOn() ? leave() : enter(); });
  x.addEventListener('click', leave);
  document.addEventListener('fullscreenchange', label);
  document.addEventListener('webkitfullscreenchange', label);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('fake')) fake(false); });
})();
