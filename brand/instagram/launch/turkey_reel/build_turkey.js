// "Stop feeding your dog the turkey skin" Reel (owner, 11 Nov 2026; shot table, facts and captions: docs/marketing/TURKEY_REEL.md).
// A holiday food-safety Reel in the style of our Safe and Sweet potato Reels: Noodle the dachshund in the game's kitchen, the game's own crayon
// food art, a crayon red cross on each "no" and a green tick on each "share instead". Hook card at frame 1: "Stop feeding your dog the turkey skin.
// Here's what to share instead." The no list: turkey skin (very fatty, can upset a dog's tummy; too much fat is linked to pancreatitis),
// cooked bones (can splinter), gravy and stuffing (often made with onion and garlic, toxic to dogs). The yes list: a little plain turkey
// (cooked, no skin, no bones), plain green beans, plain cooked pumpkin (not pie filling), carrots; small amounts, nothing added. Then
// "Ate something it shouldn't? Call your vet right away.", "In Doodle Doggo you can't cook or feed anything toxic", and our standard end card
// (brand/kids/endcard.js: the logo, doodledoggo.app, Instagram, X and YouTube with icons) for 2.5 s with the music fading under it.
// The art is the game's (main): Noodle (PawArt.dog 'dachs') big on a festive marigold background (decorations only in the margins), the paw-stop icon,
// Turkey & Cranberry Bites, Pumpkin Purée and Carrot Sticks. Drawn here in the game's own item builder (injected into
// world/pawart_world_b.js, so the same crayon washes stay inside the same pencil lines): turkey skin, cooked bones, gravy boat, stuffing,
// plain turkey (the game's own torn-turkey pieces without the cranberries) and green beans. The facts follow the game's own tips
// (data.food.*.tip in game/i18n/en.json: Turkey & Cranberry Bites, Snow Day Stew, Warm Bone Broth, Turkey Meatballs, Pumpkin Purée,
// Carrot Sticks; data.people_food.onion / garlic) plus one conservative line (fat and pancreatitis) that is common vet guidance.
// Every frame: centreCheck(), safeCheck() and apartCheck() (../centre_text.js): no two dogs, items, cards or texts overlap or touch; the
// build stops on the first miss. 1080 x 1920, 30 fps.
// Voice: Noodle (Kokoro af_bella 1.0x, owner 11 Nov 2026: slower): VO_LINES=turkey_reel/vo_turkey.json python3 ../friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.0.
// Music: the game's own kitchen music (mods/pawaudio.js) about 11 dB under the voice (~30%), a crayon scratch on each cross, a tick on each tick.
//
//   ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/turkey_reel/build_turkey.js <workdir> <vo dir>
//   ONLY=stills: key frames only (WORK/stills). ONLY=cover: turkey-cover.jpg. FRAMES=a-b: re-render only frames a..b, then encode again.
//   Output next to this file: doodle-doggo-turkey-skin.mp4
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'turkey_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', YEL = '#FFE3A1', RED = '#D2473C', GREEN = '#4E9A54';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'vo_turkey.json'), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from vo_turkey.json: ' + k);

