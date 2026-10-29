/* ======================= v2.18 FUN FAIR: the eight games (V218.md 1-6, tag ff) =======================
   Each game is a FF_DEF entry run by the frame in 49_funfair.js (enterFair): { dur (s, 0 = round-based with prog), init(G), tick(G, dt),
   down / move / up (field units), key(G, e, isDown), coins(G) (what the round earned before the caps), result(G), hint(G), scoreText(G) }.
   The field is 1000 units wide and G.H tall (a phone gets a tall field). Speeds are per second (dt), so every screen and frame rate plays the same.
   Nothing here can fail: a miss earns less, never takes anything away. */
function ffDefs() { if (!FF.defs) FF.defs = FF_DEF; return FF.defs; }
const ffSide = (s) => (s.face === 'left' ? -1 : 1);
// keep a dog pose for a moment before going back to rest, so a jittery finger does not redraw the dog every frame
function ffWalkPose(G, s, moving, face) { const D2 = G.data; if (moving) { D2.still = 0; ffPose(s, 'walk', face); } else { D2.still = (D2.still || 0) + (G.dt || 0.016); if (D2.still > 0.25) ffPose(s, D2.rest || 'idle', face); } }
const FF_SHAPES = ['bone', 'heart', 'star', 'round'];
function ffShapeName(s) { switch (s) { case 'bone': return tt('ff.sh_bone', 'bone'); case 'heart': return tt('ff.sh_heart', 'heart'); case 'star': return tt('ff.sh_star', 'star'); default: return tt('ff.sh_round', 'round'); } }
const FF_POSE = { Sit: 'sit', Paw: 'paw', 'Lie Down': 'down', 'Roll Over': 'rollover', Spin: 'happy', 'Play Dead': 'playdead', Speak: 'speak', Dance: 'dance', Bow: 'bow', Stand: 'idle', Wag: 'happy' };
function ffShowTricks(d) {
  const L = (d.bond && d.bond.level) || 1, out = TRICKS.filter((t) => t.n !== 'Signature' && L >= t.bond && trickSt(t.n, d).p >= 1).map((t) => t.n);
  ['Stand', 'Wag', 'Sit'].forEach((n) => { if (out.length < 4 && !out.includes(n)) out.push(n); });
  return out.slice(0, 6);
}
const ffTrickName = (n) => (n === 'Stand' ? tt('ff.t_stand', 'Stand tall') : n === 'Wag' ? tt('ff.t_wag', 'Wag') : tTrick(n));
const FF_TOY = () => ['Squeaky Duck', 'Tennis Ball', 'Rope Toy'].find((n) => owns('toys', n)) || 'Squeaky Duck';

