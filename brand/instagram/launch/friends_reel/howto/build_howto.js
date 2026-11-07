// The Friends how-to Reel (owner, 7 Nov 2026: "put some in-game content, teach players how to use the function, how they can share the code through
// WhatsApp, IG, other social media platforms with the poster"). PREVIEW for the owner's approval: never posted before the owner says yes.
// A ~35 s how-to in Noodle's voice (Kokoro af_bella 1.1x, ../vo_friends.py with VO_LINES=howto/vo_howto.json) with burned-in subtitles:
//   hook   "How to add friends in Doodle Doggo" / "share your code in 3 taps" over Mochi at home (clean footage)
//   1.     tap More, then Friends                  (the REAL game screens, a crayon finger and ripple on each tap)
//   2.     pick a name, get your code              (the name wheels turning to Sunny Biscuit, then our card DOG-K3APZ)
//   3.     tap Share poster, send it anywhere      (the game's own poster; a CRAYON share menu with the app names as text only, no logos;
//                                                  then the poster in a crayon phone as a chat message and as a story: no real app UI)
//   4.     your friend adds you                    (a tap on the link in the chat, then the friend's real Add a friend boxes and "Sunny Biscuit is your friend now!")
//   5.     you're friends                          (clean footage: visit and pet, a gift, the walk together), "no chat. no messages."
//   end    the code swap (owner, 7 Nov 2026: our account holds 50 friends, so never "add us"): "drop your friend code below / and add each other!"
//          over comment bubbles with blank code boxes (DOG- and five empty boxes) and two-way arrows, then the shared end card (brand/kids/endcard.js)
// Every frame: centreCheck(), safeCheck() and apartCheck() (centre_text.js); the build stops on the first miss.
//
//   NODE_PATH=$(npm root -g) OUR_CODE=DOG-K3APZ OUR_NAME=0,0 node brand/instagram/launch/friends_reel/howto/build_howto.js <game checkout> <ui footage> <clean footage> <workdir> <vo dir>
//   <ui footage>: capture_howto.js; <clean footage>: ../capture_clean.js with DOG_HEAD= DOG_NAME=Mochi; <vo dir>: ../vo_friends.py with VO_LINES=howto/vo_howto.json
//   ONLY=stills   key frames only (workdir/stills/*.png)     ONLY=cover   the cover only (its own design, friends-howto-cover-PREVIEW.jpg)
//   CHECK=1       run every frame's checks without writing it (fast)
//   FRAMES=a-b    re-render only frames a..b (the rest of workdir/f stays), then encode again      PAR=n   n pages render at once
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../../centre_text.js');
const { loadArt, cardSVG, FIT_JS, apartRects } = require('../friends_card.js');
const { HOWTO_JS } = require('./howto_art.js');
const { ENDCARD_JS, handles } = require('../../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..', '..');
const [DEV, UI, CLEAN, WORK, VO] = process.argv.slice(2, 7).map((x) => path.resolve(x));
if (!VO) throw new Error('usage: build_howto.js <game checkout> <ui footage> <clean footage> <workdir> <vo dir>');
fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const OUTDIR = __dirname;
const VOD = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')).dur;
const LAY = JSON.parse(fs.readFileSync(path.join(UI, 'layout.json'), 'utf8'));
const CODE = process.env.OUR_CODE; if (!CODE || CODE !== LAY.code) throw new Error('OUR_CODE must be our real code, as in the footage (' + LAY.code + ')');
const NAMEI = (process.env.OUR_NAME || '0,0').split(',').map(Number);
const FPS = 30, W = 1080, H = 1920;
const PEN = '#5B3D32', GREEN = '#4E9A54', PINK = '#F28FA5', PAPER = '#FFF8EC', YEL = '#FFE3A1';

