// The frozen page clock for every capture of moving game footage (owner, 17 Nov 2026: "Next time please be careful to implement
// in-game videos"). Real-time seek + screenshot (or a screen recording) lands each frame 15-200 ms late by a different amount, so the
// motion stutters. With this, performance.now() and requestAnimationFrame run on a virtual clock that only moves when step() is called
// (every queued frame callback runs with the new time), and every CSS animation is paused and set to its age on that clock.
// Frame n is then exactly from + n x 1000/FPS ms. First used in gift_reel/capture_gift.js.
//
//   const { freezeClock, stepClock, releaseClock } = require('../frozen_clock.js');
//   const t0 = await freezeClock(page);                       // returns the virtual time now
//   for (let n = 0; n < N; n++) { await stepClock(page, t0 + n * 1000 / 30); await page.screenshot({ ..., animations: 'allow' }); }
//   await releaseClock(page);                                 // the real clock again
//
// Then check the finished video frame by frame with checkFrames() (no doubled frames, no jumps) before it goes to the owner.
const FREEZE = () => {
  if (window.__vclock) return window.__vclock.now();
  const P = performance, real = P.now.bind(P), raf = window.requestAnimationFrame.bind(window); let v = real(), q = [];
  const born = new WeakMap();
  window.__vclock = {
    now: () => v,
    step: (to) => { v = to; const cbs = q; q = []; for (const cb of cbs) { try { cb(v); } catch (e) { /* a game callback */ } }
      for (const a of document.getAnimations()) { if (!born.has(a)) born.set(a, v); a.pause(); a.currentTime = Math.max(0, v - born.get(a)); } },
    release: () => { P.now = real; window.requestAnimationFrame = raf; const cbs = q; q = []; cbs.forEach((cb) => raf(cb));
      document.getAnimations().forEach((a) => a.play()); delete window.__vclock; },
  };
  P.now = () => v; window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  return v;
};
const freezeClock = (page) => page.evaluate(FREEZE);
const stepClock = (page, to) => page.evaluate((t) => window.__vclock.step(t), to);
const releaseClock = (page) => page.evaluate(() => window.__vclock && window.__vclock.release());

// checkFrames(mp4, a, b): the mean pixel change between frames a..b of a finished video, via python3 + opencv. Returns
// { diffs, doubled, jumps }: doubled = frames that barely change inside a moving run, jumps = changes over 3x the median (beat cuts show up
// here too: check each one is a real cut). Run it on every scene, walk or animation run of a Reel.
function checkFrames(mp4, a, b) {
  const py = `import cv2,numpy as np,json,sys
c=cv2.VideoCapture(sys.argv[1]);a,b=int(sys.argv[2]),int(sys.argv[3]);p=None;i=0;d=[]
while True:
  ok,f=c.read()
  if not ok or i>b: break
  if i>=a:
    g=cv2.cvtColor(f,cv2.COLOR_BGR2GRAY).astype(np.float32)
    if p is not None: d.append([i,round(float(np.abs(g-p).mean()),2)])
    p=g
  i+=1
print(json.dumps(d))`;
  const diffs = JSON.parse(require('child_process').execFileSync('python3', ['-c', py, mp4, String(a), String(b)], { encoding: 'utf8' }));
  const v = diffs.map((x) => x[1]).filter((x) => x > 0.05).sort((x, y) => x - y), med = v.length ? v[v.length >> 1] : 0;
  return { diffs, median: med, doubled: diffs.filter((x) => med && x[1] < 0.1 * med).map((x) => x[0]), jumps: diffs.filter((x) => med && x[1] > 3 * med).map((x) => x[0]) };
}
module.exports = { FREEZE, freezeClock, stepClock, releaseClock, checkFrames };