// ---- the facts, checked against the game's own text (main) so the Reel says what the game teaches ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const must = (k, re) => { if (!re.test(EN[k] || '')) throw new Error('the game text changed: ' + k + ' no longer says ' + re); };
must('data.food.turkey_cranberry_bites.tip', /Plain cooked turkey with no skin, bones, gravy or seasoning/);
must('data.food.snow_day_stew.tip', /Gravy and fatty leftovers upset a dog's tummy/);
must('data.food.snow_day_stew.note', /green beans/);
must('data.food.warm_bone_broth.tip', /Cooked bones can splinter/);
must('data.food.turkey_meatballs.tip', /no onion or garlic\. Those are poison for dogs/);
must('data.people_food.onion.why', /Onions \(and garlic/);
must('data.food.pumpkin_puree.tip', /Plain cooked pumpkin only, never pie filling/);
must('data.food.carrot_sticks.tip', /safe raw or cooked/);
must('data.gd_steps.garden.t', /Nothing toxic can be planted/);

// ---- the game's art (main), with the poses gliding between the game's drawings (the same patch as safe_reel/build_safe.js) ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
// six foods drawn with the game's own item builder, so they share its crayon washes and pencil lines (fills inside the lines)
const MY_ITEMS = `
 'TR Turkey Skin'(b){
  plateV(b,32,51,30,10,C.blue,'#FFFFFF');
  // a roast turkey leg, its crispy golden skin peeling back from the plain meat: the skin is the part to keep off the dog's plate
  b.sh([[37,25],[47,12],[53,18],[43,30]],'#FBF3E2',{k:.1,hatch:0,hl:0,lw:.8});
  b.sh(E(49,10.5,5,4.4,14),'#FBF3E2',{hatch:0,hl:0,lw:.8});b.sh(E(55.5,16.5,4.4,5,14),'#FBF3E2',{hatch:0,hl:0,lw:.8});
  b.sh(E(25,39,21,14,22,-.72),'#D38A3F',{base:'#E7A95E',sh:'#B06A2C',marks:[{pts:E(17,42,6,3,10,-.7),fill:'#F8DC96',op:.75},{pts:E(24,48,4,2,8,-.7),fill:'#F8DC96',op:.6}],
   det:[[[11,40],[16,46],[24,51]],[[17,33],[21,39],[28,44]]],dcol:'#9A5726',dw:.7});
  [[13,37],[19,48],[26,45],[15,44],[22,35],[30,49],[11,46]].forEach(([x,y])=>b.dot(x,y,.8,'#9A5726'));
  b.sh([[28,26],[36,24],[41,30],[38,37],[31,38],[27,33]],'#F6DDB8',{k:.25,hatch:0,hl:0,lw:.7,base:'#FBEBD2',det:[[[30,29],[35,34]],[[33,27],[38,32]]],dcol:'#D9B48A',dw:.6});
  b.sh([[38,37],[45,33],[52,36],[56,43],[51,45],[46,41],[41,41]],'#D99446',{k:.25,hl:0,base:'#EDB66B',sh:'#B06A2C',marks:[{pts:E(48,39,4,1.6,8,.4),fill:'#FBE3A6',op:.85}]});
  b.sh(drop(58,30,3.2),'#FCE7A4',{hatch:0,hl:0,lw:.55,dr:.1});b.sh(drop(6,30,2.6),'#FCE7A4',{hatch:0,hl:0,lw:.5,dr:.1});
 },
 'TR Cooked Bones'(b){
  plateV(b,32,49,29,10,C.blue,'#FFFFFF');
  // a cooked drumstick bone: a knobbly joint at one end, snapped into sharp splinters at the other
  const bone=(cx,cy,s,a)=>{const P=(pts)=>rot(pts.map(([x,y])=>[cx+x*s,cy+y*s]),a,cx,cy);
   b.sh(P(E(17,-4.2,6,5.4,14)),'#F6EBD3',{hatch:0,hl:0,lw:.8});b.sh(P(E(17,4.4,5.4,5,14)),'#F6EBD3',{hatch:0,hl:0,lw:.8});
   b.sh(P([[-18,-3.6],[-12,-2.8],[13,-2.8],[16,0],[13,3],[-12,3],[-17,4.4],[-15,1.4],[-21,1.6],[-16,-.6],[-22,-1.4]]),'#FBF3E2',{k:.05,hl:0,sh:'#D9C9AA',det:[[[-6,-.6],[-1,.8],[4,-.4]]],dcol:'#B59A7C',dw:.6});};
  bone(29,42,1,-.42);bone(38,30,.72,.38);
  b.sh([[47,45],[55,42],[51,48]],'#FBF3E2',{k:.05,hatch:0,hl:0,lw:.6});b.sh([[12,50],[17,47],[15,52]],'#FBF3E2',{k:.05,hatch:0,hl:0,lw:.6});
 },
 'TR Gravy Boat'(b){
  b.sh(E(32,53,27,6.6,22),'#F3E7D3',{hatch:0,hl:0,lw:.9});
  b.ln([[13,33],[5,34],[4,42],[12,45]],{w:4.6});b.ln([[13,33],[5,34],[4,42],[12,45]],{w:2.4,col:'#FFF2DA'});
  b.sh([[10,29],[50,29],[56,24],[60,22],[57,31],[51,42],[42,49],[24,49],[15,43]],'#FFF2DA',{k:.12,sh:'#E3CDA8',marks:[{pts:[[12,38],[54,38],[52,41],[13,41]],fill:'#F7B2C4',k:0,op:.8}]});
  b.sh(E(31,29.6,19,3.6,20),'#9A5F33',{hatch:0,hl:0,lw:.7,base:'#B97845',marks:[{pts:E(27,29,6,1.2,10),fill:'#C98A55',op:.8}]});
  b.sh([[54,26],[57,26.5],[56.5,33],[55,36],[53.4,33]],'#9A5F33',{k:.2,hatch:0,hl:0,lw:.6,base:'#B97845'});
  steam(b,24,22,.85,'#B9A69A');steam(b,36,21,.95,'#B9A69A');
 },
 'TR Stuffing'(b){
  bowl(b,32,36,26,7,18,C.orange,'#F6CF9E',()=>{
   b.sh(E(32,34,22,6,22),'#C98F55',{hatch:0,hl:0,lw:.7,base:'#D9A56B'});
   [[20,30,.3],[30,27,-.4],[41,30,.5],[25,35,-.2],[36,35,.2],[46,35,-.5],[33,31,.1]].forEach(([x,y,a])=>b.sh(rot(RR(x-3.6,y-3.2,7.2,6.4,1.6),a,x,y),'#E6B77A',{k:.15,hatch:0,hl:0,lw:.6,base:'#F3D3A0'}));
   // onion pieces and herbs: what makes most stuffing unsafe for dogs
   [[27,31,.4],[40,33,-.3],[18,34,.1]].forEach(([x,y,a])=>b.sh(rot([[x-3,y],[x,y-1.8],[x+3,y],[x,y-.6]],a,x,y),'#FBF5E8',{k:.2,hatch:0,hl:0,lw:.45}));
   [[23,29],[35,29],[44,32],[30,36],[16,32]].forEach(([x,y])=>b.dot(x,y,.9,'#6FA35A'));
  });
  steam(b,26,20,.85,'#B9A69A');steam(b,38,19,.95,'#B9A69A');
 },
 'TR Plain Turkey'(b){
  plateV(b,32,49,29,10,C.mint,'#FFFFFF');
  // the game's own torn plain turkey (Turkey & Cranberry Bites), with no cranberries, no skin and no bones
  [[24,34,17,8.6,-.5,0],[40,33,16,8.2,.45,1],[15,43,16,8.4,.2,2],[31,42,19,9.2,-.1,3],[47,43,15,8,-.6,4],[23,50,16,8,.35,5],[39,50,17,8.2,-.25,6]].forEach(([x,y,l,w,a,v])=>wmtShred(b,x,y,l,w,a,v));
  b.ex('spark',56,12,3.6);b.ex('heart',8,20,2.8);
 },
 'TR Green Beans'(b){
  plateV(b,32,49,29,10,C.lav,'#FFFFFF');
  // plain steamed green beans, nothing on them
  [[22,42,-.35],[33,38,-.15],[44,42,.25],[27,49,.12],[40,49,-.2],[33,31,.35]].forEach(([x,y,a],i)=>{
   b.sh(rot([[x-12,y],[x-9,y-2.6],[x+9,y-2.8],[x+12.5,y-.6],[x+9,y+2.6],[x-9,y+2.6]],a,x,y),'#7FB86A',{k:.25,hatch:0,hl:0,lw:.7,base:'#A9D68E',marks:[{pts:rot(E(x-2,y-.8,6,.9,8),a,x,y),fill:'#CBE8B4',op:.8}]});
   b.ln(rot([[x+12.5,y-.6],[x+15,y-1.6]],a,x,y),{w:1,col:'#5E8F4A'});});
  b.ex('spark',56,12,3.6);
 },`;
for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) {
  let s = fs.readFileSync(path.join(ART_ROOT, 'world', f), 'utf8');
  if (f === 'pawart_world_b.js') { if (!s.includes('const PEOPLE_DRAW={')) throw new Error('art changed: PEOPLE_DRAW'); s = s.replace('const PEOPLE_DRAW={', 'const PEOPLE_DRAW={' + MY_ITEMS); }
  vm.runInContext(s, ctx);
}
let src = fs.readFileSync(path.join(ART_ROOT, 'dogs', 'pawart_dogs.js'), 'utf8');
for (const [a, b] of [['if(L.danceFx){', 'if(false){'], ["const shadow=(s.wet&&pose!=='jump'?wetPuddle(shx,shw):'')+`", "const shadow=''&&`"],
  ['const f=frame(key,s,pose,o.outfit,k,seed,ex)', 'const f=frame(key,s,pose,o.outfit,(o.kf!=null?o.kf:k),seed,ex)'], ['kit(rng(seed+k*7717))', 'kit(rng(seed))'],
  ['+k*31)', ')'], ['seed*5+k*977+11', 'seed*5+11'], ['seed*3+k*131+7', 'seed*3+7']]) { if (!src.includes(a)) throw new Error('art changed: ' + a); src = src.replace(a, b); }
src = src.replace(/\]\[k\]/g, '].LK(k)').replace(/\]\[L\.k\|\|0\]/g, '].LK(L.k||0)').replace(/\]\[L\.k\]/g, '].LK(L.k)');
vm.runInContext(`Array.prototype.LK=function(k){ if(Number.isInteger(k)) return this[k];
  const n=this.length, i=((Math.floor(k)%n)+n)%n, j=(i+1)%n, x=k-Math.floor(k), f=x*x*(3-2*x);
  const mix=(a,b)=>typeof a==='number'&&typeof b==='number' ? a+(b-a)*f : Array.isArray(a)&&Array.isArray(b) ? a.map((v,q)=>mix(v,b[q])) : (f<.5?a:b);
  return mix(this[i],this[j]); };`, ctx);
