// v2.19 "Friends first" launch Reel: "4 ways your dog can make friends (no chat)" (owner's go-ahead 2 Nov 2026; plan docs/marketing/V219_FRIENDS_FIRST.md).
// CLEAN version (owner, 2 Nov 2026: "without the game buttons, make it clean, introduce the upcoming update"): real v2.19 scenes with every game bar,
// button, sheet and speech bubble hidden (capture_clean.js), one short label per feature, a "new update · 7 Nov" sticker, and an end page with OUR
// friend card drawn from the game's own card art and QR (PawArt.FRIENDS.card + mods/qr.js), asking for friend codes in the comments.
// Told by Noodle the dachshund like our first video, the 45 s promo (owner, 2 Nov 2026): vo_friends.py makes the voice (Kokoro af_bella 1.1x) and
// each shot lasts its line; the game's music sits at 30% under the voice.
// 1080 x 1920, 30 fps, Noodle's voice over the game's own cozy music (the yard by day) and the "discover" sting on the end page.
//
//   [OUR_CODE=DOG-XXXXX OUR_NAME=a,b] NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/build_friends.js <game checkout> <clean footage dir> <workdir> <vo dir>
//   ONLY=stills renders key frames only. The cover: make_friends_cover.js. REDNOTE=1: every word in Simplified Chinese, no game link anywhere (after the owner approves).
// OUR_CODE / OUR_NAME (Dog Card word indices) are the Doodle Doggo account's real friend code and name from the live game on 7 Nov. Without OUR_CODE
// the end page's card carries a red "placeholder" patch over the code and the QR: a preview for the owner, never posted.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js'); // owner's rule: text in every box sits in its exact centre; SAFE_JS has apartCheck() too
const { loadArt, cardSVG, FIT_JS, apartRects } = require('./friends_card.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const DEV = path.resolve(process.argv[2] || '.'), FOOT = path.resolve(process.argv[3] || 'friends_footage');
const WORK = path.resolve(process.argv[4] || 'friends_work'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const VO = path.resolve(process.argv[5] || 'vo'); // Noodle's voice-over (vo_friends.py): <line>.wav and vo.json with each line's length
const VOD = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')).dur;
const RN = !!process.env.REDNOTE, SUF = RN ? '-rednote' : '';
const fam = RN ? "'LXGW WenKai', Caveat" : 'Caveat';
const FPS = 30, W = 1080, H = 1920;
const LAY = { code: process.env.OUR_CODE || '', name: (process.env.OUR_NAME || '25,6').split(',').map(Number) };
const PLACEHOLDER = !LAY.code;

// ---- our card, drawn as the v2.19 game draws it (friends_card.js: the card art, the QR or, on RedNote, a pink paw, the name, the code in DD Code) ----
const ART = loadArt(DEV);
const dcSrc = fs.readFileSync(path.join(DEV, 'game', 'src', '40_dogcards.js'), 'utf8');
const words = (k) => JSON.parse(dcSrc.match(new RegExp('const ' + k + ' = (\\[[\\s\\S]*?\\]);'))[1].replace(/'/g, '"'));
// RedNote: the name as the zh-Hans game shows it (its Dog Card words, fr.name "{a}{b}" with no space)
const ZH = RN ? JSON.parse(fs.readFileSync(path.join(DEV, 'game', 'i18n', 'zh-Hans.json'), 'utf8')) : null; // flat keys: data.dc_words_a.<i>
const OUR_NAME = RN ? ZH['data.dc_words_a.' + LAY.name[0]] + ZH['data.dc_words_b.' + LAY.name[1]] : words('DC_WORDS_A')[LAY.name[0]] + ' ' + words('DC_WORDS_B')[LAY.name[1]];
const CARD = cardSVG(ART, { code: PLACEHOLDER ? '' : LAY.code, name: OUR_NAME, nameFont: RN ? 'LXGW WenKai' : 'Caveat', rn: RN });

// ---- the words ----
const TX = RN ? {
  // RedNote (owner, 2 Nov 2026): the game's zh-Hans Friends words (fr.*, nw.v219.*), no link anywhere; "no chat, no messages", never "no typing"
  hook: [{ s: '狗狗交朋友的', size: 84, pitch: 100 }, { s: '4种方式', size: 84, pitch: 92 }, { s: '（不用聊天）', size: 56, fill: '#8A7468' }],
  update: '新版本 · 11月7日',
  ways: ['去院子做客', '留个爪印', '送一份礼物', '一起散步'], code: '分享你的好友码', safe: '没有聊天，没有私信。',
  endAsk: '加我们好友！', endSub: '在评论区留下你的好友码',
  ph: '占位：11月7日换成真的好友码',
} : {
  // owner, 2 Nov 2026: clean, short labels that name each feature, as our earlier Reels did; not sentences
  hook: [{ s: '4 ways your dog', size: 84, pitch: 98 }, { s: 'can make friends', size: 84, pitch: 92 }, { s: '(no chat)', size: 60, fill: '#8A7468' }],
  update: 'new update · 7 Nov',
  ways: ['visit & pet', 'paw-print note', 'send a gift', 'walk together'], code: 'share your code', safe: 'no chat. no messages.',
  endAsk: 'add us!', endSub: 'drop your code below',
  ph: 'placeholder: our real code on 7 Nov',
};

// ---- the timeline: [start, end, source, from (clip seconds), view { z0, z1, fx, fy0, fy1 }, caption] ----
const SEG = []; let at = 0;
const seg = (len, src, from, view, cap) => { SEG.push({ a: at, b: at + len, src, from, view, cap }); at += len; };
// owner, 2 Nov 2026: told by Noodle like our first video (the 45 s promo). Each shot lasts its voice line plus a short breath; the line starts 0.15 s in
const VOAT = []; const say = (k, d) => VOAT.push({ k, at: at + (d == null ? 0.15 : d) }), len = (k, pad) => VOD[k] + (pad == null ? 0.4 : pad);
say('hook'); seg(len('hook', 0.5), 'yard', 0.1, { z0: 1.05, z1: 1.12, fx: 0.5, fy0: 0.7, fy1: 0.71 }, { hook: true });
say('code'); seg(len('code'), 'code', 0, null, { s: TX.code, card: true });
say('visit'); seg(len('visit'), 'visit', 0.2, { z0: 1.02, z1: 1.1, fx: 0.5, fy0: 0.66, fy1: 0.66 }, { n: 1, s: TX.ways[0] });
say('note'); seg(len('note'), 'note', 0.2, { z0: 1.12, z1: 1.4, fx: 0.22, fy0: 0.74, fy1: 0.8 }, { n: 2, s: TX.ways[1] });
say('gift'); seg(len('gift'), 'gift', 0.15, { z0: 1.08, z1: 1.14, fx: 0.5, fy0: 0.5, fy1: 0.46 }, { n: 3, s: TX.ways[2] });
say('walk'); say('walkb', 0.15 + VOD.walk + 0.25); seg(VOD.walk + 0.25 + VOD.walkb + 0.5, 'walk', 1.8, null, { n: 4, s: TX.ways[3], band: { x0: 0, y0: 663, w: 540, h: 670 } }); // the run is a wide strip: a window on the paper (540 wide: Noodle's nose and Waffles, a little further back, both inside) (from 1.8 s: after the log "Bonk!")
say('safe'); seg(len('safe'), 'visit', 3.8, { z0: 1.1, z1: 1.16, fx: 0.48, fy0: 0.68, fy1: 0.68 }, { s: TX.safe, green: true });
const END = at; say('end', 0.25); seg(VOD.end + 0.8, 'end', 0, null, { end: true });
const T = at, N = Math.round(T * FPS);

// ---- subtitles (owner, 2 Nov 2026: "add the subtitles"): Noodle's words in short chunks, each timed by its share of the line (letters, plus a breath
// at each full stop: Kokoro gives no word times). Where they sit: under the feature label on the game scenes (sky and fence, clear of the dogs at the
// bottom), under the sticker on the hook, under the card on the code page, at the foot of the end page. All inside SAFE like every other box.
const SUBS_TX = RN ? { // vo_friends_zh.py, line by line (华夫 = Waffles, as Noodle says it)
  hook: ['好消息！', '我们的狗狗可以交朋友啦！'],
  code: ['选一个好友名，', '分享你的好友码，', '你的狗狗就能去好友家做客啦！'],
  visit: ['去好友的院子做客！', '摸摸好友的狗狗！', '这是华夫。', '华夫喜欢我。'],
  note: ['留个爪印！', '我写的是：', '“你的狗狗毛茸茸的！”'],
  gift: ['每天可以送一份礼物！', '我送了一块饼干。', '我没有先偷吃。'],
  walk: ['还可以带好友的狗狗一起散步！', '华夫跑得比我快。'], walkb: ['是我让着她。'],
  safe: ['没有聊天，没有私信。', '只有狗狗，一起做朋友！'],
  end: ['好友功能11月7日上线！', '在评论区留下你的好友码吧！'],
} : {
  hook: ['Big news!', 'Our dogs can make friends now!'],
  code: ['Pick a friend name,', 'share your code,', 'and your dog can visit theirs!'],
  visit: ['Visit their yard!', 'Pet their dogs!', 'This is Waffles.', 'Waffles likes me.'],
  note: ['Leave a paw-print note!', 'Mine says:', '"Your dog is so fluffy!"'],
  gift: ['Send a gift, once a day!', 'I sent a biscuit.', 'I did not eat it first.'],
  walk: ['And take their dog on your walk!', 'Waffles is faster than me.'], walkb: ['I let her win.'],
  safe: ['No chat. No messages.', 'Just dogs, being friends!'],
  end: ['Friends arrives on November 7th!', 'Drop your friend code below!'],
};
const SUBS = [];
VOAT.forEach((v) => { const parts = SUBS_TX[v.k]; if (!parts) throw new Error('no subtitles for ' + v.k);
  const wt = parts.map((x) => (RN ? x.replace(/[，。！：“”、]/g, '').length * 2 : x.length) + (/[.!?:"。！：”]$/.test(x) ? 6 : 2)), sum = wt.reduce((a, b) => a + b, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d, s: x }); t0 += d; }); });
SUBS.forEach((u, i) => { const nx = SUBS[i + 1]; u.b = nx ? Math.min(nx.a, u.b + 0.35) : Math.min(T, u.b + 0.6); });

// ---- footage: each clip's frames with their game times; a still is one frame ----
const CLIPS = {};
for (const s of SEG) { if (s.src === 'end' || s.src === 'code' || CLIPS[s.src]) continue;
  const dir = path.join(FOOT, s.src);
  // boxes.json: each dog's drawn box on every frame (CSS px), for apartCheck(); the build stops if the footage has none (re-capture it)
  if (fs.existsSync(path.join(dir, 'ts.json'))) { const ts = JSON.parse(fs.readFileSync(path.join(dir, 'ts.json'), 'utf8')); CLIPS[s.src] = { ts, files: ts.map((_, i) => path.join(dir, String(i).padStart(5, '0') + '.jpg')), boxes: JSON.parse(fs.readFileSync(path.join(dir, 'boxes.json'), 'utf8')) }; }
  else CLIPS[s.src] = { ts: [0], files: [path.join(FOOT, s.src + '.png')], boxes: [JSON.parse(fs.readFileSync(path.join(FOOT, s.src + '.boxes.json'), 'utf8'))] }; }
const idxAt = (s, t) => { const c = CLIPS[s.src], g = s.from + (t - s.a); let i = 0; while (i + 1 < c.ts.length && c.ts[i + 1] <= g) i++; return i; };
const frameAt = (s, t) => 'file://' + CLIPS[s.src].files[idxAt(s, t)];
// the dogs of this frame as data-apart rects in the frame's units: the same mapping as view() and the walk's window in the page
function dogRects(s, t) {
  const bx = CLIPS[s.src].boxes[idxAt(s, t)], B = s.cap && s.cap.band, SX = 60, SX1 = 890; // SAFE.x0 .. SAFE.x1
  if (B) { const k = (SX1 - SX) / B.w, dy = 860 - B.h * k / 2; return apartRects(bx, (x, y) => [SX + (x * 3 - B.x0) * k, dy + (y * 3 - B.y0) * k], [B.x0 / 3, B.y0 / 3, (B.x0 + B.w) / 3, (B.y0 + B.h) / 3]); }
  if (!s.view) return '';
  const u = Math.max(0, Math.min(1, (t - s.a) / (s.b - s.a))), e = u * u * (3 - 2 * u), z = s.view.z0 + (s.view.z1 - s.view.z0) * e, fy = s.view.fy0 + (s.view.fy1 - s.view.fy0) * e;
  const k = H / 1977 * z, w = 1179 * k, h = 1977 * k, l = Math.min(0, Math.max(W - w, W / 2 - s.view.fx * w)), tp = Math.min(0, Math.max(H - h, H / 2 - fy * h)) - (s.view.lift || 0);
  return apartRects(bx, (x, y) => [l + x * 3 * k, tp + y * 3 * k], [-l / (3 * k), -tp / (3 * k), (W - l) / (3 * k), (H - tp) / (3 * k)]);
}

const PEN = '#5B3D32', GREEN = '#4E9A54', PINK = '#F28FA5', PAPER = '#FFF8EC';
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">${RN ? '<link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css" rel="stylesheet">' : ''}
<style>${ART.css}html,body{margin:0;background:#fff}#st{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${PAPER}}#scr{position:absolute;left:0;top:0;transform-origin:0 0}#ov{position:absolute;left:0;top:0}</style>
<div id="st"><img id="scr"><svg id="ov" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g id="dim"></g><g id="ph"></g><g id="cap"></g><g id="end"></g><g id="sub"></g><g id="apart"></g></svg></div>
<script>
${CENTRE_JS}
${SAFE_JS}
${FIT_JS}
const $=(i)=>document.getElementById(i), FAM=${JSON.stringify(fam)}, TX=${JSON.stringify(TX)}, PH=${JSON.stringify(PLACEHOLDER)}, SUBS=${JSON.stringify(SUBS)};
const C=(lines,cx,cy)=>centred(lines,cx,cy,FAM);
const back=(x)=>{ x=Math.max(0,Math.min(1,x)); const c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const ease=(x)=>{ x=Math.max(0,Math.min(1,x)); return x*x*(3-2*x); };
const card=(x,y,w,h,stroke,sw,lines,fill)=>'<g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="36" fill="'+(fill||'#FFFDF7')+'" stroke="'+stroke+'" stroke-width="'+sw+'"/>'+C(lines,x+w/2,y+h/2).svg+'</g>';
const bubble=(r,fill,s,size)=>'<g data-box><circle r="'+r+'" fill="'+fill+'" stroke="${PEN}" stroke-width="6"/>'+C([{s,size}],0,0).svg+'</g>';
// ONE cut for every platform (owner, 2 Nov 2026): YouTube Shorts, Instagram Reels and TikTok lay their buttons over the right side and their
// titles, names and captions over the top and the bottom. All our words and boxes stay inside SAFE (x 60..890, y 270..1440 of 1080 x 1920), centred on
// x 475; safeCheck() stops the build if any text leaves it. The game screen behind still fills the frame.
const CX=SAFE_CX;
// a list of lines sized down (all together) until the widest ink fits maxW
function fit(lines,maxW){ const wd=Math.max(...lines.map((l)=>{ const k=inkOf(l.s,l.size,FAM); return k.L+k.R; })), f=Math.min(1,maxW/wd);
  return f>=1?lines:lines.map((l)=>Object.assign({},l,{size:Math.floor(l.size*f),pitch:l.pitch?Math.floor(l.pitch*f):undefined})); }
// the screen: the 1179 x 1977 shot, scaled to the frame's height (z 1) or zoomed in on (fx, fy), never past its edges; lift slides it up (or down)
// over the paper (so a sheet at the bottom of the phone comes clear of the platforms' bottom captions), with a pencil edge and a shadow
function view(src, z, fx, fy, lift){ const img=$('scr'), k=${H}/1977*z, w=1179*k, h=1977*k;
  const l=Math.min(0,Math.max(${W}-w, ${W}/2-fx*w)), t=Math.min(0,Math.max(${H}-h, ${H}/2-fy*h))-(lift||0);
  img.style.transform='translate('+l+'px,'+t+'px) scale('+k+')'; return {l,t,k,bot:t+h}; }
window.frame=async function(t, S, src, apart){ $('apart').innerHTML=apart||'';
  const img=$('scr'); if(src){ if(img.getAttribute('src')!==src){ img.src=src; await img.decode(); } img.style.display=''; } else img.style.display='none';
  img.style.clipPath=''; let band='';
  const B=S.cap&&S.cap.band; if(B&&src){ // a window on the paper: the strip's source rect (x0, y0, w, h of the 1179 x 1977 shot) shown at x 60..890, centred on y 860
    const k=(SAFE.x1-SAFE.x0)/B.w, dh=B.h*k, dy=860-dh/2;
    img.style.transform='translate('+(SAFE.x0-B.x0*k)+'px,'+(dy-B.y0*k)+'px) scale('+k+')';
    img.style.clipPath='inset('+B.y0+'px '+(1179-B.x0-B.w)+'px '+(1977-B.y0-B.h)+'px '+B.x0+'px round '+(34/k)+'px)';
    band='<rect x="'+(SAFE.x0+10)+'" y="'+(dy+14)+'" width="'+(SAFE.x1-SAFE.x0)+'" height="'+dh+'" rx="34" fill="${PEN}" opacity=".12"/><rect data-safe x="'+SAFE.x0+'" y="'+dy+'" width="'+(SAFE.x1-SAFE.x0)+'" height="'+dh+'" rx="34" fill="none" stroke="${PEN}" stroke-width="6"/>'; }
  let v=null; if(S.view){ const u=ease((t-S.a)/(S.b-S.a)); v=view(src, S.view.z0+(S.view.z1-S.view.z0)*u, S.view.fx, S.view.fy0+(S.view.fy1-S.view.fy0)*u, (S.view.lift||0)*(S.view.liftIn?ease((t-S.a)/0.35):1)); }
  const lt=t-S.a, cp=S.cap||{}; let cap='', dim='', ph='', end='';
  if(band) ph=band;
  if(v && v.t>1) dim+='<path d="M-10 '+v.t+' Q270 '+(v.t-5)+' 540 '+v.t+' T1090 '+v.t+'" fill="none" stroke="${PEN}" stroke-width="6" stroke-linecap="round"/>';
  if(v && v.bot<${H}-1) dim+='<rect x="-10" y="'+(v.bot+6)+'" width="1100" height="18" fill="${PEN}" opacity=".12"/><path d="M-10 '+v.bot+' Q270 '+(v.bot+5)+' 540 '+v.bot+' T1090 '+v.bot+'" fill="none" stroke="${PEN}" stroke-width="6" stroke-linecap="round"/>';
  if(cp.card){ const cs=0.86+0.14*back(lt/0.4); dim+='<rect width="${W}" height="${H}" fill="${PAPER}"/>';
    ph+='<g data-safe transform="translate('+CX+' 830) scale('+(cs*2.5)+') rotate(-2) translate(-150 -100)">${CARD.replace(/'/g, "\\'").replace(/\n/g, ' ')}</g>'
      +(PH?'<g transform="rotate(-6 '+CX+' 835)">'+pill(TX.ph,CX,835,44,FAM,{fill:'#FFE0E0',stroke:'#C0392B',color:'#C0392B',padX:22})+'</g>':''); }
  if(cp.hook){ const dur=S.b-S.a, o=lt<dur-0.3?1:Math.max(0,1-(lt-dur+0.3)/0.3);
    cap='<g opacity="'+o+'"><g transform="rotate(-2 '+CX+' 470)">'+card(CX-340,320,680,320,'${PEN}',6,fit(TX.hook,600))+'</g>'
      +'<g transform="rotate(5 '+(CX+150)+' 680)">'+pill(TX.update,CX+150,680,50,FAM,{fill:'#FFE3A1',padX:26})+'</g></g>'; }
  else if(cp.s){ const kept=cp.keep, s=kept?1:0.86+0.14*back(lt/0.3), o=kept?1:ease(lt/0.15); // a small pop, so nothing bounces out of SAFE
    const L=fit([{s:cp.s,size:56}],cp.n?560:680), k=inkOf(cp.s,L[0].size,FAM), w=k.L+k.R+80, x0=cp.n?SAFE.x0+100:CX-w/2, x=Math.min(x0,SAFE.x1-w);
    cap='<g opacity="'+o+'" transform="translate('+CX+' 352) scale('+s+') rotate(-1.5) translate('+(-CX)+' -352)">'+card(x,300,w,104,cp.green?'${GREEN}':'${PEN}',cp.green?6:5,L)
      +(cp.n?'<g transform="translate('+(x-40)+' 352) rotate(-8)">'+bubble(48,'#FFE3A1',cp.n+'.',64)+'</g>':'')+'</g>'; }
  if(cp.end){ const o=ease(lt/0.3), cs=back((lt-0.15)/0.4), a=ease((lt-0.5)/0.3);
    end='<rect width="${W}" height="${H}" fill="${PAPER}" opacity="'+o+'"/><g opacity="'+o+'">'
      +'<g transform="rotate(-2 '+CX+' 360)">'+C([{s:TX.endAsk,size:120}],CX,380).svg+'</g><path d="M'+(CX-190)+' 450 Q'+CX+' 432 '+(CX+190)+' 450" fill="none" stroke="${PINK}" stroke-width="14" stroke-linecap="round" opacity=".6"/>'
      +'<g data-safe transform="translate('+CX+' 720) scale('+(cs*2.1)+') rotate(-2) translate(-150 -100)">${CARD.replace(/'/g, "\\'").replace(/\n/g, ' ')}</g>'
      +(PH?'<g transform="rotate(-6 '+CX+' 725)">'+pill(TX.ph,CX,725,44,FAM,{fill:'#FFE0E0',stroke:'#C0392B',color:'#C0392B',padX:22})+'</g>':'')
      +'<g opacity="'+a+'">'+C(fit([{s:TX.endSub,size:62}],760),CX,1000).svg
      +'<path d="M'+CX+' 1040 q-10 38 0 70 M'+(CX-22)+' 1088 l22 26 l22 -26" fill="none" stroke="${PEN}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></g>'
      +'<g transform="rotate(-3 '+(CX-110)+' 1200)">'+centred([{s:'Doodle',size:88}],CX-110,1200,'Caveat').svg+'</g><g transform="rotate(2 '+(CX+122)+' 1204)">'+centred([{s:'Doggo',size:88}],CX+122,1204,'Caveat').svg+'</g>'
      +'<g transform="rotate(-2 '+CX+' 1296)">'+pill(TX.update,CX,1296,46,FAM,{fill:'#FFE3A1',padX:26})+'</g></g>'; }
  // the subtitle: ink pill, cream words, one line; a quick fade, no bounce
  let sub=''; const u=SUBS.find((x)=>t>=x.a&&t<x.b);
  if(u){ const y=cp.end?1395:cp.hook?800:cp.card?1200:480, o=Math.min(ease((t-u.a)/0.08),ease((u.b-t)/0.08));
    let size=58; const k=inkOf(u.s,size,FAM); if(k.L+k.R>740) size=Math.floor(size*740/(k.L+k.R));
    sub=pill(u.s,CX,y,size,FAM,{fill:'${PEN}',stroke:'${PEN}',color:'#FFF8EC',padX:30,op:(0.94*o).toFixed(3)}); }
  $('dim').innerHTML=dim; $('ph').innerHTML=ph; $('cap').innerHTML=cap; $('end').innerHTML=end; $('sub').innerHTML=sub; frFit($('ov'));
};
</script>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, 'page.html'), html); await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate((rn) => Promise.all(['600 40px Caveat', '700 40px Caveat', '700 40px "DD Code"'].concat(rn ? ['700 40px "LXGW WenKai"'] : []).map((f) => document.fonts.load(f, rn || 'a'))), RN ? JSON.stringify([TX, SUBS_TX, OUR_NAME]) : ''); await p.evaluate(() => document.fonts.ready);
  const segAt = (t) => SEG.find((s) => t >= s.a && t < s.b) || SEG[SEG.length - 1];
  if (!(await p.evaluate(() => document.fonts.check('700 19px "DD Code"', 'DOG-K3APZ')))) throw new Error('DD Code (the game\'s code face) did not load');
  const render = async (t, file) => { const s = segAt(t), src = s.src === 'end' || s.src === 'code' ? null : frameAt(s, t), ap = src ? dogRects(s, t) : '';
    await p.evaluate(async ([t, S, src, ap]) => window.frame(t, S, src, ap), [t, s, src, ap]);
    const near = await p.evaluate(() => apartCheck(document.querySelector('#ov'))); if (near.length) throw new Error('dogs too close at ' + t.toFixed(2) + ': ' + near.join('; '));
    const off = await p.evaluate(() => centreCheck(document.querySelector('#ov'))); if (off.length) throw new Error('text not centred at ' + t.toFixed(2) + ': ' + off.join('; '));
    const out = await p.evaluate(() => safeCheck(document.querySelector('#ov'))); if (out.length) throw new Error('text outside the all-platform safe area at ' + t.toFixed(2) + ': ' + out.join('; '));
    await p.screenshot({ path: file, type: file.endsWith('.jpg') ? 'jpeg' : 'png', quality: file.endsWith('.jpg') ? 95 : undefined }); };
  const still = process.env.ONLY === 'stills';
  const list = still ? SEG.map((s) => Math.round(((s.a + s.b) / 2) * FPS)).concat([Math.round((END + 2.5) * FPS)]) : [...Array(N).keys()];
  for (const f of list) await render(f / FPS, path.join(WORK, 'f', `f${String(f).padStart(4, '0')}.png`));
  console.log(list.length, 'frames, T =', T.toFixed(2));
  await b.close(); // the cover is its own design: make_friends_cover.js
  if (still) return;

  // sound: the game's own music (the yard by day), a soft tick as each numbered way pops in, "discover" on the end page
  const ab = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.7, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: END + 0.1, name: 'discover' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  await ab.close();
  // Noodle's voice over the game's music: the music sits at 30% under the voice, as in the 45 s promo
  const inputs = [], chains = [];
  VOAT.forEach((v, i) => { inputs.push('-i', path.join(VO, v.k + '.wav')); const d = Math.round(v.at * 1000); chains.push(`[${i + 2}:a]aresample=44100,volume=1.5,adelay=${d}|${d}[v${i}]`); });
  const mix = `[1:a]atrim=0:${T},volume=0.3,afade=t=out:st=${(T - 0.8).toFixed(2)}:d=0.8[m];` + chains.join(';') + ';' + `[m]${VOAT.map((_, i) => `[v${i}]`).join('')}amix=inputs=${VOAT.length + 1}:normalize=0,alimiter=limit=0.89:level=false,atrim=0:${T}[a]`;
  const out = path.join(WORK, `doodle-doggo-friends${SUF}.mp4`);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), ...inputs,
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', String(T), out]);
  console.log('wrote', out);
})().catch((e) => { console.error(e); process.exit(1); });
