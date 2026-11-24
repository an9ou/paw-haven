/* Doodle Doggo merch spike: PawPrint core (no game state, no storage, no DOM).
   PawPrintMake(PA, PG, FONT) -> the PawPrint API, given the game's own dog art (window.PawArt from dogs/pawart_dogs.js), PawGenes (mods/genes.js)
   and the Caveat Bold outlines (merch/pawprint_font.js). tools/merch_build.js wraps the three and this file into one script, merch/dist/pawprint.js.

   The recipe (merchRecipe): the smallest JSON from which the game redraws a dog exactly (PawArt.dog is a pure function of its options):
     { v: 1, b: PawGenes BREEDS index, g: genes code | null, e: eyes index (EYES), p: art seed (uint32), a: AGES index, s: 'f' | 'm',
       sp: 1 (sparkle, only when set), h: mix head BREEDS index (only for a mix), o: [WEAR indexes] (only what it wears), n: name (optional, <= 20 chars) }
     genes code: one digit per locus B D E S M Bl = how many dominant alleles (0-2), then 'a<0-2>' / 'i<0-2>' only when the dog's genes carry the
     tan-point (A: at) / red-intensity (I) locus (their presence changes the coat, so "absent" is its own state).
   What the Dog Card recipe (40_dogcards.js dcDogOf) lacks and this adds: all six wear slots (a card keeps one outfit), the Crayon Medal charm and the
   wearables a card list never had (WEAR below: DC_OUTFITS first, in their order, then the rest of the art's table; append only), the mix head,
   the newborn stage, the eyes always (a card sends them only when the id roll decides them) and the exact art seed always.
   Left out on purpose: wet fur, the pool's life vest, the nap pyjamas and an expecting belly (moments, not the dog), the pose (a print option),
   the dog's id (the seed and the eyes are what the id decides).

   Wire format (merchEncode / merchDecode, base64url in #p=...): 1 version byte, 1 count byte, per dog: breed, genes (2 bytes), flags
   (eyes 2 bits, age 2, sex 1, sparkle 1, mix 1, name 1), seed (4), [mix head], wear count + indexes, [name: byte length + UTF-8], then a
   2-byte check (FNV-1a of everything before it) so a cut or mistyped link fails instead of drawing the wrong dog. */
