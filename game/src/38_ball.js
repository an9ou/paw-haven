/* ======================= v2.10 FREE TO ROAM: ball play where you are (lane BALL, tag bl, V210.md sections 2 and 5.4) =======================
   The free tennis-ball play replaces the timed Fetch challenge. It runs in the current place's own scene (cur.mode stays 'yard'): the ball sits in #ballLayer,
   you drag and let go to throw it, and every eligible dog races for it. The fastest usually wins; now and then a cheeky dog steals it or runs a keep-away lap.
   Dogs move only through the roam API (37_roam.js, section 5.3): rmPause('ball') at the start, rmSet / rmPos / rmScale / rmDogs during play, rmResume('ball') at the end.
   Coins: +2 a return (Frisbee and Stick +3), at most BL_COIN_SES a session and BL_COIN_DAY a day (S.bl). Bond once a session per dog. trackAct('fetch', { name }) per return.
   Contract: V210.md sections 2 and 5.4. Test hook: window.__paw.bl. */
let BL = null; // the ball game in progress, or null
function blOn() { return !!BL; }

const BL_COIN_SES = 16, BL_COIN_DAY = 40; // real coins (no BOOST): a session and a day (V210.md 5.4)
// per toy: g gravity, bounce, fric (rolling friction), spin, vzK (throw height factor), coin (a return), hap (Fetch's full-session Happiness), en (Energy a return)
const BL_TOYS = {
  'Tennis Ball': { prop: ['prop', 'ball'], g: 1900, bounce: 0.55, fric: 2.4, spin: 0.35, vzK: 1, coin: 2, hap: 15, en: 1 },
  'Glow Ball': { prop: ['item', 'Glow Ball'], g: 1900, bounce: 0.5, fric: 2.4, spin: 0.35, vzK: 1, coin: 2, hap: 15, en: 1, glow: true },
  Frisbee: { prop: ['prop', 'frisbee'], g: 950, bounce: 0.12, fric: 4.5, spin: 0.9, vzK: 0.62, coin: 3, hap: 20, en: 1.5, float: true },
  'Driftwood Stick': { prop: ['item', 'Driftwood Stick'], g: 1900, bounce: 0.28, fric: 5, spin: 1.8, vzK: 1, coin: 3, hap: 15, en: 1 },
};
// where a dog's feet may stand per place (V210.md 5.2), the fallback until ROAM's rmZone(place) answers
const BL_FLOOR = { yard: [400, 590], house: [410, 590], market: [450, 585], river: [450, 590], beach: [450, 590], pier: [405, 590], square: [410, 592], cafe: [410, 592], vet: [410, 592], salon: [405, 592], hilltop: [405, 592], park: [405, 592], woods: [405, 592], dogpark: [405, 592] };
const BL_R = 26; // the ball's radius in world units
const BL_LINES = {
  catch: ['Got it!', 'Look what I found!', 'Here you go!', 'Again, again!', 'Best ball ever.'],
  trait: { ball: ['I always bring it back.', 'Ball! My favourite thing ever.'], burst: ['Zoom, zoom, done!'], lazy: ['Phew. That was a long way.', 'Got it. Slowly.'], beg: ['One ball. Delivered.'], cheeky: ['Told you I was fast.'], guard: ['Ball secured.'], herd: ['Everyone back in line. Ball first.'], chatty: ['A-woo! Got it!'], aloof: ['Fine. I will bring it. This once.'], polite: ['Your ball, with my compliments.'] },
  steal: ['Mine now!', 'Hehe. Finders keepers!'], robbed: ['Hey, that was mine!', 'Oh! My ball!'],
  lap: ['Catch me if you can!', 'Keep-away!'], lapEnd: ['Okay, okay. Here you go.', 'That was fun. Your turn!'],
  boing: ['Boing! Again!', 'My head is a trampoline now.', 'I meant to do that.'],
  throw: ['Throw it! Throw it!', 'Ball! Ball! Ball!', 'Ready, ready, ready!'],
};
const blPick = (a) => a[Math.floor(blRnd() * a.length)];
function blRnd() { return BL && BL.rnd ? BL.rnd() : Math.random(); }

