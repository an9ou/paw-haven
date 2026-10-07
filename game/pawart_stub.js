/* Paw Haven: placeholder art stub for the game prototype.
   Implements the FULL PawArt API from API.md with crude placeholder shapes,
   so the game can be built and tested before the real art modules land.
   Never shipped: the coordinator replaces the merge placeholder with the real modules. */
window.PawArt = window.PawArt || {};
(function () {
  const P = window.PawArt;
  const INK = '#2a2420';
  let uid = 0;
  const id = (p) => 'pas' + p + (++uid);

  if (!document.getElementById('pawart-stub-css')) {
    const st = document.createElement('style');
    st.id = 'pawart-stub-css';
    st.textContent = `
      .pa-stub-boil{animation:pa-stub-jig 1s steps(3,end) infinite;transform-origin:50% 90%;transform-box:fill-box}
      @keyframes pa-stub-jig{0%{transform:rotate(-1deg)}33%{transform:rotate(1deg) translateY(-1px)}66%{transform:rotate(0deg) translateX(1px)}}
      .pa-stub-walk .pa-stub-legA{animation:pa-stub-leg .5s steps(2,end) infinite}
      .pa-stub-walk .pa-stub-legB{animation:pa-stub-leg .5s steps(2,end) infinite reverse}
      @keyframes pa-stub-leg{0%{transform:translateX(-4px)}100%{transform:translateX(4px)}}
      html[data-motion="off"] .pa-stub-boil, html[data-motion="off"] .pa-stub-walk *, .pa-still .pa-stub-boil{animation:none!important}
      @media (prefers-reduced-motion: reduce){.pa-stub-boil,.pa-stub-walk *{animation:none!important}}
    `;
    document.head.appendChild(st);
  }

  if (!P.DOGS) P.DOGS = [
    { key: 'shiba', name: 'Mochi', breed: 'Shiba Inu', personality: 'Proud, independent, dramatic', joke: 'heh.' },
    { key: 'corgi', name: 'Biscuit', breed: 'Corgi', personality: 'Cheerful, greedy for food', joke: 'Do you have snacks? You have the face of someone with snacks.' },
    { key: 'golden', name: 'Sunny', breed: 'Golden Retriever', personality: 'Friendly, loves fetch', joke: 'HI. HI. I LOVE YOU. WHO ARE YOU.' },
    { key: 'dachs', name: 'Noodle', breed: 'Dachshund', personality: 'Curious, loves digging', joke: 'The rest of me will be here shortly.' },
    { key: 'husky', name: 'Frost', breed: 'Husky', personality: 'Energetic, chatty (howls)', joke: 'AWOOOO. (That means hello. Loudly.)' },
    { key: 'mutt', name: 'Pepper', breed: 'Shelter Mutt', personality: 'Loyal, gentle', joke: 'I am a little bit of every dog. Mostly the nice bits.' },
    // v2.5 breeds
    { key: 'poodle', name: 'Pretzel', breed: 'Poodle', personality: 'Thinks it is the smartest one in the room. It is.', joke: 'Haircut optional. Dignity not.' },
    { key: 'collie', name: 'Scout', breed: 'Border Collie', personality: 'Has counted the sheep. There are no sheep. Has counted you.', joke: 'Will herd the puppies, the ducks and the furniture.' },
    { key: 'samoyed', name: 'Cloud', breed: 'Samoyed', personality: 'Smiles so the snow does not stick. Also just smiles.', joke: 'Sheds a second dog every spring.' },
    { key: 'frenchie', name: 'Brioche', breed: 'French Bulldog', personality: 'Snores, snorts, sits on your foot. All three at once.', joke: 'Breathes like a tiny engine. Shade and water, please.' }
  ];
  const COAT = { shiba: ['#FF8A1E', '#FFE7B3'], corgi: ['#E9A35B', '#FFFFFF'], golden: ['#F6C445', '#FFE8A0'], dachs: ['#7A4A2A', '#B5774B'], husky: ['#8FA3B8', '#FFFFFF'], mutt: ['#FFFFFF', '#2a2420'],
    poodle: ['#F2C48F', '#FBE3C4'], collie: ['#2A2628', '#FFFFFF'], samoyed: ['#FBF6EC', '#E8DECB'], frenchie: ['#D9B48A', '#3A302E'] };

  const ln = (d, w = 5, c = INK) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const el = (cx, cy, rx, ry, f) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${INK}" stroke-width="5"/>`;

  function outfitSVG(o, hx, hy, bx, by, brx) {
    let s = '';
    if (!o) return s;
    if (o.body === 'Superhero Cape') s = `<path d="M${bx + 20} ${by - 20} L${bx - brx - 20} ${by + 30} L${bx - 10} ${by + 20} Z" fill="#E8322B" stroke="${INK}" stroke-width="4"/>` + s;
    if (o.body === 'Yellow Raincoat') s += `<ellipse cx="${bx}" cy="${by}" rx="${brx - 6}" ry="22" fill="#FFD21F" stroke="${INK}" stroke-width="4" opacity=".95"/>`;
    if (o.body === 'Knit Winter Sweater') s += `<ellipse cx="${bx}" cy="${by}" rx="${brx - 6}" ry="22" fill="#3B7BE0" stroke="${INK}" stroke-width="4"/>${ln(`M${bx - 30} ${by - 4} l10 8 l10 -8 l10 8 l10 -8 l10 8`, 3, '#fff')}`;
    if (o.neck === 'Red Bandana') s += `<path d="M${hx - 22} ${hy + 22} L${hx + 22} ${hy + 22} L${hx} ${hy + 46} Z" fill="#E8322B" stroke="${INK}" stroke-width="4"/>`;
    if (o.neck === 'Bow Tie') s += `<path d="M${hx} ${hy + 30} l-16 -9 v18 Z M${hx} ${hy + 30} l16 -9 v18 Z" fill="#7B3FE4" stroke="${INK}" stroke-width="4"/>`;
    if (o.head === 'Party Hat') s += `<path d="M${hx - 16} ${hy - 26} L${hx + 4} ${hy - 70} L${hx + 20} ${hy - 26} Z" fill="#FF5DA2" stroke="${INK}" stroke-width="4"/><circle cx="${hx + 4}" cy="${hy - 72}" r="6" fill="#FFC21A" stroke="${INK}" stroke-width="3"/>`;
    if (o.head === 'Flower Crown') s += [-22, -8, 6, 20].map((dx, i) => `<circle cx="${hx + dx}" cy="${hy - 30 + (i % 2) * 4}" r="7" fill="${['#FF5DA2', '#FFC21A', '#fff', '#E8322B'][i]}" stroke="${INK}" stroke-width="3"/>`).join('');
    if (o.eyes === 'Heart Sunglasses') s += `<path d="M${hx - 18} ${hy - 6} c-8 -10 -20 0 -10 10 l10 8 l10 -8 c10 -10 -2 -20 -10 -10 Z" fill="#E8322B" stroke="${INK}" stroke-width="3"/><path d="M${hx + 8} ${hy - 6} c-8 -10 -20 0 -10 10 l10 8 l10 -8 c10 -10 -2 -20 -10 -10 Z" fill="#E8322B" stroke="${INK}" stroke-width="3"/>`;
    return s;
  }

  if (!P.dog) P.dog = function (key, o = {}) {
    const pose = o.pose || 'idle';
    const anim = o.anim !== false;
    const [c1, c2] = COAT[key] || COAT.mutt;
    const long = key === 'dachs';
    const brx = long ? 92 : 58;
    let bx = 112, by = 142, hx = long ? 196 : 170, hy = 98, legs = true, lift = 0;
    let body = '', extra = '';
    if (pose === 'sit') { by = 150; hy = 84; hx = long ? 180 : 156; }
    if (pose === 'eat') { hx = 172; hy = 160; }
    if (pose === 'sleep') { by = 170; hy = 162; hx = long ? 196 : 170; legs = false; }
    if (pose === 'jump') { lift = -24; }
    if (pose === 'sad') { hy = 112; }
    const tail = key === 'shiba' ? `<circle cx="${bx - brx + 6}" cy="${by - 30}" r="18" fill="${c1}" stroke="${INK}" stroke-width="5"/>` : ln(`M${bx - brx + 4} ${by - 6} q-20 -30 -6 -44`, 9, INK);
    body += `<ellipse cx="120" cy="188" rx="${brx + 10}" ry="7" fill="#000" opacity=".12"/>`;
    body += tail;
    if (legs) {
      const ly = by + 12;
      const L = (x, cls) => `<g class="${cls}">${ln(`M${x} ${ly} L${x + (pose === 'jump' ? 10 : 0)} ${186 + (pose === 'jump' ? -16 : 0)}`, 11, INK)}${ln(`M${x} ${ly} L${x + (pose === 'jump' ? 10 : 0)} ${184 + (pose === 'jump' ? -16 : 0)}`, 6, c1)}</g>`;
      body += L(bx - brx + 22, 'pa-stub-legA') + L(bx - brx + 40, 'pa-stub-legB') + L(bx + brx - 40, 'pa-stub-legA') + L(bx + brx - 22, 'pa-stub-legB');
    }
    body += el(bx, by, brx, pose === 'sleep' ? 18 : 30, c1);
    body += `<ellipse cx="${bx + 8}" cy="${by + 8}" rx="${brx * 0.55}" ry="12" fill="${c2}"/>`;
    if (key === 'mutt') body += `<circle cx="${bx - 18}" cy="${by - 6}" r="12" fill="${INK}"/><circle cx="${bx + 24}" cy="${by + 4}" r="9" fill="${INK}"/>`;
    // ears
    const big = key === 'corgi' ? 1.6 : 1;
    if (key === 'dachs' || key === 'golden') body += el(hx - 26, hy + 4, 10, 20, c1) + el(hx + 26, hy + 4, 10, 20, c1);
    else body += `<path d="M${hx - 26} ${hy - 12} l${-6 * big} ${-34 * big} l${22} ${18} Z M${hx + 26} ${hy - 12} l${6 * big} ${-34 * big} l-22 18 Z" fill="${c1}" stroke="${INK}" stroke-width="5"/>`;
    body += el(hx, hy, 32, 30, c1);
    body += `<ellipse cx="${hx + 4}" cy="${hy + 14}" rx="16" ry="11" fill="${c2}"/>`;
    // face
    const shut = pose === 'pet' || pose === 'sleep';
    if (shut) body += ln(`M${hx - 18} ${hy - 4} q6 6 12 0 M${hx + 6} ${hy - 4} q6 6 12 0`, 4);
    else {
      body += `<circle cx="${hx - 12}" cy="${hy - 6}" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="${hx + 12}" cy="${hy - 7}" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
      const pc = key === 'husky' ? '#3B7BE0' : INK;
      body += `<circle cx="${hx - 11}" cy="${hy - 5}" r="4.5" fill="${pc}"/><circle cx="${hx + 13}" cy="${hy - 6}" r="3.5" fill="${pc}"/>`;
    }
    body += `<ellipse cx="${hx + 4}" cy="${hy + 8}" rx="6" ry="4" fill="${INK}"/>`;
    if (pose === 'sad') body += ln(`M${hx - 6} ${hy + 20} q10 -8 20 0`, 3);
    else body += ln(`M${hx - 6} ${hy + 16} q10 8 20 0`, 3);
    if (pose === 'happy' || pose === 'pet') { body += `<path d="M${hx + 4} ${hy + 18} q4 14 10 0" fill="#FF6F91" stroke="${INK}" stroke-width="2"/>`; extra += `<text x="${hx + 30}" y="${hy - 34}" font-size="22" fill="#E8322B">&#9829;</text><text x="${hx - 46}" y="${hy - 40}" font-size="16" fill="#E8322B">&#9829;</text>`; }
    if (pose === 'pet') body += `<ellipse cx="${hx - 20}" cy="${hy + 8}" rx="6" ry="3" fill="#FF8FB1"/><ellipse cx="${hx + 22}" cy="${hy + 8}" rx="6" ry="3" fill="#FF8FB1"/>`;
    if (pose === 'sleep') extra += `<text x="${hx + 24}" y="${hy - 30}" font-size="20" font-family="'Gloria Hallelujah',cursive" fill="${INK}">z z</text>`;
    if (pose === 'dirty') extra += `<circle cx="${bx - 20}" cy="${by - 4}" r="9" fill="#7A5230"/><circle cx="${bx + 30}" cy="${by + 10}" r="7" fill="#7A5230"/><circle cx="${hx - 10}" cy="${hy + 18}" r="5" fill="#7A5230"/>` + ln(`M${bx - 10} ${by - 46} q-6 -10 0 -20 M${bx + 10} ${by - 48} q6 -10 0 -20`, 3, '#6b8e23');
    body += outfitSVG(o.outfit, hx, hy, bx, by, brx);
    const inner = `<g transform="translate(0 ${lift})">${body}${extra}</g>`;
    const flip = o.facing === 'left' ? `<g transform="translate(240 0) scale(-1 1)">${inner}</g>` : inner;
    const label = (P.DOGS.find((d) => d.key === key) || {}).name || key;
    return `<svg class="pa-dog pa-pose-${pose}" viewBox="0 0 240 200" role="img" aria-label="${label}, ${pose}"><g class="${anim ? 'pa-stub-boil' : ''} ${pose === 'walk' && anim ? 'pa-stub-walk' : ''}">${flip}</g></svg>`;
  };

  if (!P.dogHead) P.dogHead = function (key) {
    const [c1, c2] = COAT[key] || COAT.mutt;
    return `<svg viewBox="0 0 100 100" role="img" aria-label="${key}"><path d="M22 40 l-6 -30 l24 16 Z M78 40 l6 -30 l-24 16 Z" fill="${c1}" stroke="${INK}" stroke-width="5"/><ellipse cx="50" cy="55" rx="34" ry="32" fill="${c1}" stroke="${INK}" stroke-width="5"/><ellipse cx="52" cy="70" rx="16" ry="11" fill="${c2}"/><circle cx="37" cy="48" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="62" cy="47" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="38" cy="49" r="4.5" fill="${INK}"/><circle cx="63" cy="48" r="3.5" fill="${INK}"/><ellipse cx="52" cy="62" rx="6" ry="4" fill="${INK}"/></svg>`;
  };

  const GI = '#5B3D32';
  const ICON_COL = { hunger: '#E8322B', happy: '#FFC21A', energy: '#3B7BE0', clean: '#5AC8FA', bond: '#FF5DA2', coin: '#FFC21A' };
  P.icon = function (name) {
    const c = ICON_COL[name] || '#9AD15A';
    const glyph = { hunger: 'B', happy: ':)', energy: 'Z', clean: 'o', bond: '♥', coin: '¢', feed: 'B', play: '●', walk: '»', shop: '$', wardrobe: 'T', house: '⌂', map: 'M', home: '⌂', back: '<', close: 'x', bath: '~', sleep: 'z', pet: '♥', 'sound-on': '♪', 'sound-off': '-', lock: 'L', star: '*', heart: '♥', check: '✓', speed: '>>', journal: 'J', bag: 'b', nose: 'n', charm: 'c', chest: '$', 'w-sunny': 'O', 'w-cloudy': 'c', 'w-rain': '/', 'w-snow': '*', 'w-night': 'C', 'w-dawn': 'd', 'w-dusk': 'u', music: 'm', sfx: 's', ambience: 'a', volume: 'v' }[name] || '?';
    if (name === 'settings') return `<svg viewBox="0 0 64 64" role="img" aria-label="settings"><g fill="#E2D6F0" stroke="${GI}" stroke-width="3" stroke-linejoin="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="28" y="6" width="8" height="12" rx="2" transform="rotate(${a} 32 32)"/>`).join('')}<circle cx="32" cy="32" r="16"/></g><circle cx="32" cy="32" r="6" fill="#FFFBF3" stroke="${GI}" stroke-width="3"/></svg>`;
    return `<svg viewBox="0 0 64 64" role="img" aria-label="${name}"><circle cx="32" cy="33" r="24" fill="${c}" fill-opacity=".55" stroke="${GI}" stroke-width="3"/><text x="32" y="43" text-anchor="middle" font-size="26" font-family="'Caveat',cursive" fill="${GI}">${glyph}</text></svg>`;
  };

  const ITEM_COL = { 'Basic Kibble': '#B5774B', 'Chicken & Rice Bowl': '#FFE8A0', 'Salmon Pâté': '#FF9E80', 'Bone-shaped Biscuit': '#F3D9A4', 'Pupcake': '#FF8FB1', 'Fresh Water': '#5AC8FA', 'Tennis Ball': '#C6F432', 'Rope Tug': '#E8322B', 'Squeaky Duck': '#FFD21F', 'Frisbee': '#3B7BE0', 'Plush Bone': '#FFFFFF', 'Puzzle Feeder': '#9AD15A', 'Red Bandana': '#E8322B', 'Yellow Raincoat': '#FFD21F', 'Knit Winter Sweater': '#3B7BE0', 'Party Hat': '#FF5DA2', 'Heart Sunglasses': '#E8322B', 'Superhero Cape': '#E8322B', 'Flower Crown': '#FF5DA2', 'Bow Tie': '#7B3FE4' };
  P.item = function (name) {
    const c = ITEM_COL[name] || '#ccc';
    const init = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2);
    return `<svg viewBox="0 0 64 64" role="img" aria-label="${name}"><rect x="8" y="12" width="48" height="42" rx="12" fill="${c}" stroke="${INK}" stroke-width="5"/><text x="32" y="41" text-anchor="middle" font-size="18" font-family="'Gloria Hallelujah',cursive" fill="${INK}">${init}</text></svg>`;
  };

  const HOUSE_COL = { 'Cardboard Box': '#C8A26B', 'Classic Wooden Doghouse': '#B5651D', 'Cozy Cottage': '#FF9E80', 'Snow Igloo': '#EAF6FF', 'Treehouse Den': '#6B8E23', 'Royal Castle Kennel': '#B9A7FF' };
  P.house = function (name) {
    const c = HOUSE_COL[name] || '#ccc';
    return `<svg viewBox="0 0 240 200" role="img" aria-label="${name}"><path d="M30 190 L30 90 L120 30 L210 90 L210 190 Z" fill="${c}" stroke="${INK}" stroke-width="6"/><path d="M95 190 L95 130 Q120 105 145 130 L145 190 Z" fill="#2a2420"/><text x="120" y="80" text-anchor="middle" font-size="15" font-family="'Gloria Hallelujah',cursive" fill="${INK}">${name.split(' ')[0]}</text></svg>`;
  };

  const wrapScene = (inner, label) => `<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">${inner}</svg>`;
  const txt = (s, x, y, size = 30, c = INK) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-family="'Gloria Hallelujah',cursive" fill="${c}">${s}</text>`;
  const SKY = { dawn: '#FBC9B8', day: '#8FD3FF', dusk: '#E9A6C9', night: '#1F2A4D' };
  function skyLayer(o) { const t = o.time || 'day', w = o.weather || 'sunny'; const sky = w === 'rain' || w === 'cloudy' ? (t === 'night' ? '#2A3045' : '#AEB8C4') : SKY[t]; let s = `<rect width="1000" height="600" fill="${sky}"/>`; if (t === 'night') s += [80, 260, 520, 700, 900, 400].map((x, i) => `<circle cx="${x}" cy="${40 + (i * 37) % 120}" r="3" fill="#FFF6C8"/>`).join('') + `<circle cx="860" cy="90" r="40" fill="#F4F0DC" stroke="${INK}" stroke-width="5"/>`; else if (w === 'sunny' || w === 'cloudy') s += `<circle cx="860" cy="${t === 'day' ? 90 : 170}" r="50" fill="#FFC21A" stroke="${INK}" stroke-width="6"/>`; if (w !== 'sunny') s += `<path d="M120 90 q30 -40 80 -10 q40 -30 70 10 q40 0 20 30 h-170 q-30 -10 0 -30z" fill="#D8DEE6" stroke="${INK}" stroke-width="4"/>`; return s; }
  const groundCol = (o) => (o.weather === 'snow' ? '#F4F7FA' : '#35B544');
  P.scene = function (name, o = {}) {
    if (name === 'yard') return wrapScene(`${skyLayer(o)}<rect y="400" width="1000" height="200" fill="${groundCol(o)}"/>${[...Array(21)].map((_, i) => `<rect x="${i * 50}" y="350" width="24" height="80" fill="#fff" stroke="${INK}" stroke-width="4"/>`).join('')}<path d="M40 420 L40 230 L130 160 L220 230 L220 420 Z" fill="#FF9E80" stroke="${INK}" stroke-width="6"/>${txt('YARD (stub) ' + (o.time || 'day') + ' / ' + (o.weather || 'sunny'), 500, 60, 30, o.time === 'night' ? '#fff' : INK)}`, 'Home Yard');
    if (name === 'market') {
      const shop = (x, key, label, c) => `<g data-shop="${key}"><rect x="${x}" y="200" width="240" height="280" fill="${c}" stroke="${INK}" stroke-width="6"/><rect x="${x + 20}" y="150" width="200" height="60" fill="#fff" stroke="${INK}" stroke-width="5"/>${txt(label, x + 120, 190, 22)}<rect x="${x + 85}" y="360" width="70" height="120" fill="#2a2420"/></g>`;
      return wrapScene(`${skyLayer(o)}<rect y="480" width="1000" height="120" fill="#C8A26B"/>${shop(130, 'kibble', 'Kibble Corner', '#FF9E80')}${shop(380, 'boutique', 'Bow-Wow Boutique', '#FF8FB1')}${shop(630, 'builder', 'Barkitecture', '#9AD15A')}`, 'Market Street');
    }
    if (name === 'shelter') return wrapScene(`<rect width="1000" height="600" fill="#FFF1C9"/><rect y="470" width="1000" height="130" fill="#C8A26B"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${90 + i * 170}" y="180" width="140" height="180" fill="none" stroke="${INK}" stroke-width="6"/>`).join('')}${txt('PAW HAVEN SHELTER (stub)', 500, 110, 40)}`, 'Paw Haven Shelter');
    if (name === 'map') {
      const locked = o.locked || [];
      const A = { yard: [250, 420, 'Home Yard', '#9AD15A'], market: [460, 300, 'Market Street', '#FF9E80'], shelter: [250, 200, 'Shelter', '#FFE8A0'], park: [680, 430, 'Sunny Park', '#35B544'], river: [720, 240, 'Riverside Trail', '#5AC8FA'], woods: [470, 130, 'Maple Woods', '#2E7D32'], beach: [860, 120, 'Seashell Beach', '#FFD58A'] };
      const B = { river: 2, woods: 5, beach: 8 };
      let s = `<rect width="1000" height="600" fill="#FFF8E1"/>${ln('M250 420 L460 300 L680 430 M460 300 L250 200 M460 300 L720 240 L860 120 M460 300 L470 130', 8, '#C8A26B')}`;
      for (const k in A) {
        const [x, y, label, c] = A[k];
        s += `<g data-area="${k}"><ellipse cx="${x}" cy="${y}" rx="95" ry="55" fill="${c}" stroke="${INK}" stroke-width="5"/>${txt(label, x, y + 8, 22)}${locked.includes(k) ? `<rect x="${x + 50}" y="${y - 70}" width="34" height="30" fill="#FFC21A" stroke="${INK}" stroke-width="4"/>${txt('Bond ' + (B[k] || '?'), x + 67, y - 78, 18)}` : ''}</g>`;
      }
      return wrapScene(s, 'Town map');
    }
    return P.scene('yard', o); // world A falls back to the yard for unknown scenes
  };

  const STRIP = { park: ['#8FD3FF', '#35B544', '#2E7D32'], river: ['#A7E1FF', '#5AC8FA', '#3B7BE0'], woods: ['#5E7F5A', '#3E5F2E', '#1E3A1E'], beach: ['#9EE3FF', '#FFE0A3', '#29B6F6'] };
  P.walkStrip = function (area, o = {}) {
    let [sky, ground, accent] = STRIP[area] || STRIP.park; if (o.time === 'night') sky = '#1F2A4D'; else if (o.weather === 'rain') sky = '#AEB8C4'; if (o.weather === 'snow') ground = '#F4F7FA';
    let s = `<rect width="1200" height="400" fill="${sky}"/><rect y="330" width="1200" height="70" fill="${ground}"/>${ln('M0 330 L1200 330', 5)}`;
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 300;
      if (area === 'beach') s += `<path d="M${x - 60} 320 q30 -20 60 0 q30 -20 60 0" fill="none" stroke="${accent}" stroke-width="8"/>`;
      else s += `<rect x="${x - 8}" y="220" width="16" height="110" fill="#7A4A2A" stroke="${INK}" stroke-width="4"/><circle cx="${x}" cy="200" r="${area === 'woods' ? 60 : 45}" fill="${accent}" stroke="${INK}" stroke-width="5"/>`;
    }
    s += txt(area + ' (stub)', 600, 60, 30);
    return `<svg viewBox="0 0 1200 400" preserveAspectRatio="none" role="img" aria-label="${area} walk">${s}</svg>`;
  };

  const COL_C = { chest: '#C8A26B', 'map-piece': '#F5E6C8', 'sparkle-spot': '#FFE3A1', 'junk-sock': '#E0D5F0', 'junk-rock': '#A8968A', coin: '#FFC21A', shell: '#FFB3C7', leaf: '#E07B24', bone: '#FFFFFF', flower: '#FF5DA2', acorn: '#8B5A2B', sniff: '#B7E36B', puddle: '#5AC8FA', dig: '#8B5A2B' };
  P.collectible = function (name) {
    const c = COL_C[name] || '#ccc';
    let shape = `<circle cx="30" cy="30" r="20" fill="${c}" stroke="${INK}" stroke-width="5"/>`;
    if (name === 'puddle') shape = `<ellipse cx="30" cy="44" rx="27" ry="9" fill="${c}" stroke="${INK}" stroke-width="4"/>`;
    if (name === 'dig') shape = `<path d="M6 52 Q30 20 54 52 Z" fill="${c}" stroke="${INK}" stroke-width="4"/>${ln('M22 34 l16 12 M38 34 l-16 12', 4, '#E8322B')}`;
    if (name === 'sniff') shape = `<path d="M15 45 q-10 -15 5 -22 q0 -15 15 -10 q12 -10 18 8 q12 8 0 20 Z" fill="${c}" stroke="${INK}" stroke-width="4" opacity=".85"/>`;
    return `<svg viewBox="0 0 60 60" role="img" aria-label="${name}">${shape}</svg>`;
  };

  P.prop = function (name, o) {
    if (name === 'speech') return `<svg viewBox="0 0 200 120" preserveAspectRatio="none" role="img" aria-label="speech bubble"><path d="M14 12 Q100 4 188 12 Q196 50 188 88 L66 90 L34 116 L42 90 L14 88 Q6 50 14 12 Z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.5" vector-effect="non-scaling-stroke"/><path d="M16 15 Q100 8 185 14" fill="none" stroke="#5B3D32" stroke-width="1" opacity=".5" vector-effect="non-scaling-stroke"/></svg>`;
    if (name === 'panel') return `<svg viewBox="0 0 300 200" preserveAspectRatio="none" role="img" aria-label="paper panel"><path d="M8 10 Q150 4 292 9 Q297 100 291 191 Q150 196 9 190 Q3 100 8 10 Z" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.5" vector-effect="non-scaling-stroke"/><path d="M11 13 Q150 8 289 12" fill="none" stroke="#5B3D32" stroke-width="1.2" opacity=".5" vector-effect="non-scaling-stroke"/><rect x="118" y="-2" width="64" height="16" fill="#F28FA5" opacity=".65" transform="rotate(-3 150 6)"/></svg>`;
    if (name === 'bowl') { const f = o && o.food; const fc = { 'Basic Kibble': '#B5774B', 'Chicken & Rice Bowl': '#FFF4DF', 'Salmon Pâté': '#F9B7A8', 'Bone-shaped Biscuit': '#F3D9A4', 'Pupcake': '#FF8FB1', 'Fresh Water': '#A7E1FF', 'Wild Berries': '#7B3FE4', "Duck's Picnic Sandwich": '#E9C46A', 'Golden Bone': '#FFC21A' }[f]; return `<svg viewBox="0 0 120 120" role="img" aria-label="bowl ${f || 'empty'}"><path d="M15 70 H105 L92 100 H28 Z" fill="${f === 'Fresh Water' ? '#3B7BE0' : '#F28FA5'}" stroke="#5B3D32" stroke-width="4"/>${fc ? `<ellipse cx="60" cy="68" rx="40" ry="12" fill="${fc}" stroke="#5B3D32" stroke-width="3"/><text x="60" y="64" text-anchor="middle" font-size="13" font-family="Caveat,cursive" fill="#5B3D32">${(f || '').split(' ')[0]}</text>` : ''}</svg>`; }
    if (name === 'snowman') return `<svg viewBox="0 0 120 120" role="img" aria-label="snowman"><circle cx="60" cy="85" r="26" fill="#fff" stroke="#5B3D32" stroke-width="3"/><circle cx="60" cy="45" r="18" fill="#fff" stroke="#5B3D32" stroke-width="3"/><path d="M60 47 l14 3 l-14 3z" fill="#F4A262"/></svg>`;
    if (name === 'torn-map') { const pc = (o && o.pieces) || [], q = { park: [0, 0], river: [120, 0], woods: [0, 80], beach: [120, 80] }; return `<svg viewBox="0 0 240 160" role="img" aria-label="torn map">${Object.keys(q).map((k) => pc.includes(k) ? `<rect x="${q[k][0] + 3}" y="${q[k][1] + 3}" width="114" height="74" fill="#F5E6C8" stroke="#5B3D32" stroke-width="2" transform="rotate(${k.length % 3 - 1} ${q[k][0] + 60} ${q[k][1] + 40})"/>` : '').join('')}${pc.length >= 4 ? '<path d="M30 130 Q100 30 160 100 T210 40" fill="none" stroke="#5B3D32" stroke-width="2" stroke-dasharray="6 5"/><path d="M200 30 l16 16 M216 30 l-16 16" stroke="#C9475E" stroke-width="4"/>' : ''}</svg>`; }
    if (name === 'tape') return `<svg viewBox="0 0 120 30" role="img" aria-label="washi tape"><path d="M4 4 L116 2 L113 9 L117 15 L114 22 L117 28 L5 28 L8 21 L3 15 L7 9 Z" fill="#9ED9C3" opacity=".8"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${10 + i * 15}" y="4" width="6" height="23" fill="#fff" opacity=".45" transform="skewX(-20)"/>`).join('')}</svg>`;
    const body = {
      'bowl-empty': `<path d="M15 70 H105 L92 100 H28 Z" fill="#E8322B" stroke="${INK}" stroke-width="5"/>`,
      'bowl-full': `<path d="M15 70 H105 L92 100 H28 Z" fill="#E8322B" stroke="${INK}" stroke-width="5"/><ellipse cx="60" cy="68" rx="40" ry="12" fill="#B5774B" stroke="${INK}" stroke-width="4"/>`,
      'water-bowl': `<path d="M15 70 H105 L92 100 H28 Z" fill="#3B7BE0" stroke="${INK}" stroke-width="5"/><ellipse cx="60" cy="70" rx="40" ry="10" fill="#A7E1FF"/>`,
      tub: `<path d="M5 50 H115 L100 110 H20 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="6"/><circle cx="30" cy="48" r="12" fill="#E0F7FF" stroke="${INK}" stroke-width="3"/><circle cx="85" cy="45" r="14" fill="#E0F7FF" stroke="${INK}" stroke-width="3"/>`,
      bubbles: `<circle cx="40" cy="60" r="20" fill="#E0F7FF" stroke="${INK}" stroke-width="4"/><circle cx="75" cy="45" r="14" fill="#E0F7FF" stroke="${INK}" stroke-width="4"/>`,
      zzz: txt('Zz', 60, 70, 46),
      hearts: `<text x="30" y="70" font-size="50" fill="#E8322B">&#9829;</text>`,
      'poop-joke': `<path d="M30 80 q-20 -20 10 -35 q10 -25 35 -10 q25 0 20 25 q15 15 -10 25 Z" fill="#B7E36B" stroke="${INK}" stroke-width="4"/>`,
      ball: `<circle cx="60" cy="60" r="28" fill="#C6F432" stroke="${INK}" stroke-width="6"/>`,
      frisbee: `<ellipse cx="60" cy="60" rx="44" ry="16" fill="#3B7BE0" stroke="${INK}" stroke-width="6"/>`
    }[name] || txt(name, 60, 60, 16);
    return `<svg viewBox="0 0 120 120" role="img" aria-label="${name}">${body}</svg>`;
  };
  // v1.3.1 stub bed: viewBox 0 0 260 160, floor at y=152, front lip in .pa-bed-front
  if (!P.bed) P.bed = function (name) {
    const col = { 'Old Blanket': '#E9B872', 'Plaid Pillow': '#C9475E', 'Fluffy Donut Bed': '#F6B8C8', 'Banana Bed': '#F5D547', 'Hammock Cot': '#7FB7A4', 'Cloud Bed': '#E8F1FB', 'Royal Canopy Bed': '#8E5BB5' }[name] || '#E9B872';
    return `<svg viewBox="0 0 260 160" role="img" aria-label="${name}"><ellipse cx="130" cy="150" rx="120" ry="8" fill="#5B3D32" opacity=".15"/><path d="M20 140 Q14 70 130 66 Q246 70 240 140 Z" fill="${col}" stroke="${INK}" stroke-width="4"/><ellipse cx="130" cy="104" rx="86" ry="24" fill="#FFFBF3" stroke="${INK}" stroke-width="3" opacity=".8"/><g class="pa-bed-front"><path d="M14 152 Q12 116 40 112 Q130 128 220 112 Q248 116 246 152 Z" fill="${col}" stroke="${INK}" stroke-width="4"/><text x="130" y="142" text-anchor="middle" font-size="16" font-family="sans-serif" fill="${INK}">${name}</text></g></svg>`;
  };
})();