vm.runInContext(src, ctx);
const PA = win.PawArt, inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const itemSym = (name, id) => { const s = PA.item(name); if (!s || /fallback|>\?</.test(s)) throw new Error('no art for ' + name); const vb = /viewBox="([^"]+)"/.exec(s)[1];
  return `<symbol id="${id}" viewBox="${vb}" overflow="visible">${inner(s).replace(/<title>[^<]*<\/title>/g, '')}</symbol>`; };
const STOPSYM = (() => { const s = PA.icon('paw-stop'), vb = /viewBox="([^"]+)"/.exec(s)[1]; return `<symbol id="stop" viewBox="${vb}">${inner(s)}</symbol>`; })();
const FOODS = { skin: 'TR Turkey Skin', bones: 'TR Cooked Bones', gravy: 'TR Gravy Boat', stuff: 'TR Stuffing', turkey: 'TR Plain Turkey', beans: 'TR Green Beans',
  pumpkin: 'Pumpkin Purée', carrots: 'Carrot Sticks', bites: 'Turkey & Cranberry Bites' };
const SYMS = Object.entries(FOODS).map(([id, n]) => itemSym(n, 'it_' + id)).join('') + STOPSYM;
const LOOK = { beg: { pose: 'beg', facing: 'right' }, sit: { pose: 'sit', facing: 'right' }, yay: { pose: 'happy', facing: 'right', expr: 'hearts' } };
const dogSvg = (id, kf) => inner(PA.dog('dachs', Object.assign({ anim: false }, LOOK[id], { kf: ((kf % 3) + 3) % 3 })));
const dogSyms = Object.keys(LOOK).map((id) => `<symbol id="${id}_0" overflow="visible">${dogSvg(id, 0)}</symbol>`).join('');
// the kitchen corner with no words in it (as in the Safe Reel), winter
// the background (owner, 11 Nov 2026: "a bit plain, make it more eye-catching"): a warm marigold holiday colour, plain behind every card, badge,
// food and Noodle; the decorations live only in the margins and are checked against everything else on every frame (data-deco): crayon
// bunting along the top edge above the cards, a cranberry plaid tablecloth along the bottom under Noodle's feet, autumn leaves and sparkles
// down the right margin and a few sparkles on the left. Every fill sits inside its own pencil line (the plaid is clipped to the cloth).
const FEST = (() => { let s = `<defs><radialGradient id="glow" cx="0.42" cy="0.48" r="0.75"><stop offset="0" stop-color="#FFE7A8"/><stop offset="0.6" stop-color="#FFD27A"/><stop offset="1" stop-color="#F7B65A"/></radialGradient>
  <clipPath id="cloth"><path d="${(() => { let d = 'M-10 1478'; for (let x = -10; x < W + 10; x += 60) d += ` Q${x + 30} 1508 ${x + 60} 1478`; return d + ` L${W + 10} ${H + 10} L-10 ${H + 10} Z`; })()}"/></clipPath></defs>`;
  s += `<rect width="${W}" height="${H}" fill="url(#glow)"/>`;
  // bunting: three swags of crayon flags along the top edge (y 40..250, above the cards)
  const SW = [[-20, 360], [340, 720], [700, 1100]], COL = ['#C8323C', '#FFF3DA', '#5E9E5A', '#F28A3C'];
  s += '<g data-deco="bunting">'; let n = 0;
  SW.forEach(([a, z]) => { const y0 = 70, sag = 70, P = (x) => y0 + sag * Math.sin(Math.PI * (x - a) / (z - a));
    s += `<path d="M${a} ${y0} Q${(a + z) / 2} ${y0 + sag * 2} ${z} ${y0}" fill="none" stroke="${PEN}" stroke-width="5" stroke-linecap="round"/>`;
    for (let x = a + 45; x < z - 30; x += 78) { const y = P(x), c = COL[n++ % 4];
      s += `<path d="M${(x - 28).toFixed(1)} ${(y - 2).toFixed(1)} L${(x + 28).toFixed(1)} ${(y + 2).toFixed(1)} L${(x + 2).toFixed(1)} ${(y + 66).toFixed(1)} Z" fill="${c}" stroke="${PEN}" stroke-width="4.5" stroke-linejoin="round"/>`
        + `<path d="M${(x - 14).toFixed(1)} ${(y + 10).toFixed(1)} L${(x + 4).toFixed(1)} ${(y + 44).toFixed(1)}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>`; } });
  s += '</g>';
  // the tablecloth: cranberry plaid on cream, a scalloped top edge
  s += `<g data-deco="cloth"><g clip-path="url(#cloth)"><rect x="-10" y="1460" width="${W + 20}" height="480" fill="#FFF3DE"/>`;
  for (let x = 20; x < W; x += 130) s += `<rect x="${x}" y="1460" width="62" height="480" fill="#D9464F" opacity=".55"/>`;
  for (let y = 1530; y < H; y += 130) s += `<rect x="-10" y="${y}" width="${W + 20}" height="62" fill="#D9464F" opacity=".55"/>`;
  for (let x = 51; x < W; x += 130) s += `<path d="M${x} 1460 L${x} ${H}" stroke="#9E2430" stroke-width="3" opacity=".5"/>`;
  s += `</g><path d="${(() => { let d = 'M-10 1478'; for (let x = -10; x < W + 10; x += 60) d += ` Q${x + 30} 1508 ${x + 60} 1478`; return d; })()}" fill="none" stroke="${PEN}" stroke-width="6" stroke-linejoin="round"/></g>`;
  // leaves and sparkles in the side margins
  const leaf = (x, y, r, a, c) => `<g data-deco="leaf" transform="translate(${x} ${y}) rotate(${a}) scale(${r / 30})"><path d="M0 -30 C14 -22 24 -6 18 12 C12 26 4 30 0 34 C-4 30 -12 26 -18 12 C-24 -6 -14 -22 0 -30 Z" fill="${c}" stroke="${PEN}" stroke-width="4.5" stroke-linejoin="round"/><path d="M0 -22 L0 30 M0 -2 L10 -12 M0 10 L-10 0 M0 20 L9 12" stroke="${PEN}" stroke-width="2.6" stroke-linecap="round" opacity=".7" fill="none"/><path d="M0 34 L0 46" stroke="${PEN}" stroke-width="4" stroke-linecap="round"/></g>`;
  const spark = (x, y, r, c) => `<path data-deco="spark" d="M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z" fill="${c || '#FFF6DC'}" stroke="${PEN}" stroke-width="3.4" stroke-linejoin="round"/>`;
  s += leaf(975, 360, 34, 20, '#E8663A') + spark(1010, 470, 18) + leaf(955, 600, 30, -25, '#C8323C') + leaf(1020, 760, 28, 40, '#F2A93B') + spark(950, 880, 14)
    + leaf(990, 1010, 34, -10, '#E8663A') + spark(1030, 1140, 20) + leaf(950, 1260, 30, 30, '#C8323C') + leaf(1015, 1380, 26, -35, '#F2A93B');
  s += spark(28, 800, 12);
  return s; })();
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, '')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---- the voice and the timeline (each beat as long as its line) ----
// the words on the cards (each line follows the voice; the skin card adds the fat and pancreatitis line)
const NO = 'no', YES = 'yes';
const BEATS = [
  { k: 'hook', kind: 'hook', food: ['skin'], lines: ['Stop feeding your dog', 'the turkey skin.'], sub: "Here's what to share instead." },
  { k: 'skin', kind: NO, food: ['skin'], title: 'Turkey skin', lines: ["very fatty: it can upset", "a dog's tummy"], small: 'too much fat is linked to pancreatitis' },
  { k: 'bones', kind: NO, food: ['bones'], title: 'Cooked bones', lines: ['they can splinter'] },
  { k: 'gravy', kind: NO, food: ['gravy', 'stuff'], title: 'Gravy & stuffing', lines: ['often made with onion and garlic,', 'which are toxic to dogs'] },
  { k: 'turkey', kind: YES, food: ['turkey'], title: 'Plain turkey', lines: ['a little, cooked,', 'no skin, no bones'] },
  { k: 'beans', kind: YES, food: ['beans'], title: 'Green beans', lines: ['plain, nothing on them'] },
  { k: 'pumpkin', kind: YES, food: ['pumpkin'], title: 'Plain cooked pumpkin', lines: ['not pie filling'] },
  { k: 'carrots', kind: YES, food: ['carrots'], title: 'Carrots', lines: ['small amounts,', 'nothing added'] },
  { k: 'vet', kind: 'vet', food: [], lines: ["Ate something it shouldn't?", 'Call your vet right away.'] },
  { k: 'game', kind: 'game', food: ['bites'], lines: ["In Doodle Doggo you can't cook", 'or feed anything toxic'], pill: 'save this for the holidays' },
];
// the timeline (owner, 11 Nov 2026: "the video can be slower, we need to let the audience read it"): each card stays up until a slow reader is
// done, at least 1.2 s + 0.35 s a word of its text and never less than its spoken line + 1 s, then a short pause before the next beat
const VOAT = []; let at = 0.1; const PAUSE = 0.3, B = {}, HOLD = {};
for (const b of BEATS) { const words = [b.title || '', ...b.lines, b.small || '', b.sub || '', b.pill || ''].join(' ').split(/\s+/).filter(Boolean).length;
  HOLD[b.k] = Math.max(1.2 + 0.35 * words, VOD[b.k] + 1.0); B[b.k] = at; VOAT.push({ k: b.k, at }); b.at = at; at += HOLD[b.k] + PAUSE; }
