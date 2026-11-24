/* Doodle Doggo print page v1: #p=<one dog>&prod=tee|mug|stickers&col=<colour>&pose=stand|sit|happy&n=0|1 -> one print SVG at the product's exact
   pixel size in <div id="o">, nothing else. A headless browser screenshots it (viewport = the product's size, or half of it at deviceScaleFactor 2,
   transparent background) to make the print file. A bad link draws nothing; the title says READY or ERR. No network calls (the page's CSP allows none). */
(function () {
  'use strict';
  var o = document.getElementById('o'), d = document.documentElement;
  var r = window.PawPrint ? window.PawPrint.printFromHash(location.hash) : { ok: false, err: 'no PawPrint' };
  if (!r.ok) { o.textContent = ''; d.setAttribute('data-state', 'err'); document.title = 'ERR ' + r.err; return; }
  var dpr = window.devicePixelRatio || 1; // the SVG fills exactly w x h device pixels: at deviceScaleFactor 2 that is w/2 x h/2 CSS px
  o.innerHTML = r.svg; o.style.width = (r.w / dpr) + 'px'; o.style.height = (r.h / dpr) + 'px';
  d.setAttribute('data-w', r.w); d.setAttribute('data-h', r.h); d.setAttribute('data-art', window.PawPrint.ART_VER); d.setAttribute('data-state', 'ready');
  document.title = 'READY ' + r.w + 'x' + r.h;
})();