/* ---------------- geometry: the place's floor, no-go boxes, the player's spot ---------------- */
function blDomNoGo() { // fallback until ROAM's rmZone gives the boxes: the big tappable props of the scene
  const svg = $('svg.world', view), out = []; if (!svg) return out;
  ['#houseG', '#bowlG', '#secretX'].forEach((q) => { const el = $(q, svg); if (!el) return; try { const b = el.getBBox(); if (b.width && b.height) out.push([b.x, b.y, b.width, b.height]); } catch (e) { /* not drawn */ } });
  return out;
}
function blZone() {
  const place = (S && S.place) || 'yard'; let z = null; try { z = typeof rmZone === 'function' ? rmZone(place) : null; } catch (e) { z = null; }
  const f = BL_FLOOR[place] || [420, 590], out = { x0: 60, x1: 940, y0: f[0], y1: f[1], no: [] };
  if (isPhone() && place === 'yard') { out.y0 = 420; out.y1 = 600; }
  if (z) { ['x0', 'x1', 'y0', 'y1'].forEach((k) => { if (typeof z[k] === 'number') out[k] = z[k]; }); out.no = Array.isArray(z.no) ? z.no : []; } else out.no = blDomNoGo();
  return out;
}
// the nearest point outside every no-go box (a box is [x, y, w, h]), then inside the floor
function blPush(x, y, Z) {
  Z = Z || BL.zone;
  for (let k = 0; k < 2; k++) {
    for (const b of Z.no) {
      if (x > b[0] && x < b[0] + b[2] && y > b[1] && y < b[1] + b[3]) {
        const l = x - b[0], r = b[0] + b[2] - x, t = y - b[1], u = b[1] + b[3] - y, m = Math.min(l, r, t, u);
        if (m === l) x = b[0] - 9; else if (m === r) x = b[0] + b[2] + 9; else if (m === t) y = b[1] - 9; else y = b[1] + b[3] + 9; // 9 units clear: the route planner's margin is 6
      }
    }
    x = clamp(x, Z.x0, Z.x1); y = clamp(y, Z.y0, Z.y1);
  }
  return [x, y];
}
const blScale = (y) => { try { const s = rmScale(y); return typeof s === 'number' && s > 0 ? s : 1; } catch (e) { return 1; } };
const blSign = (o) => (o.face === 'left' ? -1 : 1);
const blDist = (ax, ay, bx, by) => Math.hypot(ax - bx, (ay - by) * 1.6); // depth counts a little more: the floor is seen from the front
// where the dogs wait: around the ball's home, the players side
const BL_WAIT = [[-115, -25], [115, -25], [-40, -90], [40, -90], [-200, -70], [200, -70], [-280, -30], [280, -30]]; // a tight bunch round the player: a throw is long, so speed decides the race, not who stood nearer
function blSpots() { return BL.dogs.map((o, i) => { const w = BL_WAIT[i % BL_WAIT.length]; return blPush(BL.hx + w[0], BL.hy + w[1], BL.zone); }); }

/* ---------------- who plays ---------------- */
function blEligible(d, lead) {
  if (!d || d.sleeping) return false;
  if (typeof hmMumIn === 'function' && hmMumIn(d)) return false;
  if (typeof isNursing === 'function' && isNursing(d)) return false;
  if (d !== lead && dogMonths(d) < 3) return false; // a puppy under 3 months watches (the leader always plays, as it did in Fetch)
  return true;
}
// the race speed in world units a second (V210.md 5.4): 520 x ball x (0.7 + 0.3 x Energy / 100), x0.8 under 6 months, +-8 % jitter per throw
function blSpeed(d) {
  const en = clamp(d.stats ? +d.stats.energy || 0 : 70, 0, 100), young = dogMonths(d) < 6 ? 0.8 : 1;
  return 520 * persOf(d).ball * (0.7 + 0.3 * en / 100) * young * (0.92 + blRnd() * 0.16);
}

