/* ======================= v2.31 "Share my dog" (Release B): 58_share.js (tag sh) =======================
   One picture of the player's dog to share on Instagram, X, RedNote or with friends, so the game travels by word of mouth.
   - The picture: the dog about twice the size of the old postcard dog, standing on the player's own yard (the yard scene, the dog house and the
     yard decorations, as photo mode sees it, never a poop or a fly), a small crayon line with the breed and what it wears, the dog's name only when
     the player turns on "Show name" (off by default), and a small "Doodle Doggo · doodledoggo.app" chip. No QR code here.
   - Two sizes: 1080x1350 (a feed post, the default) and 1080x1920 (a story or reel). prefs.shSize ('feed' | 'story') and prefs.shName (bool).
   - Shared with the Web Share API (files) where it works; else a download; else (the claude.ai sandbox) "Press and hold the picture to save it".
     Nothing is uploaded anywhere: the PNG is drawn on the device and handed to the device's own share sheet.
   - Entry points: the yard (the top bar Share button on desktop, the "..." menu on phones, both from 56_stories.js), "Share this moment" on the
     Bond level card and the walk results card, and a chip after a story scene. Each opens shareDog(opts) with that moment's pose and outfit.
   API: shareDog(opts) opts: { id: a dog id (default the active dog), pose: 'happy' | 'sit' | ..., outfit: {head, eyes, ...} (default what it wears),
        wet: bool (default: raining and no raincoat), from: 'yard' | 'menu' | 'bond' | 'walk' | 'story' | 'sleep', back: a function for a Back button,
        v2.33: yard: markup in scene units drawn instead of shYardInner() (the sleepover's yard), pal: a second dog drawn left of mine (SH_PAL) }.
   No save field and no coins. Test hook: window.__paw.sh. */
const SH = { tok: 0, rec: null, busy: false, how: '', force: '', moT: 0 };
const SH_SIZES = { feed: { w: 1080, h: 1350 }, story: { w: 1080, h: 1920 } };
const SH_CHIP = 'Doodle Doggo · doodledoggo.app'; // the game's name and its address: never translated
const SH_SITE = 'https://doodledoggo.app';
const shSize = () => (prefs.shSize === 'story' ? 'story' : 'feed');
// the layout of each size, in picture px: the yard window, then the name, the crayon line and the chip under it
const SH_LAY = {
  feed: { win: [46, 46, 988, 1036], name: 1166, line: 1226, lineNo: 1186, chip: 1290, tape: 1 },
  story: { win: [46, 196, 988, 1300], name: 1594, line: 1658, lineNo: 1618, chip: 1730, tape: 1 }
};

/* ---------------- the words ---------------- */
function shDog(o) { return (o && o.id && dogById(o.id)) || (S && S.dog) || null; }
function shOutfit(d, o) { return o && o.outfit ? o.outfit : outfitOf(d); }
function shWet(d, o) { if (o && typeof o.wet === 'boolean') return o.wet; const f = shOutfit(d, o); return !!S && weatherNow() === 'rain' && !RAINCOATS.includes(f && f.body); }
// what the dog wears, as item names (the life vest of the pool is draw-only and never named)
function shWearing(d, o) { const f = shOutfit(d, o) || {}; return ['head', 'eyes', 'neck', 'body', 'feet', 'charm'].map((k) => f[k]).filter((n) => n && typeof n === 'string' && (typeof PL_VEST === 'undefined' || n !== PL_VEST)); }
function shLine(d, o) {
  const pup = typeof lifeStage === 'function' && lifeStage(ageMonths(d)) === 'puppy', breed = tbreed(d.key), w = shWearing(d, o);
  const who = pup ? tt('sh.puppy', '{breed} puppy', { breed }) : breed;
  return w.length ? tt('sh.wearing', '{who} wearing {items}', { who, items: tlist(w.map((n) => tItem(n))) }) : who;
}

