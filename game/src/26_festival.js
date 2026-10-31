/* ======================= v2.5: 26_festival.js (FESTIVAL lane, tag fs) =======================
   Seasons greetings, the Autumn leaf festival (leaf piles in the yard, Baker Bea's Harvest Stall in the Square) and Halloween
   (the costume parade in the Square, a jack-o-lantern on the porch). Spec: V25.md section 5.
   Data: S.fest { letters, parade, piles, stall }, S.seasonSeen. Cross-lane names: fsStallOpen, fsParadeOpen, fsActive, fsJournalLine.
   Art: PawArt.prop('leafpile' | 'stall' | 'paradebanner' | 'jackolantern' | 'leafdrift') from the FESTIVAL ART lane, with doodle fallbacks. */

/* ---- spots (world box x, y, w, h of the 1000x600 scene) ---- */
// leaf piles: the lawn under the dog (clear of the garden bed, the bowl, #dogHit and the secret X) and in front of the dog house
// (right of the secret X, left of the place buttons). The spec spots [120,470] and [760,540] sat on the garden bed / bowl and under the buttons.
const FS_PILES = [[318, 520, 116, 72], [738, 524, 104, 66]];
const FS_PILE_GAP = 20; // game minutes between two jumps in the same pile
const FS_STALL = { desk: [858, 384, 136, 126], phone: [196, 380, 110, 109], phoneV: [548, 400, 86, 80] }; // Square: right foreground inside the frame (desktop); on phones beside the fountain, or right of the dog when a visitor shifts the crop
const FS_BANNER = { desk: [560, 150, 400, 90], phone: [196, 196, 300, 74] }; // strung between the clock tower and the right shopfront, above the shop signs (phones: y 196 like the Winter banner, wnBannerBox, under Fuji's cap)
const FS_PUMPKIN = [596, 486, 40, 40]; // the porch step, left of the dog-house door
// v2.6.1 phones: the porch step sits on the edge of the yard's home view (the camera follows the dog), so the pumpkin showed cut in half.
// It is tucked in at the dog house's right front corner instead: outside every portrait home view, whole in the look-right crop (525-871)
const FS_PUMPKIN_PH = [796, 488, 40, 40];
const fsPumpkinBox = () => (isPhone() ? FS_PUMPKIN_PH : FS_PUMPKIN);
const FS_PACK_SQ = [905, 470, 'left', 0.53]; // Square pack spot 3 while the stall is up (it stands where the stall is)
const FS_PACK_SQ_GR = [800, 400, 'left', 0.55]; // v2.15: in a grOn square the stall's box (FS_STALL desk, x 858-994, y 384-510) keeps feet out: the spot stands clear of it, left of the stall, behind the bench (scale 0.88 x grScale at y 400)
const FS_COSTUMES = ['Ghost Sheet', 'Pumpkin Suit', 'Wizard Hat', 'Bumblebee Suit', 'Astronaut Helmet', 'Happi Coat'];
const FS_PARADE_MS = 6000;
const FS_SEASON_LINE = { spring: 'Spring: the blossom is out.', summer: 'Summer: long days.', autumn: 'Autumn: the leaves are turning.', winter: 'Winter: frost on the fence.' };
const FS_LETTERS = {
  leaf: { from: 'Baker Bea', title: 'The leaf festival is on', text: 'The leaf festival is on. Leaf piles in the yard, and my stall is in the Square. Pumpkin everything.' },
  halloween: { from: 'Gerald the duck', title: 'Costume parade in the Square', text: 'Costume parade in the Square until the 31st. I am going as a duck.' }
};
// v2.6: the parade runs to the end of the year's Halloween window: 2 November in 2026 (HW_WIN), the 31st in other years
const FS_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function fsParadeUntil(y) { const w = typeof HW_WIN !== 'undefined' && HW_WIN[+y]; if (!w) return tt('fest.the_31st', 'the 31st'); const [, m, d] = w[1].split('-').map(Number); return tt('fest.day_month', '{day} {month}', { day: d, month: tdata('fs_months.' + (m - 1), FS_MONTHS[m - 1]) }); }
// the player-facing name of a shop item (data tables keep the English name as the key, 4.3): cat 'food' | 'clothes' | 'toys' | 'decor'
function fsIName(cat, n) { return tdata((cat === 'food' ? 'food' : cat === 'clothes' ? 'clothes' : cat === 'toys' ? 'toys' : 'hm_decor') + '.' + tid(n) + '.n', n); }
const FS = { walking: false, walkT: [], pileT: {}, packSq: null, pending: 0 }; // pending: letter / greeting timers still to run (tests wait on 0)
// one kind toast instead of a stack trace if a name from another lane is missing (a tap, the stall or the parade)
function fsTry(fn, ...a) { try { return fn(...a); } catch (e) { console.warn('festival', e); busy = false; toast(tt('fest.snag', 'The festival hit a small snag. Try again in a moment.')); return null; } }
function fsLater(fn, ms) { FS.pending++; setTimeout(() => { FS.pending--; fn(); }, ms); }

/* ---- state ---- */
function fsFields() {
  if (!S) return;
  if (!S.fest || typeof S.fest !== 'object') S.fest = {};
  ['letters', 'parade', 'piles', 'stall'].forEach((k) => { if (!S.fest[k] || typeof S.fest[k] !== 'object') S.fest[k] = {}; });
  if (!S.seasonSeen || typeof S.seasonSeen !== 'object') S.seasonSeen = {};
}
const fsYear = () => localISO().slice(0, 4);
// the greeting year of a season: winter runs Dec-Feb, so January and February count to the winter that began the December before
const fsSeasonYear = (s) => { const y = +fsYear(); return String(s === 'winter' && monthNow() <= 2 ? y - 1 : y); };
const fsAnyOn = () => festOn('leaf') || festOn('halloween') || festOn('snow'); // v2.8: Baker Bea's Winter Stall stands through the Snow Days (WINTER)
const fsMotionOff = () => document.documentElement.dataset.motion === 'off';
const fsHere = (pl) => cur.mode === 'yard' && !!S && S.place === pl && !!$('#view svg.world');
function fsActive() { return FS.walking || (typeof wnActive === 'function' && !!wnActive()); } // v2.8: also the Ugly Sweater Contest walk (WINTER)
// v2.8 (V28.md section 2): [[x, y, w, h], ...] world boxes of every festival prop up now in 'yard' or 'square' (leaf piles, porch pumpkin, snowdrifts,
// snow heap, stall, banner, fortune box, pop-up), for the HOME free-spot scan and the occlusion tests. Coordinator stub: none. WINTER fills it in
function fsKeepOut(place) {
  const out = [], ph = isPhone();
  if (place === 'yard') {
    if (festOn('leaf')) FS_PILES.forEach((b) => out.push(b.slice()));
    if (festOn('halloween')) out.push(fsPumpkinBox().slice());
    if (festOn('snow') && typeof wnYardBoxes === 'function') wnYardBoxes().forEach((b) => out.push(b.slice())); // the two snowdrifts and the snow heap
  } else if (place === 'square') {
    if (fsAnyOn()) out.push(fsStallBox().slice());
    if (festOn('halloween')) out.push(fsBannerBox().slice());
    if (festOn('lights') && typeof wnBannerBox === 'function') out.push(wnBannerBox().slice()); // the Ugly Sweater Contest banner
    if (typeof nyDays === 'function' && nyDays()) out.push(typeof nyFortuneBox === 'function' ? nyFortuneBox().slice() : (ph ? [212, 496, 100, 92] : [212, 344, 114, 105])); // NEW YEAR's box (the pop-up spot)
    if (typeof hwOn === 'function' && hwOn() && typeof hwPopBox === 'function') out.push(hwPopBox().slice());
  }
  return out;
}

