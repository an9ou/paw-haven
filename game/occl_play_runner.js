// v2.3 PHONE PLAY lane, area "runner" (mods/walkrun.js): hook file for game/test_phone_occl_play.js (see its HOOK note).
//   RUNNER-A  phone: the strip + legend + controls are one balanced group (no big empty gap), the pause button stays in the bag row, the touch legend reads exactly
//   RUNNER-B  all sizes: the dog's speech bubble and the "Dig!" prompt never sit on each other or on the dog's head; touch layouts say "Tap Dig!", not "Press D"
//   RUNNER-C  all sizes: the "jump!" hints never sit on the dog or on the coins; a touch tablet puts Duck/Jump under the strip and shows the legend
const LEGEND = 'Tap the scene to jump · hold = long jump · swipe down to duck';

// in-page: start the runner on the park route, page through the tutorial, wait for the countdown to end
const startRunner = async (H, first) => {
  const { t, ev, ok } = H;
  await ev((first) => { window.PawWalk = window.__PW || window.PawWalk; window.__PW = window.PawWalk; window.__paw.S.sleeping = false; window.__paw.S.walks = first ? 0 : 1; window.__paw.go('walk', 'park'); }, !!first);
  ok(await t.until(() => !!document.querySelector('.pw-root'), null, 12000), 'runner: opens');
  await t.until(() => !!document.querySelector('.pw-tut'), null, 8000);
  for (let i = 0; i < 8 && (await ev(() => !!document.querySelector('.pw-tut'))); i++) {
    const before = await ev(() => document.querySelector('.pw-tut').innerHTML);
    await ev(() => { const b = document.querySelector('.pw-tut [data-go]') || document.querySelector('.pw-tut [data-next]'); if (b) b.click(); });
    await t.until((b) => { const c = document.querySelector('.pw-tut'); return !c || c.innerHTML !== b; }, before, 3000);
  }
  ok(await t.until(() => { const o = document.querySelector('.pw-ov'); return !!o && o.hidden; }, null, 15000), 'runner: countdown ends');
  await H.settle();
};

// in-page watcher: every frame until the Dig prompt and the bubble have both been up for 30 frames (or maxMs): collects overlaps
const watchFn = async (maxMs) => {
  const R = (e) => e.getBoundingClientRect();
  const vis = (e) => { if (!e || e.closest('[hidden]')) return false; const r = R(e), cs = getComputedStyle(e); return r.width > 2 && r.height > 2 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05; };
  const hit = (a, b, sh) => { const dx = (a.right - a.left) * (sh || 0), dy = (a.bottom - a.top) * (sh || 0); return a.left + dx < b.right && a.right - dx > b.left && a.top + dy < b.bottom && a.bottom - dy > b.top; };
  const out = { both: 0, frames: 0, hints: 0, bad: [], text: '', prompt: '', coinsSeen: 0 };
  const t0 = performance.now(); let hold = 0;
  while (performance.now() - t0 < maxMs && hold < 30) {
    await new Promise((r) => requestAnimationFrame(r)); out.frames++;
    const dog = document.querySelector('.pw-dog'), say = document.querySelector('.pw-say'), pr = document.querySelector('.pw-prompt'), st = document.querySelector('.pw-stage');
    if (!dog || !st) break;
    const d = R(dog), sr = R(st);
    document.querySelectorAll('.pw-hint').forEach((h) => {
      if (!vis(h)) return; const hr = R(h); if (hr.right < sr.left || hr.left > sr.right) return; out.hints++;
      if (hit(hr, d, 0.1)) out.bad.push('hint on the dog');
      document.querySelectorAll('.pw-coin:not(.pw-got)').forEach((c) => { if (vis(c) && hit(hr, R(c), 0.15)) out.bad.push('hint on a coin'); });
    });
    if (vis(say) && vis(pr)) {
      hold++; out.both++; out.text = say.textContent; out.prompt = pr.textContent; const a = R(say), b = R(pr);
      if (hit(a, b)) out.bad.push(`bubble and prompt overlap (${[a.left, a.top, a.right, a.bottom].map(Math.round)} vs ${[b.left, b.top, b.right, b.bottom].map(Math.round)})`);
      if (hit(a, d)) out.bad.push('bubble on the dog');
      if (hit(b, d)) out.bad.push('prompt on the dog');
      if (b.top < sr.top - 1) out.bad.push('prompt above the stage');
    }
  }
  out.bad = [...new Set(out.bad)];
  return out;
};

