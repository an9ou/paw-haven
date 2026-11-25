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
  var cat = null, st = { src: 'none', dogs: [], linkErr: null, share: null, dog: null, draft: null, edit: null, pv: 'on', country: '', quote: null, qerr: null, qn: 0, order: null, view: '',
    dropped: 0, payErr: null, nonce: '', nonceKey: '' };
  var basket = [], idN = 0;
  function newId() { idN++; return 'l' + idN.toString(36) + Math.random().toString(36).slice(2, 6); }

  // ---- where the dogs come from: a link from the game (#p=..., this tab only), else the save in this browser (read only)
  function loadDogs() {
    var h = location.hash, list = null;
    if (/(^#|&)p=/.test(h)) {
      var r = P.merchFromHash(h);
      if (r.ok) { list = r.dogs.map(function (d) { return P.merchEncode([d.recipe]); }); ssSet(LINK_KEY, JSON.stringify(list)); st.share = shareAsk(h, r.dogs.length); }
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
  // the game's share sheet: #p=<one dog>&prod=mug&pose=happy&from=share (docs/design/merch/PART8.md). Each value is checked against the page's
  // own fixed lists (PROD, POSE_NAME) and never put in the page; anything else, or more than one dog: null, and the page shows its dog list
  function shareAsk(h, n) {
    var kv = {}, own = function (T, k) { return typeof k === 'string' && Object.prototype.hasOwnProperty.call(T, k); };
    String(h).replace(/^#/, '').split('&').forEach(function (x) { var i = x.indexOf('='), k = i > 0 ? x.slice(0, i) : ''; if (/^(prod|pose|from)$/.test(k) && !own(kv, k)) kv[k] = x.slice(i + 1); });
    return kv.from === 'share' && n === 1 && own(PROD, kv.prod) && own(POSE_NAME, kv.pose) ? { prod: kv.prod, pose: kv.pose } : null;
  }
  // once the catalog is in: open "make it" with that dog, that product and that pose, when the catalog has the product on and offers the pose.
  // The address goes #/pick -> #/thing -> #/make, so Back walks the steps (the address always names the step on show)
  function openShare() {
    var a = st.share; st.share = null;
    if (!a || st.src !== 'link' || st.dogs.length !== 1) return;
    var p = prodCat(a.prod); if (!p || !colourCat(a.prod, 'white') || p.poses.indexOf(a.pose) < 0) return;
    pickDog(st.dogs[0].id); startDraft(a.prod); st.draft.pose = newborn(st.dog.recipe) ? babyPose(p) : a.pose; // a newborn: its one pose, whatever the link asked
    var at = location.pathname + location.search;
    try { history.pushState(null, '', at + '#/thing'); history.pushState(null, '', at + '#/make'); } catch (e) { setHash('#/make'); }
  }

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
    var r = d.dogs[0], pose = newborn(r) ? babyPose(p) : l.pose; // a newborn's lines all carry its one pose (so two of them are the same thing)
    if (l.name_on && !(r.n && P.nameOk(r.n, { product: l.product }).ok)) return null;
    var q = typeof l.qty === 'number' ? l.qty : typeof l.qty === 'string' && /^\s*\d{1,3}\s*$/.test(l.qty) ? +l.qty : NaN;
    if (!isFinite(q)) return null;
    q = Math.max(1, Math.min(maxQty(), Math.round(q)));
    try { P.print(r, { product: l.product, colour: l.colour, pose: pose, name: l.name_on }); } catch (e) { return null; } // it must draw, with this build
    return { recipe: l.recipe, product: l.product, colour: l.colour, size: size, pose: pose, name_on: l.name_on, qty: q, who: cleanWho(l.who), ready: l.ready === true };
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
  // q: the basket's quote (second review R2-m3: over the threshold the box says the shipping is free, as the Shipping row does)
  function shipLine(q) {
    var c = country(), z = zoneOf(c);
    if (!c) return 'Choose where it\'s going under <b>Ship to</b>, and the shipping shows here.';
    if (c.soon) return '<b>Coming soon to ' + esc(placeName(c)) + '.</b> We\'re sorting out the tax paperwork first, so we can\'t take orders there yet.';
    if (!z) return '';
    if (q && z.free_from != null && num(q.ship_fee) === 0 && num(q.subtotal) >= num(z.free_from)) return 'Your shipping to ' + esc(placeName(c)) + ' is <b>free</b>: your things come to ' + money(z.free_from).replace('.00', '') + ' or more.';
    var s = 'Shipping to ' + esc(placeName(c)) + ': <b>' + money(z.fee) + '</b>.';
    if (z.free_from != null) s += ' ' + freeRule(z.free_from);
    else if (z.extra) s += ' Each extra mug or tee adds ' + money(z.extra) + '.';
    return s;
  }
  // the free-shipping rule, said once (part 9 phone review M2): it counts the things, before shipping; the threshold is the zone's own (catalog)
  function freeRule(from) { return 'Free shipping when your things come to ' + money(from).replace('.00', '') + ' or more (before shipping).'; }
  // under the threshold, how much more ships it free (the quote's own numbers: the zone's free_from and the things' subtotal); none where it's never free
  function freeMore(q) { return q && q.free_from != null && num(q.subtotal) < num(q.free_from) ? 'Add ' + money(num(q.free_from) - num(q.subtotal)) + ' more for free shipping.' : ''; }
  // the one posting promise (cloudflare/merch/catalog.js SHIP_BY_DAYS; the legal pages say it word for word; merch/test_page.js checks the number)
  var SHIP_BY_DAYS = 7, PROMISE = 'Printing usually takes 2 to 5 working days, and we post every order within ' + SHIP_BY_DAYS + ' working days of payment.';
  // the zone's delivery time is payment to door, printing included (catalog.js ZONES eta; review M4: said so, so nobody adds the two up).
  // The legal shipping page's table says the same words (merch/test_legal.js)
  var ETA_TAIL = 'working days from payment to your door, printing included';
  function etaLine(eta) { return Array.isArray(eta) && eta.length === 2 ? 'About ' + num(eta[0]) + ' to ' + num(eta[1]) + ' ' + ETA_TAIL + '. ' + PROMISE : ''; }

  // ---- what an error from the order server means, in plain words (TRANSACTIONS.md 6.3). -> { t (html), line (1-based, or 0), reload }
  function errInfo(e) {
    e = e || {}; var c = String(e.error || 'busy'), n = typeof e.line === 'number' && e.line >= 1 && e.line <= basket.length && e.line % 1 === 0 ? e.line : 0;
    var place = country() ? esc(placeName(country())) : 'that place', mark = n ? ' (marked below)' : '';
    var T = {
      art_changed: 'We\'ve improved the drawing since you opened this page. Reload to see your dog as it will print.',
      sold_out_today: 'So many orders came in today that we can\'t take more until tomorrow. Your basket stays right here.',
      variant_off: 'One design in your basket' + mark + ' can\'t be made just now. Remove it, or tap Change and pick another colour or size.',
      slow_down: 'That was a lot of tries in a short time. Wait a minute, then try again.',
      busy: 'We\'re a little busy just now. Try again in a moment.',
      cant_make: 'We can\'t make this order just now, and nothing was paid. Try again later, or write to us at ' + CONTACT + '.',
      bad_qty: 'One design in your basket' + mark + ' has more than we can make: up to ' + maxQty() + ' of each. Change it on that line.',
      too_many: 'Your basket holds up to ' + maxLines() + ' different designs. Remove one to go on.',
      country_closed: 'We can\'t send orders to ' + place + ' yet. Choose another place under <b>Ship to</b>.',
      bad_country: 'We don\'t know that place. Choose it again under <b>Ship to</b>.',
      bad_line: 'One design in your basket' + mark + ' needs a look: tap Change on it.',
      bad_name: 'One name in your basket' + mark + ' can\'t print as it is: tap Change on that line to fix it, or turn the name off.',
      not_available: 'We can\'t take this order here. Write to us at ' + CONTACT + ' and we\'ll help.',
      no_agree: 'Something went wrong on our side. Reload the page and try again.',
      merch_closed: 'The shop is not open yet, so nothing can be paid.',
      no_pay_page: 'We couldn\'t reach the payment page. Nothing was paid. Try again in a moment.',
      bad_nonce: 'Something went wrong on our side. Reload the page and try again.',
      nonce_used: 'This basket was already sent to the payment page once.' + (typeof e.order === 'string' && /^mo_[A-Za-z0-9_-]{22}$/.test(e.order) ? ' <a class="lnk" href="#/order/' + e.order + '">See that order</a>, or tap' : ' Tap') + ' Pay again to start a new payment.',
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
    ticks(v);
    $('#crumbs').textContent = i >= 0 ? 'Merch · step ' + (i + 1) + ' of 4' : v === 'order' ? 'Merch · your order' : 'Merch';
    ({ home: rHome, pick: rPick, thing: rThing, make: rMake, basket: rBasket, order: rOrder })[v](arg);
    keepMaking();
    $$('.dn').forEach(function (e) { e.textContent = st.dog ? (shownName(st.dog) || 'your ' + breedOf(st.dog.recipe)) : 'your dog'; });
  }
  // a step before this one is ticked only when it was really done (review m2: an empty basket reached from the bag ticks nothing it has not
  // seen): a basket with lines in it means steps 1-3 were done; otherwise a chosen dog is step 1, a thing being made is step 2
  function ticks(v) {
    var i = ORDER_STEPS.indexOf(v), did = v === 'basket' && basket.length ? [1, 1, 1] : [!!st.dog, !!st.draft, v !== 'basket'];
    $$('#steps li').forEach(function (li, k) {
      var done = k < i && !!did[k];
      li.className = done ? 'done' : k === i ? 'now' : '';
      var b = $('button', li); b.disabled = !done; if (k === i) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
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
    // "No dog yet?" only for a buyer with no dogs here (review m10): with dogs from the save or a link, the ready-made ones are on "Which dog?"
    $('#nodog').hidden = st.src !== 'none';
    readyList($('#readyHome'));
  }
  function readyList(el) {
    el.innerHTML = READY.map(function (d) { return '<li><button type="button" data-dog="' + esc(d.id) + '">' + dogPic(d.recipe, 'stand') + '<span>' + esc(breedOf(d.recipe)) + '</span><small>ready-made</small></button></li>'; }).join('');
    $$('[data-dog]', el).forEach(function (b) { b.onclick = function () { pickDog(b.dataset.dog); go('#/thing'); }; });
  }
  function pickDog(id) { st.dog = dogById(id); st.edit = null; st.draft = null; }
  // a newborn has one pose: every pose prints the same sleeping pup (art review m2). Its lines carry the one pose the catalog offers first
  // ('stand' where offered), and the page calls it "Sleeping" wherever a pose is named
  function newborn(r) { return !!r && r.a === 2; }
  function babyPose(p) { return p && p.poses.indexOf('stand') >= 0 ? 'stand' : p && p.poses.length ? p.poses[0] : 'stand'; }
  function poseName(r, pose) { return newborn(r) ? 'Sleeping' : POSE_NAME[pose] || ''; }

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
    if (st.src === 'link') h += '<div class="from link"><span class="ic" aria-hidden="true">🔗</span><p><b>' + (L.length === 1 ? 'One dog' : L.length + ' dogs') + ' came with your link from the game.</b> Only how ' + (L.length === 1 ? 'it looks' : 'they look') + ' came along (name, breed, coat, outfit), and only for this tab.</p></div>' +
      '<p class="fromq">' + (L.length === 1 ? 'This is your dog from the game, just as it looks today.' : 'These are your dogs from the game, just as they look today.') + '</p>';
    else h += '<div class="from"><span class="ic" aria-hidden="true">🏡</span><p><b>Here are your dogs from the game in this browser.</b> Each one prints just as it looks today. Want a different outfit? Change it in the game first.</p></div>';
    if (!st.dog || st.dog.src === 'ready' || !dogById(st.dog.id)) st.dog = L[0];
    h += '<ul class="dogs5">' + L.map(function (d) {
      var r = d.recipe, nm = shownName(d), pic = ''; try { pic = dogPic(r, 'stand'); } catch (e) { pic = ''; }
      return '<li><button type="button" class="dogb" data-pick="' + esc(d.id) + '" aria-pressed="' + (st.dog && st.dog.id === d.id) + '">' + (d.active ? '<span class="fav"><span aria-hidden="true">♥</span> playing now</span>' : '') + '<span class="tick" aria-hidden="true">✓</span>' +
        pic + '<span class="n">' + esc(nm || 'No name') + '</span><span class="b">' + esc(breedOf(r)) + '</span>' + looksOf(r) + '</button></li>';
    }).join('') + '</ul>';
    h += '<div class="subh">Or a ready-made dog</div><ul class="ready small" id="readyPick"></ul>';
    b.innerHTML = h; readyList($('#readyPick'));
    // a tap on a dog goes straight on to "the thing", as the ready-made cards do (review M7); Back there comes here to change the dog
    $$('[data-pick]', b).forEach(function (x) { x.onclick = function () { pickDog(x.dataset.pick); $$('[data-pick]', b).forEach(function (y) { y.setAttribute('aria-pressed', String(y === x)); }); go('#/thing'); }; });
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
    if (n.ok) return { t: roomSay(n.name, d.product), bad: false };
    if (n.why === 'empty') return { t: 'Type a name, or turn the name off.', bad: true };
    if (n.why === 'long') return { t: (n.say || 'A little shorter, please') + (n.max ? ': up to ' + n.max + ' of these letters fit on the ' + PROD[d.product].one + '.' : ': up to 20 letters.'), bad: true };
    if (n.why === 'letters') return { t: 'Some of those letters we can\'t draw yet. Letters A to Z (with accents), numbers, spaces and \' - . & ! all work.', bad: true };
    return { t: (n.say || 'Let\'s try another name') + '.', bad: true }; // 'word': no reason given, just kindly
  }
  // how much room a good name has, counted against the product's own limit (review m4). The tee fits any 20 letters (PawPrint's NAME_MAX); the
  // mug's limit is a width (16 of the widest letters), so it says how full the line is (one more wide letter, one more narrow one), never a
  // count it can't keep
  function roomSay(name, pid) {
    var len = Array.from(name).length, max = P.NAME_MAX || 20, word = len === 1 ? ' letter' : ' letters', on = ' on the ' + PROD[pid].one + '.';
    var fits = function (t) { try { return Array.from(t).length <= max && P.nameFit(t, pid).ok; } catch (e) { return false; } };
    if (pid === 'tee' || !P.nameFit) return len + ' / ' + max + ' letters';
    return len + word + (fits(name + 'W') ? ': it fits' + on : fits(name + 'i') ? ': it fits' + on.slice(0, -1) + ', with little room left.' : ': that\'s as long as it fits' + on);
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
    var d = st.draft, p = prodCat(d.product), baby = newborn(d.base);
    if (baby) d.pose = babyPose(p); // one pose for a newborn, whatever was asked (a link, an old line)
    var r = draftRecipe(), n = nameState(), tee = d.product === 'tee';
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
    $('#poses').innerHTML = (baby ? [[d.pose, 'Sleeping']] : POSES.filter(function (x) { return p.poses.indexOf(x[0]) >= 0; })).map(function (x) { return '<button type="button" data-pose="' + x[0] + '" aria-pressed="' + (d.pose === x[0]) + '">' + dogPic(d.base, x[0]) + x[1] + '</button>'; }).join('');
    $('#poseNote').hidden = !baby;
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
    $('#addMsg').textContent = full ? 'Your basket is full: it holds up to ' + maxLines() + ' different designs. Change or remove one there to make room.' : msg.bad ? 'Fix the name first, or turn it off.' : '';
    $('#makeBack').href = st.edit ? '#/basket' : '#/thing';
    keepMaking();
  }
  // review m1: what is being made survives a reload of this tab (sessionStorage, as the link dogs are): the dog, the draft and the line being
  // changed. Read back as untrusted like everything else (restoreMaking). Gone once the line is in the basket.
  var MAKE_KEY = 'dd_merch_make_v1';
  function keepMaking() {
    if (!cat) return;
    var d = st.draft;
    if (!st.dog || !(d || st.view === 'thing')) { ssSet(MAKE_KEY, null); return; } // kept while a dog's thing is chosen or made, not after
    try {
      var el = st.edit && basket.filter(function (l) { return l.id === st.edit; })[0];
      var o = { dog: { id: String(st.dog.id || ''), src: String(st.dog.src || ''), recipe: P.merchEncode([st.dog.recipe]), name: cleanWho(st.dog.name || '') } };
      if (d) o.draft = { base: P.merchEncode([d.base]), product: d.product, colour: d.colour, size: d.size, pose: d.pose, name_on: !!d.name_on, name: String(d.name || '').slice(0, 40), qty: d.qty, who: cleanWho(d.who || ''), ready: !!d.ready };
      if (d && el) o.edit = storeLine(el);
      ssSet(MAKE_KEY, JSON.stringify(o));
    } catch (e) { ssSet(MAKE_KEY, null); }
  }
  function restoreMaking() {
    if (!/^#\/(thing|make)\/?$/.test(location.hash)) return; // only a reload on those two steps picks up where it was
    var o = null; try { o = JSON.parse(ssGet(MAKE_KEY) || 'null'); } catch (e) { o = null; }
    if (!o || typeof o !== 'object' || !o.dog || typeof o.dog !== 'object') return;
    var one = function (s) { var x = typeof s === 'string' ? P.merchDecode(s) : { ok: false }; return x.ok && x.dogs.length === 1 && P.check(x.dogs[0]).ok ? x.dogs[0] : null; };
    var r = one(o.dog.recipe); if (!r) return;
    var same = st.dogs.concat(READY).filter(function (x) { return x.id === o.dog.id && P.merchEncode([x.recipe]) === o.dog.recipe; })[0];
    st.dog = same || { id: 'k-' + newId(), src: o.dog.src === 'ready' ? 'ready' : 'kept', recipe: r, name: cleanWho(o.dog.name) };
    var d = o.draft; if (!d || typeof d !== 'object') return;
    var base = one(d.base), p = prodCat(d.product); if (!base || !p) return;
    var col = colourCat(d.product, d.colour); if (!col) return;
    var size = null; if (p.sizes.length) { if (typeof d.size !== 'string' || col.sizes.indexOf(d.size) < 0) return; size = d.size; }
    if (typeof d.pose !== 'string' || p.poses.indexOf(d.pose) < 0) return;
    var q = typeof d.qty === 'number' && d.qty % 1 === 0 ? Math.max(1, Math.min(maxQty(), d.qty)) : 1;
    st.draft = { base: base, product: d.product, colour: d.colour, size: size, pose: d.pose, name_on: d.name_on === true, name: typeof d.name === 'string' ? d.name.slice(0, 40) : '', qty: q, who: cleanWho(d.who), ready: d.ready === true };
    if (o.edit) { var e = cleanLine(o.edit), was = e && basket.filter(function (l) { return sameThing(l, e); })[0]; if (was) st.edit = was.id; }
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
  function droppedWords(n) { return n === 1 ? 'One design in your basket can\'t be made any more, so we took it out.' : n + ' designs in your basket can\'t be made any more, so we took them out.'; }
  function lineUnit(l) { var p = prodCat(l.product); return p ? p.price + (l.product === 'tee' ? sizeAdd('tee', l.size) : 0) : 0; }
  function okQuote(q) { return !!q && typeof q === 'object' && Array.isArray(q.lines) && q.lines.length === basket.length && typeof q.total === 'number' && typeof q.subtotal === 'number' && typeof q.ship_fee === 'number'; }
  function lineHTML(l, i, q, need) {
    try {
      var r = recipeOf(l), ql = q && q.lines[i], C = l.product === 'tee' ? P.TEE_COLOURS.filter(function (x) { return x.id === l.colour; })[0] : null, who = whoOf(l, r);
      return '<li class="bl card' + (need ? ' needs' : '') + '" data-line="' + esc(l.id) + '">' + mockOf(r, l, PROD[l.product].title + ': ' + who) +
        '<div class="bt"><h3>' + PROD[l.product].title + '</h3>' + (need ? '<p class="lneed">This one needs a look.</p>' : '') + '<ul class="facts"><li>' + esc(who) + '</li><li>' + poseName(r, l.pose) + ' · ' + (l.name_on ? 'name on' : 'no name') + '</li>' +
        (C ? '<li>' + esc(C.name) + ' · ' + esc(l.size) + '</li>' : '') + '</ul>' +
        '<div class="brow"><div class="qty small" role="group" aria-label="How many"><button type="button" data-qm="' + esc(l.id) + '" aria-label="One less"' + (l.qty <= 1 ? ' disabled' : '') + '>−</button><output>' + esc(l.qty) + '</output><button type="button" data-qp="' + esc(l.id) + '" aria-label="One more"' + (l.qty >= maxQty() ? ' disabled' : '') + '>+</button></div>' +
        '<span class="lp" data-lp="' + (i + 1) + '">' + money(ql ? ql.total : lineUnit(l) * l.qty) + '</span></div>' + // no quote (a country coming soon, an error): the catalog's own prices (review m3)
        '<div class="brow2"><button type="button" class="lnk" data-chg="' + esc(l.id) + '">Change</button><button type="button" class="lnk" data-rm="' + esc(l.id) + '">Remove</button></div></div></li>';
    } catch (e) { // one line that can't draw never blanks the basket: it says so, and can be removed
      return '<li class="bl card broken" data-line="' + esc(l.id) + '"><div class="bt"><h3>' + esc(PROD[l.product] ? PROD[l.product].title : 'One design') + '</h3><p>We can\'t draw this one just now.</p>' +
        '<div class="brow2"><button type="button" class="lnk" data-rm="' + esc(l.id) + '">Remove</button></div></div></li>';
    }
  }
  function rBasket() {
    var c = country(), q = st.quote, e = st.qerr, pe = st.payErr, ei = e ? errInfo(e) : pe ? errInfo(pe) : null;
    $('#closed').hidden = true;
    var dn = $('#bdrop'); dn.hidden = !st.dropped;
    dn.textContent = st.dropped ? droppedWords(st.dropped) : '';
    if (!basket.length) {
      $('#blines').innerHTML = '<li class="empty"><p class="lead">Your basket is empty.</p><p>Pick a dog, then a mug or a tee.</p></li>';
    } else {
      $('#blines').innerHTML = basket.map(function (l, i) { return lineHTML(l, i, q, ei && ei.line === i + 1); }).join('');
    }
    if (st.view === 'basket') ticks('basket'); // the last line removed: the steps forget what an empty basket never saw
    var full = basket.length >= maxLines(), an = $('#another');
    // one word for a basket line, everywhere: a "design" (review M3); "things" are what gets made (the bag's count, the Things row)
    $('#bfull').textContent = full ? 'Your basket holds up to ' + maxLines() + ' different designs, up to ' + maxQty() + ' of each. To add another, change or remove one.' : basket.length ? 'Up to ' + maxLines() + ' different designs in one order, up to ' + maxQty() + ' of each.' : '';
    if (full) { an.setAttribute('aria-disabled', 'true'); an.removeAttribute('href'); } else { an.removeAttribute('aria-disabled'); an.href = '#/pick'; }
    an.textContent = basket.length ? '＋ Put another dog on something' : 'Put your dog on something'; // review m2
    $$('[data-qm]').forEach(function (b) { b.onclick = function () { bump(b.dataset.qm, -1); }; });
    $$('[data-qp]').forEach(function (b) { b.onclick = function () { bump(b.dataset.qp, 1); }; });
    $$('[data-rm]').forEach(function (b) { b.onclick = function () { remove(b.dataset.rm); }; });
    $$('[data-chg]').forEach(function (b) { b.onclick = function () { change(b.dataset.chg); }; });
    // ship to and the totals
    var sb = '<div class="lg">Shipping</div><p class="shipline">' + shipLine(basket.length && okQuote(q) ? q : null) + '</p>';
    if (c && !c.soon && q && etaLine(q.eta)) sb += '<p class="eta"><span aria-hidden="true">📦</span><span>' + esc(etaLine(q.eta)) + '</span></p>';
    $('#shipBox').innerHTML = sb;
    var t = '';
    if (basket.length && cat.sold_out_today) t += '<p class="qerr">' + errHTML(errInfo({ error: 'sold_out_today' })) + '</p>';
    if (basket.length && q) {
      t += '<table class="lines" id="qtable"><tr><td>Things (' + itemCount() + ')</td><td data-q="subtotal">' + money(q.subtotal) + '</td></tr>' +
        '<tr><td>Shipping</td><td data-q="ship">' + (q.ship_fee ? money(q.ship_fee) : 'Free') + '</td></tr>' +
        '<tr class="tot"><td>Total</td><td data-q="total">' + money(q.total) + '</td></tr></table>';
      var more = freeMore(q); if (more) t += '<p class="small2 left freemore" id="freeMore">' + more + '</p>'; // the rule itself is in the Shipping box above
      t += '<p class="small2 left">Prices are in US dollars. On the payment page you may be offered your own currency.</p>';
      (Array.isArray(q.notes) ? q.notes : []).forEach(function (k) { if (typeof k === 'string' && Object.prototype.hasOwnProperty.call(NOTE, k)) t += '<p class="small2 left note-' + k + '">' + NOTE[k] + '</p>'; });
    } else if (basket.length && e && c && c.soon && e.error === 'country_closed') {
      // a country coming soon: the Shipping box above already says so (review m3); the lines keep their catalog prices
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
    api.checkout(payBody()).then(function (r) {
      // part 9 (P2): only a live order server answers { order, url }. The page goes to Stripe's own payment page, and only there: any other
      // answer (no url, another host, http, odd characters) is the kind "couldn't reach the payment page" error, and the page stays.
      // The page's own fake (test mode) never pays: whatever it answered, it is the "not open yet" card.
      if (api.mode !== 'live') { closedCard(''); return; }
      var url = r && typeof r === 'object' && typeof r.url === 'string' ? r.url : '';
      if (url.indexOf(STRIPE_PAY) === 0 && url.length <= 2048 && !/[\s"'<>\\]/.test(url)) { location.assign(url); return; }
      st.payErr = { error: 'no_pay_page' }; rBasket();
      var pb = $('#payErr'); try { pb.focus({ preventScroll: false }); } catch (x) { pb.focus(); }
    }, function (e) {
      e = e && typeof e === 'object' ? e : { error: 'busy' };
      if (e.error === 'merch_closed') { closedCard(''); return; }
      // the nonce went with an order that is past paying (paid, or its payment page ran out): the next tap starts a new one
      if (e.error === 'nonce_used') st.nonce = null;
      // a new price is shown and asked about again: never paid without the buyer seeing it
      if (e.error === 'price_changed') { if (okQuote(e.quote)) st.quote = e.quote; else { requote(); return; } }
      st.payErr = e; rBasket();
      var pb = $('#payErr'); try { pb.focus({ preventScroll: false }); } catch (x) { pb.focus(); }
    }).then(function () { btn.disabled = !(basket.length && st.quote && !cat.sold_out_today); });
  }
  var STRIPE_PAY = 'https://checkout.stripe.com/'; // Stripe Checkout's own pages (the order server's session url)
  function closedCard(why) {
    var c = $('#closed'); c.hidden = false; $('#closedWhy').textContent = why || 'When the shop opens, this button takes you to Stripe\'s secure page to pay.';
    $('#demoRow').hidden = !DEMO; try { c.focus({ preventScroll: false }); } catch (e) { c.focus(); }
  }
  function demoPay() {
    if (!DEMO || !st.quote) return;
    api.demoPay(payBody()).then(function (r) { basket = []; basketChanged(); saveBasket(); st.quote = null; go('#/order/' + r.order); }, function () { closedCard('That didn\'t work this time.'); });
  }

  // ---- 6. thank you / the order page (part 6: every state the order server answers; docs/design/merch/PART6.md). The server's answer is
  //      untrusted text: everything is escaped or set as text. The page never needs a line's recipe (the server clears recipes after 24 months):
  //      the dog is drawn only when one is there. No address or email is ever shown or kept: the address form's values go to the server and
  //      are then dropped (nothing in localStorage or sessionStorage, nothing left in the page after it is sent).
  var IS_NEW = Q.get('new') === '1', TEST_ORDERS = api.mode === 'test', DONE_KEY = 'dd_merch_done_v1', HOUR_MS = 3600000;
  // polls: every 5 s for the first minute, then every 30 s up to 10 minutes, then "reload in a minute" (review finding 10)
  var ORD = { id: null, note: '', polls: 0, pollFrom: 0, stale: false, timer: null, cleared: false, focus: false, POLL_FAST: 5000, POLL_SLOW: 30000, POLL_FOR: 600000 };
  // review finding 3: ?new=1 (Stripe's way back) is dropped from the address after the first read, so a bookmark or a reload later never
  // empties a new basket; the paid basket is emptied once per order, and only within the hour after paying
  function dropNew() {
    if (!/[?&]new=1/.test(location.search)) return;
    var q = new URLSearchParams(location.search); q.delete('new'); var qs = q.toString();
    try { history.replaceState(history.state, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) { /* the old address stays */ }
  }
  function rOrder(id) {
    var b = $('#orderBody');
    if (ORD.timer) { clearTimeout(ORD.timer); ORD.timer = null; }
    if (id !== ORD.id) { ORD.id = id; ORD.note = ''; ORD.polls = 0; ORD.pollFrom = 0; ORD.stale = false; }
    if (!id) { b.innerHTML = '<p class="lead">No order to show.</p>'; return; }
    if (!st.order || st.order.id !== id) b.innerHTML = '<p class="lead">Finding your order…</p>';
    api.order(id).then(function (o) {
      dropNew();
      if (!o || typeof o !== 'object' || !Array.isArray(o.lines)) return orderGone(b, 'not_found');
      var paid = num(o.paid_at), waiting = o.status === 'open' && (IS_NEW || o.pay_pending === true) && st.view === 'order';
      if (waiting && !ORD.pollFrom) ORD.pollFrom = Date.now();
      ORD.stale = waiting && Date.now() - ORD.pollFrom >= ORD.POLL_FOR;
      st.order = o; try { drawOrder(o); } catch (e) { orderGone(b, 'busy'); return; }
      if (ORD.focus) { ORD.focus = false; var ht = $('#h-order-t'); if (ht) try { ht.focus({ preventScroll: true }); } catch (e) { ht.focus(); } } // review finding 11
      if (IS_NEW && !ORD.cleared && paid && Date.now() - paid < HOUR_MS && o.status !== 'expired' && o.status !== 'open' && lsGet(DONE_KEY) !== o.id) { ORD.cleared = true; lsSet(DONE_KEY, o.id); basket = []; basketChanged(); saveBasket(); } // paid: the basket is done
      if (waiting && !ORD.stale) { ORD.polls++; ORD.timer = setTimeout(function () { if (st.view === 'order' && ORD.id === id) rOrder(id); }, Date.now() - ORD.pollFrom < 60000 ? ORD.POLL_FAST : ORD.POLL_SLOW); } // the payment is on its way to us
    }, function (e) { dropNew(); orderGone(b, e && e.error === 'not_found' ? 'not_found' : e && e.error === 'slow_down' ? 'slow_down' : 'offline'); });
  }
  // what a failed button says, in its own words, shown on the page (review finding 4: before, every error said "too late" in a hidden region)
  var ACT_ERR = { too_late: 'It\'s too late to cancel now: printing has started. If something arrives damaged, we\'ll make it right.',
    not_allowed: 'Your bank is looking at this payment, so we\'ve paused it. Nothing can be changed until the bank has decided.',
    not_late: 'Nothing is late any more, so there was nothing to cancel.', slow_down: 'That was a lot of tries in a short time. Wait a minute, then try again.',
    offline: 'We couldn\'t reach the shop. Check your connection, then try again.', busy: 'We\'re a little busy just now. Please try again in a moment.',
    busy_late: 'We\'re sending your order to print right this minute. Please try again in a minute or two.' };
  function actErr(e, late) { var c = e && typeof e.error === 'string' ? e.error : 'busy'; if (late && c === 'busy') c = 'busy_late'; return ACT_ERR[c] || ACT_ERR.busy; }
  // the posting date in words, as the emails say it: the UTC date of the moment, with "by" (never earlier than the moment we keep to)
  var WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function postDay(ms) { var d = new Date(num(ms)); return WD[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MN[d.getUTCMonth()]; }
  function orderGone(b, why) {
    if (why === 'not_found') { b.innerHTML = '<div class="thanks"><h1 class="mh2" id="h-order-t" tabindex="-1">We couldn\'t find this order</h1><p class="lead">Check the link in your email. If it still doesn\'t open, write to us at ' + CONTACT + ' and we\'ll find it for you.</p><div class="navrow"><a class="btn mint" href="#/">Back to the shop</a></div></div>'; return; }
    b.innerHTML = '<div class="thanks"><h1 class="mh2" id="h-order-t" tabindex="-1">We couldn\'t reach the shop just now</h1><p class="lead">' + (why === 'slow_down' ? 'That was a lot of tries in a short time. Wait a minute, then try again.' : 'Your order is safe. Check your connection, then try again.') +
      '</p><div class="navrow ctr"><button type="button" class="btn mint" id="orderRetry">Try again</button></div></div>';
    $('#orderRetry').onclick = function () { rOrder(ORD.id); };
  }
  function fmtDate(ms) { var d = new Date(num(ms)); try { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d.toDateString(); } }
  function fmtTime(ms) { var d = new Date(num(ms)); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  // what the buyer paid in their own currency (display only; amounts in that currency's minor units, as Stripe gives them)
  var ZERO_DEC = 'BIF CLP DJF GNF JPY KMF KRW MGA PYG RWF UGX VND VUV XAF XOF XPF', THREE_DEC = 'BHD JOD KWD OMR TND';
  function presMoney(p) {
    if (!p || typeof p !== 'object' || typeof p.currency !== 'string' || !isFinite(p.amount)) return '';
    var c = p.currency.toUpperCase(); if (!/^[A-Z]{3}$/.test(c) || c === 'USD') return '';
    var d = ZERO_DEC.indexOf(c) >= 0 ? 0 : THREE_DEC.indexOf(c) >= 0 ? 3 : 2, v = num(p.amount) / Math.pow(10, d);
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: c, minimumFractionDigits: d, maximumFractionDigits: d }).format(v); } catch (e) { return c + ' ' + v.toFixed(d); }
  }
  var LDEAD = ['void', 'replaced', 'cancelled', 'rejected'], LSHIP = ['shipped', 'delivered'];
  var HOLD_SAY = { review: 'Getting ready to print. It\'s taking a little longer than usual.', render: 'Getting ready to print. It\'s taking a little longer than usual.',
    provider: 'Getting ready to print. It\'s taking a little longer than usual.', wallet: 'Getting ready to print. It\'s taking a little longer than usual.', draft_mode: 'Getting ready to print.' };
  var DISPUTE_SAY = 'Your bank is looking at this payment, so we\'ve paused it. Nothing more happens until the bank has decided. Questions? Write to us at ' + CONTACT + '.';
  // review finding 8: a dispute after something was posted pauses nothing that is on its way
  var DISPUTE_SENT_SAY = 'Your bank is looking at this payment. What we posted is yours either way, and the bank decides about the money. Questions? Write to us at ' + CONTACT + '.';
  function giftHTML(o) {
    var name = typeof o.gift_name === 'string' && o.gift_name ? cleanWho(o.gift_name) : '';
    return '<div class="gift card tape t2" id="giftBox"><h2 class="h2s">A little thank-you for your dog</h2>' +
      '<p>With your order comes ' + (name ? 'the <b>' + esc(name) + '</b>, a little gift for your dog in the game.' : 'a little gift for your dog in the game.') + '</p>' +
      '<div class="coderow"><span class="code" id="giftCode">' + esc(String(o.gift_code)) + '</span><button type="button" class="btn quiet" id="giftCopy">Copy</button></div>' +
      '<p class="small2 left" id="giftSaid" role="status" aria-live="polite"></p>' +
      '<p class="small2 left">In the game, open <b>Settings</b> (on a phone: the <b>⋯</b> menu), tap <b>Have a code?</b> and type the code. Gift codes are for players with the free account (cloud save), so your gift stays safe on every device. Each game account can use one merch thank-you code: if you order again, the next one is yours to pass to a friend.</p>' +
      '<p class="small2 left"><a class="lnk" href="https://doodledoggo.app" target="_blank" rel="noopener">Play Doodle Doggo</a></p></div>';
  }
  // the address form (held address, or a parcel that came back): the order's own country only; values go to the server, then are dropped
  var AFIELDS = [['name', 'Full name', 'name', 80, true], ['line1', 'Street address', 'address-line1', 120, true], ['line2', 'Apartment, suite, floor (if any)', 'address-line2', 120, false],
    ['city', 'Town or city', 'address-level2', 80, true], ['state', 'State, province or region (if any)', 'address-level1', 60, false], ['postal', 'Postal code', 'postal-code', 20, true]];
  var AERR = { name: 'Please type the name for the parcel.', line1: 'Please type the street address.', line2: 'Please check the second line of the address.', city: 'Please type the town or city.',
    state: 'Please check the state, province or region.', postal: 'Please type the postal code.', country: 'Something went wrong with the country. Reload the page and try again.',
    address: 'Our print partner still can\'t send to this address. Please check it once more.' };
  function addressHTML(o, reship) {
    var c = typeof o.country === 'string' && /^[A-Z]{2}$/.test(o.country) ? o.country : '';
    return '<div class="addr card" id="addrBox"><h2 class="h2s" id="h-addr">' + (reship ? 'Where should we send it again?' : 'Please check your address') + '</h2>' +
      '<p>' + (reship ? 'A parcel came back to our print partner: it couldn\'t be delivered. Type the address again and we\'ll send it once more, free.' : 'We couldn\'t send to this address. Please check it.') + '</p>' +
      '<form id="addrForm" novalidate autocomplete="on">' + AFIELDS.map(function (f) {
        return '<label class="afield" for="af-' + f[0] + '"><span>' + f[1] + '</span><input id="af-' + f[0] + '" name="' + f[0] + '" maxlength="' + f[3] + '" autocomplete="shipping ' + f[2] + '"' + (f[0] === 'name' || f[0] === 'city' ? ' autocapitalize="words"' : f[0] === 'postal' ? ' autocapitalize="characters"' : '') + (f[4] ? ' required' : '') + ' aria-describedby="ae-' + f[0] + '"><small class="aerr" id="ae-' + f[0] + '"></small></label>';
      }).join('') +
      '<p class="acountry">Country: <b>' + esc(c ? cname(c) : '') + '</b><br><span class="note">This order can only go to ' + esc(c ? placeName({ code: c }) : 'its country') + '.</span></p>' +
      '<p class="small2 left">It goes straight to our print partner to send your parcel. We don\'t keep it.</p>' +
      '<div class="qerr" id="addrErr" role="alert" hidden></div>' +
      '<div class="row arow"><button type="submit" class="btn go" id="addrSend">Send it here</button>' + (reship ? '' : '<button type="button" class="btn quiet" id="addrRefund">Refund me instead</button>') + '</div></form>' +
      (reship ? '' : '<p class="small2 left">Rather not? We can refund the whole order instead. If we don\'t hear from you within 7 days, we\'ll refund it anyway.</p>') + '</div>';
  }
  function lineTag(l) {
    var q = num(l.qty), r = num(l.refunded_qty);
    if (l.status === 'rejected') return '<p class="ltag">We couldn\'t print this one, so we refunded it.</p>';
    if (l.status === 'replaced') return '<p class="ltag">We\'re making a new one of this: see below.</p>';
    if (l.reprint_of != null && r < q) return '<p class="ltag new">A new one, free: on its way to you.</p>';
    if (r >= q && q > 0 && l.status !== 'cancelled') return '<p class="ltag">Refunded.</p>';
    if (r > 0 && r < q) return '<p class="ltag">Refunded: ' + r + ' of ' + q + '.</p>';
    return '';
  }
  // a line in words, as the emails say it: "Tee with Mochi, navy, M"
  function lineWords(l) {
    var pid = l.product === 'tee' ? 'tee' : 'mug', r = recipeOf(l), nm = typeof l.name === 'string' && l.name ? cleanWho(l.name) : '', C = pid === 'tee' ? P.TEE_COLOURS.filter(function (x) { return x.id === l.colour; })[0] : null;
    return (pid === 'tee' ? 'Tee' : 'Mug') + ' with ' + (nm || (r ? 'your ' + breedOf(r) : 'your dog')) + (C ? ', ' + C.name.toLowerCase() + ', ' + String(l.size || '') : '');
  }
  function drawOrder(o) {
    var b = $('#orderBody'), s = String(o.status || ''), hold = typeof o.hold === 'string' ? o.hold : '', parcels = (Array.isArray(o.parcels) ? o.parcels : []).filter(function (p) { return p && typeof p === 'object'; });
    var tot = o.totals && typeof o.totals === 'object' ? o.totals : {}, L = o.lines.filter(function (l) { return l && typeof l === 'object'; });
    var disputed = hold === 'dispute' || o.dispute === 'open', ended = { cancelled: 1, refunded: 1, expired: 1 }[s] ? s : '';
    var sent = parcels.filter(function (p) { return p.shipped_at; }), came = sent.filter(function (p) { return p.delivered_at; });
    var live = L.filter(function (l) { return LDEAD.indexOf(l.status) < 0 && num(l.refunded_qty) < num(l.qty); });
    var unsent = live.filter(function (l) { return LSHIP.indexOf(l.status) < 0; }), lateL = o.late === true ? unsent.filter(function (l) { return l.reprint_of == null; }) : [];
    var groups = {}; live.forEach(function (l) { groups[l.product === 'tee' ? 'tee' : 'mug'] = 1; }); sent.forEach(function (p) { groups[p.product === 'tee' ? 'tee' : 'mug'] = 1; });
    // review finding 8: delivered from the parcels alone (every parcel sent has arrived and nothing is left to send; a refund after delivery too)
    var nParcels = Math.max(sent.length, Object.keys(groups).length), allCame = !!sent.length && came.length === sent.length && !unsent.length;
    // where it is now: 0 received, 1 being printed, 2 on its way, 3 delivered
    var stage = sent.length ? (allCame ? 3 : 2) : s === 'confirming' || s === 'confirmed' ? 1 : s === 'paid' && !o.can_cancel ? 1 : 0;
    var first = null; L.some(function (l) { var r = l && recipeOf(l); if (r) first = r; return !!r; });
    var pic = ''; try { pic = first ? dogPic(first, 'happy') : ''; } catch (e) { pic = ''; }
    var track = function (p) { return typeof p.tracking_url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(p.tracking_url) ? ' <a class="lnk" href="' + esc(p.tracking_url) + '" target="_blank" rel="noopener noreferrer">Track it' + (sent.length > 1 ? ' (' + (p.product === 'tee' ? 'tee' : 'mug') + ')' : '') + '</a>' : ''; };
    var postBy = num(o.ship_by) > 0 ? postDay(o.ship_by) : '', lateBy = num(o.late_eta) > 0 ? postDay(o.late_eta) : '';
    // the top: a calm thank-you, or what happened (?new=1 only changes an order still waiting for its payment). Review M5/M6: each state has its
    // own title, and the tracker below says the same; the receipt is spoken of only in the first hour after paying, never on an unpaid order
    // fresh: the hour after paying (a clock a little off either way still counts)
    var paid = num(o.paid_at), fresh = !!paid && Math.abs(Date.now() - paid) < HOUR_MS, addrHold = s === 'held' && hold === 'address', back = hold === 'reship' && !ended && !disputed;
    var title = ended === 'cancelled' ? 'Your order is cancelled' : ended === 'refunded' ? 'Your order is refunded' : ended === 'expired' ? 'This order wasn\'t paid' :
      s === 'open' ? (IS_NEW ? 'Thank you! Your payment is on its way to us' : o.pay_pending ? 'Waiting for your bank' : 'Waiting for payment') :
      disputed && !sent.length ? 'Your order is paused' : addrHold && !sent.length ? 'We need your address' : back ? 'A parcel came back to us' :
      (s === 'paid' || s === 'held') && !sent.length && fresh ? 'Thank you! Your order is in.' : s === 'held' && !sent.length ? 'Getting your order ready' :
      s === 'paid' || s === 'confirming' || s === 'confirmed' ? 'Your order is being printed' : allCame ? 'Your order has been delivered' : sent.length && unsent.length ? 'Part of your order is on its way' : sent.length ? 'Your order is on its way' : 'Your order';
    var thanks = title === 'Thank you! Your order is in.';
    var lead = ended === 'cancelled' ? 'Nothing will be printed. Your refund is on its way: it can take a few days to show on your card.' :
      ended === 'refunded' ? 'Your money is on its way back: it can take a few days to show on your card.' : ended === 'expired' ? 'Nothing was paid, so nothing will be made.' :
      s === 'open' ? (ORD.stale ? 'It\'s taking a little longer than usual. Reload this page in a minute to see it.' : o.pay_pending ? 'Your bank is still sending the payment. This page shows it as soon as it arrives.' : IS_NEW ? 'It usually takes a moment. This page shows it as soon as it arrives.' : 'This order isn\'t paid yet.') :
      disputed && !sent.length ? '' : addrHold && !sent.length ? 'Your order is safe. We just need an address we can send it to.' : back ? 'It couldn\'t be delivered. Tell us where to send it, and we\'ll send it again, free.' :
      thanks ? 'A receipt is on its way to your email.' : '';
    var h = (TEST_ORDERS ? '<p class="testtag">Test order: made up to show this page. Nothing was paid and nothing will be printed.</p>' : '') +
      '<div class="thanks">' + pic + '<h1 class="mh2" id="h-order-t" tabindex="-1">' + esc(title) + '</h1>' +
      '<p class="lead"><span class="ordnum">Order ' + esc(String(o.id || '').replace(/^mo_/, '')) + '</span>' + (lead ? '<br>' + esc(lead) : '') + '</p></div>';
    if (ORD.note) h += '<p class="oknote card" role="status" id="ordNote">' + esc(ORD.note) + '</p>';
    if (o.resting === true && !ended) h += '<p class="restnote card">The shop is resting for now. Your order is safe, and we\'re still making it.</p>';
    // what happens now, and the cancel hour: only what the server says (can_cancel, cancel_until); after the hour there is no cancel line at all
    var cu = num(o.cancel_until), sameDay = new Date(cu).toDateString() === new Date().toDateString(), canCancel = o.can_cancel === true && !!cu && !disputed && !ended;
    var cancelLine = canCancel ? 'We\'ll start printing at <b>' + fmtTime(cu) + (sameDay ? '' : ' on ' + esc(fmtDate(cu))) + '</b>. If you change your mind before then, you can cancel here.' : '';
    var box = [];
    if (!ended) {
      if (s === 'open') box.push(o.pay_pending ? 'Waiting for your bank.' : 'Waiting for payment.');
      else if (disputed) box.push(esc(sent.length ? DISPUTE_SENT_SAY : DISPUTE_SAY));
      else if (s === 'held' && hold !== 'address') box.push(esc(HOLD_SAY[hold] || HOLD_SAY.review));
      if (!disputed && (s === 'paid' || s === 'held') && canCancel) box.push(cancelLine);
      else if (!disputed && (s === 'paid' || s === 'confirming' || s === 'confirmed')) box.push('Printing has started.');
      // the posting promise of this order (the delay plan a), until something is posted or it runs late
      if (!disputed && postBy && !sent.length && !lateL.length && s !== 'open' && hold !== 'address') box.push('We\'ll post it by <b>' + esc(postBy) + '</b>.');
    }
    if (box.length) h += '<div class="cancelbox card">' + box.map(function (x) { return '<p>' + x + '</p>'; }).join('') + (canCancel ? '<button type="button" class="btn quiet" id="cancelBtn">Cancel my order</button>' : '') + '</div>';
    var formOn = !ended && !disputed && ((s === 'held' && hold === 'address') || (hold === 'reship' && /^(part_shipped|shipped|confirmed)$/.test(s)));
    if (formOn) h += addressHTML(o, hold === 'reship');
    // the delay notice's choice (US mail-order rule; the delay plan): the late things by name, the date we said and the new one; waiting needs
    // no answer, "Keep waiting" tells the server; cancel the late part any time until it's posted. One label, as in the email.
    if (lateL.length && !ended && !disputed) {
      var whole = !sent.length;
      h += '<div class="latebox card" id="lateBox"><h2 class="h2s">Taking longer than we said</h2>' +
        (o.late_ok === true ? '<p>Thank you for waiting. We\'re still on it, and we\'ll email you as soon as it\'s posted.</p>' :
          '<p>We\'re sorry: we said we\'d post your order by <b>' + esc(postBy) + '</b>, and ' + (whole ? 'it hasn\'t gone out yet.' : 'part of it hasn\'t gone out yet.') + '</p>') +
        '<ul class="latelist">' + lateL.map(function (l) { return '<li>' + esc((num(l.qty) - num(l.refunded_qty) > 1 ? (num(l.qty) - num(l.refunded_qty)) + ' × ' : '') + lineWords(l)) + '</li>'; }).join('') + '</ul>' +
        (o.late_ok !== true && lateBy ? '<p>We now expect to post ' + (whole ? 'it' : 'the late part') + ' by <b>' + esc(lateBy) + '</b>. You don\'t need to do anything to keep waiting.</p>' : '') +
        '<p>Or cancel the late part for a full refund, any time until it\'s posted.</p>' +
        '<div class="row arow">' + (o.late_ok === true ? '' : '<button type="button" class="btn mint" id="lateWait">Keep waiting</button>') + '<button type="button" class="btn quiet" id="lateCancel">Cancel the late part</button></div></div>';
    }
    // where it is now (not for an order that ended before anything was sent). Numbered dots, a drawn tick when done (review finding 15: no emoji)
    // step 1 says what the title says: waiting for the payment (no receipt: nothing was paid), the address or the bank; the receipt only in
    // the first hour after paying (review M5, M6)
    var step1 = s === 'open' ? [o.pay_pending ? 'Waiting for your bank' : 'Waiting for payment', (IS_NEW || o.pay_pending) && !ORD.stale ? 'This page shows it as soon as it arrives.' : 'We start once it\'s paid.'] :
      ['Order received', (paid ? fmtDate(paid) + '.' : '') + (stage > 0 ? '' : disputed ? ' Paused while your bank looks at the payment.' : addrHold ? ' Waiting for your address.' : s === 'held' && !thanks ? ' Getting ready to print.' : '') + (thanks ? ' Your receipt is in your email.' : '')];
    var S = [[step1[0], step1[1].trim()],
      ['Being printed', 'At our print partner: printing usually takes 2 to 5 working days.'],
      ['On its way', sent.length ? 'Sent ' + fmtDate(sent[0].shipped_at) + (unsent.length && nParcels > 1 ? ' (' + sent.length + ' of ' + nParcels + ' parcels)' : sent.length > 1 ? ' (' + sent.length + ' parcels)' : '') + '.' + (back ? ' A parcel came back to us: tell us where to send it again.' : '') : 'You get an email with a tracking link.'],
      ['Delivered', allCame ? 'Delivered ' + fmtDate(came[came.length - 1].delivered_at) + '. Say hello to your dog, in real life.' : 'Say hello to your dog, in real life.']];
    var showTrack = !ended || sent.length, STATE = { done: 'Done: ', now: 'Now: ', later: '' };
    h += '<div class="order">';
    if (showTrack) h += '<div class="card"><h2 class="h2s">Where is it now?</h2><ol class="track">' + S.map(function (x, i) {
      var c = i < stage ? 'done' : i === stage ? 'now' : 'later';
      return '<li class="' + c + '"><span class="dot" aria-hidden="true">' + (c === 'done' ? '<i class="tick"></i>' : String(i + 1)) + '</span><span><b>' + (STATE[c] ? '<span class="vh">' + STATE[c] + '</span>' : '') + x[0] + '</b><span>' + esc(x[1]) + (i === 2 ? sent.map(track).join('') : '') + '</span></span></li>';
    }).join('') + '</ol><p class="note">This page is your order page: bookmark it, or use the link in your email.</p></div>';
    h += '<div>';
    if (o.gift === 'ready' && o.gift_code && typeof o.gift_code === 'string') h += giftHTML(o);
    else if (o.gift === 'soon' && !ended) h += '<div class="gift card tape t2" id="giftSoon"><h2 class="h2s">A little thank-you for your dog</h2><p>A little gift for your dog in the game will be waiting here once printing starts.</p></div>';
    h += '<ul class="blines">' + L.map(function (l) {
      var pid = l.product === 'tee' ? 'tee' : 'mug', r = null, C = pid === 'tee' ? P.TEE_COLOURS.filter(function (x) { return x.id === l.colour; })[0] : null, pic2 = '';
      try { r = recipeOf(l); pic2 = mockOf(r, { product: pid, colour: C ? C.id : 'white', pose: POSE_NAME[l.pose] ? l.pose : 'stand', name_on: l.name_on === true }, PROD[pid].title); } catch (e) { pic2 = ''; }
      var nm = typeof l.name === 'string' && l.name ? cleanWho(l.name) : r && r.n ? r.n : '', free = l.reprint_of != null;
      return '<li class="bl card' + (l.status === 'replaced' || l.status === 'rejected' ? ' gone' : '') + '">' + pic2 + '<div class="bt"><h3>' + PROD[pid].title + '</h3><ul class="facts"><li>' + esc(nm || (r ? 'Your ' + breedOf(r) : 'Your dog')) + '</li>' + (C ? '<li>' + esc(C.name) + ' · ' + esc(l.size) + '</li>' : '') + (r && poseName(r, l.pose) ? '<li class="opose">' + poseName(r, l.pose) + '</li>' : '') + '<li>How many: ' + esc(num(l.qty)) + '</li></ul>' +
        (lateL.indexOf(l) >= 0 ? '<p class="ltag late">Running late' + (lateBy && o.late_ok !== true ? ': we now expect to post it by ' + esc(lateBy) : '') + '.</p>' : lineTag(l)) + '<span class="lp">' + (free ? 'Free' : money(num(l.unit) * num(l.qty))) + '</span></div></li>';
    }).join('') + '</ul><table class="lines"><tr><td>Things</td><td>' + money(tot.subtotal) + '</td></tr><tr><td>Shipping</td><td>' + (num(tot.ship_fee) ? money(tot.ship_fee) : 'Free') + '</td></tr>' +
      (num(tot.tax) ? '<tr><td>' + (num(tot.subtotal) + num(tot.ship_fee) + num(tot.tax) === num(tot.total) ? 'Tax' : 'Tax (included in the prices)') + '</td><td>' + money(tot.tax) + '</td></tr>' : '') + '<tr class="tot"><td>Total</td><td>' + money(tot.total) + '</td></tr>' + (num(tot.refunded) ? '<tr><td>Refunded</td><td data-q="refunded">' + money(tot.refunded) + '</td></tr>' : '') + '</table>';
    var pm = presMoney(o.pres); if (pm) h += '<p class="small2 left" id="presLine">Prices are in US dollars. You paid ' + esc(pm) + ' at checkout' + (num(tot.refunded) ? '; refunds come back in that currency at the same rate.' : '.') + '</p>';
    if (ended === 'cancelled' && L.some(function (l) { return l.reprint_of == null && recipeOf(l); })) h += '<div class="navrow"><button type="button" class="btn mint" id="putBack">Put these back in my basket</button></div>';
    h += '<p class="small2 left">Something wrong when it arrives? Reply to the order email with a photo and we\'ll make it right.</p><div class="navrow"><a class="btn mint" href="#/pick">Put another dog on something</a></div></div></div>';
    b.innerHTML = h;
    var cb = $('#cancelBtn'); if (cb) cb.onclick = function () { openDlg($('#cancelDlg'), $('#cancelNo'), cb); };
    var gc = $('#giftCopy'); if (gc) gc.onclick = copyGift;
    var lw = $('#lateWait'); if (lw) lw.onclick = function () {
      lw.disabled = true;
      api.wait(o.id).then(function () { ORD.note = 'Thank you for waiting. We\'ll email you as soon as it\'s posted.'; ORD.focus = true; rOrder(o.id); say('Thank you for waiting.'); },
        function (e) { ORD.note = actErr(e, true); ORD.focus = true; rOrder(o.id); });
    };
    var lc = $('#lateCancel'); if (lc) lc.onclick = function () { ask('Cancel the late part?', 'The things that haven\'t been posted yet are refunded in full. Anything already on its way still comes to you.', 'Yes, cancel the late part', 'Keep waiting', function () {
      // third review (R3-m3): refund 'pending': the cancel is in, and the refund follows once our print partner answers (we email the buyer)
      api.cancel(o.id, { scope: 'late' }).then(function (r) { ORD.note = r && r.refund === 'pending' ? 'Your cancel is in. We\'re checking with our print partner, and your refund follows: we\'ll email you.' : 'Done: we\'ve refunded the late part. It can take a few days to show on your card.'; ORD.focus = true; rOrder(o.id); }, function (e) { ORD.note = actErr(e, true); ORD.focus = true; rOrder(o.id); });
    }, lc); };
    var pb = $('#putBack'); if (pb) pb.onclick = function () { putBack(o); };
    if (formOn) bindAddress(o);
  }
  // Copy: the clipboard when the browser allows it; otherwise the code is selected so it can be copied by hand (no permission needed)
  function copyGift() {
    var el = $('#giftCode'), said = $('#giftSaid'); if (!el) return;
    var code = el.textContent, done = function (ok) { said.textContent = ok ? 'Copied' : 'The code is selected: copy it with your keyboard, or press and hold.'; };
    try { var r = document.createRange(); r.selectNodeContents(el); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); } catch (e) { /* fine */ }
    var byHand = function () { var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } done(ok); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(function () { done(true); }, byHand); return; } } catch (e) { /* no clipboard */ }
    byHand();
  }
  function bindAddress(o) {
    var f = $('#addrForm'), err = $('#addrErr'), send = $('#addrSend'), busy = false;
    var show = function (t, field) {
      $$('.aerr', f).forEach(function (x) { x.textContent = ''; }); $$('input', f).forEach(function (x) { x.removeAttribute('aria-invalid'); });
      var at = !!(field && $('#af-' + field)); // a field's error is said once, at the field (review m8); the box under the form is for the rest
      if (at) { $('#af-' + field).setAttribute('aria-invalid', 'true'); $('#ae-' + field).textContent = t; try { $('#af-' + field).focus(); } catch (e) { /* fine */ } }
      err.hidden = !t || at; err.innerHTML = t && !at ? '<span class="errt">' + esc(t) + '</span>' : '';
    };
    f.onsubmit = function (e) {
      e.preventDefault(); if (busy) return;
      var body = { country: o.country };
      for (var i = 0; i < AFIELDS.length; i++) { var k = AFIELDS[i][0], v = String($('#af-' + k).value || '').trim(); if (AFIELDS[i][4] && !v) return show(AERR[k], k); body[k] = v; }
      busy = true; send.disabled = true; show('');
      api.address(o.id, body).then(function (r) {
        body = null; f.reset(); // the values are gone from the page as soon as they are sent
        ORD.note = r && typeof r.say === 'string' ? r.say.slice(0, 300) : 'Thanks! We\'ll send it there.'; rOrder(o.id);
      }, function (x) {
        body = null; busy = false; send.disabled = false; x = x || {};
        var c = String(x.error || 'busy');
        if (c === 'bad_address') return show(AERR[x.field] || AERR.address, AERR[x.field] && x.field !== 'address' && x.field !== 'country' ? x.field : null);
        if (c === 'other_country') return show('We can only send this order to ' + (typeof x.country === 'string' && /^[A-Z]{2}$/.test(x.country) ? placeName({ code: x.country }) : 'its own country') + '. To send it somewhere else, we\'ll refund you and you can order again.');
        if (c === 'not_needed') { ORD.note = 'Your address is sorted already: nothing more to do.'; return rOrder(o.id); }
        if (c === 'slow_down') return show('That was a lot of tries in a short time. Wait a minute, then try again.');
        if (c === 'offline') return show('We couldn\'t reach the shop. Check your connection, then try again.');
        return show('One moment, please try again.');
      });
    };
    var rf = $('#addrRefund'); if (rf) rf.onclick = function () { ask('Refund the whole order?', 'We won\'t send anything, and all of your money comes back, shipping too.', 'Yes, refund me', 'Keep my order', function () {
      api.refundHeld(o.id).then(function () { ORD.note = 'Done: we\'ve refunded all of it. It can take a few days to show on your card.'; rOrder(o.id); }, function (e) { ORD.note = e && e.error === 'not_allowed' ? 'Your address is sorted already, so there was nothing to refund.' : actErr(e); rOrder(o.id); });
    }, rf); };
  }
  // "Put these back in my basket" (a cancelled order, TRANSACTIONS 4): the dogs and choices come back from the order's own lines, checked again
  function putBack(o) {
    var n = 0;
    o.lines.forEach(function (l) {
      if (!l || l.reprint_of != null || typeof l.recipe !== 'string') return;
      var c = null; try { c = cleanLine({ recipe: l.recipe, product: l.product, colour: l.colour, size: l.product === 'tee' ? l.size : null, pose: l.pose, name_on: l.name_on === true, qty: num(l.qty) || 1, who: '' }); } catch (e) { c = null; }
      if (!c) return;
      var same = basket.filter(function (x) { return sameThing(x, c); })[0];
      if (same) { same.qty = Math.min(maxQty(), same.qty + c.qty); n++; return; }
      if (basket.length >= maxLines()) return;
      c.id = newId(); basket.push(c); n++;
    });
    basketChanged(); saveBasket(); requote(); say(n ? 'They\'re back in your basket.' : 'We couldn\'t put these back, sorry.'); if (n) go('#/basket');
  }
  // a yes/no dialog (review finding 11): it opens on the safe answer ("No"); closed without an answer, the focus goes back to the button that
  // opened it; after an answer the order is drawn again and its title takes the focus (ORD.focus)
  function openDlg(d, safe, opener) {
    d.showModal(); try { safe.focus(); } catch (e) { /* fine */ }
    d.onclose = function () { if (!ORD.focus && opener && document.body.contains(opener)) try { opener.focus(); } catch (e) { /* fine */ } };
  }
  // a small yes/no question (the late cancel, "refund me instead")
  function ask(title, text, yes, no, fn, opener) {
    var d = $('#askDlg'); $('#h-ask').textContent = title; $('#askText').textContent = text; $('#askYes').textContent = yes; $('#askNo').textContent = no;
    $('#askYes').onclick = function () { ORD.focus = true; d.close(); fn(); }; $('#askNo').onclick = function () { d.close(); };
    openDlg(d, $('#askNo'), opener);
  }

  // ---- "Ship to": a guess from the browser's language, then the buyer's own choice (kept). Named here, sorted by the shown name
  function fillShip() {
    var sel = $('#shipSel'), saved = lsGet(SHIP_KEY), guess = '';
    try { var a = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']; for (var i = 0; i < a.length && !guess; i++) { var m = /-([A-Za-z]{2})\b/.exec(String(a[i])); if (m) guess = m[1].toUpperCase(); } } catch (e) { guess = ''; }
    var has = function (c) { return cat.countries.some(function (x) { return x.code === c; }); };
    st.country = saved && has(saved) ? saved : has(guess) ? guess : has('US') ? 'US' : cat.countries.length ? cat.countries[0].code : '';
    sel.innerHTML = cat.countries.map(function (c) { return '<option value="' + esc(c.code) + '"' + (c.code === st.country ? ' selected' : '') + '>' + (c.soon ? 'Soon: ' : '') + esc(cname(c.code)) + '</option>'; }).join(''); // "Soon:" first, so a narrow picker never cuts it off (review m3)
    sel.onchange = function () { st.country = sel.value; lsSet(SHIP_KEY, st.country); requote(); if (st.view === 'home' || st.view === 'thing') $$('.mview.on .shipline').forEach(function (p) { p.innerHTML = shipLine(); }); if (st.view === 'basket') rBasket(); };
  }

  function say(t) { var l = $('#live'); l.textContent = ''; setTimeout(function () { l.textContent = t; }, 30); }

  // ---- controls outside the views
  $('#nameTog').onclick = function () { var d = st.draft; d.name_on = !d.name_on; if (d.name_on && !d.name) d.name = d.base.n || ''; rMake(); if (d.name_on && !d.name) $('#nameIn').focus(); };
  $('#nameIn').oninput = function (e) { st.draft.name = String(e.target.value).slice(0, 40); rMake(); };
  // review M1: while the name is typed (a phone's keyboard up, the screen short) the price bar stops being sticky, so it never covers the field
  // or its message; and the field with its message is kept in the part of the screen the keyboard leaves
  var OPTS = $('#opts');
  function nameInView() {
    if (!OPTS.classList.contains('typing')) return;
    var vv = window.visualViewport, top = vv ? vv.offsetTop : 0, h = vv ? vv.height : window.innerHeight, hd = $('#sitehead');
    var under = hd ? Math.max(0, hd.getBoundingClientRect().bottom) : 0, inp = $('#nameIn').getBoundingClientRect(), msg = $('#nameMsg').getBoundingClientRect();
    var low = Math.max(inp.bottom, msg.bottom) - (top + h - 8), high = inp.top - (top + under + 8);
    if (low > 0) window.scrollBy(0, Math.min(low, high)); else if (high < 0) window.scrollBy(0, high);
  }
  $('#nameIn').addEventListener('focus', function () { OPTS.classList.add('typing'); setTimeout(nameInView, 80); });
  $('#nameIn').addEventListener('blur', function () { OPTS.classList.remove('typing'); });
  window.addEventListener('resize', function () { setTimeout(nameInView, 30); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { setTimeout(nameInView, 30); });
  $('#qm').onclick = function () { st.draft.qty = Math.max(1, st.draft.qty - 1); rMake(); };
  $('#qp').onclick = function () { st.draft.qty = Math.min(maxQty(), st.draft.qty + 1); rMake(); };
  $('#addBtn').onclick = addDraft;
  $('#payBtn').onclick = pay;
  $('#demoBtn').onclick = demoPay;
  $('#cancelNo').onclick = function () { $('#cancelDlg').close(); };
  $('#cancelYes').onclick = function () {
    ORD.focus = true; $('#cancelDlg').close(); var o = st.order; if (!o) return;
    // each error in its own words, on the page (review finding 4)
    api.cancel(o.id, { scope: 'order' }).then(function () { ORD.note = ''; rOrder(o.id); say('Your order is cancelled.'); }, function (e) { ORD.note = actErr(e); rOrder(o.id); say(ORD.note); });
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
    if (res.dropped) say(droppedWords(st.dropped));
    $('#loading').hidden = true; document.documentElement.classList.add('merch-ready');
    fillShip(); requote(); restoreMaking(); openShare(); route();
  }, function () { $('#loading').textContent = 'The shop couldn\'t load just now. Try again in a moment.'; });

  // hooks for the tests (merch/test_page.js) and the screenshots
  window.__merch = { st: st, api: api, ORD: ORD, basket: function () { return basket; }, cat: function () { return cat; }, go: go, requote: requote, READY: READY, cleanBasket: cleanBasket, rBasket: function () { rBasket(); } };
})();
