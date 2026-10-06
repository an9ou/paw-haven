// v2.3 PHONE PLAY lane, area "town" (TOWN-1 Market Street desktop row + toast, TOWN-2 phone map chrome, TOWN-3 pier bubble). Loaded by test_phone_occl_play.js (see its HOOK note).
const hit = (a, b, m) => a.left < b.right + (m || 0) && a.right > b.left - (m || 0) && a.top < b.bottom + (m || 0) && a.bottom > b.top - (m || 0);

// ---- in-page helpers (serialised into the page) ----
// the baked-in Market Street scene: sign (text + the two outline paths before it), Pip's cart, the three shop signs, the dog and the bowl
const marketRects = () => {
  const R = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const U = (a) => ({ left: Math.min(...a.map((r) => r.left)), top: Math.min(...a.map((r) => r.top)), right: Math.max(...a.map((r) => r.right)), bottom: Math.max(...a.map((r) => r.bottom)) });
  const txt = (s) => [...document.querySelectorAll('svg.world text')].find((x) => x.textContent.trim() === s);
  const sg = txt('Market Street'), pip = txt("Pip's Sprout Cart"); if (!sg || !pip) return { err: 'sign or cart text missing' };
  const sign = [R(sg)]; let p = sg.previousElementSibling; for (let i = 0; i < 2 && p; i++, p = p.previousElementSibling) if (p.tagName === 'path' || p.tagName === 'rect') sign.push(R(p));
  const cartG = pip.closest('.hot') || pip.parentElement;
  const shops = ['Kibble Corner', 'Bow-Wow Boutique', 'Barkitexture'].map((s) => { const e = txt(s); return e ? R(e) : null; }).filter(Boolean);
  const dog = document.getElementById('dogHit'), bowl = document.getElementById('bowlG');
  return { sign: U(sign), cart: R(cartG), shops, dog: dog ? R(dog) : null, bowl: bowl ? R(bowl) : null, btns: [...document.querySelectorAll('#placeBtns .btn')].map((b) => ({ t: b.textContent, r: R(b) })) };
};
// the boats at the pier, as fractions of the pier scene (they are unnamed paths in the art), so one rule works at every size
const BOATS = [[0.37, 0.52, 0.47, 0.61], [0.56, 0.40, 0.635, 0.54]];
// ask for a pier bubble (placeAmbient is random: ask until one shows) and return its rect, the boats' rects and the dog's
const pierBubble = (boats) => {
  const bub = document.getElementById('bubble'); let tries = 0;
  bub.hidden = true; bub.textContent = ''; // a bubble left over from another scene (a bark, the adoption tip) is not a pier bubble
  while ((bub.hidden || !bub.textContent) && tries++ < 80) window.__paw.voice.ambient();
  if (bub.hidden) return { err: 'no bubble after ' + tries + ' asks' };
  bub.getAnimations().forEach((a) => a.finish()); // measure the settled bubble, not the pop-in scale
  const sv = document.querySelector('#view svg.world svg.pa-wc-scene') || document.querySelector('#view svg.world'), s = sv.getBoundingClientRect(), b = bub.getBoundingClientRect(), d = document.getElementById('dogHit').getBoundingClientRect();
  const bt = [...document.querySelectorAll('#placeBtns .btn')].map((x) => { const r = x.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; });
  return { bub: { left: b.left, top: b.top, right: b.right, bottom: b.bottom }, text: bub.textContent, below: bub.classList.contains('below'), dog: { left: d.left, top: d.top, right: d.right, bottom: d.bottom },
    boats: boats.map(([a, c, e, f]) => ({ left: s.left + s.width * a, top: s.top + s.height * c, right: s.left + s.width * e, bottom: s.top + s.height * f })), btns: bt, vh: innerHeight };
};

const pierCheck = async (H, label) => {
  await H.at('pier');
  const r = await H.ev(`(${pierBubble})(${JSON.stringify(BOATS)})`);
  H.ok(!r.err, `${label} pier: a speech bubble shows (${r.err || r.text.slice(0, 30)})`); if (r.err) return;
  const onBoat = r.boats.map((b, i) => hit(r.bub, b) ? 'boat' + i : null).filter(Boolean);
  H.ok(onBoat.length === 0, `${label} pier: the speech bubble does not cover a boat${onBoat.length ? ' -> ' + onBoat.join(',') + ' bubble ' + JSON.stringify(r.bub) : ''}`);
  H.ok(!hit(r.bub, r.dog) || r.bub.top >= r.dog.bottom - 4, `${label} pier: the bubble is beside/under the dog, not over its head`);
  H.ok(!r.btns.some((b) => hit(r.bub, b)), `${label} pier: the bubble does not cover the Go home button ${JSON.stringify([r.bub, r.btns, r.dog])}`);
  H.ok(r.bub.bottom <= r.vh, `${label} pier: the bubble is on screen`);
};

