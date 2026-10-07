// v2.5 FIXES A: the "fill inside the outline" audit, shared by test_v25_fixes_a.js (desktop) and test_phone_v25_fixes_a.js (phones).
// For every visible control matching `sel` it measures the real pixels:
//   1. the outline: the first (2.3 px) pencil path of the control's frame SVG (the first url() of its background, or of its ::after for a meter track),
//      scaled to the box exactly as the browser stretches it (preserveAspectRatio="none", 100% x 100%);
//   2. the fill: a screenshot of the control with its frame hidden, its text and children hidden and every wash, hatch and paper colour set to pure green;
//   3. green pixels outside the outline (the path's inside plus its stroke, with a 0.5 px antialias margin) are "fill outside the lines".
// fillAudit(t, sel, label) -> [{ name, w, h, out }]; out is the number of fill pixels outside the outline (0 = inside).
const SENT = '#00ff00';
const CSS = `.__fa,.__fa *{animation:none!important;transition:none!important}
.__fa{transform:none!important;rotate:none!important;translate:none!important;scale:none!important;filter:none!important;box-shadow:none!important;color:transparent!important;opacity:1!important;
  --wash:${SENT}!important;--hatch:linear-gradient(${SENT},${SENT})!important;--paper:${SENT}!important;--w-yellow:${SENT}!important;--w-mint:${SENT}!important;--w-blue:${SENT}!important;--w-pink:${SENT}!important;--w-peach:${SENT}!important;--w-lilac:${SENT}!important;--w-cream:${SENT}!important;
  --fr-card:linear-gradient(transparent,transparent)!important;--fr-btn:linear-gradient(transparent,transparent)!important;--fr-round:linear-gradient(transparent,transparent)!important;--fr-tube:linear-gradient(transparent,transparent)!important;--fr-tubew:linear-gradient(transparent,transparent)!important;--fr-wide:linear-gradient(transparent,transparent)!important;--fr-tray:linear-gradient(transparent,transparent)!important;--fr:linear-gradient(transparent,transparent)!important}
.__fa *:not(.fill){visibility:hidden!important}.__fa::before,.__fa::after{display:none!important}.__fa .fill{visibility:visible!important;--m:${SENT}!important;background:${SENT}!important}`;

async function fillAudit(t, sel, label, o) {
  o = o || {}; const p = t.p;
  await p.evaluate((css) => { if (!document.getElementById('__faCss')) { const s = document.createElement('style'); s.id = '__faCss'; s.textContent = css; document.head.appendChild(s); } }, CSS);
  const items = await p.evaluate(({ sel, skip }) => {
    const out = [], vw = innerWidth, vh = innerHeight; let i = 0;
    const frameOf = (el) => { const pick = (bg) => { const m = /url\("data:image\/svg\+xml;charset=utf-8,([^"]+)"\)/.exec(bg || ''); return m ? decodeURIComponent(m[1]) : null; }; return pick(getComputedStyle(el).backgroundImage) || pick(getComputedStyle(el, '::after').backgroundImage); };
    document.querySelectorAll(sel).forEach((el) => {
      if (skip && el.closest(skip)) return;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (r.width < 8 || r.height < 6 || cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.2 || el.closest('[hidden]')) return;
      if (r.left < 0 || r.top < 0 || r.right > vw || r.bottom > vh) return;
      const svg = frameOf(el); if (!svg) return;
      const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg), d = /<path d="([^"]+)" stroke-width="2.3"/.exec(svg); if (!vb || !d) return;
      el.dataset.fa = String(i);
      out.push({ i: i++, name: (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.')) + ((el.textContent || el.getAttribute('aria-label') || '').trim() ? ' "' + (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 14) + '"' : ''), W: +vb[1], H: +vb[2], d: d[1] });
    });
    return out;
  }, { sel, skip: o.skip || null });
  const res = [];
  for (const it of items.slice(0, o.max || 40)) {
    const box = await p.evaluate((i) => { const el = document.querySelector(`[data-fa="${i}"]`); if (!el) return null; el.classList.add('__fa'); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, it.i);
    if (!box) continue; // re-rendered (a toast that left, a tray that refreshed): skip it
    const pad = 3, clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + pad * 2, height: box.h + pad * 2 };
    const png = (await p.screenshot({ clip, scale: 'css', animations: 'disabled' })).toString('base64');
    const out = await p.evaluate(async ({ png, it, box, clip }) => {
      const el = document.querySelector(`[data-fa="${it.i}"]`); if (!el) return 0; el.classList.remove('__fa');
      const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
      const W = img.width, H = img.height, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const px = g.getImageData(0, 0, W, H).data;
      // the path in screen px (scale every coordinate), so the stroke margin is the same 3.3 px (the 2.3 px line plus 0.5 px antialias each side) in x and y
      const sx = box.w / it.W, sy = box.h / it.H, ox = box.x - clip.x, oy = box.y - clip.y; let ax = true;
      const dpx = it.d.replace(/-?[\d.]+/g, (v) => { const r = ax ? ox + v * sx : oy + v * sy; ax = !ax; return r.toFixed(2); });
      const m = document.createElement('canvas'); m.width = W; m.height = H; const k = m.getContext('2d'), path = new Path2D(dpx);
      k.fillStyle = '#000'; k.fill(path); k.lineWidth = 3.3; k.lineJoin = 'round'; k.lineCap = 'round'; k.strokeStyle = '#000'; k.stroke(path);
      const mk = k.getImageData(0, 0, W, H).data; let n = 0;
      for (let q = 0; q < W * H; q++) { const r = px[q * 4], gg = px[q * 4 + 1], b = px[q * 4 + 2]; if (gg - Math.max(r, b) > 110 && mk[q * 4 + 3] < 128) n++; }
      return n;
    }, { png, it, box, clip });
    res.push({ name: it.name, w: Math.round(box.w), h: Math.round(box.h), out });
  }
  await p.evaluate(() => document.querySelectorAll('[data-fa]').forEach((e) => { e.classList.remove('__fa'); delete e.dataset.fa; }));
  if (label) t.ok(res.length > 0 && res.every((r) => r.out <= (o.tol || 0)), `${label}: ${res.length} controls keep their fill inside the outline${res.filter((r) => r.out > (o.tol || 0)).length ? ' -> ' + res.filter((r) => r.out > (o.tol || 0)).slice(0, 6).map((r) => `${r.name} ${r.w}x${r.h}: ${r.out} px out`).join(' | ') : ''}`);
  return res;
}
module.exports = { fillAudit };