/* ---- art with doodle fallbacks (used until the FESTIVAL ART lane's props are merged) ---- */
const FS_LEAF_COLS = ['#E8893A', '#D9663B', '#F2C14E', '#B5542F', '#C9A13B'];
function fsLeafPath(x, y, s, r, col) { return `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${Math.round(r)}) scale(${f1(s)})" d="M0 -9 C5 -6 7 -1 0 9 C-7 -1 -5 -6 0 -9 Z M0 -7 V8" fill="${col}" stroke="${INKG}" stroke-width="1.3" stroke-linejoin="round"/>`; }
const FS_FB = {
  leafpile: (o) => {
    const sc = o && o.state === 'scattered', r = seeded(77 + ((o && o.seed) || 0)); let s = '';
    s += sc ? `<path d="M22 88 Q80 70 140 88 Z" fill="#D9663B" stroke="${INKG}" stroke-width="2.4" opacity=".9"/>` : `<path d="M14 90 Q30 40 80 30 Q130 40 146 90 Z" fill="#E8893A" stroke="${INKG}" stroke-width="2.6" stroke-linejoin="round"/>`;
    for (let i = 0; i < (sc ? 16 : 22); i++) { const x = sc ? 6 + r() * 148 : 26 + r() * 108, y = sc ? 60 + r() * 34 : 42 + r() * 44; s += fsLeafPath(x, y, 0.9 + r() * 0.5, r() * 360, FS_LEAF_COLS[i % 5]); }
    return `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  },
  stall: (o) => {
    const hw = o && o.kind === 'halloween';
    const stripes = [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${20 + i * 34} 52 h34 v22 q-17 10 -34 0 Z" fill="${i % 2 ? '#FFFBF3' : hw ? '#E8893A' : '#D9663B'}" stroke="${INKG}" stroke-width="2.2"/>`).join('');
    return `<svg viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg"><path d="M34 74 V206 M206 74 V206" stroke="#8A6248" stroke-width="8" stroke-linecap="round"/><path d="M14 54 L120 18 L226 54 Z" fill="#F9D56E" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/>${stripes}
      <rect x="22" y="132" width="196" height="74" rx="6" fill="#D9A877" stroke="${INKG}" stroke-width="3"/><path d="M30 150 h180 M30 170 h180 M30 190 h180" stroke="#B88A5E" stroke-width="2"/>
      <g stroke="${INKG}" stroke-width="2.2"><ellipse cx="62" cy="122" rx="22" ry="16" fill="#E8893A"/><ellipse cx="100" cy="124" rx="16" ry="12" fill="#F2A04E"/><path d="M62 106 v-6 M100 112 v-5" stroke-width="3"/><ellipse cx="150" cy="124" rx="24" ry="10" fill="#B5542F" transform="rotate(-8 150 124)"/><ellipse cx="186" cy="124" rx="18" ry="8" fill="#C46A45"/></g>
      ${hw ? `<g transform="translate(176 160)"><rect x="-30" y="-14" width="60" height="30" rx="4" fill="#3E3A38" stroke="${INKG}" stroke-width="2"/><text y="6" text-anchor="middle" font-family="Caveat,cursive" font-size="13" fill="#FFFBF3">Dog-safe treats</text></g>` : ''}</svg>`;
  },
  paradebanner: () => {
    const flags = [0, 1, 2, 3, 4, 5, 6].map((i) => { const x = 40 + i * 50, y = 22 + Math.sin(i / 6 * Math.PI) * 14; return i % 2 ? `<g transform="translate(${x} ${y})"><path d="M-12 0 Q-14 26 -10 32 L-5 27 L0 32 L5 27 L10 32 Q14 26 12 0 Q0 -10 -12 0 Z" fill="#FFFBF3" stroke="${INKG}" stroke-width="2"/><circle cx="-4" cy="8" r="2" fill="${INKG}"/><circle cx="4" cy="8" r="2" fill="${INKG}"/></g>` : `<g transform="translate(${x} ${y + 14})"><ellipse rx="14" ry="12" fill="#E8893A" stroke="${INKG}" stroke-width="2"/><path d="M0 -12 v-5" stroke="#6B8A3A" stroke-width="3"/></g>`; }).join('');
    return `<svg viewBox="0 0 400 90" xmlns="http://www.w3.org/2000/svg"><path d="M4 14 Q200 54 396 14" fill="none" stroke="${INKG}" stroke-width="2.4"/>${flags}<g transform="translate(200 72) rotate(-2)"><rect x="-74" y="-16" width="148" height="28" rx="6" fill="#FFF3B8" stroke="${INKG}" stroke-width="2"/><text y="5" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="20" fill="${INKG}">Costume Parade</text></g></svg>`;
  },
  jackolantern: (o) => `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">${o && o.lit ? '<circle cx="40" cy="48" r="34" fill="#F9D56E" opacity=".35"/>' : ''}<path d="M40 22 q-2 -8 4 -12" fill="none" stroke="#6B8A3A" stroke-width="4" stroke-linecap="round"/><ellipse cx="40" cy="48" rx="30" ry="24" fill="#E8893A" stroke="${INKG}" stroke-width="2.6"/><path d="M28 26 Q24 48 28 70 M52 26 Q56 48 52 70" fill="none" stroke="#B5542F" stroke-width="1.6"/><g fill="${o && o.lit ? '#FFE27A' : '#5B3D32'}" stroke="${INKG}" stroke-width="1.4"><path d="M26 42 l6 -8 l6 8 Z"/><path d="M42 42 l6 -8 l6 8 Z"/><path d="M26 54 q14 12 28 0 l-5 4 l-4 -4 l-5 5 l-5 -5 l-4 4 Z"/></g></svg>`,
  leafdrift: () => { const r = seeded(31); let s = ''; for (let i = 0; i < 9; i++) s += fsLeafPath(10 + i * 12 + r() * 6, 18 + r() * 14, 0.9 + r() * 0.4, r() * 360, FS_LEAF_COLS[i % 5]); return `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">${s}</svg>`; }
};
function fsArt(name, o) { return artReal('prop', name, o || {}) || FS_FB[name](o || {}); }
const fsKind = () => (festOn('halloween') ? 'halloween' : festOn('leaf') ? 'leaf' : festOn('newyear') ? 'newyear' : festOn('snow') ? 'winter' : 'leaf'); // v2.8: the Winter Stall kinds
const fsWinter = () => ['winter', 'newyear'].includes(fsKind()); // the stall is Baker Bea's Winter Stall
const fsStallName = () => (fsWinter() ? tt('fest.winter_stall', 'Winter Stall') : tt('fest.harvest_stall', 'Harvest Stall'));
// the stall picture: the v2.5 kinds take the shared time tint as before; the v2.8 kinds are night-washed by the art itself ({ night }), never tinted twice
function fsStallArt(kind) { const k = kind || fsKind(); if (k !== 'winter' && k !== 'newyear') return propTint(fsArt('stall', { kind: k })); return isNight() ? fsArt('stall', { kind: k, night: true }) : propTint(fsArt('stall', { kind: k })); }
// phones: the world x range the camera shows at home (a visiting dog shifts and zooms it, phHomeRefit in 03_yard.js)
function fsCrop() {
  const svg = $('#view > svg.world'), vb = svg && svg.viewBox && svg.viewBox.baseVal;
  if (!isPhone() || !vb || !vb.width || vb.width >= 1000) return [0, 1000];
  const cx = typeof phCamHome === 'number' ? phCamHome : vb.x + vb.width / 2, x0 = clamp(cx - vb.width / 2, 0, 1000 - vb.width); return [x0, x0 + vb.width];
}
const fsOver = (a, b) => !!b && a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
function fsVisitorBox() { const v = $('#visitorG > rect'); if (!v) return null; try { const b = v.getBBox(); return [b.x, b.y, b.width, b.height]; } catch (e) { return null; } }
function fsStallBox() {
  if (!isPhone()) return FS_STALL.desk;
  const [c0, c1] = fsCrop(), dog = [DX + 30, DY + 40, DW - 60, DH - 40], vis = fsVisitorBox();
  const ok = (b) => b[0] >= c0 && b[0] + b[2] <= c1 && !fsOver(b, dog) && !fsOver(b, vis);
  return [FS_STALL.phone, FS_STALL.phoneV, [c1 - 104, 396, 92, 86]].find(ok) || FS_STALL.desk; // nothing fits: the desktop spot, seen with the look-right button
}
function fsBannerBox() {
  if (!isPhone()) return FS_BANNER.desk;
  const [c0, c1] = fsCrop(), w = Math.min(FS_BANNER.phone[2], c1 - c0 - 50); // clear of the look-right button at the right edge
  return [Math.max(FS_BANNER.phone[0], c0 + 8), FS_BANNER.phone[1], w, f1(FS_BANNER.phone[3] * w / FS_BANNER.phone[2])];
}
// v2.8 phones: a Square prop's name chip (hwChip) sits above its art, never on it, clear of the dog, the pack dogs' tap rects, the visitor and the
// Town Notice board, inside the crop. It slides sideways or floats a little higher (or goes under the art) to find room; when nothing is clear
// (360 px with a visitor and a pack), it takes the spot that covers least, tap rects counting most. `more`: other boxes to keep clear of.
const FS_NOTICE = [[647, 340, 186, 137], [688, 314, 104, 30]]; // the board's panel and the top of its roof with the "Town Notice" sign (world C)
function fsChipAbove(t, box, more) {
  const svg = $('#view > svg.world'), s = phHitScale(), fz = 15.5 / s, w = t.length * fz * 0.47 + fz * 1.1, h = fz * 1.45, [c0, c1] = fsCrop(), g = 4 / s;
  const inv = svg && svg.getScreenCTM() && svg.getScreenCTM().inverse(), wb = (r) => { const a = new DOMPoint(r.left, r.top).matrixTransform(inv), b = new DOMPoint(r.right, r.bottom).matrixTransform(inv); return [a.x, a.y, b.x - a.x, b.y - a.y]; };
  const pack = inv ? [...document.querySelectorAll('#pack .packdog .pd-wander > rect')].map((r) => wb(r.getBoundingClientRect())).filter((b) => b[2] > 0) : [];
  const area = (a, b) => (b ? Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])) : 0);
  const vis = fsVisitorBox(), avoid = [[DX + 30, DY + 40, DW - 60, DH - 40, 3], vis && vis.concat(3), box].concat(pack.map((p) => p.concat(4)), FS_NOTICE, more || []).filter(Boolean), cx0 = box[0] + box[2] / 2, y0 = box[1] - h - g;
  let best = null;
  for (const ty of [y0, y0 - 8, y0 - 16, y0 - 24, y0 - 32, y0 - 40, y0 - 48, y0 - 56, y0 - 64, box[1] + box[3] + g]) for (let d = 0; d <= box[2] / 2 + w / 2; d += 8) for (const cx of d ? [cx0 - d, cx0 + d] : [cx0]) {
    const r = [cx - w / 2, ty, w, h]; if (r[0] < c0 + g || r[0] + w > c1 - g || ty + h > 596 || ty < 120) continue;
    const sc = avoid.reduce((n, a) => n + area(r, a) * (a[4] || (a === box ? 6 : 2)), 0) + Math.abs(ty - y0) * 6 + d * 2; if (!best || sc < best[0]) best = [sc, cx, ty];
  }
  return best ? hwChip(t, best[1], best[2] + h * 0.35) : hwChip(t, cx0, box[1]);
}

