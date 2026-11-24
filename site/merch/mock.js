/* Doodle Doggo /merch: the product mock-ups, pencil line drawings in the site's sketchbook style (no photos, no other brand's marks).
   The print itself is never redrawn here: the exact SVG string PawPrint.print() returned is laid on the product, inside one
   <g class="pp-print"> that only moves and scales it, so what the buyer sees is the file that prints.
   Every fill uses the same path as its outline, so no colour leaves its line. No network, no storage. -> window.MerchMock */
(function (G) {
  'use strict';
  var INK = '#5B3D32';
  function f(n) { return Math.round(n * 10) / 10; }
  function rng(seed) { var x = seed >>> 0 || 1; return function () { x = (x * 1103515245 + 12345) >>> 0; return x / 4294967296; }; }
  // a hand-drawn closed path through points: each side bows a little, the corners stay put
  function wob(pts, seed, j) {
    var r = rng(seed), d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]), n = pts.length;
    for (var i = 1; i <= n; i++) {
      var a = pts[i - 1], b = pts[i % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
      var o = (r() - 0.5) * j * Math.min(1, L / 40);
      d += 'Q' + f(mx - dy / L * o) + ' ' + f(my + dx / L * o) + ' ' + f(b[0]) + ' ' + f(b[1]);
    }
    return d + 'Z';
  }
  function qpts(a, c, b, n) { var p = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; p.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return p; }
  function lum(hex) { var n = parseInt(String(hex).slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function line(pts, col, w, op) { return '<path d="M' + pts.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (op ? ' opacity="' + op + '"' : '') + '/>'; }
  // the print, untouched, placed at (x, y) and scaled to w units wide (its own width and height come from its root tag)
  function lay(print, x, y, w) {
    var m = /^<svg [^>]*width="(\d+)" height="(\d+)"/.exec(print || ''); if (!m) return '';
    return '<g class="pp-print" transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + (w / +m[1]).toFixed(6) + ')">' + print + '</g>';
  }

  // a tee, size L, flat: 22 in across the body, 10 units an inch; Printful's 15 x 18 in print area starts 3.5 in under the collar
  // (tools/merch_render.js teeTile; to be checked with a sample). viewBox 340 x 312
  var TEE = (function () {
    var u = 10, cx = 170, top = 15, P = function (x, y) { return [cx + x * u, top + y * u]; };
    var neck = qpts(P(-4, 0), P(0, 1.6), P(4, 0), 6);
    var body = neck.concat([P(11, 1.5), P(16, 7), P(12.5, 10), P(11, 8.5), P(11, 29), P(-11, 29), P(-11, 8.5), P(-12.5, 10), P(-16, 7), P(-11, 1.5)]);
    return { u: u, cx: cx, top: top, body: body, collar: qpts(P(-4, 0), P(0, 2.4), P(4, 0), 6), area: [cx - 7.5 * u, top + 3.5 * u, 15 * u, 18 * u],
      hems: [[P(15.2, 8), P(12, 10.6)], [P(-15.2, 8), P(-12, 10.6)], [P(-10.9, 28), P(10.9, 28)]], folds: [[P(-8, 19), P(-7.7, 25)], [P(8.2, 17), P(7.9, 22)]] };
  })();
  function tee(o) {
    var c = o.hex || '#FFFFFF', dark = lum(c) < 0.45, d = wob(TEE.body, 11, 2.2), dc = dark ? 'rgba(255,251,243,.55)' : INK, a = TEE.area;
    var s = '<svg class="mock mock-tee" viewBox="0 0 340 312" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(o.label || 'A tee') + '">';
    s += '<path d="' + d + '" fill="' + c + '"/>';
    s += '<path d="' + wob(TEE.body, 77, 3.4) + '" fill="none" stroke="' + INK + '" stroke-width="1" opacity=".3" stroke-linejoin="round"/>';
    s += line(TEE.collar, dc, 2) + TEE.hems.map(function (h) { return line(h, dc, 1.6); }).join('') + TEE.folds.map(function (h) { return line(h, dc, 1.2, 0.35); }).join('');
    s += lay(o.print, a[0], a[1], a[2]);
    if (o.area) s += '<rect class="mock-area" x="' + a[0] + '" y="' + a[1] + '" width="' + a[2] + '" height="' + a[3] + '" fill="none" stroke="#E07A93" stroke-width="1" stroke-dasharray="4 4"/>';
    s += '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>';
    return s + '</svg>';
  }

  // an 11 oz mug from the front, handle right: the front face shows the left half of the 9 x 3.5 in wrap (one face of the two)
  // body 70 units = 4.5 in, so 15.6 units an inch. viewBox 140 x 104
  function mug(o) {
    var k = 70 / 4.5, body = [[30, 22]].concat(qpts([30, 22], [65, 25], [100, 22], 6).slice(1)).concat([[99, 82]]).concat(qpts([99, 82], [65, 89], [31, 82], 6).slice(1));
    var d = wob(body, 42, 1.4), rim = [], inn = [], i, t;
    for (i = 0; i < 24; i++) { t = i / 24 * Math.PI * 2; rim.push([65 + Math.cos(t) * 35, 22 + Math.sin(t) * 4.6]); }
    for (i = 0; i < 20; i++) { t = i / 20 * Math.PI * 2; inn.push([65 + Math.cos(t) * 31, 22.6 + Math.sin(t) * 3.2]); }
    var hand = 'M99 33Q121 32 121 52Q121 72 98 72';
    var s = '<svg class="mock mock-mug" viewBox="0 0 140 104" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(o.label || 'A mug') + '">';
    s += '<path d="' + hand + '" fill="none" stroke="' + INK + '" stroke-width="7.4" stroke-linecap="round"/><path d="' + hand + '" fill="none" stroke="#FFFFFF" stroke-width="4.4" stroke-linecap="round"/>';
    s += '<path d="' + d + '" fill="#FFFFFF"/>';
    // the wrap is 9 in wide: the face shows 4.5 in of it, from 0 to the middle; its top 0.35 in under the rim
    s += '<svg x="30" y="22" width="70" height="66" viewBox="30 22 70 66" overflow="hidden">' + lay(o.print, 30, 26.5, 9 * k) + '</svg>';
    s += '<path d="M33 24Q33 80 35 81M95 24Q97 80 95 81" fill="none" stroke="' + INK + '" stroke-width=".8" opacity=".18"/>';
    s += '<path d="' + wob(rim, 43, 1) + '" fill="#F4EFE6"/><path d="' + wob(inn, 44, 0.8) + '" fill="#E9DFD1"/>';
    s += '<path d="' + wob(inn, 44, 0.8) + '" fill="none" stroke="' + INK + '" stroke-width="1" opacity=".5"/><path d="' + wob(rim, 43, 1) + '" fill="none" stroke="' + INK + '" stroke-width="1.8"/>';
    s += '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>';
    return s + '</svg>';
  }

  // the print file on its own, at its real proportions: a tee file is clear where nothing prints (a soft check shows that), a mug wrap is white
  function flat(o) {
    var m = /^<svg [^>]*width="(\d+)" height="(\d+)"/.exec(o.print || ''); if (!m) return '';
    var w = +m[1], h = +m[2], W = 600, H = Math.round(W * h / w), bg = o.product === 'mug' ? '<rect width="' + W + '" height="' + H + '" fill="#FFFFFF"/>' :
      '<rect width="' + W + '" height="' + H + '" fill="' + (o.hex || '#FFFFFF') + '" opacity="' + (o.hex && o.hex !== '#FFFFFF' ? 1 : 0) + '"/>';
    var s = '<svg class="mock mock-flat" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(o.label || 'The print file') + '">' + bg + lay(o.print, 0, 0, W);
    if (o.product === 'mug') s += '<path d="M' + W / 2 + ' 8V' + (H - 8) + '" stroke="#C9B48F" stroke-width="1.5" stroke-dasharray="6 6"/>';
    return s + '<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" fill="none" stroke="' + INK + '" stroke-width="1.5" stroke-dasharray="6 5"/></svg>';
  }

  // a dog drawing cropped to what is drawn (PawPrint.printArt's box), for the pose buttons and the dog cards
  function dog(svg, box) {
    if (!svg) return '';
    var vb = box ? box.map(function (n) { return f(n); }).join(' ') : '0 0 240 200';
    return svg.replace(/^<svg [^>]*>/, '<svg class="dogpic" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">');
  }

  G.MerchMock = { tee: tee, mug: mug, flat: flat, dog: dog, lum: lum, esc: esc };
})(typeof self !== 'undefined' ? self : this);
