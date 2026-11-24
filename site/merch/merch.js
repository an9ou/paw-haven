/* Doodle Doggo /merch: "Put your dog on a mug", TEST MODE (docs/design/merch/PART2.md).
   The six steps: 1 the landing, 2 which dog, 3 the thing (mug or tee), 4 make it yours, 5 the basket and pay, 6 the thank-you / order page.
   Every preview is PawPrint.print() itself laid on a drawn product (mock.js). All server talk goes through api (api.js; in test mode the
   local fake, api_fake.js). The game's save is only ever read. The basket and the "Ship to" choice are kept under their own keys in
   localStorage, dogs from a link in sessionStorage (this tab only): both are conveniences, and the page works without them. */
(function () {
  'use strict';
  var P = window.PawPrint, M = window.MerchMock;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = M.esc, Q = new URLSearchParams(location.search), DEMO = Q.get('demo') === '1';
  var SAVE_KEY = 'pawhaven_proto_v1', BASKET_KEY = 'dd_merch_basket_v1', SHIP_KEY = 'dd_merch_ship_v1', LINK_KEY = 'dd_merch_link_v1';
  var ss = null; try { ss = window.sessionStorage; } catch (e) { ss = null; }
  var api = window.MerchApi.make({ demo: DEMO, store: ss });

  // ---- words
  var BREED = { shiba: 'Shiba Inu', corgi: 'Corgi', golden: 'Golden Retriever', dachs: 'Dachshund', husky: 'Husky', mutt: 'Shelter Mutt', chihuahua: 'Chihuahua', pug: 'Pug',
    greyhound: 'Greyhound', beagle: 'Beagle', poodle: 'Miniature Poodle', collie: 'Border Collie', samoyed: 'Samoyed', frenchie: 'French Bulldog', akita: 'Akita', spitz: 'Japanese Spitz',
    pom: 'Pomeranian', afghan: 'Afghan Hound', dane: 'Great Dane', mastiff: 'English Mastiff', gsd: 'German Shepherd', dobie: 'Doberman', corso: 'Cane Corso', pitbull: 'Pit Bull',
    minpin: 'Miniature Pinscher', lab: 'Labrador Retriever', malamute: 'Alaskan Malamute', chow: 'Chow Chow', stdpoodle: 'Standard Poodle', schnauzer: 'Miniature Schnauzer',
    westie: 'West Highland White Terrier', yorkie: 'Yorkshire Terrier', bichon: 'Bichon Frise', maltese: 'Maltese', shihtzu: 'Shih Tzu', dalmatian: 'Dalmatian',
    bernese: 'Bernese Mountain Dog', aussie: 'Australian Shepherd', cavalier: 'Cavalier King Charles Spaniel', jrt: 'Jack Russell Terrier' };
  var breedOf = function (r) { var k = P.BREEDS[r.b]; return BREED[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : 'Dog'); };
  var THE = { US: 1, GB: 1, NL: 1, PH: 1, AE: 1, BS: 1, GM: 1, DO: 1, CF: 1, KY: 1, FO: 1, FK: 1, MV: 1, SB: 1, TC: 1, VG: 1, CK: 1, SC: 1, KM: 1 };
  var POSES = [['stand', 'Stand'], ['sit', 'Sit'], ['happy', 'Happy']];
  var PROD = { mug: { name: 'Mug', one: 'mug', title: 'Mug with your dog', d: '11 oz white ceramic mug. Your dog on both sides, for left and right hands.' },
    tee: { name: 'Tee', one: 'tee', title: 'Tee with your dog', d: 'Soft cotton tee, unisex adult sizes. Your dog on the front.' } };
  var NOTE = { import_tax: 'Your country may charge import tax or a fee when it arrives. It isn\'t included in this price, and it\'s paid to the delivery company.',
    separate_parcels: 'Mugs and tees travel in their own parcels, so they may arrive on different days.',
    vat_included: 'Prices include VAT.' };
  var money = function (c) { return '$' + (c / 100).toFixed(2); };
  var WIDTH = { XS: 16.5, S: 18, M: 20, L: 22, XL: 24, '2XL': 26, '3XL': 28, '4XL': 30, '5XL': 32 }; // Bella+Canvas 3001, flat (PRINT_FILES.md)

  // ---- storage: every read and write may fail (private windows, blocked storage); the page works without it
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* fine */ } }
  function ssGet(k) { try { return ss ? ss.getItem(k) : null; } catch (e) { return null; } }
  function ssSet(k, v) { try { if (ss) { if (v == null) ss.removeItem(k); else ss.setItem(k, v); } } catch (e) { /* fine */ } }

  // ---- the ready-made dogs (no name: the buyer may type one)
  var READY = [['lab', 'ready-lab', 'm'], ['frenchie', 'ready-frenchie', 'f'], ['golden', 'ready-golden', 'f'], ['dachs', 'ready-dachs', 'm']].map(function (x, i) {
    return { id: 'r' + i, src: 'ready', recipe: { v: 1, b: P.BREEDS.indexOf(x[0]), g: null, e: 0, p: P.hashId(x[1]), a: 0, s: x[2] } };
  }).filter(function (d) { return d.recipe.b >= 0 && P.check(d.recipe).ok; });

  // ---- state
  var cat = null, st = { src: 'none', dogs: [], linkErr: null, dog: null, draft: null, edit: null, pv: 'on', country: '', quote: null, qerr: null, qn: 0, order: null, view: '' };
  var basket = [];

  // ---- where the dogs come from: a link from the game (#p=..., this tab only), else the save in this browser (read only)
  function loadDogs() {
    var h = location.hash, list = null;
    if (/(^#|&)p=/.test(h)) {
      var r = P.merchFromHash(h);
      if (r.ok) { list = r.dogs.map(function (d) { return P.merchEncode([d.recipe]); }); ssSet(LINK_KEY, JSON.stringify(list)); }
      else st.linkErr = r.err || 'bad';
      try { history.replaceState(null, '', location.pathname + location.search + '#/pick'); } catch (e) { location.hash = '#/pick'; }
    }
    if (!list) { try { var t = ssGet(LINK_KEY); list = t ? JSON.parse(t) : null; } catch (e) { list = null; } }
    if (Array.isArray(list) && list.length) {
      st.src = 'link';
      st.dogs = list.map(function (s, i) { var d = P.merchDecode(s); return d.ok && d.dogs.length === 1 ? { id: 'l' + i, src: 'link', recipe: d.dogs[0] } : null; }).filter(Boolean);
      if (st.dogs.length) return;
    }
    var json = lsGet(SAVE_KEY);
    if (json) {
      var s = P.merchFromSave(json, { today: new Date() });
      if (s.ok) { st.src = 'save'; st.dogs = s.dogs.map(function (d, i) { return { id: 's' + i, src: 'save', recipe: d.recipe, active: d.active }; }); st.dogs.sort(function (a, b) { return (b.active ? 1 : 0) - (a.active ? 1 : 0); }); return; }
    }
    st.src = 'none'; st.dogs = [];
  }
  function dogById(id) { return st.dogs.concat(READY).filter(function (d) { return d.id === id; })[0] || null; }

  // ---- the basket: lines { id, recipe (merchEncode of one dog, its name as printed), product, colour, size, pose, name_on, qty }
  function loadBasket() {
    var t = lsGet(BASKET_KEY), b = [];
    try { b = t ? JSON.parse(t) : []; } catch (e) { b = []; }
    basket = (Array.isArray(b) ? b : []).filter(function (l) { return l && typeof l.recipe === 'string' && P.merchDecode(l.recipe).ok && PROD[l.product]; }).slice(0, 6);
  }
  function saveBasket() { lsSet(BASKET_KEY, basket.length ? JSON.stringify(basket) : null); $('#bagN').textContent = String(basket.reduce(function (n, l) { return n + l.qty; }, 0)); }
  function apiLine(l) { return { recipe: l.recipe, product: l.product, colour: l.colour, size: l.product === 'tee' ? l.size : null, pose: l.pose, name_on: l.name_on, qty: l.qty }; }
  function recipeOf(l) { return P.merchDecode(l.recipe).dogs[0]; }
  function sameThing(a, b) { return a.recipe === b.recipe && a.product === b.product && a.colour === b.colour && (a.size || '') === (b.size || '') && a.pose === b.pose && a.name_on === b.name_on; }
  function maxLines() { return cat ? cat.max_lines : 6; }
  function maxQty() { return cat ? cat.max_qty : 3; }

  // ---- catalog helpers
  function prodCat(id) { return cat ? cat.products.filter(function (p) { return p.id === id; })[0] || null : null; }
  function colourCat(pid, cid) { var p = prodCat(pid); return p ? p.colours.filter(function (c) { return c.id === cid; })[0] || null : null; }
  function sizeAdd(pid, sid) { var p = prodCat(pid), a = 0; if (p) p.sizes.forEach(function (s) { if (s.id === sid) a = s.add; }); return a; }
  function country() { return cat ? cat.countries.filter(function (c) { return c.code === st.country; })[0] || null : null; }
  function zoneOf(c) { return c && cat ? cat.zones.filter(function (z) { return z.id === c.zone; })[0] || null : null; }
  function placeName(c) { return (THE[c.code] ? 'the ' : '') + c.name; }

  // ---- the print, and the product with the print on it (the preview IS PawPrint.print())
  function printOf(r, o) { try { return P.print(r, { product: o.product, colour: o.colour, pose: o.pose, name: o.name_on ? true : false }); } catch (e) { return P.print(r, { product: o.product, colour: o.colour, pose: o.pose, name: false }); } }
  function hexOf(pid, cid) { var c = (P.PRODUCTS[pid].colours || []).filter(function (x) { return x.id === cid; })[0]; return c ? c.hex : '#FFFFFF'; }
  function mockOf(r, o, label) {
    var pr = printOf(r, o);
    return o.product === 'mug' ? M.mug({ print: pr, label: label }) : M.tee({ print: pr, hex: hexOf('tee', o.colour), label: label });
  }
  function dogPic(r, pose) { var a = P.printArt(r, pose || 'stand'); return M.dog(P.dogSVG(r, { pose: pose || 'stand' }), a.box); }
  function dogName(r) { return r.n || ''; }
  function looksOf(r) {
    var t = [];
    if (r.a === 1) t.push('<span class="w pup">Puppy</span>'); else if (r.a === 2) t.push('<span class="w pup">Newborn</span>');
    var wear = (r.o || []).map(function (i) { return P.WEAR[i].n; }); if (wear.length) t.push('<span class="w">wearing ' + esc(wear.join(', ')) + '</span>');
    return t.join('');
  }

  // ---- shipping words for the chosen country
  function shipLine() {
    var c = country(), z = zoneOf(c);
    if (!c) return 'Choose where it\'s going under <b>Ship to</b>, and the shipping shows here.';
    if (c.soon) return '<b>Coming soon to ' + esc(placeName(c)) + '.</b> We\'re sorting out the tax paperwork first, so we can\'t take orders there yet.';
    if (!z) return '';
    var s = 'Shipping to ' + esc(placeName(c)) + ': <b>' + money(z.fee) + '</b>.';
    if (z.free_from != null) s += ' Orders of ' + money(z.free_from).replace('.00', '') + ' or more ship free.';
    else if (z.extra) s += ' Each extra mug or tee adds ' + money(z.extra) + '.';
    return s;
  }
  function etaLine(eta) { return 'About ' + eta[0] + ' to ' + eta[1] + ' working days to your door: 2 to 5 to print, then the post.'; }

  // ================= views =================
  var ORDER_STEPS = ['pick', 'thing', 'make', 'basket'];
  function show(v, arg) {
    st.view = v;
    $$('.mview').forEach(function (s) { s.classList.toggle('on', s.dataset.view === v); });
    var i = ORDER_STEPS.indexOf(v);
    $('#steps').hidden = i < 0;
    $$('#steps li').forEach(function (li, k) {
      li.className = k < i ? 'done' : k === i ? 'now' : '';
      var b = $('button', li); b.disabled = !(k < i); if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('#crumbs').textContent = i >= 0 ? 'Merch · step ' + (i + 1) + ' of 4' : v === 'order' ? 'Merch · your order' : 'Merch';
    ({ home: rHome, pick: rPick, thing: rThing, make: rMake, basket: rBasket, order: rOrder })[v](arg);
    $$('.dn').forEach(function (e) { e.textContent = st.dog ? (dogName(st.dog.recipe) || 'your ' + breedOf(st.dog.recipe)) : 'your dog'; });
  }
  function route() {
    if (!cat) return;
    var m = /^#\/(\w+)(?:\/([A-Za-z0-9_-]+))?/.exec(location.hash) || [], v = m[1] || 'home', prev = st.view;
    if (!document.querySelector('.mview[data-view="' + v + '"]')) v = 'home';
    if (v === 'thing' && !st.dog) v = 'pick';
    if (v === 'make' && !st.draft) v = st.dog ? 'thing' : 'pick';
    show(v, m[2]);
    if (prev !== v) { // a new step: its top (the shop bar) just under the site's sticky header, so the step itself shows on a phone's first screen
      var top = 0, bar = $('#testbar'), hd = $('#sitehead');
      if (prev && v !== 'home' && bar) top = Math.max(0, bar.getBoundingClientRect().top + window.pageYOffset - (hd ? Math.min(90, hd.offsetHeight) : 0) - 8);
      window.scrollTo(0, top);
      var h = $('.mview.on h1'); if (h && prev) try { h.focus({ preventScroll: true }); } catch (e) { /* old browsers */ }
    }
  }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  // ---- 1. landing
  function rHome() {
    var d = st.dogs[0] || READY[3] || READY[0], r = d.recipe, mine = d.src !== 'ready';
    var T = [['mug', 'sit', 'white'], ['tee', 'stand', 'ice-blue']];
    $('#trio').innerHTML = T.map(function (t) {
      var p = prodCat(t[0]); if (!p) return '';
      return '<li>' + mockOf(r, { product: t[0], colour: t[2], pose: t[1], name_on: mine && !!r.n }, PROD[t[0]].title) + '<span>' + (t[0] === 'mug' ? 'A mug' : 'A tee') + '</span><small>' + (p.sizes.length ? 'from ' : '') + money(p.price) + '</small></li>';
    }).join('');
    $('#homeShip').innerHTML = shipLine();
    readyList($('#readyHome'));
  }
  function readyList(el) {
    el.innerHTML = READY.map(function (d) { return '<li><button type="button" data-dog="' + d.id + '">' + dogPic(d.recipe, 'stand') + '<span>' + esc(breedOf(d.recipe)) + '</span><small>ready-made</small></button></li>'; }).join('');
    $$('[data-dog]', el).forEach(function (b) { b.onclick = function () { pickDog(b.dataset.dog); go('#/thing'); }; });
  }
  function pickDog(id) { st.dog = dogById(id); st.edit = null; st.draft = null; }

  // ---- 2. which dog
  function rPick() {
    var b = $('#pickBody'), L = st.dogs, h = '';
    if (st.linkErr) h += '<div class="from warn"><span class="ic" aria-hidden="true">🔗</span><p><b>That link from the game didn\'t come through whole.</b> Open it again from the game, or pick a dog below.</p></div>';
    if (!L.length) {
      h += '<div class="none">' + dogPic(READY[3] ? READY[3].recipe : READY[0].recipe, 'sit') + '<p class="lead">We can\'t see any of your dogs from here yet.</p>' +
        '<p>Your dogs live in the game. Playing on doodledoggo.app? Open this page in the same browser and they\'re here. Playing somewhere else? The game will get a button that brings them over.</p>' +
        '<p><a class="lnk" href="/">Open the game →</a></p></div>';
      h += '<div class="subh">Or pick a ready-made dog</div><ul class="ready small" id="readyPick"></ul>';
      b.innerHTML = h; readyList($('#readyPick'));
      var n = $('#pickNext'); n.setAttribute('aria-disabled', 'true'); n.removeAttribute('href'); return;
    }
    if (st.src === 'link') h += '<div class="from link"><span class="ic" aria-hidden="true">🔗</span><p><b>' + (L.length === 1 ? 'One dog' : L.length + ' dogs') + ' came with your link from the game.</b> Only how ' + (L.length === 1 ? 'it looks' : 'they look') + ' came along (name, breed, coat, outfit), and only for this tab.</p></div>';
    else h += '<div class="from"><span class="ic" aria-hidden="true">🏡</span><p><b>Here are your dogs from the game in this browser.</b> Each one prints just as it looks today. Want a different outfit? Change it in the game first.</p></div>';
    if (!st.dog || st.dog.src === 'ready' || !dogById(st.dog.id)) st.dog = L[0];
    h += '<ul class="dogs5">' + L.map(function (d) {
      var r = d.recipe;
      return '<li><button type="button" class="dogb" data-pick="' + d.id + '" aria-pressed="' + (st.dog && st.dog.id === d.id) + '">' + (d.active ? '<span class="fav"><span aria-hidden="true">♥</span> playing now</span>' : '') + '<span class="tick" aria-hidden="true">✓</span>' +
        dogPic(r, 'stand') + '<span class="n">' + esc(dogName(r) || 'No name') + '</span><span class="b">' + esc(breedOf(r)) + '</span>' + looksOf(r) + '</button></li>';
    }).join('') + '</ul>';
    h += '<div class="subh">Or a ready-made dog</div><ul class="ready small" id="readyPick"></ul>';
    b.innerHTML = h; readyList($('#readyPick'));
    $$('[data-pick]', b).forEach(function (x) { x.onclick = function () { pickDog(x.dataset.pick); $$('[data-pick]', b).forEach(function (y) { y.setAttribute('aria-pressed', String(y === x)); }); }; });
    var nx = $('#pickNext'); nx.removeAttribute('aria-disabled'); nx.href = '#/thing';
  }

  // ---- 3. the thing
  function rThing() {
    var r = st.dog.recipe, mine = st.dog.src !== 'ready';
    $('#prods').innerHTML = ['mug', 'tee'].filter(prodCat).map(function (k) {
      var p = prodCat(k), o = { product: k, colour: k === 'tee' ? 'white' : 'white', pose: 'stand', name_on: mine && !!r.n };
      return '<li><button type="button" class="prodb" data-p="' + k + '">' + mockOf(r, o, PROD[k].title) +
        '<span class="n">' + PROD[k].name + '</span><span class="p">' + (p.sizes.length ? 'from ' : '') + '<b>' + money(p.price) + '</b></span><span class="d">' + PROD[k].d + '</span></button></li>';
    }).join('');
    $$('.prodb').forEach(function (b) { b.onclick = function () { startDraft(b.dataset.p); go('#/make'); }; });
    $('#thingShip').innerHTML = shipLine();
  }
  function startDraft(pid) {
    var r = st.dog.recipe, mine = st.dog.src !== 'ready', p = prodCat(pid);
    var col = pid === 'tee' ? 'white' : 'white', sizes = colourCat(pid, col).sizes;
    st.edit = null;
    st.draft = { base: r, product: pid, colour: col, size: pid === 'tee' ? (sizes.indexOf('M') >= 0 ? 'M' : sizes[0]) : null, pose: 'stand', name_on: mine && !!r.n, name: r.n || '', qty: 1, p: p };
  }

  // ---- 4. make it yours
  function nameState() { // the name as typed, checked by PawPrint's own rule for this product
    var d = st.draft; if (!d.name_on) return { ok: true, off: true };
    return P.nameOk(d.name, { product: d.product });
  }
  function nameMsg(n) {
    var d = st.draft;
    if (n.off) return { t: 'The ' + PROD[d.product].one + ' prints without a name.', bad: false };
    if (n.ok) return { t: Array.from(n.name).length + ' / 20 letters', bad: false };
    if (n.why === 'empty') return { t: 'Type a name, or turn the name off.', bad: true };
    if (n.why === 'long') return { t: (n.say || 'A little shorter, please') + (n.max ? ': up to ' + n.max + ' of these letters fit on the ' + PROD[d.product].one + '.' : ': up to 20 letters.'), bad: true };
    if (n.why === 'letters') return { t: 'Some of those letters we can\'t draw yet. Letters A to Z (with accents), numbers, spaces and \' - . & ! all work.', bad: true };
    return { t: (n.say || 'Let\'s try another name') + '.', bad: true }; // 'word': no reason given, just kindly
  }
  // the recipe this line prints from: the dog, with the typed name when it is on and good
  function draftRecipe() {
    var d = st.draft, r = Object.assign({}, d.base), n = nameState();
    if (d.name_on && n.ok) r.n = n.name;
    if (r.n !== undefined && !P.check(r).ok) delete r.n;
    return r;
  }
  function draftLine() {
    var d = st.draft, n = nameState(), r = draftRecipe();
    return { recipe: P.merchEncode([r]), product: d.product, colour: d.colour, size: d.product === 'tee' ? d.size : null, pose: d.pose, name_on: !!(d.name_on && n.ok && r.n), qty: d.qty };
  }
  function rMake() {
    var d = st.draft, p = prodCat(d.product), r = draftRecipe(), n = nameState(), tee = d.product === 'tee';
    var o = { product: d.product, colour: d.colour, pose: d.pose, name_on: !!(d.name_on && n.ok) };
    $$('.pn').forEach(function (e) { e.textContent = PROD[d.product].one; });
    // the preview: the print file on the thing, and the file alone
    var pr = printOf(r, o), last = P.print.last || {};
    $('#pvOn').innerHTML = tee ? M.tee({ print: pr, hex: hexOf('tee', d.colour), label: 'Preview: ' + PROD[d.product].title }) : M.mug({ print: pr, label: 'Preview: ' + PROD[d.product].title });
    $('#pvFlat').innerHTML = M.flat({ print: pr, product: d.product, hex: tee ? hexOf('tee', d.colour) : '#FFFFFF', label: 'The print file' }) +
      '<p>' + (tee ? 'The print file: up to 15 × 18 in on the front. Your dog prints about ' + (last.dogIn ? last.dogIn.toFixed(1) : '6') + ' in wide.' : 'The print file: a 9 × 3.5 in wrap, the same dog on both sides, for left and right hands.') + ' Drawn at full size from the game\'s own art, so every line stays sharp.</p>';
    $('#preview').classList.toggle('isflat', st.pv === 'flat');
    $$('[data-pv]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pv === st.pv)); b.onclick = function () { st.pv = b.dataset.pv; rMake(); }; });
    // pose
    $('#poses').innerHTML = POSES.map(function (x) { return '<button type="button" data-pose="' + x[0] + '" aria-pressed="' + (d.pose === x[0]) + '">' + dogPic(d.base, x[0]) + x[1] + '</button>'; }).join('');
    $$('[data-pose]').forEach(function (b) { b.onclick = function () { d.pose = b.dataset.pose; rMake(); }; });
    // name
    var tog = $('#nameTog'), inp = $('#nameIn'), msg = nameMsg(n);
    tog.setAttribute('aria-checked', String(d.name_on)); inp.disabled = !d.name_on;
    if (document.activeElement !== inp) inp.value = d.name;
    inp.placeholder = 'Type a name'; inp.setAttribute('aria-invalid', String(!!msg.bad));
    $('#nameMsg').textContent = msg.t; $('#nameMsg').classList.toggle('bad', !!msg.bad);
    // colour and size (the tee)
    $('#o-col').hidden = !tee; $('#o-size').hidden = !tee;
    if (tee) {
      $('#cols').innerHTML = p.colours.map(function (c) { var C = P.TEE_COLOURS.filter(function (x) { return x.id === c.id; })[0]; return '<button type="button" data-col="' + c.id + '" aria-pressed="' + (d.colour === c.id) + '" aria-label="' + esc(C.name) + '" title="' + esc(C.name) + '"><i style="background:' + C.hex + '"></i></button>'; }).join('');
      var CC = P.TEE_COLOURS.filter(function (x) { return x.id === d.colour; })[0];
      $('#colName').textContent = CC.name; $('#darkNote').hidden = !CC.patch;
      $$('[data-col]').forEach(function (b) { b.onclick = function () { d.colour = b.dataset.col; var s = colourCat('tee', d.colour).sizes; if (s.indexOf(d.size) < 0) d.size = s.indexOf('M') >= 0 ? 'M' : s[0]; rMake(); }; });
      var cs = colourCat('tee', d.colour).sizes;
      $('#sizes').innerHTML = p.sizes.filter(function (s) { return cs.indexOf(s.id) >= 0; }).map(function (s) { return '<button type="button" class="chipb" data-size="' + s.id + '" aria-pressed="' + (d.size === s.id) + '">' + s.id + (s.add ? ' <small>+' + money(s.add).replace('.00', '') + '</small>' : '') + '</button>'; }).join('');
      $$('[data-size]').forEach(function (b) { b.onclick = function () { d.size = b.dataset.size; rMake(); }; });
    }
    // how many, the price, add
    $('#qv').textContent = String(d.qty); $('#qm').disabled = d.qty <= 1; $('#qp').disabled = d.qty >= maxQty();
    $('#qnote').textContent = 'Up to ' + maxQty() + ' of each.';
    var unit = p.price + (tee ? sizeAdd('tee', d.size) : 0);
    $('#amt').innerHTML = money(unit * d.qty) + '<small>' + (d.qty > 1 ? d.qty + ' × ' + money(unit) + ', ' : '') + 'shipping in the basket</small>';
    var add = $('#addBtn'), full = !st.edit && basket.length >= maxLines() && !basket.some(function (l) { return sameThing(l, draftLine()); });
    add.textContent = st.edit ? 'Save changes' : 'Add to basket';
    add.disabled = !!msg.bad || full;
    $('#addMsg').textContent = full ? 'Your basket is full: it holds up to ' + maxLines() + ' things. Change or remove one there to make room.' : msg.bad ? 'Fix the name first, or turn it off.' : '';
    $('#makeBack').href = st.edit ? '#/basket' : '#/thing';
  }
  function addDraft() {
    var l = draftLine();
    if (st.edit) {
      var i = basket.map(function (x) { return x.id; }).indexOf(st.edit);
      if (i >= 0) { l.id = st.edit; basket[i] = l; }
      // the change may make it the same as another line: keep one line, up to the most of each
      var j = basket.findIndex(function (x, k) { return k !== i && sameThing(x, l); });
      if (i >= 0 && j >= 0) { basket[j].qty = Math.min(maxQty(), basket[j].qty + l.qty); basket.splice(i, 1); }
      say('Changed. It\'s in your basket.');
    } else {
      var same = basket.filter(function (x) { return sameThing(x, l); })[0];
      if (same) { var was = same.qty; same.qty = Math.min(maxQty(), same.qty + l.qty); say(same.qty === was ? 'That one is already in your basket, ' + was + ' of it: up to ' + maxQty() + ' of each.' : 'You already had that one: now ' + same.qty + '.'); }
      else { if (basket.length >= maxLines()) return; l.id = 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); basket.push(l); say('Added to your basket.'); }
    }
    st.edit = null; st.draft = null; saveBasket(); requote(); go('#/basket');
  }

  // ---- 5. the basket and pay
  function requote() {
    var n = ++st.qn; st.quote = null; st.qerr = null;
    if (!basket.length || !st.country) { if (st.view === 'basket') rBasket(); return Promise.resolve(); }
    return api.quote({ country: st.country, lines: basket.map(apiLine) }).then(function (q) { if (n !== st.qn) return; st.quote = q; if (st.view === 'basket') rBasket(); },
      function (e) { if (n !== st.qn) return; st.qerr = e || { error: 'busy' }; if (st.view === 'basket') rBasket(); });
  }
  function rBasket() {
    var c = country(), q = st.quote, e = st.qerr;
    $('#closed').hidden = true;
    if (!basket.length) {
      $('#blines').innerHTML = '<li class="empty"><p class="lead">Your basket is empty.</p><p>Pick a dog, then a mug or a tee.</p></li>';
    } else {
      $('#blines').innerHTML = basket.map(function (l, i) {
        var r = recipeOf(l), ql = q && q.lines[i], C = l.product === 'tee' ? P.TEE_COLOURS.filter(function (x) { return x.id === l.colour; })[0] : null;
        var who = dogName(r) ? esc(dogName(r)) + ', ' + esc(breedOf(r)) : 'A ready-made ' + esc(breedOf(r));
        return '<li class="bl card" data-line="' + l.id + '">' + mockOf(r, l, PROD[l.product].title + ': ' + (dogName(r) || breedOf(r))) +
          '<div class="bt"><h3>' + PROD[l.product].title + '</h3><ul class="facts"><li>' + who + '</li><li>' + POSES.filter(function (x) { return x[0] === l.pose; })[0][1] + ' · ' + (l.name_on ? 'name on' : 'no name') + '</li>' +
          (C ? '<li>' + esc(C.name) + ' · ' + esc(l.size) + '</li>' : '') + '</ul>' +
          '<div class="brow"><div class="qty small" role="group" aria-label="How many"><button type="button" data-qm="' + l.id + '" aria-label="One less"' + (l.qty <= 1 ? ' disabled' : '') + '>−</button><output>' + l.qty + '</output><button type="button" data-qp="' + l.id + '" aria-label="One more"' + (l.qty >= maxQty() ? ' disabled' : '') + '>+</button></div>' +
          '<span class="lp" data-lp="' + (i + 1) + '">' + (ql ? money(ql.total) : '') + '</span></div>' +
          '<div class="brow2"><button type="button" class="lnk" data-chg="' + l.id + '">Change</button><button type="button" class="lnk" data-rm="' + l.id + '">Remove</button></div></div></li>';
      }).join('');
    }
    var full = basket.length >= maxLines(), an = $('#another');
    $('#bfull').textContent = full ? 'Your basket holds up to ' + maxLines() + ' things, and up to ' + maxQty() + ' of each. To add another, change or remove one.' : basket.length ? 'Up to ' + maxLines() + ' things in one order, up to ' + maxQty() + ' of each.' : '';
    if (full) { an.setAttribute('aria-disabled', 'true'); an.removeAttribute('href'); } else { an.removeAttribute('aria-disabled'); an.href = '#/pick'; }
    $$('[data-qm]').forEach(function (b) { b.onclick = function () { bump(b.dataset.qm, -1); }; });
    $$('[data-qp]').forEach(function (b) { b.onclick = function () { bump(b.dataset.qp, 1); }; });
    $$('[data-rm]').forEach(function (b) { b.onclick = function () { remove(b.dataset.rm); }; });
    $$('[data-chg]').forEach(function (b) { b.onclick = function () { change(b.dataset.chg); }; });
    // ship to and the totals
    var z = zoneOf(c), sb = '<div class="lg">Shipping</div><p class="shipline">' + shipLine() + '</p>';
    if (c && !c.soon && q) sb += '<p class="eta"><span aria-hidden="true">📦</span><span>' + etaLine(q.eta) + '</span></p>';
    $('#shipBox').innerHTML = sb;
    var t = '';
    if (basket.length && q) {
      t += '<table class="lines" id="qtable"><tr><td>Things (' + basket.reduce(function (n, l) { return n + l.qty; }, 0) + ')</td><td data-q="subtotal">' + money(q.subtotal) + '</td></tr>' +
        '<tr><td>Shipping</td><td data-q="ship">' + (q.ship_fee ? money(q.ship_fee) : 'Free') + '</td></tr>' +
        '<tr class="tot"><td>Total</td><td data-q="total">' + money(q.total) + '</td></tr></table>';
      if (q.free_from != null) t += '<p class="small2 left">Orders of ' + money(q.free_from).replace('.00', '') + ' or more ship free.</p>';
      t += '<p class="small2 left">Prices are in US dollars. When you pay you can choose your own currency, at Stripe\'s rate (it includes a small conversion fee), or pay in US dollars.</p>';
      q.notes.forEach(function (k) { if (NOTE[k]) t += '<p class="small2 left note-' + k + '">' + NOTE[k] + '</p>'; });
    } else if (basket.length && e) {
      t += '<p class="qerr">' + (e.error === 'country_closed' ? 'Choose another place under <b>Ship to</b> to see the shipping and the total.' : e.error === 'bad_name' ? 'One name can\'t print as it is: tap Change on that line.' : e.error === 'bad_line' ? 'One line needs a look: tap Change on it.' : 'We couldn\'t work out the total just now. Try again in a moment.') + '</p>';
    } else if (basket.length && !c) t += '<p class="qerr">Choose where it\'s going under <b>Ship to</b> to see the shipping and the total.</p>';
    else if (basket.length) t += '<p class="qerr">Working out the total…</p>';
    $('#totals').innerHTML = t;
    $('#payBtn').disabled = !(basket.length && q);
  }
  function bump(id, k) { basket.forEach(function (l) { if (l.id === id) l.qty = Math.max(1, Math.min(maxQty(), l.qty + k)); }); saveBasket(); requote(); rBasket(); }
  function remove(id) {
    var l = basket.filter(function (x) { return x.id === id; })[0]; if (!l) return;
    basket = basket.filter(function (x) { return x.id !== id; }); saveBasket(); say('Removed the ' + PROD[l.product].one + '.'); requote(); rBasket();
  }
  function change(id) {
    var l = basket.filter(function (x) { return x.id === id; })[0]; if (!l) return;
    var r = recipeOf(l), base = Object.assign({}, r);
    st.dog = { id: 'b-' + id, src: 'basket', recipe: base };
    st.draft = { base: base, product: l.product, colour: l.colour, size: l.size, pose: l.pose, name_on: l.name_on, name: r.n || '', qty: l.qty };
    st.edit = id; go('#/make');
  }
  function nonce() { var a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(a) : a.forEach(function (x, i) { a[i] = Math.random() * 256; }); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function payBody() { return { country: st.country, lines: basket.map(apiLine), expect_total: st.quote.total, art_ver: P.ART_VER, nonce: nonce(), agree: true, lang: 'en' }; }
  function pay() {
    if (!st.quote || !basket.length) return;
    var btn = $('#payBtn'); btn.disabled = true;
    api.checkout(payBody()).then(function () {
      // only a live build gets here; this build never opens a payment page
      closedCard('');
    }, function (e) {
      e = e || {};
      if (e.error === 'price_changed' && e.quote) { st.quote = e.quote; rBasket(); closedCard('The total changed a moment ago: it is updated above.'); return; }
      if (e.error === 'merch_closed') { closedCard(''); return; }
      closedCard(e.error === 'country_closed' ? 'We can\'t take orders to that place yet.' : e.error === 'bad_name' || e.error === 'bad_line' ? 'One line needs a look: tap Change on it.' : '');
    }).then(function () { btn.disabled = !(basket.length && st.quote); });
  }
  function closedCard(why) {
    var c = $('#closed'); c.hidden = false; $('#closedWhy').textContent = why || 'When the shop opens, this button takes you to Stripe\'s secure page to pay.';
    $('#demoRow').hidden = !DEMO; try { c.focus({ preventScroll: false }); } catch (e) { c.focus(); }
  }
  function demoPay() {
    if (!DEMO || !st.quote) return;
    api.demoPay(payBody()).then(function (r) { basket = []; saveBasket(); st.quote = null; go('#/order/' + r.order); }, function () { closedCard('That didn\'t work this time.'); });
  }

  // ---- 6. thank you / the order page (test orders only in this build)
  function rOrder(id) {
    var b = $('#orderBody');
    if (!id) { b.innerHTML = '<p class="lead">No order to show.</p>'; return; }
    b.innerHTML = '<p class="lead">Finding your order…</p>';
    api.order(id).then(function (o) { st.order = o; drawOrder(o); }, function () { b.innerHTML = '<div class="thanks"><h1 class="mh2" tabindex="-1">We can\'t find that order</h1><p class="lead">Check the link in your email, or write to us: contact@doodledoggo.app.</p><div class="navrow"><a class="btn mint" href="#/">Back to the shop</a></div></div>'; });
  }
  function drawOrder(o) {
    var b = $('#orderBody'), at = new Date(o.cancel_until), hm = ('0' + at.getHours()).slice(-2) + ':' + ('0' + at.getMinutes()).slice(-2), cancelled = o.status === 'cancelled';
    var first = o.lines[0] ? recipeOf(o.lines[0]) : null;
    var S = [['✓', 'Order received', 'Today. Your receipt is in your email.'], ['🖨', 'Being printed', 'At our print partner, in 2 to 5 working days.'], ['🚚', 'On its way', 'You get an email with a tracking link.'], ['🏠', 'Arrived', 'Say hello to your dog, in real life.']];
    var h = (o.test ? '<p class="testtag">Test order: made up to show this page. Nothing was paid and nothing will be printed.</p>' : '') +
      '<div class="thanks">' + (first ? dogPic(first, 'happy') : '') + '<h1 class="mh2" id="h-order-t" tabindex="-1">' + (cancelled ? 'Your order is cancelled' : 'Thank you! Your order is in.') + '</h1>' +
      '<p class="lead"><span class="ordnum">Order ' + esc(o.id.replace(/^mo_/, '')) + '</span><br>' + (cancelled ? 'Nothing will be printed. Your refund is on its way: it shows on your card in 5 to 10 days.' : 'A receipt is on its way to your email.') + '</p></div>';
    if (!cancelled) h += '<div class="cancelbox card"><p>We\'ll start printing at <b>' + hm + '</b>. If you change your mind before then, you can cancel here.</p>' + (o.can_cancel ? '<button type="button" class="btn quiet" id="cancelBtn">Cancel my order</button>' : '') + '</div>';
    h += '<div class="order"><div class="card"><h2 class="h2s">Where is it now?</h2><ol class="track">' + S.map(function (s, i) {
      var c = cancelled ? 'later' : i === 0 ? 'now' : 'later'; return '<li class="' + c + '"><span class="dot" aria-hidden="true">' + s[0] + '</span><span><b>' + s[1] + '</b><span>' + s[2] + '</span></span></li>';
    }).join('') + '</ol><p class="note">This page is your order page: bookmark it, or use the link in your email.</p></div><div>';
    h += '<ul class="blines">' + o.lines.map(function (l) {
      var r = recipeOf(l), C = l.product === 'tee' ? P.TEE_COLOURS.filter(function (x) { return x.id === l.colour; })[0] : null;
      return '<li class="bl card">' + mockOf(r, l, PROD[l.product].title) + '<div class="bt"><h3>' + PROD[l.product].title + '</h3><ul class="facts"><li>' + esc(dogName(r) || 'A ready-made ' + breedOf(r)) + '</li>' + (C ? '<li>' + esc(C.name) + ' · ' + esc(l.size) + '</li>' : '') + '<li>How many: ' + l.qty + '</li></ul><span class="lp">' + money(l.unit * l.qty) + '</span></div></li>';
    }).join('') + '</ul><table class="lines"><tr><td>Things</td><td>' + money(o.totals.subtotal) + '</td></tr><tr><td>Shipping</td><td>' + (o.totals.ship_fee ? money(o.totals.ship_fee) : 'Free') + '</td></tr><tr class="tot"><td>Total</td><td>' + money(o.totals.total) + '</td></tr>' + (o.totals.refunded ? '<tr><td>Refunded</td><td>' + money(o.totals.refunded) + '</td></tr>' : '') + '</table>';
    h += '<p class="small2 left">Something wrong when it arrives? Reply to the order email with a photo and we\'ll make it right.</p><div class="navrow"><a class="btn mint" href="#/pick">Put another dog on something</a></div></div></div>';
    b.innerHTML = h;
    var cb = $('#cancelBtn'); if (cb) cb.onclick = function () { $('#cancelDlg').showModal(); };
  }

  // ---- "Ship to": a guess from the browser's language, then the buyer's own choice (kept)
  function fillShip() {
    var sel = $('#shipSel'), saved = lsGet(SHIP_KEY), guess = '';
    try { var a = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']; for (var i = 0; i < a.length && !guess; i++) { var m = /-([A-Za-z]{2})\b/.exec(String(a[i])); if (m) guess = m[1].toUpperCase(); } } catch (e) { guess = ''; }
    var has = function (c) { return cat.countries.some(function (x) { return x.code === c; }); };
    st.country = saved && has(saved) ? saved : has(guess) ? guess : 'US';
    sel.innerHTML = cat.countries.map(function (c) { return '<option value="' + c.code + '"' + (c.code === st.country ? ' selected' : '') + '>' + esc(c.name) + (c.soon ? ' (coming soon)' : '') + '</option>'; }).join('');
    sel.onchange = function () { st.country = sel.value; lsSet(SHIP_KEY, st.country); requote(); if (st.view === 'home' || st.view === 'thing') $$('.mview.on .shipline').forEach(function (p) { p.innerHTML = shipLine(); }); if (st.view === 'basket') rBasket(); };
  }

  function say(t) { var l = $('#live'); l.textContent = ''; setTimeout(function () { l.textContent = t; }, 30); }

  // ---- controls outside the views
  $('#nameTog').onclick = function () { var d = st.draft; d.name_on = !d.name_on; if (d.name_on && !d.name) d.name = d.base.n || ''; rMake(); if (d.name_on && !d.name) $('#nameIn').focus(); };
  $('#nameIn').oninput = function (e) { st.draft.name = String(e.target.value).slice(0, 40); rMake(); };
  $('#qm').onclick = function () { st.draft.qty = Math.max(1, st.draft.qty - 1); rMake(); };
  $('#qp').onclick = function () { st.draft.qty = Math.min(maxQty(), st.draft.qty + 1); rMake(); };
  $('#addBtn').onclick = addDraft;
  $('#payBtn').onclick = pay;
  $('#demoBtn').onclick = demoPay;
  $('#cancelNo').onclick = function () { $('#cancelDlg').close(); };
  $('#cancelYes').onclick = function () { $('#cancelDlg').close(); var o = st.order; if (!o) return; api.cancel(o.id, { scope: 'order' }).then(function () { return api.order(o.id); }).then(function (x) { st.order = x; drawOrder(x); say('Your order is cancelled.'); }, function () { say('It\'s too late to cancel: printing has started.'); }); };
  $('#sgBtn').onclick = function () {
    var cs = colourCat('tee', st.draft.colour).sizes;
    $('#sgt').innerHTML = '<tr><td><b>Size</b></td><td><b>Chest, flat</b></td></tr>' + cs.map(function (s) { var w = WIDTH[s]; return '<tr><td>' + s + '</td><td>' + w + ' in · ' + Math.round(w * 2.54) + ' cm</td></tr>'; }).join('');
    $('#sizeg').showModal();
  };
  $('#sgClose').onclick = function () { $('#sizeg').close(); };
  $$('#steps li').forEach(function (li) { $('button', li).onclick = function () { if (li.classList.contains('done')) go('#/' + li.dataset.s); }; });
  $('#pickNext').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
  $('#another').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
  document.addEventListener('click', function (e) { var m = $('#langs'); if (m && m.open && !m.contains(e.target)) m.open = false; });
  window.addEventListener('hashchange', route);
  window.addEventListener('storage', function (e) { if (e.key === BASKET_KEY) { loadBasket(); saveBasket(); requote(); if (st.view === 'basket') rBasket(); } });

  // ---- start
  loadDogs(); loadBasket();
  $('#bagN').textContent = String(basket.reduce(function (n, l) { return n + l.qty; }, 0));
  api.catalog().then(function (c) {
    cat = c; $('#loading').hidden = true; document.documentElement.classList.add('merch-ready');
    fillShip(); requote(); route();
  }, function () { $('#loading').textContent = 'The shop couldn\'t load just now. Try again in a moment.'; });

  // hooks for the tests (merch/test_page.js) and the screenshots
  window.__merch = { st: st, api: api, basket: function () { return basket; }, cat: function () { return cat; }, go: go, requote: requote, READY: READY };
})();