// the tap rect: on phones at least 48 screen px each way. It is sized from the real scale of the scene (a tray, a visitor zoom or the place row
// can shrink the scene after the draw), so fsHitFit runs after every draw and whenever the scene resizes
function fsHit(x, y, w, h) { return `<rect class="fs-hit" data-box="${f1(x)},${f1(y)},${f1(w)},${f1(h)}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="transparent" pointer-events="all"/>`; }
function fsHitFit() {
  const svg = $('#view > svg.world'); if (!svg) return;
  let k = 0; try { const m = svg.getScreenCTM(); k = m ? Math.abs(m.a) : 0; } catch (e) { k = 0; }
  svg.querySelectorAll('rect.fs-hit[data-box]').forEach((r) => {
    let [x, y, w, h] = r.dataset.box.split(',').map(Number);
    if (isPhone() && k > 0) { const m = 48 / k; if (w < m) { x -= (m - w) / 2; w = m; } if (h < m) { y -= (m - h) / 2; h = m; } }
    r.setAttribute('x', f1(x)); r.setAttribute('y', f1(y)); r.setAttribute('width', f1(w)); r.setAttribute('height', f1(h));
  });
}

/* ---- drawing into the scene (yard:enter, scene:redraw, env:fest) ---- */
function fsPileSVG(i, state) {
  const [x, y, w, h] = FS_PILES[i];
  return `<g class="hot fs-pile" data-pile="${i}" data-state="${state}" tabindex="0" role="button" aria-label="${esc(tt('fest.label_leaf_pile', 'Leaf pile: jump in'))}">${place(propTint(fsArt('leafpile', { state, seed: i })), x, y, w, h)}${fsHit(x, y, w, h)}</g>`;
}
function fsYardDraw() {
  const svg = $('#view svg.world'); if (!svg) return;
  ['#fsPilesG', '#fsPumpkinG'].forEach((s) => { const e = $(s, svg); if (e) e.remove(); });
  if (festOn('leaf')) {
    const html = `<g id="fsPilesG">${FS_PILES.map((p, i) => fsPileSVG(i, FS.pileT[i] ? 'scattered' : 'full')).join('')}</g>`;
    const a = $('#decorG', svg) || $('#msCardG', svg); if (a) a.insertAdjacentHTML('afterend', html); else { const h = grAt('houseG', svg); if (h) h.insertAdjacentHTML('beforebegin', html); }
    fsPileBind();
  }
  if (festOn('halloween')) {
    const [x, y, w, h] = fsPumpkinBox(), lit = isNight(), html = `<g id="fsPumpkinG" pointer-events="none" data-lit="${lit ? 1 : 0}">${place(fsArt('jackolantern', { lit }), x, y, w, h)}</g>`;
    const hg = $('#houseG', svg); if (hg) hg.insertAdjacentHTML('afterend', html);
  }
}
function fsPileBind() {
  fsHitFit();
  document.querySelectorAll('#fsPilesG [data-pile]').forEach((el) => {
    const go = (e) => { if (e) e.stopPropagation(); fsPileTap(+el.dataset.pile); };
    el.onclick = go; el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  });
}
function fsSquareDraw() {
  const svg = $('#view svg.world'); if (!svg) return;
  ['#fsStallG', '#fsBannerG', '#wnBannerG'].forEach((s) => { const e = $(s, svg); if (e) e.remove(); });
  const pb = $('#placeBtns'); if (pb) pb.querySelectorAll('[data-fs]').forEach((b) => b.remove());
  if (!fsAnyOn() || fsActive()) { fsPackSync(); fsNyDraw(); fsHwDraw(); return; } // v2.8: the contest walk hides the stall too
  const pack = $('#pack', svg); if (!pack) return;
  const [sx, sy, sw, sh] = fsStallBox(), kind = fsKind(), wint = fsWinter();
  let html = `<g id="fsStallG" class="hot" data-kind="${kind}" tabindex="0" role="button" aria-label="${esc(tt('fest.label_bea_stall', "{k, select, winter {Baker Bea's Winter Stall} other {Baker Bea's Harvest Stall}}", { k: wint ? 'winter' : 'harvest' }))}">${place(fsStallArt(kind), sx, sy, sw, sh)}${fsHit(sx + 8, sy + 10, sw - 16, sh - 10)}${wint && isPhone() && typeof hwChip === 'function' ? fsChipAbove(tt('fest.winter_stall', 'Winter Stall'), [sx, sy, sw, sh]) : ''}</g>`;
  if (festOn('halloween')) { const [bx, by, bw, bh] = fsBannerBox(); html = `<g id="fsBannerG" pointer-events="none">${place(propTint(fsArt('paradebanner')), bx, by, bw, bh)}</g>` + html; }
  if (wint) { // v2.8 draw order (V28.md section 7): #fsStallG, #nyFortuneG (NEW YEAR, right after the stall), the sweater banner, #bowlG, #pack
    if (festOn('lights') && typeof wnBannerSVG === 'function') html += wnBannerSVG();
    const at = grAt('bowlG', svg) || pack; at.insertAdjacentHTML('beforebegin', html); // v2.15: grAt, the bowl's old place when it sorts with the dogs (43_ground.js)
  } else pack.insertAdjacentHTML('beforebegin', html);
  fsHitFit();
  const st = $('#fsStallG', svg); st.onclick = (e) => { e.stopPropagation(); SFX.click(); fsStallOpen(); }; st.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fsStallOpen(); } };
  if (pb) {
    const home = pb.querySelector('[data-pb="yard"]'), add = (h) => { if (home) home.insertAdjacentHTML('beforebegin', h); else pb.insertAdjacentHTML('beforeend', h); };
    const ph = isPhone(), hw = festOn('halloween'); // phones: one Festival button (a chooser at Halloween) so the Square row stays one line
    if (wint) { // v2.8: the Winter Stall, the Sweater Contest in December; phones: one Festival button when the chooser has more than one row
      const con = festOn('lights'), many = con || (typeof nyDays === 'function' && nyDays()), done = con && typeof wnJudgedToday === 'function' && wnJudgedToday();
      if (ph && many) add(`<button class="btn yes" data-fs="fest">${esc(tt('fest.festival', 'Festival'))}</button>`);
      else add(`<button class="btn yes" data-fs="stall" aria-label="${esc(tt('fest.winter_stall', 'Winter Stall'))}">${esc(ph ? tt('fest.stall_short', 'Stall') : tt('fest.winter_stall', 'Winter Stall'))}</button>`);
      if (con && !ph) add(`<button class="btn yes" data-fs="contest" aria-label="${esc(done ? tt('fest.judged_today', 'Judged today') : tt('fest.sweater_contest', 'Sweater Contest'))}" ${done ? 'aria-disabled="true"' : ''}>${esc(done ? tt('fest.judged_today', 'Judged today') : tt('fest.sweater_contest', 'Sweater Contest'))}</button>`);
    } else {
      if (ph && hw) add(`<button class="btn yes" data-fs="fest">${esc(tt('fest.festival', 'Festival'))}</button>`);
      else add(`<button class="btn yes" data-fs="stall" aria-label="${esc(tt('fest.harvest_stall', 'Harvest Stall'))}">${esc(ph ? tt('fest.stall_short', 'Stall') : tt('fest.harvest_stall', 'Harvest Stall'))}</button>`);
      if (hw && !ph) add(`<button class="btn yes" data-fs="parade" aria-label="${esc(fsParadedToday() ? tt('fest.paraded_today', 'Paraded today') : tt('fest.costume_parade', 'Costume parade'))}" ${fsParadedToday() ? 'aria-disabled="true"' : ''}>${esc(fsParadedToday() ? (ph ? tt('fest.paraded', 'Paraded') : tt('fest.paraded_today', 'Paraded today')) : ph ? tt('fest.parade_short', 'Parade') : tt('fest.costume_parade', 'Costume parade'))}</button>`);
    }
    pb.querySelectorAll('[data-fs]').forEach((b) => { b.onclick = () => { SFX.click(); const k = b.dataset.fs; if (k === 'stall') fsStallOpen(); else if (k === 'fest') fsChooser(); else if (k === 'contest') { if (typeof wnContestOpen === 'function') wnContestOpen(); } else fsParadeOpen(); }; });
  }
  fsPackSync(); fsNyDraw(); fsHwDraw();
}
// v2.8: NEW YEAR's Fortune box (32_newyear.js) draws right after the stall (fsSlot), and its desktop place button lands before Go home
function fsNyDraw() { if (typeof nySquareDraw === 'function') { try { nySquareDraw(); } catch (e) { console.warn('newyear', e); } } }
// where a prop that stands right after the stall goes: insert it before this element (the banner, the bowl or the pack)
function fsSlot() { const svg = $('#view svg.world'); if (!svg) return null; const st = $('#fsStallG', svg); return (st && st.nextElementSibling) || grAt('bowlG', svg) || $('#pack', svg); }
// v2.6: the Pumpkin Patch Pop-up (27_halloween.js) draws after the stall, so it sits in front of it and its button lands between the parade and Go home
function fsHwDraw() { if (typeof hwSquareDraw === 'function') hwSquareDraw(); }
// Square pack spot 3 stands where the stall is: it moves to the front while the stall is up and comes back when the festival packs up
function fsPackSync() {
  if (typeof PACK_SPOTS === 'undefined' || !PACK_SPOTS.square) return;
  if (!FS.packSq) FS.packSq = PACK_SPOTS.square[2].slice();
  const want = fsAnyOn() ? (grOn('square') ? FS_PACK_SQ_GR : FS_PACK_SQ) : FS.packSq, now = PACK_SPOTS.square[2];
  if (now[0] === want[0] && now[1] === want[1]) return;
  PACK_SPOTS.square[2] = want.slice();
  if (fsHere('square') && !FS.walking) { const g = $('#pack'); if (g) { g.innerHTML = packSVG(); bindPack(); } }
}
function fsDraw() {
  if (!S || cur.mode !== 'yard') return; fsFields();
  if (S.place === 'yard') fsYardDraw();
  else if (S.place === 'square') fsSquareDraw();
}

