// The product drawings (pencil line art in the site's style) and the print design (the dog, an optional yard, an optional name).
// Every fill uses the same path as its outline, so no colour ever leaves its line. No network, no libraries.
(function () {
  'use strict';
  var INK = '#5B3D32';
  var uid = 0;
  function rng(seed) { var x = seed >>> 0 || 1; return function () { x = (x * 1103515245 + 12345) >>> 0; return x / 4294967296; }; }
  function f(n) { return Math.round(n * 10) / 10; }
  // a hand-drawn closed path through points: each side bows a little, corners stay put
  function wob(pts, seed, j, open) {
    var r = rng(seed), d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]), n = pts.length;
    for (var i = 1; i <= (open ? n - 1 : n); i++) {
      var a = pts[i - 1], b = pts[i % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      var o = (r() - 0.5) * j * Math.min(1, L / 40);
      d += 'Q' + f(mx - dy / L * o) + ' ' + f(my + dx / L * o) + ' ' + f(b[0]) + ' ' + f(b[1]);
    }
    return d + (open ? '' : 'Z');
  }
  // points along a quadratic curve
  function qpts(a, c, b, n) { var p = []; for (var i = 0; i <= n; i++) { var t = i / n, u = 1 - t; p.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return p; }
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
  // a filled shape: colour, crayon hatching (inside: same path), the ink line and a lighter second pencil pass
  function shape(pts, col, seed, o) {
    o = o || {};
    var d = wob(pts, seed, o.j || 3), d2 = wob(pts, seed + 99, (o.j || 3) * 1.4), id = 'h' + (++uid);
    var dark = lum(col) < 0.45;
    return '<path d="' + d + '" fill="' + col + '"/>' +
      '<path d="' + d + '" fill="url(#' + (dark ? 'hatd' : 'hat') + ')"/>' +
      '<path d="' + d2 + '" fill="none" stroke="' + INK + '" stroke-width="1.3" opacity=".35" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (o.w || 3.2) + '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  function line(pts, seed, col, w, op) { return '<path d="' + wob(pts, seed, 2, true) + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (w || 2.4) + '" stroke-linecap="round" stroke-linejoin="round"' + (op ? ' opacity="' + op + '"' : '') + '/>'; }
  var DEFS = '<defs><pattern id="hat" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 4.5h9" stroke="rgba(91,61,50,.07)" stroke-width="3"/></pattern><pattern id="hatd" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 4.5h9" stroke="rgba(255,255,255,.07)" stroke-width="3"/></pattern></defs>';
  function mix(a, b, t) { var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), c = function (s) { return Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); }; return 'rgb(' + c(16) + ',' + c(8) + ',' + c(0) + ')'; }
  function detail(col) { return lum(col) < 0.45 ? 'rgba(255,255,255,.45)' : INK; }

  // ---- the products, all in a 400 x 440 box; pa = the print area [x, y, w, h] in that box
  var P = {};
  P.tee = { pa: [136, 108, 128, 149], draw: function (c) {
    var neck = qpts([160, 56], [200, 94], [240, 56], 8);
    var pts = neck.concat([[300, 68], [380, 134], [344, 176], [314, 152], [318, 400], [82, 400], [86, 152], [56, 176], [20, 134], [100, 68]]);
    var dc = detail(c);
    return shape(pts, c, 11) + line(qpts([168, 60], [200, 86], [232, 60], 6), 12, dc, 2) + line([[368, 122], [332, 164]], 13, dc, 2) + line([[32, 122], [68, 164]], 14, dc, 2) + line([[85, 384], [315, 384]], 15, dc, 2) +
      line([[110, 290], [114, 350]], 16, dc, 1.4, .35) + line([[294, 270], [290, 330]], 17, dc, 1.4, .35);
  } };
  P.sweat = { pa: [140, 104, 120, 140], draw: function (c) {
    var neck = qpts([156, 52], [200, 88], [244, 52], 8);
    var pts = neck.concat([[304, 64], [350, 110], [386, 330], [386, 366], [346, 368], [340, 300], [318, 170], [322, 356], [322, 392], [78, 392], [78, 356], [82, 170], [60, 300], [54, 368], [14, 366], [14, 330], [50, 110], [96, 64]]);
    var dc = detail(c);
    return shape(pts, c, 21) + line(qpts([164, 56], [200, 80], [236, 56], 6), 22, dc, 2) + line([[346, 334], [386, 332]], 23, dc, 2) + line([[14, 332], [54, 334]], 24, dc, 2) +
      line([[79, 358], [321, 358]], 25, dc, 2) + [100, 125, 150, 175, 200, 225, 250, 275, 300].map(function (x, i) { return line([[x, 362], [x, 388]], 26 + i, dc, 1.2, .45); }).join('');
  } };
  P.hoodie = { pa: [146, 134, 108, 126], draw: function (c) {
    var dc = detail(c);
    var hood = qpts([110, 74], [100, 10], [200, 14], 6).concat(qpts([200, 14], [300, 10], [290, 74], 6).slice(1));
    var body = [[150, 52], [250, 52], [304, 64], [350, 110], [386, 330], [386, 366], [346, 368], [340, 300], [318, 170], [322, 356], [322, 392], [78, 392], [78, 356], [82, 170], [60, 300], [54, 368], [14, 366], [14, 330], [50, 110], [96, 64]];
    var inner = qpts([150, 52], [200, 132], [250, 52], 8).concat(qpts([250, 52], [200, 34], [150, 52], 6).slice(1, -1));
    return shape(hood, c, 31) + shape(body, c, 32) + shape(inner, mix(c, '#5B3D32', lum(c) < 0.45 ? 0.45 : 0.22), 33, { w: 2.6 }) +
      line([[186, 96], [183, 122]], 34, dc, 2.4) + line([[214, 96], [217, 122]], 35, dc, 2.4) + '<circle cx="183" cy="126" r="3.4" fill="' + dc + '"/><circle cx="217" cy="126" r="3.4" fill="' + dc + '"/>' +
      line([[102, 350], [122, 280], [278, 280], [298, 350]], 36, dc, 2, .9) + line([[346, 334], [386, 332]], 38, dc, 2) + line([[14, 332], [54, 334]], 39, dc, 2) + line([[79, 358], [321, 358]], 40, dc, 2);
  } };
  P.mug = { pa: [112, 140, 152, 152], draw: function (c) {
    var body = [[92, 100]].concat(qpts([92, 100], [190, 128], [288, 100], 8).slice(1)).concat([[284, 318]]).concat(qpts([284, 318], [190, 346], [96, 318], 8).slice(1));
    var rim = []; for (var i = 0; i < 24; i++) { var a = i / 24 * Math.PI * 2; rim.push([190 + Math.cos(a) * 98, 100 + Math.sin(a) * 18]); }
    var inn = []; for (i = 0; i < 20; i++) { a = i / 20 * Math.PI * 2; inn.push([190 + Math.cos(a) * 86, 101 + Math.sin(a) * 12]); }
    var handle = qpts([286, 140], [362, 136], [356, 214], 7).concat(qpts([356, 214], [350, 286], [284, 288], 7).slice(1)).concat([[285, 262]]).concat(qpts([285, 262], [328, 258], [330, 214], 6).slice(1)).concat(qpts([330, 214], [332, 166], [286, 166], 6).slice(1));
    return shape(handle, c, 41) + shape(body, c, 42) + shape(rim, c, 43, { w: 3 }) + shape(inn, '#EDE3D6', 44, { w: 2.2 });
  }, shade: function () {
    return '<path d="M92 100Q190 128 288 100L284 318Q190 346 96 318Z" fill="url(#mugsh)"/>';
  } };
  P.tote = { pa: [122, 204, 156, 156], draw: function (c) {
    var dc = detail(c);
    var hd = qpts([142, 146], [142, 28], [200, 28], 6).concat(qpts([200, 28], [258, 28], [258, 146], 6).slice(1)).concat([[240, 146]]).concat(qpts([240, 146], [240, 48], [200, 48], 5).slice(1)).concat(qpts([200, 48], [160, 48], [160, 146], 5).slice(1));
    return shape(hd, c, 51) + shape([[78, 140], [322, 140], [330, 426], [70, 426]], c, 52) + line([[80, 160], [320, 160]], 53, dc, 1.6, .7) +
      line([[136, 140], [140, 176]], 54, dc, 1.4, .5) + line([[164, 140], [160, 176]], 55, dc, 1.4, .5) + line([[236, 140], [240, 176]], 56, dc, 1.4, .5) + line([[264, 140], [260, 176]], 57, dc, 1.4, .5);
  } };
  P.stickers = { pa: [72, 36, 256, 366], draw: function () {
    return '<g transform="rotate(-2 200 220)">' + shape([[64, 28], [336, 30], [334, 410], [66, 408]], '#FFFFFF', 61, { w: 2.6 }) + '</g>';
  } };

  // ---- the print design, drawn into a w x h box (the print area's own shape)
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nameSize(name, w) { return Math.min(w * 0.19, (w * 1.75) / Math.max(4, name.length)); }
  function dogImg(src, x, y, w, h) { return '<image href="' + src + '" x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" preserveAspectRatio="xMidYMax meet"/>'; }
  function design(o, w, h) {
    // o: { dog: 'assets/dogs/x-stand.svg', yard: bool, name: '' (empty = no name), dark: bool }
    var s = '', pad = o.dark ? w * 0.06 : 0, iw = w - 2 * pad, ih = h - 2 * pad, nh = o.name ? ih * 0.17 : 0;
    var x0 = pad, y0 = pad, ah = ih - nh, id = 'c' + (++uid);
    if (o.dark) s += '<path d="' + wob([[4, 6], [w - 5, 3], [w - 3, h - 5], [6, h - 3]], 71, w * 0.03) + '" fill="#FFFBF3" stroke="' + INK + '" stroke-width="' + f(w * 0.012) + '"/>';
    if (o.yard) {
      var fx = x0 + iw * 0.03, fy = y0 + ah * 0.03, fw = iw * 0.94, fh = ah * 0.94, fr = wob([[fx, fy], [fx + fw, fy + 2], [fx + fw - 2, fy + fh], [fx + 1, fy + fh - 2]], 72, fw * 0.03);
      s += '<clipPath id="' + id + '"><path d="' + fr + '"/></clipPath><g clip-path="url(#' + id + ')"><image href="assets/img/yard.webp" x="' + f(fx - fw * 0.55) + '" y="' + f(fy - fh * 0.32) + '" width="' + f(fw * 1.9) + '" height="' + f(fh * 1.4) + '" preserveAspectRatio="xMidYMid slice"/></g>';
      s += '<path d="' + fr + '" fill="none" stroke="' + INK + '" stroke-width="' + f(Math.max(2, fw * 0.014)) + '" stroke-linejoin="round"/>';
      var dw = fw * 0.92, dh = Math.min(fh * 0.86, dw / 1.2);
      s += dogImg(o.dog, fx + (fw - dw) / 2, fy + fh - dh - fh * 0.02, dw, dh);
    } else {
      var dw2 = Math.min(iw, ah * 1.2), dh2 = dw2 / 1.2;
      s += dogImg(o.dog, x0 + (iw - dw2) / 2, y0 + (ah - dh2) / 2, dw2, dh2);
    }
    if (o.name) s += '<text x="' + f(w / 2) + '" y="' + f(y0 + ah + nh * 0.72) + '" text-anchor="middle" font-family="Caveat,\'Patrick Hand\',cursive" font-weight="700" font-size="' + f(nameSize(o.name, iw)) + '" fill="' + INK + '">' + esc(o.name) + '</text>';
    return s;
  }
  // the sticker sheet: three poses, two heads, a name label and three doodles, with dashed cut lines (580 x 830)
  function stickerSheet(o) {
    var s = '', cut = function (d) { return '<path d="' + d + '" fill="#fff" stroke="#E07A93" stroke-width="2.4" stroke-dasharray="7 6"/>'; };
    var blob = function (x, y, w, h, sd) { return wob([[x, y + h * .15], [x + w * .5, y], [x + w, y + h * .12], [x + w * 1.02, y + h * .6], [x + w * .8, y + h], [x + w * .2, y + h * 1.01], [x - w * .02, y + h * .6]], sd, 6); };
    s += cut(blob(26, 30, 320, 260, 81)) + dogImg(o.base + '-stand.svg', 36, 40, 300, 250);
    s += cut(blob(370, 54, 186, 186, 82)) + '<image href="' + o.base + '-head.svg" x="384" y="66" width="160" height="160"/>';
    s += cut(blob(26, 316, 250, 220, 83)) + dogImg(o.base + '-sit.svg', 36, 324, 230, 200);
    s += cut(blob(296, 300, 262, 236, 84)) + dogImg(o.base + '-happy.svg', 304, 310, 246, 212);
    var nm = o.name || 'good dog!';
    s += cut(wob([[70, 566], [510, 560], [516, 646], [64, 652]], 85, 8)) + '<text x="290" y="628" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="' + f(Math.min(70, 800 / Math.max(5, nm.length))) + '" fill="' + INK + '">' + esc(nm) + '</text>';
    s += cut(blob(36, 684, 130, 120, 86)) + '<image href="' + o.base + '-head.svg" x="46" y="690" width="110" height="110"/>';
    // heart, paw, bone doodles
    s += cut(blob(196, 696, 104, 98, 87)) + '<path d="M248 778C214 752 206 734 216 720c9-12 26-10 32 3 6-13 23-15 32-3 10 14 2 32-32 58z" fill="#F28FA5" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
    s += cut(blob(326, 694, 104, 102, 88)) + '<g fill="#C9A27A" stroke="' + INK + '" stroke-width="3.5"><ellipse cx="378" cy="764" rx="22" ry="17"/><ellipse cx="350" cy="736" rx="8" ry="10"/><ellipse cx="368" cy="722" rx="8" ry="10"/><ellipse cx="389" cy="722" rx="8" ry="10"/><ellipse cx="406" cy="737" rx="8" ry="10"/></g>';
    s += cut(blob(454, 700, 104, 92, 89)) + '<path d="M478 734c-10-8-2-20 8-14 4-8 16-6 14 4l30 10c6-8 18-4 14 6 10 4 6 18-4 14-4 8-16 6-14-4l-30-10c-6 8-18 4-14-6z" fill="#FFF4DF" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
    return s;
  }

  // the product with its design in the print area. o: { kind, colour, dog (base path without pose), pose, yard, name, showArea }
  function product(o) {
    var p = P[o.kind], c = o.colour || '#fff', pa = p.pa, dark = lum(c) < 0.45, s = '';
    s += '<svg class="prod" viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(o.label || o.kind) + '">' + DEFS +
      '<defs><linearGradient id="mugsh" x1="0" x2="1"><stop offset="0" stop-color="#5B3D32" stop-opacity=".16"/><stop offset=".22" stop-color="#5B3D32" stop-opacity="0"/><stop offset=".8" stop-color="#5B3D32" stop-opacity="0"/><stop offset="1" stop-color="#5B3D32" stop-opacity=".2"/></linearGradient></defs>';
    s += p.draw(c);
    if (o.kind === 'stickers') s += '<svg x="' + pa[0] + '" y="' + pa[1] + '" width="' + pa[2] + '" height="' + pa[3] + '" viewBox="0 0 580 830" preserveAspectRatio="xMidYMid meet"><g transform="rotate(-2 290 415)">' + stickerSheet({ base: o.dog, name: o.name }) + '</g></svg>';
    else s += '<svg x="' + pa[0] + '" y="' + pa[1] + '" width="' + pa[2] + '" height="' + pa[3] + '" viewBox="0 0 ' + pa[2] * 5 + ' ' + pa[3] * 5 + '">' + design({ dog: o.dog + '-' + (o.pose || 'stand') + '.svg', yard: o.yard, name: o.name, dark: dark }, pa[2] * 5, pa[3] * 5) + '</svg>';
    if (p.shade) s += p.shade();
    if (o.showArea) s += '<rect x="' + (pa[0] - 2) + '" y="' + (pa[1] - 2) + '" width="' + (pa[2] + 4) + '" height="' + (pa[3] + 4) + '" fill="none" stroke="#E07A93" stroke-width="1.6" stroke-dasharray="5 4"/>';
    return s + '</svg>';
  }
  // the print file on its own (the flat view): the same design at the print area's shape
  function flat(o) {
    var p = P[o.kind], pa = p.pa, dark = lum(o.colour || '#fff') < 0.45;
    if (o.kind === 'stickers') return '<svg class="file" viewBox="0 0 580 830" xmlns="http://www.w3.org/2000/svg">' + stickerSheet({ base: o.dog, name: o.name }) + '</svg>';
    if (o.kind === 'mug') { // the wrap: the same dog on both sides
      var one = design({ dog: o.dog + '-' + (o.pose || 'stand') + '.svg', yard: o.yard, name: o.name, dark: false }, 760, 760);
      return '<svg class="file" viewBox="0 0 1940 800" xmlns="http://www.w3.org/2000/svg"><g transform="translate(70 20)">' + one + '</g><g transform="translate(1110 20)">' + one + '</g><path d="M970 30v740" stroke="#C9B48F" stroke-dasharray="10 10" stroke-width="3"/></svg>';
    }
    return '<svg class="file" viewBox="0 0 ' + pa[2] * 5 + ' ' + pa[3] * 5 + '" xmlns="http://www.w3.org/2000/svg">' + design({ dog: o.dog + '-' + (o.pose || 'stand') + '.svg', yard: o.yard, name: o.name, dark: dark }, pa[2] * 5, pa[3] * 5) + '</svg>';
  }
  // a pose / background thumbnail (6:5)
  function thumb(o) { return '<svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + design({ dog: o.dog, yard: o.yard, name: '', dark: false }, 600, 500) + '</svg>'; }
  window.MerchArt = { product: product, flat: flat, thumb: thumb, lum: lum };
})();
