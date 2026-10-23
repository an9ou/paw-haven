// doodledoggo.app: the seasonal leaves and the Mt. Fuji Lookout season.
// Site v3 (every page): falling momiji behind the paper (sakura mixed in in spring), crayon dogs peeking round the paper sheet and a few still
// momiji in the margins (#deco), never over text; a wiggle on the /dogs pictures.
// Plain JS, no libraries, no requests beyond the site's own art (site/img/art, made by tools/site_art.js from the game's art).
// (v2.14: the live playroom scene is gone; the home page plays the game itself in an iframe of /play/.)
// prefers-reduced-motion: no animation at all (the static scene in the HTML stays, no falling leaves, the peeking dogs just sit there).
(function () {
  'use strict';
  var motion = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var phone = !!(window.matchMedia && matchMedia('(max-width: 700px)').matches);
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

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
  var nav = document.getElementById('sitenav'), was = false;
  // v2.14 fit: on a phone the stuck bar's tab strip may be wider than the bar (Thai at 360 px): it scrolls, shows a fade on the side that has more,
  // and starts with the current page in view
  function fades() {
    if (!nav) return;
    var max = nav.scrollWidth - nav.clientWidth, x = Math.abs(nav.scrollLeft);
    nav.classList.toggle('fade-r', max > 2 && x < max - 2); nav.classList.toggle('fade-l', max > 2 && x > 2);
  }
  // the small logo gives its room to the tabs when the labels of this language do not fit with it (class .nologo); the Home tab goes home too
  function fit() {
    if (!nav) return;
    h.classList.remove('nologo');
    if (h.classList.contains('stuck') && nav.scrollWidth > nav.clientWidth + 2) h.classList.add('nologo');
    if (nav.scrollWidth > nav.clientWidth + 2) {
      var cur = nav.querySelector('[aria-current]');
      if (cur) nav.scrollLeft += (cur.getBoundingClientRect().left + cur.offsetWidth / 2) - (nav.getBoundingClientRect().left + nav.clientWidth / 2);
    } else nav.scrollLeft = 0;
    fades();
  }
  function upd() {
    ticking = false; var on = h.getBoundingClientRect().top <= 1 && window.scrollY > 0;
    h.classList.toggle('stuck', on);
    if (on !== was) { was = on; fit(); }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  if (nav) { nav.addEventListener('scroll', fades, { passive: true }); window.addEventListener('resize', fit); }
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
    // v2.14.2: the game follows the site's language (/play/?lang=<the page's lang>)
    f.src = src + (src.indexOf('?') < 0 ? '?' : '&') + 'lang=' + encodeURIComponent(root.getAttribute('lang') || 'en'); f.title = box.getAttribute('data-title') || 'Doodle Doggo'; f.setAttribute('allow', 'fullscreen; autoplay'); f.setAttribute('allowfullscreen', '');
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