/* ---------------- the picture ---------------- */
// the player's own yard as markup in scene units (0 0 1000 600): the scene with today's light, season and garden, the snowman, the yard
// decorations and the dog house. No dogs, no bowl, no mess: the shared dog is drawn on top of it, bigger
function shYardInner() {
  let s = '';
  try { s += sceneArt('yard', envNow(), { patch: typeof gkOn === 'function' && gkOn() ? patchState() : 'empty' }); } catch (e) { s += '<rect width="1000" height="600" fill="#CFE8B8"/>'; }
  try { s += snowmanSVG(); } catch (e) { /* no snowman */ }
  try { if (typeof hmDecorSVG === 'function') s += hmDecorSVG().replace(/\sid="decorG"/, ''); } catch (e) { /* no decorations */ }
  try { s += place(art('house', S.house), 620, 330, 240, 200); } catch (e) { /* no house art */ }
  // nothing that points outside the file (a tainted canvas stops the PNG), no handlers
  return s.replace(/\s(?:on[a-z]+|tabindex|role|aria-label)="[^"]*"/gi, '').replace(/\s(?:xlink:)?href="(?!#|data:)[^"]*"/g, '');
}
// the daylight and weather washes over the yard, as photo mode draws them (phWash in 35_photo.js)
function shWash(vb) {
  if (typeof phWash !== 'function') return '';
  const t = timePhase(), w0 = weatherNow(), tint = (t !== 'day' || ['rain', 'cloudy', 'snow'].includes(w0)) && !sceneKnowsTime('yard') ? 'tintfx ' + t + ' w-' + w0 : '';
  return phWash({ tint, wx: w0 === 'rain' || w0 === 'snow' ? w0 : '' }, vb);
}
// a wobbly crayon rectangle (closed path)
function shWob(x, y, w, h, r, seed, j) {
  const rnd = seeded(seed), J = () => f1((rnd() - 0.5) * j);
  return `M${f1(x + r)} ${f1(y + J())} L${f1(x + w - r)} ${f1(y + J())} Q${f1(x + w)} ${f1(y)} ${f1(x + w + J())} ${f1(y + r)} L${f1(x + w + J())} ${f1(y + h - r)} Q${f1(x + w)} ${f1(y + h)} ${f1(x + w - r)} ${f1(y + h + J())} L${f1(x + r)} ${f1(y + h + J())} Q${f1(x)} ${f1(y + h)} ${f1(x + J())} ${f1(y + h - r)} L${f1(x + J())} ${f1(y + r)} Q${f1(x)} ${f1(y)} ${f1(x + r)} ${f1(y)} Z`;
}
function shTape(cx, cy, a, col) {
  const w = 150, h = 40, p = `M${-w / 2} ${-h / 2} L${w / 2} ${-h / 2 + 2} L${w / 2 - 3} ${h / 2} L${-w / 2 + 2} ${h / 2 - 2} Z`;
  return `<g transform="translate(${cx} ${cy}) rotate(${a})" opacity=".9"><path d="${p}" fill="${col}"/><path d="${p}" fill="none" stroke="${INKG}" stroke-opacity=".35" stroke-width="2"/>${[-50, -25, 0, 25, 50].map((x) => `<path d="M${x - 6} ${h / 2 - 4} l12 ${-h + 8}" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>`).join('')}</g>`;
}
// the shared dog in scene units: 1.6 times the yard dog (DW x DH), standing near the front of the yard, a little closer to the camera than its house.
// Its drawing fills about the middle 64% of its box, so the dog itself spans about x 345-615
const SH_DOG = { x: 268, y: 246, w: 422, h: 352 }, SH_SPAN = [300, 870]; // SH_SPAN: the dog and its dog house (620-860), what the crop keeps when it can
// v2.33 (V233.md 4.2): a second dog (opts.pal, the sleepover's friend dog) stands left of mine, a little further back; the crop then keeps the two dogs
const SH_PAL = { x: 96, y: 282, w: 340, h: 284 }, SH_PAL_SPAN = [150, 640];
// the yard crop in scene units: the full height, as wide as the window's shape; the dog and its house side by side where they fit, else the whole dog first
function shCrop(win, span) {
  span = span || SH_SPAN;
  const a = win[2] / win[3], h = 600, w = Math.min(1000, h * a), sw = span[1] - span[0];
  const x = clamp(w >= sw ? span[0] - (w - sw) / 2 : span[0], 0, 1000 - w);
  return [f1(x), 0, f1(w), h];
}
// the chip: a little paper label with a paw, the name of the game and its address. k: the scale (1 = a 1080 px wide picture);
// anchor 'c': (x, y) is its middle, 'br': its bottom right corner (the photo mode postcard, 35_photo.js phCompose)
function shChip(x, y, k, anchor) {
  k = k || 1; const cs = 30, tw = frTextW(SH_CHIP, cs, "'Caveat',cursive", 700), pw = tw + 96, ph = 58;
  const px = anchor === 'br' ? -pw : -pw / 2, py = anchor === 'br' ? -ph : -ph / 2, path = shWob(px, py, pw, ph, 26, 7, 3);
  return `<g class="sh-chip" transform="translate(${f1(x)} ${f1(y)}) scale(${k})"><path d="${path}" fill="#FFF3B8"/><path d="${path}" fill="none" stroke="${INKG}" stroke-width="3" stroke-linejoin="round"/>${doodle('paw', px + 36, py + ph / 2, 1.15)}<text x="${f1(px + 62)}" y="${f1(py + ph / 2 + 10)}" font-size="${cs}" font-weight="700" fill="${INKG}" style="font-family:'Caveat',cursive">${esc(SH_CHIP)}</text></g>`;
}
function shSVG(o) {
  o = o || {}; const d = shDog(o); if (!d) return '';
  const size = SH_SIZES[o.size === 'story' ? 'story' : 'feed'], L = SH_LAY[o.size === 'story' ? 'story' : 'feed'], W = size.w, H = size.h, win = L.win, pal = o.pal && o.pal.key ? o.pal : null, vb = shCrop(win, pal ? SH_PAL_SPAN : null);
  let dog = '';
  if (pal) { // v2.33: the friend's dog, left of mine and behind it (its art's label never goes in the file)
    try { dog += place(dogSVG(pal, { pose: 'sit', outfit: pal.outfit, facing: 'right', anim: false }).replace(/\s(?:role|aria-label)="[^"]*"/g, ''), SH_PAL.x, SH_PAL.y, SH_PAL.w, SH_PAL.h); } catch (e) { /* no pal */ }
  }
  try {
    const pose = o.pose || 'happy', ex = { pose, outfit: shOutfit(d, o), facing: 'right', anim: false };
    if (shWet(d, o)) ex.wet = true;
    dog += place(dogSVG(d, ex).replace(/\s(?:role|aria-label)="[^"]*"/g, ''), SH_DOG.x, SH_DOG.y, SH_DOG.w, SH_DOG.h); // the art's label carries the name: never in the file unless asked
  } catch (e) { /* no dog */ }
  const own = typeof o.yard === 'string' && o.yard; // v2.33: a yard drawn by the caller (the sleepover's picture, scene units): no wash of today's light and weather over it
  const scene = `<svg x="${win[0]}" y="${win[1]}" width="${win[2]}" height="${win[3]}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMax slice" overflow="hidden"><rect x="${vb[0]}" y="0" width="${vb[2]}" height="600" fill="#D3E9F6"/>${own || shYardInner()}${dog}${own ? '' : shWash(vb)}</svg>`;
  const hand = FR_FONT, cx = W / 2, name = o.name && d.name ? String(d.name) : '';
  const frame = shWob(win[0], win[1], win[2], win[3], 14, 31, 5);
  const txt = [
    name ? frPosterLine([[name, hand]], cx, L.name, 76, W - 160, { rot: -1.5 }) : '',
    frPosterLine([[shLine(d, o), hand]], cx, name ? L.line : L.lineNo, name ? 42 : 50, W - 140, { col: '#6B5046' })
  ].join('');
  const chip = shChip(cx, L.chip, 1, 'c');
  const dots = `<defs><pattern id="sh-dots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.6" fill="#E3D6C6"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#sh-dots)"/>`;
  const deco = [doodle('heart', W - 92, H - 58, 1.5, 12), doodle('spark', 80, H - 62, 1.4), doodle('spark', W - 150, H - 96, 0.9), o.size === 'story' ? doodle('heart', 120, 120, 1.4, -10) + doodle('spark', W - 120, 110, 1.3) + doodle('spark', W / 2, 96, 0.9) : ''].join('');
  const tapes = shTape(win[0] + 70, win[1] + 8, -32, '#F7B2C4') + shTape(win[0] + win[2] - 70, win[1] + 8, 32, '#BDE7D2');
  const style = `<style>${typeof PH_FONT_CSS === 'string' ? PH_FONT_CSS : ''}${tfontCSS()}.pa-d-f1,.pa-d-f2{opacity:0}*{animation:none!important;transition:none!important}</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${style}<rect width="${W}" height="${H}" fill="#FFFBF3"/>${dots}`
    + `<path d="${frame}" fill="none" stroke="#F7B2C4" stroke-width="26" stroke-linejoin="round" transform="translate(5 7)" opacity=".85"/>${scene}<path d="${frame}" fill="none" stroke="${INKG}" stroke-width="5" stroke-linejoin="round"/>`
    + `${tapes}${deco}${txt}${chip}</svg>`;
}
async function shDraw(o) {
  const fw = typeof phFonts === 'function' ? phFonts() : null; if (fw) await fw;
  try { if (document.fonts && document.fonts.load) await Promise.race([Promise.all(['700 30px Caveat', '400 15px "Patrick Hand"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* measure with what is there */ }
  const svg = shSVG(o); if (!svg) return null;
  const sz = SH_SIZES[o.size === 'story' ? 'story' : 'feed'], im = await phLoad(phDataURL(svg));
  const cv = document.createElement('canvas'); cv.width = sz.w; cv.height = sz.h;
  const ctx = cv.getContext('2d'); ctx.fillStyle = '#FFFBF3'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(im, 0, 0, cv.width, cv.height);
  return new Promise((res) => { try { cv.toBlob((b) => res(b), 'image/png'); } catch (e) { res(null); } });
}

/* ---------------- sharing ---------------- */
function shFileName(d) { return `doodle-doggo-${String((d && d.key) || 'dog').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${jstISO()}.png`; }
const shDownloadOK = () => SH.force !== 'nodownload' && !(typeof clArtifact === 'function' && clArtifact());
async function shDeliver(blob, d) {
  const file = new File([blob], shFileName(d), { type: 'image/png' });
  if (SH.force !== 'none' && navigator.share && navigator.canShare) {
    const full = { files: [file], text: tt('sh.share_text', 'My dog in Doodle Doggo!'), url: SH_SITE };
    let data = null; try { data = navigator.canShare(full) ? full : navigator.canShare({ files: [file] }) ? { files: [file] } : null; } catch (e) { data = null; }
    if (data) { try { await navigator.share(data); return 'share'; } catch (e) { if (e && e.name === 'AbortError') return null; } } // closed the share sheet: nothing more. Blocked (an iframe): the download
  }
  if (shDownloadOK()) {
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = file.name; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
    return 'download';
  }
  return 'hold';
}

/* ---------------- the share sheet ---------------- */
function shIcon() {
  return '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 13.5 Q6 26.5 7.5 27 Q16 28 24.5 27 Q26 26 25 13.5" fill="#FFF3B8" stroke="#5B3D32" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 20 L16 4.5 M10.5 9.5 L16 4 L21.5 9.5" fill="none" stroke="#5B3D32" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.6 22.5 q4.4 2.6 8.8 0" fill="none" stroke="#F28FA5" stroke-width="2" stroke-linecap="round"/></svg>';
}
function shOptsHTML() {
  const sz = shSize(), nm = !!prefs.shName;
  return `<div class="sh-opts"><div class="sh-sizes" role="group" aria-label="${esc(tt('sh.size', 'Picture size'))}">`
    + `<button type="button" class="btn sh-size" data-shsize="feed" aria-pressed="${sz === 'feed'}">${esc(tt('sh.size_post', 'Post'))}</button>`
    + `<button type="button" class="btn sh-size" data-shsize="story" aria-pressed="${sz === 'story'}">${esc(tt('sh.size_story', 'Story'))}</button></div>`
    + `<button type="button" class="btn sh-name" role="switch" aria-checked="${nm}" id="shName"><span class="sh-tog" aria-hidden="true"></span>${esc(tt('sh.show_name', 'Show name'))}</button></div>`;
}
function shRedraw(p) {
  const rec = SH.rec; if (!rec || !p || !p.isConnected) return;
  const tok = ++SH.tok, box = $('.sh-prev', p), go = $('#shGo', p), o = Object.assign({}, rec.o, { size: shSize(), name: !!prefs.shName });
  rec.blob = null; if (go) go.setAttribute('aria-disabled', 'true');
  if (box) { box.dataset.size = o.size; box.setAttribute('aria-busy', 'true'); box.classList.add('sh-busy'); }
  shDraw(o).then((b) => {
    if (tok !== SH.tok || SH.rec !== rec || !box || !box.isConnected) return;
    box.classList.remove('sh-busy');
    if (!b) { box.innerHTML = `<span class="sh-wait">${esc(tt('sh.fail', 'The picture got stuck. Try again.'))}</span>`; return; }
    rec.blob = b; rec.size = o.size; rec.name = o.name; if (rec.url) URL.revokeObjectURL(rec.url); rec.url = URL.createObjectURL(b); box.removeAttribute('aria-busy');
    box.innerHTML = `<img class="sh-img" alt="${esc(tt('sh.alt', 'A picture of your dog in your yard, ready to share'))}" src="${rec.url}">`;
    if (go) go.removeAttribute('aria-disabled');
  }).catch((e) => { SH.err = String((e && e.message) || e); if (box) box.classList.remove('sh-busy'); });
}
function shareDog(opts) {
  if (!S || !S.dog || ['title', 'adopt'].includes(cur.mode)) return null;
  const o = Object.assign({ from: 'menu' }, opts || {}), d = shDog(o); if (!d) return null;
  o.id = d.id; o.outfit = shOutfit(d, o); o.wet = shWet(d, o); // the moment as it is now: the outfit and the rain do not change under the sheet
  try { SFX.click(); } catch (e) { /* no sound */ }
  const back = typeof o.back === 'function' ? o.back : null;
  const p = openModal(esc(tt('sh.title', 'Share my dog')), `<div class="sh"><div class="sh-prev" data-size="${shSize()}" aria-busy="true"><span class="sh-wait">${esc(tt('sh.drawing', 'Drawing your picture...'))}</span></div>`
    + `<div class="sh-side">${shOptsHTML()}<p class="small sh-note">${esc(tt('sh.note', 'The picture is made on your device. Your dog\'s name is on it only if you turn it on.'))}</p></div></div>`,
  { cls: 'sh-pop', foot: `${back ? `<button class="btn" type="button" id="shBack">${esc(tt('sh.back', 'Back'))}</button>` : ''}<button class="btn yes big" type="button" id="shGo" aria-disabled="true"><span class="sh-ic">${shIcon()}</span>${esc(tt('sh.share', 'Share'))}</button>` });
  p.dataset.shFrom = o.from;
  const rec = { o, blob: null, url: '', size: '', name: false }; SH.rec = rec;
  const bk = $('#shBack', p); if (bk) bk.onclick = () => { SFX.click(); closeModal(); setTimeout(back, 40); };
  p.querySelectorAll('[data-shsize]').forEach((b) => { b.onclick = () => { if (shSize() === b.dataset.shsize) return; SFX.click(); prefs.shSize = b.dataset.shsize; savePrefs(); p.querySelectorAll('[data-shsize]').forEach((x) => x.setAttribute('aria-pressed', x === b)); shRedraw(p); }; });
  const nb = $('#shName', p); nb.onclick = () => { SFX.click(); prefs.shName = !prefs.shName; savePrefs(); nb.setAttribute('aria-checked', !!prefs.shName); shRedraw(p); };
  const go = $('#shGo', p);
  go.onclick = async () => {
    if (go.getAttribute('aria-disabled') === 'true' || !rec.blob || SH.busy) return;
    SH.busy = true;
    try {
      const how = await shDeliver(rec.blob, d); SH.how = how || '';
      if ((how === 'share' || how === 'download') && S.st) { S.st.pc = (S.st.pc || 0) + 1; markDirty(); } // the v2.28 postcard count (S.st.pc) counts the shared pictures too
      if (how === 'download') toast(tt('sh.saved', 'Picture saved. Look in your downloads.'), 'good');
      else if (how === 'share') SFX.boop(760);
      else if (how === 'hold') { const n = $('.sh-note', p); if (n) { n.textContent = tt('sh.hold', 'Press and hold the picture to save it.'); n.classList.add('sh-hold'); } }
    } finally { SH.busy = false; }
  };
  shRedraw(p);
  return p;
}

/* ---------------- "Share this moment": the Bond level card, the walk results card, after a story scene ---------------- */
function shMomentBtn(from) { return `<div class="sh-mrow"><button class="btn sh-moment" type="button" data-shmoment="${from}"><span class="sh-ic">${shIcon()}</span>${esc(tt('sh.moment', 'Share this moment'))}</button></div>`; }
// the walk's rain is the moment's rain: a dog that just came home wet is shared wet
function shMomentOpts(from) {
  const d = S && S.dog; if (!d) return null;
  const o = { from, id: d.id, pose: 'happy' };
  if (from === 'walk' && typeof W !== 'undefined' && W) o.wet = W.wx === 'rain' && !RAINCOATS.includes(outfitOf(d).body);
  return o;
}
function shMomentHook() {
  if (!S || modal.hidden) return;
  const p = $('.panel.celebrate', modal); if (!p || p.querySelector('.sh-mrow')) return;
  const body = $('.panel-body', p); if (!body) return;
  const from = p.querySelector('#luOk') ? 'bond' : p.querySelector('#resOk') ? 'walk' : '';
  if (from) body.insertAdjacentHTML('beforeend', shMomentBtn(from));
}
new MutationObserver(() => { try { shMomentHook(); } catch (e) { /* the card changed */ } }).observe(modal, { childList: true });
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest && e.target.closest('[data-shmoment]'); if (!b || !S) return;
  e.stopPropagation(); const o = shMomentOpts(b.dataset.shmoment); if (!o) return;
  hideMomentChip();
  if (!modal.hidden) { SFX.click(); closeModal(); } // the card closes as with its own button (its onClose runs), then the sheet opens
  setTimeout(() => shareDog(o), 80);
});
// after a story scene that was watched to the end: a small chip under the top bar for a few seconds
function hideMomentChip() { clearTimeout(SH.moT); const c = $('#shMoment'); if (c) c.remove(); }
function showMomentChip() {
  hideMomentChip(); if (!S || !S.dog || cur.mode !== 'yard' || (typeof phActive === 'function' && phActive())) return;
  const c = document.createElement('div'); c.id = 'shMoment'; c.innerHTML = shMomentBtn('story').replace('sh-mrow', 'sh-mrow sh-mchip');
  const hb = hud && !hud.hidden ? hud.getBoundingClientRect() : null, sb = stage.getBoundingClientRect();
  // fit sweep 18 Nov: under the HUD's Next tags too (desktop hangs "Next: Bond 3 ..." and "Next: Level 2 ..." below the bar; the chip sat on them)
  const low = ['#fwNext', '#lvNext'].reduce((m, q) => { const e = $(q); if (!e || e.hidden || !e.offsetParent) return m; const r = e.getBoundingClientRect(); return r.height ? Math.max(m, r.bottom) : m; }, hb ? hb.bottom : sb.top + 56);
  c.style.top = Math.max(8, Math.round(low - sb.top + 10)) + 'px';
  stage.appendChild(c); SH.moT = setTimeout(hideMomentChip, 12000);
}
on('sc:end', (e) => { if (e && !e.skipped) setTimeout(() => { if (modal.hidden) showMomentChip(); }, 400); });
new MutationObserver(() => { if (!modal.hidden) { const c = $('#shMoment'); if (c && !(SH.rec && $('.sh-pop', modal))) hideMomentChip(); } }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
if (typeof onCleanup === 'function') on('yard:enter', () => onCleanup(hideMomentChip));

/* ---------------- test hook ---------------- */
function sdExpose() {
  if (!window.__paw || window.__paw.sh) return;
  window.__paw.sh = {
    open: (o) => shareDog(o), svg: (o) => shSVG(Object.assign({ size: shSize(), name: !!prefs.shName }, o || {})), draw: (o) => shDraw(Object.assign({ size: shSize() }, o || {})),
    rec: () => (SH.rec ? { from: SH.rec.o.from, blob: !!SH.rec.blob, bytes: SH.rec.blob ? SH.rec.blob.size : 0, size: SH.rec.size, name: SH.rec.name, wet: SH.rec.o.wet, pose: SH.rec.o.pose || 'happy', pal: !!SH.rec.o.pal, yard: typeof SH.rec.o.yard === 'string' } : null),
    line: (o) => { const d = shDog(o); return d ? shLine(d, o) : ''; }, how: () => SH.how, force: (f) => { SH.force = f || ''; }, chip: () => showMomentChip(), sizes: SH_SIZES, yard: () => shYardInner(), pick: (key, i) => (typeof starterPick === 'function' ? starterPick(key, i || 0, 0) : null)
  };
}
on('game:ready', () => setTimeout(sdExpose, 0)); on('yard:enter', sdExpose);