// the Dig prompt + bubble (first walk: the bubble hints at the dig) and the hints while we wait for it
const digCheck = async (H, tag, touch) => {
  const { ev, ok } = H;
  const r = await ev(`(${watchFn})(70000)`);
  ok(r.both >= 10, `${tag} runner: the Dig prompt and the dog's bubble were up together (${r.both} frames)`);
  ok(r.bad.length === 0, `${tag} runner: bubble, Dig prompt, hints, dog and coins stay clear of each other${r.bad.length ? ' -> ' + r.bad.slice(0, 4).join(' | ') : ''}`);
  if (r.both) {
    if (touch) ok(/Tap Dig/.test(r.text) && !/Press D/.test(r.text) && /tap/i.test(r.prompt), `${tag} runner: touch wording ("${r.text}" / "${r.prompt}")`);
    else ok(/Press D/.test(r.text) && /\(D\)/.test(r.prompt), `${tag} runner: keyboard wording ("${r.text}" / "${r.prompt}")`);
  }
};

module.exports = {
  name: 'runner',
  async phone(H, w, h, tag) {
    const { t, ev, ok } = H;
    await startRunner(H, true);
    // legend: exact touch wording, and the strip, legend and controls read as one group
    const g = await ev(() => {
      const R = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
      const lg = document.querySelector('.pw-lg-touch'), vs = (e) => e && e.offsetParent !== null;
      return { text: lg ? lg.textContent.replace(/\s+/g, ' ').trim() : '', vis: vs(lg), hud: R('.pw-hud'), stage: R('.pw-stage'), legend: R('.pw-legend'), duck: R('.pw-duck'), jump: R('.pw-jump'), bag: R('.pw-bagb'), pause: R('.pw-pauseb'), vh: innerHeight };
    });
    ok(g.vis && g.text === LEGEND, `${tag} runner: the touch legend reads exactly "${LEGEND}" (got "${g.text}")`);
    ok(Math.abs(g.bag.top - g.pause.top) < 6 && Math.abs(g.bag.bottom - g.pause.bottom) < 6, `${tag} runner: the pause button is in the bag row (bag ${Math.round(g.bag.top)}, pause ${Math.round(g.pause.top)})`);
    const gap = Math.min(g.duck.top, g.jump.top) - g.legend.bottom, above = g.stage.top - g.hud.bottom, below = g.vh - Math.max(g.duck.bottom, g.jump.bottom);
    ok(gap >= 0 && gap < 40, `${tag} runner: the controls sit right under the legend (gap ${Math.round(gap)} px, limit 40)`);
    ok(above < 150 && below < 220, `${tag} runner: the group is balanced (space above the strip ${Math.round(above)} px < 150, below the controls ${Math.round(below)} px < 220)`);
    ok(g.stage.width >= w - 2, `${tag} runner: the strip is full width`);
    await digCheck(H, tag, true);
    await t.quitWalk(true);
  },
  async desk(H) {
    const { t, ev, ok } = H;
    await startRunner(H, true);
    const lg = await ev(() => { const l = document.querySelector('.pw-lg-desk'); return { vis: !!l && l.offsetParent !== null, text: l ? l.textContent : '' }; });
    ok(lg.vis && /Space/.test(lg.text), 'desktop runner: the keyboard legend is unchanged');
    await digCheck(H, 'desktop', false);
    await t.quitWalk(true);
  },
  async once(H) {
    // a touch tablet (1024x768, coarse pointer): Duck/Jump under the strip, the touch legend shows
    const { t, ev, ok, vp } = H;
    await vp(1024, 768);
    await startRunner(H, true);
    const g = await ev(() => {
      const R = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
      const lg = document.querySelector('.pw-legend'), vs = lg && lg.offsetParent !== null && getComputedStyle(lg).display !== 'none';
      const t = document.querySelector('.pw-lg-touch');
      return { coarse: matchMedia('(pointer: coarse)').matches, vis: vs, touchVis: !!t && t.offsetParent !== null, text: t ? t.textContent.replace(/\s+/g, ' ').trim() : '', stage: R('.pw-stage'), duck: R('.pw-duck'), jump: R('.pw-jump'), legend: R('.pw-legend'), dog: R('.pw-dog') };
    });
    ok(g.coarse, 'tablet runner: the pointer is coarse');
    ok(g.vis && g.touchVis && g.text === LEGEND, `tablet runner: the touch legend shows (got "${g.text}")`);
    ok(g.duck.top >= g.stage.bottom - 1 && g.jump.top >= g.stage.bottom - 1, `tablet runner: Duck/Jump are below the strip (stage bottom ${Math.round(g.stage.bottom)}, buttons ${Math.round(g.duck.top)}/${Math.round(g.jump.top)})`);
    ok(g.legend.top >= g.stage.bottom - 1 && g.legend.bottom <= Math.min(g.duck.top, g.jump.top) + 1, 'tablet runner: the legend sits between the strip and the buttons');
    ok(g.duck.bottom <= 768 && g.jump.bottom <= 768, 'tablet runner: the buttons fit the screen');
    await digCheck(H, 'tablet', true);
    await t.quitWalk(true);
    await vp(390, 844);
  }
};
