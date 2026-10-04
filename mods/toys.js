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
  var TOYS = ['Tennis Ball', 'Rope Tug', 'Squeaky Duck', 'Frisbee', 'Plush Bone', 'Puzzle Feeder', 'Driftwood Stick', 'Rubber Chicken', 'Glow Ball'];
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
  function backdrop(variant, time, weather, uidp) {
    var R = rng(variant === 'pond' ? 901 : 77), s = '', gid = uidp + 'sky';
    var defs = '<defs>' + skyDefs(gid, time, weather) + '<pattern id="' + uidp + 'dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.2" fill="#E3D2BA"/></pattern>' +
      '<radialGradient id="' + uidp + 'lamp"><stop offset="0" stop-color="#FFE7A0" stop-opacity=".75"/><stop offset="1" stop-color="#FFE7A0" stop-opacity="0"/></radialGradient></defs>';
    if (variant === 'pond') {
      s += '<rect width="1240" height="340" fill="url(#' + gid + ')"/>' + skyBits(R, 0, 70, 1240, 260, time, weather);
      s += pencil(R, [[0, 300], [180, 262], [380, 290], [600, 250], [820, 286], [1040, 258], [1240, 284], [1240, 360], [0, 360]], 2.2, INK, 0.8, true, '#D9ECCB');
      for (var t = 0; t < 7; t++) { var tx = 60 + t * 190 + R() * 40, ty = 300 + R() * 20; s += pencil(R, [[tx, ty], [tx, ty - 40]], 3, INK, 0.7) + pencil(R, ell(tx, ty - 58, 26, 30, 14), 2, INK, 0.7, true, '#BFE0B4'); }
      s += '<rect y="340" width="1240" height="280" fill="#E8F3D8"/>' + pencil(R, [[0, 340], [1240, 336]], 2.2, INK, 0.7);
      for (var g = 0; g < 60; g++) { var gx = R() * 1240, gy = 360 + R() * 250; s += '<path d="M' + f1(gx) + ' ' + f1(gy) + 'l3 -9M' + f1(gx + 5) + ' ' + f1(gy) + 'l-1 -11" stroke="#86B57A" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>'; }
      s += pencil(R, [[720, 462], [900, 450], [1100, 452], [1250, 446], [1250, 630], [560, 630], [610, 540]], 2.6, INK, 1, true, '#BBD8EF');
      s += '<path d="' + wob(R, [[720, 462], [900, 450], [1100, 452], [1250, 446], [1250, 630], [560, 630], [610, 540]], 2, true) + '" fill="url(#' + uidp + 'dots)" opacity=".5"/>';
      for (var w = 0; w < 12; w++) { var wx = 700 + R() * 500, wy = 480 + R() * 120; s += pencil(R, [[wx, wy], [wx + 14, wy - 4], [wx + 28, wy], [wx + 42, wy - 4]], 1.6, '#6F93BE', 0.8); }
      [[640, 470], [672, 455], [596, 520]].forEach(function (p) { s += pencil(R, [[p[0], p[1] + 40], [p[0] - 4, p[1] - 30]], 2.2, '#6E8F5A') + pencil(R, ell(p[0] - 4, p[1] - 38, 5, 12, 10), 1.6, INK, 1, true, '#A0764E'); });
      s += '<text x="905" y="600" font-family="Caveat,cursive" font-weight="700" font-size="26" fill="#5B3D32" opacity=".6">the pond (very wet)</text>';
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
  var MOUTH = { idle: [70, -66], walk: [70, -66], happy: [70, -70], pet: [70, -70], sit: [42, -76], jump: [84, -108], eat: [14, -8], crouch: [58, -16], dig: [42, -10], shake: [70, -62], sad: [56, -50], sleep: [60, -16], dirty: [70, -66], cold: [62, -60], hot: [70, -66], __own: [88, -76] };
  /* per-breed mouth adjustments in viewBox units: d = default for every pose, plus per-pose overrides (calibrated by eye) */
  var BREED_M = {
    shiba: { d: [0, 0] }, husky: { d: [-8, 0] }, dachs: { d: [30, 0] },
    corgi: { d: [-2, 4], eat: [10, 0], crouch: [0, 0], sit: [0, 0] },
    golden: { d: [-24, -6], sit: [-24, 0], jump: [-38, 2], eat: [40, -15], crouch: [0, 0], sleep: [-12, 0] },
    mutt: { d: [-10, 4], sit: [0, 0], jump: [-8, 0], eat: [24, 0], crouch: [0, 0] },
    chihuahua: { d: [-12, 14], sit: [0, 8], jump: [-30, 10], eat: [16, -6], crouch: [0, 0], sleep: [-12, 0] },
    pug: { d: [-22, 10], sit: [-6, 3], jump: [-30, 5], eat: [28, -11], crouch: [0, 0], sleep: [-10, 0] },
    greyhound: { d: [32, -42], sit: [48, 2], jump: [18, -53], eat: [28, -4], crouch: [50, 8], sleep: [12, 4] },
    beagle: { d: [-4, 0], jump: [-6, -5], eat: [28, -3], sit: [0, 0], crouch: [0, 0], sleep: [0, 0] }
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
    dachs: { run: 0.85 }, corgi: { run: 0.92 }
  };
  function trait(key) { return Object.assign({ run: 1, carry: 1 }, TRAITS[key] || {}); }
  /* per-breed flavour lines; any missing slot falls back to the generic lines passed in */
  var LINES = {
    chihuahua: {
      fetchStart: ['throw it. I dare you.', 'I am small but I am FAST'], fetchDeliver: ['I defeated it. you\u2019re welcome.', 'it fought back. I won.'],
      tugStart: ['GRRRR. I AM A WOLF.', 'you face the security system'], tugGrowl: ['GRRRRRR!!', 'I will NEVER let go', 'tiny but MIGHTY', 'yip! YIP! grrr!'],
      tugDogWin: ['FEAR ME.', 'the rope is mine. forever.'], tugYouWin: ['...I let you win. obviously.', 'ok fine. hug. but quickly.'],
      duckOk: ['YAP YAP correct!', 'I yap, you squeak. a team.'], puzzleWrong: ['that lid lied to me', 'I am FURIOUS at that lid'],
      frisbee: ['I caught it with my FACE', 'the disc is bigger than me. I won.'], plushYawn: ['*tiny yawn*'], howl: ['YIP-YIP-AWOO!', 'yap yap yap!']
    },
    pug: {
      fetchStart: ['*snort* ...throw it gently', 'ok but not too far'], fetchDeliver: ['*snort snort* got it', 'I need a little lie down'],
      tugGrowl: ['*snort* grrf', 'rrf rrf *wheeze*', 'grrrrf *snort*'], tugDogWin: ['*victory snort*'],
      duckListen: ['*snort*', '*snerk*', '*huff*'], duckOk: ['*happy snort*', 'snort-squeak duet!'],
      puzzleFound: ['FOOD. *snort* FOOD.', 'my favourite flavour: kibble'], plushYawn: ['*snoooore*'], howl: ['rrf! *snort* rrf!', 'arf-*snort*-roo']
    },
    greyhound: {
      fetchStart: ['I go fast. then I lie down.', 'ready. set. ZOOM.'], fetchDeliver: ['*flop*', 'that was 45 mph. nap now.', 'zoom complete. horizontal mode.'],
      tugGrowl: ['roo.', 'mrrr (politely)'], frisbee: ['ZOOOM. got it. *flop*', 'leg power!'], howl: ['rooo...', 'roo-roo (softly)'],
      stickShake: ['brrr. my legs are wet.', 'long legs, long shake']
    },
    beagle: {
      fetchStart: ['I can smell the ball from here', 'throw it! I\u2019ll sniff it out'], fetchDeliver: ['found it by SMELL', 'my nose did the work'],
      puzzleStart: ['sniff. sniff. it\u2019s THAT one.', 'my nose already knows'], puzzleFound: ['smelled that from three streets away', 'nose: 1, lids: 0'],
      duckOk: ['AROOOO! (that means yes)'], howl: ['AROOOOOO!', 'ah-ROOOO-ooo!'], tugGrowl: ['arooo-grrr!', 'grrr (musically)']
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
    var totals = { happiness: 0, bond: 0, coins: 0, energy: 0 };

    if (el && getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var root = div('pt-root', el); root.tabIndex = -1;
    var stage = div('pt-stage', root);
    var cfg = impl.cfg || {};
    var L = {};
    L.scene = div('pt-layer', stage, backdrop(cfg.scene || 'room', time, weather, uidp));
    var wx = cfg.scene === 'pond' ? { x: 0, y: 0, w: 1240, h: 620 } : { x: 850, y: 110, w: 250, h: 220 };
    if (weather === 'rain' || weather === 'snow') { var rn = div(weather === 'rain' ? 'pt-rain' : 'pt-snow', L.scene); rn.style.cssText += ';left:' + wx.x + 'px;top:' + wx.y + 'px;width:' + wx.w + 'px;height:' + wx.h + 'px;opacity:' + (cfg.scene === 'pond' ? 0.6 : 0.9); }
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
    var titles = div('pt-titles', hud); div('pt-title', titles, esc(name));
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
      hitR: function (r) { return touch ? Math.max(r, 32 / Math.max(0.2, scale)) : r; },
      tip: function (text, x, y) { if (coarse) text = text.replace('click me!', 'tap me!').replace('drag me & let go!', 'flick me!'); var t = div('pt-tip', L.ui, esc(text)); t.style.left = x + 'px'; t.style.top = y + 'px'; return { el: t, hide: function () { if (t.parentNode) t.parentNode.removeChild(t); } }; }
    };

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
      var card = cardEl = div('pt-card', phone ? root : L.ui,
        '<div class="pt-card-t">' + esc(title || pick(['What a play session!', 'Best. Game. Ever.', 'Tail status: wagging'])) + '</div>' +
        '<div class="pt-card-s">' + esc(sub || (DN + ' had a wonderful time with the ' + name + '.')) + '</div>' +
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
    Object.defineProperty(ctl, '_dbg', { value: function () { return { toy: toy.dbg ? toy.dbg() : null, dog: { x: A.dog.x, y: A.dog.y, pose: A.dog.pose, facing: A.dog.facing }, totals: totals, finished: finished, timeLeft: timeLeft }; } });
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
        if (st === 'hold' && dog.pose === 'shake' && Math.random() < dt * 30) A.burst('drop', dog.x + (Math.random() - 0.5) * 120, dog.y - 100 - Math.random() * 60, 1, { sp: 360, g: 1000, color: '#9CC8EA', size: 3.5 });
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
