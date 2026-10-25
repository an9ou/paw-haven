/* Rainy days: the "fill inside its outline" pixel sweep for the dogs (owner's rule: every colour fill stays inside its own outline).
   For every render (frame 0) it draws, in Chromium at 2x:
     A: every colour fill (paths and ellipses with a fill) in pure green, nothing else;
     B: every ink outline (stroke #2E2320) filled and stroked black: the inside of the outlines plus their line, grown by 1 px for antialiasing.
   Green pixels of A outside B are fill outside the lines. The shadow and the puddle (outside the frame) and the sparkle stars are left out.
   Each wet render is compared with the same dry render: a wet one may not have more fill outside the lines than its dry one (+ TOL px).
   Usage: NODE_PATH=$(npm root -g) node dogs/fill_sweep.js [keys]   (env TOL=30 (px at 2x, about 7 px at game size: the crude outline may leave a gap where its fill shows), FULL=1 also prints the dry baseline, DEBUG=key:pose:age:wet DEBUG_OUT=file.png writes that render's map) */
'use strict';
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const SRC = fs.readFileSync(path.join(__dirname, 'pawart_dogs.js'), 'utf8'), TOL = +(process.env.TOL || 30);
const POSES = ['idle','happy','pet','eat','sleep','walk','jump','sit','sad','dirty','crouch','shake','cold','hot','dig','beg','squat','leglift','paw','down','rollover','playdead','speak','dance','bow','scratch','sniff','yawn','howl'];
(async () => {
  const CH = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch(CH ? { executablePath: CH } : {}); const p = await b.newPage(); await p.setContent('<body></body>'); await p.addScriptTag({ content: SRC });
  const keys = process.argv[2] ? process.argv[2].split(',') : await p.evaluate(() => window.PawArt.DOGS.map((d) => d.key));
  const cases = []; keys.forEach((k, ki) => {
    POSES.forEach((pose, pi) => ['adult', 'puppy'].forEach((age) => cases.push({ k, o: { pose, age: age === 'adult' ? undefined : age, facing: (pi + ki) % 3 ? 'right' : 'left' } })));
    ['sleep', 'down'].forEach((pose) => cases.push({ k, o: { pose, age: 'newborn' } }));
    ['idle', 'sit', 'walk'].forEach((pose, i) => cases.push({ k, o: { pose, coat: { base: ['#3A3030', '#C08040', '#2B2430'][i], white: .7, merle: i !== 1, eyes: 'odd' }, seed: ki * 7 + i } }));
    ['idle', 'sit'].forEach((pose, i) => cases.push({ k, o: { pose, mix: { head: keys[(ki + 5 + i) % keys.length] }, age: i ? 'puppy' : undefined } }));
    cases.push({ k, o: { pose: 'idle', outfit: { head: 'Rain Hat', neck: 'Red Bandana' } } }, { k, o: { pose: 'happy', expr: 'hearts', sparkle: true } });
  });
  const R = await p.evaluate(async ({ cases, TOL, DBG }) => {
    const W = 480, H = 400, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d', { willReadFrequently: true });
    const draw = (svgText) => new Promise((ok, no) => { const im = new Image(); im.onload = () => { cx.clearRect(0, 0, W, H); cx.drawImage(im, 0, 0, W, H); ok(cx.getImageData(0, 0, W, H).data); }; im.onerror = no; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText); });
    const variant = (svg, mode) => { const d = new DOMParser().parseFromString(svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '), 'image/svg+xml'), r = d.documentElement; r.setAttribute('width', W); r.setAttribute('height', H);
      const f0 = r.querySelector('.pa-d-f0');
      r.querySelectorAll('path,ellipse,text,circle,rect,polygon').forEach((e) => {
        if (!f0 || !f0.contains(e) || e.tagName === 'text') { e.setAttribute('display', 'none'); return; }
        const fill = e.getAttribute('fill'), stroke = e.getAttribute('stroke'), ink = stroke === '#2E2320', hasFill = fill && fill !== 'none';
        e.removeAttribute('opacity'); e.removeAttribute('fill-opacity'); e.removeAttribute('class');
        if (mode === 'A') { if (hasFill && !ink) { e.setAttribute('fill', '#00ff00'); e.removeAttribute('stroke'); } else e.setAttribute('display', 'none'); }
        else if (ink || fill === '#2E2320') { e.setAttribute('fill', '#000'); e.setAttribute('stroke', '#000'); e.setAttribute('stroke-width', String((+e.getAttribute('stroke-width') || 0) + 1)); }
        else e.setAttribute('display', 'none');
      });
      return new XMLSerializer().serializeToString(d); };
    const out = []; let dbg = null;
    for (const c of cases) { const row = { k: c.k, o: c.o };
      for (const wet of [false, true]) { const svg = window.PawArt.dog(c.k, Object.assign({ anim: false, wet }, c.o));
        const A = await draw(variant(svg, 'A')), B = await draw(variant(svg, 'B')); let n = 0;
        for (let i = 0; i < A.length; i += 4) if (A[i + 3] > 200 && A[i + 1] > 200 && A[i] < 60 && B[i + 3] < 40) n++;
        row[wet ? 'wet' : 'dry'] = n;
        if (DBG && DBG === c.k + ':' + c.o.pose + ':' + (c.o.age || 'adult') + ':' + wet) { const im = cx.createImageData(W, H); for (let i = 0; i < A.length; i += 4) { const o = A[i + 3] > 200 && A[i + 1] > 200 && A[i] < 60 && B[i + 3] < 40; im.data[i] = o ? 255 : B[i + 3] > 40 ? 200 : 255; im.data[i + 1] = o ? 0 : B[i + 3] > 40 ? 200 : A[i + 3] > 200 ? 160 : 255; im.data[i + 2] = o ? 0 : B[i + 3] > 40 ? 200 : 255; im.data[i + 3] = 255; } cx.putImageData(im, 0, 0); dbg = cv.toDataURL(); } }
      out.push(row); }
    return { out, dbg }; }, { cases, TOL, DBG: process.env.DEBUG || '' });
  await b.close(); const res = R.out; if (R.dbg) { fs.writeFileSync(process.env.DEBUG_OUT || 'fill_debug.png', Buffer.from(R.dbg.split(',')[1], 'base64')); console.log('debug image written (red = fill outside the lines)'); }
  const bad = res.filter((r) => r.wet > r.dry + TOL);
  if (process.env.FULL) res.filter((r) => r.dry || r.wet).forEach((r) => console.log(r.k, JSON.stringify(r.o), 'dry', r.dry, 'wet', r.wet));
  console.log(`fill sweep: ${res.length} renders x dry/wet, ${bad.length} wet renders with more fill outside the lines than dry (+${TOL} px at 2x); dry with any: ${res.filter((r) => r.dry).length}, wet with any: ${res.filter((r) => r.wet).length}`);
  bad.slice(0, 40).forEach((r) => console.log('  BAD', r.k, JSON.stringify(r.o), 'dry', r.dry, 'wet', r.wet));
  process.exit(bad.length ? 1 : 0);
})();