/* ---- letters and the season greeting ---- */
function fsLetters() {
  if (!S || typeof mailPush !== 'function') return; fsFields(); const y = fsYear();
  ['leaf', 'halloween'].forEach((k) => { if (festOn(k) && S.fest.letters[k] !== y) { S.fest.letters[k] = y; markDirty(); mailPush(Object.assign({ kind: 'news', id: `fest_${k}_${y}` }, FS_LETTERS[k], { from: tdata('fs_letters.' + k + '.from', FS_LETTERS[k].from), title: tdata('fs_letters.' + k + '.title', FS_LETTERS[k].title), text: k === 'halloween' ? tt('fest.parade_letter', 'Costume parade in the Square until {until}. I am going as a duck.', { until: fsParadeUntil(y) }) : tdata('fs_letters.' + k + '.text', FS_LETTERS[k].text) })); } });
}
// under the test harness the greeting only shows when a suite asks (prefs.fsTest), so older suites see the toasts they measured before
const fsGreetAllowed = () => !navigator.webdriver || !!prefs.fsTest;
function fsSeasonGreet() {
  if (!S || S.place !== 'yard' || !fsGreetAllowed()) return; fsFields();
  const s = seasonNow(), y = fsSeasonYear(s); if (S.seasonSeen[s] === y || !FS_SEASON_LINE[s]) return;
  fsLater(() => {
    if (!S || cur.mode !== 'yard' || S.place !== 'yard' || S.seasonSeen[s] === y || (typeof gdActive === 'function' && gdActive())) return;
    S.seasonSeen[s] = y; markDirty(); toast(tdata('fs_season_line.' + s, FS_SEASON_LINE[s]), 'good');
  }, 1500);
}

