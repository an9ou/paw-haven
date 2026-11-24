// "My dog" merch page: design prototype. Fake data only: no payment code, no network calls, nothing stored outside this tab.
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var A = window.MerchArt;

  // ---- fake data: the player's dogs (favourite first), as the game would hand them over: looks only (name, breed, age, outfit)
  var MY = [
    { id: 'biscuit', name: 'Biscuit', breed: 'Corgi', fav: true, face: 'blep' },
    { id: 'mochi', name: 'Mochi', breed: 'Shiba Inu', pup: 'Puppy, 4 months' },
    { id: 'pickle', name: 'Pickle', breed: 'Pug', wear: 'Party Hat, Red Bandana' },
    { id: 'pepper', name: 'Pepper', breed: 'Miniature Schnauzer' },
    { id: 'waffles', name: 'Sir Waffles III', breed: 'Dalmatian' }
  ];
  var READY = [
    { id: 'r-lab', name: 'Labrador', breed: 'Labrador Retriever', ready: true },
    { id: 'r-frenchie', name: 'Frenchie', breed: 'French Bulldog', ready: true },
    { id: 'r-golden', name: 'Golden', breed: 'Golden Retriever', ready: true },
    { id: 'r-dachs', name: 'Dachshund', breed: 'Dachshund', ready: true }
  ];
  // prices [usd, gbp] are the delivered prices suggested in ../PROVIDERS.md section 4 (Printful, about 30% margin, US/UK delivery included);
  // the hoodie is estimated from its base price the same way; ship = the extra for 'somewhere else' (placeholder)
  var COL = { white: ['White', '#FFFFFF'], natural: ['Natural', '#F3E9D2'], grey: ['Heather grey', '#D6D3CE'], pink: ['Soft pink', '#F6CFD6'], blue: ['Light blue', '#CFE0EF'],
    sand: ['Sand', '#E6D3B3'], navy: ['Navy', '#2E3A55'], black: ['Black', '#2B2724'] };
  var ADULT = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
  var PROD = {
    mug: { name: 'Mug', one: 'mug', price: [21.99, 15.99], d: '11 oz ceramic, dishwasher safe', cols: ['white'], sizes: [['11 oz', 0, 0]], file: '9 × 3.5 in wrap: the same dog on both sides, for left and right hands', ship: [7.99, 6.49] },
    tee: { name: 'T-shirt', one: 'tee', price: [27.99, 23.99], d: 'Soft cotton, unisex fit', cols: ['white', 'natural', 'grey', 'pink', 'blue', 'navy'], sizes: ADULT.map(function (s, i) { return [s, i > 4 ? 2 : 0, i > 4 ? 2 : 0]; }), file: 'Printed 10.8 × 12.6 in on the front', ship: [7.99, 6.49] },
    sweat: { name: 'Sweatshirt', one: 'sweatshirt', price: [45.99, 37.99], d: 'Cosy crew neck, unisex', cols: ['white', 'grey', 'sand', 'blue', 'navy'], sizes: ADULT.slice(1, 6).map(function (s, i) { return [s, i > 3 ? 2 : 0, i > 3 ? 2 : 0]; }), file: 'Printed 10.8 × 12.6 in on the front', ship: [9.99, 7.99] },
    hoodie: { name: 'Hoodie', one: 'hoodie', price: [51.99, 42.99], d: 'Soft fleece inside, unisex', cols: ['grey', 'sand', 'pink', 'white', 'black'], sizes: ADULT.slice(1, 6).map(function (s, i) { return [s, i > 3 ? 2 : 0, i > 3 ? 2 : 0]; }), file: 'Printed 10 × 11.7 in, above the pocket', ship: [9.99, 7.99] },
    tote: { name: 'Tote bag', one: 'tote bag', price: [24.99, 28.99], d: 'Strong cotton, carries lots', cols: ['natural', 'black'], sizes: [['One size', 0, 0]], file: 'Printed 11 × 11 in on one side', ship: [7.99, 6.49] },
    stickers: { name: 'Sticker sheet', one: 'sticker sheet', price: [15.99, 13.49], d: '9 stickers, kiss-cut, one sheet', cols: [], sizes: [['5.8 × 8.3 in', 0, 0]], file: 'The whole sheet, 5.8 × 8.3 in, cut lines dashed', ship: [3.99, 2.99] }
  };
  var ORDER = ['mug', 'tee', 'sweat', 'hoodie', 'tote', 'stickers'];
  var POSES = [['stand', 'Stand'], ['sit', 'Sit'], ['happy', 'Happy']];
  var ETA = { us: ['About 5–9 working days', '2–5 days to print in the USA, then 3–4 days in the post.'], uk: ['About 4–7 working days', '2–5 days to print in the UK, then about 2 days in the post.'], other: ['About 7–25 working days', 'Printed at the nearest print shop (USA, UK or EU), then the post.'] };

  // ---- state (this tab only)
  var q = new URLSearchParams(location.search);
  var st = { src: q.get('src') || 'game', dog: 'biscuit', prod: 'tee', pose: 'stand', yard: false, showName: true, name: '', col: 'white', size: 2, qty: 1, cur: 'usd', ctry: 'us', curSet: false, pv: 'on', later: false };
  try { var lang = (navigator.languages && navigator.languages[0]) || navigator.language || ''; if (/-GB$|-UK$|^en-(IE|IM|JE|GG)$/i.test(lang)) { st.cur = 'gbp'; st.ctry = 'uk'; } } catch (e) { /* default USD */ }
  if (q.get('cur') === 'gbp') { st.cur = 'gbp'; st.ctry = 'uk'; }
  var dogs = function () { return st.src === 'none' ? [] : MY; };
  var dogOf = function (id) { return MY.concat(READY).filter(function (d) { return d.id === id; })[0] || MY[0]; };
  var D = function () { return dogOf(st.dog); };
  var Pr = function () { return PROD[st.prod]; };
  var money = function (n) { return (st.cur === 'gbp' ? '£' : '$') + n.toFixed(2); };
  var ci = function () { return st.cur === 'gbp' ? 1 : 0; };
  var unit = function () { var p = Pr(), s = p.sizes[Math.min(st.size, p.sizes.length - 1)]; return p.price[ci()] + (s[1 + ci()] || 0); };
  var shipCost = function () { return st.ctry === 'other' ? Pr().ship[ci()] : 0; };
  var nameNow = function () { return st.showName ? (st.name || '').trim() : ''; };
  var colHex = function () { return st.col && COL[st.col] ? COL[st.col][1] : '#FFFFFF'; };
  var base = function (id) { return 'assets/dogs/' + (id || st.dog); };
  function prodSVG(kind, o) {
    o = o || {}; var p = PROD[kind];
    return A.product({ kind: kind, colour: o.col || (p.cols[0] ? COL[p.cols[0]][1] : '#fff'), dog: base(o.dog), pose: o.pose || 'stand', yard: !!o.yard, name: o.name || '', showArea: o.area, label: o.label || p.name });
  }
  function fitProduct() { var p = Pr(); if (p.cols.length && p.cols.indexOf(st.col) < 0) st.col = p.cols[0]; if (!p.cols.length) st.col = null; if (st.size >= p.sizes.length) st.size = Math.min(2, p.sizes.length - 1); if (p.sizes.length > 4 && st.size === 0) st.size = 2; }

  // ---- views
  function show(v) {
    $$('.mview').forEach(function (s) { s.classList.toggle('on', s.dataset.view === v); });
    var order = ['pick', 'product', 'make', 'pay'], i = order.indexOf(v);
    $('#steps').hidden = i < 0;
    $$('#steps li').forEach(function (li, k) { li.className = k < i ? 'done' : k === i ? 'now' : ''; if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    $('#crumbs').textContent = { home: 'Merch', pick: 'Merch · step 1 of 4', product: 'Merch · step 2 of 4', make: 'Merch · step 3 of 4', pay: 'Merch · step 4 of 4', done: 'Merch · your order' }[v];
    ({ home: rHome, pick: rPick, product: rProduct, make: rMake, pay: rPay, done: rDone })[v]();
    $$('.dn').forEach(function (e) { e.textContent = D().ready ? 'your ' + D().name : D().name; });
    window.scrollTo(0, 0);
  }
  function route() { var v = (location.hash.match(/^#\/(\w+)/) || [])[1] || 'home'; if (!document.querySelector('.mview[data-view="' + v + '"]')) v = 'home'; show(v); }

  function readyList(el) {
    el.innerHTML = READY.map(function (d) { return '<li><button type="button" data-ready="' + d.id + '"><img src="' + base(d.id) + '-stand.svg" alt="" width="240" height="200">' + d.breed + '<small>ready-made</small></button></li>'; }).join('');
    $$('[data-ready]', el).forEach(function (b) { b.onclick = function () { st.dog = b.dataset.ready; st.showName = false; st.name = ''; location.hash = '#/product'; }; });
  }
  function rHome() {
    var T = [['mug', 'r-dachs', 'sit', 'A mug', 'from'], ['tee', 'pickle', 'stand', 'A tee', 'from'], ['stickers', 'r-frenchie', 'stand', 'Stickers', 'from']];
    $('#trio').innerHTML = T.map(function (t) {
      var p = PROD[t[0]], nm = t[1] === 'pickle' ? 'Pickle' : '';
      return '<li>' + prodSVG(t[0], { dog: t[1], pose: t[2], name: nm, col: t[0] === 'tee' ? COL.blue[1] : undefined, label: t[3] + ' with a crayon dog on it' }).replace('class="prod"', 'class="prod pimg"') + t[3] + '<small>from ' + money(p.price[ci()]) + '</small></li>';
    }).join('');
    readyList($('#readyHome'));
  }
  function rPick() {
    var b = $('#pickBody'), L = dogs(), h = '';
    if (!L.length) {
      h += '<div class="none"><img src="assets/img/art/peek/beagle.svg" alt="" width="100" height="100"><p class="lead">We can’t see any of your dogs from here yet.</p>' +
        '<p>Your dogs live in the game, so let’s bring one over:</p><ol><li>Open Doodle Doggo.</li><li>Tap <span class="kbd">More</span>.</li><li>Tap <span class="kbd">Put my dog on merch</span>.</li></ol>' +
        '<p>This page opens again with your dogs on it. <a class="lnk" href="#play-placeholder">Open the game →</a></p></div>';
      h += '<div class="subh">Or pick a ready-made dog</div><ul class="ready small" id="readyPick"></ul>';
      b.innerHTML = h; readyList($('#readyPick')); $('#pickNext').setAttribute('aria-disabled', 'true'); $('#pickNext').removeAttribute('href'); return;
    }
    $('#pickNext').removeAttribute('aria-disabled'); $('#pickNext').href = '#/product';
    if (st.src === 'link') h += '<div class="from link"><span class="ic" aria-hidden="true">🔗</span><p><b>' + L.length + ' dogs came with your link from the game.</b> Only how they look came along (name, breed, coat, outfit), and only for this tab.</p></div>';
    else h += '<div class="from"><span class="ic" aria-hidden="true">🏡</span><p><b>Here are your dogs from the game in this browser.</b> Each one is printed just as it looks today. Want a different outfit? Change it in the game first.</p></div>';
    h += '<ul class="dogs5">' + L.map(function (d) {
      return '<li><button type="button" class="dogb" data-dog="' + d.id + '" aria-pressed="' + (st.dog === d.id) + '">' + (d.fav ? '<span class="fav"><span aria-hidden="true">♥</span> favourite</span>' : '') + '<span class="tick" aria-hidden="true">✓</span>' +
        '<img src="' + base(d.id) + '-head.svg" alt="" width="100" height="100"><span class="n">' + d.name + '</span><span class="b">' + d.breed + '</span>' +
        (d.pup ? '<span class="w pup">' + d.pup + '</span>' : '') + (d.wear ? '<span class="w">wearing ' + d.wear + '</span>' : '') + '</button></li>';
    }).join('') + '</ul>';
    h += '<div class="subh">Or a ready-made dog</div><ul class="ready small" id="readyPick"></ul>';
    b.innerHTML = h; readyList($('#readyPick'));
    $$('.dogb', b).forEach(function (x) { x.onclick = function () { st.dog = x.dataset.dog; st.name = D().name; st.showName = true; rPick(); }; });
    $$('[data-ready]', b).forEach(function (x) { x.onclick = function () { st.dog = x.dataset.ready; st.showName = false; st.name = ''; location.hash = '#/product'; }; });
  }
  function rProduct() {
    $('#prods').innerHTML = ORDER.map(function (k) {
      var p = PROD[k];
      return '<li><button type="button" class="prodb" data-p="' + k + '" aria-pressed="' + (st.prod === k) + '">' + prodSVG(k, { name: '', label: p.name + ' with ' + D().name }) +
        '<span class="n">' + p.name + '</span><span class="p">from <b>' + money(p.price[ci()]) + '</b></span><span class="d">' + p.d + '</span></button></li>';
    }).join('');
    $$('.prodb').forEach(function (b) { b.onclick = function () { st.prod = b.dataset.p; fitProduct(); location.hash = '#/make'; }; });
    $('#madein').innerHTML = '<span aria-hidden="true">📍</span> ' + (st.ctry === 'uk' ? 'Made near you, in the UK. Delivery included.' : st.ctry === 'us' ? 'Made near you, in the USA. Delivery included.' : 'Made at the print shop nearest you: USA, UK or EU.');
  }
  function rMake() {
    fitProduct();
    var p = Pr(), sheet = st.prod === 'stickers';
    if (!st.name && !D().ready && st.showName) st.name = D().name;
    $$('.pn').forEach(function (e) { e.textContent = p.one; });
    // the preview
    $('#pvProd').innerHTML = prodSVG(st.prod, { pose: st.pose, yard: st.yard && !sheet, name: nameNow(), col: colHex(), label: p.name + ' preview' });
    $('#pvFlat').innerHTML = A.flat({ kind: st.prod, colour: colHex(), dog: base(), pose: st.pose, yard: st.yard, name: nameNow() }) + '<p>' + p.file + '. Drawn again at full size from the game\'s own art, so every line stays sharp.</p>';
    $('#preview').classList.toggle('isflat', st.pv === 'flat');
    $$('[data-pv]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pv === st.pv)); b.onclick = function () { st.pv = b.dataset.pv; rMake(); }; });
    // options
    $('#o-pose').hidden = sheet; $('#o-bg').hidden = sheet; $('#o-sheet').hidden = !sheet;
    $('#poses').innerHTML = POSES.map(function (x) { return '<button type="button" data-pose="' + x[0] + '" aria-pressed="' + (st.pose === x[0]) + '"><img src="' + base() + '-' + x[0] + '.svg" alt="" width="240" height="200">' + x[1] + '</button>'; }).join('');
    $$('[data-pose]').forEach(function (b) { b.onclick = function () { st.pose = b.dataset.pose; rMake(); }; });
    $('#bgs').innerHTML = [[false, 'Just the dog'], [true, 'A little yard']].map(function (x) { return '<button type="button" data-yard="' + x[0] + '" aria-pressed="' + (st.yard === x[0]) + '">' + A.thumb({ dog: base() + '-' + st.pose + '.svg', yard: x[0] }) + x[1] + '</button>'; }).join('');
    $$('[data-yard]').forEach(function (b) { b.onclick = function () { st.yard = b.dataset.yard === 'true'; rMake(); }; });
    var tog = $('#nameTog'), inp = $('#nameIn');
    tog.setAttribute('aria-checked', String(st.showName)); inp.disabled = !st.showName; if (document.activeElement !== inp) inp.value = st.name;
    inp.placeholder = D().ready ? 'Type a name' : D().name; inp.setAttribute('aria-label', 'Name to print');
    $('#nameCnt').textContent = st.name.length + ' / 20 letters' + (sheet && !st.showName ? ' · the label sticker says "good dog!"' : '');
    $('#o-col').hidden = !p.cols.length;
    $('#cols').innerHTML = p.cols.map(function (c) { return '<button type="button" data-col="' + c + '" aria-pressed="' + (st.col === c) + '"><i style="background:' + COL[c][1] + '"></i>' + COL[c][0] + '</button>'; }).join('');
    $('#colName').textContent = st.col ? COL[st.col][0] + (p.cols.length === 1 ? ' (the only colour for this one)' : '') : '';
    $('#darkNote').hidden = !(st.col && A.lum(colHex()) < 0.45);
    $$('[data-col]').forEach(function (b) { b.onclick = function () { st.col = b.dataset.col; rMake(); }; });
    $('#sizes').innerHTML = p.sizes.map(function (s, i) { return '<button type="button" class="chipb" data-size="' + i + '" aria-pressed="' + (st.size === i) + '">' + s[0] + (s[1] ? ' <small>+' + money(s[1 + ci()]) + '</small>' : '') + '</button>'; }).join('');
    $$('[data-size]').forEach(function (b) { b.onclick = function () { st.size = +b.dataset.size; rMake(); }; });
    $('#sgBtn').hidden = !/tee|sweat|hoodie/.test(st.prod);
    $('#qv').textContent = st.qty;
    $('#amt').innerHTML = money(unit() * st.qty) + '<small>' + (st.qty > 1 ? st.qty + ' × ' + money(unit()) + ', ' : '') + (st.ctry === 'other' ? 'delivery next' : 'delivery included') + '</small>';
  }
  function sumBlock(el, link) {
    var p = Pr(), s = p.sizes[st.size], d = D(), nm = nameNow();
    el.innerHTML = prodSVG(st.prod, { pose: st.pose, yard: st.yard && st.prod !== 'stickers', name: nm, col: colHex() }) +
      '<div><h3>' + p.name + '</h3><ul>' +
      '<li>' + (d.ready ? 'Ready-made ' + d.breed : d.name + ', ' + d.breed) + '</li>' +
      (st.prod !== 'stickers' ? '<li>' + POSES.filter(function (x) { return x[0] === st.pose; })[0][1] + ' · ' + (st.yard ? 'a little yard' : 'just the dog') + '</li>' : '<li>The whole pack on one sheet</li>') +
      '<li>' + (nm ? 'Name: “' + nm.replace(/</g, '&lt;') + '”' : 'No name') + '</li>' +
      (st.col ? '<li>' + COL[st.col][0] + ' · ' + s[0] + '</li>' : '<li>' + s[0] + '</li>') +
      '<li>How many: ' + st.qty + '</li></ul>' + (link ? '<a class="lnk" href="#/make">Change</a>' : '') + '</div>';
  }
  function rPay() {
    fitProduct(); sumBlock($('#sumProd'), true);
    $$('#ctry button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.c === st.ctry)); b.onclick = function () { st.ctry = b.dataset.c; if (!st.curSet && st.ctry !== 'other') { st.cur = st.ctry === 'uk' ? 'gbp' : 'usd'; syncCur(); } rPay(); }; });
    var e = ETA[st.ctry];
    $('#eta').innerHTML = '<span aria-hidden="true">📦</span><span><b>' + e[0] + '</b><br>' + e[1] + ' <span class="ph">Printful times, check</span></span>';
    var sub = unit() * st.qty, sh = shipCost();
    $('#lines').innerHTML = '<tr><td>' + Pr().name + (st.qty > 1 ? ' × ' + st.qty : '') + '</td><td>' + money(sub) + '</td></tr>' +
      '<tr><td>Delivery to ' + { us: 'the USA', uk: 'the UK', other: 'your country' }[st.ctry] + '</td><td>' + (sh ? money(sh) + ' <span class="ph">placeholder</span>' : 'included') + '</td></tr>' +
      '<tr class="tot"><td>Total</td><td>' + money(sub + sh) + '</td></tr>';
    $('#taxnote').innerHTML = (st.ctry === 'uk' ? 'Includes VAT and delivery: nothing is added at the end.' : st.ctry === 'us' ? 'Delivery included: nothing is added at the end.' : 'Your country may charge import tax or a customs fee when it arrives.') + ' <span class="ph">prices from PROVIDERS.md, not final</span>';
  }
  function rDone() {
    fitProduct(); sumBlock($('#doneProd'), false);
    $('#doneDog').src = base() + '-happy.svg';
    var S = [['✓', 'Order received', 'Today. Your receipt is in your email.'], ['🖨', 'Being printed', 'At the print shop near you, in 2 to 5 working days.'], ['🚚', 'On its way', 'You get an email with a tracking link.'], ['🏠', 'Arrived', 'Say hello to your dog, in real life.']];
    var now = st.later ? 2 : 0;
    $('#track').innerHTML = S.map(function (s, i) {
      var c = i < now ? 'done' : i === now ? 'now' : 'later', t = s[2];
      if (st.later && i === 1) t = 'Printed on Thursday.'; if (st.later && i === 2) t = 'Posted Friday. <a class="lnk" href="#track-placeholder">Track it →</a>';
      return '<li class="' + c + '"><span class="dot" aria-hidden="true">' + (i < now ? '✓' : s[0]) + '</span><span><b>' + s[1] + '</b><span>' + t + '</span></span></li>';
    }).join('');
    $('#laterBtn').textContent = st.later ? 'Back to today' : 'See it 4 days later';
  }

  // ---- controls that live outside the views
  function syncCur() { $$('[data-cur]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.cur === st.cur)); }); }
  $$('[data-cur]').forEach(function (b) { b.onclick = function () { st.cur = b.dataset.cur; st.curSet = true; syncCur(); route(); }; });
  syncCur();
  $('#nameTog').onclick = function () { st.showName = !st.showName; rMake(); };
  $('#nameIn').oninput = function (e) { st.name = e.target.value.replace(/[<>]/g, '').slice(0, 20); rMake(); };
  $('#qm').onclick = function () { st.qty = Math.max(1, st.qty - 1); rMake(); };
  $('#qp').onclick = function () { st.qty = Math.min(10, st.qty + 1); rMake(); };
  $('#payBtn').onclick = function () { $('#hand').showModal(); };
  $('#handNo').onclick = function () { $('#hand').close(); };
  $('#handOk').onclick = function () { $('#hand').close(); location.hash = '#/done'; };
  $('#laterBtn').onclick = function () { st.later = !st.later; rDone(); };
  $('#sgBtn').onclick = function () {
    var W = { XS: [17, 43], S: [18, 46], M: [20, 51], L: [22, 56], XL: [24, 61], '2XL': [26, 66], '3XL': [28, 71] };
    $('#sgt').innerHTML = '<tr><td><b>Size</b></td><td><b>Chest width (flat)</b></td></tr>' + Pr().sizes.map(function (s) { var w = W[s[0]]; return '<tr><td>' + s[0] + '</td><td>' + w[0] + ' in · ' + w[1] + ' cm</td></tr>'; }).join('');
    $('#sizeg').showModal();
  };
  $('#sgClose').onclick = function () { $('#sizeg').close(); };
  $$('[data-src]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.src === st.src)); b.onclick = function () { st.src = b.dataset.src; $$('[data-src]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); location.hash = '#/pick'; route(); }; });
  $$('.steps li').forEach(function (li) { li.style.cursor = 'pointer'; li.onclick = function () { if (li.classList.contains('done')) location.hash = '#/' + li.dataset.s; }; });
  // test hooks for the screenshots
  window.__merch = { st: st, go: function (o) { Object.assign(st, o || {}); route(); } };
  window.addEventListener('hashchange', route);
  if (q.get('from') === 'share') { st.dog = q.get('dog') || 'biscuit'; st.prod = 'mug'; st.pose = 'happy'; if (!location.hash) location.hash = '#/make'; }
  st.name = D().name; route();
})();