/* ---------------- the scene: ball art, drag and throw ---------------- */
function blBallSVG() {
  const c = BL.cfg, a = c.prop[0] === 'prop' ? art('prop', c.prop[1]) : art('item', c.prop[1]);
  return `<defs><radialGradient id="blGlowG"><stop offset="0" stop-color="#E6FFAA" stop-opacity=".95"/><stop offset="1" stop-color="#A0FF78" stop-opacity="0"/></radialGradient></defs>
    <ellipse id="blSh" rx="24" ry="7" fill="#3a2a1c" opacity=".26"/><circle id="blRing" class="bl-ring" r="50" fill="none" stroke="#F28FA5" stroke-width="4" stroke-dasharray="7 6"/>
    <g id="blBall" class="bl-ball">${c.glow && isNight() ? '<circle id="blHalo" r="70" fill="url(#blGlowG)"/>' : ''}<g id="blSpin">${place(a, -30, -30, 60, 60)}</g></g>`;
}
function blDraw() {
  const L = $('#ballLayer'); if (!L || !BL) return;
  if (!$('#blBall', L)) { L.innerHTML = blBallSVG(); BL.drawn = ''; } // the scene was redrawn under us
  const b = BL.ball, sc = blScale(b.gy), sy = b.gy - b.z, rest = BL.ph === 'rest' && b.state !== 'held';
  const ball = $('#blBall', L), spin = $('#blSpin', L), sh = $('#blSh', L), ring = $('#blRing', L);
  ball.setAttribute('transform', `translate(${b.x.toFixed(1)} ${(sy - BL_R * sc * 0.4).toFixed(1)}) scale(${sc.toFixed(3)})`);
  spin.setAttribute('transform', `rotate(${b.rot.toFixed(1)})`);
  sh.setAttribute('transform', `translate(${b.x.toFixed(1)} ${(b.gy + 2).toFixed(1)}) scale(${(sc * (1 - Math.min(0.5, b.z / 700))).toFixed(3)})`);
  ring.setAttribute('transform', `translate(${b.x.toFixed(1)} ${(sy - BL_R * sc * 0.4).toFixed(1)}) scale(${sc.toFixed(3)})`); ring.style.display = rest ? '' : 'none';
}
function blHitR(svg) { // 32 px at least, whatever the zoom
  const r = svg.getBoundingClientRect(), vb = svg.viewBox && svg.viewBox.baseVal, w = vb && vb.width ? vb.width : 1000, ppu = r.width / w || 1;
  return Math.max(70, 32 / ppu);
}
function blBind(svg) {
  const sample = (e) => { const w = toWorld(svg, e.clientX, e.clientY), t = performance.now(), g = BL.grab; g.s.push({ t, x: w.x, y: w.y }); while (g.s.length > 2 && t - g.s[0].t > 140) g.s.shift(); return w; };
  const dn = (e) => {
    if (!BL || BL.lock || BL.grab || BL.ph !== 'rest' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const w = toWorld(svg, e.clientX, e.clientY), b = BL.ball;
    if (Math.hypot(w.x - b.x, w.y - (b.gy - b.z)) > blHitR(svg)) return;
    e.stopPropagation(); e.preventDefault(); SFX.init(); try { svg.setPointerCapture(e.pointerId); } catch (er) { /* capture unsupported */ }
    BL.grab = { id: e.pointerId, s: [{ t: performance.now(), x: w.x, y: w.y }], x0: w.x, y0: w.y, moved: 0 }; b.state = 'held'; blHint('Let go to throw!');
  };
  const mv = (e) => {
    const g = BL && BL.grab; if (!g || e.pointerId !== g.id) return;
    const w = sample(e), b = BL.ball; g.moved = Math.max(g.moved, Math.hypot(w.x - g.x0, w.y - g.y0));
    b.x = clamp(w.x, BL.zone.x0 - 20, BL.zone.x1 + 20); b.z = clamp(b.gy - w.y, 0, 440); b.rot += 4;
  };
  const up = (e) => {
    const g = BL && BL.grab; if (!g || e.pointerId !== g.id) return;
    sample(e); BL.grab = null; try { svg.releasePointerCapture(e.pointerId); } catch (er) { /* none */ }
    const s = g.s, a = s[0], z = s[s.length - 1], dt = Math.max(0.016, (z.t - a.t) / 1000), vx = (z.x - a.x) / dt, vy = (z.y - a.y) / dt;
    if (g.moved < 24 && Math.hypot(vx, vy) < 140) { blEasyThrow(); return; } // a tap on the ball: an easy throw
    blThrowFrom(vx, vy);
  };
  const cn = (e) => { const g = BL && BL.grab; if (!g || e.pointerId !== g.id) return; BL.grab = null; BL.ball.state = 'rest'; BL.ball.z = 0; };
  svg.addEventListener('pointerdown', dn, true); svg.addEventListener('pointermove', mv); svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', cn);
  BL.unbind = () => { svg.removeEventListener('pointerdown', dn, true); svg.removeEventListener('pointermove', mv); svg.removeEventListener('pointerup', up); svg.removeEventListener('pointercancel', cn); };
}

/* ---------------- throwing ---------------- */
// a drag-and-release velocity (world units a second, y down) becomes a ground speed, a lift and a drift towards the back (up and far) or the front (down)
function blThrowFrom(vx, vy) {
  const c = BL.cfg, up = Math.max(0, -vy);
  const lx = clamp(vx * 1.15, -1700, 1700), lz = clamp((up * 0.55 + 280) * c.vzK, 240 * c.vzK, 1150 * c.vzK); // a low, fast arc: the dogs cannot all wait under it, so their speed decides the race
  const lg = vy < 0 ? -Math.min(1500, up * 0.9) * 0.12 : Math.min(120, vy * 0.1);
  blLaunch(lx, lz, lg);
}
function blEasyThrow() { // the tap and Space throw: far enough to make a race, left or right of the player's spot
  const dir = blRnd() < 0.5 ? -1 : 1, z = BL.zone, room = dir < 0 ? BL.hx - z.x0 : z.x1 - BL.hx, d = dir * (Math.min(room, 640) * (0.55 + blRnd() * 0.4));
  const c = BL.cfg, lz = 470 * c.vzK, T = 2 * lz / c.g;
  blLaunch(d / T, lz, (blRnd() - 0.5) * 120);
}
function blLaunch(vx, vz, vgy) {
  if (BL.ph !== 'rest') return;
  const b = BL.ball, c = BL.cfg;
  b.vx = vx; b.vz = vz; b.vgy = vgy; b.state = 'fly'; b.bounces = 0; b.vr = clamp(vx * c.spin, -900, 900) + (vx >= 0 ? 120 : -120); b.carrier = null;
  BL.ph = 'chase'; BL.thrown++; BL.th = { t0: BL.t, tg: 0, steal: null, lap: false, special: false, winner: null, bonk: 0 };
  BL.dogs.forEach((o) => { o.role = 'chase'; o.sp = blSpeed(o.d); o.off = [(blRnd() - 0.5) * 60, (blRnd() - 0.5) * 24]; o.until = 0; o.bonk = blRnd() < 0.3; o.bonked = false; });
  SFX.whoosh(); blHint('They are off!');
  const lead = BL.dogs[0]; if (lead && BL.thrown === 1) { try { barkDog(lead.d, 'play', {}); } catch (e) { /* none */ } }
  if (BL.thrown === 1 || blRnd() < 0.3) blSay(blPickDog(), blPick(BL_LINES.throw), true);
}
const blPickDog = () => BL.dogs[Math.floor(blRnd() * BL.dogs.length)];
function blBallStep(dt) {
  const b = BL.ball, c = BL.cfg, Z = BL.zone;
  if (b.state === 'fly') {
    b.vz -= c.g * dt; b.z += b.vz * dt; b.x += b.vx * dt; b.gy += b.vgy * dt; b.rot += b.vr * dt;
    if (c.float) { b.vx *= Math.exp(-0.25 * dt); }
    if (b.x < 30) { b.x = 30; b.vx = Math.abs(b.vx) * 0.5; } if (b.x > 970) { b.x = 970; b.vx = -Math.abs(b.vx) * 0.5; }
    if (b.gy < Z.y0) { b.gy = Z.y0; b.vgy = Math.abs(b.vgy) * 0.4; } if (b.gy > Z.y1) { b.gy = Z.y1; b.vgy = -Math.abs(b.vgy) * 0.4; }
    if (b.z <= 0) {
      b.z = 0;
      if (Math.abs(b.vz) > 170) { b.vz = Math.abs(b.vz) * c.bounce; b.vx *= 0.82; b.vgy *= 0.82; b.bounces++; if (b.bounces === 1) SFX.thud(); else if (b.bounces === 2) SFX.boop(520); }
      else { b.vz = 0; b.state = 'roll'; }
    }
  } else if (b.state === 'roll') {
    const f = Math.exp(-c.fric * dt); b.vx *= f; b.vgy *= f; b.x += b.vx * dt; b.gy += b.vgy * dt; b.rot += b.vx * 0.9 * dt;
    if (b.x < 30) { b.x = 30; b.vx = Math.abs(b.vx) * 0.5; } if (b.x > 970) { b.x = 970; b.vx = -Math.abs(b.vx) * 0.5; }
    b.gy = clamp(b.gy, Z.y0, Z.y1);
    if (Math.hypot(b.vx, b.vgy) < 14) { b.vx = 0; b.vgy = 0; b.state = 'stopped'; const p = blPush(b.x, b.gy, Z); b.x = p[0]; b.gy = p[1]; }
  }
}
// a ball coming down on a chasing dog's head bounces (the toys.js head bounce): about 1 dog in 3 gets bonked, once a throw
function blHeadBounce() {
  const b = BL.ball; if (b.state !== 'fly' || b.vz >= 0 || BL.bonkCD > 0) return;
  for (const o of BL.dogs) {
    if (o.role !== 'chase' || !o.bonk || o.bonked) continue;
    const sc = blScale(o.y), hx = o.x + blSign(o) * 40 * sc, hy = o.y - 170 * sc, sy = b.gy - b.z;
    if (Math.abs(b.gy - o.y) < 55 && Math.abs(b.x - hx) < 55 * sc + BL_R && Math.abs(sy - hy) < 34) {
      o.bonked = true; b.vz = Math.max(560, -b.vz * 0.8); b.vx += (b.x - hx) * 6 + (blRnd() - 0.5) * 120; b.bounces = 0; BL.bonkCD = 0.6;
      SFX.boop(300); fxText('BOING!', hx, hy - 40, '#F2C744', 40); blSay(o, blPick(BL_LINES.boing), true); return;
    }
  }
}

/* ---------------- the dogs ---------------- */
// does the segment cross the box (Liang-Barsky)?
function blSegHits(x0, y0, x1, y1, L, T, R, B) {
  let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0;
  for (const [p, q] of [[-dx, x0 - L], [dx, R - x0], [-dy, y0 - T], [dy, B - y0]]) {
    if (p === 0) { if (q < 0) return false; } else { const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } }
  }
  return true;
}
// a straight run that would cross a no-go box (the dog house, the bowl, a decoration) goes round the boxes' corners: the first stop of the shortest way
function blVia(x0, y0, x1, y1) {
  const Z = BL.zone; if (!Z.no.length) return null;
  const bx = Z.no.map((b) => [b[0] - 6, b[1] - 6, b[0] + b[2] + 6, b[1] + b[3] + 6]), hit = (ax, ay, cx, cy) => bx.some((q) => blSegHits(ax, ay, cx, cy, q[0], q[1], q[2], q[3]));
  if (!hit(x0, y0, x1, y1)) return null;
  const N = [[x0, y0], [x1, y1]];
  Z.no.forEach((b) => [[b[0] - 18, b[1] - 18], [b[0] + b[2] + 18, b[1] - 18], [b[0] - 18, b[1] + b[3] + 18], [b[0] + b[2] + 18, b[1] + b[3] + 18]].forEach((c) => {
    const cx = clamp(c[0], Z.x0, Z.x1), cy = clamp(c[1], Z.y0, Z.y1); if (!bx.some((q) => cx > q[0] && cx < q[2] && cy > q[1] && cy < q[3])) N.push([cx, cy]);
  }));
  const dist = N.map(() => 1e9), prev = N.map(() => -1), done = N.map(() => false); dist[0] = 0;
  for (let k = 0; k < N.length; k++) {
    let u = -1; N.forEach((n, i) => { if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i; }); if (u < 0 || dist[u] >= 1e9) break; done[u] = true; if (u === 1) break;
    N.forEach((n, v) => { if (done[v]) return; const d = dist[u] + Math.hypot(n[0] - N[u][0], n[1] - N[u][1]); if (d < dist[v] && !hit(N[u][0], N[u][1], n[0], n[1])) { dist[v] = d; prev[v] = u; } });
  }
  if (prev[1] < 0) return null;
  let v = 1; while (prev[v] > 0) v = prev[v]; return v === 1 ? null : N[v];
}
function blMove(o, tx, ty, speed, dt) { // one step towards (tx, ty), round the no-go boxes; returns the distance left
  const via = blVia(o.x, o.y, tx, ty), gx = via ? via[0] : tx, gy = via ? via[1] : ty;
  const dx = gx - o.x, dy = gy - o.y, dist = Math.hypot(dx, dy);
  if (dist > 0.5) { const m = Math.min(dist, speed * dt); o.x += dx / dist * m; o.y += dy / dist * m; if (Math.abs(dx) > 10) o.face = dx < 0 ? 'left' : 'right'; }
  return Math.max(0, via ? Math.hypot(tx - gx, ty - gy) + dist - speed * dt : dist - speed * dt);
}
function blSay(o, text, prio) { // a speech bubble over the dog, never a toast. One line at a time, rate limited unless it matters
  if (!BL || (!prio && BL.t - BL.lineAt < 1.7)) return; BL.lineAt = BL.t;
  const sc = blScale(o.y); say(text, o.x + blSign(o) * 40 * sc, o.y - 175 * sc, 2400);
}
function blEtaOf(o) { const b = BL.ball; return blDist(o.x, o.y, b.x, b.gy) / Math.max(60, o.sp); }
function blPickup() { // the first chaser close enough to the ball takes it
  const b = BL.ball; if (b.state === 'held' || b.carrier) return;
  let best = null, bd = 1e9;
  BL.dogs.forEach((o) => {
    if (o.role !== 'chase') return; const sc = blScale(o.y), dx = (o.x - b.x) / ((45 + 0.12 * o.sp) * sc), dy = (o.y - b.gy) / ((24 + 0.06 * o.sp) * sc), q = dx * dx + dy * dy; // a fast dog lunges from further away
    if (q < 1 && b.z < 95 * sc && (b.vz <= 0 || b.state !== 'fly') && q < bd) { best = o; bd = q; }
  });
  if (best) blGrab(best);
}
function blGrab(w) {
  const b = BL.ball, th = BL.th; b.carrier = w; b.state = 'carried'; b.vx = b.vz = b.vgy = 0; BL.ph = 'return'; th.winner = w.d.id; th.tg = BL.t;
  w.role = 'carry'; w.pose = 'walk'; SFX.pop();
  const others = BL.dogs.filter((o) => o !== w), f = BL.force; BL.force = null;
  let thief = null, lap = false;
  if (others.length && (BL.thrown - BL.lastSp >= 3 || f)) { // at most 1 throw in 3 has a steal or a lap (V210.md 5.4)
    const near = others.filter((o) => blEtaOf(o) <= 0.6).sort((p, q) => persOf(q.d).steal - persOf(p.d).steal)[0];
    if (f === 'steal') thief = near || others[0];
    else if (f === 'lap') lap = true;
    else if (near && blRnd() < persOf(near.d).steal * 0.6) thief = near;
    else if (persOf(w.d).trait !== 'ball' && blRnd() < persOf(w.d).steal * 0.5) lap = true;
  }
  if (thief) { th.steal = thief.id; th.special = true; BL.lastSp = BL.thrown; thief.role = 'thief'; thief.pose = 'walk'; }
  else if (lap) { th.lap = true; th.special = true; BL.lastSp = BL.thrown; w.role = 'lap'; w.way = blLapWay(w); blSay(w, blPick(BL_LINES.lap), true); }
  others.forEach((o) => { if (o !== thief) { o.role = 'tail'; o.pose = 'walk'; } });
}
// a keep-away lap: out to the far side of the floor, round the back, then home (shorter for the slow ones)
function blLapWay(w) {
  const Z = BL.zone, left = w.x < BL.hx, far = left ? Z.x1 - 90 : Z.x0 + 90, mid = (Z.x0 + Z.x1) / 2, back = Z.y0 + 22, front = Z.y1 - 22;
  const way = [[far, w.y < (Z.y0 + Z.y1) / 2 ? front : back], [mid, w.y < (Z.y0 + Z.y1) / 2 ? back : front]];
  if (w.sp < 330) way.pop();
  return way.map((p) => blPush(p[0], p[1], Z));
}
function blCatchLine(o) {
  const t = persOf(o.d).trait, tl = BL_LINES.trait[t]; return tl && blRnd() < 0.5 ? blPick(tl) : blPick(BL_LINES.catch);
}
function blStepDogs(dt) {
  const b = BL.ball, Z = BL.zone;
  // where the chasers run: the ball's shadow, which slows down when it lands and rolls
  const tgt = blPush(b.x + b.vx * 0.15, b.gy + b.vgy * 0.15, Z); // they run after the ball's shadow: the fastest closes in first
  BL.dogs.forEach((o, i) => {
    const sc = blScale(o.y);
    switch (o.role) {
      case 'chase': {
        const k = b.state === 'fly' ? 1 : 0.2, left = blMove(o, tgt[0] + o.off[0] * k, tgt[1] + o.off[1] * k, o.sp, dt);
        o.pose = left > 6 ? 'walk' : b.state === 'fly' && b.z > 60 ? 'jump' : 'idle'; break;
      }
      case 'carry': case 'thief': {
        const slow = BL.th.steal && o.role === 'carry' ? 0.5 : 0.85;
        if (o.role === 'thief') { const w = b.carrier, left = blMove(o, w.x, w.y, o.sp, dt); o.pose = 'walk'; if (left < 50 * sc) blSteal(o, w); break; }
        if (blMove(o, BL.hx, BL.hy, o.sp * slow, dt) < 8) blReturn(o); else o.pose = 'walk'; break;
      }
      case 'lap': {
        if (BL.t - BL.th.tg > 9 && o.way) o.way = []; // a lap never takes more than 9 s
        const wp = o.way && o.way[0];
        if (wp) { if (blMove(o, wp[0], wp[1], o.sp * 0.95, dt) < 10) o.way.shift(); o.pose = 'walk'; }
        else if (blMove(o, BL.hx, BL.hy, o.sp * 0.95, dt) < 8) { blSay(o, blPick(BL_LINES.lapEnd), true); blReturn(o); }
        break;
      }
      case 'tail': { // after the carrier, never quite catching up
        const c = b.carrier; if (!c) { o.role = 'wait'; break; }
        const d = Math.hypot(c.x - o.x, (c.y - o.y) * 1.6);
        if (d > 105) { blMove(o, c.x - blSign(c) * 70, c.y + (i % 2 ? 22 : -22), o.sp * 0.88, dt); o.pose = 'walk'; } else o.pose = 'idle';
        break;
      }
      case 'cheer': if (BL.t >= o.until) { o.role = 'wait'; o.pose = 'idle'; } break;
      default: { // wait: stroll to the spot, then sit facing the ball
        const sp = BL.spots[i] || [BL.hx, BL.hy], left = blMove(o, sp[0], sp[1], 230, dt);
        if (left > 5) o.pose = 'walk'; else { o.pose = 'sit'; if (Math.abs(BL.hx - o.x) > 10) o.face = BL.hx < o.x ? 'left' : 'right'; }
      }
    }
    if (o.role !== 'wait' || o.pose === 'walk') { const p = blPush(o.x, o.y, Z); o.x = p[0]; o.y = p[1]; }
  });
  // two dogs never share one spot: a gentle push (less than a dog's step)
  for (let i = 0; i < BL.dogs.length; i++) for (let j = i + 1; j < BL.dogs.length; j++) {
    const a = BL.dogs[i], c = BL.dogs[j], dx = c.x - a.x, dy = (c.y - a.y) * 1.6, d = Math.hypot(dx, dy);
    if (d < 45 && a.role !== 'carry' && c.role !== 'carry') { const k = (45 - d) * 0.06, ux = d > 1 ? dx / d : 1; a.x -= ux * k; c.x += ux * k; }
  }
  if (b.carrier) { const c = b.carrier, sc = blScale(c.y); b.x = c.x + blSign(c) * 46 * sc; b.gy = c.y; b.z = 64 * sc + Math.sin(BL.t * 14) * 3; b.rot += 300 * dt; }
}
function blSteal(t, w) { // the thief snatches the ball: it brings it home with everybody after it
  const b = BL.ball; b.carrier = t; t.role = 'carry'; w.role = 'tail'; t.sp *= 1.0; BL.th.steal = null; BL.th.stolen = true; BL.th.thief = t.id; SFX.squeak();
  blSay(t, blPick(BL_LINES.steal), true); setTimeout(() => { if (BL && BL.ph === 'return') blSay(w, blPick(BL_LINES.robbed), false); }, 1100);
  BL.dogs.forEach((o) => { if (o !== t) { o.role = 'tail'; o.pose = 'walk'; } });
}
// the ball is back: the catch line, the coins, the play effects
function blReturn(o) {
  const b = BL.ball, c = BL.cfg; b.carrier = null; b.state = 'rest'; b.x = BL.hx; b.gy = BL.hy; b.z = 0; b.vx = b.vz = b.vgy = 0; BL.ph = 'rest'; b.rot = 0;
  BL.n++; S.bl.n = (S.bl.n || 0) + 1; o.role = 'cheer'; o.pose = 'happy'; o.until = BL.t + 1.1; o.got = (o.got || 0) + 1;
  BL.dogs.forEach((x) => { if (x !== o) { x.role = 'wait'; x.pose = 'idle'; } });
  const coins = blCoins(c.coin); blSay(o, blCatchLine(o), true);
  fxText(coins ? `+${coins}` : 'Caught it!', o.x, o.y - 200 * blScale(o.y), coins ? '#F2C744' : '#9CCF8F', 42);
  try { SFX.bark(BARK[o.d.key]); } catch (e) { /* none */ }
  BL.dogs.forEach((x) => blPlayFx(x));
  BL.played = true; trackAct('fetch', { name: BL.toy }); markDirty(); blTrayUpdate(); blHint('Nice! Drag the ball to throw it again.'); updateHUD();
}
function blDay() { const today = localISO(); if (S.bl.day !== today) { S.bl.day = today; S.bl.coins = 0; markDirty(); } }
// real coins, no BOOST: capped for the session and for the day (S.bl.coins)
function blCoins(base) {
  blDay(); const room = Math.max(0, Math.min(BL_COIN_SES - BL.coins, BL_COIN_DAY - S.bl.coins)), n = Math.min(base, room);
  if (n > 0) { addCoins(n, { raw: true }); S.bl.coins += n; BL.coins += n; markDirty(); }
  return n;
}
// Happiness and Energy for a dog that ran (what Fetch gave over a full round, spread over the returns), kept to Fetch's total
function blPlayFx(x) {
  const c = BL.cfg, d = x.d;
  withDog(d, () => {
    const mult = (favAct('fetch') ? 1.5 : 1) * (d.favToy === BL.toy ? 1.5 : 1) * (S.place === 'park' ? 1.2 : 1) * (S.place === 'dogpark' ? 1.3 : 1) * BL.k;
    const cap = c.hap * mult, unit = c.hap / 6 * mult, h = Math.max(0, Math.min(unit, cap - (x.hapGot || 0)));
    if (h > 0) { addStat('happy', h); x.hapGot = (x.hapGot || 0) + h; }
    addStat('energy', -c.en);
  });
  x.ran = (x.ran || 0) + 1;
}

