/* Paw Haven v1.2: interactive toys module -> window.PawToys
   PawToys.supports(name) -> bool
   PawToys.open(el, name, ctx) -> controller { close() }
   ctx = { dog:{key,name,outfit}, time, weather, sfx, say, reward({happiness,bond,coins,energy}), onClose }
   Each toy is a short (20-60 s), mouse-driven, no-fail interaction rendered inside `el`
   on a fixed 1240x620 logical stage that is scaled to fit.
   Reward energy convention: negative = energy spent by play, positive = energy restored (Plush Bone nap). */
(function () {
  'use strict';

  var INK = '#5B3D32', PAPER = '#FFFBF3', PINK = '#F28FA5', MUTED = '#8A7468';
  var W = 1240, H = 620, GY = 540, DS = 1.15, G = 2300;
  var TOYS = ['Tennis Ball', 'Rope Tug', 'Squeaky Duck', 'Frisbee', 'Plush Bone', 'Puzzle Feeder', 'Driftwood Stick', 'Rubber Chicken', 'Glow Ball',
    'Snuffle Mat', 'Treat Cone', 'Squeaky Hedgehog', 'Bubble Machine', 'Paddling Pool', 'Agility Tunnel',
    'Squeaky Pumpkin', 'Plush Ghost', 'Bat-Wing Flyer', 'Trick-or-Treat Bucket'];
  var CAP = { happiness: 25, bond: 2, coins: 6 };

  /* ---------------- helpers ---------------- */
  function rng(seed) { var a = seed >>> 0 || 1; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f1(n) { return Math.round(n * 10) / 10; }
  function div(cls, parent, html) { var e = document.createElement('div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function realArt(s) { return typeof s === 'string' && s.indexOf('<svg') >= 0 && !/>\s*\?\s*<\/text>/.test(s); }
  function art(kind, name, opt) {
    try { var P = window.PawArt; if (!P || typeof P[kind] !== 'function') return null; var s = P[kind](name, opt); return realArt(s) ? s : null; } catch (e) { return null; }
  }

  /* wobbly pencil path through points (deterministic) */
  function wob(R, pts, amp, closed) {
    var d = 'M' + f1(pts[0][0] + (R() - 0.5) * amp) + ' ' + f1(pts[0][1] + (R() - 0.5) * amp);
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i - 1], q = pts[i], mx = (p[0] + q[0]) / 2 + (R() - 0.5) * amp * 1.6, my = (p[1] + q[1]) / 2 + (R() - 0.5) * amp * 1.6;
      d += ' Q' + f1(mx) + ' ' + f1(my) + ' ' + f1(q[0] + (R() - 0.5) * amp) + ' ' + f1(q[1] + (R() - 0.5) * amp);
    }
    return d + (closed ? 'Z' : '');
  }
  function pencil(R, pts, w, col, op, closed, fill) {
    var a = wob(R, pts, 2.2, closed), b = wob(R, pts, 2.6, closed);
    return (fill ? '<path d="' + a + '" fill="' + fill + '" stroke="none"/>' : '') +
      '<path d="' + a + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (w || 2.4) + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + (op == null ? 1 : op) + '"/>' +
      '<path d="' + b + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + ((w || 2.4) * 0.55) + '" stroke-linecap="round" opacity="' + ((op == null ? 1 : op) * 0.5) + '"/>';
  }
  function ell(cx, cy, rx, ry, n) { var p = []; n = n || 18; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }
  function rect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }

  /* ---------------- CSS ---------------- */
  var RAIN_TILE = 'url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="60" height="160"><g stroke="#7E9CC4" stroke-width="1.6" stroke-linecap="round" opacity=".7"><path d="M10 6l-5 24"/><path d="M38 40l-5 24"/><path d="M24 92l-5 24"/><path d="M52 118l-5 24"/><path d="M6 128l-4 18"/></g></svg>') + '")';
  var SNOW_TILE = 'url("data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="120"><g fill="#fff" stroke="#A8968A" stroke-width=".8"><circle cx="12" cy="14" r="3"/><circle cx="52" cy="40" r="2.4"/><circle cx="30" cy="76" r="3.2"/><circle cx="68" cy="98" r="2.6"/></g></svg>') + '")';
  var CSS = [
    '.pt-root{position:absolute;inset:0;overflow:hidden;background:radial-gradient(#E3D2BA 1.1px,transparent 1.6px) 0 0/22px 22px,#FFFBF3;user-select:none;-webkit-user-select:none;touch-action:none;font-family:"Patrick Hand","Trebuchet MS",sans-serif;color:#5B3D32;outline:none}',
    '.pt-stage{position:absolute;left:0;top:0;width:1240px;height:620px;transform-origin:0 0;overflow:hidden;border-radius:6px}',
    '.pt-layer{position:absolute;left:0;top:0;width:1240px;height:620px;pointer-events:none;overflow:hidden}',
    '.pt-layer>svg{display:block;width:1240px;height:620px}',
    '.pt-abs{position:absolute;left:0;top:0;will-change:transform}',
    '.pt-abs>svg,.pt-pose>svg{width:100%;height:100%;display:block;overflow:visible}',
    '.pt-pose{position:absolute;inset:0;display:none}.pt-pose.pt-on{display:block}',
    '.pt-fx{position:absolute;left:0;top:0;width:1240px;height:620px;pointer-events:none}',
    '.pt-ui{position:absolute;left:0;top:0;width:1240px;height:620px;pointer-events:none}',
    '.pt-hud{position:absolute;left:14px;right:14px;top:10px;height:62px;display:flex;align-items:center;gap:14px;padding:0 12px 0 10px;background:#FFFBF3;border:2.5px solid #5B3D32;border-radius:16px 11px 18px 10px/11px 17px 10px 15px;box-shadow:3px 4px 0 rgba(91,61,50,.16);pointer-events:auto}',
    '.pt-hud::before{content:"";position:absolute;left:46px;top:-10px;width:90px;height:20px;background:repeating-linear-gradient(45deg,rgba(242,143,165,.55) 0 6px,rgba(249,208,217,.7) 6px 12px);transform:rotate(-4deg)}',
    '.pt-ico{width:54px;height:54px;flex:none;transform:rotate(-6deg)}.pt-ico svg{width:100%;height:100%}',
    '.pt-titles{flex:1;min-width:0;line-height:1}',
    '.pt-title{font-family:"Caveat",cursive;font-weight:700;font-size:34px;white-space:nowrap}',
    '.pt-hint{font-size:19px;color:#8A7468;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pt-tally{font-family:"Caveat",cursive;font-weight:700;font-size:25px;display:flex;align-items:center;gap:5px;padding:0 10px 1px;background:#F9D0D9;border:2px solid #5B3D32;border-radius:12px 9px 13px 8px;white-space:nowrap}',
    '.pt-tally svg{width:20px;height:20px}',
    '.pt-timer{width:110px;flex:none;display:flex;flex-direction:column;gap:1px;font-size:14px;color:#8A7468;line-height:1}',
    '.pt-timer b{display:block;height:13px;border:2px solid #5B3D32;border-radius:8px 6px 9px 5px;overflow:hidden;background:#FFF4DF}',
    '.pt-timer i{display:block;height:100%;background:repeating-linear-gradient(-62deg,#86B3EA 0 2.2px,#C3DAF6 2.2px 4.4px);transform-origin:0 50%}',
    '.pt-btn{font-family:"Caveat",cursive;font-weight:700;font-size:27px;color:#5B3D32;background:#C8E9CF;border:2.5px solid #5B3D32;border-radius:14px 9px 15px 8px/9px 14px 8px 13px;padding:0 18px 3px;cursor:pointer;box-shadow:2px 3px 0 rgba(91,61,50,.25);line-height:1.15;pointer-events:auto;white-space:nowrap}',
    '.pt-btn:hover{transform:translateY(-1px) rotate(-1.5deg)}.pt-btn:active{transform:translateY(1px);box-shadow:1px 1px 0 rgba(91,61,50,.25)}',
    '.pt-btn:focus-visible{outline:2.5px dashed #F28FA5;outline-offset:3px}',
    '.pt-btn.pt-alt{background:#FFE3A1}.pt-btn.pt-pinkb{background:#F9D0D9}',
    '.pt-bubble{position:absolute;left:0;top:0;padding:4px 14px 6px;background:#FFFBF3;border:2.5px solid #5B3D32;border-radius:18px 14px 20px 12px/14px 20px 12px 18px;font-family:"Caveat",cursive;font-weight:700;font-size:27px;line-height:1.05;white-space:nowrap;box-shadow:2px 3px 0 rgba(91,61,50,.15);opacity:0;transition:opacity .15s;will-change:transform}',
    '.pt-bubble.pt-show{opacity:1}',
    '.pt-bubble::after{content:"";position:absolute;left:24px;bottom:-9px;width:14px;height:14px;background:#FFFBF3;border-right:2.5px solid #5B3D32;border-bottom:2.5px solid #5B3D32;transform:rotate(40deg) skewX(12deg)}',
    '.pt-bubble.pt-r::after{left:auto;right:24px}',
    '.pt-float{position:absolute;font-family:"Caveat",cursive;font-weight:700;font-size:40px;color:#F28FA5;-webkit-text-stroke:1.3px #5B3D32;white-space:nowrap;animation:pt-rise 1.4s ease-out forwards;pointer-events:none}',
    '.pt-float.pt-gold{color:#F2C744}.pt-float.pt-blue{color:#86B3EA}.pt-float.pt-small{font-size:30px}',
    '@keyframes pt-rise{0%{opacity:0;transform:translate(-50%,0) scale(.6) rotate(-6deg)}15%{opacity:1;transform:translate(-50%,-12px) scale(1.12) rotate(-3deg)}100%{opacity:0;transform:translate(-50%,-80px) scale(1) rotate(2deg)}}',
    '.pt-card{position:absolute;left:50%;top:52%;min-width:400px;max-width:560px;padding:20px 32px 20px;text-align:center;background:#FFFBF3;border:3px solid #5B3D32;border-radius:22px 14px 24px 12px/14px 24px 12px 22px;box-shadow:6px 7px 0 rgba(91,61,50,.2);pointer-events:auto;transform:translate(-50%,-50%) rotate(-1deg);animation:pt-pop .35s ease-out}',
    '.pt-card::before{content:"";position:absolute;left:50%;top:-12px;width:110px;height:24px;margin-left:-55px;background:repeating-linear-gradient(45deg,rgba(134,179,234,.5) 0 6px,rgba(203,224,244,.75) 6px 12px);transform:rotate(3deg)}',
    '@keyframes pt-pop{0%{opacity:0;transform:translate(-50%,-40%) scale(.85) rotate(-4deg)}100%{opacity:1;transform:translate(-50%,-50%) rotate(-1deg)}}',
    '.pt-card-t{font-family:"Caveat",cursive;font-weight:700;font-size:48px;line-height:1}',
    '.pt-card-s{font-size:21px;margin:6px 0 8px}',
    '.pt-card-r{font-family:"Caveat",cursive;font-weight:700;font-size:31px;color:#C2577A;margin-bottom:14px}',
    '.pt-panel{position:absolute;background:#FFFBF3;border:2.5px solid #5B3D32;border-radius:14px 10px 16px 9px/10px 15px 9px 14px;box-shadow:2px 3px 0 rgba(91,61,50,.15);padding:6px 12px;font-size:18px}',
    '.pt-lab{font-family:"Caveat",cursive;font-weight:700;font-size:24px;line-height:1}',
    '.pt-meter{position:relative;height:22px;border:2.5px solid #5B3D32;border-radius:11px 8px 12px 7px;background:#FFF4DF;overflow:hidden;margin-top:4px}',
    '.pt-meter i{position:absolute;left:0;top:0;bottom:0;width:100%;transform-origin:0 50%;background:repeating-linear-gradient(-62deg,#F28FA5 0 2.4px,#F9C4D0 2.4px 4.8px)}',
    '.pt-meter .pt-zone{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(-45deg,rgba(134,200,150,.65) 0 3px,rgba(200,233,207,.8) 3px 6px);border-left:2px dashed #5B3D32;border-right:2px dashed #5B3D32}',
    '.pt-meter .pt-over{position:absolute;top:0;bottom:0;right:0;background:repeating-linear-gradient(-45deg,rgba(242,143,165,.5) 0 3px,rgba(249,208,217,.7) 3px 6px)}',
    '.pt-meter .pt-needle{position:absolute;top:-3px;bottom:-3px;width:5px;margin-left:-2px;background:#5B3D32;border-radius:3px;will-change:transform}',
    '.pt-tip{position:absolute;font-family:"Caveat",cursive;font-weight:700;font-size:28px;color:#5B3D32;white-space:nowrap;animation:pt-bob .8s ease-in-out infinite alternate;pointer-events:none}',
    '@keyframes pt-bob{to{transform:translateY(-8px) rotate(-2deg)}}',
    '.pt-rain{position:absolute;pointer-events:none;background-image:' + RAIN_TILE + ';animation:pt-rain .55s linear infinite}',
    '.pt-snow{position:absolute;pointer-events:none;background-image:' + SNOW_TILE + ';animation:pt-snow 4s linear infinite}',
    '@keyframes pt-rain{from{background-position:0 0}to{background-position:-34px 160px}}',
    '@keyframes pt-snow{from{background-position:0 0}to{background-position:-20px 120px}}',
    '.pt-dot{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border:2.5px solid #5B3D32;border-radius:50%;background:#FFF4DF;transition:transform .12s,background .12s}',
    '.pt-dot.pt-lit{background:#F2C744;transform:scale(1.3)}.pt-dot.pt-you{background:#86B3EA}.pt-dot.pt-ok{background:#86C896}.pt-dot.pt-bad{background:#F28FA5}',
    '.pt-holelab{position:absolute;font-family:"Caveat",cursive;font-weight:700;font-size:23px;color:#FFF4DF;text-align:center;width:120px;margin-left:-60px;line-height:1;pointer-events:none;text-shadow:0 1px 0 #5B3D32}',
    '.pt-root{-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}',
    '.pt-dock,.pt-frame{display:none}',
    '.pt-phone .pt-hud{position:absolute;left:6px;right:6px;top:6px;height:46px;gap:6px;padding:0 6px;z-index:5;border-width:2px;box-shadow:2px 2px 0 rgba(91,61,50,.16)}',
    '.pt-phone .pt-hud::before{left:30px;width:56px;height:14px;top:-7px}',
    '.pt-phone .pt-ico{width:34px;height:34px}.pt-phone .pt-title{font-size:25px}.pt-phone .pt-hint{display:none}',
    '.pt-phone .pt-title.pt-long{font-size:19px;white-space:normal;line-height:.92;overflow-wrap:anywhere}',
    '.pt-phone .pt-tally{font-size:19px;padding:0 6px;gap:3px}.pt-phone .pt-tally svg{width:15px;height:15px}',
    '.pt-phone .pt-timer{width:48px}.pt-phone .pt-timer span{display:none}',
    '.pt-phone .pt-btn{min-height:44px;min-width:44px;font-size:24px;padding:0 14px 2px;touch-action:manipulation}',
    '.pt-phone .pt-frame{display:block;position:absolute;left:4px;right:4px;border:2.5px solid #5B3D32;border-radius:12px 9px 13px 8px;pointer-events:none;z-index:3;box-shadow:inset 0 0 0 3px rgba(255,251,243,.6)}',
    '.pt-phone .pt-dock{display:flex;flex-direction:column;gap:8px;position:absolute;left:0;right:0;bottom:0;padding:8px 10px calc(10px + env(safe-area-inset-bottom,0px));overflow-y:auto;z-index:4;background:radial-gradient(#E3D2BA 1.1px,transparent 1.6px) 0 0/22px 22px,#FFFBF3}',
    '.pt-phone .pt-dock>*{position:relative!important;left:auto!important;top:auto!important;width:auto!important}',
    '.pt-phone .pt-dock>.pt-btn{align-self:center}',
    '.pt-dhint{font-size:17px;color:#8A7468;text-align:center;line-height:1.25}',
    '.pt-phone .pt-card{position:absolute;min-width:0;width:86%;padding:16px 16px 14px;z-index:6}',
    '.pt-phone .pt-card-t{font-size:36px}.pt-phone .pt-card-s{font-size:17px}.pt-phone .pt-card-r{font-size:25px}',
    '@media (prefers-reduced-motion: reduce){.pt-rain,.pt-snow,.pt-tip{animation:none}}'
  ].join('\n');
  function injectCSS() {
    if (document.getElementById('pawtoys-css')) return;
    var s = document.createElement('style'); s.id = 'pawtoys-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  /* ---------------- own doodles (fallbacks) ---------------- */
  var HEART = '<svg viewBox="0 0 20 20"><path d="M10 17C4 12 1.5 9 2.5 6 3.5 3 7.5 2.6 10 6c2.5-3.4 6.5-3 7.5 0 1 3-1.5 6-7.5 11z" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  function ownItem(name) {
    var R = rng(name.length * 97 + 7), s = '';
    switch (name) {
      case 'Tennis Ball': s = pencil(R, ell(32, 33, 19, 19), 2.4, INK, 1, true, '#D9EC5E') + '<path d="M16 24c8 4 8 14 0 18M48 24c-8 4-8 14 0 18" fill="none" stroke="#fff" stroke-width="2.6"/>'; break;
      case 'Glow Ball': s = '<circle cx="32" cy="33" r="27" fill="#E8FFB0" opacity=".45"/>' + pencil(R, ell(32, 33, 18, 18), 2.4, INK, 1, true, '#C9F57A') + '<circle cx="26" cy="27" r="5" fill="#fff" opacity=".8"/>'; break;
      case 'Frisbee': s = pencil(R, ell(32, 32, 25, 25), 2.4, INK, 1, true, '#F28FA5') + pencil(R, ell(32, 32, 14, 14), 1.8, INK, 0.7, true, '#F9C4D0'); break;
      case 'Squeaky Duck': s = pencil(R, ell(30, 42, 21, 14), 2.4, INK, 1, true, '#FFD65A') + pencil(R, ell(40, 22, 11, 11), 2.4, INK, 1, true, '#FFD65A') + pencil(R, [[49, 22], [60, 25], [49, 28]], 2, INK, 1, true, '#F4A262') + '<circle cx="42" cy="19" r="2.2" fill="#5B3D32"/>'; break;
      case 'Rubber Chicken': s = pencil(R, [[10, 44], [24, 30], [44, 30], [54, 18], [60, 22], [52, 38], [40, 50], [18, 52]], 2.4, INK, 1, true, '#FFF1B8') + pencil(R, [[53, 17], [55, 9], [58, 14], [61, 9], [61, 18]], 2, INK, 1, true, '#E8504A') + pencil(R, [[60, 23], [64, 25], [60, 27]], 1.8, INK, 1, true, '#F4A262') + '<circle cx="56" cy="21" r="1.8" fill="#5B3D32"/>'; break;
      case 'Plush Bone': s = pencil(R, [[16, 26], [10, 20], [14, 12], [22, 16], [42, 16], [50, 12], [54, 20], [48, 26], [54, 34], [50, 42], [42, 38], [22, 38], [14, 42], [10, 34]], 2.4, INK, 1, true, '#FFF2DA') + '<path d="M22 27h20" stroke="#F28FA5" stroke-width="2" stroke-dasharray="3 3"/>'; break;
      case 'Driftwood Stick': s = pencil(R, [[6, 40], [30, 30], [58, 22], [60, 27], [32, 36], [8, 46]], 2.4, INK, 1, true, '#C9A27A') + pencil(R, [[30, 31], [36, 18]], 2, INK, 1); break;
      case 'Rope Tug': s = pencil(R, [[8, 34], [20, 28], [32, 34], [44, 28], [56, 34]], 7, '#E8504A', 1) + pencil(R, [[8, 34], [20, 28], [32, 34], [44, 28], [56, 34]], 2, INK, 1); break;
      case 'Snuffle Mat':
        s = pencil(R, [[10, 26], [54, 26], [61, 54], [3, 54]], 2.4, INK, 1, true, '#C8E9CF') + '<path d="M13 29H51L57 51H7z" fill="none" stroke="#F28FA5" stroke-width="1.4" stroke-dasharray="3 3"/>';
        [[18, 33, '#FFE07A'], [32, 33, '#F9D0D9'], [46, 33, '#BBD8EF'], [16, 45, '#F9D0D9'], [32, 45, '#FFE3A1'], [48, 45, '#E0D5F0']].forEach(function (f) { s += pencil(R, ell(f[0], f[1], 7.5, 3.6, 10), 1.4, INK, 1, true, f[2]); });
        s += '<circle cx="39" cy="30" r="2.6" fill="#C98B4E" stroke="#5B3D32" stroke-width="1.1"/>' + pencil(R, [[40, 18], [44, 14], [48, 18]], 1.4, INK, 0.7) + pencil(R, [[45, 11], [49, 7], [53, 11]], 1.4, INK, 0.5); break;
      case 'Treat Cone':
        s = pencil(R, [[18, 58], [46, 58], [43, 49], [45, 43], [40, 34], [42, 28], [37, 18], [27, 18], [22, 28], [24, 34], [19, 43], [21, 49]], 2.4, INK, 1, true, '#E8504A') +
          pencil(R, [[24, 52], [22, 45], [26, 36], [29, 26]], 2.4, '#F28FA5', 0.9) + pencil(R, [[21, 49], [43, 49]], 1.2, INK, 0.5) + pencil(R, [[24, 34], [40, 34]], 1.2, INK, 0.5) +
          pencil(R, [[24, 18], [27, 10], [32, 7], [38, 10], [41, 18], [37, 22], [32, 19], [27, 22]], 1.8, INK, 1, true, '#F4A262') + '<circle cx="35" cy="12" r="1.6" fill="#FFE3A1"/>'; break;
      case 'Squeaky Hedgehog':
        (function () { var sp = [[6, 50]]; for (var i = 0; i <= 12; i++) { var a = Math.PI * (1 + i / 12 * 0.8), rr = i % 2 ? 19 : 25; sp.push([28 + Math.cos(a) * rr * 1.05, 50 + Math.sin(a) * rr]); } sp.push([44, 49]); s = pencil(R, sp, 2.2, INK, 1, true, '#A0764E'); })();
        s += pencil(R, [[38, 28], [48, 32], [60, 40], [56, 46], [44, 50], [36, 46]], 2, INK, 1, true, '#FCD8BC') + '<circle cx="60" cy="40" r="2.6" fill="#5B3D32"/><circle cx="48" cy="36" r="2" fill="#5B3D32"/>' +
          pencil(R, ell(41, 30, 3.4, 3, 8), 1.4, INK, 1, true, '#F9C4D0') + '<path d="M10 8l3 5M16 5v6M22 8l-3 5" stroke="#5B3D32" stroke-width="1.6" stroke-linecap="round"/>'; break;
      case 'Bubble Machine':
        s = pencil(R, rect(10, 34, 36, 24), 2.4, INK, 1, true, '#C8E9CF') + pencil(R, rect(8, 30, 40, 6), 2, INK, 1, true, '#FFE3A1') +
          pencil(R, [[16, 30], [15, 16], [20, 12], [20, 7], [26, 7], [26, 12], [31, 16], [30, 30]], 1.8, INK, 1, true, '#CBE0F4') + pencil(R, rect(16, 18, 14, 8), 1.2, INK, 1, true, '#FFFBF3') +
          pencil(R, [[46, 46], [53, 46], [53, 53]], 2, INK, 1) + '<circle cx="53" cy="54" r="2.6" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.2"/>' + pencil(R, [[42, 30], [44, 22]], 2, INK, 1) + pencil(R, ell(46, 18, 5, 5, 10), 1.8, '#86B3EA', 1) +
          pencil(R, ell(52, 9, 5, 5, 10), 1.4, INK, 0.8, true, 'rgba(203,224,244,.5)') + pencil(R, ell(59, 20, 3.4, 3.4, 8), 1.2, INK, 0.8, true, 'rgba(203,224,244,.5)') + pencil(R, ell(38, 6, 3, 3, 8), 1.2, INK, 0.7); break;
      case 'Paddling Pool':
        s = pencil(R, ell(32, 42, 28, 13, 20), 2.2, INK, 1, true, '#6F93BE') + '<rect x="4" y="34" width="56" height="8" fill="#6F93BE"/>' + pencil(R, ell(32, 34, 28, 13, 20), 2.4, INK, 1, true, '#86B3EA') +
          pencil(R, ell(32, 35, 20, 7.5, 16), 1.8, INK, 1, true, '#BBD8EF') + pencil(R, [[22, 35], [27, 33], [32, 35], [37, 33], [42, 35]], 1.4, '#5E86B4', 0.9);
        [[8, 31], [14, 26], [50, 26], [56, 31], [12, 42], [32, 47], [52, 42]].forEach(function (d) { s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="1.8" fill="#FFFBF3"/>'; });
        s += pencil(R, [[30, 22], [33, 14]], 1.6, '#9CC8EA', 1) + pencil(R, [[38, 23], [43, 16]], 1.6, '#9CC8EA', 1) + '<circle cx="35" cy="11" r="2" fill="#9CC8EA" stroke="#5B3D32" stroke-width=".9"/>'; break;
      case 'Agility Tunnel':
        for (var ti = 0; ti < 6; ti++) s += pencil(R, [[10 + ti * 7.5, 22], [17.5 + ti * 7.5, 20], [17.5 + ti * 7.5, 52], [10 + ti * 7.5, 51]], 1.4, INK, 0.9, true, ti % 2 ? '#FFE07A' : '#86B3EA');
        s += pencil(R, [[10, 22], [55, 20]], 2.2, INK, 1) + pencil(R, [[10, 51], [55, 52]], 2.2, INK, 1) + pencil(R, ell(10, 36.5, 6, 15, 12), 2.2, INK, 1, true, '#86B3EA') + pencil(R, ell(10, 37, 3.4, 11, 10), 1.4, INK, 1, true, '#4A3A33') +
          pencil(R, ell(55, 36, 5, 16, 12), 2.2, INK, 1, true, '#FFE07A') + '<path d="M2 58H62" stroke="#5B3D32" stroke-width="1.4" opacity=".4"/>'; break;
      case 'Squeaky Pumpkin': case 'Plush Ghost': case 'Bat-Wing Flyer': case 'Trick-or-Treat Bucket': return v26Icon(name);
      default: s = pencil(R, rect(14, 14, 36, 36), 2.4, INK, 1, true, '#E0D5F0');
    }
    return '<svg viewBox="0 0 64 64">' + s + '</svg>';
  }
  function itemSVG(name) { return art('item', name) || ownItem(name); }
  function ownBoard() {
    var R = rng(41), s = pencil(R, rect(10, 18, 220, 128), 2.6, INK, 1, true, '#C8E9CF');
    [60, 120, 180].forEach(function (x) { s += pencil(R, ell(x, 80, 19, 19), 2.2, INK, 1, true, '#6E544A') + '<circle cx="' + (x - 4) + '" cy="84" r="5" fill="#C98B4E" stroke="#5B3D32"/><circle cx="' + (x + 5) + '" cy="80" r="4.4" fill="#D9A066" stroke="#5B3D32"/>'; });
    return '<svg viewBox="0 0 240 160">' + s + '<text x="120" y="134" text-anchor="middle" font-family="Caveat,cursive" font-size="16" fill="#5B3D32">sniff &amp; slide</text></svg>';
  }
  function ownLid() { var R = rng(43); return '<svg viewBox="0 0 60 60">' + pencil(R, ell(30, 29, 25, 23), 2.4, INK, 1, true, '#FCD8BC') + pencil(R, ell(30, 29, 8, 7), 1.8, INK, 1, true, '#FFE07A') + '</svg>'; }
  function holeCover() { var R = rng(47); return '<svg viewBox="0 0 60 60">' + pencil(R, ell(30, 30, 21, 21), 2, INK, 1, true, '#5E463C') + '<path d="M18 36q12 6 24 0" fill="none" stroke="#8C6E60" stroke-width="2" opacity=".7"/></svg>'; }
  function blanketSVG() {
    var R = rng(53), s = pencil(R, [[6, 30], [40, 14], [120, 8], [200, 14], [234, 30], [238, 96], [4, 96]], 2.6, INK, 1, true, '#CBE0F4');
    for (var i = 0; i < 6; i++) for (var j = 0; j < 2; j++) { var x = 14 + i * 37, y = 30 + j * 32; if ((i + j) % 2) s += '<rect x="' + x + '" y="' + y + '" width="34" height="28" rx="4" fill="#F9D0D9" opacity=".85"/>'; }
    s += '<path d="M10 36H230M10 66H230" stroke="#5B3D32" stroke-width="1.4" stroke-dasharray="5 5" opacity=".6"/>';
    s += pencil(R, [[6, 30], [40, 18], [120, 12], [200, 18], [234, 30]], 7, '#FFE3A1', 0.95);
    return '<svg viewBox="0 0 240 100" preserveAspectRatio="none">' + s + '</svg>';
  }
  function ownDog(pose, facing) {
    var R = rng(pose.length * 31 + 5), lie = pose === 'sleep', s = '';
    var by = lie ? 168 : pose === 'jump' ? 120 : 140, hy = lie ? 160 : pose === 'eat' ? 168 : pose === 'jump' ? 92 : 104;
    s += '<ellipse cx="120" cy="187" rx="70" ry="6" fill="#5B3D32" opacity=".1"/>';
    if (!lie) [70, 92, 140, 162].forEach(function (x) { s += pencil(R, [[x, by + 10], [x + (pose === 'walk' ? (R() - 0.5) * 16 : 0), pose === 'jump' ? 160 : 186]], 7, '#2a2420'); });
    s += pencil(R, ell(118, by, 62, lie ? 20 : 30), 4, '#2a2420', 1, true, '#E8B36A');
    s += pencil(R, ell(178, hy, 30, 27), 4, '#2a2420', 1, true, '#E8B36A');
    s += pencil(R, [[160, hy - 20], [166, hy - 44], [176, hy - 24]], 3.5, '#2a2420', 1, true, '#C98B4E');
    s += '<circle cx="186" cy="' + (hy - 4) + '" r="8" fill="#fff" stroke="#2a2420" stroke-width="2.5"/>' + (lie ? '<path d="M180 ' + (hy - 4) + 'h12" stroke="#2a2420" stroke-width="3"/>' : '<circle cx="188" cy="' + (hy - 3) + '" r="4" fill="#2a2420"/>');
    s += '<circle cx="207" cy="' + (hy + 6) + '" r="5" fill="#2a2420"/>';
    s += pencil(R, [[58, by - 6], [36, by - 30 + (pose === 'happy' ? -10 : 0)]], 5, '#2a2420');
    var inner = facing === 'left' ? '<g transform="translate(240 0) scale(-1 1)">' + s + '</g>' : s;
    return '<svg class="pa-dog pt-owndog" viewBox="0 0 240 200">' + inner + '</svg>';
  }

  /* ---------------- backdrop ---------------- */
  var SKY = { dawn: ['#F6C3BC', '#FCE1C6'], day: ['#BFDCF4', '#E6F1FA'], dusk: ['#EFA584', '#D7C0E6'], night: ['#1F2A52', '#3A4877'] };
  function skyDefs(id, time, weather) {
    var c = SKY[time] || SKY.day;
    if (weather === 'rain' || weather === 'cloudy' || weather === 'snow') c = time === 'night' ? ['#232B45', '#3B4560'] : ['#B9C3CC', '#DCE2E6'];
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>';
  }
  function skyBits(R, x, y, w, h, time, weather) {
    var s = '';
    if (time === 'night') {
      for (var i = 0; i < 14; i++) { var sx = x + 10 + R() * (w - 20), sy = y + 8 + R() * h * 0.7; s += '<path d="M' + f1(sx - 3) + ' ' + f1(sy) + 'h6M' + f1(sx) + ' ' + f1(sy - 3) + 'v6" stroke="#FFF4C8" stroke-width="1.4" opacity="' + (weather === 'sunny' ? 0.9 : 0.35) + '"/>'; }
      s += pencil(R, ell(x + w * 0.72, y + h * 0.26, 18, 18), 2, INK, 1, true, '#FFF4C8') + '<circle cx="' + f1(x + w * 0.72 + 8) + '" cy="' + f1(y + h * 0.26 - 5) + '" r="15" fill="' + (weather === 'sunny' ? '#2D3A66' : '#2F3850') + '"/>';
    } else if (weather === 'sunny' || weather === 'cloudy') {
      var sunY = time === 'day' ? y + h * 0.26 : y + h * 0.62;
      s += pencil(R, ell(x + w * 0.28, sunY, 22, 22), 2.2, INK, 1, true, time === 'day' ? '#FFE07A' : '#FFC27A');
      for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2; s += pencil(R, [[x + w * 0.28 + Math.cos(a) * 30, sunY + Math.sin(a) * 30], [x + w * 0.28 + Math.cos(a) * 40, sunY + Math.sin(a) * 40]], 1.8, INK, 0.8); }
    }
    if (weather !== 'sunny') {
      var cc = weather === 'cloudy' ? '#F2F2F2' : '#C9CED6';
      [[0.35, 0.32], [0.7, 0.5]].forEach(function (p) { var cx = x + w * p[0], cy = y + h * p[1]; s += pencil(R, [[cx - 46, cy + 10], [cx - 40, cy - 8], [cx - 18, cy - 18], [cx + 6, cy - 22], [cx + 30, cy - 10], [cx + 48, cy + 8]], 2, INK, 0.85, true, cc); });
    }
    return s;
  }
  function backdrop(variant, time, weather, uidp, season) {
    // v2.5: outdoor backdrops turn with the season (PawArt.SEASON_TINT); summer keeps the old colours exactly
    var ST = (typeof window !== 'undefined' && window.PawArt && window.PawArt.SEASON_TINT) || {}, tn = season && season !== 'summer' ? ST[season] : null;
    var mixc = function (a, b2, t) { var A = [1, 3, 5].map(function (i) { return parseInt(a.slice(i, i + 2), 16); }), B = [1, 3, 5].map(function (i) { return parseInt(b2.slice(i, i + 2), 16); }); return '#' + A.map(function (v, i) { return ('0' + Math.round(v + (B[i] - v) * t).toString(16)).slice(-2); }).join('').toUpperCase(); };
    var gc = function (c) { return !tn ? c : season === 'winter' ? mixc(mixc(c, tn.grass, 0.2), '#FFFFFF', 0.45) : mixc(c, tn.grass, 0.3); }, lci = 0, lc = function (c) { if (!tn) return c; var i = lci++; if (season === 'autumn') return ['#F2B25C', '#E8895A', '#F3CB58', '#DE6650'][i % 4]; if (season === 'spring') return i % 2 ? '#F7C6D3' : mixc(c, tn.leaf, 0.3); return mixc(c, tn.leaf, 0.75); }, fc = function (c) { return tn && season === 'winter' ? mixc(c, '#FFFFFF', 0.55) : tn && season === 'autumn' ? mixc(c, '#E8895A', 0.35) : c; };
    var R = rng(variant === 'pond' ? 901 : 77), s = '', gid = uidp + 'sky';
    var defs = '<defs>' + skyDefs(gid, time, weather) + '<pattern id="' + uidp + 'dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.2" fill="#E3D2BA"/></pattern>' +
      '<radialGradient id="' + uidp + 'lamp"><stop offset="0" stop-color="#FFE7A0" stop-opacity=".75"/><stop offset="1" stop-color="#FFE7A0" stop-opacity="0"/></radialGradient></defs>';
    if (variant === 'pond') {
      s += '<rect width="1240" height="340" fill="url(#' + gid + ')"/>' + skyBits(R, 0, 70, 1240, 260, time, weather);
      s += pencil(R, [[0, 300], [180, 262], [380, 290], [600, 250], [820, 286], [1040, 258], [1240, 284], [1240, 360], [0, 360]], 2.2, INK, 0.8, true, gc('#D9ECCB'));
      for (var t = 0; t < 7; t++) { var tx = 60 + t * 190 + R() * 40, ty = 300 + R() * 20; s += pencil(R, [[tx, ty], [tx, ty - 40]], 3, INK, 0.7) + pencil(R, ell(tx, ty - 58, 26, 30, 14), 2, INK, 0.7, true, lc('#BFE0B4')); }
      s += '<rect y="340" width="1240" height="280" fill="#E8F3D8"/>' + pencil(R, [[0, 340], [1240, 336]], 2.2, INK, 0.7);
      for (var g = 0; g < 60; g++) { var gx = R() * 1240, gy = 360 + R() * 250; s += '<path d="M' + f1(gx) + ' ' + f1(gy) + 'l3 -9M' + f1(gx + 5) + ' ' + f1(gy) + 'l-1 -11" stroke="' + gc('#86B57A') + '" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>'; }
      s += pencil(R, [[720, 462], [900, 450], [1100, 452], [1250, 446], [1250, 630], [560, 630], [610, 540]], 2.6, INK, 1, true, '#BBD8EF');
      s += '<path d="' + wob(R, [[720, 462], [900, 450], [1100, 452], [1250, 446], [1250, 630], [560, 630], [610, 540]], 2, true) + '" fill="url(#' + uidp + 'dots)" opacity=".5"/>';
      for (var w = 0; w < 12; w++) { var wx = 700 + R() * 500, wy = 480 + R() * 120; s += pencil(R, [[wx, wy], [wx + 14, wy - 4], [wx + 28, wy], [wx + 42, wy - 4]], 1.6, '#6F93BE', 0.8); }
      [[640, 470], [672, 455], [596, 520]].forEach(function (p) { s += pencil(R, [[p[0], p[1] + 40], [p[0] - 4, p[1] - 30]], 2.2, '#6E8F5A') + pencil(R, ell(p[0] - 4, p[1] - 38, 5, 12, 10), 1.6, INK, 1, true, '#A0764E'); });
      s += '<text x="905" y="600" font-family="Caveat,cursive" font-weight="700" font-size="26" fill="#5B3D32" opacity=".6">the pond (very wet)</text>';
    } else if (variant === 'yard') {
      R = rng(611);
      s += '<rect width="1240" height="400" fill="url(#' + gid + ')"/>' + skyBits(R, 0, 70, 1240, 240, time, weather);
      s += pencil(R, [[0, 292], [160, 266], [330, 284], [500, 262], [680, 282], [860, 260], [1040, 280], [1240, 264], [1240, 340], [0, 340]], 2.2, INK, 0.75, true, gc('#D9ECCB'));
      for (var yt = 0; yt < 6; yt++) { var ytx = 90 + yt * 215 + R() * 50, yty = 296 + R() * 14; s += pencil(R, [[ytx, yty], [ytx, yty - 36]], 3, INK, 0.7) + pencil(R, ell(ytx, yty - 54, 28, 30, 14), 2, INK, 0.7, true, lc(yt % 2 ? '#BFE0B4' : '#CDE7C1')); }
      for (var pk = 0; pk < 28; pk++) { var pkx = 6 + pk * 45; s += pencil(R, [[pkx, 404], [pkx, 322], [pkx + 15, 306], [pkx + 30, 322], [pkx + 30, 404]], 2, INK, 0.85, true, '#FFF4DF'); }
      s += pencil(R, rect(-4, 338, 1248, 12), 2, INK, 0.8, true, '#F3E3CC') + pencil(R, rect(-4, 378, 1248, 12), 2, INK, 0.8, true, '#F3E3CC');
      s += '<rect y="398" width="1240" height="222" fill="#E8F3D8"/>' + pencil(R, [[0, 400], [620, 397], [1240, 399]], 2.2, INK, 0.7);
      for (var yg = 0; yg < 70; yg++) { var ygx = R() * 1240, ygy = 420 + R() * 190; s += '<path d="M' + f1(ygx) + ' ' + f1(ygy) + 'l3 -9M' + f1(ygx + 5) + ' ' + f1(ygy) + 'l-1 -11" stroke="' + gc('#86B57A') + '" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>'; }
      for (var yf = 0; yf < 16; yf++) {
        var yfx = 30 + yf * 78 + R() * 30, yfy = 404 + R() * 10, yfc = fc(['#F9D0D9', '#FFE07A', '#E0D5F0', '#F28FA5'][yf % 4]);
        s += pencil(R, [[yfx, yfy], [yfx + 2, yfy - 26]], 1.8, '#6E8F5A', 0.9);
        for (var pe = 0; pe < 5; pe++) { var pa = pe / 5 * Math.PI * 2; s += '<circle cx="' + f1(yfx + 2 + Math.cos(pa) * 5) + '" cy="' + f1(yfy - 30 + Math.sin(pa) * 5) + '" r="4" fill="' + yfc + '" stroke="#5B3D32" stroke-width="1.1"/>'; }
        s += '<circle cx="' + f1(yfx + 2) + '" cy="' + f1(yfy - 30) + '" r="2.6" fill="#F2C744" stroke="#5B3D32" stroke-width="1"/>';
      }
      s += '<text x="1040" y="606" font-family="Caveat,cursive" font-weight="700" font-size="26" fill="#5B3D32" opacity=".6">the back garden</text>';
    } else {
      s += '<rect width="1240" height="420" fill="#FFF7EA"/><rect width="1240" height="420" fill="url(#' + uidp + 'dots)"/>';
      for (var v = 0; v < 13; v++) s += pencil(R, [[60 + v * 96, 92], [60 + v * 96, 410]], 1, '#E9D7BF', 0.7);
      /* window */
      var WX = 850, WY = 110, WW = 250, WH = 220;
      s += '<rect x="' + WX + '" y="' + WY + '" width="' + WW + '" height="' + WH + '" fill="url(#' + gid + ')"/>' + skyBits(R, WX, WY, WW, WH, time, weather);
      if (weather === 'snow') s += pencil(R, [[WX, WY + WH - 20], [WX + 80, WY + WH - 30], [WX + 170, WY + WH - 22], [WX + WW, WY + WH - 30], [WX + WW, WY + WH], [WX, WY + WH]], 1.8, INK, 0.8, true, '#FFFFFF');
      s += pencil(R, rect(WX, WY, WW, WH), 4, INK, 1) + pencil(R, [[WX + WW / 2, WY], [WX + WW / 2, WY + WH]], 3, INK, 1) + pencil(R, [[WX, WY + WH / 2], [WX + WW, WY + WH / 2]], 3, INK, 1);
      s += pencil(R, rect(WX - 14, WY + WH, WW + 28, 14), 2.4, INK, 1, true, '#F3E3CC');
      s += pencil(R, [[WX - 40, WY - 16], [WX - 10, WY + 60], [WX - 30, WY + 150], [WX - 6, WY + WH + 10], [WX - 52, WY + WH + 10], [WX - 60, WY - 16]], 2.2, INK, 1, true, '#F9D0D9');
      s += pencil(R, [[WX + WW + 40, WY - 16], [WX + WW + 10, WY + 60], [WX + WW + 30, WY + 150], [WX + WW + 6, WY + WH + 10], [WX + WW + 52, WY + WH + 10], [WX + WW + 60, WY - 16]], 2.2, INK, 1, true, '#F9D0D9');
      s += pencil(R, [[WX - 70, WY - 18], [WX + WW + 70, WY - 18]], 3, INK, 1);
      /* picture frame + plant + lamp */
      s += pencil(R, rect(150, 140, 130, 100), 3, INK, 1, true, '#FFF4DF') + pencil(R, rect(162, 152, 106, 76), 1.6, INK, 0.6, true, '#E6F1FA');
      s += pencil(R, [[176, 214], [196, 196], [210, 206], [232, 186], [256, 214]], 1.8, INK, 0.8, true, '#C8E9CF') + pencil(R, ell(240, 170, 8, 8), 1.4, INK, 0.8, true, '#FFE07A');
      s += '<text x="215" y="262" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="22" fill="#5B3D32" opacity=".7">home sweet home</text>';
      s += pencil(R, [[50, 352], [110, 352], [102, 410], [58, 410]], 2.4, INK, 1, true, '#F4A262');
      [[80, 352, 50, 290], [80, 352, 104, 300], [80, 352, 70, 280], [80, 352, 120, 330], [80, 352, 40, 320]].forEach(function (l) { s += pencil(R, [[l[0], l[1]], [lerp(l[0], l[2], 0.5) + 6, lerp(l[1], l[3], 0.5)], [l[2], l[3]]], 6, '#86B57A', 0.9) + pencil(R, [[l[0], l[1]], [l[2], l[3]]], 1.4, INK, 0.7); });
      if (time === 'night' || time === 'dusk') s += '<circle cx="1176" cy="250" r="120" fill="url(#' + uidp + 'lamp)"/>';
      s += pencil(R, [[1176, 410], [1176, 270]], 3, INK, 1) + pencil(R, [[1150, 410], [1202, 410]], 3, INK, 1) + pencil(R, [[1146, 270], [1206, 270], [1192, 226], [1160, 226]], 2.4, INK, 1, true, time === 'night' || time === 'dusk' ? '#FFE7A0' : '#FFF4DF');
      /* baseboard + floor */
      s += '<rect y="410" width="1240" height="210" fill="#F1DEC1"/>' + pencil(R, rect(-4, 404, 1248, 14), 2.4, INK, 1, true, '#F7E9D4');
      [440, 468, 502, 545, 598].forEach(function (y, i) { s += pencil(R, [[0, y], [420, y + (R() - 0.5) * 3], [840, y + (R() - 0.5) * 3], [1240, y]], 1.6, '#C9A880', 0.9); for (var j = 0; j < 4; j++) { var jx = 80 + R() * 1080; s += pencil(R, [[jx, y], [jx + (i - 2) * 6, y + 26 + i * 6]], 1.2, '#C9A880', 0.7); } });
      /* rug */
      s += pencil(R, ell(620, 548, 480, 54, 26), 2.6, INK, 1, true, '#F9D0D9') + pencil(R, ell(620, 548, 440, 40, 26), 1.6, INK, 0.6);
      s += '<ellipse cx="620" cy="548" rx="455" ry="46" fill="none" stroke="#F28FA5" stroke-width="2" stroke-dasharray="7 6"/>';
    }
    return '<svg viewBox="0 0 1240 620" preserveAspectRatio="none">' + defs + s + '</svg>';
  }
  function waterFront(uidp) {
    var R = rng(905);
    return '<svg viewBox="0 0 1240 620" preserveAspectRatio="none"><path d="' + wob(R, [[628, 552], [760, 546], [900, 552], [1060, 546], [1250, 550], [1250, 630], [600, 630]], 2, true) + '" fill="#A9CDEA" opacity=".86"/>' +
      pencil(R, [[628, 552], [700, 547], [780, 553], [860, 547], [940, 553], [1020, 547], [1100, 553], [1180, 547], [1250, 551]], 2, '#5E86B4', 0.9) + '</svg>';
  }

  /* ---------------- dog geometry (viewBox units, facing right, from feet 120,186) ---------------- */
  var MOUTH = { idle: [70, -66], walk: [70, -66], happy: [70, -70], pet: [70, -70], sit: [42, -76], jump: [84, -108], eat: [14, -8], crouch: [58, -16], dig: [42, -10], shake: [70, -62], sad: [56, -50], sleep: [60, -16], dirty: [70, -66], cold: [62, -60], hot: [70, -66], sniff: [80, -22], __own: [88, -76] };
  /* per-breed mouth adjustments in viewBox units: d = default for every pose, plus per-pose overrides (calibrated by eye) */
  var BREED_M = {
    shiba: { d: [0, 0], sniff: [4, -4] }, husky: { d: [-8, 0], sniff: [-2, -8] }, dachs: { d: [30, 0], sniff: [14, 0] },
    corgi: { d: [-2, 4], eat: [10, 0], crouch: [0, 0], sit: [0, 0], sniff: [6, -5] },
    golden: { d: [-24, -6], sit: [-24, 0], jump: [-38, 2], eat: [40, -15], crouch: [0, 0], sleep: [-12, 0], sniff: [-6, -2] },
    mutt: { d: [-10, 4], sit: [0, 0], jump: [-8, 0], eat: [24, 0], crouch: [0, 0], sniff: [0, -4] },
    chihuahua: { d: [-12, 14], sit: [0, 8], jump: [-30, 10], eat: [16, -6], crouch: [0, 0], sleep: [-12, 0], sniff: [0, -4] },
    pug: { d: [-22, 10], sit: [-6, 3], jump: [-30, 5], eat: [28, -11], crouch: [0, 0], sleep: [-10, 0], sniff: [-6, 0] },
    greyhound: { d: [32, -42], sit: [48, 2], jump: [18, -53], eat: [28, -4], crouch: [50, 8], sleep: [12, 4], sniff: [12, 4] },
    beagle: { d: [-4, 0], jump: [-6, -5], eat: [28, -3], sit: [0, 0], crouch: [0, 0], sleep: [0, 0], sniff: [8, 0] },
    // v2.5 breeds, calibrated on the DOG ART lane's drawings (mods/toys/calib)
    poodle: { d: [-2, -18], sit: [5, -13], jump: [-15, -14], eat: [32, -13], crouch: [10, -5], sleep: [-2, 0], sniff: [6, -8] },
    collie: { d: [5, 0], sit: [17, 0], jump: [2, -10], eat: [24, 0], crouch: [19, 5], sleep: [-8, 2], sniff: [10, -4] },
    samoyed: { d: [-11, -1], sit: [2, -6], jump: [-19, -4], eat: [28, -9], crouch: [13, 0], sleep: [-6, 0], sniff: [0, -2] },
    frenchie: { d: [-22, 10], sit: [-6, -2], jump: [-30, 5], eat: [28, -11], crouch: [0, 0], sleep: [-10, 0], sniff: [-6, 0] }
  };
  var POSE_BASE = { walk: 'idle', happy: 'idle', pet: 'idle', shake: 'idle', dirty: 'idle', cold: 'idle', hot: 'idle', sad: 'idle', dig: 'eat' };
  function breedAdj(key, pose) {
    var b = BREED_M[key]; if (!b) return [0, 0];
    return b[pose] || b[POSE_BASE[pose]] || b.d || [0, 0];
  }
  /* breed traits for toy play; unknown keys get the defaults */
  var TRAITS = {
    greyhound: { run: 1.6, carry: 0.55, flop: true },
    chihuahua: { run: 1.1, fierce: true }, pug: { run: 0.78, snort: true }, beagle: { sniff: true },
    dachs: { run: 0.85 }, corgi: { run: 0.92 },
    frenchie: { run: 0.8, snort: true }, collie: { run: 1.15 }, samoyed: { fluff: true }, poodle: { clever: true }   // v2.5
  };
  function trait(key) { return Object.assign({ run: 1, carry: 1 }, TRAITS[key] || {}); }
  /* per-breed flavour lines; any missing slot falls back to the generic lines passed in */
  var LINES = {
    chihuahua: {
      fetchStart: ['throw it. I dare you.', 'I am small but I am FAST'], fetchDeliver: ['I defeated it. you\u2019re welcome.', 'it fought back. I won.'],
      tugStart: ['GRRRR. I AM A WOLF.', 'you face the security system'], tugGrowl: ['GRRRRRR!!', 'I will NEVER let go', 'tiny but MIGHTY', 'yip! YIP! grrr!'],
      tugDogWin: ['FEAR ME.', 'the rope is mine. forever.'], tugYouWin: ['...I let you win. obviously.', 'ok fine. hug. but quickly.'],
      duckOk: ['YAP YAP correct!', 'I yap, you squeak. a team.'], puzzleWrong: ['that lid lied to me', 'I am FURIOUS at that lid'],
      frisbee: ['I caught it with my FACE', 'the disc is bigger than me. I won.'], plushYawn: ['*tiny yawn*'], howl: ['YIP-YIP-AWOO!', 'yap yap yap!'],
      snuffleStart: ['I am not looking. I am GUARDING.'], snuffleFind: ['MINE. all mine.', 'found it. fear my nose.'], coneLick: ['this cone is MY cone', 'lick lick LICK'],
      hogAnswer: ['YAP! YAP YAP!', 'who squeaks at ME?'], hogRoll: ['it is a ball now. I am not scared. (a bit scared)'], bubblePop: ['I will pop EVERY bubble', 'POP. next.'],
      poolIn: ['the water is TOO wet', '...ok it is nice'], tunnelGo: ['ZOOM (tiny legs)'], tunnelDone: ['I am a rocket', 'tiny but FAST'], tap: ['yes? I am busy being fierce']
    },
    pug: {
      fetchStart: ['*snort* ...throw it gently', 'ok but not too far'], fetchDeliver: ['*snort snort* got it', 'I need a little lie down'],
      tugGrowl: ['*snort* grrf', 'rrf rrf *wheeze*', 'grrrrf *snort*'], tugDogWin: ['*victory snort*'],
      duckListen: ['*snort*', '*snerk*', '*huff*'], duckOk: ['*happy snort*', 'snort-squeak duet!'],
      puzzleFound: ['FOOD. *snort* FOOD.', 'my favourite flavour: kibble'], plushYawn: ['*snoooore*'], howl: ['rrf! *snort* rrf!', 'arf-*snort*-roo'],
      snuffleFind: ['*snort* FOOD', '*snort snort* found it'], coneLick: ['*snort* pumpkin', 'lick *snort* lick'], hogAnswer: ['*snort*!', 'rrf! *snort*'],
      bubblePop: ['*snort* it went up my nose', 'pop *wheeze*'], poolIn: ['*happy snort*', 'I float. sort of.'], tunnelDone: ['*wheeze* I did it', 'that tunnel was long. nap?'], tap: ['*snort*?']
    },
    greyhound: {
      fetchStart: ['I go fast. then I lie down.', 'ready. set. ZOOM.'], fetchDeliver: ['*flop*', 'that was 45 mph. nap now.', 'zoom complete. horizontal mode.'],
      tugGrowl: ['roo.', 'mrrr (politely)'], frisbee: ['ZOOOM. got it. *flop*', 'leg power!'], howl: ['rooo...', 'roo-roo (softly)'],
      stickShake: ['brrr. my legs are wet.', 'long legs, long shake'],
      snuffleFind: ['found it. elegantly.'], coneLick: ['lick. lick. a dignified lick.'], hogAnswer: ['roo?', 'roo (politely)'], bubblePop: ['leg power!', 'I jumped to the ceiling'],
      poolIn: ['my legs are long. the pool is short.'], tunnelGo: ['ZOOOM'], tunnelDone: ['45 mph. in a tube.', 'zoom complete. horizontal mode.'], tap: ['roo (fondly)']
    },
    beagle: {
      fetchStart: ['I can smell the ball from here', 'throw it! I\u2019ll sniff it out'], fetchDeliver: ['found it by SMELL', 'my nose did the work'],
      puzzleStart: ['sniff. sniff. it\u2019s THAT one.', 'my nose already knows'], puzzleFound: ['smelled that from three streets away', 'nose: 1, lids: 0'],
      duckOk: ['AROOOO! (that means yes)'], howl: ['AROOOOOO!', 'ah-ROOOO-ooo!'], tugGrowl: ['arooo-grrr!', 'grrr (musically)'],
      snuffleStart: ['I can smell where you hid it. go on.'], snuffleFind: ['nose: 1, mat: 0', 'smelled that from the hall'], coneLick: ['pumpkin! I smelled it from the garden'],
      hogAnswer: ['AROOO!', 'ah-ROO-squeak!'], hogRoll: ['it smells like a hedgehog. suspicious.'], bubblePop: ['they smell of... nothing?! suspicious'],
      poolIn: ['AROOO (wet version)'], tunnelDone: ['AROOOO! again!'], tap: ['sniff sniff. it is you!']
    },
    // v2.5 breeds
    poodle: {
      fetchStart: ['I have calculated the angle. throw.', 'ready when you are. I was ready first.'], fetchDeliver: ['returned. neatly.', 'not one curl out of place'],
      puzzleStart: ['I solved this one yesterday', 'it is the middle lid. watch.'], puzzleFound: ['as predicted', 'too easy. again?'], puzzleWrong: ['that was a test. for you.'],
      duckOk: ['a perfect copy, if I say so myself'], frisbee: ['caught it. elegantly.', 'pom-poms and all'], howl: ['yip! (clearly)', 'yip yip!'],
      snuffleFind: ['found it. obviously.'], coneLick: ['pumpkin. a classic.'], bubblePop: ['pop. pop. very tidy.'], poolIn: ['the curls! ...ok, it is nice'],
      tunnelDone: ['in one end, out the other. genius.'], tap: ['yes? I am thinking.']
    },
    collie: {
      fetchStart: ['THROW IT. please. now. please.', 'eyes on the ball. always.'], fetchDeliver: ['again? again. AGAIN.', 'back already. that is my job.'],
      tugGrowl: ['grr! (working)', 'mine. for now.'], frisbee: ['caught it mid-air. as planned.', 'I was born for this'], howl: ['woof woof!', 'yap! (sharp)'],
      snuffleStart: ['I will find every last one'], snuffleFind: ['one found. more to go.'], hogRoll: ['it is a ball now. I will herd it.'], bubblePop: ['I will herd the bubbles', 'stay together, bubbles!'],
      poolIn: ['a quick swim. then back to work.'], tunnelGo: ['ZOOM'], tunnelDone: ['again? I can go faster.'], tap: ['what is the job? is this the job?']
    },
    samoyed: {
      fetchStart: ['woo! throw it!', 'I am smiling. throw it anyway.'], fetchDeliver: ['woo-woo! got it!', 'still smiling'],
      tugGrowl: ['grr-woo!', 'woo (fiercely)'], howl: ['woo-woo-WOOO!', 'awoo-woo!'], duckOk: ['woo! a duet!'],
      snuffleFind: ['found it! woo!'], coneLick: ['cold and pumpkin. my favourite.'], hogAnswer: ['woo?', 'woo-woo!'], bubblePop: ['the bubbles stick to my fluff'],
      poolIn: ['cold water! woo!', 'I am now twice as heavy'], stickShake: ['so much fluff. so much water.', 'shake shake shake. still damp.'], tap: ['woo! hello!']
    },
    frenchie: {
      fetchStart: ['*snort* ...a short throw, please', 'ok. but not far.'], fetchDeliver: ['*snort* got it', 'that was a big run. sit time.'],
      tugGrowl: ['grrf *snort*', 'rrf rrf!'], tugDogWin: ['*proud snort*'], duckListen: ['*snort*', '*huff*'], duckOk: ['*happy snort*'],
      howl: ['rrf! *snort*', 'arf-*snort*'], snuffleFind: ['*snort* FOOD'], coneLick: ['lick *snort* lick'], hogAnswer: ['*snort*!', 'rrf?'],
      poolIn: ['I do not swim. I float. With help.'], tunnelDone: ['*snort* done. sitting now.'], tap: ['*snort*?']
    }
  };
  var FALLBACK = { crouch: ['sit'], dig: ['eat'], shake: ['happy'], sleep: ['sit'], pet: ['happy'], sad: ['sit'], jump: ['happy'], eat: ['sit'], walk: ['idle'] };

  function makeDog(A, info, layer) {
    var el = div('pt-abs pt-dogw', layer), cache = {}, svgs = {}, resolved = {}, cur = null;
    el.style.width = (240 * DS) + 'px'; el.style.height = (200 * DS) + 'px';
    el.style.transformOrigin = (120 * DS) + 'px ' + (186 * DS) + 'px';
    var bkey = info.key;
    var d = { x: 760, y: GY, ground: GY, facing: 'left', pose: 'idle', rot: 0, tilt: 0, sx: 1, sy: 1, vy: 0, avx: 0, air: false, bob: 0, offY: 0, el: el };
    function tryDog(pose, facing) {
      try { if (!window.PawArt || typeof window.PawArt.dog !== 'function') return null; return window.PawArt.dog(info.key, { pose: pose, outfit: info.outfit || {}, facing: facing, coat: info.coat, seed: info.seed }); } catch (e) { return null; }
    }
    function resolve(p) {
      if (resolved[p]) return resolved[p];
      var chain = [p].concat(FALLBACK[p] || [], ['idle']);
      for (var i = 0; i < chain.length; i++) {
        var c = chain[i], s = svgs[c + '|right'] || tryDog(c, 'right');
        if (s && s.indexOf('pa-pose-' + c) >= 0) { svgs[c + '|right'] = s; resolved[p] = c; return c; }
      }
      resolved[p] = '__own'; return '__own';
    }
    function getEl(p, f) {
      var k = p + '|' + f; if (cache[k]) return cache[k];
      var real = resolve(p), svg = real === '__own' ? ownDog(p, f) : (svgs[real + '|' + f] || tryDog(real, f) || ownDog(p, f));
      svgs[real + '|' + f] = svg;
      var e = div('pt-pose', el, svg); cache[k] = e; return e;
    }
    function apply() { var e = getEl(d.pose, d.facing); if (e !== cur) { if (cur) cur.classList.remove('pt-on'); e.classList.add('pt-on'); cur = e; } }
    d.prerender = function (list) { list.forEach(function (p) { getEl(p, 'left'); getEl(p, 'right'); }); apply(); };
    d.setPose = function (p, force) { if (d.air && p !== 'jump' && !force) return; if (p !== d.pose) { d.pose = p; apply(); } };
    d.face = function (f) { if (f !== d.facing) { d.facing = f; apply(); } };
    d.faceX = function (x) { if (Math.abs(x - d.x) > 20) d.face(x > d.x ? 'right' : 'left'); };
    d.dir = function () { return d.facing === 'right' ? 1 : -1; };
    d.mouthOff = function (p) { var rp = resolve(p || 'walk'), m = MOUTH[rp] || MOUTH.idle, a = breedAdj(bkey, rp); return (m[0] + a[0]) * DS; };
    d.mouth = function () { var rp = resolve(d.pose), m = MOUTH[rp] || MOUTH.idle, a = breedAdj(bkey, rp); return { x: d.x + d.dir() * (m[0] + a[0]) * DS, y: d.y + d.offY + (m[1] + a[1]) * DS }; };
    d.mouthDy = function (p) { var rp = resolve(p || 'idle'), m = MOUTH[rp] || MOUTH.idle, a = breedAdj(bkey, rp); return (m[1] + a[1]) * DS; };
    d.head = function () { var m = d.mouth(); return { x: m.x - d.dir() * 26, y: m.y - 34 }; };
    d.runTo = function (tx, speed, dt) {
      if (d.air) return false;
      var dx = tx - d.x;
      if (Math.abs(dx) < 5) return true;
      var step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      d.x = clamp(d.x + step, 60, W - 60); d.face(dx > 0 ? 'right' : 'left'); d.setPose('walk'); d.bob += dt * speed / 26;
      return Math.abs(tx - d.x) < 5 || (d.x <= 60 && tx < 60) || (d.x >= W - 60 && tx > W - 60);
    };
    d.jump = function (vy, avx) { d.air = true; d.vy = vy; d.avx = avx || 0; d.pose = ''; d.setPose('jump', true); A.sfx('jump'); };
    d.squash = function (a) { d.sx = 1 + (1 - a) * 0.6; d.sy = a; };
    d.update = function (dt) {
      if (d.air) {
        d.vy += G * dt; d.y += d.vy * dt; d.x = clamp(d.x + d.avx * dt, 130, W - 130);
        if (d.y >= d.ground && d.vy > 0) { d.y = d.ground; d.air = false; d.vy = 0; d.squash(0.82); A.sfx('land'); d.setPose('idle'); }
      } else d.y += (d.ground - d.y) * Math.min(1, dt * 7);
      d.sx += (1 - d.sx) * Math.min(1, dt * 9); d.sy += (1 - d.sy) * Math.min(1, dt * 9);
    };
    d.render = function () {
      var bob = d.pose === 'walk' && !d.air ? -Math.abs(Math.sin(d.bob)) * 6 : 0;
      el.style.transform = 'translate3d(' + f1(d.x - 120 * DS) + 'px,' + f1(d.y + d.offY + bob - 186 * DS) + 'px,0) rotate(' + f1(d.rot + d.tilt) + 'deg) scale(' + d.sx.toFixed(3) + ',' + d.sy.toFixed(3) + ')';
    };
    return d;
  }

  /* ---------------- sprite ---------------- */
  function sprite(svg, w, h, parent, ax, ay) {
    ax = ax == null ? 0.5 : ax; ay = ay == null ? 0.5 : ay;
    var e = div('pt-abs', parent, svg); e.style.width = w + 'px'; e.style.height = h + 'px'; e.style.transformOrigin = (w * ax) + 'px ' + (h * ay) + 'px';
    var last = '';
    return {
      el: e, w: w, h: h,
      set: function (x, y, rot, sx, sy) {
        var t = 'translate3d(' + f1(x - w * ax) + 'px,' + f1(y - h * ay) + 'px,0) rotate(' + f1(rot || 0) + 'deg) scale(' + (sx == null ? 1 : sx).toFixed(3) + ',' + (sy == null ? 1 : sy).toFixed(3) + ')';
        if (t !== last) { e.style.transform = t; last = t; }
      },
      show: function (v) { e.style.display = v ? '' : 'none'; }
    };
  }

  /* ---------------- throwable object ---------------- */
  function thrower(A, o) {
    var b = { x: o.x, y: o.y, vx: 0, vy: 0, rot: 0, spin: 0, r: o.r, state: 'rest', thrown: false, onFloor: true, minY: o.y, relX: o.x, bounces: 0, grabDX: 0, grabDY: 0 };
    var g = o.g || 1900, bounce = o.bounce == null ? 0.56 : o.bounce;
    b.canGrab = function () { return b.state === 'rest' || b.state === 'fly'; };
    b.grab = function (px, py) { b.state = 'held'; b.thrown = false; b.vx = b.vy = 0; b.grabDX = b.x - px; b.grabDY = b.y - py; };
    b.hold = function (px, py) { b.x = clamp(px + b.grabDX * 0.5, b.r, W - b.r); b.y = Math.min(py + b.grabDY * 0.5, o.floor(b.x)); };
    b.release = function () {
      var v = A.vel(), sp = Math.hypot(v.vx, v.vy), k = sp > 2100 ? 2100 / sp : 1;
      b.vx = v.vx * k; b.vy = v.vy * k; b.spin = b.vx * 0.9; b.state = 'fly'; b.thrown = sp > 260; b.minY = b.y; b.relX = b.x; b.bounces = 0; b.onFloor = false;
      return { vx: b.vx, vy: b.vy, speed: sp * k };
    };
    b.drop = function () { b.state = 'fly'; b.vx = 0; b.vy = -60; b.thrown = false; b.onFloor = false; b.bounces = 5; };
    b.step = function (dt, cb) {
      if (b.state !== 'fly') return;
      cb = cb || {};
      b.vy += g * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.spin * dt * (o.spinK || 0.25);
      if (b.y < b.minY) b.minY = b.y;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.6; if (cb.wall) cb.wall(); }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.6; if (cb.wall) cb.wall(); }
      if (o.ceil != null && b.y < o.ceil && b.vy < 0) { b.y = o.ceil; b.vy = Math.abs(b.vy) * 0.45; b.minY = -9999; if (cb.ceil) cb.ceil(); }
      if (cb.custom && cb.custom()) return;
      var fl = o.floor(b.x);
      if (b.y >= fl) {
        b.y = fl;
        if (b.vy > 160) { var v = b.vy; b.vy = -b.vy * bounce; b.vx = b.vx * 0.82 + b.spin * 0.04; b.spin *= 0.6; b.bounces++; b.onFloor = false; if (cb.bounce) cb.bounce(v); }
        else { b.vy = 0; b.onFloor = true; b.vx *= Math.pow(0.12, dt); b.spin = b.vx; if (Math.abs(b.vx) < 16) { b.vx = 0; b.state = 'rest'; if (cb.rest) cb.rest(); } }
      } else b.onFloor = false;
    };
    return b;
  }

  /* ---------------- fetch brain (dog chases, picks up, returns to cursor) ---------------- */
  function fetchBrain(A, b, o) {
    var dog = A.dog, st = 'wait', t = 0, holdT = 0, holdPose = 'sit', holdNext = 'wait';
    var me = {
      get state() { return st; },
      set: function (s) { st = s; t = 0; },
      pause: function (sec, pose, next) { holdT = sec; holdPose = pose; holdNext = next || st; st = 'hold'; t = 0; }
    };
    function speed() { return o.speedAt ? o.speedAt(dog.x) : (o.speed || 420); }
    function grounded() { return b.state === 'rest' || b.state === 'float' || (b.state === 'fly' && b.onFloor); }
    function attach() { if (b.state !== 'carried') return; var m = dog.mouth(); b.x = m.x + dog.dir() * (o.carryFwd || 0); b.y = m.y + (o.carryDy || 4); if (o.carryRot != null) b.rot = o.carryRot * dog.dir(); }
    function pickUp(air) { b.state = 'carried'; b.thrown = false; b.vx = b.vy = 0; st = air || o.noDip ? 'carry' : 'pick'; t = 0; A.sfx(o.pickSfx || 'pop'); if (o.onPick) o.onPick(air); }
    me.pickUp = pickUp;
    me.update = function (dt) {
      t += dt;
      if (o.pre && o.pre(dt, st, me)) { attach(); return; }
      switch (st) {
        case 'hold': dog.setPose(holdPose); attach(); holdT -= dt; if (holdT <= 0) { st = holdNext; t = 0; } break;
        case 'wait':
          if (!dog.air) dog.setPose(o.waitPose || 'sit');
          dog.faceX(b.state === 'held' ? A.mouse.x : b.x);
          if (b.thrown && (b.state === 'fly' || b.state === 'rest' || b.state === 'float') && t > 0.12) { st = 'chase'; t = 0; }
          break;
        case 'chase': {
          if (b.state === 'held' || b.state === 'carried' || !b.thrown) { st = 'wait'; t = 0; break; }
          if (dog.air) { var mj = dog.mouth(); if (b.state === 'fly' && dist(mj.x, mj.y, b.x, b.y) < b.r + 58) pickUp(true); break; }
          var px = o.predict ? o.predict() : b.x, off = dog.mouthOff(), side = dog.x >= px ? 1 : -1;
          if (dog.runTo(px + side * off, speed(), dt)) dog.face(side > 0 ? 'left' : 'right');
          var m = dog.mouth();
          if (o.jumpCatch && o.jumpCatch(m)) break;
          if (grounded() && Math.abs(m.x - b.x) < b.r + 26 && Math.abs(b.vx) < 300) { pickUp(false); break; }
          if (o.airCatch && b.state === 'fly' && !b.onFloor && b.vy > -150 && dist(m.x, m.y, b.x, b.y) < b.r + 24) { pickUp(true); A.float('caught it!', m.x, m.y - 60, 'pt-small'); }
          break; }
        case 'pick': dog.setPose(o.dipPose || 'eat'); attach(); if (t > 0.28) { st = 'carry'; t = 0; } break;
        case 'carry': {
          attach(); if (dog.air) break;
          var tx = o.deliverX ? o.deliverX() : A.deliverX(), off2 = dog.mouthOff(), side2 = dog.x >= tx ? 1 : -1;
          if (dog.runTo(tx + side2 * off2, speed() * 0.85 * (o.carryK || 1), dt)) { dog.face(side2 > 0 ? 'left' : 'right'); st = 'drop'; t = 0; }
          break; }
        case 'drop': dog.setPose('sit'); attach(); if (t > 0.32) { b.drop(); st = 'yay'; t = 0; A.sfx('pop'); if (o.onDeliver) o.onDeliver(); } break;
        case 'yay': dog.setPose('happy'); if (t > 1.1) { st = 'wait'; t = 0; } break;
      }
    };
    return me;
  }

  /* ==================== engine ==================== */
  function openToy(el, name, ctx) {
    ctx = ctx || {};
    injectCSS();
    var info = Object.assign({ key: 'mutt', name: 'Pup', outfit: null }, ctx.dog || {});
    var DN = info.name || 'Pup', time = ctx.time || 'day', weather = ctx.weather || 'sunny';
    var uidp = 'pt' + Math.random().toString(36).slice(2, 7);
    var impl = IMPL[name] || IMPL['Tennis Ball'];
    var alive = true, finished = false, raf = 0, timers = [], last = performance.now(), T = 0;
    var totals = { happiness: 0, bond: 0, coins: 0, energy: 0, clean: 0 };

    if (el && getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var root = div('pt-root', el); root.tabIndex = -1;
    var stage = div('pt-stage', root);
    var cfg = impl.cfg || {};
    var L = {};
    L.scene = div('pt-layer', stage, backdrop(cfg.scene || 'room', time, weather, uidp, ctx.season));
    var outdoor = cfg.scene === 'pond' || cfg.scene === 'yard', wx = outdoor ? { x: 0, y: 0, w: 1240, h: 620 } : { x: 850, y: 110, w: 250, h: 220 };
    if (weather === 'rain' || weather === 'snow') { var rn = div(weather === 'rain' ? 'pt-rain' : 'pt-snow', L.scene); rn.style.cssText += ';left:' + wx.x + 'px;top:' + wx.y + 'px;width:' + wx.w + 'px;height:' + wx.h + 'px;opacity:' + (outdoor ? 0.6 : 0.9); }
    L.actors = div('pt-layer', stage);
    L.front = div('pt-layer', stage);
    L.tint = div('pt-layer', stage);
    var tints = { night: 'rgba(28,38,86,.26)', dusk: 'rgba(240,140,90,.10)', dawn: 'rgba(246,170,170,.08)' };
    if (tints[time] && !cfg.dark) L.tint.style.background = tints[time];
    if (weather === 'rain' && !cfg.dark) L.tint.style.boxShadow = 'inset 0 0 120px rgba(90,110,150,.18)';
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    function mkCanvas() { var c = document.createElement('canvas'); c.className = 'pt-fx'; c.width = W * dpr; c.height = H * dpr; stage.appendChild(c); var g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return g; }
    var dg = cfg.dark ? mkCanvas() : null;
    var fg = mkCanvas();
    L.ui = div('pt-ui', stage);

    /* HUD */
    var hud = div('pt-hud', L.ui);
    div('pt-ico', hud, itemSVG(name));
    var titles = div('pt-titles', hud); div('pt-title' + (name.length > 12 ? ' pt-long' : ''), titles, esc(name));
    var hintEl = div('pt-hint', titles, '');
    var tally = div('pt-tally', hud, HEART + '<span>+0</span>'), tallyN = tally.querySelector('span');
    var timer = div('pt-timer', hud, '<span>playtime</span><b><i></i></b>'), timerBar = timer.querySelector('i');
    var done = document.createElement('button'); done.className = 'pt-btn'; done.type = 'button'; done.textContent = 'Done'; hud.appendChild(done);
    done.addEventListener('click', function (e) { e.stopPropagation(); close(); });

    /* bubble */
    var bub = div('pt-bubble', L.ui), bubT = 0, bubW = 160, bubH = 40;
    /* phone layout pieces (inactive on desktop) */
    var frameEl = div('pt-frame', root), dock = div('pt-dock', root), dHint = div('pt-dhint', dock), dockables = [], cardEl = null;
    var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches), phone = false, scale = 1, cam = { x: 0, vw: 700, s: 1, top: 0, off: 0, last: '' }, touch = false;

    var A = {
      W: W, H: H, GY: GY, L: L, ctx: ctx, DN: DN, time: time, weather: weather, uidp: uidp, key: info.key, tr: trait(info.key),
      line: function (slot, generic) { var b = LINES[info.key]; return (b && b[slot] && b[slot].length) ? b[slot] : generic; },
      mouse: { x: 400, y: 400, down: false }, samples: [],
      sfx: function (n) { try { if (ctx.sfx) ctx.sfx(n); } catch (e) { /* ignore */ } },
      hint: function (t) { if (coarse) t = t.replace(/Click to/g, 'Tap to').replace(/click/g, 'tap').replace(/Click/g, 'Tap').replace('hold the mouse and rub', 'hold and rub').replace('drag me & let go!', 'flick me!'); hintEl.textContent = t; dHint.textContent = t; },
      say: function (t, ms) { bub.textContent = t; bub.classList.add('pt-show'); bubT = (ms || 1700) / 1000; bubW = bub.offsetWidth || 160; bubH = bub.offsetHeight || 40; },
      float: function (t, x, y, cls) { var f = div('pt-float' + (cls ? ' ' + cls : ''), L.ui, esc(t)); f.style.left = (phone ? clamp(x, cam.x + 80, cam.x + cam.vw - 80) : clamp(x, 90, W - 90)) + 'px'; f.style.top = clamp(y, 80, H - 40) + 'px'; A.later(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1450); },
      later: function (fn, ms) { var id = setTimeout(function () { timers.splice(timers.indexOf(id), 1); if (alive) fn(); }, ms); timers.push(id); return id; },
      deliverX: function () { return clamp(A.mouse.x, 130, W - 130); },
      vel: function () {
        var S = A.samples, n = S.length; if (n < 2) return { vx: 0, vy: 0 };
        var last = S[n - 1], zi = n - 1;
        while (zi > 0 && Math.abs(S[zi].x - S[zi - 1].x) + Math.abs(S[zi].y - S[zi - 1].y) < 0.5) zi--;
        var z = S[zi]; if (zi === 0 || last.t - z.t > 90) return { vx: 0, vy: 0 };
        var a = z; for (var i = zi - 1; i >= 0 && z.t - S[i].t <= 120; i--) a = S[i];
        var dt = Math.max(0.016, (z.t - a.t) / 1000);
        return { vx: (z.x - a.x) / dt, vy: (z.y - a.y) / dt };
      },
      reward: function (r) {
        if (!r) return;
        var out = {}, any = false;
        ['happiness', 'bond', 'coins'].forEach(function (k) { var v = Math.max(0, Math.min(+r[k] || 0, CAP[k] - totals[k])); if (v > 0) { out[k] = v; totals[k] += v; any = true; } });
        if (r.energy) { out.energy = r.energy; totals.energy += r.energy; any = true; }
        if (r.clean > 0) { out.clean = r.clean; totals.clean += r.clean; any = true; }
        if (r.cool) { out.cool = true; any = true; }
        if (!any) return;
        tallyN.textContent = '+' + Math.round(totals.happiness);
        try { if (ctx.reward) ctx.reward(out); } catch (e) { /* ignore */ }
      },
      cursor: function (c) { if (root.style.cursor !== c) root.style.cursor = c; },
      sprite: function (svg, w, h, parent, ax, ay) { return sprite(svg, w, h, parent || L.actors, ax, ay); },
      itemSVG: itemSVG,
      prop: function (n, o) { return art('prop', n, o); },
      div: div,
      parts: [],
      addPart: function (p) { var q = { x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 1, t: 0, size: 6, type: 'dust', color: '#9CC8EA' }; for (var k in p) q[k] = p[k]; A.parts.push(q); if (A.parts.length > 240) A.parts.shift(); },
      burst: function (type, x, y, n, o) { o = o || {}; for (var i = 0; i < n; i++) { var a = (o.a0 == null ? -Math.PI : o.a0) + Math.random() * (o.spread == null ? Math.PI : o.spread), sp = (o.sp || 260) * (0.4 + Math.random() * 0.8); A.addPart({ type: type, x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g == null ? 900 : o.g, life: o.life || 0.8, size: o.size || 5, color: o.color || '#9CC8EA' }); } },
      shadow: function (g, x, y, h, w) { var k = clamp(1 - h / 420, 0.25, 1); g.fillStyle = 'rgba(91,61,50,' + (0.16 * k).toFixed(3) + ')'; g.beginPath(); g.ellipse(x, y, (w || 22) * k, 6 * k, 0, 0, Math.PI * 2); g.fill(); },
      finish: function (title, sub) { endSession(title, sub); },
      get finished() { return finished; },
      meter: function (label, x, y, w, zone) {
        var p = div('pt-panel', L.ui); p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.width = w + 'px'; A.dockable(p);
        var lab = div('pt-lab', p, esc(label)), m = div('pt-meter', p);
        if (zone) { var z = div('pt-zone', m); z.style.left = (zone[0] * 100) + '%'; z.style.width = ((zone[1] - zone[0]) * 100) + '%'; if (zone[2]) { var ov = div('pt-over', m); ov.style.width = ((1 - zone[2]) * 100) + '%'; } }
        var fill = zone ? null : m.appendChild(document.createElement('i')), needle = zone ? div('pt-needle', m) : null;
        var lastN = -1;
        return { el: p, lab: lab, set: function (v) { v = clamp(v, 0, 1); if (fill) fill.style.transform = 'scaleX(' + v.toFixed(3) + ')'; if (needle) { var n = Math.round(v * 400) / 4; if (n !== lastN) { needle.style.left = n + '%'; lastN = n; } } } };
      },
      button: function (label, x, y, cls, fn) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'pt-btn ' + (cls || ''); b.textContent = label; b.style.position = 'absolute'; b.style.left = x + 'px'; b.style.top = y + 'px';
        b.addEventListener('click', function (e) { e.stopPropagation(); if (!finished) fn(); }); L.ui.appendChild(b); A.dockable(b); return b;
      },
      dockable: function (e) { dockables.push(e); if (phone) dock.appendChild(e); return e; },
      isTouch: function () { return coarse || touch; },
      hitR: function (r) { return touch ? Math.max(r, 32 / Math.max(0.2, scale)) : r; },
      tip: function (text, x, y) { if (coarse) text = text.replace(/click/g, 'tap').replace('drag me & let go!', 'flick me!'); var t = div('pt-tip', L.ui, esc(text)); t.style.left = x + 'px'; t.style.top = y + 'px'; return { el: t, hide: function () { if (t.parentNode) t.parentNode.removeChild(t); } }; }
    };

    /* compact = the phone strip (same test as fit() below): games with fixed props pull them closer together */
    var w0 = (el && el.clientWidth) || W, h0 = (el && el.clientHeight) || H;
    A.compact = w0 < 760 || (h0 > w0 * 1.1 && w0 < 1024);
    A.dog = makeDog(A, info, L.actors);
    var toy = impl(A);
    A.dog.prerender(toy.poses || ['idle', 'sit', 'walk', 'happy']);
    if (toy.hint) A.hint(toy.hint);
    var dur = toy.dur || 45, timeLeft = dur;

    /* ---- scaling ---- */
    var PH = impl.phone || { vw: 700 }, VY = 76, VH = H - VY;
    cam.vw = PH.vw || 700;
    function setMode(ph) {
      if (ph === phone) return;
      phone = ph; root.classList.toggle('pt-phone', ph);
      if (ph) { root.insertBefore(hud, frameEl); dockables.forEach(function (e) { dock.appendChild(e); }); if (cardEl) root.appendChild(cardEl); }
      else { L.ui.insertBefore(hud, L.ui.firstChild); dockables.forEach(function (e) { L.ui.appendChild(e); }); if (cardEl) L.ui.appendChild(cardEl); stage.style.transform = ''; cam.last = ''; }
    }
    function camFocus() { var f = toy.focus ? toy.focus() : (PH.fx != null ? PH.fx : A.dog.x); return clamp(f - cam.vw / 2, 0, W - cam.vw); }
    function applyCam() {
      var t = 'translate(' + f1(cam.off - cam.x * cam.s) + 'px,' + f1(cam.top - VY * cam.s) + 'px) scale(' + cam.s.toFixed(4) + ')';
      if (t !== cam.last) { stage.style.transform = t; cam.last = t; }
    }
    function fit() {
      var w = el.clientWidth || W, h = el.clientHeight || H;
      setMode(w < 760 || (h > w * 1.1 && w < 1024));
      if (!phone) {
        scale = Math.min(w / W, h / H) || 1;
        stage.style.transform = 'translate(' + f1((w - W * scale) / 2) + 'px,' + f1((h - H * scale) / 2) + 'px) scale(' + scale.toFixed(4) + ')';
        return;
      }
      var top = hud.offsetHeight + 12;
      dock.style.top = 'auto'; var need = Math.max(70, Math.min(dock.scrollHeight, h * 0.4));
      var s = Math.min((w - 8) / (PH.vwMin || PH.vw || 700), (h - top - need - 8) / VH);
      if (!(s > 0)) s = 0.3;
      cam.vw = Math.min(W, (w - 8) / s);
      cam.s = s; scale = s; cam.top = top; cam.off = (w - cam.vw * s) / 2;
      var vh = VH * s;
      frameEl.style.top = (top - 2) + 'px'; frameEl.style.height = (vh + 4) + 'px';
      frameEl.style.left = Math.max(2, cam.off - 2) + 'px'; frameEl.style.right = Math.max(2, cam.off - 2) + 'px';
      dock.style.top = (top + vh + 6) + 'px';
      cam.x = camFocus(); cam.last = ''; applyCam();
    }
    fit();
    var ro = null; if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(el); } else window.addEventListener('resize', fit);

    /* ---- input ---- */
    function toLocal(e) { if (e.pointerType) touch = e.pointerType === 'touch' || e.pointerType === 'pen'; var r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; }
    function track(p, e) { var now = e && e.timeStamp > 0 && Math.abs(e.timeStamp - performance.now()) < 1000 ? e.timeStamp : performance.now(); A.samples.push({ x: p.x, y: p.y, t: now }); while (A.samples.length && now - A.samples[0].t > 240) A.samples.shift(); A.mouse.x = p.x; A.mouse.y = p.y; }
    function onDown(e) {
      if (e.target.closest && e.target.closest('.pt-btn,.pt-card,.pt-hud,.pt-dock')) return;
      if (e.button != null && e.button !== 0) return;
      var p = toLocal(e); A.samples.length = 0; track(p, e); A.mouse.down = true;
      try { root.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
      if (!finished && toy.down) toy.down(p.x, p.y, e);
      e.preventDefault();
    }
    function onMove(e) { var p = toLocal(e); track(p, e); if (!finished && toy.move) toy.move(p.x, p.y, e); }
    function onUp(e) { var p = toLocal(e); track(p, e); var was = A.mouse.down; A.mouse.down = false; if (was && !finished && toy.up) toy.up(p.x, p.y, e); }
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(); } }
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('lostpointercapture', function (e) { if (A.mouse.down) onUp(e); });
    window.addEventListener('keydown', onKey);
    root.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* ---- particles ---- */
    function drawHeart(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * 0.8); g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.3); g.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.8); g.fillStyle = PINK; g.fill(); g.lineWidth = 1.6; g.strokeStyle = INK; g.stroke(); }
    function drawNote(g, x, y, s) { g.fillStyle = INK; g.beginPath(); g.ellipse(x, y, s * 0.55, s * 0.4, -0.4, 0, Math.PI * 2); g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.beginPath(); g.moveTo(x + s * 0.5, y); g.lineTo(x + s * 0.5, y - s * 1.6); g.quadraticCurveTo(x + s * 1.2, y - s * 1.2, x + s * 1.1, y - s * 0.7); g.stroke(); }
    function drawParts(g, dt) {
      var ps = A.parts;
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i]; p.t += dt; if (p.t >= p.life) { ps.splice(i, 1); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        var a = 1 - p.t / p.life; g.globalAlpha = a;
        if (p.type === 'drop') { g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, p.size, 0, Math.PI * 2); g.fill(); g.lineWidth = 1.2; g.strokeStyle = INK; g.stroke(); }
        else if (p.type === 'dust') { g.fillStyle = 'rgba(168,150,138,.55)'; g.beginPath(); g.arc(p.x, p.y, p.size * (1 + p.t * 2), 0, Math.PI * 2); g.fill(); }
        else if (p.type === 'heart') drawHeart(g, p.x, p.y, p.size);
        else if (p.type === 'note') drawNote(g, p.x, p.y, p.size);
        else if (p.type === 'spark') { g.strokeStyle = '#E2A800'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(p.x - p.size, p.y); g.lineTo(p.x + p.size, p.y); g.moveTo(p.x, p.y - p.size); g.lineTo(p.x, p.y + p.size); g.stroke(); }
        else if (p.type === 'z') { g.fillStyle = INK; g.font = '700 ' + Math.round(p.size * 4) + 'px Caveat, cursive'; g.fillText('z', p.x, p.y); }
        else if (p.type === 'glow') { g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, p.size * a, 0, Math.PI * 2); g.fill(); }
        else if (p.type === 'ring') { g.strokeStyle = INK; g.lineWidth = 1.8; g.beginPath(); g.arc(p.x, p.y, p.size * (1 + p.t / p.life * 0.9), 0, Math.PI * 2); g.stroke(); g.strokeStyle = '#9CC8EA'; g.lineWidth = 1.2; g.beginPath(); g.arc(p.x + 1, p.y - 1, p.size * (0.8 + p.t / p.life), 0, Math.PI * 2); g.stroke(); }
        else if (p.type === 'bub') drawBubble(g, p.x, p.y, p.size, a);
        else if (p.type === 'crumb') { g.fillStyle = p.color; g.beginPath(); g.ellipse(p.x, p.y, p.size, p.size * 0.7, p.t * 6, 0, Math.PI * 2); g.fill(); g.lineWidth = 1; g.strokeStyle = INK; g.stroke(); }
      }
      g.globalAlpha = 1;
    }

    /* ---- loop ---- */
    function frame(now) {
      if (!alive) return;
      var dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05; if (dt < 0) dt = 0; T += dt;
      if (!finished) { timeLeft -= dt; timerBar.style.transform = 'scaleX(' + clamp(timeLeft / dur, 0, 1).toFixed(3) + ')'; if (timeLeft <= 0) endSession(); }
      try { if (toy.update) toy.update(dt, T); } catch (err) { if (window.console) console.warn('PawToys update', err); }
      A.dog.update(dt); A.dog.render();
      if (phone) { cam.x += (camFocus() - cam.x) * Math.min(1, dt * 3); applyCam(); }
      fg.clearRect(0, 0, W, H);
      if (toy.drawFx) toy.drawFx(fg, T);
      drawParts(fg, dt);
      if (dg && toy.drawDark) toy.drawDark(dg, T);
      if (bubT > 0) {
        bubT -= dt; if (bubT <= 0) bub.classList.remove('pt-show');
        var hp = A.dog.head(), bw = bubW, bh = bubH, right = A.dog.facing === 'left';
        var bx = phone ? clamp(right ? hp.x - bw + 40 : hp.x - 30, cam.x + 8, cam.x + cam.vw - bw - 8) : clamp(right ? hp.x - bw + 40 : hp.x - 30, 10, W - bw - 10), by = clamp(hp.y - bh - 46, 80, H - bh - 10);
        bub.classList.toggle('pt-r', right);
        bub.style.transform = 'translate3d(' + f1(bx) + 'px,' + f1(by) + 'px,0)';
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function endSession(title, sub) {
      if (finished || !alive) return;
      finished = true; A.mouse.down = false; A.cursor('default');
      timerBar.style.transform = 'scaleX(0)';
      if (toy.onFinish) { try { toy.onFinish(); } catch (e) { /* ignore */ } }
      var bonus = toy.finish ? toy.finish() : null;
      if (bonus) A.reward(bonus);
      var bits = [];
      if (totals.happiness) bits.push('+' + Math.round(totals.happiness) + ' Happiness');
      if (totals.bond) bits.push('+' + totals.bond + ' Bond');
      if (totals.coins) bits.push('+' + totals.coins + ' coins');
      if (totals.energy > 0) bits.push('+' + totals.energy + ' Energy');
      if (totals.clean > 0) bits.push('+' + totals.clean + ' Cleanliness');
      var card = cardEl = div('pt-card', phone ? root : L.ui,
        '<div class="pt-card-t">' + esc(title || pick(['What a play session!', 'Best. Game. Ever.', 'Tail status: wagging'])) + '</div>' +
        '<div class="pt-card-s">' + esc(sub || (toy.cardSub && toy.cardSub()) || (DN + ' had a wonderful time with the ' + name + '.')) + '</div>' +
        '<div class="pt-card-r">' + esc(bits.join('  ·  ') || 'Pure fun, no stats needed') + '</div>');
      var b2 = document.createElement('button'); b2.type = 'button'; b2.className = 'pt-btn'; b2.textContent = 'Done'; card.appendChild(b2);
      b2.addEventListener('click', function (e) { e.stopPropagation(); close(); });
      A.sfx('levelup');
      try { b2.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }

    var closedOnce = false;
    function close() {
      if (closedOnce) return; closedOnce = true; alive = false;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout); timers.length = 0;
      if (toy.cleanup) { try { toy.cleanup(); } catch (e) { /* ignore */ } }
      root.removeEventListener('pointerdown', onDown); root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp); root.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', fit);
      if (root.parentNode) root.parentNode.removeChild(root);
      try { if (ctx.onClose) ctx.onClose(); } catch (e) { /* ignore */ }
    }
    try { root.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    var ctl = { close: close };
    Object.defineProperty(ctl, '_dbg', { value: function () { return { toy: toy.dbg ? toy.dbg() : null, dog: { x: A.dog.x, y: A.dog.y, pose: A.dog.pose, facing: A.dog.facing }, totals: totals, finished: finished, timeLeft: timeLeft, kind: A.kindN || 0 }; } });
    Object.defineProperty(ctl, '_end', { value: function () { endSession(); } });
    Object.defineProperty(ctl, '_map', { value: function (x, y) { var r = stage.getBoundingClientRect(); return { x: r.left + x * scale, y: r.top + y * scale, phone: phone, scale: scale }; } });
    return ctl;
  }

  /* ==================== toys ==================== */
  var IMPL = {};

  /* ---------- shared: ball-style fetch (Tennis Ball, Glow Ball) ---------- */
  function ballToy(A, glow) {
    var dog = A.dog, DN = A.DN, R = glow ? 24 : 26;
    var floor = function () { return GY + 8 - R; };
    var b = thrower(A, { x: 330, y: floor(), r: R, floor: floor, bounce: 0.55, g: 1900, spinK: 0.35, ceil: 104 }), ceilHits = 0;
    var spr = A.sprite(A.itemSVG(glow ? 'Glow Ball' : 'Tennis Ball'), R * 3, R * 3);
    dog.x = 800; dog.face('left'); dog.setPose('sit');
    var lastF = 560, fetches = 0, arcs = 0, bonks = 0, bonkCD = 0, trail = [], tip = A.tip('drag me & let go!', 250, 420);
    var brain = fetchBrain(A, b, {
      speed: (glow ? 470 : 440) * A.tr.run, carryK: A.tr.carry, carryFwd: R * 0.55, airCatch: true,
      onPick: function (air) { if (air) A.reward({ happiness: 1 }); },
      onDeliver: function () {
        fetches++;
        A.reward({ happiness: 2, coins: fetches % 2 === 0 ? 1 : 0, energy: -1 });
        A.say(pick(A.line('fetchDeliver', glow ? ['I caught the moon!', 'it glows. I glow. we glow.', 'again! in the dark!'] : ['again! AGAIN!', 'slobber included, free', 'I am very fast. ask me.', 'it was hiding. I found it.'])), 1700);
        if (A.tr.flop) brain.pause(1.5, 'sleep', 'wait');
        A.float(pick(['good fetch!', 'what a dog!', 'fetch-tastic!']), dog.x, dog.y - 250);
      }
    });
    A.say(glow ? 'ooh. spooky. throw it!' : pick(A.line('fetchStart', ['throw it! THROW IT!'])), 2000);
    var stars = []; for (var i = 0; i < 40; i++) stars.push([Math.random() * W, 90 + Math.random() * 300, Math.random() * 6]);
    function cb() {
      return {
        ceil: function () { A.sfx('bonk'); ceilHits++; if (ceilHits <= 2 || Math.random() < 0.3) A.float(pick(['ceiling!', 'not the ceiling!', 'bonk (ceiling)']), b.x, 140, 'pt-blue pt-small'); },
        bounce: function (v) {
          if (v > 300) A.sfx('bounce');
          if (b.bounces === 1 && b.thrown) {
            var apex = floor() - b.minY, far = Math.abs(b.x - b.relX);
            if (b.minY > -999 && apex > 170 && apex < 420 && far > 200) { arcs++; A.float('nice arc!', b.x, b.minY + 40, 'pt-gold'); if (arcs <= 4) A.reward({ happiness: 1 }); }
            
          }
        }
      };
    }
    return {
      poses: ['idle', 'sit', 'walk', 'happy', 'eat', 'jump'],
      dur: 50,
      hint: glow ? 'Night mode! Drag and release to throw the Glow Ball. Watch the trail.' : 'Drag the ball and release to throw it! Bounce it off ' + DN + '’s head for a laugh.',
      down: function (x, y) { if (b.canGrab() && dist(x, y, b.x, b.y) < A.hitR(R + 40)) { b.grab(x, y); A.cursor('grabbing'); if (tip) { tip.hide(); tip = null; } } },
      move: function (x, y) { if (b.state === 'held') b.hold(x, y); else A.cursor(b.canGrab() && dist(x, y, b.x, b.y) < R + 40 ? 'grab' : 'default'); },
      up: function () { if (b.state === 'held') { var v = b.release(); if (v.speed > 600) A.sfx('whoosh'); A.cursor('default'); } },
      update: function (dt, T) {
        bonkCD -= dt;
        b.step(dt, cb());
        if (b.state === 'fly' && bonkCD <= 0 && !dog.air) {
          var h = dog.head();
          if (b.vy > 0 && b.y < h.y + 6 && dist(b.x, b.y, h.x, h.y) < R + 36) {
            b.vy = -Math.max(560, b.vy * 0.8); b.vx += (b.x - h.x) * 6 + (Math.random() - 0.5) * 120; b.thrown = true; bonkCD = 0.6; bonks++;
            A.sfx('bonk'); dog.squash(0.78); A.float('BOING!', h.x, h.y - 50, 'pt-gold');
            A.say(pick(['ow. again!', 'my head is a trampoline now', 'I meant to do that.', 'bonk!? BONK.']), 1600);
            if (bonks <= 3) A.reward({ happiness: 1 });
          }
        }
        brain.update(dt);
        spr.set(b.x, b.y, b.rot);
        if (glow) { trail.push([b.x, b.y]); if (trail.length > 26) trail.shift(); }
      },
      drawFx: function (g, T) {
        if (!glow) { A.shadow(g, b.x, GY + 9, floor() - b.y); return; }
        g.save(); g.globalCompositeOperation = 'lighter';
        for (var i = 1; i < trail.length; i++) { var a = i / trail.length; g.strokeStyle = 'rgba(190,255,120,' + (a * 0.55).toFixed(3) + ')'; g.lineWidth = 4 + a * 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(trail[i - 1][0], trail[i - 1][1]); g.lineTo(trail[i][0], trail[i][1]); g.stroke(); }
        var rg = g.createRadialGradient(b.x, b.y, 4, b.x, b.y, 70); rg.addColorStop(0, 'rgba(230,255,170,.9)'); rg.addColorStop(1, 'rgba(160,255,120,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(b.x, b.y, 70, 0, Math.PI * 2); g.fill(); g.restore();
        g.fillStyle = 'rgba(190,255,120,.35)'; g.beginPath(); g.ellipse(b.x, GY + 9, 40, 8, 0, 0, Math.PI * 2); g.fill();
      },
      drawDark: function (g, T) {
        g.clearRect(0, 0, W, H);
        g.fillStyle = 'rgba(12,16,44,.84)'; g.fillRect(0, 0, W, H);
        g.save(); g.globalCompositeOperation = 'destination-out';
        var rg = g.createRadialGradient(b.x, b.y, 10, b.x, b.y, 230); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.5, 'rgba(0,0,0,.7)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(b.x, b.y, 230, 0, Math.PI * 2); g.fill();
        var h = dog.head(), rd = g.createRadialGradient(h.x, h.y + 40, 10, h.x, h.y + 40, 170); rd.addColorStop(0, 'rgba(0,0,0,.45)'); rd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rd; g.beginPath(); g.arc(h.x, h.y + 40, 170, 0, Math.PI * 2); g.fill();
        g.restore();
        g.fillStyle = '#FFF4C8';
        for (var i = 0; i < stars.length; i++) { var s = stars[i], a = 0.4 + 0.4 * Math.sin(T * 2 + s[2]); g.globalAlpha = a; g.fillRect(s[0], s[1], 2.2, 2.2); }
        g.globalAlpha = 1;
      },
      focus: function () { if (b.state !== 'held') lastF = b.state === 'fly' && b.thrown ? lerp(b.x, dog.x, 0.35) : (b.x + dog.x) / 2; return lastF; },
      finish: function () { return { happiness: 2, energy: -3 }; },
      dbg: function () { return { ball: { x: b.x, y: b.y, state: b.state, thrown: b.thrown }, brain: brain.state, fetches: fetches, arcs: arcs, bonks: bonks }; }
    };
  }
  IMPL['Tennis Ball'] = function (A) { return ballToy(A, false); };
  IMPL['Glow Ball'] = function (A) { return ballToy(A, true); };
  IMPL['Glow Ball'].cfg = { dark: true };
  IMPL['Tennis Ball'].phone = IMPL['Glow Ball'].phone = { vw: 720, vwMin: 560 };

  /* ---------- Rope Tug ---------- */
  IMPL['Rope Tug'] = function (A) {
    var dog = A.dog, DN = A.DN;
    var p = 0, grab = false, T0 = 0, tension = 0, phase = 0, burst = false, round = 1, state = 'tug', stT = 0, letWin = false, slipCD = 0, wins = 0, losses = 0;
    var meter = A.meter('pull meter: stay in the green!', 450, 92, 340, [0.45, 0.78, 0.9]);
    var letBtn = A.button('Let ' + DN + ' win', 40, 560, 'pt-pinkb', function () { if (state === 'tug') { letWin = true; A.say('wait... really?! YES!', 1600); } });
    var tip = A.tip('grab here & drag left!', 200, 360);
    var rMeter = A.meter('who is winning?', 860, 92, 260, null);
    dog.face('left'); dog.setPose('crouch');
    function handleX() { return 380 + p * 190; }
    function dogX() { return 880 + p * 190; }
    function reset() { p = 0; state = 'tug'; stT = 0; letWin = false; phase = 0; dog.rot = 0; dog.setPose('crouch'); dog.face('left'); A.say(round === 2 ? 'rematch. grrr.' : pick(A.line('tugStart', ['grrr (playfully)'])), 1400); }
    reset();
    return {
      poses: ['crouch', 'sit', 'happy', 'walk', 'jump', 'pet'],
      dur: 50,
      hint: 'Grab the rope end and drag LEFT in rhythm with ' + DN + '’s pulls. Keep the needle in the green!',
      down: function (x, y) { if (state === 'tug' && dist(x, y, handleX(), GY - 60) < A.hitR(110)) { grab = true; A.cursor('grabbing'); if (tip) { tip.hide(); tip = null; } } },
      move: function (x, y) { if (!grab) A.cursor(state === 'tug' && dist(x, y, handleX(), GY - 60) < 110 ? 'grab' : 'default'); },
      up: function () { grab = false; A.cursor('default'); },
      update: function (dt, T) {
        stT += dt; slipCD -= dt;
        var target = grab ? clamp((handleX() + 40 - A.mouse.x) / 300, 0, 1) : 0;
        tension += (target - tension) * Math.min(1, dt * 10);
        meter.set(tension);
        if (state === 'tug') {
          phase += dt / 1.5; if (phase >= 1) phase -= 1;
          var nb = phase < 0.38;
          if (nb && !burst) { A.sfx('tug'); if (Math.random() < 0.35) A.sfx('squeak'); if (A.tr.fierce && Math.random() < 0.5) A.sfx('bark'); if (Math.random() < (A.tr.fierce ? 0.65 : 0.3)) A.say(pick(A.line('tugGrowl', ['grrrr!', 'GRRR (lovingly)', 'mine mine mine', 'hrrrnngh'])), 900); }
          burst = nb;
          var dogF = burst ? 0.95 : 0.3, pf = 0, inZone = tension >= 0.45 && tension <= 0.78;
          if (tension > 0.9) { pf = 0.15; if (slipCD <= 0) { slipCD = 1.6; A.float('too hard! slipped', handleX(), GY - 170, 'pt-blue pt-small'); A.sfx('nope'); } }
          else if (inZone) pf = burst ? 1.45 : 1.0;
          else pf = tension * 0.8;
          if (letWin) { dogF = 2.2; pf = 0; }
          p = clamp(p + (dogF - pf) * dt * 0.42, -1, 1);
          dog.rot = burst ? (A.tr.fierce ? 9 + Math.sin(T * 60) * 4 : 7 + Math.sin(T * 40) * 2) : Math.sin(T * 6) * 2;
          dog.setPose('crouch');
          if (p <= -1) {
            state = 'youwin'; stT = 0; wins++; dog.rot = 0; dog.setPose('sit'); A.sfx('levelup');
            A.float('BOND MOMENT!', 620, 300, 'pt-gold'); A.say(pick(A.line('tugYouWin', ['you are... so strong. I love you.', 'ok ok you win. hug?'])), 2200);
            A.reward({ bond: 1, happiness: 4, energy: -2 }); A.burst('heart', dog.head().x, dog.head().y, 8, { g: -60, sp: 120, life: 1.6, size: 9 });
          } else if (p >= 1) {
            state = 'dogwin'; stT = 0; losses++; dog.rot = 0; dog.setPose('happy'); A.sfx('bark');
            if (letWin) { A.float('good sport bonus!', 620, 300, 'pt-gold'); A.reward({ happiness: 8, energy: -2 }); A.say('I AM THE CHAMPION OF ROPE', 2200); }
            else { A.reward({ happiness: 4, energy: -2 }); A.say(pick(A.line('tugDogWin', ['VICTORY! (you can try again)'])), 2000); }
          }
        } else {
          grab = false;
          if (state === 'dogwin') { dog.face(stT % 0.5 < 0.25 ? 'left' : 'right'); dog.setPose(stT < 1.4 ? 'happy' : 'jump'); if (stT > 1.4 && stT < 1.45 && !dog.air) dog.jump(-600, 0); }
          else { dog.setPose(stT < 1.2 ? 'sit' : 'pet'); if (Math.random() < dt * 3) A.addPart({ type: 'heart', x: dog.head().x + (Math.random() - 0.5) * 40, y: dog.head().y, vy: -60, life: 1.4, size: 8 }); }
          if (stT > 3 && !dog.air) { round++; reset(); }
        }
        dog.x = dogX(); rMeter.set((1 - p) / 2);
        letBtn.style.opacity = state === 'tug' ? '1' : '.5';
      },
      drawFx: function (g, T) {
        var hx = handleX() - (grab ? Math.min(40, tension * 50) : 0), hy = GY - 60;
        if (state === 'dogwin') hx = dog.mouth().x - 140;
        var m = dog.mouth(), mx = m.x, my = m.y + 4;
        var sag = 60 * (1 - tension) * (state === 'tug' ? 1 : 1.6) + (burst ? -8 : 0);
        var cx = (hx + mx) / 2, cy = (hy + my) / 2 + sag + (burst ? Math.sin(T * 50) * 3 : 0);
        g.lineCap = 'round';
        g.strokeStyle = INK; g.lineWidth = 17; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(cx, cy, mx, my); g.stroke();
        g.strokeStyle = '#F6E7CF'; g.lineWidth = 12; g.stroke();
        g.setLineDash([9, 11]); g.lineDashOffset = -p * 120; g.strokeStyle = '#E8504A'; g.lineWidth = 12; g.stroke(); g.setLineDash([]);
        var kx = 0.25 * hx + 0.5 * cx + 0.25 * mx, ky = 0.25 * hy + 0.5 * cy + 0.25 * my;
        g.fillStyle = PINK; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(kx, ky); g.lineTo(kx - 12, ky + 26); g.lineTo(kx + 12, ky + 26); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#E8504A'; g.beginPath(); g.arc(hx, hy, 20, 0, Math.PI * 2); g.fill(); g.lineWidth = 2.6; g.stroke();
        g.strokeStyle = INK; g.lineWidth = 2; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(630, GY - 30); g.lineTo(630, GY + 40); g.stroke(); g.setLineDash([]);
        g.fillStyle = INK; g.font = '700 22px Caveat, cursive'; g.fillText('the line', 600, GY + 64);
        if (state === 'tug' && burst) { g.font = '700 34px Caveat, cursive'; g.fillStyle = '#E8504A'; g.fillText('PULL!', dog.x - 30, dog.y - 220 - Math.sin(T * 20) * 4); }
      },
      finish: function () { return { happiness: 2 }; },
      cleanup: function () { },
      dbg: function () { return { p: p, tension: tension, state: state, wins: wins, losses: losses, hx: handleX() }; }
    };
  };

  /* ---------- Squeaky Duck ---------- */
  IMPL['Squeaky Duck'] = function (A) {
    var dog = A.dog, DN = A.DN;
    var DX = 400, DY = GY - 52, duck = A.sprite(A.itemSVG('Squeaky Duck'), 160, 160);
    var T0 = 0, sq = 0, state = 'intro', stT = 0, intro = 0, pat = [], len = 3, beat = 0, clicks = [], tries = 0, rounds = 0, pounce = 0, tilt = 0;
    dog.x = 820; dog.face('left'); dog.setPose('sit');
    var panel = A.div('pt-panel', A.L.ui); panel.style.cssText += ';left:420px;top:92px;width:400px;height:96px;display:none'; A.dockable(panel);
    var plab = A.div('pt-lab', panel, ''), dogRow = A.div('', panel), youRow = A.div('', panel);
    dogRow.style.cssText = youRow.style.cssText = 'position:relative;height:28px';
    var tip = A.tip('click me!', 360, 380);
    function squeak() { A.sfx('squeak'); sq = 1; A.burst('dust', DX + 40, DY - 50, 3, { g: -40, sp: 60, life: 0.5, size: 4 }); }
    function makePattern() { pat = [0]; for (var i = 1; i < len; i++) pat.push(pat[i - 1] + pick([0.36, 0.36, 0.72])); }
    function dots(row, times, cls) {
      row.innerHTML = ''; var span = Math.max(1.4, pat[pat.length - 1]);
      times.forEach(function (t, i) { var d = A.div('pt-dot ' + (cls[i] || ''), row); d.style.left = (7 + (t / span) * 84) + '%'; d.style.top = '14px'; });
      return row.children;
    }
    function startListen() { makePattern(); state = 'listen'; stT = -0.5; beat = 0; clicks = []; panel.style.display = ''; plab.textContent = DN + ' barks a rhythm... listen!'; dots(dogRow, pat, []); youRow.innerHTML = ''; A.hint('Listen to the barks, then click the duck in the same rhythm.'); }
    function evaluate() {
      var ok = clicks.length === pat.length, cls = [];
      for (var i = 0; i < clicks.length; i++) { var good = i < pat.length && Math.abs(clicks[i] - pat[i]) <= Math.max(0.16, 0.3 * (pat[i] - (pat[i - 1] || 0)) + 0.1); cls.push(good ? 'pt-ok' : 'pt-bad'); if (!good) ok = false; }
      dots(youRow, clicks.slice(0, 8), cls);
      tries++;
      if (ok || tries >= 3) {
        rounds++; state = 'yay'; stT = 0; pounce = 1;
        if (ok) { A.float(len >= 5 ? 'PERFECT DUET!' : 'perfect copy!', 620, 260, 'pt-gold'); A.reward({ happiness: 3, coins: len >= 5 ? 1 : 0 }); A.say(pick(A.line('duckOk', ['you speak duck!', 'we are a BAND now', 'squeak squeak = I love you'])), 1800); }
        else { A.float('eh, close enough!', 620, 260, 'pt-small'); A.reward({ happiness: 1 }); A.say('that was jazz. I respect it.', 1800); }
        len = Math.min(6, len + 1); tries = 0; A.sfx('bark');
      } else { state = 'again'; stT = 0; A.say(pick(['close! again:', 'hmm, not quite. listen:']), 1400); }
    }
    return {
      poses: ['sit', 'idle', 'jump', 'happy', 'crouch', 'walk'],
      dur: 55,
      hint: 'Click the duck to squeak it. ' + DN + ' might have opinions.',
      down: function (x, y) {
        if (dist(x, y, DX, DY) > A.hitR(95)) return;
        if (tip) { tip.hide(); tip = null; }
        squeak();
        if (state === 'intro') { intro++; tilt = intro % 2 ? 14 : -14; if (intro === 1) A.say('?', 900); if (intro === 2) A.say('!!', 900); if (intro >= 3) { state = 'pounce'; stT = 0; pounce = 1; dog.jump(-820, -330); A.say('GOT IT. (I did not get it)', 1500); A.reward({ happiness: 2 }); } }
        else if (state === 'yours') { var nowS = performance.now() / 1000; if (!clicks.length) T0 = nowS; clicks.push(nowS - T0); dots(youRow, clicks.slice(0, 8), clicks.map(function () { return 'pt-you'; })); stT = 0; if (clicks.length >= pat.length) { state = 'judge'; stT = 0; } }
        else if (state === 'listen') A.say('shh! listen!', 900);
      },
      move: function (x, y) { A.cursor(dist(x, y, DX, DY) < 95 ? 'pointer' : 'default'); },
      update: function (dt, T) {
        stT += dt; sq = Math.max(0, sq - dt * 6);
        duck.set(DX, DY, Math.sin(T * 2) * 3, 1 + sq * 0.12, 1 - sq * 0.22);
        tilt += (0 - tilt) * dt * 1.5; dog.tilt = state === 'intro' ? tilt : 0;
        if (state === 'pounce') { if (!dog.air) { dog.setPose('happy'); dog.runTo(820, 300, dt) && dog.face('left'); if (stT > 1.6 && Math.abs(dog.x - 820) < 6) { dog.face('left'); startListen(); } } }
        else if (state === 'listen' || state === 'again') {
          if (state === 'again' && stT > 1.2) { state = 'listen'; stT = -0.3; beat = 0; clicks = []; youRow.innerHTML = ''; }
          if (state === 'listen') {
            dog.setPose('sit');
            var kids = dogRow.children;
            while (beat < pat.length && stT >= pat[beat]) { if (A.tr.snort && beat > 0 && Math.random() < 0.6) A.later(function () { A.sfx('sniff'); A.say(pick(A.line('duckListen', ['*snort*'])), 500); A.burst('dust', A.dog.mouth().x, A.dog.mouth().y, 3, { g: -30, sp: 70, life: 0.5, size: 3 }); }, 160); A.sfx('bark'); dog.squash(0.86); if (kids[beat]) kids[beat].classList.add('pt-lit'); A.addPart({ type: 'note', x: dog.head().x, y: dog.head().y - 20, vx: -30, vy: -90, life: 0.9, size: 9 }); beat++; }
            if (beat >= pat.length && stT > pat[pat.length - 1] + 0.6) { state = 'yours'; stT = 0; clicks = []; plab.textContent = 'Your turn! Squeak it back (' + pat.length + ' squeaks)'; A.say('your turn!', 1100); }
          }
        } else if (state === 'yours') { dog.setPose('sit'); dog.tilt = Math.sin(T * 3) * 6; if (clicks.length && stT > 1.8) { state = 'judge'; stT = 0; } }
        else if (state === 'judge') { if (stT > 0.25) evaluate(); }
        else if (state === 'yay') { if (pounce && !dog.air && stT < 0.1) { dog.jump(-760, -260); pounce = 0; } if (!dog.air) { dog.setPose('happy'); if (dog.runTo(820, 320, dt)) dog.face('left'); } if (stT > 2 && !dog.air && Math.abs(dog.x - 820) < 6) startListen(); }
        else if (state === 'intro') dog.setPose(intro ? 'idle' : 'sit');
      },
      finish: function () { return { happiness: 2, energy: -2 }; },
      dbg: function () { return { state: state, len: len, rounds: rounds, pat: pat, clicks: clicks }; }
    };
  };

  /* ---------- Frisbee ---------- */
  IMPL['Frisbee'] = function (A) {
    var dog = A.dog, DN = A.DN, FL = GY - 10, catches = 0, sky = 0, tip = A.tip('flick me fast!', 200, 420);
    var D = thrower(A, { x: 280, y: FL, r: 30, floor: function () { return FL; }, bounce: 0.2, g: 0 });
    var lastF = 520, spr = A.sprite(A.itemSVG('Frisbee'), 96, 96), ft = 0, curve = 1, ph = 0, catchH = 0;
    dog.x = 760; dog.face('left'); dog.setPose('sit');
    function step(dt) {
      if (D.state !== 'fly') return;
      ft += dt;
      var sp = Math.abs(D.vx), lift = D.onFloor ? 0 : Math.min(900, 280 + sp * 0.6) * Math.max(0, 1 - ft / 2.4);
      D.vy += (980 - lift + 170 * Math.sin(ft * 2.4 + ph)) * dt;
      D.vx += (-0.85 * D.vx + curve * 70) * dt;
      D.x += D.vx * dt; D.y += D.vy * dt; D.rot = clamp(D.vy * 0.025, -24, 24) + Math.sin(ft * 9) * 4;
      if (D.y < D.minY) D.minY = D.y;
      if (D.y < 90) { D.y = 90; D.vy = Math.abs(D.vy) * 0.3; }
      if (D.x < 40) { D.x = 40; D.vx = Math.abs(D.vx) * 0.5; }
      if (D.x > W - 40) { D.x = W - 40; D.vx = -Math.abs(D.vx) * 0.5; }
      if (D.y >= FL) { D.y = FL; if (D.vy > 200) A.sfx('bounce'); D.vy = 0; D.onFloor = true; D.vx *= Math.pow(0.02, dt); D.rot = 0; if (Math.abs(D.vx) < 20) { D.vx = 0; D.state = 'rest'; } }
    }
    var brain = fetchBrain(A, D, {
      speed: 560 * A.tr.run, carryK: A.tr.carry, carryDy: 6, carryRot: 0,
      predict: function () { return D.onFloor ? D.x : clamp(D.x + D.vx * 0.45, 80, W - 80); },
      jumpCatch: function (m) {
        if (D.state !== 'fly' || D.onFloor || dog.air) return false;
        var h = GY - D.y, dx = Math.abs(m.x - D.x);
        if (h > 80 && h < 420 && dx < 150 && D.vy > -220) {
          dog.face(D.x + D.vx * 0.2 > dog.x ? 'right' : 'left');
          var rise = Math.max(40, (dog.y - 108 * DS) - D.y + 24);
          var vy = -Math.sqrt(2 * G * rise), tUp = -vy / G, jm = dog.dir() * dog.mouthOff('jump');
          dog.jump(vy, clamp((D.x + D.vx * tUp - dog.x - jm) / Math.max(0.2, tUp), -560, 560));
          return true;
        }
        return false;
      },
      onPick: function (air) {
        if (air) {
          catchH = GY - D.y; catches++;
          if (catchH > 260) { sky++; A.float('SKY CATCH!', D.x, D.y - 40, 'pt-gold'); A.reward({ happiness: 3, coins: 2, energy: -1 }); A.say('I touched a cloud', 1600); }
          else if (catchH > 170) { A.float('nice leap!', D.x, D.y - 40); A.reward({ happiness: 2, coins: 1, energy: -1 }); A.say(pick(['did you SEE that?', 'air dog!']), 1500); }
          else { A.float('caught it!', D.x, D.y - 40, 'pt-small'); A.reward({ happiness: 2, energy: -1 }); }
        } else { A.say(pick(['ground ball. still counts.', 'it landed. I forgive it.']), 1500); A.reward({ happiness: 1 }); }
        if (air && LINES[A.key] && LINES[A.key].frisbee) A.say(pick(LINES[A.key].frisbee), 1600);
      },
      onDeliver: function () { A.say(pick(A.line('fetchDeliver', ['again but HIGHER', 'throw it to the moon', 'I am a professional'])), 1500); if (A.tr.flop) brain.pause(1.5, 'sleep', 'wait'); }
    });
    return {
      poses: ['sit', 'walk', 'jump', 'happy', 'eat', 'idle'],
      dur: 50,
      hint: 'Flick the frisbee with a quick drag. ' + DN + ' leaps to catch it. Higher catch = bonus!',
      down: function (x, y) { if ((D.state === 'rest' || (D.state === 'fly' && D.onFloor)) && dist(x, y, D.x, D.y) < A.hitR(80)) { D.grab(x, y); A.cursor('grabbing'); if (tip) { tip.hide(); tip = null; } } },
      move: function (x, y) { if (D.state === 'held') { D.x = clamp(x, 40, W - 40); D.y = Math.min(y, FL); } else A.cursor((D.state === 'rest') && dist(x, y, D.x, D.y) < 80 ? 'grab' : 'default'); },
      up: function () {
        if (D.state !== 'held') return; A.cursor('default');
        var v = D.release(); ft = 0; ph = Math.random() * 6; curve = Math.random() < 0.5 ? -1 : 1;
        if (v.speed < 380) { D.vx *= 0.4; D.vy = 0; D.thrown = false; A.float('flick faster!', D.x, D.y - 80, 'pt-blue pt-small'); }
        else { D.vx *= 0.7; D.vy = clamp(D.vy * 0.55, -700, 150); A.sfx('whoosh'); }
      },
      update: function (dt) { step(dt); brain.update(dt); spr.set(D.x, D.y, D.rot * (D.vx < 0 ? -1 : 1), 1, D.state === 'held' || D.state === 'carried' ? 0.7 : 0.5); },
      drawFx: function (g) { if (D.state === 'fly') A.shadow(g, D.x, GY + 6, GY - D.y, 30); if (D.state === 'fly' && !D.onFloor && Math.abs(D.vx) > 300) { g.strokeStyle = 'rgba(91,61,50,.35)'; g.lineWidth = 2; for (var i = 0; i < 3; i++) { g.beginPath(); g.moveTo(D.x - Math.sign(D.vx) * (40 + i * 6), D.y - 8 + i * 8); g.lineTo(D.x - Math.sign(D.vx) * (80 + i * 14), D.y - 8 + i * 8); g.stroke(); } } },
      focus: function () { if (D.state !== 'held') lastF = D.state === 'fly' && D.thrown ? lerp(D.x, dog.x, 0.3) : (D.x + dog.x) / 2; return lastF; },
      finish: function () { return { happiness: 2, energy: -3 }; },
      dbg: function () { return { disc: { x: D.x, y: D.y, state: D.state, thrown: D.thrown }, brain: brain.state, catches: catches, sky: sky }; }
    };
  };

  /* ---------- Plush Bone ---------- */
  IMPL['Plush Bone'] = function (A) {
    var dog = A.dog, DN = A.DN;
    var bone = { x: 300, y: GY - 28, held: false, home: { x: 300, y: GY - 28 }, vy: 0 }, spr = A.sprite(A.itemSVG('Plush Bone'), 120, 120);
    var blanket = A.sprite(blanketSVG(), 210, 72, A.L.front, 0.5, 1); blanket.el.style.clipPath = 'inset(100% 0 0 0)';
    var state = 'offer', stT = 0, tuck = 0, rubSpeed = 0, lastMove = 0, wakes = 0, half = false, tip = A.tip('drag me to ' + DN + '!', 230, 400), lastP = null;
    var dim = A.div('', A.L.tint); dim.style.cssText = 'position:absolute;inset:0;background:rgba(40,40,90,.22);opacity:0;transition:opacity 1.5s';
    dog.x = 820; dog.face('left'); dog.setPose('sit');
    A.say('is that... for me?', 2000);
    function near() { return Math.abs(bone.x - dog.x) < 190 && bone.y > GY - 260; }
    function overDog(x, y) { return Math.abs(x - dog.x) < 170 && y > GY - 190 && y < GY + 30; }
    return {
      poses: ['sit', 'pet', 'sleep', 'happy', 'idle'],
      dur: 45,
      hint: 'Drag the Plush Bone over to ' + DN + '.',
      down: function (x, y) {
        if (state === 'offer' && dist(x, y, bone.x, bone.y) < A.hitR(75)) { bone.held = true; A.cursor('grabbing'); if (tip) { tip.hide(); tip = null; } }
        lastP = { x: x, y: y, t: performance.now() };
      },
      move: function (x, y) {
        var now = performance.now();
        if (bone.held) { bone.x = clamp(x, 60, W - 60); bone.y = clamp(y, 120, GY - 28); return; }
        if (state === 'offer') A.cursor(dist(x, y, bone.x, bone.y) < 75 ? 'grab' : 'default');
        if ((state === 'tuck' || state === 'woke') && A.mouse.down && lastP && overDog(x, y)) {
          var dt = Math.max(8, now - lastP.t) / 1000, sp = dist(x, y, lastP.x, lastP.y) / dt;
          rubSpeed = rubSpeed * 0.6 + sp * 0.4; lastMove = now;
        }
        if (state === 'tuck') A.cursor(overDog(x, y) ? 'pointer' : 'default');
        lastP = { x: x, y: y, t: now };
      },
      up: function () {
        lastP = null; rubSpeed = 0;
        if (!bone.held) return; bone.held = false; A.cursor('default');
        if (near()) { state = 'hug'; stT = 0; A.sfx('squeak'); dog.setPose('pet'); A.say('my bone. my BEST friend.', 1800); A.reward({ happiness: 4 }); A.burst('heart', dog.head().x, dog.head().y, 7, { g: -50, sp: 110, life: 1.5, size: 9 }); A.hint('Aww. Look at those eyes getting heavy...'); }
        else { A.say(pick(['closer! I am lazy.', 'bring it HERE please']), 1300); }
      },
      update: function (dt, T) {
        stT += dt;
        if (state === 'offer') {
          if (!bone.held) { bone.y = Math.min(GY - 28, bone.y + (bone.vy += 1800 * dt) * dt); if (bone.y >= GY - 28) bone.vy = 0; }
          dog.setPose(bone.held && near() ? 'happy' : 'sit');
          spr.set(bone.x, bone.y, Math.sin(T * 3) * 4);
        } else {
          var m = dog.mouth();
          if (state === 'hug') { dog.setPose('pet'); spr.set(m.x + dog.dir() * -6, m.y + 30, -20 * dog.dir()); if (stT > 1.5 && stT < 1.55) A.say(pick(A.line('plushYawn', ['*yaaaawn*'])), 1400); if (stT > 2.8) { state = 'tuck'; stT = 0; dog.setPose('sleep'); A.hint('Shh, ' + DN + ' is napping. Tuck in: hold the mouse and rub SLOWLY over ' + DN + '. Fast rubbing wakes them!'); A.sfx('pop'); } }
          else {
            if (state === 'tuck' || state === 'night') dog.setPose('sleep');
            var ms = dog.mouth(); spr.set(ms.x - dog.dir() * 40, GY - 22, 10);
          }
          if (state === 'tuck') {
            var rubbing = A.mouse.down && performance.now() - lastMove < 140;
            if (rubbing && rubSpeed > 1500) {
              state = 'woke'; stT = 0; wakes++; tuck = Math.max(0, tuck - 0.22); dog.setPose('sit'); A.sfx('bark');
              A.say(pick(['huh?! I’m up! ...I’m up.', 'WHO RUBS SO FAST', 'is it breakfast?']), 1500); A.float('too fast!', dog.x, GY - 260, 'pt-blue pt-small');
            } else if (rubbing && rubSpeed > 20) {
              tuck = Math.min(1, tuck + dt * 0.26);
              if (Math.random() < dt * 4) A.addPart({ type: 'heart', x: A.mouse.x, y: A.mouse.y - 10, vy: -50, vx: (Math.random() - 0.5) * 30, life: 1, size: 6 });
              if (!half && tuck > 0.5) { half = true; A.reward({ happiness: 2 }); A.float('so cozy...', dog.x, GY - 240, 'pt-small'); }
              if (tuck >= 1) { state = 'night'; stT = 0; dim.style.opacity = '1'; A.sfx('levelup'); A.float('Tucked in!', dog.x, GY - 260, 'pt-gold'); A.say('zzz... (dreaming of you)', 2600); A.reward({ happiness: 8, energy: 8 }); A.hint('Sweet dreams, ' + DN + '.'); }
            }
            if (Math.random() < dt * 0.9) A.addPart({ type: 'z', x: dog.head().x, y: dog.head().y - 10, vx: 20 * -dog.dir(), vy: -40, life: 1.8, size: 6 + Math.random() * 3 });
          } else if (state === 'woke') { dog.setPose('sit'); dog.tilt = Math.sin(T * 10) * 3; if (stT > 1.6) { dog.tilt = 0; state = 'tuck'; stT = 0; dog.setPose('sleep'); A.say('...zzz', 900); } }
          else if (state === 'night') { if (Math.random() < dt * 1.5) A.addPart({ type: 'z', x: dog.head().x, y: dog.head().y - 10, vx: 15, vy: -35, life: 2.2, size: 7 + Math.random() * 3 }); if (stT > 3.2) A.finish('Sweet dreams!', DN + ' is snoozing with the Plush Bone. Energy restored.'); }
        }
        blanket.set(dog.x - dog.dir() * 22, GY + 10, 0); blanket.el.style.clipPath = 'inset(' + ((1 - tuck) * 100).toFixed(1) + '% 0 0 0)';
      },
      drawFx: function (g) {
        if (state === 'tuck' || state === 'woke') {
          var x = dog.x - 110, y = GY - 250;
          g.fillStyle = 'rgba(255,251,243,.92)'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.roundRect ? g.roundRect(x - 6, y - 24, 232, 50, 12) : g.rect(x - 6, y - 24, 232, 50); g.fill(); g.stroke();
          g.fillStyle = INK; g.font = '700 20px Caveat, cursive'; g.fillText('tuck-in meter', x + 4, y - 6);
          g.fillStyle = '#FFF4DF'; g.fillRect(x + 4, y + 2, 200, 14); g.fillStyle = '#86B3EA'; g.fillRect(x + 4, y + 2, 200 * tuck, 14); g.strokeRect(x + 4, y + 2, 200, 14);
        }
      },
      finish: function () { return state === 'night' ? null : { happiness: 3 }; },
      dbg: function () { return { state: state, tuck: tuck, wakes: wakes, bone: { x: bone.x, y: bone.y } }; }
    };
  };

  /* ---------- Puzzle Feeder ---------- */
  IMPL['Puzzle Feeder'] = function (A) {
    var dog = A.dog, DN = A.DN, BS = 1.7, BX = 330, BY = 338;
    var boardSvg = A.prop('puzzle-board') || ownBoard(), lidSvg = A.prop('puzzle-lid') || ownLid();
    function hole(i) { return { x: BX + (60 + 60 * i) * BS, y: BY + 80 * BS }; }
    var board = A.sprite(boardSvg, 240 * BS, 160 * BS, A.L.front, 0, 0); board.set(BX, BY);
    var covers = [], labs = [], lids = [];
    for (var i = 0; i < 3; i++) {
      var c = A.sprite(holeCover(), 58 * BS, 58 * BS, A.L.front); var h = hole(i); c.set(h.x, h.y); covers.push(c);
      var lb = A.div('pt-holelab', A.L.front, ''); lb.style.left = h.x + 'px'; lb.style.top = (h.y - 14) + 'px'; labs.push(lb);
    }
    for (var j = 0; j < 3; j++) { var hh = hole(j); lids.push({ i: j, x: hh.x, y: hh.y, fx: hh.x, fy: hh.y, spr: A.sprite(lidSvg, 60 * BS, 60 * BS, A.L.front, 0.5, 29 / 60), open: false, lift: 0 }); }
    var kib = 0, round = 0, state = 'play', stT = 0, drag = null, sniffT = 0, sniffCD = 0.6, found = 0, swaps = [], swapT = 0, swapIdx = 0, wrong = 0;
    var funny = ['a sock?', 'one (1) pea', 'dust bunny', 'nothing. rude.', 'a button', 'old leaf'];
    dog.ground = BY + 66; dog.y = dog.ground; dog.x = 820; dog.face('left'); dog.setPose('idle');
    function newRound() {
      round++; kib = Math.floor(Math.random() * 3); drag = null;
      for (var i = 0; i < 3; i++) { covers[i].show(i !== kib); labs[i].textContent = ''; lids[i].open = false; }
      if (round >= 2) { swaps = []; var n = round === 2 ? 3 : 5; for (var k = 0; k < n; k++) { var a = Math.floor(Math.random() * 3), b = (a + 1 + Math.floor(Math.random() * 2)) % 3; swaps.push([a, b]); } state = 'shuffle'; swapT = 0; swapIdx = 0; A.hint('Shuffle! Watch... then follow ' + DN + '’s nose.'); A.say(round === 2 ? 'shuffle time!' : 'faster shuffle!', 1200); }
      else { state = 'play'; A.hint('Slide the lids to find the hidden kibble. ' + DN + ' sniffs at the right one!'); }
      if (A.tr.sniff && LINES[A.key] && LINES[A.key].puzzleStart) A.say(pick(LINES[A.key].puzzleStart), 1500);
      stT = 0; sniffCD = 0.4;
    }
    function lidAt(i) { for (var k = 0; k < 3; k++) if (lids[k].i === i) return lids[k]; return null; }
    function reveal(L) {
      if (L.open) return; L.open = true;
      if (L.i === kib) {
        state = 'found'; stT = 0; found++; var h = hole(kib);
        A.sfx('pop'); A.float('kibble found!', h.x, h.y - 110, 'pt-gold'); A.burst('spark', h.x, h.y, 10, { g: 0, sp: 160, life: 0.7, size: 7 });
        A.reward({ happiness: 3, coins: round >= 2 ? 1 : 0 }); A.say(pick(A.line('puzzleFound', ['CRUNCH. genius.', 'my nose was right!', 'we did it (I did it)'])), 1600);
      } else {
        wrong++; labs[L.i].textContent = pick(funny); A.sfx('nope'); A.say(pick(A.line('puzzleWrong', ['not that one...', 'nope. sniff again.', 'my nose says NO'])), 1200); dog.squash(0.92);
      }
    }
    newRound();
    return {
      poses: ['idle', 'walk', 'eat', 'sit', 'happy'],
      dur: 60,
      hint: '',
      down: function (x, y) {
        if (state !== 'play') return;
        for (var k = 2; k >= 0; k--) { var L = lids[k]; if (dist(x, y, L.x, L.y) < A.hitR(55)) { drag = { L: L, dx: L.x - x, dy: L.y - y }; A.cursor('grabbing'); A.sfx('click'); return; } }
      },
      move: function (x, y) {
        if (drag) { var L = drag.L; L.x = clamp(x + drag.dx, BX + 26 * BS, BX + 214 * BS); L.y = clamp(y + drag.dy, BY + 36 * BS, BY + 128 * BS); var h = hole(L.i); if (dist(L.x, L.y, h.x, h.y) > 26 * BS) reveal(L); return; }
        var over = false; if (state === 'play') for (var k = 0; k < 3; k++) if (dist(x, y, lids[k].x, lids[k].y) < 55) over = true;
        A.cursor(over ? 'grab' : 'default');
      },
      up: function () { drag = null; A.cursor('default'); },
      update: function (dt, T) {
        stT += dt; sniffT = Math.max(0, sniffT - dt); sniffCD -= dt;
        var hk = hole(kib);
        if (state === 'shuffle') {
          dog.tilt = 0; swapT += dt; var dur = round === 2 ? 0.5 : 0.32, idx = Math.min(swaps.length, Math.floor(swapT / dur));
          while (swapIdx < idx) { var sw = swaps[swapIdx], A1 = lidAt(sw[0]), B1 = lidAt(sw[1]); A1.i = sw[1]; B1.i = sw[0]; swapIdx++; A.sfx('whoosh'); }
          dog.setPose('sit'); dog.runTo(820, 300, dt); if (Math.abs(dog.x - 820) < 6) { dog.face('left'); dog.setPose('sit'); }
          if (idx >= swaps.length) { for (var k = 0; k < 3; k++) { var hh = hole(lids[k].i); lids[k].x = hh.x; lids[k].y = hh.y; lids[k].lift = 0; } state = 'play'; stT = 0; A.hint('Slide the lids! Which one smells like kibble?'); }
          else {
            var s = swaps[idx], u = (swapT % dur) / dur, ea = 0.5 - 0.5 * Math.cos(u * Math.PI);
            var La = lidAt(s[0]), Lb = lidAt(s[1]), ha = hole(s[0]), hb = hole(s[1]);
            La.x = lerp(ha.x, hb.x, ea); La.y = ha.y - Math.sin(u * Math.PI) * 40; Lb.x = lerp(hb.x, ha.x, ea); Lb.y = hb.y + Math.sin(u * Math.PI) * 20;
          }
        } else if (state === 'play') {
          var strong = round < 3 || A.tr.sniff, tx = 820;
          if (strong) { var side = dog.x > hk.x ? 1 : -1; tx = hk.x + side * dog.mouthOff('idle'); }
          if (!dog.runTo(tx, A.tr.sniff ? 400 : 260, dt)) { /* walking */ }
          else {
            if (strong) dog.face(dog.x > hk.x ? 'left' : 'right'); else dog.face('left');
            if (sniffCD <= 0) { sniffT = 1.1; sniffCD = A.tr.sniff ? 1.4 : round >= 3 ? 3.2 : 2.4; A.sfx('sniff'); }
            dog.setPose('idle'); dog.tilt = sniffT > 0.3 && strong ? dog.dir() * (9 + Math.sin(T * 18) * 3) : 0;
          }
        } else if (state === 'found') {
          dog.tilt = 0;
          var side2 = dog.x > hk.x ? 1 : -1;
          if (dog.runTo(hk.x + side2 * dog.mouthOff('eat'), 300, dt)) { dog.face(side2 > 0 ? 'left' : 'right'); dog.setPose('eat'); if (Math.floor(stT * 3) !== Math.floor((stT - dt) * 3) && stT < 2) A.sfx('crunch'); }
          if (stT > 2.4) {
            for (var q = 0; q < 3; q++) { var h3 = hole(lids[q].i); lids[q].x = lerp(lids[q].x, h3.x, Math.min(1, dt * 10)); lids[q].y = lerp(lids[q].y, h3.y, Math.min(1, dt * 10)); }
            if (stT > 3) newRound();
          }
        }
        for (var z = 0; z < 3; z++) { var Lz = lids[z]; Lz.spr.set(Lz.x, Lz.y, 0, drag && drag.L === Lz ? 1.08 : 1, drag && drag.L === Lz ? 1.08 : 1); }
      },
      drawFx: function (g, T) {
        if (sniffT <= 0 || state !== 'play') return;
        var h = hole(kib), m = dog.mouth(), a = Math.min(1, sniffT * 2);
        g.strokeStyle = 'rgba(91,61,50,' + (0.75 * a).toFixed(3) + ')'; g.lineWidth = 2.4; g.lineCap = 'round';
        for (var i = -1; i <= 1; i++) {
          g.beginPath(); var sx = h.x + i * 16, sy = h.y - 30, ex = m.x + i * 6, ey = m.y + 6;
          for (var k = 0; k <= 12; k++) { var u = k / 12, x = lerp(sx, ex, u) + Math.sin(u * 9 + T * 8 + i) * 7, y = lerp(sy, ey, u); if (k) g.lineTo(x, y); else g.moveTo(x, y); }
          g.stroke();
        }
        g.fillStyle = INK; g.font = '700 24px Caveat, cursive'; g.globalAlpha = a; g.fillText('sniff sniff', m.x - 40, m.y - 60); g.globalAlpha = 1;
      },
      finish: function () { return { happiness: 2, energy: -1 }; },
      dbg: function () { return { state: state, round: round, kib: kib, found: found, wrong: wrong, lids: lids.map(function (L) { return { i: L.i, x: L.x, y: L.y, open: L.open }; }), holes: [hole(0), hole(1), hole(2)] }; }
    };
  };
  IMPL['Puzzle Feeder'].cfg = {};
  IMPL['Puzzle Feeder'].phone = { vw: 700, vwMin: 650, fx: 590 };

  /* ---------- Driftwood Stick ---------- */
  IMPL['Driftwood Stick'] = function (A) {
    var dog = A.dog, DN = A.DN, PX = 650, WATER_Y = 548, SWIM_Y = 596;
    A.L.front.innerHTML = waterFront(A.uidp);
    var floor = function (x) { return x > PX ? 9999 : GY - 4; };
    var b = thrower(A, { x: 300, y: GY - 4, r: 22, floor: floor, bounce: 0.35, g: 1800, spinK: 0.6, ceil: -40 });
    var spr = A.sprite(A.itemSVG('Driftwood Stick'), 100, 100, A.L.front);
    var lastF = 420, wet = false, shook = false, splashes = 0, fetches = 0, tip = A.tip('throw me in the pond!', 220, 410), drift = 0;
    dog.x = 520; dog.face('right'); dog.setPose('sit');
    A.say('the water?! ...yes. YES.', 2000);
    function inWater(x) { return x > PX + 40; }
    var brain = fetchBrain(A, b, {
      speedAt: function (x) { return inWater(x) ? 170 : 420 * A.tr.run; }, carryK: A.tr.carry, carryRot: 0, carryDy: 2,
      deliverX: function () { return clamp(A.mouse.x, 130, PX - 120); },
      pre: function (dt, st, me) {
        var w = inWater(dog.x);
        dog.ground = w ? SWIM_Y : GY;
        if (w && !wet) { wet = true; shook = false; A.sfx('splash'); A.burst('drop', dog.x, WATER_Y, 14, { sp: 300, g: 1100, color: '#9CC8EA', size: 4 }); }
        if (!w && wet && dog.x < PX - 10 && st !== 'hold') {
          wet = false; if (!shook) { shook = true; A.sfx('shake'); A.say(pick(A.line('stickShake', ['brrrrrrr!', 'SHAKE SHAKE SHAKE', 'sorry about the floor'])), 1400); me.pause(1.3, 'shake', st); return false; }
        }
        if (st === 'hold' && dog.pose === 'shake' && Math.random() < dt * (A.tr.fluff ? 60 : 30)) A.burst('drop', dog.x + (Math.random() - 0.5) * 120, dog.y - 100 - Math.random() * 60, 1, { sp: 360, g: 1000, color: '#9CC8EA', size: 3.5 });
        if (w && Math.random() < dt * 4) A.addPart({ type: 'drop', x: dog.x + (Math.random() - 0.5) * 140, y: WATER_Y + 4, vx: (Math.random() - 0.5) * 60, vy: -90, g: 500, life: 0.5, size: 2.6, color: '#BBD8EF' });
        return false;
      },
      onPick: function () { if (inWater(dog.x)) A.say(pick(['blub. got it.', 'paddle paddle paddle']), 1200); },
      onDeliver: function () { fetches++; var wf = splashes > 0; A.reward({ happiness: wf ? 3 : 1, coins: wf ? 1 : 0, energy: -1 }); A.float(wf ? 'soggy fetch!' : 'good stick!', dog.x, dog.y - 250); splashes = 0; if (A.tr.flop) brain.pause(1.5, 'sleep', 'wait'); }
    });
    var cbs = {
      bounce: function (v) { if (v > 300) A.sfx('bounce'); },
      custom: function () {
        if (b.x > PX && b.y >= WATER_Y) {
          b.y = WATER_Y; b.state = 'float'; b.vx *= 0.25; b.vy = 0; splashes++; drift = 0;
          A.sfx('splash'); A.burst('drop', b.x, WATER_Y, 18, { sp: 380, g: 1200, color: '#9CC8EA', size: 4.5 }); A.float(b.x > 900 ? 'SPLOOSH!' : 'splash!', b.x, WATER_Y - 120, 'pt-blue');
          return true;
        }
        return false;
      }
    };
    return {
      poses: ['sit', 'walk', 'eat', 'shake', 'happy', 'idle'],
      dur: 55,
      hint: 'Drag and release to throw the stick into the pond. ' + DN + ' paddles out for it!',
      down: function (x, y) { if ((b.state === 'rest' || (b.state === 'fly' && x < PX)) && dist(x, y, b.x, b.y) < A.hitR(70)) { b.grab(x, y); A.cursor('grabbing'); if (tip) { tip.hide(); tip = null; } } },
      move: function (x, y) { if (b.state === 'held') { b.x = clamp(x, 30, PX - 30); b.y = Math.min(y, GY - 4); } else A.cursor(b.state === 'rest' && dist(x, y, b.x, b.y) < 70 ? 'grab' : 'default'); },
      up: function () { if (b.state === 'held') { var v = b.release(); if (v.speed > 600) A.sfx('whoosh'); A.cursor('default'); } },
      update: function (dt, T) {
        b.step(dt, cbs);
        if (b.state === 'float') { drift += dt; b.x = clamp(b.x + b.vx * dt, PX + 50, W - 60); b.vx *= Math.pow(0.3, dt); b.y = WATER_Y + Math.sin(T * 3) * 3; b.rot = Math.sin(T * 2) * 8; if (!b.thrown) b.thrown = true; }
        if (b.state === 'rest' && b.x > PX) { b.state = 'float'; b.y = WATER_Y; }
        if (b.state === 'fly' && b.onFloor) b.rot = b.rot * 0.9;
        brain.update(dt);
        spr.set(b.x, b.y, b.rot);
      },
      drawFx: function (g, T) {
        if (b.state === 'fly' && b.x < PX) A.shadow(g, b.x, GY + 6, GY - b.y, 30);
        if (b.state === 'float') { g.strokeStyle = 'rgba(94,134,180,.7)'; g.lineWidth = 2; for (var i = 0; i < 2; i++) { var r = ((T * 30 + i * 25) % 50) + 20; g.globalAlpha = 1 - r / 70; g.beginPath(); g.ellipse(b.x, WATER_Y + 8, r * 1.4, r * 0.3, 0, 0, Math.PI * 2); g.stroke(); } g.globalAlpha = 1; }
      },
      focus: function () { if (b.state !== 'held') lastF = (b.state === 'fly' || b.state === 'float') && b.thrown ? lerp(b.x, dog.x, 0.35) : (b.x + dog.x) / 2; return lastF; },
      finish: function () { return { happiness: 2, energy: -3 }; },
      dbg: function () { return { stick: { x: b.x, y: b.y, state: b.state, thrown: b.thrown }, brain: brain.state, fetches: fetches, wet: wet }; }
    };
  };
  IMPL['Driftwood Stick'].cfg = { scene: 'pond' };
  IMPL['Driftwood Stick'].phone = { vw: 760, vwMin: 600 };

  /* ---------- Rubber Chicken ---------- */
  IMPL['Rubber Chicken'] = function (A) {
    var dog = A.dog, DN = A.DN, CX = 420, CY = GY - 62;
    var ch = A.sprite(A.itemSVG('Rubber Chicken'), 170, 170);
    var held = false, holdT = 0, honkCD = 0, spring = 0, springV = 0, meterV = 0, concerts = 0, howlT = 0, howlLeft = 0, howlCD = 0, pending = 0, duets = 0, harmony = 0, tip = A.tip('press & hold me!', 350, 360), finale = 0;
    var meter = A.meter('concert meter', 470, 92, 300, null);
    dog.x = 830; dog.face('left'); dog.setPose('sit');
    A.say('is that a... chicken?', 1800);
    function addMeter(v) {
      meterV = Math.min(1, meterV + v);
      if (meterV >= 1 && !finale) {
        finale = 2.6; concerts++; A.sfx('levelup'); A.float(concerts > 1 ? 'ENCORE #' + concerts + '!' : 'ENCORE!', 620, 250, 'pt-gold');
        A.reward({ happiness: 6, bond: concerts === 1 ? 1 : 0, coins: 1 }); A.say('thank you, thank you, we are here all week', 2200);
        for (var i = 0; i < 16; i++) A.addPart({ type: i % 2 ? 'note' : 'heart', x: 300 + Math.random() * 640, y: 520, vx: (Math.random() - 0.5) * 200, vy: -300 - Math.random() * 300, g: 300, life: 1.8, size: 9 });
        if (!dog.air) dog.jump(-800, 0);
      }
    }
    return {
      poses: ['sit', 'happy', 'jump', 'idle'],
      dur: 45,
      hint: 'Click to squeeze the chicken. Hold for a LONGER honk. ' + DN + ' will join in!',
      down: function (x, y) { if (dist(x, y, CX, CY) < A.hitR(100)) { held = true; holdT = 0; honkCD = 0.25; A.sfx('honk'); if (tip) { tip.hide(); tip = null; } if (howlT > 0) { harmony++; A.float('harmony!', CX + 120, CY - 140, 'pt-small'); addMeter(0.12); } } },
      move: function (x, y) { A.cursor(dist(x, y, CX, CY) < 100 ? 'pointer' : 'default'); },
      up: function () {
        if (!held) return; held = false;
        var L = Math.min(2.5, holdT); springV = -8;
        A.float('H' + 'O'.repeat(1 + Math.min(8, Math.round(L * 4))) + 'NK!', CX, CY - 120, L > 1 ? 'pt-gold' : 'pt-small');
        pending = 0.35; howlLeft = 1 + Math.round(L * 2.2); duets++;
        addMeter(0.08 + L * 0.1);
        if (duets % 2 === 0) A.reward({ happiness: 1 });
      },
      update: function (dt, T) {
        honkCD -= dt; howlCD -= dt; finale = Math.max(0, finale - dt);
        if (held) { holdT += dt; if (honkCD <= 0 && holdT < 2.5) { A.sfx('honk'); honkCD = 0.22; } }
        springV += (-spring * 120 - springV * 9) * dt; spring += springV * dt;
        var squeeze = held ? Math.min(1, holdT / 0.6) : 0;
        ch.set(CX, CY, Math.sin(T * 2) * 3 + (held ? Math.sin(T * 40) * 2 : 0), 1 + squeeze * 0.16 - spring * 0.05, 1 - squeeze * 0.3 + spring * 0.08);
        if (pending > 0) { pending -= dt; if (pending <= 0) { howlT = 0.4 + howlLeft * 0.2; A.say(pick(A.line('howl', ['AWOOOO!', 'ah-WOO-woo', 'awooo (harmony)', 'WOO! WOO!'])), 1200); } }
        if (howlT > 0) {
          howlT -= dt; dog.setPose('happy'); dog.rot = -12 + Math.sin(T * 14) * 3;
          if (howlLeft > 0 && howlCD <= 0) { A.sfx('bark'); howlLeft--; howlCD = 0.19; A.addPart({ type: 'note', x: dog.head().x, y: dog.head().y - 20, vx: (Math.random() - 0.3) * 80, vy: -120, g: -20, life: 1.3, size: 10 }); }
        } else if (!dog.air) { dog.rot *= 0.8; dog.setPose(finale > 0 ? 'happy' : held ? 'idle' : 'sit'); }
        if (finale <= 0 && meterV >= 1) meterV = 0;
        meterV = Math.max(0, meterV - dt * 0.01);
        meter.set(meterV);
      },
      finish: function () { return { happiness: 2, energy: -2 }; },
      dbg: function () { return { meter: meterV, concerts: concerts, duets: duets, harmony: harmony }; }
    };
  };

  /* ==================== v2.4 Shop Day toys ==================== */
  /* shared: a tap on the dog gets a reaction (a squash, hearts, a line). Returns true when the tap was on the dog. */
  function dogTap(A, x, y, generic) {
    var d = A.dog, h = d.head(), now = performance.now();
    if (Math.abs(x - d.x) > A.hitR(115) || y < Math.min(h.y - 60, d.y - 190) || y > d.y + 24) return false;
    if (now - (A.tapAt || 0) < 650) return true;
    A.tapAt = now; d.squash(0.86); A.burst('heart', h.x, h.y, 3, { g: -60, sp: 90, life: 1.1, size: 7 });
    if (Math.random() < 0.4) A.sfx('bark');
    A.say(pick(A.line('tap', generic || ['hi! yes! hello!', 'boop received', 'one pat. ok two.'])), 1100);
    return true;
  }
  /* happy tail-end wiggle: the art wags the tail, this sways the whole dog a little */
  function wiggle(d, T, k) { d.tilt = Math.sin(T * 13) * (k == null ? 2.2 : k); }
  /* a soap bubble in pencil: soft fill, two-stroke outline, a white shine and a little rainbow */
  function drawBubble(g, x, y, r, a) {
    g.save(); g.globalAlpha = a == null ? 1 : a;
    g.fillStyle = 'rgba(203,224,244,.28)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(91,61,50,.8)'; g.lineWidth = 1.9; g.stroke();
    g.strokeStyle = 'rgba(91,61,50,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(x + 1.3, y - 0.9, r * 0.97, 0.4, 5.6); g.stroke();
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(242,143,165,.6)'; g.lineWidth = Math.max(1.4, r * 0.09); g.beginPath(); g.arc(x, y, r * 0.8, 0.25, 1.15); g.stroke();
    g.strokeStyle = 'rgba(242,199,68,.55)'; g.beginPath(); g.arc(x, y, r * 0.8, 1.2, 1.9); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = Math.max(1.6, r * 0.12); g.beginPath(); g.arc(x, y, r * 0.66, -2.6, -1.75); g.stroke();
    g.restore();
  }
  /* a crayon hand holding something; side 1 = the hand comes from the left, fingers point right */
  function drawHand(g, x, y, side) {
    g.save(); g.translate(x, y); g.scale(side, 1); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 2.4;
    g.fillStyle = '#F9D0D9'; g.beginPath(); g.moveTo(-62, -20); g.lineTo(-34, -22); g.lineTo(-32, 22); g.lineTo(-62, 24); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#FCD8BC'; g.beginPath(); g.moveTo(-34, -18); g.quadraticCurveTo(-14, -24, 0, -18); g.lineTo(2, 18); g.quadraticCurveTo(-16, 24, -34, 18); g.closePath(); g.fill(); g.stroke();
    for (var i = 0; i < 3; i++) { var fy = -14 + i * 11; g.beginPath(); g.moveTo(-4, fy); g.lineTo(14, fy - 1); g.quadraticCurveTo(21, fy + 4, 14, fy + 9); g.lineTo(-4, fy + 9); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(-12, -22, 6, 11, -1.1, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(91,61,50,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-58, -12); g.lineTo(-38, -13); g.moveTo(-58, 6); g.lineTo(-38, 5); g.stroke();
    g.restore();
  }
  function arcPts(cx, cy, rx, ry, a0, a1, n) { var p = []; for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; }

  /* ---------- v2.4 art (pencil, same hand as the module's own doodles) ---------- */
  var FLAPC = ['#FFE07A', '#F9D0D9', '#BBD8EF', '#FFE3A1', '#E0D5F0', '#FCD8BC'];
  function v24Mat() {
    var R = rng(2401), s = '<ellipse cx="280" cy="150" rx="276" ry="9" fill="#5B3D32" opacity=".1"/>';
    s += pencil(R, [[70, 10], [490, 10], [550, 140], [10, 140]], 2.6, INK, 1, true, '#C8E9CF');
    for (var i = 0; i < 60; i++) { var v = R(), y = 18 + v * 114, l = lerp(70, 10, (y - 10) / 130) + 10, r = lerp(490, 550, (y - 10) / 130) - 24, x = l + R() * (r - l); s += '<path d="M' + f1(x) + ' ' + f1(y) + 'l' + f1(6 + R() * 8) + ' ' + f1(-3 - R() * 4) + '" stroke="#86B57A" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>'; }
    s += '<path d="' + wob(R, [[82, 18], [478, 18], [532, 132], [28, 132]], 1.2, true) + '" fill="none" stroke="#F28FA5" stroke-width="2" stroke-dasharray="6 5"/>';
    for (var k = 0; k < 27; k++) { var fx = 16 + k * 20.5; s += '<path d="M' + f1(fx) + ' 140q' + f1(2 + R() * 3) + ' 6 ' + f1(-1 + R() * 3) + ' 11" fill="none" stroke="#5B3D32" stroke-width="3.4" stroke-linecap="round"/><path d="M' + f1(fx) + ' 140q' + f1(2 + R() * 3) + ' 6 ' + f1(-1 + R() * 3) + ' 10" fill="none" stroke="#A9D6A0" stroke-width="2" stroke-linecap="round"/>'; }
    return '<svg viewBox="0 0 560 160">' + s + '</svg>';
  }
  function v24Flap(i) {
    var R = rng(2410 + i), s = '', pts = [];
    for (var k = 0; k < 18; k++) { var a = k / 18 * Math.PI * 2, rr = k % 2 ? 0.88 : 1; pts.push([60 + Math.cos(a) * 52 * rr, 24 + Math.sin(a) * 16 * rr]); }
    s += pencil(R, pts, 2, INK, 1, true, FLAPC[i % FLAPC.length]) + pencil(R, [[26, 24], [94, 23]], 1.2, INK, 0.35);
    return '<svg viewBox="0 0 120 48">' + s + '</svg>';
  }
  function v24Kibble(i) { var R = rng(2420 + i); return '<svg viewBox="0 0 40 30">' + pencil(R, ell(15, 17, 9, 7, 10), 1.6, INK, 1, true, '#C98B4E') + pencil(R, ell(25, 13, 8, 6.5, 10), 1.6, INK, 1, true, '#D9A066') + '</svg>'; }
  /* the ribbed salmon chew cone of the shop icon: wide mouth on top (pumpkin goes in there), narrow foot, a paw mark */
  function v24Cone() {
    var R = rng(2430), s = '', pts = [[13, 17], [87, 17], [83, 36], [90, 45], [78, 63], [83, 77], [69, 93], [71, 104], [58, 118], [42, 118], [29, 104], [31, 93], [17, 77], [22, 63], [10, 45], [17, 36]];
    s += '<ellipse cx="50" cy="118" rx="22" ry="3" fill="#5B3D32" opacity=".12"/>';
    s += pencil(R, pts, 2.8, INK, 1, true, '#F08A86');
    for (var i = 0; i < 9; i++) s += pencil(R, [[24 + i * 6, 24 + (i % 2) * 4], [36 + i * 4, 112]], 1.2, '#E46F6B', 0.55);
    s += pencil(R, [[18, 42], [82, 42]], 1.8, '#C25A57', 0.8) + pencil(R, [[23, 72], [77, 72]], 1.8, '#C25A57', 0.8) + pencil(R, [[33, 100], [67, 100]], 1.8, '#C25A57', 0.8);
    s += pencil(R, [[24, 30], [20, 46], [28, 66], [26, 80], [36, 98]], 5, '#F7B2C4', 0.75);
    s += '<g fill="#FFD0C8"><ellipse cx="50" cy="62" rx="8" ry="6.5"/><circle cx="39.5" cy="52" r="3.3"/><circle cx="46" cy="47.5" r="3.3"/><circle cx="54" cy="47.5" r="3.3"/><circle cx="60.5" cy="52" r="3.3"/></g>';
    s += pencil(R, ell(50, 17, 37, 11, 20), 2.2, INK, 1, true, '#A9524F');
    return '<svg viewBox="0 0 100 122">' + s + '</svg>';
  }

  function v24Hog() {
    var R = rng(2440), s = '<ellipse cx="74" cy="106" rx="58" ry="5" fill="#5B3D32" opacity=".12"/>', sp = [[18, 100]];
    for (var i = 0; i <= 14; i++) { var a = Math.PI * (1 + i / 14 * 0.78), rr = i % 2 ? 46 : 60; sp.push([68 + Math.cos(a) * rr * 1.1, 98 + Math.sin(a) * rr]); }
    sp.push([104, 96]);
    s += pencil(R, sp, 2.6, INK, 1, true, '#A0764E');
    for (var j = 0; j < 9; j++) { var b = Math.PI * (1.08 + j / 9 * 0.6); s += pencil(R, [[68 + Math.cos(b) * 22, 98 + Math.sin(b) * 20], [68 + Math.cos(b) * 44, 98 + Math.sin(b) * 40]], 1.6, '#6E544A', 0.8); }
    s += pencil(R, [[92, 56], [112, 62], [136, 78], [140, 86], [128, 96], [100, 100], [88, 90]], 2.4, INK, 1, true, '#FCD8BC');
    s += '<circle cx="140" cy="84" r="5" fill="#5B3D32"/><circle cx="114" cy="74" r="3.8" fill="#5B3D32"/><circle cx="115.3" cy="72.7" r="1.2" fill="#fff"/><ellipse cx="122" cy="88" rx="5" ry="3" fill="#F28FA5" opacity=".6"/>';
    s += pencil(R, ell(100, 62, 7, 6, 10), 1.8, INK, 1, true, '#F9C4D0');
    s += pencil(R, ell(54, 102, 9, 5, 10), 1.8, INK, 1, true, '#FCD8BC') + pencil(R, ell(96, 102, 9, 5, 10), 1.8, INK, 1, true, '#FCD8BC');
    return '<svg viewBox="0 0 150 112">' + s + '</svg>';
  }
  function v24HogBall() {
    var R = rng(2441), s = '', sp = [];
    for (var i = 0; i < 28; i++) { var a = i / 28 * Math.PI * 2, rr = i % 2 ? 40 : 52; sp.push([55 + Math.cos(a) * rr, 55 + Math.sin(a) * rr]); }
    s += pencil(R, sp, 2.6, INK, 1, true, '#A0764E') + pencil(R, ell(55, 55, 30, 30, 16), 1.6, '#6E544A', 0.7);
    s += pencil(R, ell(64, 62, 12, 10, 10), 2, INK, 1, true, '#FCD8BC') + '<circle cx="71" cy="62" r="3.8" fill="#5B3D32"/><path d="M52 58q4-3 8 0" fill="none" stroke="#5B3D32" stroke-width="2" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 110 110">' + s + '</svg>';
  }
  /* the shop icon's lavender BUBBLES box, mirrored so the crank sits on the right: pink neck and ring on top, the bottle on the left */
  function v24Machine() {
    var R = rng(2450), s = '<ellipse cx="104" cy="186" rx="88" ry="6" fill="#5B3D32" opacity=".12"/>';
    s += pencil(R, [[60, 88], [160, 88], [172, 100], [172, 164], [160, 176], [60, 176], [48, 164], [48, 100]], 2.8, INK, 1, true, '#D3C6F1');
    s += '<path d="' + wob(R, [[50, 154], [170, 154], [170, 166], [158, 175], [62, 175], [50, 166]], 1.2, true) + '" fill="#B9A6E8"/>';
    for (var i = 0; i < 7; i++) s += pencil(R, [[60 + i * 16, 96], [70 + i * 16, 150]], 1.1, '#B9A6E8', 0.6);
    s += pencil(R, rect(58, 106, 90, 34), 2, INK, 1, true, '#FFFBF3');
    s += '<text x="103" y="131" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="22" fill="#B8536F">BUBBLES</text>';
    s += pencil(R, rect(88, 60, 28, 30), 2.4, INK, 1, true, '#F28FA5');
    s += pencil(R, ell(102, 50, 22, 18, 16), 2.6, INK, 1, true, '#FFFFFF') + pencil(R, ell(102, 50, 13, 10, 14), 1.8, INK, 0.7);
    s += pencil(R, ell(80, 180, 11, 8, 10), 2, INK, 1, true, '#5E463D') + pencil(R, ell(142, 180, 11, 8, 10), 2, INK, 1, true, '#5E463D');
    s += pencil(R, rect(8, 104, 36, 74), 2.4, INK, 1, true, '#DCEFFC');
    s += '<path d="' + wob(R, [[10, 128], [42, 128], [42, 156], [10, 156]], 1, true) + '" fill="#F7B2C4"/>';
    s += '<text x="26" y="140" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="11" fill="#5B3D32">dog-safe</text><text x="26" y="151" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="11" fill="#5B3D32">bubbles</text>';
    s += pencil(R, rect(14, 92, 24, 13), 2, INK, 1, true, '#BDE7D2');
    s += pencil(R, [[18, 112], [16, 124]], 2.6, '#FFFFFF', 0.8);
    var hub = '';
    for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2 + 0.3; hub += pencil(R, [[176, 124], [176 + Math.cos(a) * 15, 124 + Math.sin(a) * 15]], 1.8, INK, 0.85); }
    s += pencil(R, ell(176, 124, 18, 18, 14), 2.6, INK, 1, true, '#FFE07A') + hub + pencil(R, ell(176, 124, 13, 13, 12), 1.4, '#E2A800', 0.8);
    return '<svg viewBox="0 0 200 190">' + s + '</svg>';
  }

  function v24Crank() { var R = rng(2451); return '<svg viewBox="0 0 80 80">' + pencil(R, [[40, 40], [56, 38], [68, 40]], 7, INK, 1) + pencil(R, [[40, 40], [56, 38], [68, 40]], 3.4, '#C99A72', 1) + pencil(R, ell(70, 40, 7, 9, 10), 2.2, INK, 1, true, '#E46F6B') + pencil(R, ell(40, 40, 5, 5, 8), 2, INK, 1, true, '#FFE07A') + '</svg>'; }
  /* the pool: viewBox 540x190, rim ellipse centre (270,70). 'back' sits behind the dog, 'front' (the near rim and side) in front of it */
  function v24Pool(part) {
    var R = rng(part === 'front' ? 2461 : 2460), s = '', cx = 270, cy = 70, rx = 250, ry = 62, irx = 214, iry = 46, dep = 30;
    var band = arcPts(cx, cy + dep, rx, ry, 0, Math.PI, 22).concat(arcPts(cx, cy, rx, ry, Math.PI, 0, 22));
    if (part === 'back') {
      s += '<ellipse cx="' + cx + '" cy="' + (cy + dep + 10) + '" rx="' + (rx + 12) + '" ry="' + (ry + 4) + '" fill="#5B3D32" opacity=".1"/>';
      s += pencil(R, band, 2.6, INK, 1, true, '#6F93BE') + pencil(R, ell(cx, cy, rx, ry, 30), 2.8, INK, 1, true, '#86B3EA') + pencil(R, ell(cx, cy + 3, irx, iry, 28), 2.2, INK, 1, true, '#E6F1FA');
      for (var i = 0; i < 18; i++) { var hx = cx - 180 + i * 20 + R() * 6; s += '<path d="M' + f1(hx) + ' ' + f1(cy - 22 + R() * 10) + 'l10 30" stroke="#BBD8EF" stroke-width="2" opacity=".8"/>'; }
      for (var k = 0; k < 14; k++) { var a = Math.PI + (k + 0.5) / 14 * Math.PI; s += '<circle cx="' + f1(cx + Math.cos(a) * (rx + irx) / 2) + '" cy="' + f1(cy + 1 + Math.sin(a) * (ry + iry) / 2) + '" r="3.6" fill="#FFFBF3" opacity=".9"/>'; }
    } else {
      s += pencil(R, band, 2.6, INK, 1, true, '#6F93BE');
      for (var j = 0; j < 15; j++) { var b = (j + 0.5) / 15 * Math.PI; s += '<circle cx="' + f1(cx + Math.cos(b) * rx * 0.97) + '" cy="' + f1(cy + dep * 0.55 + Math.sin(b) * ry) + '" r="3.8" fill="#FFFBF3" opacity=".85"/>'; }
      s += pencil(R, arcPts(cx, cy, rx, ry, 0, Math.PI, 24).concat(arcPts(cx, cy + 3, irx, iry, Math.PI, 0, 24)), 2.6, INK, 1, true, '#86B3EA');
      for (var m = 0; m < 14; m++) { var c = (m + 0.5) / 14 * Math.PI; s += '<circle cx="' + f1(cx + Math.cos(c) * (rx + irx) / 2) + '" cy="' + f1(cy + 2 + Math.sin(c) * (ry + iry) / 2) + '" r="3.6" fill="#FFFBF3" opacity=".9"/>'; }
      s += pencil(R, arcPts(cx, cy + 1, rx - 9, ry - 5, 0.35, Math.PI - 0.35, 16), 2.2, '#FFFBF3', 0.75);
    }
    return '<svg viewBox="0 0 540 190">' + s + '</svg>';
  }
  /* water in the pool: the full surface (behind the dog) and the near half (in front of its legs) */
  function v24Water(front) {
    var R = rng(front ? 2463 : 2462), cx = 270, cy = 73, irx = 212, iry = 44, s = '';
    if (!front) {
      s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + irx + '" ry="' + iry + '" fill="#9CC8EA" opacity=".9"/>';
      for (var i = 0; i < 7; i++) { var wx = cx - 150 + R() * 300, wy = cy - 26 + R() * 30; s += pencil(R, [[wx, wy], [wx + 14, wy - 3], [wx + 28, wy], [wx + 42, wy - 3]], 1.6, '#5E86B4', 0.75); }
      return '<svg viewBox="0 0 540 190">' + s + '</svg>';
    }
    var al = Math.asin(16 / iry), pts = arcPts(cx, cy, irx, iry, -al, Math.PI + al, 26);
    s += '<path d="M' + pts.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + 'Z" fill="#9CC8EA" opacity=".82"/>';
    s += pencil(R, [[cx - irx * 0.93, cy - 16], [cx - 100, cy - 19], [cx, cy - 16], [cx + 100, cy - 19], [cx + irx * 0.93, cy - 16]], 1.8, '#5E86B4', 0.8);
    return '<svg viewBox="0 0 540 190">' + s + '</svg>';
  }
  function v24TapPost() {
    var R = rng(2470), s = '<ellipse cx="64" cy="178" rx="54" ry="6" fill="#5B3D32" opacity=".12"/>';
    s += pencil(R, rect(48, 22, 22, 156), 2.6, INK, 1, true, '#C9A27A') + pencil(R, [[48, 22], [59, 9], [70, 22]], 2.4, INK, 1, true, '#C9A27A');
    for (var g = 0; g < 4; g++) s += pencil(R, [[52, 40 + g * 34], [56, 62 + g * 34]], 1.2, '#8C6E60', 0.7);
    s += pencil(R, [[70, 54], [94, 54], [94, 68], [88, 74]], 7, INK, 1) + pencil(R, [[70, 54], [94, 54], [94, 68]], 3.6, '#E2A800', 1);
    s += pencil(R, [[80, 54], [80, 44]], 2.6, INK, 1) + pencil(R, ell(80, 42, 10, 4, 10), 2, INK, 1, true, '#E8504A');
    s += pencil(R, ell(64, 140, 42, 32, 18), 3, INK, 1, true, '#FFF4DF');
    for (var i = 0; i < 4; i++) { var pts = ell(64, 140, 35 - i * 7, 26 - i * 5.5, 16); s += pencil(R, pts, 7.5, INK, 1, true) + pencil(R, pts, 4.5, '#86B57A', 1, true); }
    s += pencil(R, ell(64, 140, 6, 6, 8), 2, INK, 1, true, '#E8504A');
    return '<svg viewBox="0 0 130 190">' + s + '</svg>';
  }
  /* one fabric hoop section of the tunnel (the shop icon's yellow and salmon-red stripes), all pencil */
  function v24Seg(i, w) {
    var R = rng(2480 + i), c = i % 2 ? '#E46F6B' : '#FFE07A', d = i % 2 ? '#C25A57' : '#E2A800', s = '';
    s += pencil(R, [[2, 24], [16, 13], [30, 10], [44, 13], [58, 24], [58, 170], [44, 177], [30, 179], [16, 177], [2, 170]], 2.2, INK, 1, true, c);
    var n = 2 + (i % 3); for (var k = 0; k < n; k++) { var x = 10 + k * (44 / n) + R() * 4; s += pencil(R, [[x, 28 + R() * 6], [x + 3, 96], [x, 164 - R() * 6]], 1.3, d, 0.6); }
    s += pencil(R, [[8, 30], [12, 60], [10, 90]], 3.2, '#FFFBF3', 0.35);
    s += pencil(R, [[2, 24], [4, 96], [2, 170]], 3.2, INK, 0.9);
    return '<svg viewBox="0 0 60 190" preserveAspectRatio="none">' + s + '</svg>';
  }

  function v24TunnelEnd(left) {
    var R = rng(left ? 2490 : 2491), s = '';
    s += pencil(R, ell(30, 96, 24, 92, 20), 2.8, INK, 1, true, left ? '#FFE07A' : '#E46F6B');
    s += pencil(R, ell(left ? 27 : 33, 98, 13, 78, 18), 2.2, INK, 1, true, '#5E463D');
    s += '<path d="M' + (left ? 22 : 30) + ' 40q-6 58 0 118" fill="none" stroke="#6E544A" stroke-width="2" opacity=".7"/>';
    return '<svg viewBox="0 0 60 196">' + s + '</svg>';
  }
  function v24TunnelBase() {
    var R = rng(2492), s = '<ellipse cx="200" cy="34" rx="196" ry="13" fill="#5B3D32" opacity=".13"/>';
    [[20, 26], [380, 26]].forEach(function (p) { s += pencil(R, [[p[0], p[1]], [p[0] + 6, p[1] + 18]], 3, INK, 1) + pencil(R, [[p[0] - 7, p[1] - 2], [p[0] + 7, p[1] + 2]], 2.6, '#E8504A', 1); });
    return '<svg viewBox="0 0 400 50">' + s + '</svg>';
  }

  /* ---------- Snuffle Mat ---------- */
  IMPL['Snuffle Mat'] = function (A) {
    var dog = A.dog, DN = A.DN, CP = A.compact, MX = CP ? 545 : 590, MT = CP ? 440 : 428, MS = CP ? 0.95 : 1.18, HOME = CP ? 868 : 945;
    var mat = A.sprite(v24Mat(), 560 * MS, 160 * MS, A.L.scene, 0.5, 0); mat.set(MX, MT);
    function mp(u, v) { var y = MT + (10 + v * 130) * MS, l = MX + (lerp(70, 10, v) - 280) * MS, r = MX + (lerp(490, 550, v) - 280) * MS; return { x: lerp(l, r, u), y: y }; }
    var flaps = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var v = 0.18 + r * 0.32, p = mp(0.19 + c * 0.31, v), k = lerp(0.92, 1.22, v) * MS / 1.18;
      var kb = A.sprite(v24Kibble(r * 3 + c), 40 * k, 30 * k, A.L.scene); kb.set(p.x, p.y - 2); kb.show(false);
      flaps.push({ i: flaps.length, x: p.x, y: p.y, k: k, has: false, open: 0, want: 0, wig: 0, kb: kb, spr: A.sprite(v24Flap(r * 3 + c + r), 120 * k, 48 * k, A.L.scene, 0.5, 0.25) });
    }
    var state = 'hide', stT = 0, hidden = 0, found = 0, rounds = 0, sniffs = 0, finds = 0, plan = [], tgt = null, hintF = null, puffT = 0, peek = 0;
    var tip = A.tip('click a flap!', MX - 70, MT - 60);
    dog.x = HOME; dog.face('right'); dog.setPose('sit');
    A.say(pick(A.line('snuffleStart', ['hide the kibble. I will not look.', 'eyes closed. (one eye open)'])), 2200);
    function hideHint() { A.hint('Click a flap to hide a kibble (' + (3 - hidden) + ' to go). ' + DN + ' is not looking. Probably.'); }
    hideHint();
    function flapAt(x, y) { var best = null, bd = 1e9; flaps.forEach(function (f) { var d = Math.hypot(x - f.x, (y - f.y) * 1.9); if (d < A.hitR(62 * f.k) && d < bd) { bd = d; best = f; } }); return best; }
    function planSearch() {
      plan = []; var full = flaps.filter(function (f) { return f.has; }), empty = flaps.filter(function (f) { return !f.has; });
      full.sort(function () { return Math.random() - 0.5; });
      full.forEach(function (f) {
        var wrong = A.tr.sniff ? (Math.random() < 0.25 ? 1 : 0) : A.tr.clever ? (Math.random() < 0.5 ? 1 : 0) : 1 + Math.floor(Math.random() * 2);
        for (var i = 0; i < wrong; i++) { var e = pick(empty); if (plan[plan.length - 1] !== e) plan.push(e); }
        plan.push(f);
      });
    }
    function choose() {
      if (hintF) { tgt = hintF; hintF = null; plan = plan.filter(function (q) { return q !== tgt; }); }
      else { tgt = plan.shift() || null; if (!tgt) { var left = flaps.filter(function (f) { return f.has; }); tgt = left[0] || null; } }
      if (!tgt) { state = 'yay'; stT = 0; return; }
      state = 'walk'; stT = 0; dog.ground = tgt.y - dog.mouthDy('sniff');
    }
    function spot() { var side = dog.x >= tgt.x ? 1 : -1; return { x: tgt.x + side * dog.mouthOff('sniff'), side: side }; }
    return {
      poses: ['sit', 'idle', 'walk', 'sniff', 'happy', 'jump', 'eat'],
      dur: 55,
      hint: '',
      down: function (x, y) {
        var f = flapAt(x, y);
        if (!f) { dogTap(A, x, y, ['I am WORKING. (pat accepted)', 'sniff break. ok.']); return; }
        if (tip) { tip.hide(); tip = null; }
        if (state === 'hide') {
          if (f.has) { f.wig = 1; A.say(pick(['that one is taken!', 'already a kibble in there']), 1100); return; }
          f.has = true; f.want = 1; hidden++; A.sfx('click'); A.later(function () { f.want = 0; A.sfx('pop'); }, 420);
          A.burst('dust', f.x, f.y, 3, { g: -30, sp: 60, life: 0.5, size: 4 });
          if (Math.random() < 0.6) A.say(pick(['I heard nothing.', 'was that a flap? no.', '*not looking intensifies*']), 1000);
          if (hidden >= 3) { state = 'ready'; stT = 0; A.hint(DN + ' is sniffing it out. Click a flap to give a hint.'); } else hideHint();
        } else if (state === 'walk' || state === 'sniff' || state === 'ready') {
          if (f.has || f.open < 0.1) { hintF = f; f.wig = 1; A.sfx('click'); A.say(pick(['that one? ok!', 'a tip! thank you.', 'sniffing there next']), 900); }
        }
      },
      move: function (x, y) { A.cursor(state === 'hide' && flapAt(x, y) ? 'pointer' : 'default'); },
      update: function (dt, T) {
        stT += dt; puffT -= dt;
        if (state === 'hide') {
          dog.setPose('sit'); peek = Math.sin(T * 0.9); dog.face(peek > 0.9 ? 'left' : 'right');
          dog.tilt = Math.sin(T * 13) * 1.2;
        } else if (state === 'ready') {
          dog.setPose('happy'); wiggle(dog, T, 3);
          dog.face('left');
          if (stT > 0.9) { dog.tilt = 0; A.say(pick(['ready or not!', 'here I come, kibble!', 'nose: ON']), 1300); A.sfx('bark'); planSearch(); choose(); }
        } else if (state === 'walk') {
          var sp = spot(); dog.tilt = 0;
          if (dog.runTo(sp.x, (A.tr.sniff ? 340 : 250) * A.tr.run, dt)) { dog.face(sp.side > 0 ? 'left' : 'right'); state = 'sniff'; stT = 0; sniffs++; A.sfx('sniff'); }
        } else if (state === 'sniff') {
          dog.setPose('sniff'); dog.tilt = dog.dir() * Math.sin(T * 34) * 1.8;
          if (puffT <= 0) { puffT = 0.22; var m = dog.mouth(); A.burst('dust', m.x, m.y + 4, 2, { a0: -Math.PI * 0.9, spread: Math.PI * 0.8, g: -20, sp: 70, life: 0.45, size: 3.5 }); }
          var need = tgt.has ? (A.tr.sniff ? 0.5 : 0.75) : (A.tr.sniff ? 0.55 : 0.9);
          if (stT > need) {
            dog.tilt = 0;
            if (tgt.has) {
              state = 'eat'; stT = 0; tgt.want = 1; found++; finds++; A.sfx('pop');
              A.float(found >= 3 ? 'all found!' : 'found one!', tgt.x, tgt.y - 120, found >= 3 ? 'pt-gold' : 'pt-small');
              A.reward({ happiness: 1 });
              if (Math.random() < 0.7) A.say(pick(A.line('snuffleFind', ['FOUND IT!', 'kibble located', 'my nose is a genius'])), 1200);
            } else {
              tgt.wig = 1; if (Math.random() < 0.45) A.say(pick(['hmm. not here.', 'just fleece.', 'smells like... mat.']), 900);
              choose();
            }
          }
        } else if (state === 'eat') {
          dog.setPose('sniff'); dog.tilt = dog.dir() * Math.sin(T * 22) * 1.2;
          if (Math.floor(stT * 3) !== Math.floor((stT - dt) * 3) && stT < 1) { A.sfx('crunch'); var mm = dog.mouth(); A.burst('crumb', mm.x, mm.y, 3, { sp: 120, g: 900, life: 0.5, size: 2.6, color: '#C98B4E' }); }
          if (stT > 1.1) { tgt.has = false; tgt.kb.show(false); tgt.want = 0; dog.tilt = 0; if (found >= 3) { state = 'yay'; stT = 0; } else choose(); }
        } else if (state === 'yay') {
          dog.tilt = 0;
          if (stT < 0.05 && !dog.air) {
            rounds++; dog.jump(-720, 0); A.burst('heart', dog.head().x, dog.head().y, 7, { g: -50, sp: 120, life: 1.4, size: 9 });
            A.reward({ happiness: 3, bond: rounds === 1 ? 1 : 0, coins: rounds === 2 ? 1 : 0 });
            A.say(pick(['three for three! hide them again!', 'nose of the year', 'again! hide them HARDER']), 1800);
          }
          if (!dog.air) { dog.setPose('happy'); wiggle(dog, T, 3); }
          if (stT > 2) { dog.tilt = 0; state = 'home'; stT = 0; dog.ground = GY; }
        } else if (state === 'home') {
          if (dog.runTo(HOME, 300, dt)) { dog.face('right'); state = 'hide'; stT = 0; hidden = 0; found = 0; tgt = null; hintF = null; hideHint(); }
        }
        flaps.forEach(function (f) {
          f.open += (f.want - f.open) * Math.min(1, dt * 12); f.wig = Math.max(0, f.wig - dt * 2.5);
          var sy = 1 - 1.7 * f.open, w = Math.sin(T * 40) * f.wig * 8;
          f.spr.set(f.x, f.y - 12 * f.k - f.open * 10, w, 1, Math.abs(sy) < 0.08 ? 0.08 : sy);
          f.kb.show(f.has && f.open > 0.25);
        });
      },
      drawFx: function (g, T) {
        if (state === 'sniff' || state === 'eat') {
          var m = dog.mouth(), a = state === 'sniff' ? 1 : 0.5;
          g.fillStyle = INK; g.globalAlpha = a; g.font = '700 24px Caveat, cursive'; if (state === 'eat') g.fillText('crunch!', m.x - 30 + dog.dir() * 20, m.y - 30 - Math.sin(T * 8) * 3);
          g.strokeStyle = 'rgba(91,61,50,.6)'; g.lineWidth = 2; g.lineCap = 'round';
          for (var i = 0; i < 3; i++) { var ox = m.x + dog.dir() * (8 + i * 8), oy = m.y - 14 - i * 6; g.beginPath(); g.arc(ox, oy, 5 + i * 3, -2.2 + Math.sin(T * 20 + i) * 0.2, -0.9); g.stroke(); }
          g.globalAlpha = 1;
        }
        if (state === 'hide' && peek > 0.9) { var h = dog.head(); g.fillStyle = INK; g.font = '700 24px Caveat, cursive'; g.fillText('*peek*', h.x - 30, h.y - 46); }
      },
      focus: function () { return CP ? 630 : state === 'hide' ? 630 : (dog.x + MX) / 2; },
      finish: function () { return { happiness: 2, energy: -1 }; },
      dbg: function () { return { state: state, hidden: hidden, found: found, rounds: rounds, sniffs: sniffs, finds: finds, flaps: flaps.map(function (f) { return { x: f.x, y: f.y, has: f.has, open: f.open }; }) }; }
    };
  };
  IMPL['Snuffle Mat'].cfg = {};
  IMPL['Snuffle Mat'].phone = { vw: 740, vwMin: 730, fx: 630 };

  /* ---------- Treat Cone ---------- */
  IMPL['Treat Cone'] = function (A) {
    var dog = A.dog, DN = A.DN, PIV = 122 * 0.62 - 17;
    var cone = { x: 520, rot: 0, vx: 0, held: false, unheld: 0, tipTo: 0, standT: 0 };
    var spr = A.sprite(v24Cone(), 100, 122, A.L.actors, 0.5, 0.62);
    var meter = A.meter('lick meter', 470, 92, 300, null);
    var state = 'intro', stT = 0, lick = 0, smear = 1, cones = 0, tips = 0, licks = 0, lickPh = 0, half = false, rollT = 0, pawT = 0;
    var tip = A.tip('press & hold me!', 430, 380);
    dog.x = 880; dog.face('left'); dog.setPose('sit');
    A.say(pick(A.line('coneLick', ['is that... PUMPKIN?', 'a cone! with pumpkin! for ME?'])), 1800);
    function up() { return Math.abs(cone.rot) < 25; }
    function pivY() { return GY - lerp(122 * 0.38 - 2, 32, Math.min(1, Math.abs(cone.rot) / 90)); }
    function hole() { var a = cone.rot * Math.PI / 180; return { x: cone.x + Math.sin(a) * PIV, y: pivY() - Math.cos(a) * PIV }; }
    function lickPose() { return up() ? 'sit' : 'crouch'; }
    function spot() { var h = hole(), side = up() ? (dog.x >= cone.x ? 1 : -1) : (h.x >= cone.x ? 1 : -1); return { x: h.x + side * (dog.mouthOff(lickPose()) + (up() ? 34 : 22)), side: side }; }
    function tipOver() { state = 'tip'; stT = 0; tips++; cone.tipTo = dog.x > cone.x ? -90 : 90; cone.vx = (dog.x > cone.x ? -1 : 1) * (200 + Math.random() * 80); A.sfx('bonk'); A.say(pick(['it ran away!', 'come BACK, cone', 'the cone has legs?!']), 1300); }
    return {
      poses: ['sit', 'idle', 'walk', 'crouch', 'happy', 'bow'],
      dur: 50,
      hint: 'Hold the cone steady while ' + DN + ' licks. Let go and it might roll away!',
      down: function (x, y) {
        var c = { x: cone.x, y: pivY() - (up() ? 10 : 0) };
        if (dist(x, y, c.x, c.y) < A.hitR(up() ? 72 : 66)) {
          if (tip) { tip.hide(); tip = null; }
          cone.held = true; A.cursor('grabbing'); A.sfx('click');
          if (!up()) { state = 'stand'; stT = 0; cone.standFrom = cone.rot; cone.vx = 0; A.say(pick(['upsy-daisy', 'stand up, cone']), 900); }
          return;
        }
        dogTap(A, x, y, ['mid-lick! hello!', 'pumpkin face. yes.']);
      },
      move: function (x, y) { if (!cone.held) A.cursor(dist(x, y, cone.x, pivY()) < 70 ? 'grab' : 'default'); },
      up: function () { if (cone.held) { cone.held = false; A.cursor('default'); cone.unheld = 0; } },
      update: function (dt, T) {
        stT += dt; lickPh += dt;
        if (state === 'intro') { dog.setPose('sit'); wiggle(dog, T, 2); if (stT > 0.9) { dog.tilt = 0; state = 'go'; stT = 0; } }
        else if (state === 'go') {
          var sp = spot();
          if (dog.runTo(sp.x, 300 * A.tr.run, dt)) { dog.face(sp.side > 0 ? 'left' : 'right'); state = 'lick'; stT = 0; }
        } else if (state === 'lick') {
          var sp2 = spot(); if (Math.abs(dog.x - sp2.x) > 30) { state = 'go'; stT = 0; }
          else {
            dog.setPose(lickPose()); dog.face(sp2.side > 0 ? 'left' : 'right'); dog.tilt = Math.sin(T * 9) * 1.4;
            var rate = cone.held && up() ? 0.12 : up() ? 0.07 : 0.045;
            lick = Math.min(1, lick + rate * dt); smear = 1 - lick; meter.set(lick);
            if (lickPh > 0.45) {
              lickPh = 0; licks++; if (licks % 2) A.sfx('slurp');
              if (A.tr.snort && Math.random() < 0.3) { A.sfx('sniff'); var m = dog.mouth(); A.burst('dust', m.x, m.y - 6, 4, { g: -30, sp: 90, life: 0.5, size: 4 }); if (Math.random() < 0.6) A.say(pick(A.line('coneSnort', ['*snort*', '*snort snort*', '*snerk*'])), 700); }
              else if (Math.random() < 0.08) A.say(pick(A.line('coneLick', ['mmm. pumpkin.', 'lick lick lick', 'this is my calm place'])), 1100);
            }
            if (!half && lick >= 0.5) { half = true; A.reward({ happiness: 1 }); A.float('halfway!', cone.x, GY - 190, 'pt-small'); }
            if (up() && !cone.held) {
              cone.unheld += dt; cone.rot = Math.sin(T * 9) * Math.min(14, cone.unheld * 9);
              if (cone.unheld > 1.6) tipOver();
            } else if (up()) cone.rot *= 0.8;
            if (!up()) { pawT += dt; if (pawT > 2.4) { pawT = 0; dog.setPose('bow'); cone.vx = (dog.x > cone.x ? -1 : 1) * 130; state = 'rollon'; stT = 0; A.say(pick(['*paw paw*', 'boop. it rolled.']), 900); } }
            if (lick >= 1) {
              state = 'clean'; stT = 0; cones++; half = false; var hh = hole();
              A.float('licked clean!', hh.x, hh.y - 90, 'pt-gold'); A.burst('spark', hh.x, hh.y, 10, { g: 0, sp: 160, life: 0.7, size: 7 }); A.sfx('levelup');
              A.reward({ happiness: 4, coins: cones === 2 ? 1 : 0 });
              A.say(pick(['spotless. I am a professional.', 'more? MORE?', 'that was the best five minutes']), 1700);
            }
          }
        } else if (state === 'tip') {
          var u = Math.min(1, stT / 0.35); cone.rot = lerp(cone.rot, cone.tipTo, u);
          if (u >= 1) { cone.rot = cone.tipTo; state = 'roll'; stT = 0; A.sfx('bounce'); A.burst('dust', cone.x, GY, 5, { sp: 120, g: -20, life: 0.6, size: 6 }); }
        } else if (state === 'roll' || state === 'rollon') {
          if (state === 'rollon' && stT < 0.3) dog.setPose('bow');
          if (stT > 0.4) { state = 'go'; stT = 0; }
        } else if (state === 'stand') {
          var k = Math.min(1, stT / 0.3); cone.rot = lerp(cone.standFrom, 0, k);
          if (k >= 1) { cone.rot = 0; state = 'go'; stT = 0; A.sfx('pop'); }
        } else if (state === 'clean') {
          dog.setPose('happy'); wiggle(dog, T, 3);
          if (stT > 1.6) { state = 'refill'; stT = 0; dog.tilt = 0; A.say(pick(['refill! plain pumpkin. the best kind.', 'here comes more pumpkin']), 1500); }
        } else if (state === 'refill') {
          dog.setPose('sit'); wiggle(dog, T, 1.5); smear = Math.min(1, stT / 0.6);
          if (stT > 0.15 && stT < 0.2) { var h2 = hole(); A.burst('drop', h2.x, h2.y, 6, { sp: 120, g: 600, life: 0.5, size: 3, color: '#F4A262' }); A.sfx('pop'); }
          if (stT > 0.8) { lick = 0; meter.set(0); smear = 1; dog.tilt = 0; state = 'go'; stT = 0; }
        }
        if (cone.vx) {
          cone.x += cone.vx * dt; cone.vx *= Math.pow(0.25, dt);
          if (cone.x < (A.compact ? 400 : 260)) { cone.x = A.compact ? 400 : 260; cone.vx = Math.abs(cone.vx) * 0.6; }
          if (cone.x > (A.compact ? 800 : 900)) { cone.x = A.compact ? 800 : 900; cone.vx = -Math.abs(cone.vx) * 0.6; }
          if (!up()) cone.rot = cone.tipTo + Math.sin(cone.x * 0.08) * 7;
          if (Math.abs(cone.vx) < 12) cone.vx = 0;
        }
        spr.set(cone.x, pivY(), cone.rot);
      },
      drawFx: function (g, T) {
        var h = hole(), a = cone.rot * Math.PI / 180;
        if (smear > 0.02) {
          g.save(); g.translate(h.x, h.y); g.rotate(a);
          /* the pumpkin heaped in the mouth (lumpy, like the icon's), shrinking as it is licked; a kibble pokes out */
          var rx = 31 * (0.3 + 0.7 * smear), ry = 8 * (0.5 + 0.5 * smear);
          g.fillStyle = '#F9A35E'; g.strokeStyle = INK; g.lineWidth = 1.8; g.beginPath();
          for (var i = 0; i <= 14; i++) { var t = i / 14 * Math.PI * 2, bump = 1 + (i % 2 ? 0.16 : 0) * smear, px = Math.cos(t) * rx * bump, py = Math.sin(t) * ry * bump - (Math.sin(t) < 0 ? 5 * smear : 0); if (i) g.lineTo(px, py); else g.moveTo(px, py); }
          g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#FFC48A'; g.beginPath(); g.ellipse(-rx * 0.35, -3 * smear, rx * 0.28, ry * 0.35, 0, 0, Math.PI * 2); g.fill();
          if (smear > 0.3) { g.fillStyle = '#D59A5E'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(rx * 0.3, -5 * smear - 2, 6, 4.5, 0.3, 0, Math.PI * 2); g.fill(); g.stroke(); }
          if (smear > 0.5) { g.fillStyle = '#F9A35E'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(-rx * 0.8, 7, 3.4, 7 * smear, 0.15, 0, Math.PI * 2); g.fill(); g.stroke(); }
          g.restore();
        }
        if (state === 'lick') {
          var e = Math.max(0, Math.sin(lickPh / 0.45 * Math.PI)), m = dog.mouth(), ex = lerp(m.x, h.x, e), ey = lerp(m.y + 4, h.y - 2, e);
          if (e > 0.05) { g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 13; g.beginPath(); g.moveTo(m.x, m.y + 4); g.quadraticCurveTo((m.x + ex) / 2, Math.max(m.y, ey) + 10, ex, ey); g.stroke(); g.strokeStyle = '#F28FA5'; g.lineWidth = 9; g.stroke(); g.strokeStyle = '#C2577A'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(m.x, m.y + 4); g.quadraticCurveTo((m.x + ex) / 2, Math.max(m.y, ey) + 10, ex, ey); g.stroke(); }
        }
        if (cone.held && up()) {
          drawHand(g, cone.x + (dog.x > cone.x ? -30 : 30), pivY() + 4, dog.x > cone.x ? 1 : -1);
          g.fillStyle = INK; g.font = '700 22px Caveat, cursive'; g.fillText('steady...', cone.x - 40, GY - 150);
        } else if (state === 'lick' && up() && cone.unheld > 0.4) {
          g.strokeStyle = 'rgba(91,61,50,.6)'; g.lineWidth = 2; g.lineCap = 'round';
          for (var i = -1; i <= 1; i += 2) { g.beginPath(); g.arc(cone.x + i * 62, pivY() - 30, 14, i > 0 ? -0.8 : Math.PI - 0.6, i > 0 ? 0.6 : Math.PI + 0.8); g.stroke(); }
        }
        if (!up() && (state === 'roll' || state === 'tip' || cone.vx)) { g.strokeStyle = 'rgba(91,61,50,.4)'; g.lineWidth = 2; for (var j = 0; j < 3; j++) { var dx = -Math.sign(cone.vx || 1) * (50 + j * 12); g.beginPath(); g.moveTo(cone.x + dx, GY - 20 - j * 12); g.lineTo(cone.x + dx * 1.6, GY - 20 - j * 12); g.stroke(); } }
      },
      focus: function () { return (cone.x + dog.x) / 2; },
      finish: function () { return { happiness: 2, energy: 2 }; },
      dbg: function () { return { state: state, held: cone.held, lick: lick, cones: cones, tips: tips, licks: licks, cone: { x: cone.x, rot: cone.rot, y: pivY() } }; }
    };
  };
  IMPL['Treat Cone'].cfg = {};
  IMPL['Treat Cone'].phone = { vw: 720, vwMin: 700 };

  /* ---------- Squeaky Hedgehog ---------- */
  IMPL['Squeaky Hedgehog'] = function (A) {
    var dog = A.dog, DN = A.DN;
    var hog = { x: 420, h: 0, vh: 0, vx: 0, air: false, sq: 0, ball: false, rot: 0, ballT: 0, face: 1 };
    var hs = A.sprite(v24Hog(), 150, 112, A.L.actors, 0.5, 0.95), bs = A.sprite(v24HogBall(), 104, 104, A.L.actors, 0.5, 0.5); bs.show(false);
    var state = 'ready', stT = 0, taps = [], squeaks = 0, pounces = 0, rolls = 0, boops = 0, boopT = 0, tip = A.tip('click me!', 360, 380);
    dog.x = 780; dog.face('left'); dog.setPose('sit');
    A.say(pick(['a hedgehog?! a SQUEAKY hedgehog?!', 'it is looking at me']), 1800);
    function hogY() { return hog.ball ? GY - 50 - hog.h : GY + 4 - hog.h; }
    function onHog(x, y) { return hog.ball ? dist(x, y, hog.x, hogY()) < A.hitR(68) : dist(x, y, hog.x, GY - 46 - hog.h) < A.hitR(82); }
    function curl() {
      hog.ball = true; hog.ballT = 0; hs.show(false); bs.show(true); rolls++;
      hog.vx = (hog.x < dog.x ? -1 : 1) * (380 + Math.random() * 80); hog.h = 0; hog.vh = 0; hog.air = false;
      A.float('it rolled up!', hog.x, GY - 170, 'pt-gold'); A.sfx('whoosh');
      A.say(pick(A.line('hogRoll', ['it is a BALL now', 'where did its face go?!', 'roll! I will catch you!'])), 1500);
      state = 'chase'; stT = 0; dog.tilt = 0;
    }
    function squeak() {
      A.sfx('squeak'); hog.sq = 1; squeaks++;
      var now = performance.now() / 1000; taps.push(now); while (taps.length && now - taps[0] > 1.6) taps.shift();
      A.burst('note', hog.x + 30, GY - 90 - hog.h, 1, { a0: -Math.PI * 0.7, spread: 0.4, g: -30, sp: 90, life: 0.9, size: 8 });
      if (hog.ball) { hog.vx += (hog.x < dog.x ? -1 : 1) * 150; A.float('squeak?', hog.x, GY - 130, 'pt-small'); return; }
      if (taps.length >= 3) { taps = []; curl(); return; }
      if (!hog.air) { hog.air = true; hog.vh = 520; var dx = (40 + Math.random() * 60) * (Math.random() < 0.5 ? -1 : 1); var tx = clamp(hog.x + dx, 250, 640); hog.vx = (tx - hog.x) / 0.52; A.burst('dust', hog.x, GY, 3, { g: -20, sp: 60, life: 0.5, size: 4 }); }
      if (state === 'ready' || state === 'back' || state === 'proud') { state = 'answer'; stT = 0; }
    }
    return {
      poses: ['sit', 'idle', 'walk', 'happy', 'speak', 'bow', 'jump', 'sniff', 'crouch'],
      dur: 50,
      hint: 'Click the hedgehog to squeak it. ' + DN + ' answers and pounces. Three quick squeaks and it rolls up!',
      down: function (x, y) {
        if (onHog(x, y)) { if (tip) { tip.hide(); tip = null; } squeak(); return; }
        dogTap(A, x, y, ['did you hear that squeak?', 'hi! the hedgehog is THERE']);
      },
      move: function (x, y) { A.cursor(onHog(x, y) ? 'pointer' : 'default'); },
      update: function (dt, T) {
        stT += dt; hog.sq = Math.max(0, hog.sq - dt * 5);
        if (hog.air) { hog.h += hog.vh * dt; hog.vh -= 2000 * dt; hog.x += hog.vx * dt; if (hog.h <= 0) { hog.h = 0; hog.air = false; hog.vx = 0; hog.sq = 0.6; A.sfx('land'); } }
        if (hog.ball) {
          hog.ballT += dt; hog.x += hog.vx * dt; hog.vx *= Math.pow(0.4, dt); hog.rot += hog.vx * dt / 50 * 57.3;
          if (hog.x < 200) { hog.x = 200; hog.vx = Math.abs(hog.vx) * 0.7; A.sfx('bounce'); }
          if (hog.x > 1040) { hog.x = 1040; hog.vx = -Math.abs(hog.vx) * 0.7; A.sfx('bounce'); }
          if (Math.abs(hog.vx) > 80 && Math.random() < dt * 10) A.burst('dust', hog.x, GY, 1, { g: -20, sp: 50, life: 0.5, size: 4 });
        }
        var side = dog.x >= hog.x ? 1 : -1;
        if (!hog.ball) hog.face = side;
        if (state === 'ready') {
          var far = Math.abs(dog.x - hog.x);
          if (far < 230 || far > (A.compact ? 360 : 440)) { state = 'back'; stT = 0; }
          else { dog.setPose('sit'); dog.face(side > 0 ? 'left' : 'right'); dog.tilt = Math.sin(T * 2.4) * 5; }
        } else if (state === 'back') {
          dog.tilt = 0; var bd = A.compact ? 290 : 330, bx = clamp(hog.x + side * bd, 150, 1090); if (Math.abs(bx - hog.x) < 250) bx = clamp(hog.x - side * bd, 150, 1090);
          if (dog.runTo(bx, 300 * A.tr.run, dt)) { dog.face(dog.x > hog.x ? 'left' : 'right'); state = 'ready'; stT = 0; }
        } else if (state === 'answer') {
          dog.face(side > 0 ? 'left' : 'right'); dog.setPose('speak'); dog.tilt = 0;
          if (stT < 0.05) { A.sfx('bark'); A.say(pick(A.line('hogAnswer', ['WOOF! (squeak to you too)', 'squeak? SQUEAK!', 'arf! arf!'])), 1000); A.addPart({ type: 'note', x: dog.head().x, y: dog.head().y - 20, vx: -side * 40, vy: -100, life: 0.9, size: 9 }); }
          if (stT > 0.5) { state = 'wind'; stT = 0; }
        } else if (state === 'wind') {
          dog.setPose('bow'); dog.tilt = Math.sin(T * 26) * 4;
          if (stT > 0.45 && !hog.air) {
            dog.tilt = 0; var land = hog.x + side * (dog.mouthOff('idle') + 24), vy = -660, ft = 2 * 660 / G;
            dog.jump(vy, clamp((land - dog.x) / ft, -720, 720)); state = 'pounce'; stT = 0;
          }
        } else if (state === 'pounce') {
          if (!dog.air && stT > 0.1) {
            pounces++; state = 'proud'; stT = 0; dog.squash(0.8);
            if (Math.random() < 0.45 && !hog.air) { hog.air = true; hog.vh = 480; hog.vx = -side * 160; A.float('missed! (on purpose)', dog.x, GY - 230, 'pt-small'); A.sfx('squeak'); }
            else { A.float(pick(['got it!', 'POUNCE!', 'gotcha!']), dog.x, GY - 230, 'pt-gold'); hog.sq = 1; A.burst('heart', dog.head().x, dog.head().y, 4, { g: -50, sp: 100, life: 1.2, size: 8 }); }
            if (pounces <= 4 || pounces % 3 === 0) A.reward({ happiness: 1, energy: -1 });
          }
        } else if (state === 'proud') {
          dog.setPose('happy'); wiggle(dog, T, 3);
          if (stT > 1.1) { dog.tilt = 0; state = 'ready'; stT = 0; }
        } else if (state === 'chase') {
          var sx = hog.x + side * (dog.mouthOff('sniff') + 26);
          if (dog.runTo(sx, 430 * A.tr.run, dt)) {
            dog.face(side > 0 ? 'left' : 'right'); dog.setPose('sniff'); dog.tilt = dog.dir() * Math.sin(T * 30) * 1.6; boopT += dt;
            if (boopT > 0.9 && Math.abs(hog.vx) < 60 && hog.ballT < 3.4) { boopT = 0; boops++; hog.vx = -side * 190; A.sfx('pop'); A.float('boop', hog.x, GY - 130, 'pt-small'); }
          }
          if (hog.ballT > 3.6 && Math.abs(hog.vx) < 60 && Math.abs(dog.x - sx) < 40) {
            hog.ball = false; hog.rot = 0; bs.show(false); hs.show(true); hog.sq = 1; dog.tilt = 0;
            A.float('peekaboo!', hog.x, GY - 170, 'pt-gold'); A.sfx('squeak');
            A.reward({ happiness: 3, coins: rolls <= 2 ? 1 : 0 }); A.say(pick(['it came BACK!', 'peekaboo, spiky friend', 'best roll ever']), 1500);
            state = 'proud'; stT = 0;
          }
        }
        if (hog.ball) bs.set(hog.x, hogY(), hog.rot, 1 + hog.sq * 0.1, 1 - hog.sq * 0.1);
        else hs.set(hog.x, hogY(), hog.air ? -hog.face * 8 : Math.sin(T * 3) * 2, hog.face * (1 + hog.sq * 0.14), 1 - hog.sq * 0.22);
      },
      drawFx: function (g) { if (hog.air || hog.ball) A.shadow(g, hog.x, GY + 6, hog.h, 42); },
      focus: function () { return (hog.x + dog.x) / 2; },
      finish: function () { return { happiness: 2, energy: -2 }; },
      dbg: function () { return { state: state, squeaks: squeaks, pounces: pounces, rolls: rolls, boops: boops, hog: { x: hog.x, y: GY - 46 - hog.h, ball: hog.ball } }; }
    };
  };
  IMPL['Squeaky Hedgehog'].cfg = {};
  IMPL['Squeaky Hedgehog'].phone = { vw: 720, vwMin: 700 };

  /* ---------- Bubble Machine ---------- */
  IMPL['Bubble Machine'] = function (A) {
    var dog = A.dog, DN = A.DN, CP = A.compact, MX = CP ? 300 : 280, MY = GY + 4, MS = CP ? 1.12 : 1.3, DX0 = CP ? 480 : 520, DX1 = CP ? 760 : 980;
    var mach = A.sprite(v24Machine(), 200 * MS, 190 * MS, A.L.actors, 0.5, 184 / 190);
    var HUB = { x: MX + 76 * MS, y: MY - 60 * MS }, RING = { x: MX + 2 * MS, y: MY - 134 * MS };
    var crank = A.sprite(v24Crank(), 80 * MS, 80 * MS, A.L.actors, 0.5, 0.5);
    var bubs = [], made = 0, pops = 0, selfPops = 0, cranking = false, crankA = 0, emitT = 0, clickT = 0, shake = 0, state = 'watch', stT = 0, tgt = null, cool = 0, idleT = 0;
    var tip = A.tip('hold the crank!', HUB.x - 30, HUB.y + 34);
    dog.x = CP ? 720 : 820; dog.face('left'); dog.setPose('sit');
    A.say(pick(['what does THAT do?', 'a machine. for me?']), 1800);
    function emit() { if (bubs.length >= 18) return; made++; bubs.push({ x: RING.x + 10, y: RING.y - 6, r: 15 + Math.random() * 19, vx: 110 + Math.random() * 120, vy: -60 - Math.random() * 90, ph: Math.random() * 6, t: 0, life: 6.5 + Math.random() * 3 }); }
    function pop(b, byDog) {
      var i = bubs.indexOf(b); if (i < 0) return; bubs.splice(i, 1);
      A.addPart({ type: 'ring', x: b.x, y: b.y, size: b.r * 0.9, life: 0.3 });
      A.burst('drop', b.x, b.y, byDog ? 7 : 4, { sp: 200, g: 500, life: 0.55, size: 2.6, color: '#CBE0F4' });
      A.sfx('pop');
      if (byDog) {
        pops++; if (pops % 5 === 0) A.float(pops + ' pops!', b.x, b.y - 40, 'pt-gold'); else if (pops % 2) A.float('pop!', b.x, b.y - 40, 'pt-blue pt-small');
        if (pops % 4 === 0) A.reward({ happiness: 1, energy: pops % 8 === 0 ? -1 : 0 });
        if (pops === 5 || pops === 14) A.reward({ happiness: 1, coins: 1 });
        if (pops % 4 === 1) A.say(pick(A.line('bubblePop', ['POP!', 'got one!', 'they taste like nothing. amazing.', 'bubble defeated'])), 1000);
      } else selfPops++;
    }
    function onCrank(x, y) { return dist(x, y, HUB.x + 14, HUB.y) < A.hitR(64) || (x > MX - 92 * MS && x < MX + 72 * MS && y > MY - 110 * MS && y < MY); }
    function pickTarget() {
      var best = null, bd = 1e9;
      bubs.forEach(function (b) { if (b.x < DX0 - 50 || b.x > DX1 + 20 || b.y < GY - 430 || b.t < 0.4) return; var d = Math.abs(b.x - dog.x) + Math.abs(b.y - (GY - 200)) * 0.5; if (d < bd) { bd = d; best = b; } });
      return best;
    }
    return {
      poses: ['sit', 'idle', 'walk', 'jump', 'happy', 'speak'],
      dur: 50,
      hint: 'Click or hold the crank to blow bubbles. ' + DN + ' jumps to pop them. Pops earn coins!',
      down: function (x, y) {
        if (onCrank(x, y)) { if (tip) { tip.hide(); tip = null; } cranking = true; emit(); emit(); emitT = 0.2; A.sfx('click'); A.cursor('grabbing'); return; }
        for (var i = bubs.length - 1; i >= 0; i--) { var b = bubs[i]; if (dist(x, y, b.x, b.y) < A.hitR(b.r + 10)) { pop(b, false); if (Math.random() < 0.5) A.say(pick(['HEY. that was MY bubble.', 'you popped it?! rude.']), 1000); return; } }
        dogTap(A, x, y, ['bubbles please!', 'hi! more bubbles?']);
      },
      move: function (x, y) { if (!cranking) A.cursor(onCrank(x, y) ? 'pointer' : 'default'); },
      up: function () { cranking = false; A.cursor('default'); },
      update: function (dt, T) {
        stT += dt; cool -= dt; shake = Math.max(0, shake - dt * 4);
        if (cranking) { crankA += dt * 560; emitT -= dt; clickT -= dt; shake = 1; if (emitT <= 0) { emit(); emitT = 0.2; } if (clickT <= 0) { A.sfx('click'); clickT = 0.24; } }
        mach.set(MX, MY, shake ? Math.sin(T * 50) * 1.2 : 0); crank.set(HUB.x, HUB.y, crankA);
        for (var i = bubs.length - 1; i >= 0; i--) {
          var b = bubs[i]; b.t += dt;
          b.vx += (-b.vx * 0.6 + 42) * dt; b.vy += (-b.vy * 0.9 + Math.sin(b.t * 1.8 + b.ph) * 40 + 9) * dt;
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y > GY - 24) { b.y = GY - 24; b.vy = -Math.abs(b.vy) * 0.5 - 20; }
          if (b.x > DX1 + 90 || b.y < 100 || b.t > b.life) pop(b, false);
        }
        if (state === 'watch') {
          if (!dog.air) { dog.setPose('sit'); var look = bubs.length ? bubs[bubs.length - 1].x : MX; dog.faceX(look); dog.tilt = bubs.length ? Math.sin(T * 13) * 2 : 0; }
          idleT += dt; if (!bubs.length && idleT > 6) { idleT = 0; A.say(pick(['crank it! crank the thing!', 'more bubbles please', 'I am ready. so ready.']), 1300); }
          if (cool <= 0) { tgt = pickTarget(); if (tgt) { state = 'chase'; stT = 0; idleT = 0; dog.tilt = 0; } }
        } else if (state === 'chase') {
          if (bubs.indexOf(tgt) < 0) { state = 'watch'; cool = 0.15; }
          else if (!dog.air) {
            var side = dog.x >= tgt.x ? 1 : -1, tx = clamp(tgt.x + tgt.vx * 0.35 + side * dog.mouthOff('jump'), DX0, DX1);
            dog.runTo(tx, 470 * A.tr.run, dt);
            var m = dog.mouth();
            if (tgt.y > GY - 150 && dist(m.x, m.y, tgt.x, tgt.y) < tgt.r + 40) { pop(tgt, true); dog.setPose('happy'); state = 'watch'; cool = 0.3; }
            else if (Math.abs(dog.x - tx) < 70 && tgt.y < GY - 120) {
              dog.face(tgt.x > dog.x ? 'right' : 'left');
              var rise = clamp((dog.y - 108 * DS) - tgt.y + 20, 40, A.key === 'chihuahua' ? 230 : 420), vy = -Math.sqrt(2 * G * rise), tUp = -vy / G;
              dog.jump(vy, clamp((tgt.x + tgt.vx * tUp - dog.x - dog.dir() * dog.mouthOff('jump')) / Math.max(0.2, tUp), -520, 520)); state = 'air'; stT = 0;
            }
            if (stT > 3.5) { state = 'watch'; cool = 0.4; }
          }
        } else if (state === 'air') {
          var mj = dog.mouth();
          for (var j = bubs.length - 1; j >= 0; j--) if (dist(mj.x, mj.y, bubs[j].x, bubs[j].y) < bubs[j].r + 46) { pop(bubs[j], true); break; }
          if (!dog.air) { state = 'watch'; cool = 0.5 + Math.random() * 0.5; dog.setPose('happy'); dog.x = clamp(dog.x, DX0, DX1); }
        }
        if (dog.x < DX0 && !dog.air) dog.x = DX0;
        if (dog.x > DX1 + 40 && !dog.air) dog.x = DX1 + 40;
      },
      drawFx: function (g, T) {
        for (var i = 0; i < bubs.length; i++) { var b = bubs[i], gr = Math.min(1, b.t / 0.25), w = 1 + Math.sin(b.t * 6 + b.ph) * 0.04; drawBubble(g, b.x, b.y, b.r * gr * w, 1); }
        if (cranking) { g.strokeStyle = 'rgba(91,61,50,.55)'; g.lineWidth = 2; g.lineCap = 'round'; for (var k = 0; k < 3; k++) { var a = crankA * Math.PI / 180 + k * 2.1; g.beginPath(); g.arc(HUB.x, HUB.y, 58 + k * 3, a, a + 0.5); g.stroke(); } }
      },
      focus: function () { return CP ? 545 : clamp((MX + 40 + dog.x) / 2, 520, 600); },
      finish: function () { return { happiness: 2, energy: -2 }; },
      dbg: function () { return { state: state, made: made, pops: pops, selfPops: selfPops, alive: bubs.length, cranking: cranking, hub: HUB }; }
    };
  };
  IMPL['Bubble Machine'].cfg = {};
  IMPL['Bubble Machine'].phone = { vw: 720, vwMin: 700, fx: 545 };

  /* ---------- Paddling Pool ---------- */
  IMPL['Paddling Pool'] = function (A) {
    var dog = A.dog, DN = A.DN, CP = A.compact, PS = CP ? 0.8 : 1, PX = CP ? 665 : 730, PY = 528, IRX = 214 * PS, TPX = CP ? 360 : 300, OX = PX - 270 * PS, OY = PY - 70 * PS, WAIT = CP ? 915 : 1040;
    var post = A.sprite(v24TapPost(), 130, 190, A.L.scene, 0.5, 178 / 190); post.set(TPX, GY + 12);
    var back = A.sprite(v24Pool('back'), 540 * PS, 190 * PS, A.L.scene, 0, 0); back.set(OX, OY);
    var water = A.sprite(v24Water(false), 540 * PS, 190 * PS, A.L.scene, 0.5, 73 / 190);
    var fwater = A.sprite(v24Water(true), 540 * PS, 190 * PS, A.L.front, 0, 0); fwater.set(OX, OY);
    var front = A.sprite(v24Pool('front'), 540 * PS, 190 * PS, A.L.front, 0, 0); front.set(OX, OY);
    var REEL = { x: TPX - 65 + 100, y: GY + 12 - 178 + 140 }, REST = { x: TPX + (CP ? 92 : 120), y: GY + 34 };
    var noz = { x: REST.x, y: REST.y, held: false, ang: 0.5 }, fill = 0, state = 'wait', stT = 0, splashes = 0, hosed = 0, hoseCD = 0, spray = false, landX = 0, landY = 0, inPool = false, padT = 0, padTo = PX, padPose = 'walk', lowSaid = false, hot = A.weather === 'sunny' && (A.time === 'day' || A.time === 'dusk');
    var tip = A.tip('drag the hose!', REST.x - 60, REST.y - 110);
    dog.x = WAIT; dog.face('left'); dog.setPose('sit');
    A.say(hot ? 'it is SO hot. is that a pool?' : 'is that... a tiny lake?', 2000);
    function tipPt() { var d = noz.x > PX + 60 ? -1 : 1; return { x: noz.x + d * Math.cos(noz.ang) * 30, y: noz.y + Math.sin(noz.ang) * 30, d: d }; }
    function waterY() { return PY + 3 * PS + (1 - fill) * 18 * PS; }
    function inside(x) { return Math.abs(x - PX) < IRX - 30; }
    function bigSplash(x, n) { A.burst('drop', x, waterY() - 6, n, { sp: 380, g: 1150, life: 0.9, size: 4.5, color: '#9CC8EA' }); A.sfx('splash'); }
    return {
      poses: ['sit', 'idle', 'walk', 'jump', 'happy', 'shake', 'down'],
      dur: 50,
      hint: 'Drag the hose over the pool to fill it. Then click ' + DN + ' for a big splash!',
      down: function (x, y) {
        if (dist(x, y, noz.x, noz.y - 10) < A.hitR(60)) { noz.held = true; A.cursor('grabbing'); if (tip) { tip.hide(); tip = null; } A.sfx('click'); return; }
        if (inPool && dogTap(A, x, y, ['SPLASH TIME', 'again!'])) {
          if (!dog.air) { dog.jump(-640, 0); state = 'splash'; stT = 0; }
          return;
        }
        dogTap(A, x, y, ['is it pool time yet?', 'fill it! fill it!']);
      },
      move: function (x, y) { if (noz.held) { noz.x = clamp(x, 60, W - 60); noz.y = clamp(y, 150, GY + 6); } else A.cursor(dist(x, y, noz.x, noz.y - 10) < 60 ? 'grab' : 'default'); },
      up: function () { if (noz.held) { noz.held = false; A.cursor('default'); } },
      update: function (dt, T) {
        stT += dt; hoseCD -= dt;
        if (!noz.held) { noz.x += (REST.x - noz.x) * Math.min(1, dt * 5); noz.y += (REST.y - noz.y) * Math.min(1, dt * 5); }
        noz.ang = noz.held ? 1.0 : 0.2;
        spray = noz.held && noz.y < GY - 20;
        if (spray) {
          var tp = tipPt(); landX = tp.x + tp.d * 46; landY = inside(landX) ? waterY() : GY;
          if (Math.random() < dt * 30) A.addPart({ type: 'drop', x: tp.x, y: tp.y, vx: tp.d * (80 + Math.random() * 40), vy: 40 + Math.random() * 60, g: 1100, life: Math.min(0.9, Math.sqrt(Math.max(4, landY - tp.y) / 550)), size: 3, color: '#9CC8EA' });
          if (inside(landX) && landY > tp.y) {
            var was = fill; fill = Math.min(1, fill + dt * 0.3);
            if (was < 0.5 && fill >= 0.5 && state === 'wait') A.say('almost a lake!', 1100);
            if (fill >= 1 && was < 1 && state === 'wait') { state = 'hopin'; stT = 0; A.float('pool ready!', PX, PY - 150, 'pt-gold'); A.sfx('levelup'); }
            if (Math.random() < dt * 8) A.addPart({ type: 'ring', x: landX, y: landY, size: 8, life: 0.5 });
          } else if (Math.random() < dt * 10) A.burst('drop', landX, GY, 2, { sp: 120, g: 900, life: 0.4, size: 2.6, color: '#BBD8EF' });
          if (Math.abs(landX - dog.x) < 90 && hoseCD <= 0 && !dog.air) {
            hoseCD = 2.2; hosed++; dog.jump(-560, 0); A.sfx('bark');
            A.say(pick(['the hose! my nemesis! I love it.', 'RAIN. from a SNAKE.', 'brrr! again!']), 1300);
            if (hosed <= 2) A.reward({ happiness: 1 });
          }
        }
        if (state === 'wait') {
          if (!dog.air) { dog.setPose(fill > 0.5 ? 'happy' : 'sit'); dog.face('left'); dog.tilt = fill > 0.5 ? Math.sin(T * 13) * 2.5 : 0; if (dog.x !== WAIT) dog.runTo(WAIT, 260, dt); }
        } else if (state === 'hopin') {
          dog.tilt = 0;
          if (!dog.air && dog.runTo(PX + IRX + 90, 320, dt)) { dog.face('left'); dog.ground = PY + 16 * PS; var ft = 2 * 760 / G; dog.jump(-760, (PX + 40 - dog.x) / ft); state = 'flying'; stT = 0; }
        } else if (state === 'flying') {
          if (!dog.air && stT > 0.1) {
            inPool = true; state = 'paddle'; stT = 0; padT = 0; bigSplash(dog.x, 26); A.float('SPLASH!', dog.x, PY - 200, 'pt-blue');
            A.reward({ happiness: 3 }); A.say(pick(A.line('poolIn', ['ahhh. so cool.', 'I am a duck now', 'best day of my LIFE'])), 1700);
            A.hint('Click ' + DN + ' for a big splash. Top up the pool with the hose.');
          }
        } else if (state === 'paddle') {
          padT -= dt;
          if (padT <= 0) {
            var r = Math.random();
            if (A.key === 'husky' && r < 0.3) { padPose = 'down'; padT = 2.6; }
            else if (r < 0.55) { padPose = 'walk'; padTo = PX + (Math.random() - 0.5) * 220; padT = 2.2; }
            else if (r < 0.8) { padPose = 'happy'; padT = 1.4; }
            else { padPose = 'shake'; padT = 1; A.sfx('shake'); }
          }
          if (padPose === 'walk') { if (dog.runTo(padTo, 110, dt)) dog.setPose('idle'); if (Math.random() < dt * 6) A.addPart({ type: 'drop', x: dog.x + (Math.random() - 0.5) * 120, y: waterY() - 6, vx: (Math.random() - 0.5) * 80, vy: -140, g: 700, life: 0.5, size: 2.6, color: '#BBD8EF' }); }
          else { dog.setPose(padPose); if (padPose === 'shake' && Math.random() < dt * (A.tr.fluff ? 48 : 24)) A.burst('drop', dog.x + (Math.random() - 0.5) * 100, dog.y - 90 - Math.random() * 50, 1, { sp: 300, g: 1000, life: 0.6, size: 3, color: '#9CC8EA' }); }
          dog.tilt = padPose === 'happy' ? Math.sin(T * 13) * 2.5 : 0;
          if (fill < 0.7 && !lowSaid) { lowSaid = true; A.say('the lake is leaking! hose please!', 1500); } if (fill > 0.9) lowSaid = false;
        } else if (state === 'splash') {
          if (!dog.air && stT > 0.1) {
            splashes++; bigSplash(dog.x, 32); A.float(splashes % 3 === 0 ? 'MEGA SPLOOSH!' : 'SPLOOSH!', dog.x, PY - 210, splashes % 3 === 0 ? 'pt-gold' : 'pt-blue');
            fill = Math.max(0.55, fill - 0.07); if (splashes <= 2 || splashes % 2 === 0) A.reward({ happiness: splashes <= 2 ? 2 : 1 });
            if (Math.random() < 0.5) A.say(pick(['you are wet now. sorry. (not sorry)', 'SPLASH!', 'the pool is now the lawn']), 1200);
            state = 'paddle'; stT = 0; padT = 0;
          }
        }
        if (dog.x < PX - IRX + 50 && inPool) dog.x = PX - IRX + 50;
        if (dog.x > PX + IRX - 50 && inPool) dog.x = PX + IRX - 50;
        var wv = fill > 0.02;
        water.show(wv); fwater.show(wv);
        if (wv) { var k = 0.82 + 0.18 * fill; water.set(PX, waterY(), 0, k, k); fwater.el.style.opacity = Math.min(1, fill * 2).toFixed(2); fwater.set(OX, OY + (1 - fill) * 18 * PS); }
      },
      drawFx: function (g, T) {
        var tp = tipPt(), sx = REEL.x, sy = REEL.y, ex = noz.x - tp.d * 22, ey = noz.y + 4, cx = (sx + ex) / 2, cy = Math.max(sy, ey) + 40;
        g.lineCap = 'round'; g.lineJoin = 'round';
        g.strokeStyle = INK; g.lineWidth = 15; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
        g.strokeStyle = '#86B57A'; g.lineWidth = 10; g.stroke(); g.strokeStyle = '#C8E9CF'; g.lineWidth = 2.6; g.setLineDash([10, 12]); g.stroke(); g.setLineDash([]);
        if (spray) {
          g.strokeStyle = 'rgba(156,200,234,.95)'; g.lineWidth = 7; g.beginPath(); g.moveTo(tp.x, tp.y); g.quadraticCurveTo(tp.x + tp.d * 40, tp.y + 10, landX, landY); g.stroke();
          g.strokeStyle = '#fff'; g.lineWidth = 2.2; g.setLineDash([8, 10]); g.lineDashOffset = -T * 220; g.stroke(); g.setLineDash([]);
        }
        g.save(); g.translate(noz.x, noz.y); g.scale(tp.d, 1); g.rotate(noz.ang);
        g.fillStyle = '#FFE07A'; g.strokeStyle = INK; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(-26, -9); g.lineTo(22, -8); g.lineTo(34, -12); g.lineTo(34, 12); g.lineTo(22, 8); g.lineTo(-26, 9); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#E8504A'; g.beginPath(); g.moveTo(-12, 8); g.lineTo(-4, 26); g.lineTo(6, 26); g.lineTo(2, 8); g.closePath(); g.fill(); g.stroke();
        g.restore();
        if (inPool && !dog.air) { g.strokeStyle = 'rgba(94,134,180,.75)'; g.lineWidth = 2; for (var i = 0; i < 2; i++) { var r = ((T * 34 + i * 26) % 52) + 30; g.globalAlpha = Math.max(0, 1 - r / 82); g.beginPath(); g.ellipse(dog.x, waterY() - 8, r * 1.5, r * 0.3, 0, 0, Math.PI * 2); g.stroke(); } g.globalAlpha = 1; }
      },
      focus: function () { return CP ? 660 : noz.held ? clamp((noz.x + PX) / 2, 560, 700) : inPool || state !== 'wait' ? 680 : 700; },
      cardSub: function () {
        if (!inPool) return '';
        return A.key === 'husky' ? DN + ' refuses to leave the pool. Five more minutes, then.' : DN + ' hopped out and shook off. You are a bit wet too.';
      },
      finish: function () { return { happiness: 2, energy: -1, clean: inPool ? 5 : 0, cool: inPool }; },
      dbg: function () { return { state: state, fill: fill, splashes: splashes, hosed: hosed, inPool: inPool, spray: spray, nozzle: { x: noz.x, y: noz.y }, pool: { x: PX, y: PY } }; }
    };
  };
  IMPL['Paddling Pool'].cfg = { scene: 'yard' };
  IMPL['Paddling Pool'].phone = { vw: 740, vwMin: 730, fx: 660 };

  /* ---------- Agility Tunnel ---------- */
  IMPL['Agility Tunnel'] = function (A) {
    var dog = A.dog, DN = A.DN, CP = A.compact, TL = CP ? 500 : 480, TR = CP ? 745 : 770, TY = GY - 62, NS = 8, SW = (TR - TL) / NS, SL = CP ? 385 : 330, SR = CP ? 860 : 920;
    var base = A.sprite(v24TunnelBase(), (TR - TL) + 110, 50, A.L.scene, 0.5, 0.6); base.set((TL + TR) / 2, GY + 30);
    var segs = [];
    var WK = [1.25, 0.8, 1.1, 0.7, 1.3, 0.85, 1.15, 0.85], wsum = WK.reduce(function (a, b) { return a + b; }, 0), cx0 = TL;
    for (var i = 0; i < NS; i++) { var sw = (TR - TL) * WK[i] / wsum; segs.push({ x: cx0 + sw / 2, b: 0, spr: A.sprite(v24Seg(i), sw + 10, 196, A.L.front, 0.5, 0.5) }); cx0 += sw; }
    var endL = A.sprite(v24TunnelEnd(true), 54, 204, A.L.front, 0.5, 0.5), endR = A.sprite(v24TunnelEnd(false), 54, 204, A.L.front, 0.5, 0.5);
    endL.set(TL, TY + 2); endR.set(TR, TY + 2);
    var panel = A.div('pt-panel', A.L.ui); panel.style.cssText += ';left:470px;top:92px;width:300px'; A.dockable(panel);
    var plab = A.div('pt-lab', panel, ''), pline = A.div('', panel, '');
    var state = 'wait', side = 'R', stT = 0, runs = 0, streak = 0, best = 0, last = 0, runT = 0, lastLand = -99, cleans = 0, spd = 0, dirn = -1, jig = 0, T0 = 0;
    dog.x = SR; dog.face('left'); dog.setPose('sit');
    A.say(pick(A.line('tunnelGo', ['a tunnel! I KNOW tunnels.', 'call me through it!'])), 1800);
    function showPanel() { plab.textContent = runs ? 'last run: ' + last.toFixed(2) + ' s' : 'run the tunnel!'; pline.textContent = 'best: ' + (best ? best.toFixed(2) + ' s' : 'none yet') + '  \u00b7  streak: ' + streak + ' of 3'; }
    showPanel();
    return {
      poses: ['sit', 'idle', 'walk', 'crouch', 'jump', 'happy', 'sleep'],
      dur: 50,
      hint: 'Click the far side of the tunnel to call ' + DN + ' through. Call again quickly for a clean run!',
      down: function (x, y) {
        if (dogTap(A, x, y, ['coach! hi coach!', 'pat now, zoom later'])) return;
        if (state !== 'wait') { if (state === 'run') A.float('zoom!', dog.x, GY - 220, 'pt-small'); return; }
        var to = x < (TL + TR) / 2 ? 'L' : 'R';
        if (to === side) { if (!dog.air) dog.jump(-480, 0); A.say(pick(['I am already here!', 'the tunnel is THAT way, coach']), 1100); return; }
        streak = runs && T0 - lastLand < 3.5 ? streak + 1 : 1; dirn = to === 'L' ? -1 : 1;
        spd = 520 * A.tr.run * (1 + 0.12 * Math.min(streak - 1, 3)); state = 'run'; stT = 0; runT = 0; dog.face(dirn < 0 ? 'left' : 'right');
        A.sfx('whoosh'); A.float(streak > 1 ? 'again, faster!' : 'GO!', dog.x, GY - 230, 'pt-small');
        if (Math.random() < 0.5) A.say(pick(A.line('tunnelGo', ['ZOOM!', 'here I go!', 'tunnel time!'])), 900);
        showPanel();
      },
      move: function (x, y) { A.cursor(state === 'wait' ? 'pointer' : 'default'); },
      update: function (dt, T) {
        stT += dt; T0 = T; jig = Math.max(0, jig - dt * 1.5);
        if (state === 'wait') {
          if (!dog.air) { dog.setPose(T - lastLand < 3.5 && runs ? 'happy' : 'sit'); dog.face(side === 'R' ? 'left' : 'right'); dog.tilt = T - lastLand < 3.5 && runs ? Math.sin(T * 13) * 2.5 : 0; }
        } else if (state === 'run') {
          runT += dt; dog.tilt = 0;
          dog.x += dirn * spd * dt; dog.bob += dt * spd / 26; dog.face(dirn < 0 ? 'left' : 'right');
          var head = dog.x + dirn * 80, inT = head > TL - 10 && head < TR + 10 || (dog.x > TL && dog.x < TR);
          dog.setPose(inT ? 'crouch' : 'walk', true);
          if (inT && Math.random() < dt * 10) A.burst('dust', dog.x - dirn * 60, GY, 1, { g: -20, sp: 50, life: 0.4, size: 4 });
          if ((dirn < 0 && dog.x < TL - 70) || (dirn > 0 && dog.x > TR + 70)) { dog.jump(-560, ((dirn < 0 ? SL : SR) - dog.x) / (2 * 560 / G)); state = 'leap'; jig = 1; A.burst('dust', dirn < 0 ? TL : TR, GY - 10, 6, { sp: 160, g: -10, life: 0.6, size: 6 }); }
        } else if (state === 'leap') {
          runT += dt;
          if (!dog.air) {
            runs++; last = runT; if (!best || runT < best) best = runT; side = dirn < 0 ? 'L' : 'R'; lastLand = T; state = 'wait'; stT = 0;
            dog.x = clamp(dog.x, 150, 1090);
            A.float(runT.toFixed(2) + ' s' + (runT <= best && runs > 1 ? ' best!' : ''), dog.x, GY - 240, runT <= best && runs > 1 ? 'pt-gold' : '');
            A.reward({ happiness: runs <= 6 ? 2 : 1, energy: -1 });
            if (streak >= 3) {
              cleans++; streak = 0; A.float('CLEAN RUN!', 620, 250, 'pt-gold'); A.sfx('levelup'); A.burst('spark', dog.x, GY - 120, 12, { g: 0, sp: 180, life: 0.8, size: 7 });
              A.reward({ happiness: 4, bond: cleans === 1 ? 1 : 0 }); A.say(pick(A.line('tunnelDone', ['three in a row! I am a legend.', 'clean run! where is my medal?'])), 1800);
              if (A.tr.flop) { state = 'flop'; stT = 0; }
            } else if (Math.random() < 0.5) A.say(pick(A.line('tunnelDone', ['again! again!', 'did you see me in there?', 'tunnel: conquered'])), 1200);
            if (A.tr.flop && state === 'wait' && Math.random() < 0.3) { state = 'flop'; stT = 0; }
            showPanel();
          }
        } else if (state === 'flop') {
          dog.setPose('sleep'); dog.tilt = 0;
          if (stT < 0.05) A.say('*flop*', 1200);
          if (Math.random() < dt * 1.5) A.addPart({ type: 'z', x: dog.head().x, y: dog.head().y - 10, vx: 15, vy: -35, life: 1.6, size: 6 });
          if (stT > 1.8) { state = 'wait'; stT = 0; lastLand = T; }
        }
        for (var i = 0; i < NS; i++) {
          var s = segs[i], near = (state === 'run') ? Math.max(0, 1 - Math.abs(s.x - dog.x) / 80) : 0;
          s.b += (near - s.b) * Math.min(1, dt * 14);
          var w = jig * Math.sin(T * 24 + i * 0.9) * 0.03;
          s.spr.set(s.x, TY - s.b * 6, w * 40, 1 + s.b * 0.04, 1 + s.b * 0.09 + w);
        }
      },
      drawFx: function (g, T) {
        if (state === 'run' || state === 'leap') {
          var x = (TL + TR) / 2, y = TY - 128;
          g.fillStyle = '#FFFBF3'; g.strokeStyle = INK; g.lineWidth = 2.4; g.beginPath(); g.arc(x - 52, y - 8, 15, 0, Math.PI * 2); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(x - 52, y - 8); g.lineTo(x - 52 + Math.cos(runT * 6 - 1.57) * 10, y - 8 + Math.sin(runT * 6 - 1.57) * 10); g.stroke();
          g.fillStyle = INK; g.font = '700 34px Caveat, cursive'; g.fillText(runT.toFixed(1) + ' s', x - 28, y + 2);
        } else if (state === 'wait' && !dog.air) {
          var fx = side === 'R' ? SL : SR, fy = GY - 70, p = 1 + Math.sin(T * 4) * 0.06;
          g.save(); g.translate(fx, fy); g.scale(p, p); g.strokeStyle = 'rgba(91,61,50,.55)'; g.lineWidth = 2.4; g.setLineDash([8, 7]);
          g.beginPath(); g.arc(0, 0, 46, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
          g.fillStyle = 'rgba(242,143,165,.8)'; g.beginPath(); g.ellipse(0, 8, 12, 10, 0, 0, Math.PI * 2); g.fill();
          [[-14, -8], [-5, -16], [5, -16], [14, -8]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 5, 0, Math.PI * 2); g.fill(); });
          g.fillStyle = INK; g.font = '700 26px Caveat, cursive'; g.fillText(A.isTouch() ? 'tap here' : 'click here', -42, 76);
          g.restore();
        }
      },
      focus: function () { return (TL + TR) / 2; },
      finish: function () { return { happiness: 2, energy: -3 }; },
      dbg: function () { return { state: state, side: side, runs: runs, streak: streak, cleans: cleans, best: best, last: last, runT: runT, sides: { L: SL, R: SR } }; }
    };
  };
  IMPL['Agility Tunnel'].cfg = { scene: 'yard' };
  IMPL['Agility Tunnel'].phone = { vw: 740, vwMin: 730, fx: 622 };

  /* ==================== v2.6 Halloween 2026 toys (V26.md section 6) ==================== */
  /* Motion off (the player's "Motion and wobble" switch): the games play the same, the decorative wobble, flapping and tumbling stop */
  function v26Still() { try { return document.documentElement.getAttribute('data-motion') === 'off'; } catch (e) { return false; } }
  /* v2.6 games pay through this: a reward with no happiness, bond or coins is not sent (the game toasts every reward) */
  function v26Pay(A, r) { if ((r.happiness || 0) > 0 || (r.bond || 0) > 0 || (r.coins || 0) > 0) A.reward(r); }
  /* a tap that hits nothing never fails: a kind sniff in that direction */
  function kindSniff(A, x, y, lines) {
    var now = performance.now(); A.kindN = (A.kindN || 0) + 1; if (now - (A.sniffAt || 0) < 700) return; A.sniffAt = now;
    A.sfx('sniff'); A.float(pick(['sniff?', 'sniff sniff']), x, y - 30, 'pt-small');
    if (Math.random() < 0.5) A.say(pick(lines || ['just grass there. nice grass.', 'sniff... smells like lawn.', 'nothing there. still fun.']), 1100);
  }

  /* ---------- v2.6 art (pencil, same hand as the v2.4 toys) ---------- */
  /* a lumpy felt pumpkin (matches PawArt.item): stitched seam, closed-eye smile, a leaf on the stem */
  function v26Lumpy(cx, cy, rx, ry, k, n) { var p = []; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, m = 1 + k * Math.sin(a * 4 + 0.6); p.push([cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]); } return p; }
  function v26PumpkinIn() {
    var R = rng(2601), s = '<ellipse cx="60" cy="104" rx="46" ry="5" fill="#5B3D32" opacity=".12"/>';
    s += pencil(R, [[58, 34], [57, 22], [62, 13], [70, 9]], 6.4, INK, 1) + pencil(R, [[58, 34], [57, 22], [62, 13], [70, 9]], 3.2, '#8E8A4A', 1);
    s += pencil(R, [[56, 26], [44, 16], [34, 20], [42, 28], [56, 28]], 2, INK, 1, true, '#9CCB86');
    s += pencil(R, v26Lumpy(60, 66, 50, 37, 0.06, 28), 2.8, INK, 1, true, '#F29150');
    s += pencil(R, [[46, 34], [40, 66], [46, 98]], 1.4, '#C96E2A', 0.5) + pencil(R, [[74, 34], [80, 66], [74, 98]], 1.4, '#C96E2A', 0.5);
    s += '<path d="' + wob(R, v26Lumpy(60, 66, 43, 30, 0.06, 28), 0.8, true) + '" fill="none" stroke="#5B3D32" stroke-width="1.5" stroke-dasharray="4 4" opacity=".55"/>';
    s += '<ellipse cx="38" cy="47" rx="13" ry="6" transform="rotate(-24 38 47)" fill="#fff" opacity=".42"/>';
    s += '<path d="M38 62q6-7 12 0M70 62q6-7 12 0" fill="none" stroke="#5B3D32" stroke-width="3.2" stroke-linecap="round"/>';
    s += '<path d="M47 75q13 11 26 0" fill="none" stroke="#5B3D32" stroke-width="3.2" stroke-linecap="round"/>';
    s += '<ellipse cx="33" cy="72" rx="6.5" ry="3.8" fill="#F28FA5" opacity=".6"/><ellipse cx="87" cy="72" rx="6.5" ry="3.8" fill="#F28FA5" opacity=".6"/>';
    return s;
  }
  function v26Pumpkin() { return '<svg viewBox="0 0 120 110">' + v26PumpkinIn() + '</svg>'; }
  /* the plush ghost: body (centre 50,66), a little orange bow on top, the arms are separate sprites so they can flop */
  function v26GhostIn() {
    var R = rng(2610), s = '';
    s += pencil(R, [[18, 100], [17, 70], [19, 46], [28, 26], [42, 15], [58, 15], [72, 26], [81, 46], [83, 70], [82, 100], [74, 110], [66, 101], [58, 112], [50, 102], [42, 112], [34, 101], [26, 110]], 2.6, INK, 1, true, '#FFFBF3');
    s += '<path d="' + wob(R, [[68, 30], [76, 50], [77, 78], [75, 98]], 1, false) + '" fill="none" stroke="#E0D5F0" stroke-width="7" stroke-linecap="round" opacity=".85"/>';
    s += '<ellipse cx="40" cy="50" rx="5" ry="7" fill="#5B3D32"/><ellipse cx="60" cy="50" rx="5" ry="7" fill="#5B3D32"/><circle cx="41.6" cy="47.4" r="1.8" fill="#fff"/><circle cx="61.6" cy="47.4" r="1.8" fill="#fff"/>';
    s += pencil(R, ell(50, 66, 5, 4.5, 10), 1.8, INK, 1, true, '#F28FA5');
    s += '<ellipse cx="30" cy="61" rx="5" ry="3" fill="#F9C4D0"/><ellipse cx="70" cy="61" rx="5" ry="3" fill="#F9C4D0"/>';
    s += '<path d="' + wob(R, [[22, 97], [34, 95], [50, 97], [66, 95], [78, 97]], 1, false) + '" fill="none" stroke="#C9B8E6" stroke-width="1.5" stroke-dasharray="4 4"/>';
    s += pencil(R, [[50, 16], [38, 8], [37, 22]], 1.8, INK, 1, true, '#F4A262') + pencil(R, [[50, 16], [62, 8], [63, 22]], 1.8, INK, 1, true, '#F4A262') + pencil(R, ell(50, 15, 4, 4, 8), 1.6, INK, 1, true, '#E8895A');
    return s;
  }
  function v26Ghost() { return '<svg viewBox="0 0 100 120">' + v26GhostIn() + '</svg>'; }
  function v26ArmIn() { var R = rng(2611); return pencil(R, [[2, 7], [18, 5], [32, 6], [40, 10], [41, 16], [35, 20], [18, 20], [2, 19]], 2.2, INK, 1, true, '#FFFBF3') + '<path d="M30 9q5 4 0 9" fill="none" stroke="#E0D5F0" stroke-width="2.4"/>'; }
  function v26GhostArm() { return '<svg viewBox="0 0 44 26">' + v26ArmIn() + '</svg>'; }
  /* the Bat-Wing Flyer: a soft orange felt disc with bat ears and two scalloped felt wings. up: 1 wings up, 0 wings down, 2 level (motion off) */
  function v26Flyer(up) {
    var R = rng(2620 + up), s = '<ellipse cx="70" cy="80" rx="26" ry="3" fill="#5B3D32" opacity=".08"/>', ang = up === 2 ? -0.12 : up ? -0.62 : 0.42;
    var W0 = [[0, -6], [14, -15], [32, -18], [50, -14], [46, -1], [39, -5], [33, 7], [26, 2], [19, 11], [11, 5], [2, 9]];
    function wing(m) {
      var c = Math.cos(ang), sn = Math.sin(ang), P = W0.map(function (p) { var x = p[0] * c - p[1] * sn, y = p[0] * sn + p[1] * c; return [m ? 140 - (88 + x) : 88 + x, 42 + y]; });
      var bone = function (a, b) { var q = [a, b].map(function (p) { var x = p[0] * c - p[1] * sn, y = p[0] * sn + p[1] * c; return [m ? 140 - (88 + x) : 88 + x, 42 + y]; }); return pencil(R, q, 1.4, '#8E8696', 0.9); };
      return pencil(R, P, 2.2, INK, 1, true, '#4A3F4F') + bone([4, -4], [46, -12]) + bone([5, -1], [33, 4]) + bone([5, 1], [19, 9]);
    }
    s += wing(false) + wing(true);
    s += pencil(R, [[57, 30], [54, 15], [65, 26]], 1.8, INK, 1, true, '#4A3F4F') + pencil(R, [[83, 30], [86, 15], [75, 26]], 1.8, INK, 1, true, '#4A3F4F');
    s += pencil(R, ell(70, 44, 24, 20, 18), 2.6, INK, 1, true, '#F4A262');
    s += '<ellipse cx="70" cy="44" rx="18" ry="14.5" fill="none" stroke="#FFE3A1" stroke-width="1.5" stroke-dasharray="3.5 3.5"/>';
    s += '<circle cx="63" cy="41" r="3.3" fill="#5B3D32"/><circle cx="77" cy="41" r="3.3" fill="#5B3D32"/><circle cx="64.2" cy="39.8" r="1.1" fill="#fff"/><circle cx="78.2" cy="39.8" r="1.1" fill="#fff"/>';
    s += '<path d="M64 49q6 5 12 0" fill="none" stroke="#5B3D32" stroke-width="2" stroke-linecap="round"/><ellipse cx="57" cy="48" rx="3.6" ry="2.2" fill="#F28FA5" opacity=".6"/><ellipse cx="83" cy="48" rx="3.6" ry="2.2" fill="#F28FA5" opacity=".6"/>';
    return '<svg viewBox="0 0 140 84">' + s + '</svg>';
  }
  /* the round jack-o-lantern treat bucket (matches PawArt.item): lavender handle, happy face, treats peeking out. No shadow: the game draws a flat one */
  function v26Bucket() {
    var R = rng(2630), s = '', hd = [[20, 54], [16, 30], [34, 10], [65, 5], [96, 10], [114, 30], [110, 54]];
    s += pencil(R, hd, 6.4, INK, 1) + pencil(R, hd, 3.2, '#C9B8E6', 1);
    s += pencil(R, v26Lumpy(65, 80, 52, 43, 0.035, 30), 2.8, INK, 1, true, '#F29150');
    s += pencil(R, [[46, 42], [36, 80], [46, 120]], 1.5, '#C96E2A', 0.55) + pencil(R, [[84, 42], [94, 80], [84, 120]], 1.5, '#C96E2A', 0.55);
    s += pencil(R, ell(65, 44, 36, 10, 20), 2.4, INK, 1, true, '#E7AD74') + pencil(R, ell(65, 45, 28, 6.5, 18), 1.6, INK, 1, true, '#5E463D');
    s += pencil(R, ell(56, 41, 6, 4.5, 10), 1.4, INK, 1, true, '#A8682F') + pencil(R, ell(73, 40, 6, 4.5, 10), 1.4, INK, 1, true, '#A8682F') + '<circle cx="54.5" cy="39.5" r="1.4" fill="#E7AD74"/><circle cx="71.5" cy="38.5" r="1.4" fill="#E7AD74"/>';
    s += pencil(R, [[41, 77], [48, 66], [55, 77]], 1.8, INK, 1, true, '#5E463D') + pencil(R, [[75, 77], [82, 66], [89, 77]], 1.8, INK, 1, true, '#5E463D');
    s += pencil(R, [[38, 86], [52, 89], [65, 90], [78, 89], [92, 86], [88, 98], [78, 107], [65, 110], [52, 107], [42, 98]], 2.2, INK, 1, true, '#7A4A33');
    s += pencil(R, [[48, 100], [65, 104], [82, 100]], 1.6, '#A8682F', 0.6);
    s += '<ellipse cx="30" cy="68" rx="6" ry="13" transform="rotate(18 30 68)" fill="#fff" opacity=".35"/>';
    return '<svg viewBox="0 0 130 130">' + s + '</svg>';
  }
  /* four little lidded pots, each with a sticker: pumpkin, ghost, moon, bat */
  var POTC = [['#FFF4DF', '#F3E3CC'], ['#E0D5F0', '#C9B8E6'], ['#C8E9CF', '#A9D6A0'], ['#FCD8BC', '#F4B996']];
  function v26Pot(i) {
    var R = rng(2640 + i), c = POTC[i % 4], s = '<ellipse cx="40" cy="70" rx="30" ry="4" fill="#5B3D32" opacity=".12"/>';
    s += pencil(R, [[12, 26], [68, 26], [72, 44], [66, 62], [56, 70], [24, 70], [14, 62], [8, 44]], 2.4, INK, 1, true, c[0]);
    s += pencil(R, [[10, 35], [70, 35]], 1.6, INK, 0.45);
    s += pencil(R, ell(40, 26, 30, 7, 18), 2.2, INK, 1, true, '#5E463D');
    if (i % 4 === 0) s += pencil(R, ell(40, 52, 9, 8, 12), 1.6, INK, 1, true, '#F4A262') + '<path d="M40 44v-4" stroke="#6E8F5A" stroke-width="2.4" stroke-linecap="round"/>';
    else if (i % 4 === 1) s += pencil(R, [[33, 62], [33, 49], [36, 43], [44, 43], [47, 49], [47, 62], [43.5, 59], [40, 63], [36.5, 59]], 1.6, INK, 1, true, '#FFFBF3') + '<circle cx="37.6" cy="50" r="1.4" fill="#5B3D32"/><circle cx="42.4" cy="50" r="1.4" fill="#5B3D32"/>';
    else if (i % 4 === 2) s += '<path d="M44 43a10 10 0 1 0 2 18a8 8 0 1 1-2-18z" fill="#FFE07A" stroke="#5B3D32" stroke-width="1.6"/>';
    else s += pencil(R, [[28, 52], [34, 46], [37, 50], [40, 47], [43, 50], [46, 46], [52, 52], [46, 54], [40, 58], [34, 54]], 1.4, INK, 1, true, '#4A3F4F');
    return '<svg viewBox="0 0 80 76">' + s + '</svg>';
  }
  function v26Lid(i) {
    var R = rng(2650 + i), c = POTC[i % 4];
    return '<svg viewBox="0 0 80 34">' + pencil(R, ell(40, 24, 32, 8, 18), 2.4, INK, 1, true, c[1]) + pencil(R, [[14, 22], [24, 17], [40, 15], [56, 17], [66, 22]], 1.6, INK, 0.45) + pencil(R, ell(40, 13, 7, 6, 10), 2, INK, 1, true, '#FFE07A') + '</svg>';
  }
  function v26Treat() { var R = rng(2660); return '<svg viewBox="0 0 50 30">' + pencil(R, [[12, 10], [7, 5], [3, 10], [7, 15], [3, 20], [7, 25], [12, 20], [38, 20], [43, 25], [47, 20], [43, 15], [47, 10], [43, 5], [38, 10]], 2, INK, 1, true, '#E8B36A') + '<circle cx="20" cy="15" r="1.4" fill="#C98B4E"/><circle cx="30" cy="14" r="1.4" fill="#C98B4E"/></svg>'; }
  /* fallback item icons (until PawArt.item draws them): the in-game art, framed for the 64 px icon */
  function v26Icon(name) {
    if (name === 'Squeaky Pumpkin') return '<svg viewBox="-4 -2 128 116">' + v26PumpkinIn() + '</svg>';
    if (name === 'Plush Ghost') return '<svg viewBox="-24 2 148 118"><g transform="translate(22 66) rotate(150) scale(1 -1)">' + v26ArmIn() + '</g><g transform="translate(78 66) rotate(30)">' + v26ArmIn() + '</g>' + v26GhostIn() + '</svg>';
    if (name === 'Bat-Wing Flyer') return v26Flyer(1).replace('viewBox="0 0 140 84"', 'viewBox="0 -18 140 112"');
    return v26Bucket();
  }

  /* ---------- Squeaky Pumpkin ---------- */
  IMPL['Squeaky Pumpkin'] = function (A) {
    var dog = A.dog, DN = A.DN, CP = A.compact, still = v26Still(), LO = CP ? 300 : 240, HI = CP ? 880 : 1000;
    var pk = { x: CP ? 430 : 420, h: 0, vh: 0, vx: 0, air: false, slide: 0, sq: 0, wob: 0, hopT: 1.4 };
    var spr = A.sprite(v26Pumpkin(), 136, 125, A.L.actors, 0.5, 104 / 110);
    var state = 'ready', stT = 0, pounces = 0, squeaks = 0, big = 0, hops = 0, escaped = false, tip = A.tip('click the pumpkin!', pk.x - 90, GY - 200);
    dog.x = CP ? 740 : 840; dog.face('left'); dog.setPose('sit');
    A.say(pick(['a pumpkin that SQUEAKS?', 'it is smiling at me. I like it.']), 1800);
    function pkY() { return GY + 4 - pk.h; }
    function onPk(x, y) { return dist(x, y, pk.x, pkY() - 52) < A.hitR(84); }
    function hop(tx, k) {
      tx = clamp(tx, LO, HI); hops++;
      if (still) { pk.vx = (tx - pk.x) / 0.45; pk.slide = 0.45; return; }
      pk.air = true; pk.vh = 430 * (k || 1); pk.vx = (tx - pk.x) / (2 * pk.vh / 2000);
      A.burst('dust', pk.x, GY, 3, { g: -20, sp: 60, life: 0.5, size: 4 });
    }
    function away(d) { var s = pk.x < dog.x ? -1 : 1; if ((s < 0 && pk.x - d < LO + 40) || (s > 0 && pk.x + d > HI - 40)) s = -s; return pk.x + s * d; }
    return {
      poses: ['sit', 'idle', 'walk', 'happy', 'bow', 'jump', 'sniff'],
      dur: 45,
      hint: 'Click the pumpkin and ' + DN + ' pounces on it. Every pounce gets a squeak!',
      down: function (x, y) {
        if (onPk(x, y)) {
          if (tip) { tip.hide(); tip = null; }
          if (state === 'ready' || (state === 'proud' && escaped && stT > 0.8)) { state = 'stalk'; stT = 0; dog.tilt = 0; A.sfx('click'); if (Math.random() < 0.5) A.say(pick(['ooh. OOH.', 'wiggle wiggle...', 'I see you, pumpkin']), 900); }
          return;
        }
        if (!dogTap(A, x, y, ['the pumpkin! over there!', 'hi! pounce time?'])) kindSniff(A, x, y, ['no pumpkin there. sniff.', 'just grass. the pumpkin is hiding.']);
      },
      move: function (x, y) { A.cursor(onPk(x, y) ? 'pointer' : 'default'); },
      update: function (dt, T) {
        stT += dt;
        if (pk.air) { pk.h += pk.vh * dt; pk.vh -= 2000 * dt; pk.x += pk.vx * dt; if (pk.h <= 0) { pk.h = 0; pk.air = false; pk.vx = 0; pk.sq = Math.max(pk.sq, 0.45); A.sfx('land'); } }
        if (pk.slide > 0) { pk.slide -= dt; pk.x = clamp(pk.x + pk.vx * dt, LO, HI); if (pk.slide <= 0) pk.vx = 0; }
        pk.sq = Math.max(0, pk.sq - dt * 2.6); pk.wob = Math.max(0, pk.wob - dt * 1.3);
        var side = dog.x >= pk.x ? 1 : -1, calm = state === 'ready' || state === 'proud';
        if (calm && !still && !pk.air) {
          pk.hopT -= dt;
          if (pk.hopT <= 0) { pk.hopT = 1.3 + Math.random() * 1.3; var tx = pk.x + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 90); if (Math.abs(tx - dog.x) < 190) tx = away(110); hop(tx); }
        }
        if (state === 'ready') {
          if (!dog.air) { dog.setPose('sit'); dog.face(side > 0 ? 'left' : 'right'); dog.tilt = still ? 0 : Math.sin(T * 2.2) * 5; }
          if (Math.abs(dog.x - pk.x) < 150 && !pk.air && pk.slide <= 0) hop(away(200), 1.1);
        } else if (state === 'stalk') {
          dog.tilt = 0;
          var far = Math.abs(dog.x - pk.x), reach = CP ? 290 : 330;
          if (far > reach) dog.runTo(pk.x + side * (reach - 20), 260 * A.tr.run, dt);
          else { dog.face(side > 0 ? 'left' : 'right'); state = 'wind'; stT = 0; }
        } else if (state === 'wind') {
          dog.setPose('bow'); dog.face(side > 0 ? 'left' : 'right'); dog.tilt = still ? 0 : Math.sin(T * 26) * 4;
          if (stT > 0.45 && !pk.air && pk.slide <= 0) {
            dog.tilt = 0; var land = pk.x + side * (dog.mouthOff('idle') + 12), vy = -640, ft = 2 * 640 / G;
            dog.jump(vy, clamp((land - dog.x) / ft, -760, 760)); state = 'pounce'; stT = 0;
          }
        } else if (state === 'pounce') {
          if (!dog.air && stT > 0.1) {
            pounces++; squeaks++; state = 'proud'; stT = 0; escaped = false; dog.squash(0.8);
            pk.sq = 1; pk.wob = 1; A.sfx('squeak');
            A.burst('note', pk.x + 20, pkY() - 90, 2, { a0: -Math.PI * 0.8, spread: 0.6, g: -30, sp: 90, life: 0.9, size: 8 });
            if (pounces % 4 === 0) { big++; A.float('SUPER SQUEAK!', pk.x, pkY() - 160, 'pt-gold'); v26Pay(A, { happiness: 1, coins: big <= 2 ? 1 : 0 }); A.burst('heart', dog.head().x, dog.head().y, 6, { g: -50, sp: 110, life: 1.3, size: 9 }); }
            else { A.float(pick(['squeak!', 'SQUEAK!', 'squeeeak!']), pk.x, pkY() - 150, 'pt-small'); if (pounces <= 6 || pounces % 3 === 0) v26Pay(A, { happiness: 1 }); }
            if (Math.random() < 0.6) A.say(pick(A.line('hogAnswer', ['got it! it squeaked!', 'squeak? SQUEAK!', 'pumpkin caught. pumpkin released.'])), 1100);
          }
        } else if (state === 'proud') {
          if (!dog.air) { dog.setPose('happy'); if (!still) wiggle(dog, T, 3); }
          if (stT > 0.55 && !escaped) { escaped = true; hop(away(170 + Math.random() * 90), 1.3); }
          if (stT > 1.3) { dog.tilt = 0; state = 'ready'; stT = 0; }
        }
        var rot = still ? 0 : (pk.air ? pk.vx * 0.012 : 0) + Math.sin(T * 26) * pk.wob * 13;
        spr.set(pk.x, pkY(), rot, still ? 1 : 1 + pk.sq * 0.18, still ? 1 : 1 - pk.sq * 0.26);
      },
      drawFx: function (g) { if (pk.air) A.shadow(g, pk.x, GY + 8, pk.h, 46); },
      focus: function () { return (pk.x + dog.x) / 2; },
      finish: function () { return { happiness: 2, energy: -1 }; },
      dbg: function () { return { state: state, pounces: pounces, squeaks: squeaks, big: big, hops: hops, still: still, pk: { x: pk.x, y: pkY() - 52, air: pk.air } }; }
    };
  };
  IMPL['Squeaky Pumpkin'].cfg = { scene: 'yard' };
  IMPL['Squeaky Pumpkin'].phone = { vw: 720, vwMin: 700 };

  /* ---------- Plush Ghost ---------- */
  IMPL['Plush Ghost'] = function (A) {
    var dog = A.dog, DN = A.DN, CP = A.compact, still = v26Still(), HOME = CP ? 620 : 720, LO = CP ? 290 : 190, HI = CP ? 900 : 1070, GS = 0.86, TOP = 51 * GS, LIE = GY - 24;
    var aL = A.sprite(v26GhostArm(), 44 * GS, 26 * GS, A.L.actors, 4 / 44, 0.5), aR = A.sprite(v26GhostArm(), 44 * GS, 26 * GS, A.L.actors, 4 / 44, 0.5);
    var body = A.sprite(v26Ghost(), 100 * GS, 120 * GS, A.L.actors, 0.5, 0.55);
    var gh = { x: CP ? 430 : 450, y: LIE, rot: -78, prev: -78, py: LIE, vy: 0, aL: 38, aR: 38, vL: 0, vR: 0, carried: false, fly: null, sq: 0 };
    var state = 'trot', stT = 0, tosses = 0, returns = 0, shakes = 0, tip = null, tipped = false;
    dog.x = HOME; dog.face('left'); dog.setPose('idle');
    A.say(pick(['a ghost! a SOFT ghost!', 'boo? BOO! (friendly)']), 1700);
    function hang(dt) {
      var tgt = state === 'shake' ? dog.dir() * 10 + (still ? 0 : Math.sin(stT * 17) * 34) : dog.dir() * 12 + (still ? 0 : Math.sin(stT * 2.4) * 4);
      gh.rot += (tgt - gh.rot) * Math.min(1, dt * (state === 'shake' ? 30 : 10));
      var m = dog.mouth(), r = gh.rot * Math.PI / 180;
      gh.x = m.x - TOP * Math.sin(r); gh.y = Math.min(m.y + 4 + TOP * Math.cos(r), GY + 2 - 54 * GS);
    }
    function onDog(x, y) { var h = dog.head(); return Math.abs(x - dog.x) < A.hitR(110) && y > h.y - 60 && y < dog.y + 20; }
    function toss(x) {
      var tx = clamp(x, LO, HI);
      if (Math.abs(tx - dog.x) < 170) { tx = dog.x + (tx >= dog.x ? 1 : -1) * 220; if (tx > HI || tx < LO) tx = dog.x - (tx - dog.x); tx = clamp(tx, LO, HI); }
      dog.face(tx > dog.x ? 'right' : 'left'); state = 'toss'; stT = 0; gh.fly = { x1: tx };
    }
    function flop(dt) {
      if (still) { gh.aL = gh.aR = 38; return; }
      var dr = clamp((gh.rot - gh.prev) / Math.max(dt, 0.001), -900, 900), lift = clamp(gh.vy * 0.07, -45, 70); gh.prev = gh.rot;
      var tR = 38 - lift - dr * 0.06, tL = 38 - lift + dr * 0.06;
      gh.vR += ((tR - gh.aR) * 70 - gh.vR * 5) * dt; gh.vL += ((tL - gh.aL) * 70 - gh.vL * 5) * dt;
      gh.aR = clamp(gh.aR + gh.vR * dt, -70, 115); gh.aL = clamp(gh.aL + gh.vL * dt, -70, 115);
    }
    return {
      poses: ['idle', 'walk', 'eat', 'happy', 'sit', 'jump'],
      dur: 45,
      hint: DN + ' shakes the ghost. Click the lawn to toss it, and ' + DN + ' brings it back.',
      down: function (x, y) {
        if (state === 'hold' && !onDog(x, y)) { if (tip) { tip.hide(); tip = null; } toss(x); return; }
        if (dogTap(A, x, y, ['grrr! (a happy grrr)', 'this ghost is MINE. hi!'])) return;
        kindSniff(A, x, y, ['wait, I am getting it!', 'one ghost at a time', 'sniff... ghost smell. over there.']);
      },
      move: function (x, y) { A.cursor(state === 'hold' && !onDog(x, y) && y > 300 ? 'pointer' : 'default'); },
      update: function (dt, T) {
        stT += dt; gh.sq = Math.max(0, gh.sq - dt * 3);
        if (state === 'trot') {
          var side = dog.x >= gh.x ? 1 : -1;
          if (gh.fly && gh.fly.t != null) { dog.runTo(gh.fly.x1 + side * dog.mouthOff('eat'), 300 * A.tr.run, dt); }
          else if (dog.runTo(gh.x + side * dog.mouthOff('eat'), 330 * A.tr.run, dt)) { dog.face(side > 0 ? 'left' : 'right'); state = 'pick'; stT = 0; A.sfx('pop'); }
        } else if (state === 'pick') {
          dog.setPose('eat');
          if (stT > 0.28) { gh.carried = true; state = 'bring'; stT = 0; dog.setPose('idle'); }
        } else if (state === 'bring') {
          if (dog.runTo(HOME, 300 * A.tr.run * A.tr.carry, dt)) { if (tosses) returns++; dog.face('left'); dog.setPose('idle'); state = 'shake'; stT = 0; A.sfx('shake'); A.say(pick(['shake shake SHAKE!', 'grrr! (soft grrr)', 'take THAT, ghost. (gently)']), 1100); }
        } else if (state === 'shake') {
          dog.setPose('idle'); dog.tilt = still ? 0 : Math.sin(stT * 17) * 7;
          if (stT > 1.3) {
            dog.tilt = 0; shakes++;
            if (returns) {
              A.float(pick(['good fetch!', 'ghost returned!', 'boo-tiful!']), dog.x, dog.y - 230, returns % 3 === 0 ? 'pt-gold' : '');
              v26Pay(A, { happiness: returns % 2 ? 1 : 2, bond: returns === 2 ? 1 : 0, coins: returns % 3 === 0 ? 1 : 0, energy: returns % 2 ? -1 : 0 });
            } else v26Pay(A, { happiness: 1 });
            state = 'hold'; stT = 0;
            if (!tipped) { tipped = true; tip = A.tip('click to toss!', CP ? 330 : 300, GY - 120); }
          }
        } else if (state === 'hold') {
          dog.setPose('idle'); dog.tilt = still ? 0 : Math.sin(T * 9) * 1.2;
          if (stT > 7) { stT = 0; A.say(pick(['toss it! toss the ghost!', 'I am holding it. for you.', 'click somewhere! I will fetch!']), 1400); }
        } else if (state === 'toss') {
          dog.setPose('idle'); dog.tilt = dog.dir() * -9 * Math.min(1, stT / 0.18);
          if (stT > 0.22) {
            dog.tilt = 0; gh.carried = false; tosses++;
            var f = gh.fly; f.x0 = gh.x; f.y0 = gh.y; f.t = 0; f.dur = 0.75 + Math.abs(f.x1 - gh.x) / 900; f.H = 130 + Math.random() * 40; f.r0 = gh.rot; f.r1 = (f.x1 > gh.x ? 78 : -78); f.ph = Math.random() * 6;
            A.sfx('whoosh'); if (Math.random() < 0.5) A.say(pick(['wheee! fly, ghost!', 'boo! (it flew)', 'I will get it!']), 900);
            state = 'trot'; stT = 0;
          }
        }
        if (gh.fly && gh.fly.t != null) {
          var fl = gh.fly; fl.t += dt; var u = clamp(fl.t / fl.dur, 0, 1);
          gh.x = lerp(fl.x0, fl.x1, u); gh.y = lerp(fl.y0, LIE, u) - fl.H * 4 * u * (1 - u) + (still ? 0 : Math.sin(fl.t * 8 + fl.ph) * 7 * (1 - u));
          gh.rot = lerp(fl.r0, fl.r1, u) + (still ? 0 : Math.sin(fl.t * 6) * 10 * (1 - u));
          if (u >= 1) { gh.x = fl.x1; gh.y = LIE; gh.rot = fl.r1; gh.fly = null; gh.sq = 1; A.sfx('land'); A.burst('dust', gh.x, GY, 3, { g: -20, sp: 60, life: 0.5, size: 4 }); }
        } else if (gh.carried) hang(dt);
        gh.vy = (gh.y - gh.py) / Math.max(dt, 0.001); gh.py = gh.y; flop(dt);
        var r = gh.rot * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), sl = !gh.carried && !gh.fly ? 1 + gh.sq * 0.12 : 1;
        body.set(gh.x, gh.y, gh.rot, sl, 2 - sl);
        aR.set(gh.x + (30 * c - 4 * sn) * GS, gh.y + (30 * sn + 4 * c) * GS, gh.rot + gh.aR);
        aL.set(gh.x + (-30 * c - 4 * sn) * GS, gh.y + (-30 * sn + 4 * c) * GS, gh.rot - gh.aL, -1, 1);
      },
      drawFx: function (g) { if (gh.fly && gh.fly.t != null) A.shadow(g, gh.x, GY + 6, LIE - gh.y, 30); },
      focus: function () { return (gh.x + dog.x) / 2; },
      finish: function () { return { happiness: 2, energy: -1 }; },
      dbg: function () { return { state: state, tosses: tosses, returns: returns, shakes: shakes, still: still, flying: !!(gh.fly && gh.fly.t != null), carried: gh.carried, ghost: { x: gh.x, y: gh.y, arms: [gh.aL, gh.aR] }, home: HOME }; }
    };
  };
  IMPL['Plush Ghost'].cfg = { scene: 'yard' };
  IMPL['Plush Ghost'].phone = { vw: 720, vwMin: 700 };

  /* ---------- Bat-Wing Flyer ---------- */
  IMPL['Bat-Wing Flyer'] = function (A) {
    var dog = A.dog, DN = A.DN, CP = A.compact, still = v26Still(), HX = CP ? 300 : 200, HY = GY - 150, WAIT = CP ? 560 : 650, FS = 1.02;
    var frames = still ? [A.sprite(v26Flyer(2), 140 * FS, 84 * FS)] : [A.sprite(v26Flyer(1), 140 * FS, 84 * FS), A.sprite(v26Flyer(0), 140 * FS, 84 * FS)];
    var fl = { x: HX + 12, y: HY - 26, st: 'hand', t: 0, dur: 2.4, x0: 0, y0: 0, x1: 0, H: 250, rot: 0, ph: 0 };
    var state = 'wait', stT = 0, throws = 0, catches = 0, sky = 0, ground = 0, early = 0, leapU = 0, snapped = false, lastFi = -1, tip = A.tip('click to throw!', HX - 50, HY - 130);
    dog.x = WAIT; dog.face('left'); dog.setPose('sit');
    A.say(pick(['bat wings?! it can FLY?', 'throw it! I will jump SO high']), 1800);
    function flyAt(u) { u = clamp(u, 0, 1); return { x: lerp(fl.x0, fl.x1, u), y: lerp(fl.y0, GY - 18, u) - fl.H * 4 * u * (1 - u) + (still ? 0 : Math.sin(u * 13 + fl.ph) * 9 * (1 - u)) }; }
    function U() { return fl.t / fl.dur; }
    function inWindow() { return fl.st === 'fly' && U() >= 0.46 && U() <= 0.97; }
    function launch() {
      if (tip) { tip.hide(); tip = null; }
      fl.x0 = fl.x; fl.y0 = fl.y; fl.x1 = CP ? 610 + Math.random() * 240 : 730 + Math.random() * 320; fl.dur = 2.3 + Math.random() * 0.4; fl.H = 175 + Math.random() * 50; fl.t = 0; fl.ph = Math.random() * 6; fl.st = 'fly';
      throws++; A.sfx('whoosh'); state = 'run'; stT = 0; snapped = false; dog.tilt = 0;
      A.hint('Click again while the flyer glows and ' + DN + ' leaps for it!');
    }
    function leap() {
      var u = U(), tUp = 0.4, p = flyAt(u), rise = 40, vy = -400;
      for (var k = 0; k < 2; k++) { p = flyAt(u + tUp / fl.dur); rise = clamp((dog.y - 108 * DS) - p.y + 8, 40, A.key === 'chihuahua' ? 260 : 430); vy = -Math.sqrt(2 * G * rise); tUp = -vy / G; }
      dog.face(p.x < dog.x ? 'left' : 'right');
      dog.jump(vy, clamp((p.x - dog.x - dog.dir() * dog.mouthOff('jump')) / Math.max(0.2, tUp), -640, 640));
      state = 'leap'; stT = 0; leapU = u; snapped = false;
    }
    function caught(air) {
      fl.st = 'carried'; state = 'return'; stT = 0; A.sfx('pop');
      if (air) {
        catches++; var h = GY - fl.y;
        if (h > 230) { sky++; A.float('SKY LEAP!', fl.x, fl.y - 50, 'pt-gold'); v26Pay(A, { happiness: catches <= 6 ? 2 : catches % 2, coins: sky <= 2 ? 1 : 0, energy: -1 }); A.say(pick(['I touched the moon!', 'did you SEE that?']), 1500); }
        else { A.float(pick(['great leap!', 'caught it!', 'bat catch!']), fl.x, fl.y - 50); v26Pay(A, { happiness: catches <= 6 ? 2 : catches % 2, energy: -1 }); A.say(pick(['flap flap GOT IT', 'air dog!', 'the bat is mine']), 1400); }
        A.burst('heart', dog.head().x, dog.head().y, 4, { g: -50, sp: 100, life: 1.2, size: 8 });
      } else { ground++; v26Pay(A, { happiness: 1 }); A.say(pick(['got it on the ground. still counts.', 'it landed. I forgive it.']), 1400); }
    }
    return {
      poses: ['sit', 'idle', 'walk', 'jump', 'happy', 'eat'],
      dur: 45,
      hint: 'Click to throw the flyer. Click again while it glows and ' + DN + ' leaps for it!',
      down: function (x, y) {
        if (fl.st === 'hand') { if (!dogTap(A, x, y, ['throw it! throw it!'])) launch(); return; }
        if (inWindow() && !dog.air && state === 'run') { leap(); return; }
        if (fl.st === 'fly' && U() < 0.46) { early++; A.float('not yet...', dog.x, dog.y - 240, 'pt-blue pt-small'); A.sfx('sniff'); if (Math.random() < 0.5) A.say(pick(['sniff sniff... wait for it', 'not yet! it is still going up']), 900); return; }
        if (!dogTap(A, x, y, ['flyer first, pats later!', 'hi! did you see me jump?'])) kindSniff(A, x, y, ['the flyer is over there!', 'sniff... bat smell. over there.']);
      },
      move: function (x, y) { A.cursor(fl.st === 'hand' || inWindow() ? 'pointer' : 'default'); },
      update: function (dt, T) {
        stT += dt;
        if (fl.st === 'fly') {
          fl.t += dt; var p = flyAt(U()); fl.x = p.x; fl.y = p.y; fl.rot = still ? 0 : Math.sin(fl.t * 5) * 8;
          if (U() >= 1) { fl.st = 'ground'; fl.y = GY - 18; fl.rot = 0; A.sfx('land'); A.burst('dust', fl.x, GY, 3, { g: -20, sp: 60, life: 0.5, size: 4 }); if (state === 'run') { state = 'fetch'; stT = 0; } }
        }
        if (state === 'wait') {
          if (!dog.air) { dog.setPose('sit'); dog.face('left'); dog.tilt = still ? 0 : Math.sin(T * 2) * 3; }
        } else if (state === 'run') {
          if (fl.st !== 'fly') { state = 'fetch'; stT = 0; }
          else {
            var tx = clamp(flyAt(0.74).x + dog.mouthOff('jump'), 160, W - 140), sp = Math.max(300, Math.abs(tx - dog.x) / Math.max(0.3, fl.dur * 0.44 - fl.t)) * A.tr.run;
            if (dog.runTo(tx, sp, dt)) { dog.face(fl.x < dog.x ? 'left' : 'right'); dog.setPose(inWindow() ? 'idle' : 'sit'); }
          }
        } else if (state === 'leap') {
          if (dog.air && fl.st === 'fly') {
            var m = dog.mouth(), d = dist(m.x, m.y, fl.x, fl.y);
            if (d < 72) caught(true);
            else if (dog.vy >= 0 && !snapped) { snapped = true; if (d < 200) caught(true); }
          } else if (!dog.air) { state = fl.st === 'fly' ? 'run' : 'fetch'; stT = 0; }
        } else if (state === 'fetch') {
          var s2 = dog.x >= fl.x ? 1 : -1;
          if (dog.runTo(fl.x + s2 * dog.mouthOff('eat'), 340 * A.tr.run, dt)) { dog.face(s2 > 0 ? 'left' : 'right'); state = 'pick'; stT = 0; }
        } else if (state === 'pick') {
          dog.setPose('eat'); if (stT > 0.28) { caught(false); dog.setPose('idle'); }
        } else if (state === 'return') {
          if (!dog.air) { var gx = HX + 44 + dog.mouthOff('walk'); if (dog.runTo(gx, 330 * A.tr.run * A.tr.carry, dt)) { dog.face('left'); state = 'give'; stT = 0; } }
        } else if (state === 'give') {
          dog.setPose('sit');
          if (stT > 0.4) { fl.st = 'hand'; fl.x = HX + 12; fl.y = HY - 26; fl.rot = 0; A.sfx('pop'); state = 'back'; stT = 0; if (throws === 1) A.hint('Click to throw the flyer. Click again while it glows and ' + DN + ' leaps for it!'); }
        } else if (state === 'back') {
          dog.setPose('happy'); if (stT > 0.6 && dog.runTo(WAIT, 260, dt)) { dog.face('left'); state = 'wait'; stT = 0; }
        }
        if (fl.st === 'carried') { var mm = dog.mouth(); fl.x = mm.x + dog.dir() * 8; fl.y = mm.y + 4; fl.rot = -dog.dir() * 10; }
        var fi = frames.length > 1 ? (fl.st === 'fly' ? Math.floor(T * 9) % 2 : fl.st === 'ground' ? 1 : 0) : 0;
        if (fi !== lastFi) { for (var i = 0; i < frames.length; i++) frames[i].show(i === fi); lastFi = fi; }
        frames[fi].set(fl.x, fl.y, fl.rot);
      },
      drawFx: function (g, T) {
        g.save(); g.fillStyle = '#F9D0D9'; g.strokeStyle = INK; g.lineWidth = 2.4; g.lineJoin = 'round'; g.beginPath(); g.moveTo(HX - 66, HY - 20); g.lineTo(HX - 460, HY - 30); g.lineTo(HX - 460, HY + 26); g.lineTo(HX - 66, HY + 24); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(91,61,50,.3)'; g.lineWidth = 1.4; for (var k = 1; k < 5; k++) { g.beginPath(); g.moveTo(HX - 66 - k * 70, HY - 20 - k * 2); g.lineTo(HX - 66 - k * 70 - 8, HY + 24); g.stroke(); } g.restore();
        drawHand(g, HX - 6, HY, 1);
        if (fl.st === 'fly') A.shadow(g, fl.x, GY + 6, GY - fl.y, 32);
        if (inWindow() && state === 'run') {
          var pr = still ? 0 : Math.sin(T * 8) * 4;
          g.save(); g.strokeStyle = 'rgba(242,199,68,.9)'; g.lineWidth = 4; g.setLineDash([9, 7]); g.beginPath(); g.arc(fl.x, fl.y, 62 + pr, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
          g.fillStyle = INK; g.font = '700 28px Caveat, cursive'; g.textAlign = 'center'; g.fillText(A.isTouch() ? 'tap now!' : 'click now!', fl.x, fl.y < 230 ? fl.y + 98 : fl.y - 76); g.restore();
        }
      },
      focus: function () { return (Math.min(fl.x, dog.x - 100) + Math.max(fl.x, dog.x + 100)) / 2; },
      finish: function () { return { happiness: 2, energy: -3 }; },
      dbg: function () { return { state: state, still: still, fl: { st: fl.st, x: fl.x, y: fl.y, u: fl.st === 'fly' ? U() : null }, window: inWindow(), throws: throws, catches: catches, sky: sky, ground: ground, early: early }; }
    };
  };
  IMPL['Bat-Wing Flyer'].cfg = { scene: 'yard' };
  IMPL['Bat-Wing Flyer'].phone = { vw: 720, vwMin: 700 };

  /* ---------- Trick-or-Treat Bucket ---------- */
  IMPL['Trick-or-Treat Bucket'] = function (A) {
    var dog = A.dog, DN = A.DN, CP = A.compact, still = v26Still(), BS = CP ? 0.9 : 1.15, BX = CP ? 300 : 240, PK = CP ? 1 : 1.3, SP = CP ? 104 : 160, P0 = CP ? 452 : 470, PY = GY + 16, HOME = CP ? 800 : 1080;
    var AX = BX + 47 * BS, AY = GY + 8;
    var bshadow = A.sprite('<svg viewBox="0 0 120 14"><ellipse cx="60" cy="7" rx="58" ry="6" fill="#5B3D32" opacity=".13"/></svg>', 120 * BS, 14 * BS, A.L.scene, 0.5, 0.5);
    var bucket = A.sprite(v26Bucket(), 130 * BS, 130 * BS, A.L.front, 112 / 130, 124 / 130);
    var pots = [];
    for (var i = 0; i < 4; i++) {
      var hx = P0 + i * SP;
      pots.push({ i: i, hx: hx, x: hx, y: PY, open: 0, want: 0, wig: 0, close: 0, fly: null, inB: true, spr: A.sprite(v26Pot(i), 80 * PK, 76 * PK, A.L.front, 0.5, 70 / 76), lid: A.sprite(v26Lid(i), 80 * PK, 34 * PK, A.L.front, 0.5, 24 / 34) });
    }
    var treatS = A.sprite(v26Treat(), 50 * PK, 30 * PK, A.L.front); treatS.show(false);
    var rimDy = 44 * PK;
    var state = 'tip', stT = 0, round = 0, treat = 0, found = 0, peeks = 0, sniffs = 0, plan = [], tgt = null, puffT = 0, brot = 0, tip = null, ate = false, nosed = false;
    dog.ground = PY - rimDy - dog.mouthDy('sniff') - 4; dog.y = dog.ground; dog.x = HOME; dog.face('left'); dog.setPose('sit');
    A.say(pick(['treats! in a PUMPKIN!', 'trick or treat? treat. always treat.']), 1800);
    function mouthOf() { var a = brot * Math.PI / 180, vx = -47 * BS, vy = -80 * BS; return { x: AX + vx * Math.cos(a) - vy * Math.sin(a), y: AY + vx * Math.sin(a) + vy * Math.cos(a) }; }
    function newRound() {
      round++; treat = Math.floor(Math.random() * 4); state = 'tip'; stT = 0; tgt = null; ate = false; A.sfx('whoosh');
      pots.forEach(function (p) { p.inB = true; p.fly = null; p.open = p.want = 0; p.close = 0; });
      A.hint('The bucket tips out four pots. Watch ' + DN + '’s nose, then click the pot it points at.');
    }
    function planSearch() {
      plan = []; var wrong = A.tr.sniff ? (Math.random() < 0.3 ? 1 : 0) : A.tr.clever ? (Math.random() < 0.5 ? 1 : 0) : 1 + Math.floor(Math.random() * 2);
      for (var k = 0; k < wrong; k++) { var e = pots[(treat + 1 + Math.floor(Math.random() * 3)) % 4]; if (plan[plan.length - 1] !== e) plan.push(e); }
      plan.push(pots[treat]);
    }
    function nextSniff() { tgt = plan.shift() || pots[treat]; state = 'walk'; stT = 0; }
    function spot(p) { var side = dog.x >= p.x ? 1 : -1; return { x: p.x + side * dog.mouthOff('sniff'), side: side }; }
    function potAt(x, y) { var best = null, bd = 1e9; pots.forEach(function (p) { if (p.inB || p.fly) return; var d = dist(x, y, p.x, p.y - 34 * PK); if (d < A.hitR(58) && d < bd) { bd = d; best = p; } }); return best; }
    function lift(p) {
      if (p.want) return;
      p.want = 1; A.sfx('click');
      if (p.i === treat) {
        found++; nosed = state === 'point'; state = 'found'; stT = 0; tgt = p; A.sfx('pop');
        A.float(round >= 3 && found % 2 ? 'treat found! again!' : 'treat found!', p.x, p.y - 150, 'pt-gold'); A.burst('spark', p.x, p.y - rimDy - 20, 8, { g: 0, sp: 150, life: 0.7, size: 7 });
        if (tip) { tip.hide(); tip = null; }
      } else {
        peeks++; p.close = 0.9; A.float(pick(['not this one', 'empty!', 'just a paper bat']), p.x, p.y - 140, 'pt-small');
        A.say(pick(['sniff... not this one.', 'empty! sniff again.', 'just air in there. nice try.']), 1000);
        if (state === 'point' || state === 'sniff') { state = 'walk'; stT = 0; plan.unshift(pots[treat]); tgt = p; }
      }
    }
    newRound();
    return {
      poses: ['sit', 'idle', 'walk', 'sniff', 'happy', 'jump'],
      dur: 50,
      hint: '',
      down: function (x, y) {
        var p = potAt(x, y);
        if (p && (state === 'walk' || state === 'sniff' || state === 'point')) { lift(p); return; }
        if (!dogTap(A, x, y, ['sniffing! very busy!', 'pat accepted. back to sniffing.'])) kindSniff(A, x, y, ['the treat is in a pot!', 'sniff... not out here.']);
      },
      move: function (x, y) { A.cursor(potAt(x, y) && (state === 'walk' || state === 'sniff' || state === 'point') ? 'pointer' : 'default'); },
      update: function (dt, T) {
        stT += dt; puffT -= dt;
        if (state === 'tip') {
          brot = still ? 82 : 82 * clamp(stT / 0.45, 0, 1) * (1 + 0.08 * Math.sin(clamp(stT / 0.45, 0, 1) * Math.PI));
          if (!dog.air) { dog.setPose('sit'); dog.face('left'); dog.tilt = 0; }
          pots.forEach(function (p, k) {
            var at = 0.4 + k * 0.14;
            if (p.inB && stT > at) { p.inB = false; if (still) { p.x = p.hx; p.y = PY; } else { var mo = mouthOf(); p.fly = { x0: mo.x, y0: mo.y + 40, t: 0, d: 0.45 + k * 0.06 }; } }
            if (p.fly) { p.fly.t += dt; var u = clamp(p.fly.t / p.fly.d, 0, 1); p.x = lerp(p.fly.x0, p.hx, u); p.y = lerp(p.fly.y0, PY, u) - 120 * 4 * u * (1 - u); if (u >= 1) { p.fly = null; p.y = PY; p.wig = 1; A.sfx('land'); A.burst('dust', p.x, GY + 10, 2, { g: -20, sp: 50, life: 0.4, size: 4 }); } }
          });
          if (stT > (still ? 1 : 1.5)) { planSearch(); nextSniff(); A.say(pick(['sniff mode: ON', 'one of these smells AMAZING', 'nose, do your thing']), 1200); if (round === 1) tip = A.tip('click the pot ' + DN + ' sniffs!', P0 - 30, GY - 150); }
        } else {
          brot = state === 'pack' ? (still ? 0 : 82 * (1 - clamp((stT - 0.6) / 0.4, 0, 1))) : 82;
        }
        if (state === 'walk') {
          var sp = spot(tgt);
          if (dog.runTo(sp.x, (A.tr.sniff ? 320 : 240) * A.tr.run, dt)) { dog.face(sp.side > 0 ? 'left' : 'right'); state = 'sniff'; stT = 0; sniffs++; A.sfx('sniff'); }
        } else if (state === 'sniff' || state === 'point') {
          dog.setPose('sniff'); dog.tilt = still ? 0 : dog.dir() * Math.sin(T * (state === 'point' ? 20 : 34)) * 1.6;
          if (puffT <= 0) { puffT = 0.3; var m = dog.mouth(); A.burst('dust', m.x, m.y + 4, 1, { a0: -Math.PI * 0.9, spread: Math.PI * 0.8, g: -20, sp: 60, life: 0.45, size: 3.5 }); }
          if (state === 'sniff' && stT > (A.tr.sniff ? 0.55 : 0.85)) {
            if (tgt.i === treat) { state = 'point'; stT = 0; A.say(pick(['THIS one. this one!', 'sniff sniff... HERE!', 'my nose says this pot']), 1300); A.hint(DN + ' points at a pot. Click it to lift the lid.'); }
            else { tgt.wig = 1; if (Math.random() < 0.5) A.say(pick(['hmm. not this one.', 'smells like a pot.', 'nope, next!']), 900); nextSniff(); }
          }
          if (state === 'point' && stT > 6) { stT = 0; A.say(pick(['this one! the one by my nose!', 'lift the lid! please!']), 1300); }
        } else if (state === 'found') {
          var s3 = spot(tgt);
          if (!ate && dog.runTo(s3.x, 300 * A.tr.run, dt)) { dog.face(s3.side > 0 ? 'left' : 'right'); }
          if (Math.abs(dog.x - s3.x) < 6 || stT > 2.2) {
            if (!ate) { ate = true; stT = Math.min(stT, 0.4); }
            dog.setPose('sniff'); dog.tilt = still ? 0 : dog.dir() * Math.sin(T * 22) * 1.2;
            if (Math.floor(stT * 3) !== Math.floor((stT - dt) * 3) && stT < 1.6) { A.sfx('crunch'); var mm = dog.mouth(); A.burst('crumb', mm.x, mm.y, 3, { sp: 120, g: 900, life: 0.5, size: 2.6, color: '#E8B36A' }); }
            if (stT > 1.7) {
              dog.tilt = 0; v26Pay(A, { happiness: found > 5 ? 1 : nosed ? 3 : 2, bond: round === 2 ? 1 : 0, coins: round === 3 || round === 5 ? 1 : 0 });
              A.say(pick(['crunch! best treat ever.', 'trick or treat? TREAT.', 'nose of the year']), 1500); A.burst('heart', dog.head().x, dog.head().y, 6, { g: -50, sp: 110, life: 1.3, size: 9 });
              state = 'pack'; stT = 0; A.hint('Back in the bucket for another round!');
            }
          }
        } else if (state === 'pack') {
          if (stT < 0.1) { dog.setPose('happy'); }
          if (!still) wiggle(dog, T, 2.4);
          pots.forEach(function (p, k) {
            p.want = 0;
            var a = 0.15 + k * 0.08;
            if (!p.inB && stT > a) { var mo = mouthOf(); var u = clamp((stT - a) / 0.35, 0, 1); if (still) u = 1; p.x = lerp(p.hx, mo.x, u); p.y = lerp(PY, mo.y + 40, u) - 110 * 4 * u * (1 - u); if (u >= 1) p.inB = true; }
          });
          if (stT > 1.3) { dog.tilt = 0; newRound(); }
        }
        pots.forEach(function (p) {
          if (p.close > 0) { p.close -= dt; if (p.close <= 0) p.want = 0; }
          p.open += (p.want - p.open) * Math.min(1, dt * (still ? 30 : 10)); p.wig = Math.max(0, p.wig - dt * 2.5);
          p.spr.show(!p.inB); p.lid.show(!p.inB);
          var w = still ? 0 : Math.sin(T * 40) * p.wig * 5;
          p.spr.set(p.x, p.y, w * 0.4); p.lid.set(p.x + p.open * 14, p.y - rimDy - p.open * 40, w + (still ? 0 : -p.open * 16));
        });
        var tp = pots[treat], tOn = (state === 'found' || state === 'point' || state === 'sniff' || state === 'walk') && tp.open > 0.3 && !(ate && stT > 0.9);
        treatS.show(tOn); if (tOn) treatS.set(tp.x, tp.y - rimDy - 6 - tp.open * 22, still ? 0 : Math.sin(T * 5) * 6);
        bucket.set(AX, AY, brot);
        var ba = brot * Math.PI / 180, bcx = AX + (-47 * Math.cos(ba) + 44 * Math.sin(ba)) * BS; bshadow.set(bcx, GY + 8, 0, 1 - 0.12 * Math.sin(ba), 1);
      },
      drawFx: function (g, T) {
        if ((state === 'sniff' || state === 'point') && tgt) {
          var m = dog.mouth(), a = state === 'point' ? 1 : 0.6;
          g.save(); g.strokeStyle = 'rgba(91,61,50,' + (0.7 * a).toFixed(3) + ')'; g.lineWidth = 2.2; g.lineCap = 'round';
          for (var i = 0; i < 3; i++) { var ox = m.x + dog.dir() * (8 + i * 8), oy = m.y - 14 - i * 6; g.beginPath(); g.arc(ox, oy, 5 + i * 3, -2.2 + (still ? 0 : Math.sin(T * 20 + i) * 0.2), -0.9); g.stroke(); }
          g.fillStyle = INK; g.globalAlpha = a; g.font = '700 24px Caveat, cursive'; g.textAlign = 'center'; g.fillText(state === 'point' ? 'this one!' : 'sniff sniff', tgt.x, tgt.y - rimDy - 58 - (still ? 0 : Math.sin(T * 4) * 3)); g.restore();
        }
      },
      focus: function () { return CP ? 585 : 620; },
      finish: function () { return { happiness: 2, energy: -1 }; },
      dbg: function () { return { state: state, still: still, round: round, treat: treat, found: found, peeks: peeks, sniffs: sniffs, pots: pots.map(function (p) { return { x: p.x, y: p.y - 34 * PK, open: p.open, out: !p.inB && !p.fly }; }) }; }
    };
  };
  IMPL['Trick-or-Treat Bucket'].cfg = { scene: 'yard' };
  IMPL['Trick-or-Treat Bucket'].phone = { vw: 720, vwMin: 700, fx: 585 };

  IMPL['Rope Tug'].phone = { vw: 980, fx: 640 };
  IMPL['Squeaky Duck'].phone = { vw: 700, vwMin: 660, fx: 620 };
  IMPL['Frisbee'].phone = { vw: 760, vwMin: 600 };
  IMPL['Plush Bone'].phone = { vw: 760, vwMin: 660, fx: 580 };
  IMPL['Rubber Chicken'].phone = { vw: 700, vwMin: 660, fx: 625 };

  /* ==================== public ==================== */
  window.PawToys = {
    supports: function (name) { return TOYS.indexOf(name) >= 0; },
    open: function (el, name, ctx) {
      try { return openToy(el, name, ctx); }
      catch (err) {
        if (window.console) console.warn('PawToys.open failed', err);
        var done = false;
        return { close: function () { if (done) return; done = true; try { if (ctx && ctx.onClose) ctx.onClose(); } catch (e) { /* ignore */ } } };
      }
    },
    list: TOYS.slice()
  };
})();