/* ---- leaf piles ---- */
// an awake adult (3 months or older, not nursing) who can jump: the active dog, or for a young puppy the first one of the pack
const fsJumper = (d) => !!d && ageMonths(d) >= 3 && !d.sleeping && !(typeof hmMumIn === 'function' && hmMumIn(d));
// the "Jump in a leaf pile" mission gate: the leaf festival is on and some dog is old enough to jump (sleep and nursing pass, they end)
function fsCanJump() { return festOn('leaf') && !!S && Array.isArray(S.dogs) && S.dogs.some((d) => ageMonths(d) >= 3 && !(typeof hmMumIn === 'function' && hmMumIn(d))); }
function fsPileTap(i) { return fsTry(fsPileTap0, i); }
function fsPileTap0(i) {
  if (!FS_PILES[i] || !festOn('leaf') || cur.mode !== 'yard' || S.place !== 'yard') return;
  if (busy || S.sleeping || (typeof curling !== 'undefined' && curling)) return;
  fsFields(); const last = S.fest.piles[i];
  if (typeof last === 'number' && S.gameMin - last >= 0 && S.gameMin - last < FS_PILE_GAP) { toast(tt('fest.pile_raking', 'The pile needs raking first. Try the other one, or come back in a bit.')); return; }
  const pup = ageMonths(D()) < 3, adult = pup ? others().find(fsJumper) : null;
  if (pup && !adult) { const h = dogHeadWorld(); say(tt('fest.sniff', 'Sniff.'), h.x, h.y, 1800); toast(tt('fest.too_small', '{name} is too small to jump in yet. Puppies watch the leaves from the grass for now.', { name: NAME() })); return; }
  const [x, y, w, h] = FS_PILES[i], cx = x + w / 2, gy = y + h * 0.8, face = cx < 430 ? 'left' : 'right';
  busy = true; hideBubble(); SFX.click();
  const tx = pup ? cx - 430 + (face === 'left' ? 120 : -120) : cx - 430, ty = Math.max(0, gy - 500) - (pup ? 0 : 6);
  dogTo(tx, ty, 1, 0.8); renderDog('walk', face);
  const T = (fn, ms) => setTimeout(() => { if (cur.mode === 'yard' && S.place === 'yard') fn(); }, ms);
  T(() => {
    if (pup) { renderDog('sit', face, true); fsPackJump(adult, cx, gy); } else { renderDog('jump', face, true); const fx = $('#dogFx'); if (fx) { fx.classList.remove('tk-pounce'); void fx.getBBox(); fx.classList.add('tk-pounce'); } }
    SFX.crunch(); setTimeout(() => SFX.crunch(), 180);
    fsScatter(i);
  }, 850);
  T(() => {
    addStat('happy', 6); addBond(1); S.fest.piles[i] = S.gameMin; markDirty(); updateHUD();
    const hw = dogHeadWorld(); say(pup ? tt('fest.did_the_jumping', '{other} did the jumping. {name} did the cheering.', { other: adult.name, name: NAME() }) : PICK([tt('fest.crunch', 'Crunch.'), tt('fest.again', 'Again.'), tt('fest.where_leaves', 'Where did the leaves go.')]), hw.x, hw.y, 2600);
    trackAct('leafpile', {});
  }, 1600);
  T(() => { const fx = $('#dogFx'); if (fx) fx.classList.remove('tk-pounce'); dogTo(0, 0, 1, 0.8); renderDog('walk', face === 'left' ? 'right' : 'left'); }, 2400);
  setTimeout(() => { busy = false; if (cur.mode === 'yard') renderDog(dogPoseNow(), 'right', true); }, 3300);
}
// a young puppy's turn: the first awake adult of the pack bounds into the pile and back
function fsPackJump(d, cx, gy) {
  const g = d && $(`#pack [data-dog="${d.id}"]`), sp = d && packSpots()[others().indexOf(d)]; if (!g || !sp) return;
  g.style.transition = 'transform .5s ease-in-out'; g.style.transform = `translate(${f1(cx - sp[0])}px, ${f1(gy - sp[1])}px)`;
  const inner = g.querySelector('.pd-wander'); if (inner) { inner.classList.remove('tk-pounce'); void inner.getBBox(); inner.classList.add('tk-pounce'); }
  setTimeout(() => { g.style.transform = ''; setTimeout(() => { g.style.transition = ''; if (inner) inner.classList.remove('tk-pounce'); }, 600); }, 1300);
}
function fsScatter(i) {
  const g = $(`#fsPilesG [data-pile="${i}"]`); if (!g) return;
  clearTimeout(FS.pileT[i]); g.outerHTML = fsPileSVG(i, 'scattered'); fsPileBind();
  FS.pileT[i] = setTimeout(() => { delete FS.pileT[i]; const o = $(`#fsPilesG [data-pile="${i}"]`); if (o) { o.outerHTML = fsPileSVG(i, 'full'); fsPileBind(); } }, 4000);
  if (fsMotionOff()) return;
  const fx = $('#fx'); if (!fx) return; const [x, y, w, h] = FS_PILES[i], cx = x + w / 2, cy = y + h * 0.5;
  for (let k = 0; k < 12; k++) {
    const a = -Math.PI * (0.1 + 0.8 * (k / 11)) + (Math.random() - 0.5) * 0.3, d = 70 + Math.random() * 60;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'fs-leafp');
    el.style.setProperty('--dx', f1(Math.cos(a) * d) + 'px'); el.style.setProperty('--dy', f1(Math.sin(a) * d) + 'px'); el.style.setProperty('--rot', Math.round(Math.random() * 540 - 270) + 'deg'); el.style.animationDelay = Math.round(k * 25) + 'ms';
    el.innerHTML = fsLeafPath(cx + (Math.random() - 0.5) * 40, cy, 1.1, Math.random() * 360, FS_LEAF_COLS[k % 5]); fx.appendChild(el); setTimeout(() => el.remove(), 1700);
  }
}