/* ---------------- the loop ---------------- */
function blLoop(now) {
  if (!BL) return; BL.raf = requestAnimationFrame(blLoop);
  const dt = Math.min(0.033, Math.max(0, (now - BL.last) / 1000)); BL.last = now;
  if (!BL.lock) blTick(dt);
}
function blTick(dt) {
  BL.t += dt; busy = true; // the idle jokes and the pet rubs stay out of the way
  if (S.sleeping) { blStop(); return; }
  BL.bonkCD = Math.max(0, (BL.bonkCD || 0) - dt);
  const b = BL.ball;
  if (BL.ph === 'chase') {
    blBallStep(dt); blHeadBounce(); blPickup();
    if (BL.ph === 'chase' && BL.t - BL.th.t0 > 12) { const near = BL.dogs.slice().sort((p, q) => blEtaOf(p) - blEtaOf(q))[0]; if (near) { b.x = near.x; b.gy = near.y; b.z = 0; blGrab(near); } } // never stuck
  } else if (BL.ph === 'return' && BL.t - BL.th.tg > 30) { const c = b.carrier; if (c) blReturn(c); // never stuck: after 30 s it is simply brought back
  } else if (BL.ph === 'rest' && !BL.grab && b.state !== 'held') { b.state = 'rest'; b.x = BL.hx; b.gy = BL.hy; b.z = 0; }
  blStepDogs(dt);
  BL.dogs.forEach((o) => blApplyDog(o));
  blCamera(dt); blDraw();
}
function blApplyDog(o) {
  const key = o.pose + o.face, moved = o.px !== o.x || o.py !== o.y;
  if (!moved && o.key === key) return;
  o.px = o.x; o.py = o.y; o.key = key;
  try { rmSet(o.d, { x: o.x, y: o.y, face: o.face, pose: o.pose }); } catch (e) { /* the roam engine is not ready yet */ }
}
// phones: the crop is about 900 world units wide (the camera follows the ball), the extra sky above the scene takes the sky colour
function blSky() {
  const sc = $('#view > svg.world #sceneG'), r = sc && sc.querySelector('rect[width="1000"]'); let col = '';
  if (r) { const f = r.getAttribute('fill') || '', m = /url\(#([^)]+)\)/.exec(f), gr = m && $('#view > svg.world #' + m[1]), st = gr && gr.querySelector('stop'); col = st ? (st.getAttribute('stop-color') || getComputedStyle(st).stopColor) : (f.startsWith('#') ? f : ''); }
  view.style.background = col || '';
}
function blCamera(dt) {
  if (!isPhone()) return;
  const dm = phSvgDims(); if (!dm.w || !dm.h) return;
  const vbW = 600 * dm.w / dm.h, zf = vbW >= 900 ? 1 : vbW / 900;
  if (Math.abs(phZoom - zf) > 0.001) { phZoom = zf; blSky(); }
  const b = BL.ball, target = BL.ph === 'rest' ? BL.hx : clamp(b.x, 0, 1000);
  camCx += (target - camCx) * Math.min(1, dt * 5); cancelAnimationFrame(camRaf); clearTimeout(phPanT); camApply(camCx);
}

/* ---------------- the dock ---------------- */
function blTrayHTML() {
  return `<div class="tray mini bl-tray"><div class="tray-h"><h3>Ball play: ${esc(BL.toy)}</h3><button class="btn yes bl-done" id="blDone" aria-label="Stop ball play">Done</button></div>
    <div class="tray-body"><p class="small bl-hint" id="blHint">${isPhone() ? 'Drag the ball and let go to throw it.' : 'Drag the ball and let go to throw it. Space is an easy throw.'}</p><p class="small bl-coins" id="blCoins"></p></div></div>`;
}
function blHint(t) { const h = $('#blHint'); if (h && h.textContent !== t) h.textContent = t; }
function blCoinsText() {
  blDay(); if (S.bl.coins >= BL_COIN_DAY) return 'Ball play coins: done for today';
  if (BL.coins >= BL_COIN_SES) return 'Ball play coins: done for this round';
  return `Ball play coins: ${BL.coins} of ${BL_COIN_SES}`;
}
function blTrayUpdate() { const c = $('#blCoins'); if (c) { const t = blCoinsText(); if (c.textContent !== t) c.textContent = t; } }

/* ---------------- start and stop ---------------- */
function blStart(toy) {
  const cfg = BL_TOYS[toy]; if (BL || !cfg || !S || cur.mode !== 'yard') return false;
  const lead = D(), svg = $('svg.world', view); if (!svg || !$('#ballLayer')) return false;
  if (S.sleeping) { nope(`${NAME()} is asleep. Even fun has to wait.`); return false; }
  if (typeof isNursing === 'function' && isNursing(lead)) { nope(`${lead.name} is nursing the pups. No ball play for ${PRd(lead).him} right now.`); return false; }
  const dogs = (typeof rmDogs === 'function' ? rmDogs() : [lead]).filter((d) => blEligible(d, lead));
  if (!dogs.includes(lead)) dogs.unshift(lead);
  popDown(); clearCurl(); hideBubble(); toasts.innerHTML = ''; // a notice from before the game must not sit over the play area
  const key = 'toyAt_' + toy, full = !S[key] || S.gameMin - S[key] >= 10; S[key] = S.gameMin; // the same 10-minute rule as Fetch: playing again so soon is less exciting
  BL = { toy, cfg, k: full ? 1 : 0.25, lead, dogs: dogs.map((d) => ({ d, id: d.id, x: 430, y: 500, face: 'right', pose: 'idle', role: 'wait', sp: 0, off: [0, 0], until: 0, ran: 0, hapGot: 0, got: 0 })), svg,
    ball: { x: 0, gy: 0, z: 0, vx: 0, vz: 0, vgy: 0, rot: 0, vr: 0, state: 'rest', bounces: 0, carrier: null }, ph: 'rest', thrown: 0, n: 0, coins: 0, lastSp: -9, lineAt: -9, t: 0, key0: cur.key, raf: 0, last: performance.now(), grab: null, rnd: null, force: null, lock: false, played: false,
    zone: blZone(), z0: typeof phZoom === 'number' ? phZoom : 1 };
  BL.dogs.forEach((o) => { try { const p = rmPos(o.d); o.x = p.x; o.y = p.y; o.face = p.face || 'right'; o.pose = p.pose || 'idle'; } catch (e) { /* default */ } const q = blPush(o.x, o.y, BL.zone); o.x = q[0]; o.y = q[1]; });
  const mx = BL.dogs.reduce((a, o) => a + o.x, 0) / BL.dogs.length, Z = BL.zone;
  BL.hx = isPhone() ? clamp(mx, Z.x0 + 260, Z.x1 - 260) : 500; BL.hy = Z.y1 - 58; // the ring round the ball (50 units) stays inside the scene BL.camT = BL.hx;
  const hp = blPush(BL.hx, BL.hy, Z); BL.hx = hp[0]; BL.hy = hp[1]; BL.spots = blSpots();
  BL.ball.x = BL.hx; BL.ball.gy = BL.hy;
  try { rmPause('ball'); } catch (e) { /* none */ }
  busy = true; tempPose = null; setChrome(true, false);
  dock.innerHTML = blTrayHTML(); $('#blDone').onclick = () => { SFX.boop(700); blStop(); }; blTrayUpdate();
  $('#ballLayer').innerHTML = blBallSVG(); blBind(svg); blDraw();
  cur.key = (e) => { const ok = e.key === ' ' || (e.key === 'Enter' && document.activeElement === document.body); if (!ok || e.repeat || !BL || BL.ph !== 'rest' || BL.grab) return; e.preventDefault(); blEasyThrow(); };
  onCleanup(() => { if (BL) blStop(true); });
  if (isPhone()) { phPeekOn = false; blSky(); }
  BL.raf = requestAnimationFrame(blLoop);
  return true;
}
function blStop(quiet) {
  if (!BL) return; const B = BL; BL = null; cancelAnimationFrame(B.raf);
  if (B.unbind) B.unbind();
  const L = $('#ballLayer'); if (L) L.innerHTML = '';
  try { rmResume('ball'); } catch (e) { /* none */ }
  cur.key = B.key0 || null;
  // Bond once a session for every dog that ran, and the daily play care
  if (B.played) {
    B.dogs.forEach((o) => { if (o.ran) withDog(o.d, () => addBond(8 * B.k)); });
    dailyCare('play'); markDirty();
  }
  busy = false;
  if (isPhone()) { phZoom = B.z0 || 1; view.style.background = ''; }
  if (!quiet && cur.mode === 'yard') {
    setChrome(true, true); renderDog(dogPoseNow(), 'right', true); if (S.sleeping) sleepTray(); else dockIdle();
    if (isPhone()) { phHomeRefit(); camCx = phCamHome; camApply(camCx); }
    updateHUD();
  }
}
// the portrait-lock card pauses the game (v2.3 phones), as it did Fetch
on('phone:lock', ({ on: locked }) => { if (!BL) return; BL.lock = !!locked; BL.last = performance.now(); });

/* ---- tests: window.__paw.bl ---- */
function blExpose() {
  if (!window.__paw || window.__paw.bl) return;
  window.__paw.bl = {
    get on() { return blOn(); }, start: (toy) => blStart(toy || 'Tennis Ball'), stop: () => blStop(),
    get state() { return BL ? { ph: BL.ph, n: BL.n, thrown: BL.thrown, coins: BL.coins, toy: BL.toy, ball: Object.assign({}, BL.ball, { carrier: BL.ball.carrier ? BL.ball.carrier.id : null }), hx: BL.hx, hy: BL.hy, zone: BL.zone, lastSp: BL.lastSp, th: BL.th ? Object.assign({}, BL.th) : null } : null; },
    get dogs() { return BL ? BL.dogs.map((o) => ({ id: o.id, key: o.d.key, x: o.x, y: o.y, face: o.face, pose: o.pose, role: o.role, sp: o.sp, ran: o.ran })) : []; },
    throwV: (vx, vy) => { if (BL && BL.ph === 'rest') blThrowFrom(vx, vy); }, easy: () => { if (BL && BL.ph === 'rest') blEasyThrow(); },
    launch: (vx, vz, vgy) => { if (BL && BL.ph === 'rest') blLaunch(vx, vz, vgy); },
    seed: (n) => { let a = n >>> 0; if (BL) BL.rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
    rng: (fn) => { if (BL) BL.rnd = fn; }, // a fixed random source (tests)
    force: (k) => { if (BL) BL.force = k; }, // 'steal' | 'lap': the next pick-up has one (tests)
    sim: (sec) => { const n = Math.round(sec * 60); for (let i = 0; i < n && BL; i++) blTick(1 / 60); },
    cap: { session: BL_COIN_SES, day: BL_COIN_DAY },
  };
}
on('game:ready', () => setTimeout(blExpose, 0)); on('yard:enter', () => { if (!window.__paw || !window.__paw.bl) blExpose(); });