const LOOP = at - PAUSE + 0.2, T = LOOP + 3.0, NF = Math.round(T * FPS);
const allText = BEATS.map((b) => [b.title || '', ...b.lines, b.sub || '', b.small || '', b.pill || '', 'share instead', 'not for dogs']).flat().join(' ')
  + ' Stop feeding your dog the turkey skin share these instead';

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}.pa-dog *{animation:none!important}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${SYMS}${dogSyms}</defs>
<g id="bg">${FEST}</g>
<g id="art"></g><g id="ov"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), F='Caveat', CX=455, NO='no', YES='yes';
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);}, eo=(x)=>1-Math.pow(1-cl(x),3);
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#'+id+'_0'); $('art').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
// Noodle, standing on (cx, feet), at most hh tall and ww wide
function noodle(pose, svg, cx, feet, hh, ww, dy, op, flip){ const b=box(pose), s=Math.min(hh/b[3], ww/b[2]), w=b[2]*s, h=b[3]*s;
  return '<g data-apart="Noodle" opacity="'+f2(op)+'"><ellipse cx="'+f2(cx)+'" cy="'+(feet-3)+'" rx="'+f2(w*0.36)+'" ry="14" fill="${PEN}" opacity=".18"/><g'+(flip?' transform="translate('+f2(2*cx)+' 0) scale(-1 1)"':'')+'><g transform="translate('+f2(cx-w/2)+' '+f2(feet-h+(dy||0))+') scale('+s.toFixed(4)+') translate('+f2(-b[0])+' '+f2(-b[1])+')">'+svg+'</g></g></g>'; }
