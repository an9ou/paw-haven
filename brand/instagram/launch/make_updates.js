// Update posts (owner, 25 Oct 2026), 1080 x 1350 each, English, real game screens and the real (fixed, inside-the-lines) art:
//   v2.15 "A Bigger Town": a 4-slide carousel (Corso "Bruno"), screens from updates/capture_v215.js in <shotsdir> (map, training, pool);
//   v2.16 "First Week": a 4-slide carousel (Great Dane), screens from docs/release/v2.16/ (the release's own phone shots);
//   v2.15.2 "Inside the lines": one before/after image (Border Collie): the art before the fix is dogs/pawart_dogs.js at a1c4d11.
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js <shotsdir> updates
module.exports = async function ({ render, browser, helpers: h }) {
  const { f1, inner, PA, box, doodle, txt, lines, swash, tape, paper, defs, INK, MUTED, PINK, wordmark, frame } = h;
  const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
  const ROOT = path.join(__dirname, '..', '..', '..'), SHOTS = path.resolve(process.argv[2] || 'shots'), REL = path.join(ROOT, 'docs', 'release', 'v2.16');
  const W = 1080, H = 1350, doc = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${body}</svg>`;
  fs.mkdirSync(path.join(__dirname, 'updates'), { recursive: true });
  // a phone with a real screen: file, its pixel size, centre, height, tilt
  const phone = (file, [SW, SH], cx, cy, hh, rot, tp) => {
    const sw = hh * SW / SH, bez = hh * 0.022, x = cx - sw / 2, y = cy - hh / 2, R = hh * 0.05, id = 'c' + Math.random().toString(36).slice(2, 8);
    return `<g transform="rotate(${rot} ${cx} ${cy})"><g filter="url(#dd-shadow)"><rect x="${f1(x - bez)}" y="${f1(y - bez)}" width="${f1(sw + bez * 2)}" height="${f1(hh + bez * 2)}" rx="${f1(R + bez)}" fill="#FFFDF7"/></g>`
      + `<clipPath id="${id}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(sw)}" height="${f1(hh)}" rx="${f1(R)}"/></clipPath><image href="file://${file}" x="${f1(x)}" y="${f1(y)}" width="${f1(sw)}" height="${f1(hh)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
      + box(x - bez, y - bez, sw + bez * 2, hh + bez * 2, R + bez, 31, 1.6, 4.2) + (tp ? tape(cx - 80, y - bez - 30, 160, 46, -4, tp) : '') + '</g>';
  };
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = (sv) => mp.evaluate((s) => { const w = document.createElement('div'); w.innerHTML = s; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', 800); e.setAttribute('height', 800); const b = e.getBBox(); w.remove(); return [b.x, b.y, b.width, b.height]; }, sv);
  const fit = async (sv, cx, bottom, maxW, maxH) => { const b = await bbox(sv), k = Math.min(maxW / b[2], maxH / b[3]), w = b[2] * k, hh = b[3] * k;
    return `<ellipse cx="${f1(cx)}" cy="${f1(bottom - 4)}" rx="${f1(w * 0.42)}" ry="${f1(Math.max(8, w * 0.045))}" fill="#5B3D32" opacity=".15"/><svg x="${f1(cx - w / 2)}" y="${f1(bottom - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>`; };
  const dog = (k, pose, facing, outfit, P = PA) => P.dog(k, { pose, facing, outfit, anim: false });
  const pill = (s, cx, cy, w, hh, rot, size, fill = '#FFE3A1') => `<g transform="rotate(${rot} ${cx} ${cy})"><rect x="${cx - w / 2}" y="${cy - hh / 2}" width="${w}" height="${hh}" rx="${hh / 2}" fill="${fill}"/>${box(cx - w / 2, cy - hh / 2, w, hh, hh / 2, 71, 1.6, 4)}${txt(s, cx, cy + size * 0.34, size)}</g>`;
  const chip = (s, x, y, size, fill) => { const w = s.length * size * 0.44 + 44; return `<rect x="${f1(x)}" y="${f1(y - size * 0.95)}" width="${f1(w)}" height="${f1(size * 1.35)}" rx="${f1(size * 0.67)}" fill="${fill}" opacity=".9"/>${txt(s, x + w / 2, y, size, { w: 700 })}`; };
  const head = (title, sub, y = 150, size = 112) => swash(540, y - size * 0.25, Math.min(940, title.length * size * 0.42 + 100), size * 0.6, -2, PINK, 0.42) + txt(title, 540, y, size, { rot: -2 }) + (sub ? txt(sub, 540, y + 78, 46, { fill: MUTED, w: 600 }) : '');
  const note = (arr, x, y, size = 50) => lines(arr, x, y, size, size * 1.15, { w: 700, anchor: 'start' });
  const num = (i, n) => txt(`${i} / ${n}`, 1000, 1290, 36, { fill: MUTED, w: 600, anchor: 'end' });
  const S215 = [1170, 2532];

  // ================= v2.15 "A Bigger Town" (Bruno the Cane Corso) =================
  {
    const D = 'corso', OUT = { neck: 'Red Bandana' };
    // 1: cover
    let g = paper(W, H) + frame(W, H, 101);
    for (const [n, x, y, s, r] of [['spark', 110, 110, 1.3, 0], ['heart', 975, 120, 1.2, 12], ['leaf', 90, 1240, 1.3, 20], ['paw', 985, 1235, 1.2, -12]]) g += doodle(n, x, y, s, r);
    g += txt('new in Doodle Doggo', 540, 128, 50, { fill: MUTED, w: 600 });
    g += swash(540, 228, 760, 110, -2, PINK, 0.42) + txt('the town just', 540, 232, 116, { rot: -2 }) + txt('got bigger', 540, 350, 136, { rot: -2 });
    g += phone(path.join(SHOTS, 'map.png'), S215, 360, 820, 760, -4, '#FFE3A1');
    g += chip('Splash Pool', 640, 560, 44, '#CFE0F7') + chip('Training Ground', 640, 640, 44, '#BFE3C9') + chip('3 run tracks', 640, 720, 44, '#E0D5F0') + chip('a redrawn map', 640, 800, 44, '#FFE3A1');
    g += await fit(dog(D, 'happy', 'left', Object.assign({ body: 'Doggy Life Vest' }, OUT)), 830, 1180, 360, 330);
    g += txt('swipe →', 980, 1290, 42, { rot: -3, fill: MUTED, anchor: 'end' });
    await render(doc(g), W, H, 'updates/bigger-town-1-cover.jpg');
    // 2: Splash Pool
    g = paper(W, H) + frame(W, H, 102) + head('Splash Pool', 'a daily paddle for every dog');
    g += phone(path.join(SHOTS, 'pool.png'), S215, 340, 790, 900, -2.5, '#CFE0F7');
    g += note(['a free', 'life vest'], 650, 420) + note(['floating', 'fetch'], 650, 600) + note(['open all winter', 'under the', 'Winter Dome'], 650, 780, 44);
    g += doodle('spark', 960, 400, 1.2, 0) + doodle('heart', 980, 640, 1.1, 10) + num(2, 4);
    g += await fit(dog(D, 'sit', 'left', Object.assign({ body: 'Doggy Life Vest' }, OUT)), 830, 1240, 260, 230);
    await render(doc(g), W, H, 'updates/bigger-town-2-splash-pool.jpg');
    // 3: Training Ground
    g = paper(W, H) + frame(W, H, 103) + head('Training Ground', 'agility for every dog');
    g += phone(path.join(SHOTS, 'training.png'), S215, 340, 790, 900, -2.5, '#BFE3C9');
    g += note(['weave, jump,', 'tyre, tunnel', 'and table'], 650, 420, 46) + note(['a gentle course', 'for puppies', 'and seniors'], 650, 640, 44) + note(['no fails:', 'every run earns', 'rosettes'], 650, 860, 44);
    g += doodle('spark', 960, 1000, 1.2, 0) + num(3, 4);
    g += await fit(dog(D, 'jump', 'left', OUT), 830, 1240, 270, 200);
    await render(doc(g), W, H, 'updates/bigger-town-3-training-ground.jpg');
    // 4: the map + call to action
    g = paper(W, H) + frame(W, H, 104) + head('a redrawn town', 'winding roads, every building a button');
    g += phone(path.join(SHOTS, 'map.png'), S215, 340, 790, 900, -2.5, PINK);
    g += note(['shops with', 'their own', 'storefronts'], 650, 440) + note(['3 run tracks', 'with treasures', 'and gates'], 650, 680, 46) + note(['dogs roam', 'more freely'], 650, 900, 46);
    g += pill('play free at doodledoggo.app', 540, 1262, 640, 68, -2, 42) + num(4, 4).replace('1290', '1190');
    await render(doc(g), W, H, 'updates/bigger-town-4-map.jpg');
  }

  // ================= v2.16 "First Week" (a Great Dane) =================
  {
    const D = 'dane', R0 = [1179, 1977], R1 = [1179, 2556];
    let g = paper(W, H) + frame(W, H, 111);
    for (const [n, x, y, s, r] of [['spark', 110, 110, 1.3, 0], ['heart', 975, 120, 1.2, 12], ['paw', 90, 1240, 1.3, -10], ['spark', 990, 1240, 1.1, 0]]) g += doodle(n, x, y, s, r);
    g += txt('new in Doodle Doggo', 540, 128, 50, { fill: MUTED, w: 600 });
    g += swash(540, 228, 820, 110, -2, PINK, 0.42) + txt('your first week', 540, 232, 116, { rot: -2 }) + txt('with a crayon puppy', 540, 340, 84, { rot: -2 });
    g += phone(path.join(REL, 'guided_start_phone.png'), R0, 360, 830, 700, -4, '#FFE3A1');
    g += chip('a guided first day', 610, 560, 42, '#FFE3A1') + chip('Bond 2 in minutes', 610, 640, 42, '#F9D0D9') + chip('a welcome calendar', 610, 720, 42, '#CFE0F7');
    g += await fit(dog(D, 'happy', 'left', { neck: 'Bow Tie' }), 830, 1190, 360, 360);
    g += txt('swipe →', 980, 1290, 42, { rot: -3, fill: MUTED, anchor: 'end' });
    await render(doc(g), W, H, 'updates/first-week-1-cover.jpg');
    g = paper(W, H) + frame(W, H, 112) + head('a monthly calendar', 'every day you play stamps a paw', 150, 100);
    g += phone(path.join(REL, 'calendars_phone.png'), R1, 340, 800, 900, -2.5, '#CFE0F7');
    g += note(['missing a day', 'never costs', 'anything'], 640, 430, 52) + note(['gifts at', '3, 7, 12, 18', 'and 24 days'], 640, 680, 46) + note(['a 7-day welcome', 'calendar for', 'new players'], 640, 900, 42);
    g += doodle('heart', 980, 380, 1.2, 10) + num(2, 4);
    await render(doc(g), W, H, 'updates/first-week-2-calendar.jpg');
    g = paper(W, H) + frame(W, H, 113) + head('the Bond 2 party', 'reached in your first few minutes', 150, 104);
    g += phone(path.join(REL, 'bond2_party_phone.png'), R1, 340, 800, 900, -2.5, PINK);
    g += note(['confetti!'], 640, 420, 56) + note(['a free', 'Bow Tie'], 640, 560) + note(['and their', 'very first', 'Paw'], 640, 760);
    g += await fit(dog(D, 'paw', 'left', { neck: 'Bow Tie' }), 830, 1240, 280, 250) + num(3, 4);
    await render(doc(g), W, H, 'updates/first-week-3-bond2-party.jpg');
    g = paper(W, H) + frame(W, H, 114) + head('simpler on phones', '4 big buttons: Care, Walk, Map, More', 150, 104);
    g += phone(path.join(REL, 'dock_c_care.png'), R1, 340, 790, 880, -2.5, '#BFE3C9');
    g += note(['Care opens', 'Feed, Play and', 'Bath & nap'], 640, 440, 46).replace(/&/g, '&amp;') + note(['"see you', 'tomorrow": your', 'dog makes a', 'small wish'], 640, 700, 44);
    g += pill('play free at doodledoggo.app', 540, 1262, 640, 68, -2, 42) + num(4, 4).replace('1290', '1190');
    await render(doc(g), W, H, 'updates/first-week-4-phone-menu.jpg');
  }

  // ================= v2.15.2 "Inside the lines": before / now (a Border Collie) =================
  {
    const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
    vm.runInContext(cp.execFileSync('git', ['show', 'a1c4d11:dogs/pawart_dogs.js'], { cwd: ROOT, maxBuffer: 1 << 26 }).toString(), ctx);
    const OLD = win.PawArt, D = process.env.LINES_DOG || 'collie';
    let g = paper(W, H) + frame(W, H, 121);
    for (const [n, x, y, s, r] of [['spark', 110, 110, 1.3, 0], ['heart', 975, 120, 1.2, 12], ['paw', 90, 1240, 1.3, -10], ['spark', 990, 1240, 1.1, 0]]) g += doodle(n, x, y, s, r);
    g += txt('big news:', 540, 150, 64, { fill: MUTED, w: 600 });
    g += swash(540, 236, 880, 104, -2, PINK, 0.42) + txt('we learned to colour', 540, 262, 100, { rot: -2 }) + txt('inside the lines', 540, 372, 112, { rot: -2 });
    const card = (x, label, fill) => `<g transform="rotate(${x < 540 ? -2 : 2} ${x} 760)"><rect x="${x - 230}" y="470" width="460" height="560" rx="26" fill="${fill}" filter="url(#dd-shadow)"/>${box(x - 230, 470, 460, 560, 26, x, 2, 4.2)}${txt(label, x, 540, 60)}</g>`;
    g += card(290, 'before', '#CFE6F2') + card(790, 'now', '#CFE6F2');
    // a close-up of the front half (head, neck and chest) on the soft blue card, where a fill that drifts past its line shows
    const zoom = async (sv, cx) => { const b = await bbox(sv), cw = b[2] * 0.62, ch = b[3] * 0.78, vb = [b[0] + b[2] - cw, b[1] - 4, cw, ch], k = Math.min(400 / cw, 420 / ch);
      return `<svg x="${f1(cx - cw * k / 2)}" y="${f1(1000 - ch * k)}" width="${f1(cw * k)}" height="${f1(ch * k)}" viewBox="${vb.map(f1).join(' ')}" overflow="hidden">${inner(sv)}</svg>`; };
    g += await zoom(dog(D, 'happy', 'right', {}, OLD), 290) + await zoom(dog(D, 'happy', 'right', {}), 790);
    g += `<path d="M500 760 Q540 730 580 760" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M566 742 L582 761 L560 770" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    g += txt('(they are still very wobbly. that part stays.)', 540, 1110, 46, { fill: MUTED, w: 600 });
    g += txt('every dog, every outfit, every house', 540, 1180, 48, { w: 700 });
    g += wordmark(540, 1268, 50);
    await render(doc(g), W, H, 'updates/inside-the-lines.jpg');
  }
  await mp.close();
};
