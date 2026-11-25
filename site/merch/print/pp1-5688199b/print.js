/* Doodle Doggo print page v1: #p=<one dog>&prod=tee|mug&col=<colour>&pose=stand|sit|happy&n=0|1&av=<ART_VER> -> one print SVG at the product's
   exact pixel size in <div id="o">, nothing else. A headless browser screenshots it (viewport = the product's size, or half of it at
   deviceScaleFactor 2, transparent background) to make the print file. Every key is required (PawPrint.printFromHash). A bad link, a link from
   another build (av) or a viewport that does not give exactly the file's pixels draws nothing. The title says what was drawn, for the
   screenshot taker to compare with the order before it saves anything: 'READY tee-navy-stand-n1 4500x5400 pp1-xxxxxxxx', or 'ERR <why>'.
   No network calls (the page's CSP allows none). */
(function () {
  'use strict';
  var o = document.getElementById('o'), d = document.documentElement, P = window.PawPrint;
  var err = function (why) { o.textContent = ''; d.setAttribute('data-state', 'err'); document.title = 'ERR ' + why; };
  var r = P ? P.printFromHash(location.hash) : { ok: false, err: 'no PawPrint' };
  if (!r.ok) return err(r.err);
  var dpr = window.devicePixelRatio || 1; // the SVG fills exactly w x h device pixels: at deviceScaleFactor 2 that is w/2 x h/2 CSS px
  if (window.innerWidth * dpr !== r.w || window.innerHeight * dpr !== r.h) return err('viewport ' + window.innerWidth + 'x' + window.innerHeight + '@' + dpr + ' is not ' + r.w + 'x' + r.h);
  o.innerHTML = r.svg; o.style.width = (r.w / dpr) + 'px'; o.style.height = (r.h / dpr) + 'px';
  d.setAttribute('data-w', r.w); d.setAttribute('data-h', r.h); d.setAttribute('data-art', P.ART_VER); d.setAttribute('data-state', 'ready');
  document.title = 'READY ' + r.id + ' ' + r.w + 'x' + r.h + ' ' + P.ART_VER;
})();