/* ---- Harvest Stall (Square) ---- */
function fsStallItems() {
  const on = (x) => festOn(x.fest);
  return FOOD.filter((f) => f.fest && !f.ed && !f.fm && on(f)).map((f) => ({ cat: 'food', n: f.n, name: fsIName('food', f.n), price: f.price, desc: tdata('food.' + tid(f.n) + '.note', f.note), tip: f.tip ? tdata('food.' + tid(f.n) + '.tip', f.tip) : f.tip }))
    .concat(CLOTHES.filter((c) => c.fest && !c.ed && !c.fm && !c.reward && on(c)).map((c) => ({ cat: 'clothes', n: c.n, name: fsIName('clothes', c.n), price: c.price, desc: tt('fest.slot_perk', '{slot}. {perk}', { slot: tdata('slot_name.' + c.slot, SLOT_NAME[c.slot]), perk: tdata('clothes.' + tid(c.n) + '.perk', c.perk) }) })))
    .concat(Object.keys(HM_DECOR).filter((n) => HM_DECOR[n].fest && !HM_DECOR[n].ed && !HM_DECOR[n].fm && on(HM_DECOR[n])).map((n) => ({ cat: 'decor', n, name: fsIName('decor', n), price: HM_DECOR[n].price, desc: tdata('hm_decor.' + tid(n) + '.story', HM_DECOR[n].story) }))); // v2.8: the winter yard decorations
}
function fsStallOpen() { return fsTry(fsStallOpen0); }
function fsStallClosed() {
  if (fsAnyOn()) return false; const wint = !modal.hidden && !!$('#modal .panel.fs-stall.wn-stall'); if (!modal.hidden) closeModal();
  toast(wint ? tt('fest.winter_packed_up', 'Baker Bea has packed up the Winter Stall. See you in the spring, with flowers.') : tt('fest.harvest_packed_up', 'The Harvest Stall has packed up. Baker Bea says thank you for the pumpkin business.')); return true; // v2.8: the Winter Stall closes after February
}
function fsStallOpen0() {
  if (!S) return;
  const op = !modal.hidden && $('#modal .panel.fs-stall'), keep = op ? [op.scrollTop, ($('.panel-body', op) || {}).scrollTop || 0] : null; // a re-open after a buy keeps the scroll
  if (!fsAnyOn()) { toast(tt('fest.harvest_packed_away', 'The Harvest Stall is packed away. Baker Bea comes back for the leaf festival.')); return; }
  fsFields(); if (S.fest.stall.seen !== localISO()) { S.fest.stall.seen = localISO(); markDirty(); }
  SFX.boop(620); if (typeof audioPlace === 'function') audioPlace('shop');
  const items = fsStallItems(), wint = fsWinter(), owned = (it) => (it.cat === 'decor' ? !!(S.decor && S.decor[it.n]) : it.cat === 'clothes' && owns('clothes', it.n));
  const card = (it) => {
    const have = it.cat === 'food' ? (S.inv.food[it.n] || 0) : 0;
    const act = owned(it) ? `<span class="chip own">${esc(tt('fest.owned', 'Owned'))}</span>` : `<button class="btn yes" data-fsbuy="${esc(it.n)}">${esc(it.cat === 'food' ? tt('fest.buy_ellipsis', 'Buy…') : tt('fest.buy', 'Buy'))}</button>`;
    return `<div class="sitem fs-card" data-cat="${it.cat}"><span class="art">${itemArt(it.n)}</span><b>${esc(it.name)}</b><span class="desc">${esc(it.desc)}</span>${it.tip ? `<span class="small sh-tip">${esc(it.tip)}</span>` : ''}${priceHTML(it.cat === 'food' ? tt('fest.price_each', '{n} each', { n: tnum(it.price) }) : tnum(it.price))}${have ? `<span class="small">${esc(tt('fest.you_have', 'You have {n}', { n: tnum(have) }))}</span>` : ''}${act}</div>`;
  };
  let p;
  if (wint) { // v2.8: Baker Bea's Winter Stall, in three sections
    const ny = fsKind() === 'newyear', line = ny ? tt('fest.bea_line_ny', '"Happy New Year. Pup Kinton is in, and no mochi, I promise."') : tt('fest.bea_line_winter', '"Everything here is dog-safe and warm. Ask me anything, I will say carob."');
    const secs = [['food', tt('fest.treats', 'Treats')], ['clothes', tt('fest.clothes', 'Clothes')], ['decor', tt('fest.decorations', 'Decorations')]].map(([k, l]) => { const its = items.filter((it) => it.cat === k); return its.length ? `<section class="wn-sec" data-sec="${k}"><h3>${esc(l)}</h3>${k === 'decor' ? `<p class="small">${esc(tt('fest.decor_note', 'For the yard. Bought once, placed where you like.'))}</p>` : ''}<div class="shopgrid">${its.map(card).join('')}</div></section>` : ''; }).join('');
    const ic = `<span class="wn-bea-ic" aria-hidden="true">${typeof wnIcon === 'function' ? wnIcon('wstall') : ''}</span>`;
    p = openModal(tt('fest.winter_stall', 'Winter Stall'), `<div class="fs-bea wn-bea">${ic}<p><b>${esc(tt('fest.baker_bea', 'Baker Bea:'))}</b> ${esc(line)}</p></div><p class="small">${esc(tt('fest.winter_intro', 'Warm treats, winter clothes and yard decorations, for coins, until the end of February. You have {coins} Paw Coins.', { coins: fmtC(S.coins) }))}</p>${secs}`, { cls: 'shop fs-stall wn-stall' });
  } else {
    const deco = `<span class="fs-drift" aria-hidden="true">${fsArt('leafdrift')}</span>`;
    p = openModal(tt('fest.harvest_stall', 'Harvest Stall'), `<div class="fs-bea">${deco}<p><b>${esc(tt('fest.baker_bea', 'Baker Bea:'))}</b> ${esc(tt('fest.bea_line_harvest', '"Everything here is dog-safe. Ask me anything, I will say pumpkin."'))}</p></div><p class="small">${esc(tt('fest.harvest_intro', 'Festival treats and outfits, for coins, while the festival is on. You have {coins} Paw Coins.', { coins: fmtC(S.coins) }))}</p><div class="shopgrid">${items.map(card).join('')}</div>`, { cls: 'shop fs-stall' });
  }
  if (keep) { p.scrollTop = keep[0]; const bd = $('.panel-body', p); if (bd) bd.scrollTop = keep[1]; }
  p.querySelectorAll('[data-fsbuy]').forEach((b) => {
    b.onclick = async () => {
      if (fsStallClosed()) return; // the festival ended while the sheet was open (midnight)
      const it = items.find((x) => x.n === b.dataset.fsbuy); if (!it) return; SFX.click();
      const stack = it.cat === 'food', own = owned(it);
      const q = await buyWindow(p, { art: itemArt(it.n), name: it.name, desc: it.desc, price: it.price, stack, owned: own, have: stack ? (S.inv.food[it.n] || 0) : own ? 1 : 0, haveLabel: stack ? tt('fest.in_bag', 'In bag') : tt('fest.owned', 'Owned') }); if (!q || fsStallClosed() || (!stack && owned(it))) return;
      const cost = it.price * q; if (S.coins < cost) { nope(wint ? tt('fest.poor_winter', 'Not enough coins. Walks pay well, and the carob will stay warm.') : tt('fest.poor_harvest', 'Not enough coins. Walks pay well, and the pumpkins will wait.')); return; }
      S.coins -= cost; SFX.kaching(); trackAct('buy', { name: it.n, cat: it.cat, qty: q, shop: 'stall' });
      if (stack) S.inv.food[it.n] = (S.inv.food[it.n] || 0) + q; else if (it.cat === 'decor') { hmDecorFields(); S.decor[it.n] = { got: localISO(), out: false }; } else if (!owns('clothes', it.n)) S.inv.clothes.push(it.n);
      markDirty(); updateHUD();
      toast(tt('fest.bought', 'Bought {n} × {item}. {line}', { n: q, item: it.name, line: wint ? PICK([tt('fest.wrap_snow', 'Baker Bea wraps it in snowflake paper.'), tt('fest.smell_carob', 'It smells of oats and warm carob.'), tt('fest.suits_you', 'Bea says it suits you.')]) : PICK([tt('fest.wrap_leaf', 'Baker Bea wraps it in a paper leaf.'), tt('fest.smell_pumpkin', 'It smells of pumpkin. Everything does.'), tt('fest.suits_you', 'Bea says it suits you.')]) }), 'gold');
      fsStallOpen();
      if (it.cat === 'decor') { const pp = $('.panel', modal); const pl = await confirmIn(pp, esc(tt('fest.place_q', 'Put the {item} in the yard now?', { item: it.name })), tt('fest.place_it', 'Place it'), tt('fest.later', 'Later')); if (pl) { closeModal(); hoPlaceStart(it.n); return; } if (!modal.hidden) fsStallOpen(); return; } // v2.8: like Barkitecture (v2.7)
      if (it.cat === 'clothes') { const pp = $('.panel', modal); const w = await confirmIn(pp, esc(tt('fest.wear_q', 'Put the {item} on {name} now?', { item: it.name, name: NAME() })), tt('fest.wear_it', 'Wear it'), tt('fest.later', 'Later')); if (w) equip(it.n, true); if (!modal.hidden) fsStallOpen(); }
    };
  });
  return p;
}