// a food on its own (the 64 x 64 game art), centred on (cx, cy), size px, popping in
function food(id, cx, cy, size, u, tag){ const s=size*(0.82+0.18*back(u)); return '<g data-apart="'+(tag||id)+'" opacity="'+f2(sm(u*2.5))+'"><use href="#it_'+id+'" x="'+f2(cx-s/2)+'" y="'+f2(cy-s/2)+'" width="'+f2(s)+'" height="'+f2(s)+'"/></g>'; }
// the crayon red cross (drawn on, two rough strokes) or the green tick, in a round badge
function badge(kind, cx, cy, r, u, tag){ if(u<=0) return ''; const k=0.85+0.15*back(u*1.6);
  let g='<g data-apart="'+(tag||'badge')+'" opacity="'+f2(sm(u*4))+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(k)+')">';
  if(kind==='no'){ g+='<circle r="'+r+'" fill="${CREAM}" stroke="${RED}" stroke-width="9"/>';
    const d1=cl(u*2.2), d2=cl(u*2.2-0.9), L=r*0.5;
    const stroke=(x0,y0,x1,y1,d,j)=>{ if(d<=0) return ''; const x=x0+(x1-x0)*d, y=y0+(y1-y0)*d;
      return '<path d="M'+f2(x0)+' '+f2(y0)+' L'+f2(x)+' '+f2(y)+'" stroke="${RED}" stroke-width="'+(r*0.24)+'" stroke-linecap="round" fill="none"/>'
        +'<path d="M'+f2(x0+j)+' '+f2(y0-j)+' L'+f2(x+j)+' '+f2(y-j)+'" stroke="#E8776C" stroke-width="'+(r*0.08)+'" stroke-linecap="round" fill="none" opacity=".8"/>'; };
    g+=stroke(-L,-L*1.04,L*1.02,L,d1,2.5)+stroke(L*1.05,-L,-L,L*1.06,d2,-2.5); }
  else { g+='<circle r="'+r+'" fill="${GREEN}" stroke="${PEN}" stroke-width="7"/><path d="M'+f2(-r*.45)+' '+f2(r*.03)+' L'+f2(-r*.13)+' '+f2(r*.38)+' L'+f2(r*.48)+' '+f2(-r*.36)+'" fill="none" stroke="#fff" stroke-width="'+f2(r*.22)+'" stroke-linecap="round" stroke-linejoin="round"/>'; }
  return g+'</g>'; }