const FF_DEF = {
  /* ---------- 1. Treat Catch (Sunny Park, Bond 1) ---------- */
  catch: {
    dur: 60,
    hint: () => (isPhone() ? tt('ff.h_catch_p', 'Slide your finger to move. Catch the treats, pinecones just bounce off.') : tt('ff.h_catch', 'Move with the mouse or the arrow keys. Catch the treats, pinecones just bounce off.')),
    scoreText: (G) => tt('ff.sc_catch', 'Treats: {n}', { n: G.score }),
    init(G) {
      const D2 = G.data, th = Math.max(200, G.H - 220);
      [0.078, 0.922].forEach((f) => { const tr = ffSpr(G, ffArt('trunk').replace('<svg ', '<svg preserveAspectRatio="none" '), 64, th, 'ff-static'); ffPut(tr, G.W * f, 220 + th / 2); });
      D2.tree = ffSpr(G, ffArt('canopy', { season: seasonNow() }), G.W, 300 * G.u, 'ff-static'); ffPut(D2.tree, G.W / 2, 150 * G.u + 40 * (1 - G.u));
      D2.dog = ffDog(G, G.d, 1.05); D2.x = G.W / 2; D2.tx = D2.x; D2.floor = G.H - 24; D2.items = []; D2.next = 0.8; D2.l = 0; D2.r = 0; D2.face = 'right';
      ffFeet(D2.dog, D2.x, D2.floor);
    },
    tick(G, dt) {
      const D2 = G.data, sp = 950; G.dt = dt;
      if (D2.l || D2.r) D2.tx = clamp(D2.x + (D2.r - D2.l) * 200, 90, G.W - 90);
      const step = clamp(D2.tx - D2.x, -sp * dt, sp * dt); D2.x += step; if (Math.abs(step) > 0.4) D2.face = step > 0 ? 'right' : 'left';
      ffWalkPose(G, D2.dog, Math.abs(step) > 0.4, D2.face); ffFeet(D2.dog, D2.x, D2.floor);
      // spawn: faster as the round goes on; a fall takes 2.4 s at the start and 1.5 s at the end, on any screen
      D2.next -= dt; const f = clamp(G.t / G.dur, 0, 1);
      if (D2.next <= 0) { D2.next = 0.95 - 0.45 * f + Math.random() * 0.25; const pine = Math.random() < 0.25, s = pine ? 'pine' : PICK(FF_SHAPES);
        const it = { s, x: RAND(90, G.W - 90), y: 200, v: (D2.floor - 200) / (2.4 - 0.9 * f), r: RAND(-30, 30), vr: RAND(-90, 90), vx: 0, out: false };
        it.sp = ffSpr(G, pine ? ffArt('pinecone') : ffArt('biscuit', { s }), 70, 70); D2.items.push(it); }
      const dw = D2.dog.w, mouth = D2.x + ffSide(D2.dog) * dw * 0.16, top = D2.floor - D2.dog.h * 0.95, bot = D2.floor - D2.dog.h * 0.3;
      D2.items.forEach((it) => {
        it.y += it.v * dt; it.x += it.vx * dt; it.r += it.vr * dt;
        if (!it.out && it.y > top && it.y < bot && Math.abs(it.x - mouth) < dw * 0.38) {
          if (it.s === 'pine') { it.out = true; it.v = -(D2.floor - 200) * 0.9; it.vx = (it.x < D2.x ? -1 : 1) * 380; it.vr = 540; it.g = 1; ffPop(G, tt('ff.boing', 'boing!'), it.x, it.y - 40, '#A97E5A'); try { SFX.boop(380); } catch (e) { /* none */ } }
          else { it.done = true; G.score++; ffScore(G); ffPop(G, '+1', it.x, it.y - 30, '#E46F6B'); try { SFX.boop(900 + (G.score % 5) * 60); } catch (e) { /* none */ } }
        }
        if (it.g) it.v += (D2.floor - 200) * 2.2 * dt;
        if (it.y > D2.floor + 40 || it.x < -80 || it.x > G.W + 80) it.done = true;
        if (it.done) ffKill(G, it.sp); else ffPut(it.sp, it.x, it.y, it.r);
      });
      D2.items = D2.items.filter((it) => !it.done);
    },
    down(G, x) { G.data.tx = clamp(x, 90, G.W - 90); }, move(G, x) { G.data.tx = clamp(x, 90, G.W - 90); },
    key(G, e, dn) { const k = e.key; if (k === 'ArrowLeft' || k === 'a') { G.data.l = dn ? 1 : 0; return true; } if (k === 'ArrowRight' || k === 'd') { G.data.r = dn ? 1 : 0; return true; } return false; },
    coins: (G) => Math.floor(G.score / 3),
    result: (G) => tt('ff.r_catch', '{name} caught {n, plural, one {# treat} other {# treats}} for the treat jar.', { name: G.d.name, n: G.score })
  },

  /* ---------- 2. Bubble Pop (Splash Pool, Bond 3) ---------- */
  bubble: {
    dur: 60,
    hint: () => (isPhone() ? tt('ff.h_bubble_p', 'Tap where your dog should jump. Golden bubbles are worth 3.') : tt('ff.h_bubble', 'Click where your dog should jump, or use the arrow keys and Space. Golden bubbles are worth 3.')),
    scoreText: (G) => tt('ff.sc_bubble', 'Bubbles: {n}', { n: G.score }),
    init(G) {
      const D2 = G.data; D2.dog = ffDog(G, G.d, 1); D2.floor = G.H - 24; D2.x = G.W / 2; D2.y = D2.floor; D2.face = 'right'; D2.bub = []; D2.next = 0.3; D2.jump = null; D2.l = 0; D2.r = 0; D2.rest = 'happy';
      ffFeet(D2.dog, D2.x, D2.floor);
    },
    tick(G, dt) {
      const D2 = G.data; G.dt = dt;
      D2.next -= dt; if (D2.next <= 0) { D2.next = 0.55 + Math.random() * 0.35; const gold = Math.random() < 0.15, r = gold ? 44 : RAND(34, 48);
        const b = { x: RAND(80, G.W - 80), y: G.H + 60, r, gold, v: (G.H + 120) / RAND(5.2, 6.8), ph: Math.random() * 6, a: RAND(18, 40) }; b.x0 = b.x;
        b.sp = ffSpr(G, ffArt('bubble', { gold }), r * 2, r * 2, gold ? 'ff-gold' : ''); D2.bub.push(b); }
      // the jump: an arc from where the dog stands to the tapped spot, 0.8 s
      const J = D2.jump;
      if (J) { J.t += dt; const u = Math.min(1, J.t / J.d); D2.x = J.x0 + (J.x1 - J.x0) * u; D2.y = D2.floor - Math.sin(u * Math.PI) * J.h; if (u >= 1) { D2.jump = null; D2.y = D2.floor; } ffPose(D2.dog, u < 1 ? 'jump' : 'happy', D2.face); }
      else if (D2.l || D2.r) { D2.x = clamp(D2.x + (D2.r - D2.l) * 700 * dt, 90, G.W - 90); D2.face = D2.r ? 'right' : 'left'; ffWalkPose(G, D2.dog, true, D2.face); }
      else ffWalkPose(G, D2.dog, false, D2.face);
      ffFeet(D2.dog, D2.x, D2.y);
      const hx = D2.x + ffSide(D2.dog) * D2.dog.w * 0.2, hy = D2.y - D2.dog.h * 0.72, reach = D2.dog.w * 0.3;
      D2.bub.forEach((b) => {
        b.y -= b.v * dt; b.ph += dt * 1.6; b.x = b.x0 + Math.sin(b.ph) * b.a;
        if (D2.jump && Math.hypot(b.x - hx, b.y - hy) < b.r + reach) { b.done = true; const n = b.gold ? 3 : 1; G.score += n; ffScore(G); ffPop(G, '+' + n, b.x, b.y, b.gold ? '#E9A93B' : '#5E86C0'); try { SFX.boop(b.gold ? 1200 : 980); } catch (e) { /* none */ } }
        if (b.y < -b.r * 2) b.done = true;
        if (b.done) ffKill(G, b.sp); else ffPut(b.sp, b.x, b.y);
      });
      D2.bub = D2.bub.filter((b) => !b.done);
    },
    down(G, x) { const D2 = G.data; if (D2.jump) return; const x1 = clamp(x, 90, G.W - 90), dx = clamp(x1 - D2.x, -460, 460); D2.face = dx >= 0 ? 'right' : 'left'; D2.jump = { t: 0, d: 0.8, x0: D2.x, x1: D2.x + dx, h: Math.min(G.H * 0.5, 520) }; try { SFX.boop(700); } catch (e) { /* none */ } },
    key(G, e, dn) { const k = e.key, D2 = G.data; if (k === 'ArrowLeft') { D2.l = dn ? 1 : 0; return true; } if (k === 'ArrowRight') { D2.r = dn ? 1 : 0; return true; } if ((k === ' ' || k === 'ArrowUp') && dn) { if (!D2.jump) D2.jump = { t: 0, d: 0.8, x0: D2.x, x1: D2.x, h: Math.min(G.H * 0.5, 520) }; return true; } return false; },
    coins: (G) => Math.floor(G.score / 4),
    result: (G) => tt('ff.r_bubble', '{name} popped bubbles worth {n} points. Very splashy.', { name: G.d.name, n: G.score })
  },

  /* ---------- 3. Sniff & Seek (Home Yard, Bond 2): rounds, no clock ---------- */
  seek: {
    dur: 0,
    hint: () => tt('ff.h_seek', 'Watch the box with the toy. Then follow your dog\'s nose and tap a box.'),
    scoreText: (G) => tt('ff.sc_seek', 'Found: {n} of {r}', { n: G.data.found || 0, r: G.data.round || 1 }),
    prog: (G) => (G.data.round - 1 + (G.data.ph === 'next' ? 1 : 0)) / G.data.N.length,
    init(G) {
      const D2 = G.data; D2.N = [3, 3, 4, 4, 5, 5]; D2.round = 0; D2.found = 0; D2.pts = 0; D2.by = Math.round(G.H * 0.42); D2.feet = Math.min(G.H - 20, D2.by + 300);
      D2.dog = ffDog(G, G.d, 0.9); D2.x = 120; D2.face = 'right'; ffFeet(D2.dog, D2.x, D2.feet); D2.boxes = []; D2.toy = ffSpr(G, art('item', FF_TOY()), 90, 90, 'ff-toy');
      D2.scent = ffSpr(G, '<svg viewBox="0 0 60 90" aria-hidden="true"><path d="M20 86c-12-14 12-22 0-38s12-24 2-44M40 86c-12-14 12-22 0-38s12-24 2-44" fill="none" stroke="#A8968A" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 9"/></svg>', 60, 90, 'ff-scent');
      ffPut(D2.scent, -200, -200); this.next(G);
    },
    next(G) {
      const D2 = G.data; D2.boxes.forEach((b) => ffKill(G, b.sp)); D2.round++; const n = D2.N[D2.round - 1];
      D2.boxes = []; for (let i = 0; i < n; i++) { const b = { i, slot: i, sp: ffSpr(G, ffArt('box', { c: i }), Math.min(160, G.W / (n + 0.5)), Math.min(150, G.W / (n + 0.5) * 0.94), 'ff-box') }; b.sp.el.dataset.box = i; D2.boxes.push(b); }
      D2.toyBox = Math.floor(Math.random() * n); D2.ph = 'show'; D2.pt = 0; D2.tries = 0; D2.swaps = 2 + D2.round; D2.sw = null; D2.lift = 1; D2.pick = -1;
      ffScore(G); ffHint(G, tt('ff.h_seek_watch', 'The toy goes under a box. Keep your eye on it.'));
    },
    slotX(G, s) { const n = G.data.boxes.length; return G.W * (s + 1) / (n + 1); },
    tick(G, dt) {
      const D2 = G.data, T = this; G.dt = dt; D2.pt += dt;
      const put = (b, y) => ffPut(b.sp, b.x == null ? T.slotX(G, b.slot) : b.x, y == null ? D2.by : y);
      if (D2.ph === 'show' || D2.ph === 'cover') { // the box lifts, the toy sits under it, the box comes down
        const up = D2.ph === 'show' ? Math.min(1, D2.pt / 0.4) : Math.max(0, 1 - D2.pt / 0.45), tb = D2.boxes[D2.toyBox];
        D2.boxes.forEach((b) => { b.x = null; put(b, b === tb ? D2.by - up * 150 : D2.by); }); ffPut(D2.toy, T.slotX(G, tb.slot), D2.by + 40);
        if (D2.ph === 'show' && D2.pt > 1.4) { D2.ph = 'cover'; D2.pt = 0; } else if (D2.ph === 'cover' && D2.pt > 0.5) { ffPut(D2.toy, -300, -300); D2.ph = 'shuffle'; D2.pt = 0; D2.left = D2.swaps; }
      } else if (D2.ph === 'shuffle') { // two boxes swap along arcs (one over, one under), faster each round
        const dur = Math.max(0.36, 0.6 - D2.round * 0.04);
        if (!D2.sw) { const n = D2.boxes.length, a = Math.floor(Math.random() * n); let b = Math.floor(Math.random() * (n - 1)); if (b >= a) b++; D2.sw = { a: D2.boxes.find((x) => x.slot === a), b: D2.boxes.find((x) => x.slot === b), t: 0 }; }
        const S2 = D2.sw; S2.t += dt; const u = Math.min(1, S2.t / dur), e = u * u * (3 - 2 * u), xa = T.slotX(G, S2.a.slot), xb = T.slotX(G, S2.b.slot);
        S2.a.x = xa + (xb - xa) * e; S2.b.x = xb + (xa - xb) * e; put(S2.a, D2.by - Math.sin(u * Math.PI) * 70); put(S2.b, D2.by + Math.sin(u * Math.PI) * 30);
        if (u >= 1) { const s = S2.a.slot; S2.a.slot = S2.b.slot; S2.b.slot = s; S2.a.x = S2.b.x = null; put(S2.a); put(S2.b); D2.sw = null; if (--D2.left <= 0) { D2.ph = 'sniff'; D2.pt = 0; D2.sx = 0; ffHint(G, tt('ff.h_seek_nose', 'Now watch {name}\'s nose.', { name: G.d.name })); } }
      } else if (D2.ph === 'sniff') { // the dog walks along the row and lingers, nose down, at the toy's box
        const tb = D2.boxes[D2.toyBox], order = D2.boxes.slice().sort((a, b) => a.slot - b.slot);
        if (D2.sx >= order.length) { D2.ph = 'pick'; ffHint(G, isPhone() ? tt('ff.h_seek_tap', 'Tap the box.') : tt('ff.h_seek_click', 'Click the box, or press its number.')); return; }
        const b = order[D2.sx], tx = T.slotX(G, b.slot) - 70 * ffSide(D2.dog), dx = tx - D2.x;
        if (Math.abs(dx) > 6) { D2.x += clamp(dx, -420 * dt, 420 * dt); D2.face = dx > 0 ? 'right' : 'left'; ffPose(D2.dog, 'walk', D2.face); D2.pt = 0; }
        else { ffPose(D2.dog, 'sniff', 'right'); const linger = b === tb ? 1.5 : 0.45; if (b === tb) ffPut(D2.scent, T.slotX(G, b.slot), D2.by - 120); if (D2.pt > linger) { if (b === tb) { ffPop(G, tt('ff.sniff', 'sniff sniff!'), T.slotX(G, b.slot), D2.by - 170, '#7A6358'); ffPut(D2.scent, -300, -300); } D2.sx++; D2.pt = 0; } }
        ffFeet(D2.dog, D2.x, D2.feet);
      } else if (D2.ph === 'reveal') {
        const b = D2.boxes[D2.pick], up = Math.min(1, D2.pt / 0.35); put(b, D2.by - up * 150);
        if (D2.pt > 1.1) { if (D2.pick === D2.toyBox || D2.tries >= 2) { D2.ph = 'next'; D2.pt = 0; } else { put(b); D2.ph = 'pick'; } }
      } else if (D2.ph === 'next' && D2.pt > 0.9) { ffPut(D2.toy, -300, -300); if (D2.round >= D2.N.length) { G.score = D2.pts; ffEnd(G); } else this.next(G); }
    },
    tap(G, i) {
      const D2 = G.data; if (D2.ph !== 'pick' || i < 0 || i >= D2.boxes.length) return;
      D2.pick = i; D2.ph = 'reveal'; D2.pt = 0; D2.tries++;
      const tb = D2.boxes[D2.toyBox], X = this.slotX(G, tb.slot);
      if (i === D2.toyBox) { const p = D2.tries === 1 ? 2 : 1; D2.pts += p; D2.found++; ffPut(D2.toy, X, D2.by + 40); ffPop(G, tt('ff.found', 'Found it!'), X, D2.by - 200, '#3F8F5E'); ffPose(D2.dog, 'happy', D2.face); try { SFX.boop(1000); } catch (e) { /* none */ } }
      else if (D2.tries >= 2) { D2.pick = D2.toyBox; ffPut(D2.toy, X, D2.by + 40); ffPop(G, tt('ff.seek_here', 'It was here! Next time.'), X, D2.by - 200, '#7A6358'); }
      else ffPop(G, tt('ff.seek_more', 'Empty. Keep sniffing!'), this.slotX(G, D2.boxes[i].slot), D2.by - 200, '#7A6358');
      ffScore(G);
    },
    down(G, x, y) { const D2 = G.data; if (D2.ph !== 'pick') return; const hw = Math.max(50, D2.boxes[0].sp.w / 2 + 6), b = D2.boxes.find((q) => Math.abs(this.slotX(G, q.slot) - x) < hw && Math.abs(D2.by - y) < 110); if (b) this.tap(G, b.i); },
    key(G, e, dn) { if (!dn) return false; const n = +e.key; if (n >= 1 && n <= 5) { const b = G.data.boxes.find((q) => q.slot === n - 1); if (b) this.tap(G, b.i); return true; } return false; },
    coins: (G) => G.data.pts,
    result: (G) => tt('ff.r_seek', '{name} found the toy {n} times out of {r}.', { name: G.d.name, n: G.data.found, r: G.data.N.length })
  },

  /* ---------- 4. Dog Show Pose (Town Square, Bond 4): a memory game with the dog's own tricks ---------- */
  show: {
    dur: 0,
    hint: () => tt('ff.h_show', 'Remember the pose card. Then tap the tricks in the same order.'),
    scoreText: (G) => tt('ff.sc_show', 'Round {r} of {n}', { r: G.data.round, n: G.data.L.length }),
    prog: (G) => (G.data.round - 1 + (G.data.ph === 'good' ? 1 : 0)) / G.data.L.length,
    init(G) {
      const D2 = G.data; D2.tricks = ffShowTricks(G.d); D2.L = [2, 3, 3, 4, 5]; D2.round = 0; D2.pts = 0;
      const wide = G.W / G.H > 1.3; // desktop: the card on the left, the dog beside it; phones: one above the other
      D2.card = ffSpr(G, `<div class="ff-jc">${ffArt('judgecard')}<div class="ff-jseq"></div><div class="ff-jback" aria-hidden="true">?</div></div>`, wide ? 600 : Math.min(640, G.W - 16), wide ? 280 : 330, 'ff-jcard'); ffPut(D2.card, wide ? G.W * 0.38 : G.W / 2, wide ? 160 : Math.max(190, G.H * 0.24));
      D2.dx = wide ? G.W * 0.84 : G.W / 2; D2.dog = ffDog(G, G.d, wide ? 0.95 : 1.1); D2.feet = wide ? G.H - 150 : G.H - 230; ffFeet(D2.dog, D2.dx, D2.feet); D2.rest = 'idle';
      const bw = Math.min(160, (G.W - 40) / D2.tricks.length - 10);
      D2.btns = document.createElement('div'); D2.btns.className = 'ff-tricks'; D2.btns.style.top = (G.H - (wide ? 128 : 190)) + 'px';
      D2.btns.innerHTML = D2.tricks.map((n, i) => `<button class="btn ff-trick" data-i="${i}" style="width:${bw.toFixed(0)}px"><span class="ff-tn">${i + 1}</span>${esc(ffTrickName(n))}</button>`).join('');
      G.field.appendChild(D2.btns); D2.btns.querySelectorAll('button').forEach((b) => { b.addEventListener('pointerdown', (e) => e.stopPropagation()); b.onclick = () => this.pick(G, +b.dataset.i); });
      this.next(G);
    },
    next(G) {
      const D2 = G.data; D2.round++; const n = D2.L[D2.round - 1], T = D2.tricks;
      D2.seq = []; for (let i = 0; i < n; i++) { let t; do { t = Math.floor(Math.random() * T.length); } while (i && t === D2.seq[i - 1] && T.length > 1); D2.seq.push(t); }
      D2.at = 0; D2.peeks = 0; D2.ph = 'look'; D2.pt = 0; D2.look = 1.4 + 0.75 * n;
      const thumb = (t) => dogSVG(G.d, { pose: poseReal(G.d.key, FF_POSE[T[t]] || 'idle') ? FF_POSE[T[t]] || 'idle' : 'idle', outfit: outfitOf(G.d), facing: 'right' });
      D2.card.el.querySelector('.ff-jseq').innerHTML = D2.seq.map((t, i) => `<span class="ff-js"><b>${i + 1}</b><span class="ff-jd">${thumb(t)}</span><i>${esc(ffTrickName(T[t]))}</i></span>`).join('');
      this.face(G, true); ffScore(G); ffHint(G, tt('ff.h_show_look', 'Mrs. Plum holds up the pose card. Remember it.'));
      ffPose(D2.dog, 'idle', 'right'); D2.btns.classList.add('wait');
    },
    face(G, up) { G.data.card.el.classList.toggle('down', !up); },
    tick(G, dt) {
      const D2 = G.data; D2.pt += dt;
      if (D2.ph === 'look' && D2.pt > D2.look) { D2.ph = 'do'; D2.pt = 0; this.face(G, false); D2.btns.classList.remove('wait'); ffHint(G, tt('ff.h_show_do', 'Your turn: tap the tricks in order.')); }
      else if (D2.ph === 'peek' && D2.pt > 1.6) { D2.ph = 'do'; D2.pt = 0; this.face(G, false); D2.btns.classList.remove('wait'); }
      else if (D2.ph === 'good' && D2.pt > 1.3) { if (D2.round >= D2.L.length) { G.score = D2.pts; ffEnd(G); } else this.next(G); }
      if (D2.hop) { D2.hop.t += dt; const u = Math.min(1, D2.hop.t / 0.35); ffFeet(D2.dog, D2.dx, D2.feet - Math.sin(u * Math.PI) * 30); if (u >= 1) D2.hop = null; }
    },
    pick(G, i) {
      const D2 = G.data; if (G.over || D2.ph !== 'do') return;
      const want = D2.seq[D2.at], n = D2.tricks[i];
      ffPose(D2.dog, FF_POSE[n] || 'idle', 'right'); D2.dog.el.classList.toggle('ff-spin', n === 'Spin'); D2.hop = { t: 0 };
      if (i === want) {
        D2.at++; try { SFX.boop(800 + D2.at * 80); } catch (e) { /* none */ }
        if (D2.at >= D2.seq.length) { const p = D2.peeks ? 1 : 2; D2.pts += p; D2.ph = 'good'; D2.pt = 0; this.face(G, true); D2.btns.classList.add('wait');
          ffPop(G, D2.peeks ? tt('ff.show_ok', 'Lovely!') : tt('ff.show_perfect', 'Perfect!'), D2.dx, D2.feet - D2.dog.h - 30, '#E46F6B'); ffPose(D2.dog, 'happy', 'right'); }
      } else { // a kind peek: the card turns up again and the round goes on from where it was
        D2.peeks++; D2.ph = 'peek'; D2.pt = 0; this.face(G, true); D2.btns.classList.add('wait'); try { SFX.boop(420); } catch (e) { /* none */ }
        ffHint(G, tt('ff.h_show_peek', 'Mrs. Plum smiles and shows the card again.'), 1600);
      }
    },
    key(G, e, dn) { if (!dn) return false; const n = +e.key; if (n >= 1 && n <= G.data.tricks.length) { this.pick(G, n - 1); return true; } return false; },
    coins: (G) => G.data.pts,
    done(G) { const p = G.data.pts, R = S.ff.rib, k = p >= 9 ? 'g' : p >= 6 ? 'r' : 'b'; R[k] = (R[k] || 0) + 1; G.data.rib = k; },
    extra(G) { const k = G.data.rib; return tt('ff.r_ribbon', 'Mrs. Plum pins {ribbon} on {name}.', { name: G.d.name, ribbon: k === 'g' ? tt('ff.rib_g', 'a gold rosette') : k === 'r' ? tt('ff.rib_r', 'a red ribbon') : tt('ff.rib_b', 'a blue ribbon') }); },
    result: (G) => tt('ff.r_show', '{name} posed {n} of {r} cards. The crowd clapped.', { name: G.d.name, n: G.data.round - (G.data.ph === 'good' ? 0 : 1), r: G.data.L.length })
  },

  /* ---------- 5. Kite Day (Mt. Fuji Lookout, Bond 5) ---------- */
  kite: {
    dur: 60,
    hint: () => (isPhone() ? tt('ff.h_kite_p', 'Hold your finger down to lift the kite, let go to let it drift down.') : tt('ff.h_kite', 'Hold the mouse button or Space to lift the kite, let go to let it drift down.')),
    scoreText: (G) => tt('ff.sc_kite', 'Clouds and leaves: {n}', { n: G.score }),
    init(G) {
      const D2 = G.data; D2.floor = G.H - 24; D2.kx = G.W * 0.42; D2.ky = G.H * 0.45; D2.vy = 0; D2.items = []; D2.next = 0.5; D2.season = seasonNow(); D2.c = Math.floor(Math.random() * 5);
      D2.str = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); D2.str.setAttribute('class', 'ff-str'); D2.str.setAttribute('viewBox', `0 0 ${G.W} ${G.H}`); D2.str.innerHTML = '<path d="" fill="none" stroke="#5B3D32" stroke-width="2.5" stroke-linecap="round"/>'; G.field.appendChild(D2.str); D2.path = D2.str.firstChild;
      D2.kite = ffSpr(G, ffArt('kite', { c: D2.c }), 120, 170, 'ff-kite'); D2.dog = ffDog(G, G.d, 1); D2.dog.el.classList.add('ff-run'); ffPose(D2.dog, 'walk', 'right'); ffFeet(D2.dog, D2.kx - 70, D2.floor);
    },
    tick(G, dt) {
      const D2 = G.data, k = G.H / 600, top = 110, low = D2.floor - D2.dog.h - 90;
      D2.vy += (G.hold || D2.sp ? -900 : 520) * k * dt; D2.vy = clamp(D2.vy, -420 * k, 300 * k); D2.ky += D2.vy * dt; if (D2.ky < top) { D2.ky = top; D2.vy = 0; } if (D2.ky > low) { D2.ky = low; D2.vy = 0; }
      ffPut(D2.kite, D2.kx, D2.ky, clamp(D2.vy / (8 * k), -18, 18));
      const hx = D2.kx - 70 + D2.dog.w * 0.15, hy = D2.floor - D2.dog.h * 0.62; D2.path.setAttribute('d', `M${hx.toFixed(0)} ${hy.toFixed(0)} Q${((hx + D2.kx) / 2 + 30).toFixed(0)} ${((hy + D2.ky) / 2 + 60).toFixed(0)} ${D2.kx.toFixed(0)} ${(D2.ky + 40).toFixed(0)}`);
      D2.next -= dt; if (D2.next <= 0) { D2.next = 0.55 + Math.random() * 0.45; const leaf = Math.random() < 0.4, y = RAND(top, low + 40);
        const it = { leaf, x: G.W + 70, y, v: G.W / RAND(3.6, 5), ph: Math.random() * 6, r: 0 }; it.sp = leaf ? ffSpr(G, ffArt('leaf', { season: D2.season }), 54, 54) : ffSpr(G, ffArt('cloud'), 120, 70); D2.items.push(it); }
      D2.items.forEach((it) => {
        it.x -= it.v * dt; it.ph += dt * 2; if (it.leaf) it.r += 60 * dt; const y = it.y + Math.sin(it.ph) * (it.leaf ? 18 : 8);
        if (Math.hypot(it.x - D2.kx, y - D2.ky) < (it.leaf ? 70 : 85)) { it.done = true; const n = it.leaf ? 2 : 1; G.score += n; ffScore(G); ffPop(G, '+' + n, it.x, y - 30, it.leaf ? '#E9883B' : '#5E86C0'); try { SFX.boop(it.leaf ? 1100 : 900); } catch (e) { /* none */ } }
        if (it.x < -90) it.done = true; if (it.done) ffKill(G, it.sp); else ffPut(it.sp, it.x, y, it.r);
      });
      D2.items = D2.items.filter((it) => !it.done);
    },
    key(G, e, dn) { if (e.key === ' ' || e.key === 'ArrowUp') { G.data.sp = dn; return true; } return false; },
    coins: (G) => Math.floor(G.score / 5),
    result: (G) => tt('ff.r_kite', 'The kite gathered {n} points of clouds and leaves while {name} ran and ran.', { name: G.d.name, n: G.score })
  },

  /* ---------- 6a. The newspaper round (Grandpa Joe, Town Square): five doors on a short fixed route ---------- */
  paper: {
    dur: 0,
    hint: () => (isPhone() ? tt('ff.h_paper_p', 'Tap when your dog is by a door to drop off the paper.') : tt('ff.h_paper', 'Click or press Space when your dog is by a door to drop off the paper.')),
    scoreText: (G) => tt('ff.sc_paper', 'Papers: {n} of 5', { n: G.score }),
    prog: (G) => clamp(G.data.cam / G.data.len, 0, 1),
    init(G) {
      const D2 = G.data; D2.floor = G.H - 30; D2.dx = G.W * 0.3; D2.cam = 0; D2.v = 96; D2.gap = 560; D2.doors = [];
      for (let i = 0; i < 5; i++) { const sp = ffSpr(G, ffArt('door', { c: i }) + `<span class="ff-dn">${i + 1}</span>`, 200, 280, 'ff-door'); D2.doors.push({ i, wx: G.W * 0.9 + i * D2.gap, sp, st: '' }); }
      D2.len = D2.doors[4].wx + 360 - D2.dx; D2.dog = ffDog(G, G.d, 0.95); D2.paper = ffSpr(G, ffArt('paper'), 64, 64, 'ff-paperfly'); ffPut(D2.paper, -300, -300); D2.fly = null;
    },
    near(G) { const D2 = G.data; return D2.doors.find((d) => !d.st && Math.abs(d.wx - D2.cam - D2.dx) < 170); },
    tick(G, dt) {
      const D2 = G.data; D2.cam += D2.v * dt;
      D2.doors.forEach((d) => {
        const x = d.wx - D2.cam; ffPut(d.sp, x, D2.floor - 140 - 40); d.sp.el.classList.toggle('near', !d.st && Math.abs(x - D2.dx) < 170);
        if (!d.st && x < D2.dx - 170) { d.st = 'joe'; ffPop(G, tt('ff.paper_joe', 'Grandpa Joe pops that one in.'), x, D2.floor - 330, '#7A6358'); }
      });
      ffPose(D2.dog, 'walk', 'right'); ffFeet(D2.dog, D2.dx, D2.floor);
      if (D2.fly) { const F = D2.fly; F.t += dt; const u = Math.min(1, F.t / 0.5), tx = F.d.wx - D2.cam, ty = D2.floor - 190; ffPut(D2.paper, F.x0 + (tx - F.x0) * u, F.y0 + (ty - F.y0) * u - Math.sin(u * Math.PI) * 120, u * 360); if (u >= 1) { D2.fly = null; ffPut(D2.paper, -300, -300); } }
      if (D2.cam >= D2.len) ffEnd(G);
    },
    drop(G) {
      const D2 = G.data, d = this.near(G); if (!d) { ffPop(G, tt('ff.paper_wait', 'No door here yet.'), D2.dx, D2.floor - 260, '#A8968A'); return; }
      d.st = 'ok'; G.score++; ffScore(G); D2.fly = { d, t: 0, x0: D2.dx, y0: D2.floor - 120 }; d.sp.el.classList.add('done'); ffPop(G, tt('ff.paper_thanks', 'Thank you!'), d.wx - D2.cam, D2.floor - 330, '#3F8F5E'); try { SFX.boop(900); } catch (e) { /* none */ }
    },
    down(G) { this.drop(G); },
    key(G, e, dn) { if (dn && (e.key === ' ' || e.key === 'Enter')) { this.drop(G); return true; } return false; },
    coins: (G) => G.score * 3,
    result: (G) => tt('ff.r_paper', '{name} delivered {n} of 5 papers. Grandpa Joe tips his cap.', { name: G.d.name, n: G.score })
  },

  /* ---------- 6b. Bakery helper (Baker Bea, the Café): sort the biscuits before the crayon line runs out ---------- */
  bakery: {
    dur: 60,
    hint: () => (isPhone() ? tt('ff.h_bakery_p', 'Tap the tin with the same shape as the biscuit.') : tt('ff.h_bakery', 'Click the tin with the same shape as the biscuit, or press 1 to 4.')),
    scoreText: (G) => tt('ff.sc_bakery', 'Sorted: {n}', { n: G.score }),
    init(G) {
      const D2 = G.data; D2.tins = FF_SHAPES.map((s, i) => { const sp = ffSpr(G, ffArt('tin', { s }) + `<span class="ff-tnum">${i + 1}</span>`, Math.min(190, G.W / 4.6), Math.min(152, G.W / 4.6 * 0.8), 'ff-tin'); const t = { s, i, x: G.W * (i + 1) / 5, y: G.H - 112, sp }; ffPut(sp, t.x, t.y); sp.el.dataset.tin = i; return t; });
      D2.dog = ffDog(G, G.d, 0.8); ffPose(D2.dog, 'sit', 'right'); ffFeet(D2.dog, 120, G.H - 200); D2.by = Math.max(170, G.H * 0.36); D2.wait = 0; D2.fly = null; this.next(G);
    },
    next(G) { const D2 = G.data; let s; do { s = PICK(FF_SHAPES); } while (s === D2.s && Math.random() < 0.6); D2.s = s; if (D2.bis) ffKill(G, D2.bis); D2.bis = ffSpr(G, ffArt('biscuit', { s }), 130, 130, 'ff-bis'); ffPut(D2.bis, G.W / 2, D2.by); },
    tick(G, dt) {
      const D2 = G.data; if (D2.pz > 0 && (D2.pz -= dt) <= 0) ffPose(D2.dog, 'sit', 'right');
      if (D2.wait > 0) { D2.wait -= dt; ffPut(D2.bis, G.W / 2 + Math.sin(G.t * 40) * 10 * Math.min(1, D2.wait * 3), D2.by); }
      if (D2.fly) { const F = D2.fly; F.t += dt; const u = Math.min(1, F.t / 0.22); ffPut(F.sp, G.W / 2 + (F.x - G.W / 2) * u, D2.by + (F.y - D2.by) * u, 0, 1 - u * 0.5); if (u >= 1) { ffKill(G, F.sp); D2.fly = null; } }
    },
    pick(G, i) {
      const D2 = G.data, t = D2.tins[i]; if (!t || G.over || D2.wait > 0 || D2.fly) return;
      if (t.s === D2.s) { G.score++; ffScore(G); D2.fly = { sp: D2.bis, t: 0, x: t.x, y: t.y - 20 }; D2.bis = null; this.next(G); ffPose(D2.dog, 'happy', 'right'); D2.pz = 0.5; try { SFX.boop(860 + (G.score % 4) * 70); } catch (e) { /* none */ } }
      else { D2.wait = 0.6; ffPop(G, tt('ff.bea_shape', 'Bea: "That one is a {shape}!"', { shape: ffShapeName(D2.s) }), G.W / 2, D2.by - 110, '#C24F2E'); try { SFX.boop(400); } catch (e) { /* none */ } }
    },
    down(G, x, y) { const t = G.data.tins.find((q) => Math.abs(q.x - x) < q.sp.w / 2 + 6 && Math.abs(q.y - y) < 95); if (t) this.pick(G, t.i); },
    key(G, e, dn) { if (!dn) return false; const n = +e.key; if (n >= 1 && n <= 4) { this.pick(G, n - 1); return true; } return false; },
    coins: (G) => Math.floor(G.score / 2),
    result: (G) => tt('ff.r_bakery', '{n, plural, one {# biscuit} other {# biscuits}} sorted. Baker Bea says {name} is a fine supervisor.', { name: G.d.name, n: G.score })
  },

  /* ---------- 6c. The neighbour dog wash (the Tanakas' dog, Home Yard): scrub, rinse, towel with the bath tools ---------- */
  wash: {
    dur: 75,
    hint: () => (isPhone() ? tt('ff.h_wash_p', 'Rub the dog with a finger to scrub. Hold to rinse. Rub again to towel dry.') : tt('ff.h_wash', 'Rub with the mouse (or tap Space) to scrub. Hold the button to rinse. Rub again to towel dry.')),
    scoreText: (G) => { const D2 = G.data; return [tt('ff.w_scrub', 'Scrub'), tt('ff.w_rinse', 'Rinse'), tt('ff.w_towel', 'Towel')][Math.min(2, D2.step)] + ' ' + Math.round(D2.p[Math.min(2, D2.step)]) + '%'; },
    init(G) {
      const D2 = G.data; D2.vis = ffWashDog(); D2.step = 0; D2.p = [0, 0, 0]; D2.cx = G.W * 0.56; D2.base = G.H - 40; D2.suds = [];
      const tk = Math.min(1, G.W * 0.62 / 360); D2.tk = tk; if (G.W < 800) D2.cx = G.W * 0.44;
      D2.me = ffDog(G, G.d, 0.75); ffPose(D2.me, 'sit', 'right'); ffFeet(D2.me, Math.min(140, G.W * 0.16), G.H - 30);
      D2.dog = ffDog(G, D2.vis, tk); ffFeet(D2.dog, D2.cx, D2.base - 235 * tk);
      D2.tub = ffSpr(G, art('prop', 'tub'), 360 * tk, 360 * tk, 'ff-tub'); ffPut(D2.tub, D2.cx + 6 * tk, D2.base - 140 * tk);
      D2.tools = ['sponge', 'jug', 'towel'].map((n, i) => { const sp = ffSpr(G, ffArt(n), 96, 96, 'ff-tool'); ffPut(sp, G.W - 90, G.H * 0.3 + i * 120); return sp; });
      this.tool(G);
    },
    tool(G) { const D2 = G.data; D2.tools.forEach((t, i) => t.el.classList.toggle('on', i === D2.step)); ffHint(G, [tt('ff.h_w1', 'Step 1: scrub {dog} all over.', { dog: G.data.vis.name }), tt('ff.h_w2', 'Step 2: hold to rinse the suds away.'), tt('ff.h_w3', 'Step 3: towel {dog} dry.', { dog: G.data.vis.name })][D2.step], 3000); },
    bump(G, amt, x, y) {
      const D2 = G.data; if (D2.step > 2 || G.over) return; D2.p[D2.step] = Math.min(100, D2.p[D2.step] + amt); ffScore(G);
      if (D2.step === 0 && Math.random() < 0.45 && D2.suds.length < 14) { const s = ffSpr(G, art('prop', 'bubbles'), 70, 70, 'ff-suds'); ffPut(s, (x || D2.cx) + RAND(-30, 30), (y || D2.base - 190) + RAND(-25, 25)); D2.suds.push(s); try { SFX.scrub(); } catch (e) { /* none */ } }
      if (D2.step === 1 && D2.suds.length && Math.random() < amt / 12) ffKill(G, D2.suds.shift());
      if (D2.p[D2.step] >= 100) {
        if (D2.step === 1) { D2.suds.forEach((s) => ffKill(G, s)); D2.suds = []; }
        D2.step++; try { SFX.boop(900); } catch (e) { /* none */ }
        if (D2.step > 2) { ffPose(D2.dog, 'shake', 'right'); try { SFX.shake(); } catch (e) { /* none */ } ffPop(G, tt('ff.w_fluffy', 'So fluffy!'), D2.cx, D2.base - 330, '#E46F6B'); setTimeout(() => { if (FF.g === G && !G.over) ffEnd(G); }, 900); }
        else this.tool(G);
      }
    },
    over(G, x, y) { const D2 = G.data, k = D2.tk || 1; return Math.abs(x - D2.cx) < 190 * k && y > D2.base - 430 * k && y < D2.base - 50 * k; },
    tick(G, dt) {
      const D2 = G.data;
      if (D2.step === 1 && (G.hold || D2.sp)) { this.bump(G, 38 * dt); if (Math.random() < dt * 14) { const w = ffSpr(G, '<svg viewBox="0 0 20 30"><path d="M10 2 Q18 16 10 28 Q2 16 10 2Z" fill="#BFE5F5" stroke="#5B3D32" stroke-width="2"/></svg>', 20, 30, 'ff-drop'); ffPut(w, D2.cx + RAND(-120, 120), D2.base - 330); setTimeout(() => ffKill(G, w), 600); } }
    },
    down(G, x, y) { G.data.lx = x; G.data.ly = y; },
    move(G, x, y, e) { const D2 = G.data; if (D2.step === 1) return; if (e.pointerType !== 'mouse' && !G.hold) return; if (D2.lx == null) { D2.lx = x; D2.ly = y; return; } const d = Math.hypot(x - D2.lx, y - D2.ly); D2.lx = x; D2.ly = y; if (this.over(G, x, y)) this.bump(G, d / 26, x, y); },
    key(G, e, dn) { const D2 = G.data; if (e.key !== ' ' && e.key !== 'Enter') return false; if (D2.step === 1) D2.sp = dn; else if (dn) this.bump(G, 6, D2.cx + RAND(-90, 90), D2.base - 200 + RAND(-40, 40)); return true; },
    coins: (G) => (G.data.step > 2 ? 10 : Math.floor((G.data.p[0] + G.data.p[1] + G.data.p[2]) / 30)),
    done(G) { const W2 = S.ff.wash; W2.day = localISO(); W2.n = (W2.n || 0) + 1; ffWashLetter(G.data.vis); },
    extra: () => tt('ff.r_letter', 'A thank-you letter is on its way to your mailbox.'),
    title: (G) => tt('ff.r_wash_title', '{dog} is squeaky clean!', { dog: G.data.vis.name }),
    result: (G) => (G.data.step > 2 ? tt('ff.r_wash', '{name} watched the whole bath and approved. The Tanakas are delighted.', { name: G.d.name }) : tt('ff.r_wash_part', 'Nearly done! {dog} is mostly clean and very happy.', { dog: G.data.vis.name }))
  }
};