/* ---- phones at Halloween: one Festival button opens this small chooser ---- */
function fsChooser() {
  if (fsWinter()) return fsChooserWinter(); // v2.8: the Winter Stall, the Sweater Contest (December), the Fortune box (1 to 7 January)
  if (!festOn('halloween')) { fsStallOpen(); return; }
  const done = fsParadedToday(), hw = typeof hwOn === 'function' && hwOn(); // v2.6: a third row for the Pumpkin Patch Pop-up while it is open
  const pop = hw ? `<button class="card hw-row" data-fsgo="popup"><span class="art">${hwIcon()}</span><span class="hw-rowt"><b>${esc(tt('fest.pumpkin_popup', 'Pumpkin Patch Pop-up'))}</b><span class="small">${esc(tt('fest.popup_line', "Mrs. Plum's 2026 things, until 2 November."))}</span></span></button>` : '';
  const p = openModal(tt('fest.festival', 'Festival'), `<div class="fs-choose"><button class="card" data-fsgo="stall"><span class="art">${fsArt('stall', { kind: 'halloween' })}</span><b>${esc(tt('fest.harvest_stall', 'Harvest Stall'))}</b><span class="small">${esc(tt('fest.harvest_blurb', 'Dog-safe treats and outfits.'))}</span></button><button class="card" data-fsgo="parade"><span class="art">${fsArt('paradebanner')}</span><b>${esc(tt('fest.costume_parade', 'Costume parade'))}</b><span class="small">${esc(done ? tt('fest.paraded_today_dot', 'Paraded today.') : tt('fest.parade_blurb', 'Once a day, 10 coins.'))}</span></button>${pop}</div>`, { cls: 'fs-choosepop' });
  p.querySelectorAll('[data-fsgo]').forEach((b) => { b.onclick = () => { SFX.click(); closeModal(); if (b.dataset.fsgo === 'stall') fsStallOpen(); else if (b.dataset.fsgo === 'popup') hwOpen(); else fsParadeOpen(); }; });
  return p;
}
// v2.8 (V28.md section 9): one Festival sheet of rows, each a 44 px card with an icon, a name and a line. At most three rows at once.
// The Fortune box row is NEW YEAR's (nyFortuneOpen) and shows while nyDays()
function fsChooserWinter() {
  const ic = (n) => (typeof wnIcon === 'function' ? wnIcon(n) : iconOr(n, '<circle r="12" fill="#EDF1F5" stroke="#5B3D32" stroke-width="2"/>'));
  const row = (k, icon, name, line) => `<button class="card wn-row" data-fsgo="${k}"><span class="art">${ic(icon)}</span><span class="wn-rowt"><b>${esc(name)}</b><span class="small">${esc(line)}</span></span></button>`;
  const judged = typeof wnJudgedToday === 'function' && wnJudgedToday();
  const rows = [row('stall', 'wstall', tt('fest.winter_stall', 'Winter Stall'), tt('fest.winter_blurb', 'Warm treats, winter clothes and decorations.'))]
    .concat(festOn('lights') ? [row('contest', 'sweater', tt('fest.sweater_contest', 'Sweater Contest'), judged ? tt('fest.judged_blurb', 'Judged today. Gerald needs a sit-down.') : tt('fest.contest_blurb', 'Gerald judges. Everyone wins something.'))] : [])
    .concat(typeof nyDays === 'function' && nyDays() ? [row('fortune', 'fortune', tt('fest.fortune_box', 'Fortune box'), tt('fest.fortune_blurb', 'Only good fortunes, until 7 January.'))] : []).slice(0, 3);
  const p = openModal(tt('fest.festival', 'Festival'), `<div class="fs-choose wn-choose">${rows.join('')}</div>`, { cls: 'fs-choosepop wn-choosepop' });
  p.querySelectorAll('[data-fsgo]').forEach((b) => {
    b.onclick = () => { SFX.click(); closeModal(); const k = b.dataset.fsgo; if (k === 'stall') fsStallOpen(); else if (k === 'contest') { if (typeof wnContestOpen === 'function') wnContestOpen(); } else if (k === 'fortune' && typeof nyFortuneOpen === 'function') nyFortuneOpen(); };
  });
  return p;
}

/* ---- costume parade (Square, Halloween) ---- */
const fsParadedToday = () => !!(S && S.fest && S.fest.parade && S.fest.parade.date === localISO());
function fsParadeDogs(dk = localISO()) {
  const seen = new Set(), out = [];
  playboardDogs(dk).concat(playboardDogs('parade|' + dk)).forEach((n) => { if (out.length < 5 && !seen.has(n.name)) { seen.add(n.name); out.push(n); } });
  const r = seeded(hashId('costume|' + dk));
  return out.map((n) => { const c = FS_COSTUMES[Math.floor(r() * FS_COSTUMES.length)], slot = (CLOTHES.find((x) => x.n === c) || {}).slot || 'body'; return Object.assign({}, n, { costume: c, outfit: { [slot]: c } }); });
}
function fsOutfitWords(o) { const w = SLOTS.map((k) => o[k]).filter(Boolean); return w.length ? tt('fest.wearing', 'Wearing {list}.', { list: tlist(w.map((x) => fsIName('clothes', x))) }) : tt('fest.no_costume', 'No costume. Going as a dog. Bold.'); }
function fsParadeOpen() { return fsTry(fsParadeOpen0); }
function fsParadeOpen0() {
  if (!S) return;
  if (!festOn('halloween')) { toast(tt('fest.parade_over', 'The costume parade is over for this year. Gerald is already planning the next one.')); return; }
  SFX.boop(700); const dogs = fsParadeDogs(), me = D(), done = fsParadedToday();
  const row = dogs.map((n) => `<div class="fs-npc"><span class="fs-pdog">${dogSVG(n, { pose: 'sit', outfit: n.outfit, facing: 'right' })}</span><b>${esc(n.name)}</b><span class="small">${esc(fsIName('clothes', n.costume))}</span></div>`).join('');
  const p = openModal(tt('fest.costume_parade', 'Costume parade'), `<div class="fs-banner" aria-hidden="true">${fsArt('paradebanner')}</div><p class="small">${esc(tt('fest.parade_intro', 'Gerald runs it. Five town dogs in costume, and you. Everyone gets a cheer.'))}</p>
    <div class="fs-row" role="list" aria-label="${esc(tt('fest.label_parade_dogs', "Today's parade dogs"))}">${row}</div>
    <div class="fs-you"><span class="fs-pdog">${dogSVG(me, { pose: 'sit', outfit: outfitOf(me), facing: 'right' })}</span><div><b>${esc(NAME())}</b><span class="small">${esc(fsOutfitWords(outfitOf(me)))}</span>${done ? `<span class="small">${esc(tt('fest.paraded_lap', 'Paraded today. Come back tomorrow for another lap.'))}</span>` : ''}</div></div>`,
  { cls: 'fs-paradepop', foot: `<button class="btn yes big" id="fsJoin" ${done ? 'aria-disabled="true"' : ''}>${esc(done ? tt('fest.paraded_today', 'Paraded today') : tt('fest.join_parade', 'Join the parade'))}</button>` });
  $('#fsJoin', p).onclick = () => {
    if (fsParadedToday()) { nope(tt('fest.one_a_day', 'One parade a day is plenty. The costumes need a rest too.')); return; }
    if (busy || S.sleeping) { nope(S.sleeping ? tt('fest.asleep', '{name} is asleep. The parade can wait one nap.', { name: NAME() }) : tt('fest.busy', 'Hold on, {name} is busy.', { name: NAME() })); return; }
    SFX.click(); closeModal(); fsParadeWalk(dogs);
  };
  return p;
}
function fsParadeWalk(dogs) {
  fsFields(); // the day is spent at the payout (fsParadeDone), so a reload mid-walk loses nothing. FS.walking and busy stop a second join meanwhile
  if (fsMotionOff() || !fsHere('square')) { fsParadeDone(); return; }
  const svg = $('#view svg.world'), fx = $('#fx', svg); if (!fx) { fsParadeDone(); return; }
  FS.walking = true; busy = true; hideBubble();
  const hide = ['#dogPos', '#pack', '#visitorG', '#placeBtns'].map((s) => $(s, view)).filter(Boolean); hide.forEach((e) => { e.style.visibility = 'hidden'; });
  const sc = 0.56, w = 264 * sc, hgt = 220 * sc, gap = 104, feetY = 505, line = [D()].concat(dogs);
  // desktop: the leader walks from the fountain (x 200) to the stall (x 900). Phones: the line enters at the left edge of the crop and leaves past the right edge
  const wz = w * Math.max(...line.map((d) => sizeK(d))), [c0, c1] = fsCrop(), ph = isPhone(), lead = ph ? c0 - wz / 2 : 200, dist = ph ? (c1 + wz / 2 + (line.length - 1) * gap) - lead : 700; // v2.11.1: the widest dog in the line (wz) starts and ends past the crop edge
  const parts = line.map((d, i) => { const z = sizeK(d), fx0 = lead - i * gap, x = fx0 - w * z / 2, y = feetY - hgt * z * (205 / 220); return `<g class="fs-pd" data-i="${i}">${place(dogSVG(d, { pose: 'walk', outfit: i ? d.outfit : outfitOf(d), facing: 'right' }), f1(x), f1(y), f1(w * z), f1(hgt * z))}</g>`; }).join(''); // v2.11.1: each dog at its size class, feet on the line
  fx.insertAdjacentHTML('beforebegin', `<g id="fsParadeG" pointer-events="none"><g class="fs-line" style="transform:translateX(0px)">${parts}</g><g class="fs-leaves"></g></g>`);
  const lg = $('#fsParadeG .fs-line'), leaves = $('#fsParadeG .fs-leaves');
  for (let k = 0; k < 10; k++) { const el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'fs-drop'); el.style.animationDelay = (k * 0.55).toFixed(2) + 's'; el.style.setProperty('--sway', (k % 2 ? 40 : -40) + 'px'); el.innerHTML = fsLeafPath(120 + ((k * 97) % 800), 150 + (k % 3) * 20, 1.4, k * 40, FS_LEAF_COLS[k % 5]); leaves.appendChild(el); }
  requestAnimationFrame(() => requestAnimationFrame(() => { if (lg) { lg.style.transition = `transform ${FS_PARADE_MS}ms linear`; lg.style.transform = `translateX(${dist}px)`; } }));
  const sayAt = 1800; FS.walkT.push(setTimeout(() => { if (fsHere('square')) say(PICK([tt('fest.ooh', 'Ooh.'), tt('fest.is_that_a_duck', 'Is that a duck?')]), lead + dist * sayAt / FS_PARADE_MS, feetY - hgt * 0.85, 2400); }, sayAt)); // at the leader's head
  FS.walkT.push(setTimeout(() => fsParadeEnd(true), FS_PARADE_MS + 200));
  onCleanup(() => { if (FS.walking) fsParadeEnd(false); });
}
function fsParadeEnd(here) {
  FS.walkT.splice(0).forEach(clearTimeout); if (!FS.walking) return;
  FS.walking = false; busy = false;
  const g = $('#fsParadeG'); if (g) g.remove();
  ['#dogPos', '#pack', '#visitorG', '#placeBtns'].forEach((s) => { const e = $(s, view); if (e) e.style.visibility = ''; });
  if (here && fsHere('square')) renderDog(dogPoseNow(), 'right', true); // fsParadeDone redraws the stall and the buttons once
  fsParadeDone();
}
function fsParadeDone() {
  fsFields(); S.fest.parade.date = localISO();
  const n = addCoins(10, { raw: true }); addStat('happy', 10); addBond(2); markDirty(); updateHUD(); SFX.kaching();
  toast(tt('fest.best_in_show', 'Best in show: {name}. +{n, plural, one {# coin} other {# coins}}.', { name: NAME(), n }), 'gold'); trackAct('parade', {});
  if (fsHere('square')) fsSquareDraw();
  const y = fsYear(); if (S.fest.parade.year === y) return;
  S.fest.parade.year = y; const fresh = !owns('clothes', 'Parade Rosette'); if (fresh) S.inv.clothes.push('Parade Rosette'); markDirty(); saveNow();
  const show = () => {
    SFX.fanfare();
    const p = openModal(`<span class="hl">${esc(tt('fest.rosette_title', 'The Parade Rosette!'))}</span>`, `<div class="ms-prize"><span class="ms-prize-art">${itemArt('Parade Rosette')}</span><div><p>${esc(fresh ? tt('fest.rosette_new', 'Gerald pins a rosette on {name}. It is a little bent. So is Gerald.', { name: NAME() }) : tt('fest.rosette_again', 'Best in show again this year. Gerald bends the rosette a little more, for luck.'))}</p><p class="small">${esc(tt('fest.rosette_note', 'Parade Rosette: neck. It is in the Wardrobe.'))}</p></div></div>`, { cls: 'celebrate fs-rosette', foot: `<button class="btn no" id="fsLater">${esc(tt('fest.later', 'Later'))}</button><button class="btn yes big" id="fsWear">${esc(tt('fest.wear_it', 'Wear it'))}</button>` });
    $('#fsLater', p).onclick = () => { SFX.click(); closeModal(); };
    $('#fsWear', p).onclick = () => { closeModal(); equip('Parade Rosette', true); toast(tt('fest.wearing_rosette', '{name} is wearing the Parade Rosette. Very proud.', { name: NAME() }), 'good'); };
  };
  if (typeof msWhenFree === 'function') msWhenFree(show); else setTimeout(show, 600);
}