// the largest size up to max at which s is no wider than w
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// a card: optional title, lines, a small line; text block centred in the card (centreCheck)
function card(b, top, op, border){ const W0=790, x0=CX-W0/2, L=[];
  if(b.title) L.push({s:b.title, size:fitS(b.title,84,W0-90), fill: border, pitch: 82});
  b.lines.forEach((s,i)=>L.push({s, size:fitS(s, b.kind==='hook'?96:b.title?68:74, W0-80), pitch: b.kind==='hook'?104:b.title?74:82}));
  if(b.small) L.push({s:b.small, size:fitS(b.small,44,W0-90), fill:'#8A7468', pitch: 52});
  if(b.sub) L.push({s:b.sub, size:fitS(b.sub,64,W0-90), fill:'${RED}', pitch: 70});
  const hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+ (b.kind==='hook'?120:96);
  const c=centred(L, CX, top+hh/2, F);
  return { h: hh, svg: '<g data-box data-apart="card" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="'+(border||'${PEN}')+'" stroke-width="7"/>'+c.svg+'</g>' }; }
const CARD_TOP=300, FEET=1425;
// one frame: returns '' or the first rule it breaks
window.frame=function(t, D){
  let art='', ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at;
  const u=i===0?1:cl((lt+0.06)/0.32); // the hook is there at frame 1
  if(fade>0){
    const border=b.kind===NO?'${RED}':b.kind===YES?'${GREEN}':'${PEN}';
    const c=card(b, CARD_TOP, fade*(i===0?1:sm(u*3)), border); ov+=c.svg;
    let below=CARD_TOP+c.h;
    if(b.pill){ const py=below+82; ov+=pill(b.pill, CX, py, 58, F, { fill:'#C8323C', color:'#FFF8EC', padX:34, op: fade*sm((lt-0.5)/0.25) }).replace('<g data-box','<g data-box data-apart="pill"'); below=py+40; }
    // owner, 11 Nov 2026: Noodle is the star, about 1.5 to 1.8 times as big as before.
    // the "no" beats (and the hook): the badge over the food in a left column, Noodle big on the right, turned to the food;
    // the "share instead" beats: the food and the badge in a row under the card, Noodle long and big along the bottom; the vet line: Noodle alone, big
    const pose=b.kind===YES||b.kind==='game'?'yay':b.kind==='vet'?'sit':(i===0||lt<0.55)?'beg':'sit', bob=pose==='yay'?-Math.abs(Math.sin(t*8))*14:0;
    const fu=(k)=>i<=1?1:k;
    if(b.kind==='vet') art+=noodle(pose, D.n[pose], CX, FEET, 700, 640, 0, fade);
    else if(pose==='yay'){ const S=300, fy=Math.max(860, below+70+S*0.63), nh=Math.min(380, FEET-(fy+S*0.63)-50);
      art+=noodle(pose, D.n[pose], CX, FEET, nh, 720, bob, fade);
      art+=food(b.food[0], 300, fy, S, u); art+=badge('yes', 640, fy, 70, cl((lt-(b.kind==='game'?0.3:0.1))/0.3)); }
    else { art+=noodle(pose, D.n[pose], 650, FEET, pose==='beg'?690:620, 400, 0, fade, true);
      const bu=i<=1?cl((t-0.1)/0.5):cl((lt-0.15)/0.5); art+=badge('no', 225, 800, 70, bu);
      if(b.food.length===1) art+=food(b.food[0], 225, 1150, 300, fu(u));
      else { art+=food(b.food[0], 225, 1030, 190, u, 'food1'); art+=food(b.food[1], 225, 1290, 210, cl(u*1.2-0.15), 'food2'); } }
  }
  // the end card: paper and the card fade in once the scene has gone
  if(end){ ov+='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'; }
  $('art').innerHTML=art; $('ov').innerHTML=ov;
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  // the decorations (margins only) never touch anything: 20 px clear of every card, pill, badge, food and Noodle
  { const deco=[...$('bg').querySelectorAll('[data-deco]')].map((e)=>e.getBoundingClientRect()), things=[...$('st').querySelectorAll('#art [data-apart],#ov [data-apart],#ov [data-box]')].filter((e)=>+(e.getAttribute('opacity')||1)>0.05);
    if($('bg').getAttribute('opacity')!=='0') for(const e of things){ const r=e.getBoundingClientRect(); if(!r.width) continue; for(const d of deco){ const g=Math.max(d.left-r.right,r.left-d.right,d.top-r.bottom,r.top-d.bottom); if(g<20) return 'touches a decoration: '+(e.getAttribute('data-apart')||'box')+' '+Math.round(g)+' px'; } } }
  // the brief's tighter right edge for words and key art (x 850): every card, pill, food and dog
  for(const e of $('st').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(); if(r.width&&r.right>854&&+(e.getAttribute('opacity')||1)>0.05) return 'past x 850: '+(e.getAttribute('data-apart')||'box')+' '+Math.round(r.right); }
  return ''; };