module.exports = {
  name: 'town (market row, map chrome, pier bubble)',

  // ---------- phones: 390x844 and 360x740 ----------
  phone: async (H, w, h, tag) => {
    const { t, ok, ev, p, settle } = H;
    // TOWN-1: Market Street's row has exactly one yellow button, like every other place
    await H.at('market');
    const yes = await ev(() => [...document.querySelectorAll('#placeBtns .btn')].map((b) => ({ t: b.textContent, yes: b.classList.contains('yes') })));
    ok(yes.filter((b) => b.yes).length === 1, `${tag} market: exactly one yellow (.yes) place button (${yes.filter((b) => b.yes).map((b) => b.t).join(',') || 'none'})`);

    // TOWN-2: map chrome
    await p.locator('[data-act=map]').first().tap(); ok(await t.until(() => window.__paw.mode === 'map', null, 6000), `${tag} town map: opens`);
    await t.until(() => { const q = document.getElementById('mapPin'); return !!q && !q.hidden; }, null, 5000); await settle(['#mapZoom', '#mapX', '#status']);
    const m = await ev(() => {
      const R = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
      const st = document.getElementById('status'), rg = document.createRange(); rg.selectNodeContents(st); const chipText = [...rg.getClientRects()].filter((q) => q.width > 1).map((q) => ({ left: q.left, top: q.top, right: q.right, bottom: q.bottom }));
      const z = document.getElementById('mapZoom'), pill = document.getElementById('mapZoomLbl'), zin = document.getElementById('mapZin'), cs = (e) => getComputedStyle(e);
      const url = (e) => (cs(e).backgroundImage.match(/url\([^)]*\)/) || [''])[0];
      const labels = [...document.querySelectorAll('#mapPan svg.world text')].filter((x) => { const q = x.getBoundingClientRect(); return q.width > 2 && q.right > 0 && q.left < innerWidth && q.bottom > 0 && q.top < innerHeight && cs(x).display !== 'none'; }).map((x) => ({ t: x.textContent.trim().slice(0, 24), r: R(x) }));
      const spots = [...document.querySelectorAll('#mapPan [data-area]')].map((g) => ({ k: g.getAttribute('data-area'), r: R(g) })).filter((o) => o.r.width > 1 && o.r.right > 0 && o.r.left < innerWidth && o.r.bottom > 0 && o.r.top < innerHeight);
      return { x: R(document.getElementById('mapX')), zoom: R(z), chipText, labels, spots, btns: [zin, document.getElementById('mapZout')].map(R), pillUrl: url(pill), btnUrl: url(zin), pillBorder: cs(pill).borderTopWidth, pillRadius: cs(pill).borderTopLeftRadius, btnRadius: cs(zin).borderTopLeftRadius, vw: innerWidth, vh: innerHeight, chip: R(st) };
    });
    ok(m.chipText.length > 0 && !m.chipText.some((q) => hit(q, m.x, 4)), `${tag} map: the close X does not cover the location chip text`);
    ok(m.chip.right <= m.x.left - 4, `${tag} map: the chip stops short of the X (${Math.round(m.chip.right)} vs ${Math.round(m.x.left)})`);
    ok(!m.labels.some((l) => hit(l.r, m.zoom)), `${tag} map: the zoom stack covers no place name${m.labels.filter((l) => hit(l.r, m.zoom)).map((l) => ' -> ' + l.t).join('')}`);
    ok(!m.spots.some((s) => hit(s.r, m.zoom)), `${tag} map: the zoom stack covers no place hotspot${m.spots.filter((s) => hit(s.r, m.zoom)).map((s) => ' -> ' + s.k).join('')}`);
    ok(m.btns.every((b) => b.width >= 43.5 && b.height >= 43.5), `${tag} map: the zoom buttons are 44 px targets (${m.btns.map((b) => Math.round(b.width) + 'x' + Math.round(b.height)).join(', ')})`);
    ok(m.zoom.top - m.x.bottom >= 8 || m.zoom.bottom < m.x.top, `${tag} map: the zoom stack has room from the X`);
    ok(m.zoom.bottom <= m.vh - 8 && m.zoom.right <= m.vw, `${tag} map: the zoom stack is on screen`);
    ok(m.pillUrl !== '' && m.pillUrl === m.btnUrl && m.pillRadius === m.btnRadius, `${tag} map: the "100%" pill has the same hand-drawn frame as the buttons`);
    // with the "go there" chip open the stack stays clear of it
    await p.locator('[data-area=market]').first().tap({ force: true }); await t.until(() => !!document.querySelector('#mapGo:not([hidden])'), null, 3000); await settle(['#mapGo']);
    const g = await ev(() => { const a = document.getElementById('mapZoom').getBoundingClientRect(), b = document.getElementById('mapGo').getBoundingClientRect(); return { a: { left: a.left, top: a.top, right: a.right, bottom: a.bottom }, b: { left: b.left, top: b.top, right: b.right, bottom: b.bottom } }; });
    ok(!hit(g.a, g.b), `${tag} map: the zoom stack is clear of the "go there" chip`);
    await p.locator('#mapX').tap(); await t.untilMode('yard');

    // TOWN-3: pier bubble
    await pierCheck(H, tag);
  },

  // ---------- desktop 1280x720 ----------
  desk: async (H) => {
    const { t, ok, ev, settle } = H, tag = 'desktop';
    await H.at('market'); await settle(['#bowlG']);
    const r = await ev(`(${marketRects})()`);
    ok(!r.err, `${tag} market: sign and cart art found (${r.err || 'ok'})`); if (r.err) return;
    const bad = [];
    r.btns.forEach((b) => { if (hit(b.r, r.sign, 2)) bad.push(b.t + ' on the sign'); if (hit(b.r, r.cart, 2)) bad.push(b.t + ' on the cart'); if (r.dog && hit(b.r, r.dog, 2)) bad.push(b.t + ' on the dog'); if (r.bowl && hit({ left: b.r.left, right: b.r.right, top: b.r.top, bottom: b.r.bottom - 0 }, { left: r.bowl.left, right: r.bowl.right, top: r.bowl.top, bottom: r.bowl.bottom - 8 }, 0)) bad.push(b.t + ' on the bowl'); });
    ok(r.btns.length >= 5 && bad.length === 0, `${tag} market: the place buttons sit clear of the "Market Street" sign, Pip's cart, the dog and the bowl${bad.length ? ' -> ' + bad.slice(0, 4).join(' | ') : ''}`);
    await H.check(`${tag} market`, '#placeBtns .btn', '#bar,#hud,#toasts .toast', [[0.5, 0.5]]);
    ok(r.btns.every((b) => b.r.right <= 1280 && b.r.bottom <= 720 && b.r.left >= 0 && b.r.bottom - b.r.top >= 30), `${tag} market: the buttons are readable and on screen ${JSON.stringify(r.btns.map((b) => [Math.round(b.r.left), Math.round(b.r.top), Math.round(b.r.right), Math.round(b.r.bottom)]))}`);
    ok((await ev(() => document.querySelectorAll('#placeBtns .btn.yes').length)) === 1, `${tag} market: one yellow button in the row`);
    // a toast (the adoption hint is one) never covers a shop sign
    await H.toast(); await settle(['#toasts .toast']);
    const tr = await ev(() => { const e = document.getElementById('occlToast'); if (!e) return null; const q = e.getBoundingClientRect(); return { left: q.left, top: q.top, right: q.right, bottom: q.bottom }; });
    ok(!!tr, `${tag} market: toast is shown`);
    if (tr) { const hits = r.shops.filter((s) => hit(tr, s)); ok(hits.length === 0 && r.shops.length === 3, `${tag} market: a toast does not cover the Kibble / Bow-Wow / Barkitecture signs${hits.length ? ' -> ' + JSON.stringify(tr) : ''}`); ok(!hit(tr, r.sign) && !hit(tr, r.cart), `${tag} market: a toast does not cover the street sign or the cart`); }
    await H.unToast();
    // other desktop places keep their button row where it was (bottom-right)
    await H.at('beach');
    const b = await ev(() => { const q = document.getElementById('placeBtns').getBoundingClientRect(); return { left: q.left, right: q.right }; });
    ok(b.right > 1000, `${tag} beach: the place buttons are unchanged (bottom-right)`);
    await pierCheck(H, tag);
  },
};