/* ---- the Journal Food tab line ---- */
function fsJournalLine() {
  if (!S || !fsAnyOn()) return '';
  const leafIc = () => iconOr('festival', '<path d="M0 -12 C6 -8 9 -2 0 12 C-9 -2 -6 -8 0 -12 Z" fill="#E8893A" stroke="#5B3D32" stroke-width="2"/>');
  if (!festOn('leaf') && !festOn('halloween')) { // v2.8: the Winter Stall to the end of February (29 in a leap year), then the contest and the Fortune box lines
    const y = (typeof wnYear === 'function' ? wnYear() : +localISO().slice(0, 4)) + 1, leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const ic = typeof wnIcon === 'function' ? wnIcon('wstall') : leafIc();
    return `<p class="fs-jline wn-jline"><span class="ic" aria-hidden="true">${ic}</span><b>${esc(tt('fest.festival_label', 'Festival:'))}</b> ${esc(tt('fest.jline_winter', 'Winter Stall in the Square until {day} February.', { day: leap ? 29 : 28 }))}</p>` + (typeof wnJournalLine === 'function' ? wnJournalLine() || '' : '') + (typeof nyJournalLine === 'function' ? nyJournalLine() || '' : '');
  }
  const untilK = festOn('leaf') ? 'leaf' : 'hw';
  return `<p class="fs-jline"><span class="ic" aria-hidden="true">${leafIc()}</span><b>${esc(tt('fest.festival_label', 'Festival:'))}</b> ${esc(tt('fest.jline_harvest', '{k, select, leaf {Harvest Stall in the Square until 30 November.} other {Harvest Stall in the Square until 31 October.}}', { k: untilK }))}</p>` + (typeof hwJournalLine === 'function' ? hwJournalLine() : ''); // v2.6: the pop-up line under it
}

/* ---- bus ---- */
on('game:ready', () => { fsFields(); fsPackSync(); setTimeout(fsExpose, 0); });
on('yard:enter', () => {
  fsFields(); fsPackSync(); fsDraw(); fsExpose();
  { const sv = $('#view > svg.world'); if (sv && isPhone() && typeof ResizeObserver === 'function') { let raf = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fsHitFit); }); ro.observe(sv); onCleanup(() => { ro.disconnect(); cancelAnimationFrame(raf); }); } }
  // a visiting dog can arrive after this (drawVisitor) and move the phone crop: draw the stall and banner again for the new crop
  const tv = S && S.place === 'square' && $('#townV2'); if (tv && isPhone()) { const mo = new MutationObserver(() => { if (!FS.walking && fsHere('square')) fsSquareDraw(); }); mo.observe(tv, { childList: true }); onCleanup(() => mo.disconnect()); }
  fsLater(() => { if (cur.mode === 'yard') fsLetters(); }, 1200);
  fsSeasonGreet();
});
on('scene:redraw', () => { if (!FS.walking) { fsPackSync(); fsDraw(); } });
on('env:fest', () => { fsPackSync(); if (cur.mode === 'yard') setTimeout(fsLetters, 400); });
on('env:season', () => fsSeasonGreet());

/* ---- tests: window.__paw.fest ---- */
function fsExpose() {
  if (!window.__paw) return;
  window.__paw.fest = {
    piles: FS_PILES, stall: () => fsStallBox(), banner: () => fsBannerBox(), pumpkin: FS_PUMPKIN, pumpkinBox: () => fsPumpkinBox(), tap: (i) => fsPileTap(i), stallOpen: () => fsStallOpen(), paradeOpen: () => fsParadeOpen(),
    paradeDogs: (dk) => fsParadeDogs(dk), items: () => fsStallItems().map((x) => x.n), draw: () => fsDraw(), letters: () => fsLetters(), journal: () => fsJournalLine(),
    warm: () => isWarm(), get walking() { return FS.walking; }, get pending() { return FS.pending; }, canJump: () => fsCanJump(), seasonYear: (s) => fsSeasonYear(s), get scattered() { return Object.keys(FS.pileT).map(Number); }, packSpot: () => (typeof PACK_SPOTS !== 'undefined' ? PACK_SPOTS.square[2] : null)
  };
}