// the cover: its own design, hook-led; key content inside the 1:1 crop (y 420..1500), the logo inside 4:5 (y 285..1635)
window.cover=function(D){
  let s='<rect width="${W}" height="${H}" fill="${PAPER}"/>';
  s+='<g data-box data-apart="title"><rect x="70" y="430" width="940" height="290" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'
    +centred([{s:'Stop feeding your dog',size:fitS('Stop feeding your dog',104,860),pitch:112},{s:'the turkey skin',size:fitS('the turkey skin',124,860),fill:'${RED}'}],540,575,F).svg+'</g>';
  // left: the turkey skin with the red cross; right: Noodle
  s+=badge('no', 125, 905, 58, 1, 'x');
  s+=food('skin', 425, 915, 270, 1, 'skin');
  s+=noodle('beg', D.n.beg, 815, 1095, 315, 300, 0, 1);
  // the swaps: four small plates and a green pill
  const sw=[['turkey',150],['beans',400],['pumpkin',650],['carrots',900]];
  sw.forEach(([id,x])=>{ s+=food(id, x, 1225, 200, 1, 'sw_'+id); });
  s+=pill('share these instead', 560, 1408, 70, F, { fill:'#CFE8C2', padX:40, color:'${GREEN}' }).replace('<g data-box','<g data-box data-apart="pill"');
  s+=badge('yes', 150, 1408, 46, 1, 'tick');
  const lw=380, lh=lw*280/900; s+='<svg data-apart="logo" x="'+(540-lw/2)+'" y="1505" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg>';
  $('bg').setAttribute('opacity',0); $('art').innerHTML=''; $('ov').innerHTML=s;
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),24); if(near.length) return 'cover too close: '+near.join('; ');
  for(const e of $('ov').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(), logo=e.getAttribute('data-apart')==='logo';
    if(logo?(r.top<285||r.bottom>1635):(r.top<420||r.bottom>1500||r.left<0||r.right>1080)) return 'cover: outside the '+(logo?'4:5':'1:1')+' crop: '+e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; };
