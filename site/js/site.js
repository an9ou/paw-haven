// doodledoggo.app v2: the live Shelter Playroom on the home page, the seasonal leaves and the Mt. Fuji Lookout season.
// Plain JS, no libraries, no requests beyond the site's own art (site/img/art, made by tools/site_art.js from the game's art).
// World units are the game's playroom: 1000 x 600, feet y 450..596 (SR_ROOM.floor in game/src/30_shelter.js).
// prefers-reduced-motion: no animation at all (the static scene in the HTML stays, no leaves).
(function () {
  'use strict';
  var motion = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var phone = !!(window.matchMedia && matchMedia('(max-width: 700px)').matches);
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  // ---- the season by the date in Japan (JST = UTC+9)
  var month = new Date(Date.now() + 9 * 3600e3).getUTCMonth() + 1;
  var season = month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
  var fuji = document.getElementById('fujiImg');
  if (fuji && season !== 'autumn') fuji.src = '/img/art/fuji-' + season + '.webp';

  // ---- a few falling momiji (autumn) or sakura (spring); they fall a few times, then stop
  var petals = document.getElementById('petals');
  if (petals && motion && (season === 'autumn' || season === 'spring')) {
    for (var i = 0, n = phone ? 4 : 7; i < n; i++) {
      var p = document.createElement('img');
      p.className = 'petal'; p.alt = ''; p.src = '/img/art/' + (season === 'autumn' ? 'momiji' : 'sakura') + '.svg';
      var sz = rnd(16, 26);
      p.style.cssText = 'left:' + rnd(2, 94).toFixed(1) + '%;width:' + sz.toFixed(0) + 'px;height:' + sz.toFixed(0) + 'px;animation-duration:' + rnd(13, 22).toFixed(1) + 's;animation-delay:' + rnd(0, 12).toFixed(1) + 's;animation-iteration-count:' + (2 + (i % 2));
      petals.appendChild(p);
    }
  }

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
  var POSES = ['walk', 'jump', 'sit', 'happy', 'sniff'];
  var X0 = phone ? 210 : 70, X1 = phone ? 790 : 930, Y0 = 462, Y1 = 590, BASKET = [868, 404];
  var scaleAt = function (y) { return (0.5 + (y - 450) / 146 * 0.22) * (phone ? 1.3 : 1.12); }; // a little bigger than the game's playroom (srScale), more on phones
  var clampX = function (x) { return Math.max(X0, Math.min(X1, x)); }, clampY = function (y) { return Math.max(Y0, Math.min(Y1, y)); };

  // the static dogs leave; the live ones come in (a random few of the 14 each visit)
  Array.prototype.forEach.call(stage.querySelectorAll('.dd'), function (e) { e.remove(); });
  var ballEl = stage.querySelector('.ball');
  var keys = KEYS.slice().sort(function () { return Math.random() - 0.5; }).slice(0, phone ? 4 : 5);
  var dogs = keys.map(function (key, i) {
    var el = document.createElement('div'); el.className = 'dd'; el.dataset.key = key;
    var imgs = {};
    POSES.forEach(function (pose) { var im = document.createElement('img'); im.src = '/img/art/dogs/' + key + '-' + pose + '.svg'; im.alt = ''; im.width = 240; im.height = 200; im.hidden = true; el.appendChild(im); imgs[pose] = im; });
    stage.appendChild(el);
    var x = X0 + (X1 - X0) * (i + 0.5) / keys.length + rnd(-30, 30), y = rnd(Y0 + 10, Y1);
    var d = { key: key, el: el, imgs: imgs, x: x, y: y, face: Math.random() < 0.5 ? 1 : -1, pose: '', lift: 0, task: null, p: P[key] };
    setPose(d, 'happy'); idle(d, 'happy', rnd(0.4, 2)); return d;
  });
  var ball = { x: 340, y: 560, h: 0, arcs: [], holder: null, wait: rnd(3, 5) };
  var k = 1, last = 0, running = false, raf = 0;

  function setPose(d, pose) { if (d.pose === pose) return; if (d.pose) d.imgs[d.pose].hidden = true; d.imgs[pose].hidden = false; d.pose = pose; }
  function idle(d, pose, dur) { d.task = { kind: 'idle', pose: pose, t: 0, dur: dur }; }
  function walkTo(d, x, y, speed, run, then) { d.task = { kind: 'walk', x: clampX(x), y: clampY(y), speed: speed, run: run, t: 0, then: then }; }
  function hop(d, n) { d.task = { kind: 'hop', t: 0, dur: 0.55, n: n || 1, dx: rnd(-40, 40) }; }
  function bark(d, text) {
    var b = document.createElement('span'); b.className = 'bark'; b.textContent = text || d.p[3];
    var s = scaleAt(d.y); b.style.transform = 'translate(' + (d.x * k) + 'px,' + ((d.y - 175 * s) * k) + 'px) translate(-50%,-100%)';
    stage.appendChild(b); setTimeout(function () { b.remove(); }, 1700);
  }
  function heart(d) {
    var h = document.createElement('span'); h.className = 'heart'; h.textContent = '♥';
    var s = scaleAt(d.y); h.style.transform = 'translate(' + ((d.x + rnd(-20, 20)) * k) + 'px,' + ((d.y - 150 * s) * k) + 'px)';
    stage.appendChild(h); setTimeout(function () { h.remove(); }, 1200);
  }
  // what a dog does next, weighted by its personality
  function next(d) {
    var e = d.p[0], z = d.p[1];
    var w = [['walk', 0.35], ['zoom', z * 0.3], ['hop', 0.08 + e * 0.1], ['sit', (1 - e) * 0.5], ['sniff', d.key === 'beagle' ? 0.45 : 0.14], ['happy', 0.14]];
    var tot = w.reduce(function (a, b) { return a + b[1]; }, 0), r = Math.random() * tot, c = w[0][0];
    for (var i = 0; i < w.length; i++) { r -= w[i][1]; if (r <= 0) { c = w[i][0]; break; } }
    if (c === 'walk') walkTo(d, d.x + rnd(-240, 240), d.y + rnd(-60, 60), 80 + e * 70, false);
    else if (c === 'zoom') walkTo(d, d.x < 500 ? rnd(650, X1) : rnd(X0, 350), rnd(Y0, Y1), 240 + z * 120, true, function () { if (Math.random() < 0.5) hop(d, 1); });
    else if (c === 'hop') hop(d, Math.random() < 0.4 ? 2 : 1);
    else if (c === 'sit') idle(d, 'sit', rnd(2, 5));
    else if (c === 'sniff') idle(d, 'sniff', rnd(1.5, 3));
    else { idle(d, 'happy', rnd(1.2, 2.2)); if (Math.random() < 0.35) bark(d); }
  }
  // throw the ball from the toy basket to (tx, ty); the dogs that feel like it give chase
  function toss(tx, ty) {
    if (ball.holder) { idle(ball.holder, 'happy', 0.6); ball.holder = null; } // the carrier lets go
    var sx = ball.arcs.length ? ball.x : BASKET[0], sy = ball.arcs.length ? ball.y : BASKET[1];
    tx = clampX(tx == null ? rnd(X0 + 40, X1 - 160) : tx); ty = clampY(ty == null ? rnd(Y0 + 10, Y1 - 10) : ty);
    var bx = clampX(tx + (tx - sx) * 0.18), by = clampY(ty + rnd(-8, 8));
    ball.x = sx; ball.y = sy; ball.h = 70;
    ball.arcs = [{ x0: sx, y0: sy, h0: 70, x1: tx, y1: ty, H: 170, T: 0.85, t: 0 }, { x0: tx, y0: ty, h0: 0, x1: bx, y1: by, H: 34, T: 0.38, t: 0 }];
    ball.wait = rnd(10, 15);
    dogs.forEach(function (d) {
      if (d.key === 'pug' && Math.random() < 0.5) { bark(d); return; } // a pug may watch instead
      d.task = { kind: 'chase', t: -rnd(0, 0.3) }; // a moment to react
    });
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
    var tx, ty, speed, run = false;
    if (T.kind === 'walk') { tx = T.x; ty = T.y; speed = T.speed; run = T.run; }
    else if (T.kind === 'chase') {
      if (T.t < 0) return;
      if (ball.holder) { idle(d, 'happy', rnd(0.8, 1.6)); return; }
      tx = ball.x - d.face * 30 * scaleAt(d.y); ty = ball.y; speed = 230 * d.p[2] * (0.7 + 0.3 * d.p[0]); run = true;
      if (!ball.arcs.length || ball.h < 14) {
        if (Math.abs(ball.x - d.x) < 46 && Math.abs(ball.y - d.y) < 26) { // got it
          ball.holder = d; ball.arcs = []; ball.h = 0;
          dogs.forEach(function (o) { if (o !== d && o.task && o.task.kind === 'chase') { idle(o, Math.random() < 0.5 ? 'happy' : 'sit', rnd(0.8, 2)); if (Math.random() < 0.3) bark(o, pick(['aww.', 'next time!', 'ワン！'])); } });
          d.task = { kind: 'carry', x: clampX(rnd(X0 + 40, X1 - 40)), y: clampY(rnd(Y0 + 30, Y1)), t: 0 }; bark(d, pick(['got it!', 'mine!', d.p[3]]));
          return;
        }
      }
    } else if (T.kind === 'carry') { if (ball.holder !== d) { idle(d, 'happy', 0.8); return; } tx = T.x; ty = T.y; speed = 120; }
    var dx = tx - d.x, dy = ty - d.y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 4) {
      if (T.kind === 'walk') { if (T.then) { var fn = T.then; idle(d, 'happy', 0.5); fn(); } else idle(d, Math.random() < 0.5 ? 'sniff' : 'happy', rnd(0.6, 1.8)); }
      else if (T.kind === 'carry') { ball.holder = null; ball.x = d.x + d.face * 44 * scaleAt(d.y); ball.y = d.y; ball.h = 0; idle(d, 'sit', rnd(1.5, 3)); if (Math.random() < 0.6) heart(d); }
      return;
    }
    setPose(d, 'walk');
    if (Math.abs(dx) > 3) d.face = dx > 0 ? 1 : -1;
    var mv = Math.min(dist, speed * dt); d.x += dx / dist * mv; d.y += dy / dist * mv;
    if (run) d.lift = Math.abs(Math.sin(T.t * 14)) * 7;
  }
  function stepBall(dt) {
    if (ball.holder) { var d = ball.holder, s = scaleAt(d.y); ball.x = d.x + d.face * 66 * s; ball.y = d.y; ball.h = 70 * s + d.lift; return; }
    var a = ball.arcs[0];
    if (a) {
      a.t += dt; var f = Math.min(1, a.t / a.T);
      ball.x = a.x0 + (a.x1 - a.x0) * f; ball.y = a.y0 + (a.y1 - a.y0) * f; ball.h = a.h0 * (1 - f) + 4 * a.H * f * (1 - f);
      if (f >= 1) ball.arcs.shift();
      return;
    }
    ball.h = 0; ball.wait -= dt; if (ball.wait <= 0) toss();
  }
  function render() {
    dogs.forEach(function (d) {
      var s = scaleAt(d.y);
      d.el.style.transform = 'translate3d(' + (d.x * k).toFixed(1) + 'px,' + ((d.y - d.lift) * k).toFixed(1) + 'px,0) translate(-50%,-93%) scale(' + s.toFixed(3) + ')';
      d.el.style.zIndex = Math.round(d.y);
      var flip = d.face < 0; if (flip !== d.el.classList.contains('flip')) d.el.classList.toggle('flip', flip);
    });
    if (ballEl) {
      var bs = 0.75 + (ball.y - 450) / 146 * 0.35;
      ballEl.style.transform = 'translate3d(' + (ball.x * k).toFixed(1) + 'px,' + ((ball.y - ball.h) * k).toFixed(1) + 'px,0) translate(-50%,-92%) scale(' + bs.toFixed(3) + ')';
      ballEl.style.zIndex = ball.holder ? Math.round(ball.holder.y) + 1 : Math.round(ball.y) + (ball.h > 20 ? 600 : 1);
    }
  }
  function frame(t) {
    var dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016); last = t;
    dogs.forEach(function (d) { step(d, dt); }); stepBall(dt); render();
    raf = running ? requestAnimationFrame(frame) : 0;
  }
  function measure() { k = stage.clientWidth / 1000; }
  function setRun(on) { if (on === running) return; running = on; last = 0; if (on && !raf) raf = requestAnimationFrame(frame); }
  // where a tap lands, in world units
  function worldAt(ev) { var r = stage.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * 1000, (ev.clientY - r.top) / r.height * 600]; }

  measure(); render(); scene.classList.add('live');
  window.addEventListener('resize', function () { measure(); render(); });
  var visible = true, onScreen = true;
  var sync = function () { setRun(visible && onScreen); };
  document.addEventListener('visibilitychange', function () { visible = !document.hidden; sync(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { onScreen = es[es.length - 1].isIntersecting; sync(); }).observe(scene);
  sync();
  // tap a dog to pet it; tap the floor to throw the ball there
  scene.addEventListener('click', function (ev) {
    var w = worldAt(ev), best = null, bd = 1e9;
    dogs.forEach(function (d) { var s = scaleAt(d.y), dx = w[0] - d.x, dy = w[1] - (d.y - 70 * s); var dd = Math.sqrt(dx * dx + dy * dy); if (dd < 90 * s && dd < bd) { bd = dd; best = d; } });
    if (best) { if (ball.holder === best) { ball.holder = null; ball.h = 0; } idle(best, 'happy', 1.8); heart(best); if (Math.random() < 0.5) bark(best); return; }
    toss(w[0], Math.max(Y0, w[1]));
  });
  var btn = document.getElementById('toss');
  if (btn) { btn.hidden = false; btn.addEventListener('click', function () { toss(); }); }
  window.__dd = { dogs: dogs, ball: ball, toss: toss, running: function () { return running; } };
})();
