/* Doodle Doggo /merch: "Put your dog on a mug", TEST MODE (docs/design/merch/PART2.md).
   The six steps: 1 the landing, 2 which dog, 3 the thing (mug or tee), 4 make it yours, 5 the basket and pay, 6 the thank-you / order page.
   Every preview is PawPrint.print() itself laid on a drawn product (mock.js). All server talk goes through api (api.js; in test mode the
   local fake, api_fake.js). The game's save is only ever read. The basket and the "Ship to" choice are kept under their own keys in
   localStorage, dogs from a link in sessionStorage (this tab only): both are conveniences, and the page works without them.
   Nothing read from storage, a link, the save or the server is trusted: a stored basket is checked line by line against the catalog and
   PawPrint (cleanBasket), and every piece of text that goes into the page is escaped (esc) or set as textContent. */
(function () {
  'use strict';
  var P = window.PawPrint, M = window.MerchMock;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = M.esc, Q = new URLSearchParams(location.search);
  var SAVE_KEY = 'pawhaven_proto_v1', BASKET_KEY = 'dd_merch_basket_v1', SHIP_KEY = 'dd_merch_ship_v1', LINK_KEY = 'dd_merch_link_v1';
  var ss = null; try { ss = window.sessionStorage; } catch (e) { ss = null; }
  var api = window.MerchApi.make({ demo: Q.get('demo') === '1', store: ss });
  // the made-up thank-you page is for test mode only: with a live MERCH_API there is no demoPay, and no button for it
  var DEMO = Q.get('demo') === '1' && api.mode === 'test' && typeof api.demoPay === 'function';
  var LANG = document.documentElement.lang || 'en';

  // ---- words
  var BREED = { shiba: 'Shiba Inu', corgi: 'Corgi', golden: 'Golden Retriever', dachs: 'Dachshund', husky: 'Husky', mutt: 'Shelter Mutt', chihuahua: 'Chihuahua', pug: 'Pug',
    greyhound: 'Greyhound', beagle: 'Beagle', poodle: 'Miniature Poodle', collie: 'Border Collie', samoyed: 'Samoyed', frenchie: 'French Bulldog', akita: 'Akita', spitz: 'Japanese Spitz',
    pom: 'Pomeranian', afghan: 'Afghan Hound', dane: 'Great Dane', mastiff: 'English Mastiff', gsd: 'German Shepherd', dobie: 'Doberman', corso: 'Cane Corso', pitbull: 'Pit Bull',
    minpin: 'Miniature Pinscher', lab: 'Labrador Retriever', malamute: 'Alaskan Malamute', chow: 'Chow Chow', stdpoodle: 'Standard Poodle', schnauzer: 'Miniature Schnauzer',
    westie: 'West Highland White Terrier', yorkie: 'Yorkshire Terrier', bichon: 'Bichon Frise', maltese: 'Maltese', shihtzu: 'Shih Tzu', dalmatian: 'Dalmatian',
    bernese: 'Bernese Mountain Dog', aussie: 'Australian Shepherd', cavalier: 'Cavalier King Charles Spaniel', jrt: 'Jack Russell Terrier' };
  var breedOf = function (r) { var k = P.BREEDS[r.b]; return BREED[k] || (k ? k.charAt(0).toUpperCase() + k.slice(1) : 'Dog'); };
  var THE = { US: 1, GB: 1, NL: 1, PH: 1, AE: 1, BS: 1, GM: 1, DO: 1, CF: 1, KY: 1, FO: 1, FK: 1, MV: 1, SB: 1, TC: 1, VG: 1, CK: 1, SC: 1, KM: 1, CZ: 1, MH: 1, VA: 1 };
  var POSES = [['stand', 'Stand'], ['sit', 'Sit'], ['happy', 'Happy']], POSE_NAME = { stand: 'Stand', sit: 'Sit', happy: 'Happy' };
  var PROD = { mug: { name: 'Mug', one: 'mug', title: 'Mug with your dog', d: '11 oz white ceramic mug. Your dog on both sides, for left and right hands.' },
    tee: { name: 'Tee', one: 'tee', title: 'Tee with your dog', d: 'Soft cotton tee, unisex adult sizes. Your dog on the front.' } };
  // the catalog and the quote carry short codes (TRANSACTIONS.md 6.3, note of 24 Nov 2026); the words live here, so they can be translated
  var NOTE = { import_tax: 'Your country may charge import tax or a fee when it arrives. It isn\'t included in this price, and it\'s paid to the delivery company.',
    separate_parcels: 'Mugs and tees travel in their own parcels, so they may arrive on different days.',
    vat_included: 'Prices include VAT.' };
  var CONTACT = 'contact@doodledoggo.app';
  var num = function (x) { return typeof x === 'number' && isFinite(x) ? x : 0; };
  var money = function (c) { return '$' + (num(c) / 100).toFixed(2); };
  var WIDTH = { XS: 16.5, S: 18, M: 20, L: 22, XL: 24, '2XL': 26, '3XL': 28, '4XL': 30, '5XL': 32 }; // Bella+Canvas 3001, flat (PRINT_FILES.md)
  var NOSAY = 'We can\'t draw these letters yet. Print without the name, or type one we can draw.';

  // ---- country names: the catalog has codes only; the page names them in its own language (the code when the browser can't)
  var DN = null; try { DN = new Intl.DisplayNames([LANG], { type: 'region' }); } catch (e) { DN = null; }
  var CNAME = {};
  function cname(code) {
    if (CNAME[code]) return CNAME[code];
    var n = ''; try { n = DN ? DN.of(code) : ''; } catch (e) { n = ''; }
    return (CNAME[code] = n && n !== 'Unknown Region' ? n : code);
  }

  // ---- storage: every read and write may fail (private windows, blocked storage); the page works without it
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (e) { /* fine */ } }
  function ssGet(k) { try { return ss ? ss.getItem(k) : null; } catch (e) { return null; } }
  function ssSet(k, v) { try { if (ss) { if (v == null) ss.removeItem(k); else ss.setItem(k, v); } } catch (e) { /* fine */ } }

  // a dog's own name from the game, for showing only (never printed, never sent): no control or invisible characters, at most 40 letters
  function cleanWho(s) {
    if (typeof s !== 'string' || s.length > 400) return '';
    var t = s; try { t = t.normalize('NFC'); } catch (e) { /* old browsers */ }
    t = t.replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u061C\u180E\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
    return Array.from(t).slice(0, 40).join('');
  }

  // ---- the ready-made dogs (no name: the buyer may type one)
  var READY = [['lab', 'ready-lab', 'm'], ['frenchie', 'ready-frenchie', 'f'], ['golden', 'ready-golden', 'f'], ['dachs', 'ready-dachs', 'm']].map(function (x, i) {
    return { id: 'r' + i, src: 'ready', name: '', recipe: { v: 1, b: P.BREEDS.indexOf(x[0]), g: null, e: 0, p: P.hashId(x[1]), a: 0, s: x[2] } };
  }).filter(function (d) { return d.recipe.b >= 0 && P.check(d.recipe).ok; });

  // ---- state
  var cat = null, st = { src: 'none', dogs: [], linkErr: null, dog: null, draft: null, edit: null, pv: 'on', country: '', quote: null, qerr: null, qn: 0, order: null, view: '',
    dropped: 0, payErr: null, nonce: '', nonceKey: '' };
  var basket = [], idN = 0;
  function newId() { idN++; return 'l' + idN.toString(36) + Math.random().toString(36).slice(2, 6); }

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
      st.dogs = list.slice(0, 20).map(function (s, i) { var d = P.merchDecode(s); return d.ok && d.dogs.length === 1 ? { id: 'l' + i, src: 'link', recipe: d.dogs[0], name: d.dogs[0].n || '' } : null; }).filter(Boolean);
      if (st.dogs.length) return;
    }
    var json = lsGet(SAVE_KEY);
    if (json) {
      var today = new Date(), s = P.merchFromSave(json, { today: today });
      if (s.ok) {
        var names = gameNames(json, s.dogs, today);
        st.src = 'save'; st.dogs = s.dogs.map(function (d, i) { return { id: 's' + i, src: 'save', recipe: d.recipe, active: d.active, name: names[i] || d.recipe.n || '' }; });
        st.dogs.sort(function (a, b) { return (b.active ? 1 : 0) - (a.active ? 1 : 0); }); return;
      }
    }
    st.src = 'none'; st.dogs = [];
  }
  // each dog's own name as the game has it, even when the print font can't draw it (PawPrint leaves such a name out of the recipe):
  // the save's dogs are walked the way merchFromSave walks them, and a name is kept only where the recipe matches
  function gameNames(json, dogs, today) {
    var out = [];
    try {
      var s = JSON.parse(json), many = Array.isArray(s.dogs) && s.dogs.length > 0, k = 0;
      var raw = many ? s.dogs : s.dog && typeof s.dog === 'object' ? [Object.assign({}, s.dog, s.outfit ? { outfit: s.outfit } : {})] : []; // a v1.0-v1.3 save: one dog
      raw = raw.slice(0, 64); // merchFromSave reads the first SAVE_DOGS (64) dogs only
      for (var i = 0; i < raw.length && k < dogs.length; i++) {
        var r = null; try { r = P.merchRecipe(raw[i], { today: today }); } catch (e) { r = null; }
        if (!r || !P.check(r).ok) continue;
        out[k] = JSON.stringify(r) === JSON.stringify(dogs[k].recipe) && raw[i] ? cleanWho(raw[i].name) : ''; k++;
      }
    } catch (e) { /* names stay as PawPrint has them */ }
    return out;
  }
  function dogById(id) { return st.dogs.concat(READY).filter(function (d) { return d.id === id; })[0] || null; }

  // ---- catalog helpers (the page offers a product only when the catalog has it on AND PawPrint has it on sale: no stickers)
  function prodCat(id) { return cat && typeof id === 'string' ? cat.products.filter(function (p) { return p.id === id; })[0] || null : null; }
  function colourCat(pid, cid) { var p = prodCat(pid); return p && typeof cid === 'string' ? p.colours.filter(function (c) { return c.id === cid; })[0] || null : null; }
  function sizeAdd(pid, sid) { var p = prodCat(pid), a = 0; if (p) p.sizes.forEach(function (s) { if (s.id === sid) a = num(s.add); }); return a; }
  function country() { return cat ? cat.countries.filter(function (c) { return c.code === st.country; })[0] || null : null; }
  function zoneOf(c) { return c && cat ? cat.zones.filter(function (z) { return z.id === c.zone; })[0] || null : null; }
  function placeName(c) { return (THE[c.code] ? 'the ' : '') + cname(c.code); }
  function maxLines() { return cat && cat.max_lines > 0 ? cat.max_lines : 6; }
  function maxQty() { return cat && cat.max_qty > 0 ? cat.max_qty : 3; }
  function useCatalog(c) {
    var arr = function (x) { return Array.isArray(x) ? x : []; };
    cat = { cat_ver: c.cat_ver, shut: !!c.shut, sold_out_today: !!c.sold_out_today, max_lines: num(c.max_lines) || 6, max_qty: num(c.max_qty) || 3, art_vers: arr(c.art_vers),
      products: arr(c.products).filter(function (p) { return p && p.on === true && PROD[p.id] && P.PRODUCTS[p.id] && P.PRODUCTS[p.id].launch === true; }).map(function (p) {
        return { id: p.id, price: num(p.price), poses: arr(p.poses).filter(function (x) { return POSE_NAME[x]; }), sizes: arr(p.sizes).filter(function (s) { return s && typeof s.id === 'string'; }),
          colours: arr(p.colours).filter(function (x) { return x && typeof x.id === 'string'; }).map(function (x) { return { id: x.id, sizes: arr(x.sizes).filter(function (s) { return typeof s === 'string'; }) }; }) };
      }),
      zones: arr(c.zones).filter(function (z) { return z && typeof z.id === 'string'; }),
      countries: arr(c.countries).filter(function (x) { return x && typeof x.code === 'string' && /^[A-Z]{2}$/.test(x.code) && typeof x.zone === 'string'; })
        .map(function (x) { return { code: x.code, zone: x.zone, soon: x.soon === true }; }) };
    var col = null; try { col = new Intl.Collator(LANG); } catch (e) { col = null; }
    cat.countries.sort(function (a, b) { var x = cname(a.code), y = cname(b.code); return col ? col.compare(x, y) : x < y ? -1 : x > y ? 1 : 0; });
  }

  // ---- the basket: lines { id (this page only), recipe (merchEncode of one dog, its name as printed), product, colour, size, pose, name_on, qty,
  //      who (the dog's own game name, shown only), ready (a ready-made dog) }. A stored basket is untrusted: every field is checked here.
  function cleanLine(l) {
    if (!l || typeof l !== 'object' || Array.isArray(l)) return null;
    var p = prodCat(l.product); if (!p) return null;
    if (typeof l.recipe !== 'string') return null;
    var d = P.merchDecode(l.recipe); if (!d.ok || d.dogs.length !== 1) return null;
    var col = colourCat(l.product, l.colour); if (!col) return null;
    var size = null;
    if (p.sizes.length) { if (typeof l.size !== 'string' || col.sizes.indexOf(l.size) < 0 || !p.sizes.some(function (s) { return s.id === l.size; })) return null; size = l.size; }
    else if (l.size != null && l.size !== '') return null;
    if (typeof l.pose !== 'string' || p.poses.indexOf(l.pose) < 0) return null;
    if (typeof l.name_on !== 'boolean') return null;
    var r = d.dogs[0];
    if (l.name_on && !(r.n && P.nameOk(r.n, { product: l.product }).ok)) return null;
    var q = typeof l.qty === 'number' ? l.qty : typeof l.qty === 'string' && /^\s*\d{1,3}\s*$/.test(l.qty) ? +l.qty : NaN;
    if (!isFinite(q)) return null;
    q = Math.max(1, Math.min(maxQty(), Math.round(q)));
    try { P.print(r, { product: l.product, colour: l.colour, pose: l.pose, name: l.name_on }); } catch (e) { return null; } // it must draw, with this build
    return { recipe: l.recipe, product: l.product, colour: l.colour, size: size, pose: l.pose, name_on: l.name_on, qty: q, who: cleanWho(l.who), ready: l.ready === true };
  }
  // -> { lines, dropped }: bad lines dropped, quantities repaired, the same thing twice merged, at most max_lines
  function cleanBasket(text) {
    var b = null, out = [], dropped = 0;
    if (text == null || text === '') return { lines: [], dropped: 0 };
    if (typeof text !== 'string' || text.length > 200000) return { lines: [], dropped: 1 };
    try { b = JSON.parse(text); } catch (e) { return { lines: [], dropped: 1 }; }
    if (!Array.isArray(b)) return { lines: [], dropped: 1 };
    b.slice(0, 50).forEach(function (raw) {
      var l = null; try { l = cleanLine(raw); } catch (e) { l = null; }
      if (!l) { dropped++; return; }
      var same = out.filter(function (x) { return sameThing(x, l); })[0];
      if (same) { same.qty = Math.min(maxQty(), same.qty + l.qty); return; }
      if (out.length >= maxLines()) { dropped++; return; }
      out.push(l);
    });
    if (b.length > 50) dropped += b.length - 50;
    return { lines: out, dropped: dropped };
  }
  // fresh ids on every read; a line that is still the same thing as one on the page keeps that one's id (so "Change" in this tab still finds it)
  function readBasket(keep) {
    var res = cleanBasket(lsGet(BASKET_KEY)), taken = {};
    res.lines.forEach(function (l) {
      var was = (keep || []).filter(function (x) { return !taken[x.id] && sameThing(x, l); })[0];
      l.id = was ? was.id : newId(); taken[l.id] = 1;
    });
    return res;
  }
  function storeLine(l) { var o = { recipe: l.recipe, product: l.product, colour: l.colour, size: l.size, pose: l.pose, name_on: l.name_on, qty: l.qty }; if (l.who) o.who = l.who; if (l.ready) o.ready = true; return o; }
  function saveBasket() { lsSet(BASKET_KEY, basket.length ? JSON.stringify(basket.map(storeLine)) : null); updateBag(); }
  function itemCount() { return basket.reduce(function (n, l) { return n + l.qty; }, 0); }
  function updateBag() {
    var n = itemCount(); $('#bagN').textContent = String(n);
    $('#bagBtn').setAttribute('aria-label', n ? 'Basket, ' + n + (n === 1 ? ' thing' : ' things') : 'Basket, empty');
  }
  function apiLine(l) { return { recipe: l.recipe, product: l.product, colour: l.colour, size: l.product === 'tee' ? l.size : null, pose: l.pose, name_on: l.name_on, qty: l.qty }; }
  function recipeOf(l) { var d = typeof l.recipe === 'string' ? P.merchDecode(l.recipe) : { ok: false }; return d.ok && d.dogs.length === 1 ? d.dogs[0] : null; }
  function sameThing(a, b) { return a.recipe === b.recipe && a.product === b.product && a.colour === b.colour && (a.size || '') === (b.size || '') && a.pose === b.pose && a.name_on === b.name_on; }
  function basketChanged() { st.dropped = 0; }

  // ---- the print, and the product with the print on it (the preview IS PawPrint.print())
  function printOf(r, o) { try { return P.print(r, { product: o.product, colour: o.colour, pose: o.pose, name: o.name_on ? true : false }); } catch (e) { return P.print(r, { product: o.product, colour: o.colour, pose: o.pose, name: false }); } }
  function hexOf(pid, cid) { var c = (P.PRODUCTS[pid].colours || []).filter(function (x) { return x.id === cid; })[0]; return c ? c.hex : '#FFFFFF'; }
  function mockOf(r, o, label) {
    var pr = r ? printOf(r, o) : '';
    return o.product === 'mug' ? M.mug({ print: pr, label: label }) : M.tee({ print: pr, hex: hexOf('tee', o.colour), label: label });
  }
  function dogPic(r, pose) { var a = P.printArt(r, pose || 'stand'); return M.dog(P.dogSVG(r, { pose: pose || 'stand' }), a.box); }
  function shownName(d) { return d ? d.name || d.recipe.n || '' : ''; }
  function looksOf(r) {
    var t = [];
    if (r.a === 1) t.push('<span class="w pup">Puppy</span>'); else if (r.a === 2) t.push('<span class="w pup">Newborn</span>');
    var wear = (r.o || []).map(function (i) { return P.WEAR[i].n; }); if (wear.length) t.push('<span class="w">wearing ' + esc(wear.join(', ')) + '</span>');
    return t.join('');
  }
  // who is on a basket line, in words: the printed name, else the dog's own name from the game, else its breed
  function whoOf(l, r) {
    var b = breedOf(r);
    if (l.name_on && r.n) return r.n + ', ' + b;
    if (l.who) return l.who + ', ' + b;
    if (r.n) return r.n + ', ' + b;
    return (l.ready ? 'A ready-made ' : 'Your ') + b;
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
  function etaLine(eta) { return Array.isArray(eta) && eta.length === 2 ? 'About ' + num(eta[0]) + ' to ' + num(eta[1]) + ' working days to your door: 2 to 5 to print, then the post.' : ''; }

  // ---- what an error from the order server means, in plain words (TRANSACTIONS.md 6.3). -> { t (html), line (1-based, or 0), reload }
  function errInfo(e) {
    e = e || {}; var c = String(e.error || 'busy'), n = typeof e.line === 'number' && e.line >= 1 && e.line <= basket.length && e.line % 1 === 0 ? e.line : 0;
    var place = country() ? esc(placeName(country())) : 'that place', mark = n ? ' (marked below)' : '';
    var T = {
      art_changed: 'We\'ve improved the drawing since you opened this page. Reload to see your dog as it will print.',
      sold_out_today: 'So many orders came in today that we can\'t take more until tomorrow. Your basket stays right here.',
      variant_off: 'One thing in your basket' + mark + ' can\'t be made just now. Remove it, or tap Change and pick another colour or size.',
      slow_down: 'That was a lot of tries in a short time. Wait a minute, then try again.',
      busy: 'We\'re a little busy just now. Try again in a moment.',
      cant_make: 'We can\'t make this order just now, and nothing was paid. Try again later, or write to us at ' + CONTACT + '.',
      bad_qty: 'One thing in your basket' + mark + ' has more than we can make: up to ' + maxQty() + ' of each. Change it on that line.',
      too_many: 'Your basket holds up to ' + maxLines() + ' things. Remove one to go on.',
      country_closed: 'We can\'t send orders to ' + place + ' yet. Choose another place under <b>Ship to</b>.',
      bad_country: 'We don\'t know that place. Choose it again under <b>Ship to</b>.',
      bad_line: 'One thing in your basket' + mark + ' needs a look: tap Change on it.',
      bad_name: 'One name in your basket' + mark + ' can\'t print as it is: tap Change on that line to fix it, or turn the name off.',
      not_available: 'We can\'t take this order here. Write to us at ' + CONTACT + ' and we\'ll help.',
      no_agree: 'Something went wrong on our side. Reload the page and try again.',
      merch_closed: 'The shop is not open yet, so nothing can be paid.',
      offline: 'We couldn\'t reach the shop. Check your connection, then try again.'
    };
    if (c === 'price_changed') return { t: 'The total changed a moment ago: it\'s now <b>' + money(st.quote ? st.quote.total : 0) + '</b>. Check it above, then tap Pay again if it\'s right.', line: 0, code: c };
    return { t: T[c] || 'We couldn\'t work out the total just now. Try again in a moment.', line: /^(bad_line|bad_name|bad_qty|variant_off)$/.test(c) ? n : 0, reload: c === 'art_changed', code: c };
  }
  function errHTML(i) { return '<span class="errt" data-err="' + esc(i.code) + '">' + i.t + '</span>' + (i.reload ? ' <button type="button" class="btn quiet" data-reload>Reload</button>' : ''); }

  // ================= views =================
  var ORDER_STEPS = ['pick', 'thing', 'make', 'basket'];
  function show(v, arg) {
    st.view = v;
    $$('.mview').forEach(function (s) { s.classList.toggle('on', s.dataset.view === v); });
    var i = ORDER_STEPS.indexOf(v);
    $('#steps').hidden = i < 0;
    $('#shipTo').classList.toggle('off', v === 'order'); // the order page has its own country: no picker there
    $$('#steps li').forEach(function (li, k) {
      li.className = k < i ? 'done' : k === i ? 'now' : '';
      var b = $('button', li); b.disabled = !(k < i); if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    $('#crumbs').textContent = i >= 0 ? 'Merch · step ' + (i + 1) + ' of 4' : v === 'order' ? 'Merch · your order' : 'Merch';
    ({ home: rHome, pick: rPick, thing: rThing, make: rMake, basket: rBasket, order: rOrder })[v](arg);
    $$('.dn').forEach(function (e) { e.textContent = st.dog ? (shownName(st.dog) || 'your ' + breedOf(st.dog.recipe)) : 'your dog'; });
  }
  function setHash(h) { try { history.replaceState(history.state, '', location.pathname + location.search + h); } catch (e) { /* the old address stays */ } }
  // the address always names the step on show: a step that can't show yet (nothing chosen) goes to the first one that can, and says so in the address
  function route() {
    if (!cat) return;
    var h = location.hash === '#faq' ? '#/faq' : location.hash;
    var m = /^#\/(\w*)(?:\/([A-Za-z0-9_-]{1,64}))?\/?$/.exec(h), want = m ? m[1] : h ? '?' : '', arg = m ? m[2] : undefined, prev = st.view;
    var faq = want === 'faq', v = want === '' || faq ? 'home' : want;
    if (!document.querySelector('.mview[data-view="' + v + '"]')) v = 'home';
    if (v === 'thing' && !st.dog) v = 'pick';
    if (v === 'make' && !st.draft) v = st.dog ? 'thing' : 'pick';
    var should = faq ? '#/faq' : v === 'home' ? (location.hash === '' ? '' : '#/') : '#/' + v + (v === 'order' && arg ? '/' + arg : '');
    if (should !== location.hash) setHash(should);
    show(v, arg);
    if (faq) { var f = $('#faq'); if (f) { f.scrollIntoView({ block: 'start' }); try { $('#h-faq').focus({ preventScroll: true }); } catch (e) { /* fine */ } } return; }
    if (prev !== v) { // a new step: its top just under the site's sticky header, so the step itself shows on a phone's first screen
      var top = 0, hd = $('#sitehead'), hh = hd ? Math.min(90, hd.offsetHeight) : 0;
      var to = v === 'make' && window.innerHeight < 760 ? $('#steps') : $('#testbar'); // a small phone: "Make it yours" opens with its preview in view
      if (prev && v !== 'home' && to) top = Math.max(0, to.getBoundingClientRect().top + window.pageYOffset - hh - 8);
      window.scrollTo(0, top);
      var hx = $('.mview.on h1'); if (hx && prev) try { hx.focus({ preventScroll: true }); } catch (e) { /* old browsers */ }
    }
  }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  // ---- 1. landing
  function rHome() {
    var d = st.dogs[0] || READY[3] || READY[0], r = d.recipe, mine = d.src !== 'ready';
    var T = [['mug', 'sit', 'white'], ['tee', 'stand', 'ice-blue']];
    $('#trio').innerHTML = T.map(function (t) {
      var p = prodCat(t[0]); if (!p || !colourCat(t[0], t[2])) return '';
      return '<li>' + mockOf(r, { product: t[0], colour: t[2], pose: t[1], name_on: mine && !!r.n }, PROD[t[0]].title) + '<span>' + (t[0] === 'mug' ? 'A mug' : 'A tee') + '</span><small>' + (p.sizes.length ? 'from ' : '') + money(p.price) + '</small></li>';
    }).join('');
    $('#homeShip').innerHTML = shipLine();
    readyList($('#readyHome'));
  }
  function readyList(el) {
    el.innerHTML = READY.map(function (d) { return '<li><button type="button" data-dog="' + esc(d.id) + '">' + dogPic(d.recipe, 'stand') + '<span>' + esc(breedOf(d.recipe)) + '</span><small>ready-made</small></button></li>'; }).join('');
    $$('[data-dog]', el).forEach(function (b) { b.onclick = function () { pickDog(b.dataset.dog); go('#/thing'); }; });
  }
  function pickDog(id) { st.dog = dogById(id); st.edit = null; st.draft = null; }

  // ---- 2. which dog
  function rPick() {
    var b = $('#pickBody'), L = st.dogs, h = '';
    if (st.linkErr) h += '<div class="from warn"><span class="ic" aria-hidden="true">🔗</span><p><b>That link from the game didn\'t come through whole.</b> Open it again from the game, or pick a dog below.</p></div>';
    if (!L.length) {
      h += '<div class="none">' + dogPic(READY[3] ? READY[3].recipe : READY[0].recipe, 'sit') + '<p class="lead">We can\'t see any of your dogs from here yet.</p>' +
        '<p>Your dogs live in the game. Playing on doodledoggo.app? Open this page in the same browser and they\'re here. Playing somewhere else, like itch.io? We can\'t see those dogs from here yet, so pick a ready-made dog for now.</p>' +
        '<p><a class="lnk" href="/">Open the game →</a></p></div>';
      h += '<div class="subh">Or pick a ready-made dog</div><ul class="ready small" id="readyPick"></ul>';
      b.innerHTML = h; readyList($('#readyPick'));
      var n = $('#pickNext'); n.setAttribute('aria-disabled', 'true'); n.removeAttribute('href'); return;
    }
    if (st.src === 'link') h += '<div class="from link"><span class="ic" aria-hidden="true">🔗</span><p><b>' + (L.length === 1 ? 'One dog' : L.length + ' dogs') + ' came with your link from the game.</b> Only how ' + (L.length === 1 ? 'it looks' : 'they look') + ' came along (name, breed, coat, outfit), and only for this tab.</p></div>';
    else h += '<div class="from"><span class="ic" aria-hidden="true">🏡</span><p><b>Here are your dogs from the game in this browser.</b> Each one prints just as it looks today. Want a different outfit? Change it in the game first.</p></div>';
    if (!st.dog || st.dog.src === 'ready' || !dogById(st.dog.id)) st.dog = L[0];
    h += '<ul class="dogs5">' + L.map(function (d) {
      var r = d.recipe, nm = shownName(d), pic = ''; try { pic = dogPic(r, 'stand'); } catch (e) { pic = ''; }
      return '<li><button type="button" class="dogb" data-pick="' + esc(d.id) + '" aria-pressed="' + (st.dog && st.dog.id === d.id) + '">' + (d.active ? '<span class="fav"><span aria-hidden="true">♥</span> playing now</span>' : '') + '<span class="tick" aria-hidden="true">✓</span>' +
        pic + '<span class="n">' + esc(nm || 'No name') + '</span><span class="b">' + esc(breedOf(r)) + '</span>' + looksOf(r) + '</button></li>';
    }).join('') + '</ul>';
    h += '<div class="subh">Or a ready-made dog</div><ul class="ready small" id="readyPick"></ul>';
    b.innerHTML = h; readyList($('#readyPick'));
    $$('[data-pick]', b).forEach(function (x) { x.onclick = function () { pickDog(x.dataset.pick); $$('[data-pick]', b).forEach(function (y) { y.setAttribute('aria-pressed', String(y === x)); }); }; });
    var nx = $('#pickNext'); nx.removeAttribute('aria-disabled'); nx.href = '#/thing';
  }

  // ---- 3. the thing
  function rThing() {
    var r = st.dog.recipe, mine = st.dog.src !== 'ready';
    $('#prods').innerHTML = ['mug', 'tee'].filter(function (k) { return prodCat(k) && colourCat(k, 'white'); }).map(function (k) {
      var p = prodCat(k), o = { product: k, colour: 'white', pose: 'stand', name_on: mine && !!r.n };
      return '<li><button type="button" class="prodb" data-p="' + k + '">' + mockOf(r, o, PROD[k].title) +
        '<span class="n">' + PROD[k].name + '</span><span class="p">' + (p.sizes.length ? 'from ' : '') + '<b>' + money(p.price) + '</b></span><span class="d">' + PROD[k].d + '</span></button></li>';
    }).join('');
    $$('.prodb').forEach(function (b) { b.onclick = function () { startDraft(b.dataset.p); go('#/make'); }; });
    $('#thingShip').innerHTML = shipLine();
  }
  function startDraft(pid) {
    var r = st.dog.recipe, mine = st.dog.src !== 'ready', p = prodCat(pid), col = 'white', sizes = colourCat(pid, col).sizes;
    st.edit = null;
    st.draft = { base: r, product: pid, colour: col, size: pid === 'tee' ? (sizes.indexOf('M') >= 0 ? 'M' : sizes[0]) : null, pose: p.poses.indexOf('stand') >= 0 ? 'stand' : p.poses[0], name_on: mine && !!r.n, name: r.n || '', qty: 1, who: st.dog.src === 'ready' ? '' : shownName(st.dog), ready: st.dog.src === 'ready' };
  }

  // ---- 4. make it yours
  function nameState() { // the name as typed, checked by PawPrint's own rule for this product
    var d = st.draft; if (!d.name_on) return { ok: true, off: true };
    return P.nameOk(d.name, { product: d.product });
  }
  function nameMsg(n) {
    var d = st.draft;
    if (n.off) return d.who && !d.base.n ? { t: NOSAY, bad: false } : { t: 'The ' + PROD[d.product].one + ' prints without a name.', bad: false }; // the game name can't print
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
    return { recipe: P.merchEncode([r]), product: d.product, colour: d.colour, size: d.product === 'tee' ? d.size : null, pose: d.pose, name_on: !!(d.name_on && n.ok && r.n), qty: d.qty, who: d.who || '', ready: !!d.ready };
  }
  function editing() { return !!st.edit && basket.some(function (l) { return l.id === st.edit; }); }
  function rMake() {
    var d = st.draft, p = prodCat(d.product), r = draftRecipe(), n = nameState(), tee = d.product === 'tee';
    var o = { product: d.product, colour: d.colour, pose: d.pose, name_on: !!(d.name_on && n.ok) };
    $$('.pn').forEach(function (e) { e.textContent = PROD[d.product].one; });
    // the preview: the picture we print on the thing, and the picture alone
    var pr = printOf(r, o), last = P.print.last || {};
    $('#pvOn').innerHTML = tee ? M.tee({ print: pr, hex: hexOf('tee', d.colour), label: 'Preview: ' + PROD[d.product].title }) : M.mug({ print: pr, label: 'Preview: ' + PROD[d.product].title });
    $('#pvFlat').innerHTML = M.flat({ print: pr, product: d.product, hex: tee ? hexOf('tee', d.colour) : '#FFFFFF', label: 'The picture we print' }) +
      '<p>' + (tee ? 'The picture we print: up to 15 × 18 in on the front. Your dog prints about ' + (last.dogIn ? last.dogIn.toFixed(1) : '6') + ' in wide.' : 'The picture we print: a 9 × 3.5 in wrap, the same dog on both sides, for left and right hands.') + ' Drawn at full size from the game\'s own art, so every line stays sharp.</p>';
    $('#preview').classList.toggle('isflat', st.pv === 'flat');
    $$('[data-pv]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.pv === st.pv)); b.onclick = function () { st.pv = b.dataset.pv; rMake(); }; });
    // pose
    $('#poses').innerHTML = POSES.filter(function (x) { return p.poses.indexOf(x[0]) >= 0; }).map(function (x) { return '<button type="button" data-pose="' + x[0] + '" aria-pressed="' + (d.pose === x[0]) + '">' + dogPic(d.base, x[0]) + x[1] + '</button>'; }).join('');
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
      $('#cols').innerHTML = p.colours.map(function (c) {
        var C = P.TEE_COLOURS.filter(function (x) { return x.id === c.id; })[0]; if (!C) return '';
        return '<button type="button" data-col="' + esc(c.id) + '" aria-pressed="' + (d.colour === c.id) + '" aria-label="' + esc(C.name) + '" title="' + esc(C.name) + '"><i style="background:' + esc(C.hex) + '"></i></button>';
      }).join('');
      var CC = P.TEE_COLOURS.filter(function (x) { return x.id === d.colour; })[0];
      $('#colName').textContent = CC ? CC.name : ''; $('#darkNote').hidden = !(CC && CC.patch);
      $$('[data-col]').forEach(function (b) { b.onclick = function () { d.colour = b.dataset.col; var s = colourCat('tee', d.colour).sizes; if (s.indexOf(d.size) < 0) d.size = s.indexOf('M') >= 0 ? 'M' : s[0]; rMake(); }; });
      var cs = colourCat('tee', d.colour).sizes;
      $('#sizes').innerHTML = p.sizes.filter(function (s) { return cs.indexOf(s.id) >= 0; }).map(function (s) { return '<button type="button" class="chipb" data-size="' + esc(s.id) + '" aria-pressed="' + (d.size === s.id) + '">' + esc(s.id) + (s.add ? ' <small>+' + money(s.add).replace('.00', '') + '</small>' : '') + '</button>'; }).join('');
      $$('[data-size]').forEach(function (b) { b.onclick = function () { d.size = b.dataset.size; rMake(); }; });
    }
    // how many, the price, add
    $('#qv').textContent = String(d.qty); $('#qm').disabled = d.qty <= 1; $('#qp').disabled = d.qty >= maxQty();
    $('#qnote').textContent = 'Up to ' + maxQty() + ' of each.';
    var unit = p.price + (tee ? sizeAdd('tee', d.size) : 0), ed = editing();
    $('#amt').innerHTML = money(unit * d.qty) + '<small>' + (d.qty > 1 ? d.qty + ' × ' + money(unit) + ', ' : '') + 'shipping in the basket</small>';
    var add = $('#addBtn'), full = !ed && basket.length >= maxLines() && !basket.some(function (l) { return sameThing(l, draftLine()); });
    add.textContent = ed ? 'Save changes' : 'Add to basket';
    add.disabled = !!msg.bad || full;
    $('#addMsg').textContent = full ? 'Your basket is full: it holds up to ' + maxLines() + ' things. Change or remove one there to make room.' : msg.bad ? 'Fix the name first, or turn it off.' : '';
    $('#makeBack').href = st.edit ? '#/basket' : '#/thing';
  }
  function addDraft() {
    var l = draftLine();
    if (editing()) {
      var i = basket.map(function (x) { return x.id; }).indexOf(st.edit);
      l.id = st.edit; basket[i] = l;
      // the change may make it the same as another line: keep one line, up to the most of each
      var j = basket.findIndex(function (x, k) { return k !== i && sameThing(x, l); });
      if (j >= 0) { basket[j].qty = Math.min(maxQty(), basket[j].qty + l.qty); basket.splice(i, 1); }
      say('Changed. It\'s in your basket.');
    } else {
      var gone = !!st.edit; // "Change" on a line that has left the basket meanwhile (another tab): it comes back as a new line
      var same = basket.filter(function (x) { return sameThing(x, l); })[0];
      if (same) { var was = same.qty; same.qty = Math.min(maxQty(), same.qty + l.qty); say(same.qty === was ? 'That one is already in your basket, ' + was + ' of it: up to ' + maxQty() + ' of each.' : 'You already had that one: now ' + same.qty + '.'); }
      else { if (basket.length >= maxLines()) return; l.id = newId(); basket.push(l); say(gone ? 'That one had left your basket, so we put it back in.' : 'Added to your basket.'); }
    }
    basketChanged(); st.edit = null; st.draft = null; saveBasket(); requote(); go('#/basket');
  }

  // ---- 5. the basket and pay
  function requote() {
    var n = ++st.qn; st.quote = null; st.qerr = null; st.payErr = null;
    if (!basket.length || !st.country) { if (st.view === 'basket') rBasket(); return Promise.resolve(); }
    return api.quote({ country: st.country, lines: basket.map(apiLine) }).then(function (q) { if (n !== st.qn) return; st.quote = okQuote(q) ? q : null; st.qerr = st.quote ? null : { error: 'busy' }; if (st.view === 'basket') rBasket(); },
      function (e) { if (n !== st.qn) return; st.qerr = e && typeof e === 'object' ? e : { error: 'busy' }; if (st.view === 'basket') rBasket(); });
  }
  function okQuote(q) { return !!q && typeof q === 'object' && Array.isArray(q.lines) && q.lines.length === basket.length && typeof q.total === 'number' && typeof q.subtotal === 'number' && typeof q.ship_fee === 'number'; }
  function lineHTML(l, i, q, need) {
    try {
      var r = recipeOf(l), ql = q && q.lines[i], C = l.product === 'tee' ? P.TEE_COLOURS.filter(function (x) { return x.id === l.colour; })[0] : null, who = whoOf(l, r);
      return '<li class="bl card' + (need ? ' needs' : '') + '" data-line="' + esc(l.id) + '">' + mockOf(r, l, PROD[l.product].title + ': ' + who) +
        '<div class="bt"><h3>' + PROD[l.product].title + '</h3>' + (need ? '<p class="lneed">This one needs a look.</p>' : '') + '<ul class="facts"><li>' + esc(who) + '</li><li>' + POSE_NAME[l.pose] + ' · ' + (l.name_on ? 'name on' : 'no name') + '</li>' +
        (C ? '<li>' + esc(C.name) + ' · ' + esc(l.size) + '</li>' : '') + '</ul>' +
        '<div class="brow"><div class="qty small" role="group" aria-label="How many"><button type="button" data-qm="' + esc(l.id) + '" aria-label="One less"' + (l.qty <= 1 ? ' disabled' : '') + '>−</button><output>' + esc(l.qty) + '</output><button type="button" data-qp="' + esc(l.id) + '" aria-label="One more"' + (l.qty >= maxQty() ? ' disabled' : '') + '>+</button></div>' +
        '<span class="lp" data-lp="' + (i + 1) + '">' + (ql ? money(ql.total) : '') + '</span></div>' +
        '<div class="brow2"><button type="button" class="lnk" data-chg="' + esc(l.id) + '">Change</button><button type="button" class="lnk" data-rm="' + esc(l.id) + '">Remove</button></div></div></li>';
    } catch (e) { // one line that can't draw never blanks the basket: it says so, and can be removed
      return '<li class="bl card broken" data-line="' + esc(l.id) + '"><div class="bt"><h3>' + esc(PROD[l.product] ? PROD[l.product].title : 'One thing') + '</h3><p>We can\'t draw this one just now.</p>' +
        '<div class="brow2"><button type="button" class="lnk" data-rm="' + esc(l.id) + '">Remove</button></div></div></li>';
    }
  }
  function rBasket() {
    var c = country(), q = st.quote, e = st.qerr, pe = st.payErr, ei = e ? errInfo(e) : pe ? errInfo(pe) : null;
    $('#closed').hidden = true;
    var dn = $('#bdrop'); dn.hidden = !st.dropped;
    dn.textContent = st.dropped === 1 ? 'One thing in your basket can\'t be made any more, so we took it out.' : st.dropped > 1 ? st.dropped + ' things in your basket can\'t be made any more, so we took them out.' : '';
    if (!basket.length) {
      $('#blines').innerHTML = '<li class="empty"><p class="lead">Your basket is empty.</p><p>Pick a dog, then a mug or a tee.</p></li>';
    } else {
      $('#blines').innerHTML = basket.map(function (l, i) { return lineHTML(l, i, q, ei && ei.line === i + 1); }).join('');
    }
    var full = basket.length >= maxLines(), an = $('#another');
    $('#bfull').textContent = full ? 'Your basket holds up to ' + maxLines() + ' things, and up to ' + maxQty() + ' of each. To add another, change or remove one.' : basket.length ? 'Up to ' + maxLines() + ' things in one order, up to ' + maxQty() + ' of each.' : '';
    if (full) { an.setAttribute('aria-disabled', 'true'); an.removeAttribute('href'); } else { an.removeAttribute('aria-disabled'); an.href = '#/pick'; }
    $$('[data-qm]').forEach(function (b) { b.onclick = function () { bump(b.dataset.qm, -1); }; });
    $$('[data-qp]').forEach(function (b) { b.onclick = function () { bump(b.dataset.qp, 1); }; });
    $$('[data-rm]').forEach(function (b) { b.onclick = function () { remove(b.dataset.rm); }; });
    $$('[data-chg]').forEach(function (b) { b.onclick = function () { change(b.dataset.chg); }; });
    // ship to and the totals
    var sb = '<div class="lg">Shipping</div><p class="shipline">' + shipLine() + '</p>';
    if (c && !c.soon && q && etaLine(q.eta)) sb += '<p class="eta"><span aria-hidden="true">📦</span><span>' + esc(etaLine(q.eta)) + '</span></p>';
    $('#shipBox').innerHTML = sb;
    var t = '';
    if (basket.length && cat.sold_out_today) t += '<p class="qerr">' + errHTML(errInfo({ error: 'sold_out_today' })) + '</p>';
    if (basket.length && q) {
      t += '<table class="lines" id="qtable"><tr><td>Things (' + itemCount() + ')</td><td data-q="subtotal">' + money(q.subtotal) + '</td></tr>' +
        '<tr><td>Shipping</td><td data-q="ship">' + (q.ship_fee ? money(q.ship_fee) : 'Free') + '</td></tr>' +
        '<tr class="tot"><td>Total</td><td data-q="total">' + money(q.total) + '</td></tr></table>';
      if (q.free_from != null) t += '<p class="small2 left">Orders of ' + money(q.free_from).replace('.00', '') + ' or more ship free.</p>';
      t += '<p class="small2 left">Prices are in US dollars. On the payment page you may be offered your own currency.</p>';
      (Array.isArray(q.notes) ? q.notes : []).forEach(function (k) { if (typeof k === 'string' && Object.prototype.hasOwnProperty.call(NOTE, k)) t += '<p class="small2 left note-' + k + '">' + NOTE[k] + '</p>'; });
    } else if (basket.length && e) {
      t += '<p class="qerr">' + errHTML(ei) + '</p>';
    } else if (basket.length && !c) t += '<p class="qerr">Choose where it\'s going under <b>Ship to</b> to see the shipping and the total.</p>';
    else if (basket.length) t += '<p class="qerr">Working out the total…</p>';
    $('#totals').innerHTML = t;
    var pb = $('#payErr'); pb.hidden = !pe; pb.innerHTML = pe ? errHTML(errInfo(pe)) : '';
    $('#payBtn').disabled = !(basket.length && q && !cat.sold_out_today);
    $('#payNote').textContent = (q && q.shut) || cat.shut ? 'Test mode: the shop is not open yet, so nothing can be paid.' : 'Test mode: nothing can be paid here.';
  }
  function bump(id, k) { basket.forEach(function (l) { if (l.id === id) l.qty = Math.max(1, Math.min(maxQty(), l.qty + k)); }); basketChanged(); saveBasket(); requote(); rBasket(); }
  function remove(id) {
    var l = basket.filter(function (x) { return x.id === id; })[0]; if (!l) return;
    basket = basket.filter(function (x) { return x.id !== id; }); basketChanged(); saveBasket(); say('Removed the ' + (PROD[l.product] ? PROD[l.product].one : 'thing') + '.'); requote(); rBasket();
  }
  function change(id) {
    var l = basket.filter(function (x) { return x.id === id; })[0]; if (!l) return;
    var r = recipeOf(l); if (!r) return;
    var base = Object.assign({}, r);
    st.dog = { id: 'b-' + id, src: l.ready ? 'ready' : 'basket', recipe: base, name: l.who || '' };
    st.draft = { base: base, product: l.product, colour: l.colour, size: l.size, pose: l.pose, name_on: l.name_on, name: r.n || '', qty: l.qty, who: l.who || '', ready: !!l.ready };
    st.edit = id; go('#/make');
  }
  function nonce() { var a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(a) : a.forEach(function (x, i) { a[i] = Math.random() * 256; }); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  // one nonce for one basket to one country: a retry (a lost answer, a price that changed) sends the same one, so the server never makes two orders
  function payBody() {
    var lines = basket.map(apiLine), key = JSON.stringify([st.country, lines]);
    if (key !== st.nonceKey || !st.nonce) { st.nonceKey = key; st.nonce = nonce(); }
    return { country: st.country, lines: lines, expect_total: st.quote.total, art_ver: P.ART_VER, nonce: st.nonce, agree: true, lang: 'en' };
  }
  function pay() {
    if (!st.quote || !basket.length) return;
    var btn = $('#payBtn'); btn.disabled = true; st.payErr = null; $('#payErr').hidden = true;
    api.checkout(payBody()).then(function () {
      // only a live build gets here; this build never opens a payment page
      closedCard('');
    }, function (e) {
      e = e && typeof e === 'object' ? e : { error: 'busy' };
      if (e.error === 'merch_closed') { closedCard(''); return; }
      // a new price is shown and asked about again: never paid without the buyer seeing it
      if (e.error === 'price_changed') { if (okQuote(e.quote)) st.quote = e.quote; else { requote(); return; } }
      st.payErr = e; rBasket();
      var pb = $('#payErr'); try { pb.focus({ preventScroll: false }); } catch (x) { pb.focus(); }
    }).then(function () { btn.disabled = !(basket.length && st.quote && !cat.sold_out_today); });
  }
  function closedCard(why) {
    var c = $('#closed'); c.hidden = false; $('#closedWhy').textContent = why || 'When the shop opens, this button takes you to Stripe\'s secure page to pay.';
    $('#demoRow').hidden = !DEMO; try { c.focus({ preventScroll: false }); } catch (e) { c.focus(); }
  }
  function demoPay() {
    if (!DEMO || !st.quote) return;
    api.demoPay(payBody()).then(function (r) { basket = []; basketChanged(); saveBasket(); st.quote = null; go('#/order/' + r.order); }, function () { closedCard('That didn\'t work this time.'); });
  }

  // ---- 6. thank you / the order page (test orders only in this build). The server's answer is untrusted text: everything is escaped,
  //      and the page never needs a line's recipe (the server clears recipes after 24 months): the dog is drawn only when one is there
  function rOrder(id) {
    var b = $('#orderBody');
    if (!id) { b.innerHTML = '<p class="lead">No order to show.</p>'; return; }
    b.innerHTML = '<p class="lead">Finding your order…</p>';
    var notFound = function () { b.innerHTML = '<div class="thanks"><h1 class="mh2" tabindex="-1">We can\'t find that order</h1><p class="lead">Check the link in your email, or write to us: ' + CONTACT + '.</p><div class="navrow"><a class="btn mint" href="#/">Back to the shop</a></div></div>'; };
    api.order(id).then(function (o) { if (!o || typeof o !== 'object' || !Array.isArray(o.lines)) return notFound(); st.order = o; try { drawOrder(o); } catch (e) { b.innerHTML = '<p class="lead">We can\'t show this order just now. Try again in a moment.</p>'; } }, notFound);
  }
  function fmtDate(ms) { var d = new Date(num(ms)); try { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d.toDateString(); } }
  function fmtTime(ms) { var d = new Date(num(ms)); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function drawOrder(o) {
    var b = $('#orderBody'), s = String(o.status || ''), parcels = (Array.isArray(o.parcels) ? o.parcels : []).filter(function (p) { return p && typeof p === 'object'; });
    var tot = o.totals && typeof o.totals === 'object' ? o.totals : {}, now = Date.now();
    var ended = { cancelled: 'Your order is cancelled', refunded: 'Your order is refunded', expired: 'This order wasn\'t paid' }[s];
    var sent = parcels.filter(function (p) { return p.shipped_at; }), came = parcels.filter(function (p) { return p.delivered_at; });
    // where it is now: 0 received, 1 being printed, 2 on its way, 3 arrived
    var stage = ended ? -1 : s === 'part_shipped' || s === 'shipped' ? (parcels.length && came.length === parcels.length ? 3 : 2) : s === 'confirming' || s === 'confirmed' ? 1 : s === 'paid' && !o.can_cancel ? 1 : 0;
    var first = null; o.lines.some(function (l) { var r = l && recipeOf(l); if (r) first = r; return !!r; });
    var pic = ''; try { pic = first ? dogPic(first, 'happy') : ''; } catch (e) { pic = ''; }
    var track = function (p) { return typeof p.tracking_url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(p.tracking_url) ? ' <a class="lnk" href="' + esc(p.tracking_url) + '" target="_blank" rel="noopener noreferrer">Track it</a>' : ''; };
    var S = [['✓', 'Order received', (o.paid_at ? fmtDate(o.paid_at) + '. ' : '') + 'Your receipt is in your email.'],
      ['🖨', 'Being printed', stage >= 1 ? 'At our print partner: printing takes 2 to 5 working days.' : 'At our print partner, in 2 to 5 working days.'],
      ['🚚', 'On its way', sent.length ? 'Sent ' + fmtDate(sent[0].shipped_at) + (parcels.length > 1 ? ' (' + sent.length + ' of ' + parcels.length + ' parcels)' : '') + '.' : 'You get an email with a tracking link.'],
      ['🏠', 'Arrived', came.length === parcels.length && came.length ? 'Arrived ' + fmtDate(came[came.length - 1].delivered_at) + '. Say hello to your dog, in real life.' : 'Say hello to your dog, in real life.']];
    var h = (o.test ? '<p class="testtag">Test order: made up to show this page. Nothing was paid and nothing will be printed.</p>' : '') +
      '<div class="thanks">' + pic + '<h1 class="mh2" id="h-order-t" tabindex="-1">' + esc(ended || 'Thank you! Your order is in.') + '</h1>' +
      '<p class="lead"><span class="ordnum">Order ' + esc(String(o.id || '').replace(/^mo_/, '')) + '</span><br>' + (s === 'cancelled' ? 'Nothing will be printed. Your refund is on its way: it shows on your card in 5 to 10 days.' : s === 'refunded' ? 'Your money is on its way back: it shows on your card in 5 to 10 days.' : s === 'expired' ? 'Nothing was paid, so nothing will be made.' : 'A receipt is on its way to your email.') + '</p></div>';
    // cancelling: only what the server says (can_cancel, cancel_until); after the hour there is no cancel line at all
    if (!ended) {
      var cu = num(o.cancel_until), sameDay = new Date(cu).toDateString() === new Date(now).toDateString();
      var line = s === 'open' ? 'Waiting for payment.' : s === 'held' ? 'Getting ready to print. It\'s taking a little longer than usual.' :
        o.can_cancel === true && cu ? 'We\'ll start printing at <b>' + fmtTime(cu) + (sameDay ? '' : ' on ' + esc(fmtDate(cu))) + '</b>. If you change your mind before then, you can cancel here.' : stage <= 1 ? 'Printing has started.' : '';
      if (line) h += '<div class="cancelbox card"><p>' + line + '</p>' + (o.can_cancel === true && cu ? '<button type="button" class="btn quiet" id="cancelBtn">Cancel my order</button>' : '') + '</div>';
    }
    h += '<div class="order"><div class="card"><h2 class="h2s">Where is it now?</h2><ol class="track">' + S.map(function (x, i) {
      var c = i < stage ? 'done' : i === stage ? 'now' : 'later'; return '<li class="' + c + '"><span class="dot" aria-hidden="true">' + x[0] + '</span><span><b>' + x[1] + '</b><span>' + esc(x[2]) + (i === 2 && sent.length ? track(sent[0]) : '') + '</span></span></li>';
    }).join('') + '</ol><p class="note">This page is your order page: bookmark it, or use the link in your email.</p></div><div>';
    h += '<ul class="blines">' + o.lines.map(function (l) {
      if (!l || typeof l !== 'object') return '';
      var pid = l.product === 'tee' ? 'tee' : 'mug', r = null, C = pid === 'tee' ? P.TEE_COLOURS.filter(function (x) { return x.id === l.colour; })[0] : null, pic2 = '';
      try { r = recipeOf(l); pic2 = mockOf(r, { product: pid, colour: C ? C.id : 'white', pose: POSE_NAME[l.pose] ? l.pose : 'stand', name_on: l.name_on === true }, PROD[pid].title); } catch (e) { pic2 = ''; }
      var nm = typeof l.name === 'string' && l.name ? cleanWho(l.name) : r && r.n ? r.n : '';
      return '<li class="bl card">' + pic2 + '<div class="bt"><h3>' + PROD[pid].title + '</h3><ul class="facts"><li>' + esc(nm || (r ? 'Your ' + breedOf(r) : 'Your dog')) + '</li>' + (C ? '<li>' + esc(C.name) + ' · ' + esc(l.size) + '</li>' : '') + '<li>How many: ' + esc(num(l.qty)) + '</li></ul><span class="lp">' + money(num(l.unit) * num(l.qty)) + '</span></div></li>';
    }).join('') + '</ul><table class="lines"><tr><td>Things</td><td>' + money(tot.subtotal) + '</td></tr><tr><td>Shipping</td><td>' + (num(tot.ship_fee) ? money(tot.ship_fee) : 'Free') + '</td></tr><tr class="tot"><td>Total</td><td>' + money(tot.total) + '</td></tr>' + (num(tot.refunded) ? '<tr><td>Refunded</td><td>' + money(tot.refunded) + '</td></tr>' : '') + '</table>';
    h += '<p class="small2 left">Something wrong when it arrives? Reply to the order email with a photo and we\'ll make it right.</p><div class="navrow"><a class="btn mint" href="#/pick">Put another dog on something</a></div></div></div>';
    b.innerHTML = h;
    var cb = $('#cancelBtn'); if (cb) cb.onclick = function () { $('#cancelDlg').showModal(); };
  }

  // ---- "Ship to": a guess from the browser's language, then the buyer's own choice (kept). Named here, sorted by the shown name
  function fillShip() {
    var sel = $('#shipSel'), saved = lsGet(SHIP_KEY), guess = '';
    try { var a = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']; for (var i = 0; i < a.length && !guess; i++) { var m = /-([A-Za-z]{2})\b/.exec(String(a[i])); if (m) guess = m[1].toUpperCase(); } } catch (e) { guess = ''; }
    var has = function (c) { return cat.countries.some(function (x) { return x.code === c; }); };
    st.country = saved && has(saved) ? saved : has(guess) ? guess : has('US') ? 'US' : cat.countries.length ? cat.countries[0].code : '';
    sel.innerHTML = cat.countries.map(function (c) { return '<option value="' + esc(c.code) + '"' + (c.code === st.country ? ' selected' : '') + '>' + esc(cname(c.code)) + (c.soon ? ' (coming soon)' : '') + '</option>'; }).join('');
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
  $('#cancelYes').onclick = function () {
    $('#cancelDlg').close(); var o = st.order; if (!o) return;
    var again = function () { return api.order(o.id).then(function (x) { st.order = x; drawOrder(x); }); };
    api.cancel(o.id, { scope: 'order' }).then(function () { return again().then(function () { say('Your order is cancelled.'); }); }, function () { say('It\'s too late to cancel: printing has started.'); return again(); }).catch(function () { /* the page stays */ });
  };
  $('#sgBtn').onclick = function () {
    var cs = colourCat('tee', st.draft.colour).sizes;
    $('#sgt').innerHTML = '<tr><td><b>Size</b></td><td><b>Chest, flat</b></td></tr>' + cs.filter(function (s) { return WIDTH[s]; }).map(function (s) { var w = WIDTH[s]; return '<tr><td>' + esc(s) + '</td><td>' + w + ' in · ' + Math.round(w * 2.54) + ' cm</td></tr>'; }).join('');
    $('#sizeg').showModal();
  };
  $('#sgClose').onclick = function () { $('#sizeg').close(); };
  $$('#steps li').forEach(function (li) { $('button', li).onclick = function () { if (li.classList.contains('done')) go('#/' + li.dataset.s); }; });
  $('#pickNext').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
  $('#another').addEventListener('click', function (e) { if (this.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
  $('#faqlink').addEventListener('click', function (e) { e.preventDefault(); go('#/faq'); });
  document.addEventListener('click', function (e) {
    var m = $('#langs'); if (m && m.open && !m.contains(e.target)) m.open = false;
    if (e.target && e.target.closest && e.target.closest('[data-reload]')) location.reload();
  });
  window.addEventListener('hashchange', route);
  // another tab changed the basket: read it again (checked again), keep this tab's ids for lines that are still the same thing
  window.addEventListener('storage', function (e) {
    if (!cat || (e.key !== BASKET_KEY && e.key !== null)) return;
    var res = readBasket(basket); basket = res.lines; if (res.dropped) st.dropped = res.dropped;
    updateBag(); requote(); if (st.view === 'basket') rBasket(); else if (st.view === 'make' && st.draft) rMake();
  });

  // ---- start
  loadDogs();
  api.catalog().then(function (c) {
    useCatalog(c);
    var res = readBasket(null); basket = res.lines; st.dropped = res.dropped;
    if (res.dropped || lsGet(BASKET_KEY) !== (basket.length ? JSON.stringify(basket.map(storeLine)) : null)) saveBasket(); else updateBag();
    if (res.dropped) say(st.dropped === 1 ? 'One thing in your basket can\'t be made any more, so we took it out.' : st.dropped + ' things in your basket can\'t be made any more, so we took them out.');
    $('#loading').hidden = true; document.documentElement.classList.add('merch-ready');
    fillShip(); requote(); route();
  }, function () { $('#loading').textContent = 'The shop couldn\'t load just now. Try again in a moment.'; });

  // hooks for the tests (merch/test_page.js) and the screenshots
  window.__merch = { st: st, api: api, basket: function () { return basket; }, cat: function () { return cat; }, go: go, requote: requote, READY: READY, cleanBasket: cleanBasket, rBasket: function () { rBasket(); } };
})();