</script>`;

const drawFor = (t) => ({ n: { beg: dogSvg('beg', t * 1.8), sit: dogSvg('sit', t * 1.8), yay: dogSvg('yay', t * 1.8) } });
(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app';
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [allText, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [allText, ht]))) throw new Error('Caveat or Andika did not load');
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames; voice at', VOAT.map((v) => v.k + ' ' + v.at.toFixed(2)).join(', '));
  const render = async (t, file) => { const err = await p.evaluate(([t, D]) => window.frame(t, D), [t, drawFor(t)]); if (err) throw new Error(err + ' at ' + t.toFixed(2)); await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'cover') {
    const err = await p.evaluate((D) => window.cover(D), drawFor(0.6)); if (err) throw new Error(err);
    const f = path.join(OUT, 'turkey-cover.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 92 }); console.log('wrote', f); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = [0, 0.7, ...BEATS.slice(1).map((x) => x.at + 0.9), LOOP + 0.15, LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  for (const fi of fr) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's kitchen music, scratches and ticks, Noodle on top ----
  const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'kitchen', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: B.game + 0.2, name: 'cooked' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
  const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
  ff(['-f', 'lavfi', '-i', 'anoisesrc=d=0.16:c=pink:a=0.5:r=44100', '-af', 'bandpass=f=2400:w=1800,afade=t=in:d=0.02,afade=t=out:st=0.08:d=0.08', path.join(WORK, 'scratch.wav')]);
  const EV = [['scratch', 0.12], ['scratch', 0.38]];
  BEATS.slice(2).forEach((x) => { if (x.kind === NO) EV.push(['scratch', x.at + 0.18], ['scratch', x.at + 0.42]); if (x.kind === YES) EV.push(['tick', x.at + 0.12]); });
  EV.push(['tick', B.game + 0.32], ['tick', LOOP + 0.15]);
  const fx = path.join(WORK, 'fx.wav');
  ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
    + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
  const voWav = path.join(WORK, 'voice.wav');
  ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
    + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
  const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
  const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
  const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
  const pre = path.join(WORK, 'premix.wav'), mixWav = path.join(WORK, 'mix.wav');
  ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
    `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-9dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
    '-map', '[a]', '-ar', '44100', pre]);
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
  ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  const mp4 = path.join(OUT, 'doodle-doggo-turkey-skin.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