// ---- our card (the game's card art, QR and code face: ../friends_card.js) ----
const ART = loadArt(DEV);
const dcSrc = fs.readFileSync(path.join(DEV, 'game', 'src', '40_dogcards.js'), 'utf8');
const words = (k) => JSON.parse(dcSrc.match(new RegExp('const ' + k + ' = (\\[[\\s\\S]*?\\]);'))[1].replace(/'/g, '"'));
const OUR_NAME = words('DC_WORDS_A')[NAMEI[0]] + ' ' + words('DC_WORDS_B')[NAMEI[1]];
if (OUR_NAME !== 'Sunny Biscuit') throw new Error('our name is ' + OUR_NAME);
const CARD = cardSVG(ART, { code: CODE, name: OUR_NAME, nameFont: 'Caveat' });
const LINK = ART.link.replace(/^https?:\/\//, '') + CODE; // doodledoggo.app/f/DOG-K3APZ
const inner = (s) => s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, '')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
const POSTER = 'file://' + path.join(UI, 'poster.png');

// ---- the words (the game's own button names: fr.* in game/i18n/en.json) ----
const TX = {
  hook: [{ s: 'How to add friends', size: 82, pitch: 96 }, { s: 'in Doodle Doggo', size: 82 }], hookSub: 'share your code in 3 taps',
  s1: 'tap More, then Friends', s2: 'pick a name, get your code', s3: 'tap Share poster', s3b: 'send it anywhere', s4: 'your friend adds you',
  s5: "you're friends!", feats: ['visit & pet', 'send a gift', 'walk together'], safe: 'no chat. no messages.', theirs: "your friend's phone",
  chat: 'a chat', story: 'a story', endA: 'drop your friend code below', endB: 'and add each other!', // owner, 7 Nov 2026: our account holds 50 friends, so the ask is a code swap, never "add us"
};
const SUBS_TX = {
  hook: ['How to add friends in Doodle Doggo.', 'Three taps.', 'I counted.'],
  s1: ['Tap More.', 'Then Friends.'],
  s2: ['Pick a friend name.', 'Now you have a card,', 'with your own code.'],
  s3: ['Tap Share poster.'],
  s3b: ['Send it anywhere!', 'WhatsApp, your story,', 'the group chat.'],
  s4: ['Your friend opens the link,', 'or types your code in Add a friend.', 'Then taps Add.'],
  s5a: ["You're friends!", 'Visit their yard.', 'Pet their dogs.'], s5b: ['Send a gift.'], s5c: ['Walk together.'],
  safe: ['No chat. No messages.', 'Just dogs.'],
  end: ['Drop your friend code below,', 'and add each other!'],
};

// ---- the timeline ----
// win shots: { at (s from the shot's start), ui: still name | clip: name, crop {x,y,w,h} in CSS px of the 393 x 659 phone } or { chat: true }
const C1 = { x: 0, y: 300, w: 393, h: 359 }, C2 = { x: 0, y: 12, w: 393, h: 578 }, C3 = { x: 0, y: 58, w: 393, h: 318 }, C4 = { x: 0, y: 292, w: 393, h: 268 }, C5 = { x: 0, y: 58, w: 393, h: 490 };
const mid = (r) => [r.x + r.w * 0.62, r.y + r.h * 0.66]; // a tap a little low and right of a button's middle: its words stay readable under the finger
const SEG = [], VOAT = []; let at = 0;
const say = (k, d) => VOAT.push({ k, at: at + (d == null ? 0.15 : d) });
const seg = (len, o) => { SEG.push(Object.assign({ a: at, b: at + len, i: SEG.length }, o)); at += len; };
const V = (k, p) => VOD[k] + (p == null ? 0.4 : p);
say('hook', 0.2); seg(V('hook', 0.35), { kind: 'full', clip: 'yard', from: 0.1, view: { z0: 1.05, z1: 1.12, fx: 0.5, fy0: 0.7, fy1: 0.71 }, cap: { hook: true } });
say('s1', 0.25); seg(Math.max(V('s1'), 2.4), { kind: 'win', cap: { n: 1, s: TX.s1 }, shots: [{ at: 0, ui: 'yard_ui', crop: C1 }, { at: 1.0, ui: 'more_tray', crop: C1 }],
  taps: [{ at: 0.6, p: mid(LAY.more), ang: 62 }, { at: 1.6, p: mid(LAY.friends), ang: 28 }] });
say('s2'); seg(V('s2', 0.5), { kind: 'win', cap: { n: 2, s: TX.s2 }, shots: [{ at: 0, clip: 'name', from: 0, crop: C2 }, { at: 2.0, ui: 'card', crop: C3 }],
  taps: [{ at: 1.7, p: mid(LAY.ok), ang: -140 }], ring: { at: 2.35, p: [LAY.card.x + 222 / 300 * LAY.card.w, LAY.card.y + 128 / 200 * LAY.card.h], rx: 68, ry: 26 } });
say('s3'); seg(V('s3', 0.6), { kind: 'win', cap: { n: 3, s: TX.s3 }, shots: [{ at: 0, ui: 'card', crop: C3 }], taps: [{ at: 0.55, p: mid(LAY.poster), ang: 22 }] });
const S3B = at; say('s3b', 0.1); seg(1.75, { kind: 'share', cap: { n: 3, s: TX.s3b } }); seg(Math.max(2.7, VOD.s3b + 0.1 + 0.8 - 1.75), { kind: 'spread', cap: { n: 3, s: TX.s3b, keep: true } });
say('s4'); seg(V('s4', 0.95), { kind: 'win', cap: { n: 4, s: TX.s4 }, theirs: 1.45,
  shots: [{ at: 0, chat: true }, { at: 1.45, ui: 'add_0', crop: C4 }].concat([1, 2, 3, 4, 5].map((i) => ({ at: 1.55 + i * 0.27, ui: 'add_' + i, crop: C4 }))).concat([{ at: 3.9, ui: 'add_done', crop: C5 }]),
  taps: [{ at: 0.8, chat: true, ang: 24 }, { at: 3.62, p: mid(LAY.f_addBtn), ang: -30, shot: 'add_5' }] });
const ADDED = at - (V('s4', 0.95) - 3.9);
say('s5a'); seg(V('s5a', 0.35), { kind: 'full', clip: 'visit', from: 0.2, band: { x0: 0, y0: 700, w: 1179, h: 1277 }, cap: { n: 5, s: TX.s5 }, feat: TX.feats[0] });
say('s5b', 0.1); seg(V('s5b', 0.45), { kind: 'full', clip: 'gift', from: 0.15, band: { x0: 0, y0: 560, w: 1179, h: 1277 }, cap: { n: 5, s: TX.s5, keep: true }, feat: TX.feats[1] });
say('s5c', 0.1); seg(V('s5c', 0.75), { kind: 'full', clip: 'walk', from: 1.8, band: { x0: 0, y0: 720, w: 540, h: 540 }, cap: { n: 5, s: TX.s5, keep: true }, feat: TX.feats[2] });
// (the play bows from 3.1 s at 0.6x: Mochi's play jumps from 4.84 s come too close to Honey for apartCheck)
say('safe'); seg(V('safe', 0.4), { kind: 'full', clip: 'visit', from: 3.1, rate: 0.6, band: { x0: 0, y0: 700, w: 1179, h: 1277 }, cap: { s: TX.safe, green: true } });
const END = at; say('end', 0.25); seg(VOD.end + 1.0, { kind: 'end' });
const ENDC = at; seg(2.5, { kind: 'endcard' });
const T = at, N = Math.round(T * FPS);
if (process.env.TIMES) { SEG.forEach((x) => console.log(x.kind.padEnd(8), (x.cap && x.cap.s) || '', 'frames', Math.floor(x.a * FPS) + '-' + (Math.ceil(x.b * FPS) - 1), x.a.toFixed(2) + '-' + x.b.toFixed(2) + ' s')); console.log('N', N); process.exit(0); } // TIMES=1: each part's frames, for FRAMES=a-b

// subtitles: each line in short chunks, timed by their share of the line (letters, plus a breath at a full stop: Kokoro gives no word times)
const SUBS = [];
VOAT.forEach((v) => { const parts = SUBS_TX[v.k]; if (!parts) throw new Error('no subtitles for ' + v.k);
  const wt = parts.map((x) => x.length + (/[.!?:]$/.test(x) ? 6 : 2)), sum = wt.reduce((a, b) => a + b, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d, s: x }); t0 += d; }); });