function PawPrintMake(PA, PG, FONT) {
  'use strict';
  const VERSION = 1, MAX_DOGS = 8, NAME_MAX = 20, HASH_MAX = 1024, SAVE_MAX = 8 * 1024 * 1024, SAVE_DOGS = 64;
  const BREEDS = PG.BREEDS.slice();
  const EYES = ['brown', 'amber', 'blue', 'odd']; // = DC_EYES (append only)
  const AGES = ['adult', 'puppy', 'newborn'];
  const LOCI = [['B', 'B', 'b'], ['D', 'D', 'd'], ['E', 'E', 'e'], ['S', 'S', 'sp'], ['M', 'M', 'm'], ['Bl', 'Bl', 'bl']];
  const XLOCI = [['A', 'at', 'a', 'a'], ['I', 'I', 'i', 'i']]; // [locus, dominant, recessive, code letter]
  const SLOTS = { h: 'head', e: 'eyes', n: 'neck', b: 'body', f: 'feet', c: 'charm' };
  // append only. 0-58 = DC_OUTFITS (40_dogcards.js) in its order, so a Dog Card outfit index is a WEAR index; then the art's other wearables (dogs/pawart_dogs.js OUT)
  const WEAR = ['nRed Bandana', 'hParty Hat', 'nBow Tie', 'hFlower Crown', 'eHeart Sunglasses', 'bYellow Raincoat', 'bPolka-dot Raincoat', 'bFrog Raincoat', 'bBubble Raincoat', 'hRain Hat',
    'hPom-pom Beanie', 'bKnit Winter Sweater', 'bSuperhero Cape', 'nSailor Collar', 'hChef Hat', 'bTutu', 'hCowboy Hat', 'bPyjamas', 'bBumblebee Suit', 'hWizard Hat',
    'bHappi Coat', 'bCozy Hoodie', 'nKnit Scarf', 'hLeaf Beret', 'nAutumn Scarf', 'bGhost Sheet', 'bPumpkin Suit', 'nParade Rosette', 'hWitch Hat', 'bVampire Cape',
    'nCandy Corn Bandana', 'bBat Wings', 'bVery Ugly Sweater', 'hReindeer Antlers', 'nSnowflake Snood', 'nUgly Sweater Rosette', 'hYear of the Sheep Hood', 'hAstronaut Helmet',
    'hAcorn Cap', 'eExplorer Goggles', 'nSeashell Necklace', 'bMossy Poncho', 'nClover Collar', 'hSun Hat', 'nShibuya Bandana', 'nAsakusa Bandana', 'nTokyo Tower Bandana',
    'bPumpkin Patch Suit', 'bTrick-or-Treat Ghost', 'bLittle Bat Costume', 'nGolden Name Tag', 'bSukajan Jacket', 'hBucket Hat', 'fLittle Sneakers', 'nPaw Tote', 'eRound Shades',
    'nLucky Cat Charm', 'nFollower Star Bandana', 'nFriendship Bandana',
    'hSailor Cap', 'hCrayon Crown', 'nRainbow Collar', 'nSunflower Collar', 'nGolden Collar', 'nLion Mane', 'nJingle Bell Collar', 'nStar Collar', 'bLittle Witch Hat & Cape',
    'bScarecrow Overalls', 'bMummy Wraps', 'bSkeleton Suit', 'bBlack Cat Ears & Bow', 'bPirate Hat & Sash', 'bDinosaur Hood', 'bLittle Owl Wings', 'bWizard Robe & Star Hat',
    'bFather Christmas Suit', 'bLittle Elf Outfit', 'bGingerbread Pup Suit', 'bSnowman Suit', 'bPolar Bear Hood', 'bPenguin Suit', 'bPuffer Jacket', 'bNutcracker Jacket & Hat',
    'bSnowflake Wings', 'cCrayon Medal'].map((s) => ({ slot: SLOTS[s[0]], n: s.slice(1) }));
  const POSE_FB = { crouch: 'sit', shake: 'happy', cold: 'sad', hot: 'happy', dig: 'eat', squat: 'sit', leglift: 'sit' }; // = 03_yard.js dogArtSafe
  const POSES = { stand: 'idle', idle: 'idle', sit: 'sit', happy: 'happy', walk: 'walk', jump: 'jump', down: 'down', sniff: 'sniff', paw: 'paw', bow: 'bow', beg: 'beg', dance: 'dance' };
  const INK = '#5B3D32', PAPER = '#FFFBF3';

  /* ---------------- small helpers ---------------- */
  const hashId = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }; // = 13_more_dogs.js hashId
  const fnv16 = (u8, n) => { let h = 2166136261; for (let i = 0; i < n; i++) { h ^= u8[i]; h = Math.imul(h, 16777619); } return (h ^ (h >>> 16)) & 0xFFFF; };
  const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
  const f1 = (n) => Math.round(n * 10) / 10;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const artKnows = (() => { const k = new Set((PA.DOGS || []).map((d) => d.key)); return (key) => k.has(key); })();
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------------- names: only what the print font can draw ---------------- */
  // NFC, no control or format characters, spaces collapsed, at most NAME_MAX characters, every character in the font; else null
  function cleanName(s) {
    if (typeof s !== 'string') return null;
    let t = s.normalize('NFC').replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
    const cps = Array.from(t); if (!cps.length || cps.length > NAME_MAX) return cps.length ? cleanName(cps.slice(0, NAME_MAX).join('')) : null;
    return cps.every((c) => FONT.g[c]) ? t : null;
  }
  const nameChars = () => Object.keys(FONT.g).join('');

  /* ---------------- genes ---------------- */
  const cnt = (pair, dom) => (pair[0] === dom ? 1 : 0) + (pair[1] === dom ? 1 : 0);
  const okPair = (p, a, b) => Array.isArray(p) && p.length === 2 && p.every((x) => x === a || x === b);
  function geneCode(g) {
    if (!g || typeof g !== 'object') return null;
    const mutt = PG.STARTER_GENES.mutt; let s = '';
    for (const [k, d, r] of LOCI) s += cnt(okPair(g[k], d, r) ? g[k] : mutt[k], d); // PawGenes normGenes: a missing or odd locus is the mutt's
    for (const [k, d, r, c] of XLOCI) if (okPair(g[k], d, r)) s += c + cnt(g[k], d);
    return s;
  }
  function genesFrom(code) {
    if (code == null) return null;
    const m = /^([0-2]{6})(?:a([0-2]))?(?:i([0-2]))?$/.exec(String(code)); if (!m) return undefined;
    const g = {}, pair = (n, d, r) => (n === 2 ? [d, d] : n === 1 ? [d, r] : [r, r]);
    LOCI.forEach(([k, d, r], i) => { g[k] = pair(+m[1][i], d, r); });
    if (m[2] != null) g.A = pair(+m[2], 'at', 'a'); if (m[3] != null) g.I = pair(+m[3], 'I', 'i');
    return g;
  }

  /* ---------------- the recipe from a dog of the save ---------------- */
  // d: a dog of S.dogs as saved (key, genes, id, artSeed, born, mix, sparkle, outfit, name). o.today: a Date (the age is counted as ageMonths in 10_sex_age_genes.js)
  function ageStage(d, today) {
    if (!d.born) return 0; const t = new Date(today ? today.getTime() : Date.now()); t.setHours(0, 0, 0, 0);
    const b = new Date(d.born + 'T00:00:00'); if (isNaN(b)) return 0;
    const m = Math.max(0, Math.round((t - b) / 864e5)); return m < 1 ? 2 : m < 6 ? 1 : 0;
  }
  function merchRecipe(d, o) {
    o = o || {}; if (!d || typeof d !== 'object' || typeof d.key !== 'string') return null;
    const b = BREEDS.indexOf(d.key); if (b < 0) return null;
    const g = geneCode(d.genes), id = d.id != null ? d.id : '';
    let e = 0; if (g) { try { e = Math.max(0, EYES.indexOf(PG.phenotype(d.genes, d.key, id).eyes)); } catch (x) { e = 0; } }
    const r = { v: VERSION, b, g, e, p: (Number.isInteger(d.artSeed) && d.artSeed >= 0 && d.artSeed <= 0xFFFFFFFF ? d.artSeed : hashId(id)) >>> 0, a: ageStage(d, o.today), s: d.sex === 'female' ? 'f' : 'm' };
    if (d.sparkle) r.sp = 1;
    const mh = d.mix && typeof d.mix.head === 'string' && d.mix.head !== d.key ? BREEDS.indexOf(d.mix.head) : -1; if (mh >= 0) r.h = mh;
    const fit = d.outfit && typeof d.outfit === 'object' ? d.outfit : {}, wear = [];
    for (const slot of ['head', 'eyes', 'neck', 'body', 'feet', 'charm']) { const i = WEAR.findIndex((w) => w.slot === slot && w.n === fit[slot]); if (i >= 0) wear.push(i); }
    if (wear.length) r.o = wear;
    const n = o.name === false ? null : cleanName(o.name != null ? o.name : d.name); if (n) r.n = n;
    return r;
  }

  /* ---------------- checking a recipe (from a link, a cart, a server request) ---------------- */
  function check(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return { ok: false, err: 'not an object' };
    const allowed = new Set(['v', 'b', 'g', 'e', 'p', 'a', 's', 'sp', 'h', 'o', 'n']);
    for (const k of Object.keys(r)) if (!allowed.has(k)) return { ok: false, err: 'unknown field ' + String(k).slice(0, 12) };
    if (r.v !== VERSION) return { ok: false, err: 'version' };
    if (!isInt(r.b, 0, BREEDS.length - 1) || !artKnows(BREEDS[r.b])) return { ok: false, err: 'breed' };
    if (r.g !== null && (typeof r.g !== 'string' || !genesFrom(r.g))) return { ok: false, err: 'genes' };
    if (!isInt(r.e, 0, EYES.length - 1)) return { ok: false, err: 'eyes' };
    if (!isInt(r.p, 0, 0xFFFFFFFF)) return { ok: false, err: 'seed' };
    if (!isInt(r.a, 0, AGES.length - 1)) return { ok: false, err: 'age' };
    if (r.s !== 'f' && r.s !== 'm') return { ok: false, err: 'sex' };
    if (r.sp !== undefined && r.sp !== 1) return { ok: false, err: 'sparkle' };
    if (r.h !== undefined && (!isInt(r.h, 0, BREEDS.length - 1) || r.h === r.b || !artKnows(BREEDS[r.h]))) return { ok: false, err: 'mix' };
    if (r.o !== undefined) {
      if (!Array.isArray(r.o) || !r.o.length || r.o.length > 6) return { ok: false, err: 'wear' };
      const seen = new Set(); for (const i of r.o) { if (!isInt(i, 0, WEAR.length - 1) || seen.has(WEAR[i].slot)) return { ok: false, err: 'wear' }; seen.add(WEAR[i].slot); }
    }
    if (r.n !== undefined && cleanName(r.n) !== r.n) return { ok: false, err: 'name' };
    return { ok: true };
  }

  /* ---------------- the art options: exactly what the game passes PawArt.dog (13_more_dogs.js dogOpts / lookOpts, 58_share.js shSVG) ---------------- */
  function artOpts(r, o) {
    o = o || {}; const key = BREEDS[r.b], genes = genesFrom(r.g);
    const outfit = { head: null, eyes: null, neck: null, body: null, feet: null, charm: null };
    (r.o || []).forEach((i) => { outfit[WEAR[i].slot] = WEAR[i].n; });
    const ex = { pose: o.pose || 'happy', outfit, facing: o.facing === 'left' ? 'left' : 'right', anim: false };
    if (o.expr) ex.expr = o.expr;
    const age = r.a === 2 ? 'newborn' : r.a === 1 ? 'puppy' : null, mixHead = r.h !== undefined ? BREEDS[r.h] : null, sparkle = r.sp === 1;
    const L = age || mixHead || sparkle ? { age, mixHead, sparkle, expecting: false } : null;
    if (genes) {
      const ph = PG.phenotype(genes, key, 'merch'); const coat = Object.assign({}, ph.coat, { eyes: EYES[r.e] }); // the id only decides the eyes: the recipe carries them
      ex.coat = L ? Object.assign({}, coat, { look: L }) : coat; ex.seed = r.p;
    }
    if (L) { if (age) ex.age = age; if (mixHead) ex.mix = { head: mixHead }; if (sparkle) ex.sparkle = true; }
    return { key, ex };
  }
  // the dog's own SVG, byte for byte what the game draws for the same dog, pose and outfit
  function dogSVG(r, o) {
    const c = check(r); if (!c.ok) throw new Error('bad recipe: ' + c.err);
    const pose = POSES[(o && o.pose) || 'happy'] || 'happy', A = artOpts(r, Object.assign({}, o, { pose }));
    let sv = PA.dog(A.key, A.ex);
    if (POSE_FB[pose] && !sv.includes('pa-pose-' + pose)) sv = PA.dog(A.key, Object.assign({}, A.ex, { pose: POSE_FB[pose] }));
    return sv;
  }

  /* ---------------- geometry: the drawn box of a dog SVG (svg, g, path M/L/l/H/V/C/Q/Z, ellipse, circle; translate/scale/matrix) ---------------- */
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  function parseTf(s) {
    let M = [1, 0, 0, 1, 0, 0]; if (!s) return M;
    for (const m of s.matchAll(/(translate|scale|matrix|rotate)\(([^)]*)\)/g)) {
      const a = m[2].trim().split(/[\s,]+/).map(Number);
      const T = m[1] === 'translate' ? [1, 0, 0, 1, a[0], a[1] || 0] : m[1] === 'scale' ? [a[0], 0, 0, a.length > 1 ? a[1] : a[0], 0, 0] : m[1] === 'matrix' ? a
        : (() => { const t = a[0] * Math.PI / 180, c = Math.cos(t), s2 = Math.sin(t), R = [c, s2, -s2, c, 0, 0]; return a.length > 2 ? mul(mul([1, 0, 0, 1, a[1], a[2]], R), [1, 0, 0, 1, -a[1], -a[2]]) : R; })();
      M = mul(M, T);
    }
    return M;
  }
  function bbox(svg) {
    const bb = [1e9, 1e9, -1e9, -1e9], stack = [[1, 0, 0, 1, 0, 0]];
    const add = (M, x, y, pad) => { const X = M[0] * x + M[2] * y + M[4], Y = M[1] * x + M[3] * y + M[5], p = pad * Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])); bb[0] = Math.min(bb[0], X - p); bb[1] = Math.min(bb[1], Y - p); bb[2] = Math.max(bb[2], X + p); bb[3] = Math.max(bb[3], Y + p); };
    const at = (s, n) => { const m = new RegExp('\\s' + n + '="([^"]*)"').exec(s); return m ? m[1] : null; };
    let first = true;
    for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)) {
      const [, close, tag, attrs, self] = m;
      if (close) { if (tag === 'g' || tag === 'svg') stack.pop(); continue; }
      const M = mul(stack[stack.length - 1], parseTf(at(attrs, 'transform')));
      if (tag === 'svg') { if (!first) { /* nested svg: not in the dog art */ } first = false; if (!self) stack.push(M); continue; }
      if (tag === 'g') { if (!self) stack.push(M); continue; }
      const st = at(attrs, 'stroke'), sw = st && st !== 'none' ? +(at(attrs, 'stroke-width') || 1) / 2 : 0;
      if (tag === 'rect') { const x = +(at(attrs, 'x') || 0), y = +(at(attrs, 'y') || 0), w = +(at(attrs, 'width') || 0), h = +(at(attrs, 'height') || 0); add(M, x, y, sw); add(M, x + w, y + h, sw); add(M, x, y + h, sw); add(M, x + w, y, sw); continue; }
      if (tag === 'ellipse' || tag === 'circle') {
        const cx = +at(attrs, 'cx'), cy = +at(attrs, 'cy'), rx = +(at(attrs, 'rx') || at(attrs, 'r')), ry = +(at(attrs, 'ry') || at(attrs, 'r'));
        add(M, cx - rx, cy - ry, sw); add(M, cx + rx, cy + ry, sw); add(M, cx - rx, cy + ry, sw); add(M, cx + rx, cy - ry, sw);
      } else if (tag === 'path') {
        const d = at(attrs, 'd') || ''; let x = 0, y = 0, sx = 0, sy = 0;
        for (const c of d.matchAll(/([MLHVCSQTZmlhvcsqtz])([^MLHVCSQTZmlhvcsqtz]*)/g)) {
          const k = c[1], n = (c[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number), rel = k === k.toLowerCase(), K = k.toUpperCase();
          if (K === 'Z') { x = sx; y = sy; continue; }
          const step = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4 }[K];
          for (let i = 0; i + step <= n.length; i += step) {
            const q = n.slice(i, i + step), ox = rel ? x : 0, oy = rel ? y : 0;
            if (K === 'H') { x = q[0] + (rel ? x : 0); add(M, x, y, sw); continue; }
            if (K === 'V') { y = q[0] + (rel ? y : 0); add(M, x, y, sw); continue; }
            for (let j = 0; j < step; j += 2) add(M, q[j] + ox, q[j + 1] + oy, sw);
            x = q[step - 2] + ox; y = q[step - 1] + oy;
            if (K === 'M' && i === 0) { sx = x; sy = y; }
          }
        }
      }
    }
    return bb[0] < bb[2] ? bb : [0, 0, 240, 200];
  }
  // the inside of a dog SVG (no root tag, no label): what PawPrint places
  const inner = (svg) => svg.replace(/^\s*<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');

  /* ---------------- print weight: no line thinner than minPx in the file ---------------- */
  function weight(s, k, minPx) {
    let n = 0; if (!(minPx > 0)) return { s, n };
    s = s.replace(/stroke-width="([\d.]+)"/g, (m, v) => { if (+v * k >= minPx) return m; n++; return `stroke-width="${f1(minPx / k * 100) / 100}"`; });
    return { s, n };
  }
  // the sticker's kiss-cut margin: the same dog, every part in white with a fat white stroke, drawn under it
  function silhouette(s, b) {
    return '<g fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round" stroke-linecap="round" stroke-width="' + f1(b) + '">'
      + s.replace(/\s(?:fill|stroke|stroke-width|opacity|fill-opacity|stroke-opacity|stroke-linejoin|stroke-linecap|class|style)="[^"]*"/g, '') + '</g>';
  }

  /* ---------------- the name in Caveat Bold, as outlines ---------------- */
  function textW(t, size) { let w = 0; for (const c of Array.from(t)) w += (FONT.g[c] ? FONT.g[c][0] : 300); return w * size / FONT.upm; }
  function nameSVG(t, cx, base, size, col, rot) {
    const k = size / FONT.upm; let x = cx - textW(t, size) / 2, out = '';
    for (const c of Array.from(t)) { const g = FONT.g[c]; if (!g) continue; if (g[1]) out += `<path transform="translate(${f1(x)} ${f1(base)}) scale(${+k.toFixed(5)})" d="${g[1]}"/>`; x += g[0] * k; }
    return `<g class="pp-name" fill="${col || INK}"${rot ? ` transform="rotate(${rot} ${f1(cx)} ${f1(base)})"` : ''}>${out}</g>`;
  }

  /* ---------------- crayon bits for the backdrops (fills inside their outlines: one closed path is the fill and the line) ---------------- */
  function wobRect(x, y, w, h, r, seed, j) {
    const R = rng(seed), J = () => f1((R() - 0.5) * j);
    return `M${f1(x + r)} ${f1(y + J())} L${f1(x + w - r)} ${f1(y + J())} Q${f1(x + w)} ${f1(y)} ${f1(x + w + J())} ${f1(y + r)} L${f1(x + w + J())} ${f1(y + h - r)} Q${f1(x + w)} ${f1(y + h)} ${f1(x + w - r)} ${f1(y + h + J())} L${f1(x + r)} ${f1(y + h + J())} Q${f1(x)} ${f1(y + h)} ${f1(x + J())} ${f1(y + h - r)} L${f1(x + J())} ${f1(y + r)} Q${f1(x)} ${f1(y)} ${f1(x + r)} ${f1(y)} Z`;
  }
  function blob(cx, cy, rx, ry, n, seed, j) { const R = rng(seed); let d = ''; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + (R() - 0.5) * j; d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rx * k) + ' ' + f1(cy + Math.sin(a) * ry * k); } return d + 'Z'; }
  const shape = (d, fill, sw, extra) => `<path d="${d}" fill="${fill}"${extra || ''}/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  // a yard panel in a W x H box (panel units = px of the file): sky, sun, a cloud, a fence, grass with tufts, flowers. u = line unit
  function yardPanel(x, y, w, h, u, seed, o) {
    o = o || {}; const R = rng(seed), gy = y + h * (o.ground || 0.68), out = [];
    // no clipPath (resvg gives a clip a canvas-sized layer: 72 MB of wasm memory at tee size instead of 25 MB): the parts run past the frame and the
    // paper round the frame is painted over them afterwards (an even-odd ring), then the frame line
    const frame = wobRect(x, y, w, h, Math.min(w, h) * 0.05, seed + 1, u * 1.5), pad = Math.max(w, h) * 0.25;
    out.push(`<path d="${frame}" fill="#D3E9F6"/><g>`);
    // sun and a cloud
    const sr = h * 0.09, sx = x + w * 0.84, sy = y + h * 0.2;
    out.push(shape(blob(sx, sy, sr, sr, 18, seed + 2, 0.08), '#FFE27A', u));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; out.push(`<path d="M${f1(sx + Math.cos(a) * sr * 1.3)} ${f1(sy + Math.sin(a) * sr * 1.3)}L${f1(sx + Math.cos(a) * sr * 1.65)} ${f1(sy + Math.sin(a) * sr * 1.65)}" stroke="#E8B53A" stroke-width="${f1(u * 0.9)}" stroke-linecap="round"/>`); }
    const cx0 = x + w * 0.2, cy0 = y + h * 0.18; let cd = ''; [[0, 0, 1], [0.9, -0.35, 0.8], [1.7, 0.05, 0.75]].forEach(([dx, dy, k], i) => { cd += blob(cx0 + dx * h * 0.07, cy0 + dy * h * 0.07, h * 0.07 * k * 1.25, h * 0.07 * k, 14, seed + 3 + i, 0.1); });
    out.push(`<path d="${cd}" fill="none" stroke="${INK}" stroke-width="${f1(u * 1.6)}" stroke-linejoin="round"/><path d="${cd}" fill="#FFFFFF"/>`); // one outline round the whole cloud
    // the fence
    const fh = h * 0.2, fw = Math.max(h * 0.07, w / 26), ft = gy - fh;
    out.push(shape(wobRect(x - u * 4, ft + fh * 0.3, w + u * 8, fh * 0.14, 2, seed + 5, u), '#F4E3C3', f1(u * 0.9)));
    for (let fx = x + fw * 0.3; fx < x + w; fx += fw * 1.35) { const jx = (R() - 0.5) * u, d = `M${f1(fx + jx)} ${f1(gy)} L${f1(fx + jx)} ${f1(ft + fw * 0.45)} L${f1(fx + fw / 2)} ${f1(ft + (R() - 0.5) * u)} L${f1(fx + fw - jx)} ${f1(ft + fw * 0.45)} L${f1(fx + fw - jx)} ${f1(gy)} Z`; out.push(shape(d, '#FFF4DF', f1(u))); }
    // the grass
    const gd = `M${f1(x - u * 4)} ${f1(gy)} ` + Array.from({ length: 13 }, (_, i) => `L${f1(x + w * i / 12)} ${f1(gy + (R() - 0.5) * u * 2)}`).join(' ') + ` L${f1(x + w + u * 4)} ${f1(y + h + u * 4)} L${f1(x - u * 4)} ${f1(y + h + u * 4)} Z`;
    out.push(shape(gd, '#B8DC94', f1(u)));
    let tufts = ''; for (let i = 0; i < Math.round(w / (h * 0.09)); i++) { const tx = x + R() * w, ty = gy + h * 0.06 + R() * (y + h - gy - h * 0.08); tufts += `M${f1(tx - u * 2)} ${f1(ty)}l${f1(u)} ${f1(-u * 3)}M${f1(tx)} ${f1(ty)}l${f1(u * 0.3)} ${f1(-u * 3.6)}M${f1(tx + u * 2)} ${f1(ty)}l${f1(-u * 0.6)} ${f1(-u * 3)}`; }
    out.push(`<path d="${tufts}" fill="none" stroke="#6FA552" stroke-width="${f1(u * 0.7)}" stroke-linecap="round"/>`);
    // flowers by the fence (never in front of the dog: the dog's box o.keep [x0, x1] stays clear)
    const keep = o.keep || [0, 0];
    for (let i = 0; i < 9; i++) {
      const fx = x + w * (0.04 + R() * 0.92); if (fx > keep[0] && fx < keep[1]) continue; const fy = gy + h * 0.02 + R() * h * 0.05, r0 = h * 0.018, col = ['#F7B2C4', '#FFE27A', '#FFFFFF', '#C9B6F2'][i % 4];
      out.push(`<path d="M${f1(fx)} ${f1(fy)}L${f1(fx)} ${f1(fy + h * 0.06)}" stroke="#6FA552" stroke-width="${f1(u * 0.7)}" stroke-linecap="round"/>`);
      let pd = ''; for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; pd += blob(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0, r0 * 0.75, r0 * 0.75, 8, seed + 40 + i * 5 + p, 0.12); }
      out.push(`<path d="${pd}" fill="${col}" stroke="${INK}" stroke-width="${f1(u * 0.55)}" stroke-linejoin="round"/><circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(r0 * 0.5)}" fill="#E8B53A" stroke="${INK}" stroke-width="${f1(u * 0.45)}"/>`);
    }
    out.push('</g>' + `<path d="M${f1(x - pad)} ${f1(y - pad)}H${f1(x + w + pad)}V${f1(y + h + pad)}H${f1(x - pad)}Z${frame}" fill="${o.paper || PAPER}" fill-rule="evenodd"/><path d="${frame}" fill="none" stroke="${INK}" stroke-width="${f1(u * 1.6)}" stroke-linejoin="round"/>`);
    return { svg: out.join(''), ground: gy };
  }
  // a strip of grass, fence and flowers across the bottom of a mug wrap (no frame: it runs round the mug)
  function yardStrip(w, y0, h, u, seed, keep) {
    const R = rng(seed), out = [], fw = h * 0.42, ft = y0 + h * 0.05, gy = y0 + h * 0.62;
    out.push(shape(wobRect(-u * 4, ft + h * 0.16, w + u * 8, h * 0.11, 2, seed + 5, u), '#F4E3C3', f1(u * 0.9)));
    for (let fx = fw * 0.2; fx < w; fx += fw * 1.4) { const jx = (R() - 0.5) * u, d = `M${f1(fx + jx)} ${f1(gy)} L${f1(fx + jx)} ${f1(ft + fw * 0.45)} L${f1(fx + fw / 2)} ${f1(ft + (R() - 0.5) * u)} L${f1(fx + fw - jx)} ${f1(ft + fw * 0.45)} L${f1(fx + fw - jx)} ${f1(gy)} Z`; out.push(shape(d, '#FFF4DF', f1(u))); }
    const gd = `M${f1(-u * 4)} ${f1(gy)} ` + Array.from({ length: 25 }, (_, i) => `L${f1(w * i / 24)} ${f1(gy + (R() - 0.5) * u * 2)}`).join(' ') + ` L${f1(w + u * 4)} ${f1(y0 + h + u * 4)} L${f1(-u * 4)} ${f1(y0 + h + u * 4)} Z`;
    out.push(shape(gd, '#B8DC94', f1(u)));
    for (let i = 0; i < 16; i++) {
      const fx = w * (0.02 + R() * 0.96); if (keep && fx > keep[0] && fx < keep[1]) continue; const fy = gy + h * 0.1 + R() * h * 0.14, r0 = h * 0.05, col = ['#F7B2C4', '#FFE27A', '#FFFFFF', '#C9B6F2'][i % 4];
      let pd = ''; for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; pd += blob(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0, r0 * 0.75, r0 * 0.75, 8, seed + 60 + i * 5 + p, 0.12); }
      out.push(`<path d="${pd}" fill="${col}" stroke="${INK}" stroke-width="${f1(u * 0.55)}" stroke-linejoin="round"/><circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(r0 * 0.5)}" fill="#E8B53A" stroke="${INK}" stroke-width="${f1(u * 0.45)}"/>`);
    }
    return out.join('');
  }

  /* ---------------- PawPrint.svg: a complete print SVG ---------------- */
  // o: { pose, facing, expr, bg: 'none' | 'yard' | 'tile' | 'strip' (mug wrap), name: true | string, w, h, bleed (px of plain background past the trim,
  //      kept clear of the dog), border (px, the sticker's white kiss-cut margin; bg 'none' only), dpi (300), minLine (mm, 0.5) }
  function svg(r, o) {
    o = Object.assign({ pose: 'happy', bg: 'none', w: 1500, h: 1500, bleed: 0, dpi: 300, minLine: 0.5 }, o || {});
    const c = check(r); if (!c.ok) throw new Error('bad recipe: ' + c.err);
    const W = Math.round(o.w), H = Math.round(o.h), B = Math.max(0, o.bleed || 0); if (!(W > 0 && H > 0 && W <= 20000 && H <= 20000)) throw new Error('size');
    const name = o.name === true ? r.n || '' : typeof o.name === 'string' ? cleanName(o.name) || '' : '';
    const shadow = o.shadow != null ? !!o.shadow : o.bg !== 'none'; // a bare print (tee, sticker) drops the faint ground shadow: on fabric it reads as a stain
    let dog = dogSVG(r, o); if (!shadow) dog = dog.replace(/<ellipse cx="[\d.]+" cy="187.5" rx="[\d.]+" ry="[\d.]+" fill="#5B3D32" opacity="0?\.\d+"\/><path d="[^"]*" stroke="#5B3D32" stroke-width="1.3"[^>]*\/>/, '');
    const bb = bbox(dog), dw = bb[2] - bb[0], dh = bb[3] - bb[1];
    const minPx = (o.minLine || 0) / 25.4 * (o.dpi || 300), u = Math.max(minPx, Math.min(W, H) / 300); // backdrop line unit
    const out = []; let box, keep = null, stats = {};
    const S = Math.min(W, H);
    if (o.bg === 'strip') { // the mug wrap: a yard strip along the bottom, the dog on the left of the print side, its name beside it
      const sh = H * 0.2, side = [W * 0.04 + B, W * 0.5]; box = [side[0], B + H * 0.05, (side[1] - side[0]) * (name ? 0.62 : 1), H - sh * 0.22 - B - H * 0.05]; // feet on the grass line of the strip
      keep = [box[0], box[0] + box[2]];
      out.push(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`, yardStrip(W, H - sh - B * 0, sh + B, u, (r.p ^ 0x5A5A) >>> 0, null));
    } else if (o.bg === 'yard') {
      const m = B + S * 0.03, P = yardPanel(m, m, W - 2 * m, H - 2 * m - (name ? H * 0.12 : 0), u, (r.p ^ 0x1234) >>> 0, {});
      const ph = H - 2 * m - (name ? H * 0.12 : 0); box = [m + (W - 2 * m) * 0.14, m + ph * 0.1, (W - 2 * m) * 0.72, ph * 0.86];
      out.push(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`, P.svg);
    } else if (o.bg === 'tile') {
      const m = B + S * 0.03, frame = wobRect(m, m, W - 2 * m, H - 2 * m, S * 0.06, (r.p ^ 0x77) >>> 0, u * 1.5);
      out.push(`<rect width="${W}" height="${H}" fill="${PAPER}"/><defs><pattern id="pp-dots" width="${f1(S / 30)}" height="${f1(S / 30)}" patternUnits="userSpaceOnUse"><circle cx="${f1(S / 270)}" cy="${f1(S / 270)}" r="${f1(S / 600)}" fill="#E3D6C6"/></pattern></defs>`,
        `<path d="${frame}" fill="#FFF3B8"/><path d="${frame}" fill="url(#pp-dots)"/><path d="${frame}" fill="none" stroke="${INK}" stroke-width="${f1(u * 1.6)}" stroke-linejoin="round"/>`);
      box = [m + S * 0.08, m + S * 0.06, W - 2 * m - S * 0.16, H - 2 * m - S * 0.1 - (name ? H * 0.14 : 0)];
    } else { // dog only, transparent
      const m = B + S * 0.02 + (o.border || 0); box = [m, m, W - 2 * m, H - 2 * m - (name ? H * 0.14 : 0)];
    }
    const k = Math.min(box[2] / dw, box[3] / dh), ox = box[0] + (box[2] - dw * k) / 2 - bb[0] * k, oy = (o.bg === 'none' || o.bg === 'tile' ? box[1] + (box[3] - dh * k) / 2 : box[1] + box[3] - dh * k) - bb[1] * k;
    const wt = weight(inner(dog).replace(/\s(?:role|aria-label)="[^"]*"/g, ''), k, minPx); stats = { scale: +k.toFixed(3), thin: wt.n, line: +(3.7 * k / (o.dpi / 25.4)).toFixed(2) };
    const place = `translate(${f1(ox)} ${f1(oy)}) scale(${+k.toFixed(4)})`;
    if (o.border) out.push(`<g transform="${place}">${silhouette(wt.s, (o.border * 2) / k)}</g>`);
    out.push(`<g class="pp-dog" transform="${place}">${wt.s}</g>`);
    if (name) {
      let size = o.bg === 'strip' ? H * 0.2 : H * 0.1; const maxW = o.bg === 'strip' ? W * 0.44 - (box[0] + box[2]) - W * 0.03 : W * 0.8; // the mug: the name ends at 44% of the wrap, clear of the handle side size = Math.min(size, size * maxW / Math.max(1, textW(name, size)));
      const cx = o.bg === 'strip' ? box[0] + box[2] + W * 0.03 + maxW / 2 : W / 2, base = o.bg === 'strip' ? H * 0.46 : o.bg === 'yard' ? H - B - S * 0.03 - H * 0.03 : box[1] + box[3] + H * 0.1;
      if (o.border && o.bg === 'none') { // a sticker's name sits on the white too
        const tw = textW(name, size), pad = o.border; out.push(`<path d="${wobRect(cx - tw / 2 - pad, base - size * 0.8 - pad * 0.6, tw + 2 * pad, size * 1.05 + pad * 1.2, size * 0.4, r.p, 0)}" fill="#FFFFFF"/>`);
      }
      out.push(nameSVG(name, cx, base, size, INK, o.bg === 'strip' ? -3 : -1.5));
    }
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    svg.last = stats; return s;
  }

  /* ---------------- the wire: base64url ---------------- */
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 3) { const n = (u8[i] << 16) | ((u8[i + 1] || 0) << 8) | (u8[i + 2] || 0); s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < u8.length ? B64[(n >> 6) & 63] : '') + (i + 2 < u8.length ? B64[n & 63] : ''); } return s; }
  function unb64(s) {
    if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null; const out = []; let buf = 0, bits = 0;
    for (const ch of s) { buf = (buf << 6) | B64.indexOf(ch); bits += 6; if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); } }
    return Uint8Array.from(out);
  }
  const utf8 = (s) => (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s) : Uint8Array.from(Buffer.from(s, 'utf8')));
  const unutf8 = (u) => { try { return typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }).decode(u) : Buffer.from(u).toString('utf8'); } catch (e) { return null; } };
  function genes16(code) { if (code == null) return 0xFFFF; const m = /^([0-2]{6})(?:a([0-2]))?(?:i([0-2]))?$/.exec(code); let n = 0; for (const d of m[1]) n = n * 3 + +d; return n * 16 + (m[2] == null ? 0 : +m[2] + 1) * 4 + (m[3] == null ? 0 : +m[3] + 1); }
  function un16(n) { if (n === 0xFFFF) return null; const a = (n >> 2) & 3, i = n & 3; let x = n >> 4; if (x >= 729) return undefined; let s = ''; for (let k = 0; k < 6; k++) { s = (x % 3) + s; x = Math.floor(x / 3); } return s + (a ? 'a' + (a - 1) : '') + (i ? 'i' + (i - 1) : ''); }
  function merchEncode(list) {
    list = Array.isArray(list) ? list : [list]; if (!list.length || list.length > MAX_DOGS) throw new Error('1 to ' + MAX_DOGS + ' dogs');
    const out = [VERSION, list.length];
    for (const r of list) {
      const c = check(r); if (!c.ok) throw new Error('bad recipe: ' + c.err);
      const nm = r.n ? utf8(r.n) : null, g = genes16(r.g);
      out.push(r.b, g >> 8, g & 255, r.e | (r.a << 2) | ((r.s === 'f' ? 1 : 0) << 4) | ((r.sp ? 1 : 0) << 5) | ((r.h !== undefined ? 1 : 0) << 6) | ((nm ? 1 : 0) << 7), (r.p >>> 24) & 255, (r.p >>> 16) & 255, (r.p >>> 8) & 255, r.p & 255);
      if (r.h !== undefined) out.push(r.h);
      const o = r.o || []; out.push(o.length); o.forEach((i) => out.push(i));
      if (nm) { out.push(nm.length); nm.forEach((x) => out.push(x)); }
    }
    const u = Uint8Array.from(out.concat([0, 0])), h = fnv16(u, u.length - 2); u[u.length - 2] = h >> 8; u[u.length - 1] = h & 255;
    return b64(u);
  }
  // -> { ok, dogs: [recipe], err }. Never throws; refuses anything malformed, oversized or unknown
  function merchDecode(s) {
    try {
      if (typeof s !== 'string' || !s.length || s.length > HASH_MAX) return { ok: false, err: 'size' };
      const u = unb64(s); if (!u || u.length < 4) return { ok: false, err: 'base64' };
      if (fnv16(u, u.length - 2) !== ((u[u.length - 2] << 8) | u[u.length - 1])) return { ok: false, err: 'check' };
      if (u[0] !== VERSION) return { ok: false, err: 'version' };
      const n = u[1]; if (n < 1 || n > MAX_DOGS) return { ok: false, err: 'count' };
      let i = 2; const end = u.length - 2, need = (k) => { if (i + k > end) throw new Error('short'); }; const dogs = [];
      for (let d = 0; d < n; d++) {
        need(8); const b = u[i++], g = un16((u[i++] << 8) | u[i++]), f = u[i++], p = ((u[i++] << 24) | (u[i++] << 16) | (u[i++] << 8) | u[i++]) >>> 0;
        if (g === undefined) return { ok: false, err: 'genes' };
        const r = { v: VERSION, b, g, e: f & 3, p, a: (f >> 2) & 3, s: (f >> 4) & 1 ? 'f' : 'm' };
        if ((f >> 5) & 1) r.sp = 1;
        if ((f >> 6) & 1) { need(1); r.h = u[i++]; }
        need(1); const no = u[i++]; if (no > 6) return { ok: false, err: 'wear' }; need(no); if (no) { r.o = []; for (let k = 0; k < no; k++) r.o.push(u[i++]); }
        if ((f >> 7) & 1) { need(1); const L = u[i++]; if (!L || L > NAME_MAX * 4) return { ok: false, err: 'name' }; need(L); const t = unutf8(u.subarray(i, i + L)); i += L; if (t == null) return { ok: false, err: 'name' }; r.n = t; }
        const c = check(r); if (!c.ok) return { ok: false, err: c.err };
        dogs.push(r);
      }
      if (i !== end) return { ok: false, err: 'trailing' };
      return { ok: true, dogs };
    } catch (e) { return { ok: false, err: 'short' }; }
  }

  /* ---------------- the two readers ---------------- */
  // the merch page on doodledoggo.app (same origin as /play/): localStorage['pawhaven_proto_v1'], the game's save S as JSON (00_core.js saveNow)
  function merchFromSave(json, o) {
    o = o || {}; let s = json;
    if (typeof json === 'string') { if (json.length > SAVE_MAX) return { ok: false, err: 'size', dogs: [] }; try { s = JSON.parse(json); } catch (e) { return { ok: false, err: 'json', dogs: [] }; } }
    if (!s || typeof s !== 'object' || s.v !== 1) return { ok: false, err: 'not a save', dogs: [] };
    let list = Array.isArray(s.dogs) && s.dogs.length ? s.dogs : s.dog && typeof s.dog === 'object' ? [Object.assign({}, s.dog, s.outfit ? { outfit: s.outfit } : {})] : []; // a v1.0-v1.3 save: one dog, its outfit at the top (linkDogs)
    if (list.length > SAVE_DOGS) list = list.slice(0, SAVE_DOGS);
    const dogs = [];
    for (const d of list) { let r = null; try { r = merchRecipe(d, o); } catch (e) { r = null; } if (r && check(r).ok) dogs.push({ recipe: r, name: r.n || '', key: BREEDS[r.b], active: d.id != null && d.id === s.activeId }); }
    return { ok: dogs.length > 0, err: dogs.length ? null : 'no dogs', dogs };
  }
  // the merch page opened from the game in itch.io's frame: https://doodledoggo.app/merch/#p=<merchEncode(...)>
  function merchFromHash(hash) {
    if (typeof hash !== 'string' || hash.length > HASH_MAX + 8) return { ok: false, err: 'size', dogs: [] };
    const m = /^#?(?:.*&)?p=([A-Za-z0-9_-]+)(?:&.*)?$/.exec(hash); if (!m) return { ok: false, err: 'no p', dogs: [] };
    const r = merchDecode(m[1]); return { ok: r.ok, err: r.err || null, dogs: r.ok ? r.dogs.map((x) => ({ recipe: x, name: x.n || '', key: BREEDS[x.b] })) : [] };
  }

  return { VERSION, BREEDS, EYES, AGES, WEAR, NAME_MAX, MAX_DOGS, merchRecipe, check, artOpts, dogSVG, svg, bbox, nameSVG, textW, cleanName, nameChars, geneCode, genesFrom, merchEncode, merchDecode, merchFromSave, merchFromHash, hashId };
}
if (typeof module !== 'undefined' && module.exports) module.exports = PawPrintMake;