SUBS.forEach((u, i) => { const nx = SUBS[i + 1]; u.b = nx ? Math.min(nx.a, u.b + 0.35) : Math.min(ENDC, u.b + 0.6); });

// ---- footage ----
const CL = {};
const clipOf = (dir) => { if (CL[dir]) return CL[dir]; const ts = JSON.parse(fs.readFileSync(path.join(dir, 'ts.json'), 'utf8'));
  const bx = fs.existsSync(path.join(dir, 'boxes.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'boxes.json'), 'utf8')) : ts.map(() => []);
  return CL[dir] = { ts, bx, file: (i) => path.join(dir, String(i).padStart(5, '0') + '.jpg') }; };
const pick = (c, g) => { let i = 0; while (i + 1 < c.ts.length && c.ts[i + 1] <= g) i++; return i; };
const stillBoxes = (dir, n) => { const f = path.join(dir, n + '.boxes.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : []; };
// the window on the paper: the crop fitted into x 60..890, y 556..1426 (under the step card and the subtitle), centred on x 475
const geo = (c) => { const k = Math.min(830 / c.w, 870 / c.h), w = c.w * k, h = c.h * k; return { X: 475 - w / 2, Y: 556, k, w, h, c }; };
// what one frame shows: the picture, where it goes, the dogs' rects for apartCheck, the taps
function resolve(t) {
  const s = SEG.find((x) => t >= x.a && t < x.b) || SEG[SEG.length - 1], lt = t - s.a, R = { img: null, apart: '', taps: [] };
  if (s.kind === 'full') {
    const c = clipOf(path.join(CLEAN, s.clip)), i = pick(c, s.from + lt * (s.rate || 1)), bx = c.bx[i] || []; R.img = 'file://' + c.file(i);
    if (s.band) { // a window on the paper (source rect x0, y0, w, h of the 1179 x 1977 shot), fitted into x 60..890, y 556..1426 like the game screens:
      // the dogs stay inside SAFE, clear of the platforms' captions at the bottom (full frame, they would stand under them)
      const B = s.band, k = Math.min(830 / B.w, 800 / B.h), X = 475 - B.w * k / 2, dy = 556; // 800 tall: the feature pill sits on its foot
      R.place = { tx: X - B.x0 * k, ty: dy - B.y0 * k, s: k, clip: [B.y0, 1179 - B.x0 - B.w, 1977 - B.y0 - B.h, B.x0], round: 34 / k };
      R.frame = { x: X, y: dy, w: B.w * k, h: B.h * k };
      R.apart = apartRects(bx, (x, y) => [X + (x * 3 - B.x0) * k, dy + (y * 3 - B.y0) * k], [B.x0 / 3, B.y0 / 3, (B.x0 + B.w) / 3, (B.y0 + B.h) / 3]);
    } else { const u = Math.max(0, Math.min(1, lt / (s.b - s.a))), e = u * u * (3 - 2 * u), z = s.view.z0 + (s.view.z1 - s.view.z0) * e, fy = s.view.fy0 + (s.view.fy1 - s.view.fy0) * e;
      const k = H / 1977 * z, w = 1179 * k, h = 1977 * k, l = Math.min(0, Math.max(W - w, W / 2 - s.view.fx * w)), tp = Math.min(0, Math.max(H - h, H / 2 - fy * h));
      R.place = { tx: l, ty: tp, s: k, clip: null };
      R.apart = apartRects(bx, (x, y) => [l + x * 3 * k, tp + y * 3 * k], [-l / (3 * k), -tp / (3 * k), (W - l) / (3 * k), (H - tp) / (3 * k)]); }
  } else if (s.kind === 'win') {
    let sh = s.shots[0]; s.shots.forEach((x) => { if (lt >= x.at) sh = x; });
    if (sh.chat) R.chat = true;
    else { const g = geo(sh.crop); let file, bx;
      if (sh.clip) { const c = clipOf(path.join(UI, sh.clip)), i = pick(c, sh.from + (lt - sh.at)); file = c.file(i); bx = c.bx[i] || []; }
      else { file = path.join(UI, sh.ui + '.png'); bx = stillBoxes(UI, sh.ui); }
      R.img = 'file://' + file; const c = g.c;
      R.place = { tx: g.X - c.x * g.k, ty: g.Y - c.y * g.k, s: g.k / 3, clip: [c.y * 3, 1179 - (c.x + c.w) * 3, 1977 - (c.y + c.h) * 3, c.x * 3], round: 34 * 3 / g.k };
      R.frame = { x: g.X, y: g.Y, w: g.w, h: g.h };
      R.apart = apartRects(bx, (x, y) => [g.X + (x - c.x) * g.k, g.Y + (y - c.y) * g.k], [c.x, c.y, c.x + c.w, c.y + c.h]);
      const shotAt = (x) => { let r = s.shots[0]; s.shots.forEach((q) => { if (x >= q.at) r = q; }); return r; };
      (s.taps || []).forEach((tp) => { if (tp.chat || shotAt(tp.at) !== sh) return; const tl = lt - tp.at; /* a tap shows only on the screen it taps */ if (tl < -0.45 || tl > 0.55) return; R.taps.push({ x: g.X + (tp.p[0] - c.x) * g.k, y: g.Y + (tp.p[1] - c.y) * g.k, ang: tp.ang, lt: tl }); });
      if (s.ring && lt >= s.ring.at && sh.ui === 'card') R.ring = { x: g.X + (s.ring.p[0] - c.x) * g.k, y: g.Y + (s.ring.p[1] - c.y) * g.k, rx: s.ring.rx * g.k, ry: s.ring.ry * g.k, q: Math.min(1, (lt - s.ring.at) / 0.35) };
      if (s.theirs != null && lt >= s.theirs && g.Y + g.h + 44 < 1440) R.theirs = { x: g.X + g.w - 40, y: g.Y + g.h + 8 }; }
    (s.taps || []).forEach((tp) => { if (tp.chat) R.chatTap = { lt: lt - tp.at, ang: tp.ang }; });
  }
  return { s, R };
}

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>${ART.css}html,body{margin:0;background:#fff}#st{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${PAPER}}#scr{position:absolute;left:0;top:0;transform-origin:0 0}#un,#ov{position:absolute;left:0;top:0}</style>
<div id="st"><svg id="un" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg><img id="scr"><svg id="ov" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg></div>
<span style="font:700 20px Andika">a</span><span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
${FIT_JS}
${HOWTO_JS}
${ENDCARD_JS}
const $=(i)=>document.getElementById(i), FAM='Caveat', TX=${JSON.stringify(TX)}, SUBS=${JSON.stringify(SUBS)}, POSTER=${JSON.stringify(POSTER)}, LINK=${JSON.stringify(LINK)};
const LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, CARD=${JSON.stringify(CARD)};
const C=(lines,cx,cy)=>centred(lines,cx,cy,FAM), CX=SAFE_CX;
const back=(x)=>{ x=Math.max(0,Math.min(1,x)); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const ease=(x)=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
const card=(x,y,w,h,stroke,sw,lines,fill)=>'<g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="36" fill="'+(fill||'#FFFDF7')+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>'+C(lines,x+w/2,y+h/2).svg+'</g>';
const bubble=(r,fill,s,size)=>'<g data-box><circle r="'+r+'" fill="'+fill+'" stroke="${PEN}" stroke-width="6"/>'+C([{s,size}],0,0).svg+'</g>';
function fit(lines,maxW){ const wd=Math.max(...lines.map((l)=>{ const k=inkOf(l.s,l.size,FAM); return k.L+k.R; })), f=Math.min(1,maxW/wd);
  return f>=1?lines:lines.map((l)=>Object.assign({},l,{size:Math.floor(l.size*f),pitch:l.pitch?Math.floor(l.pitch*f):undefined})); }
let ENDCARD=null;
// the step card at the top: "n." in a yellow bubble and the step in a card (a small pop as it comes in, not when it is kept)
function stepCard(cp,lt){ const kept=cp.keep, s=kept?1:0.86+0.14*back(lt/0.3), o=kept?1:ease(lt/0.15);
  const L=fit([{s:cp.s,size:60}],cp.n?600:700), k=inkOf(cp.s,L[0].size,FAM), w=k.L+k.R+84, x0=cp.n?SAFE.x0+100:CX-w/2, x=Math.min(x0,SAFE.x1-w);
  return '<g opacity="'+o+'" transform="translate('+CX+' 352) scale('+s+') rotate(-1.5) translate('+(-CX)+' -352)">'+card(x,298,w,108,cp.green?'${GREEN}':'${PEN}',cp.green?6:5,L)
    +(cp.n?'<g transform="translate('+(x-40)+' 352) rotate(-8)">'+bubble(50,'${YEL}',cp.n+'.',66)+'</g>':'')+'</g>'; }
function sub(t,y){ const u=SUBS.find((x)=>t>=x.a&&t<x.b); if(!u) return ''; const o=Math.min(ease((t-u.a)/0.08),ease((u.b-t)/0.08));
  let size=56; const k=inkOf(u.s,size,FAM); if(k.L+k.R>740) size=Math.floor(size*740/(k.L+k.R));
  return pill(u.s,CX,y,size,FAM,{fill:'${PEN}',stroke:'${PEN}',color:'#FFF8EC',padX:30,op:(0.94*o).toFixed(3)}); }
const pop=(lt,a)=>0.85+0.15*back((lt-(a||0))/0.35);
window.frame=async function(t,S,R){
  const img=$('scr'); if(R.img){ if(img.getAttribute('src')!==R.img){ img.src=R.img; await img.decode(); } img.style.display='';
      const P=R.place; img.style.transform='translate('+P.tx+'px,'+P.ty+'px) scale('+P.s+')'; img.style.clipPath=P.clip?'inset('+P.clip.map((v)=>v+'px').join(' ')+' round '+P.round+'px)':''; }
    else img.style.display='none';
  const lt=t-S.a; let un='', ov='', subY=480;
  if(S.kind!=='full'||S.band) un='<rect width="${W}" height="${H}" fill="${PAPER}"/>'+[...Array(19)].map((_,k)=>'<path d="M0 '+(100+k*96)+' H${W}" stroke="#E9DCC8" stroke-width="2" opacity=".45"/>').join('');
  if(R.frame){ const f=R.frame; un+='<rect x="'+(f.x+10)+'" y="'+(f.y+14)+'" width="'+f.w+'" height="'+f.h+'" rx="34" fill="${PEN}" opacity=".12"/>';
    ov+='<rect data-safe x="'+f.x+'" y="'+f.y+'" width="'+f.w+'" height="'+f.h+'" rx="34" fill="none" stroke="${PEN}" stroke-width="6"/>'; }
  if(R.ring){ const g=R.ring, q=ease(R.ring.q); ov+='<ellipse cx="'+g.x+'" cy="'+g.y+'" rx="'+(g.rx*(1.15-0.15*q))+'" ry="'+(g.ry*(1.15-0.15*q))+'" fill="none" stroke="${PINK}" stroke-width="9" opacity="'+(0.85*q)+'" transform="rotate(-4 '+g.x+' '+g.y+')"/>'; }
  if(R.theirs){ const g=R.theirs; ov+='<g transform="rotate(4 '+(g.x-150)+' '+g.y+')">'+pill(TX.theirs,g.x-150,g.y,42,FAM,{fill:'#D9EED0',padX:22})+'</g>'; }
  if(R.chat){ // step 4 opens on the chat: the friend taps our link
    const sw=420, sh=sw*16/9*0.84, sx=CX-sw/2, sy=566, c=hwChat(sx,sy,sw,sh,POSTER,{p:1,link:LINK,id:'a'});
    ov+=hwPhone('ph4',sx,sy,sw,sh,c.svg); if(R.chatTap&&c.link) ov+=hwTap(c.link.x,c.link.y,R.chatTap.ang,R.chatTap.lt); }
  if(S.kind==='share'){ // the poster arrives in the phone's share menu (crayon, app names as text only)
    const sw=440, sh=sw*16/9, sx=CX-sw/2, sy=575+(1-ease(lt/0.25))*30, p=ease((lt-0.3)/0.3), sm=hwShare(sx,sy,sw,sh*0.97,p,lt>1.18?0:-1,FAM);
    ov+='<g opacity="'+ease(lt/0.2)+'">'+hwPhone('ph3',sx,sy,sw,sh*0.97,hwImg(POSTER,sx,sy,sw,sh*0.97)+sm.svg)+'</g>';
    if(p>0.99){ const r=sm.rows[0]; ov+=hwTap(r.x+r.w*0.7,r.y+r.h*0.55,24,lt-1.15); } }
  if(S.kind==='spread'){ // the poster as a chat message and as a story: two crayon phones
    const sw=330, sh=sw*16/9*0.97, y0=600, a=ease(lt/0.25), b=ease((lt-0.55)/0.25);
    const xa=86, xb=522; // the two phones (with their tilt) inside x 60..890
    const ch=hwChat(xa+6,y0,sw-12,sh,POSTER,{p:ease((lt-0.15)/0.3),reply:ease((lt-1.5)/0.3),link:LINK,id:'b'});
    if(a>0) ov+='<g opacity="'+a+'" transform="rotate(-2.5 '+(xa+sw/2)+' '+(y0+sh/2)+')">'+hwPhone('ph5a',xa+6,y0,sw-12,sh,ch.svg)+'</g>'+pill(TX.chat,xa+sw/2,y0+sh+78,48,FAM,{fill:'${YEL}',padX:26,op:a});
    if(b>0) ov+='<g opacity="'+b+'" transform="rotate(2.5 '+(xb+sw/2)+' '+(y0+sh/2)+')">'+hwPhone('ph5b',xb+6,y0,sw-12,sh,hwStory(xb+6,y0,sw-12,sh,POSTER,(lt-0.55)/2.4))+'</g>'+pill(TX.story,xb+sw/2,y0+sh+78,48,FAM,{fill:'${YEL}',padX:26,op:b}); }
  (R.taps||[]).forEach((g)=>{ ov+=hwTap(g.x,g.y,g.ang,g.lt); });
  const cp=S.cap||{};
  if(cp.hook){ const dur=S.b-S.a, o=lt<dur-0.25?1:Math.max(0,1-(lt-dur+0.25)/0.25);
    ov+='<g opacity="'+o+'"><g transform="rotate(-2 '+CX+' 470)">'+card(CX-360,320,720,300,'${PEN}',6,fit(TX.hook,640))+'</g>'
      +'<g transform="rotate(4 '+(CX+60)+' 676)">'+pill(TX.hookSub,CX+60,676,54,FAM,{fill:'${YEL}',padX:28})+'</g></g>'; subY=800; }
  else if(cp.s) ov+=stepCard(cp,lt);
  if(S.feat){ const o=ease(lt/0.15), fy=R.frame?R.frame.y+R.frame.h+6:588; ov+='<g opacity="'+o+'" transform="rotate(2 '+CX+' '+fy+')">'+pill(S.feat,CX,fy,54,FAM,{fill:'${YEL}',padX:28})+'</g>'; }
  if(S.kind==='end'){ // the code swap: players add EACH OTHER (blank code boxes only, never a code that looks real)
    const o=ease(lt/0.3), cs=0.88+0.12*back(lt/0.35);
    ov+='<g opacity="'+o+'" transform="translate('+CX+' 410) scale('+cs+') rotate(-1.5) translate('+(-CX)+' -410)">'+card(CX-385,300,770,220,'${PEN}',6,fit([{s:TX.endA,size:68,pitch:86},{s:TX.endB,size:68,fill:'#C2567A'}],690))+'</g>'
      +hwSwap(CX,590,lt-0.2,{w:600,h:140,gap:76,off:60})
      +'<g opacity="'+ease((lt-1.5)/0.3)+'"><path d="M'+CX+' 1250 q-10 38 0 70 M'+(CX-22)+' 1298 l22 26 l22 -26" fill="none" stroke="${PEN}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>';
    subY=1395; }
  if(S.kind==='endcard'){ if(!ENDCARD) ENDCARD=endCard('tall',HANDLES,LOGO_INNER); un='<rect width="${W}" height="${H}" fill="${PAPER}"/>'; ov='<g opacity="'+ease(lt/0.3)+'">'+ENDCARD+'</g>'; }
  else ov+=sub(t,subY);
  $('un').innerHTML=un; $('ov').innerHTML=ov+'<g id="apart">'+(R.apart||'')+'</g>'; frFit($('ov'));
  const st=$('ov');
  return [].concat(centreCheck(st).map((x)=>'not centred: '+x), safeCheck(st).map((x)=>'outside SAFE: '+x), apartCheck(st).map((x)=>'dogs too close: '+x));
};
</script>`;

// ---- the cover: its own design (not a frame), everything that matters in the grid's middle 1080 x 1440 (y 240..1680) ----
const coverHTML = require('./howto_cover.js').coverHTML({ DEV, POSTER, CARD, LOGO_INNER, CODE });

async function openPage(b, src) {
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const f = path.join(WORK, src === html ? 'page.html' : 'cover.html'); fs.writeFileSync(f, src); await p.goto('file://' + f); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all(['600 40px Caveat', '700 40px Caveat', '700 40px Andika', '700 40px "DD Code"'].map((f) => document.fonts.load(f, 'aDOG-K3APZ'))));
  await p.evaluate(() => document.fonts.ready);
  if (!(await p.evaluate(() => document.fonts.check('700 19px "DD Code"', 'DOG-K3APZ')))) throw new Error('DD Code did not load');
  await p.evaluate((src) => new Promise((r) => { const i = new Image(); i.onload = r; i.onerror = r; i.src = src; }), POSTER);
  return p;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const only = process.env.ONLY || '';
  if (only !== 'cover') {
    const par = Math.max(1, +(process.env.PAR || 1)), pages = [];
    for (let i = 0; i < par; i++) pages.push(await openPage(b, html));
    let list;
    if (only === 'stills') { fs.mkdirSync(path.join(WORK, 'stills'), { recursive: true });
      list = []; SEG.forEach((s) => { [0.2, 0.5, 0.85].forEach((u) => list.push(Math.round((s.a + (s.b - s.a) * u) * FPS))); }); list = [...new Set(list)].filter((f) => f < N); }
    else if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); list = []; for (let f = a; f <= Math.min(z, N - 1); f++) list.push(f); }
    else list = [...Array(N).keys()];
    const out = (f) => only === 'stills' ? path.join(WORK, 'stills', `s${String(f).padStart(4, '0')}.png`) : path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`);
    let done = 0;
    await Promise.all(pages.map(async (p, k) => { for (let j = k; j < list.length; j += par) { const f = list[j], t = f / FPS, { s, R } = resolve(t);
      const bad = await p.evaluate(async ([t, S, R]) => window.frame(t, S, R), [t, s, R]);
      if (bad.length) throw new Error('frame ' + f + ' (' + t.toFixed(2) + ' s, ' + s.kind + '): ' + bad.join('; '));
      if (!process.env.CHECK) await p.screenshot({ path: out(f) }); if (++done % 100 === 0) console.log(done, '/', list.length); } }));
    console.log(list.length, 'frames, T =', T.toFixed(2), 's,', N, 'in all');
    for (const p of pages) await p.close();
  }
  if (only === 'cover' || only === 'stills' || !only) {
    const p = await openPage(b, coverHTML);
    const bad = await p.evaluate(() => window.cover()); if (bad.length) throw new Error('cover: ' + bad.join('; '));
    await p.waitForTimeout(300);
    const f = path.join(OUTDIR, 'friends-howto-cover-PREVIEW.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 92 }); console.log('wrote', f);
  }
  await b.close();
  if (only) return;

  // sound: the game's own music (the yard by day), a soft tap on each tap, the game's "sparkle" when the friend is added, "discover" on the end page
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.7, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: ADDED + 0.05, name: 'sparkle' }, { at: END + 0.1, name: 'discover' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  await ab.close();
  const tap = path.join(WORK, 'tap.wav');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=880:duration=0.09', '-af', 'afade=t=out:st=0:d=0.09,volume=0.5', '-ar', '44100', tap]);
  const TAPS = []; SEG.forEach((s) => { (s.taps || []).forEach((tp) => TAPS.push(s.a + tp.at)); if (s.kind === 'share') TAPS.push(s.a + 1.15); });
  const inputs = [], chains = [], labels = [];
  VOAT.forEach((v, i) => { inputs.push('-i', path.join(VO, v.k + '.wav')); const d = Math.round(v.at * 1000); chains.push(`[${inputs.length / 2 + 1}:a]aresample=44100,volume=1.5,adelay=${d}|${d}[v${i}]`); labels.push(`[v${i}]`); });
  TAPS.forEach((tt, i) => { inputs.push('-i', tap); const d = Math.round(tt * 1000); chains.push(`[${inputs.length / 2 + 1}:a]adelay=${d}|${d}[t${i}]`); labels.push(`[t${i}]`); });
  const mix = `[1:a]atrim=0:${T},volume=0.3,afade=t=out:st=${(T - 0.8).toFixed(2)}:d=0.8[m];` + chains.join(';') + ';' + `[m]${labels.join('')}amix=inputs=${labels.length + 1}:normalize=0,alimiter=limit=0.89:level=false,atrim=0:${T}[a]`;
  const out = path.join(OUTDIR, 'doodle-doggo-friends-howto-PREVIEW.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), out]);
  console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
