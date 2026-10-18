#!/usr/bin/env node
// Doodle Doggo v2.14: find every player-visible English string (V214.md section 12). Read-only: it never rewrites a source file.
//   node tools/i18n_extract.js [--out _i18n/extract.json] [--quiet]
// Sources: game/src/*.js (concatenated in ORDER.txt order, the way the build does, so the one shared IIFE parses; every hit is
// mapped back to its own file and line), mods/*.js, game/shell.html (text nodes, <title>, aria-label, title, placeholder, alt,
// the share meta text), and in dogs/ and world/ only aria-labels, HTML text and the painted sign words (`b.tx(x, y, 'DOG')`).
// Parser: acorn, found under `npm root -g` (directly, or inside eslint / espree). Nothing is installed into the repo.
// Each hit: { file, line, text, key, kind, vars?, attr?, ctx?, table? }
//   kind: literal  = a plain string (or a template without ${})
//         template = a template literal with ${} vars (`vars` names them, `cond` = a ${a ? 'x' : 'y'} that needs a select)
//         concat   = a sentence glued with + (needs a rewrite into one message with vars)
//         data     = a string inside a data table (const UPPER_NAME = [ ... ] / { ... }): keep English as data, look up by id
//   text: the English with each ${...} or + operand as {var}; HTML tags removed (one hit per text run between tags)
// Prints stats: hits, unique strings, words, characters, per file and per kind.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const OUT = path.resolve(ROOT, opt('--out', '_i18n/extract.json')), QUIET = args.includes('--quiet');

/* ---- acorn from the global node_modules (or eslint's / espree's copy) ---- */
function loadAcorn() {
  try { return require('acorn'); } catch (e) { /* not on the default paths */ }
  let roots = [];
  try { roots.push(cp.execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch (e) { /* no npm */ }
  if (process.env.NODE_PATH) roots = roots.concat(process.env.NODE_PATH.split(path.delimiter));
  const tries = [];
  for (const r of roots.filter(Boolean)) {
    tries.push(path.join(r, 'acorn'), path.join(r, 'eslint', 'node_modules', 'acorn'), path.join(r, 'espree', 'node_modules', 'acorn'));
    for (const host of ['eslint', 'espree']) {
      try { const real = fs.realpathSync(path.join(r, host)); tries.push(path.join(real, '..', 'acorn'), path.join(real, 'node_modules', 'acorn')); } catch (e) { /* not there */ }
    }
  }
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  console.error('i18n_extract: acorn not found (looked under npm root -g, eslint and espree). Install eslint globally, or set NODE_PATH.');
  process.exit(2);
}
const acorn = loadAcorn();
const M = require(path.join(ROOT, "game/i18n/msg.js")); // M.id: the same row ids tdata() builds at run time

/* ---- areas for the guessed keys (file -> first key part). Default: the file stem without its number. ---- */
const AREA = {
  '00_core': 'core', '01_title': 'title', '02_adoption': 'adopt', '03_yard': 'yard', '04_bath': 'bath', '05_market_shops': 'shop',
  '06_wardrobe': 'wardrobe', '07_treasure_journal': 'journal', '07b_mailbox': 'mail', '08_map': 'map', '09_walk_classic': 'walk',
  '10_sex_age_genes': 'genes', '11_garden_kitchen': 'garden', '12_popups_beds_map_snacks_potty': 'popup', '13_more_dogs': 'pack',
  '13b_breeding': 'playdate', '13c_litter': 'puppies', '14_town_places': 'town', '14b_vet_playboard': 'vet', '15_trick_training': 'train',
  '15b_trick_games': 'tricks', '16_voices_idle': 'idle', '16b_puppy_play': 'pupplay', '17_walk_route_carousel': 'route',
  '18_mod_walk_toys': 'toys', '19_fetch': 'fetch', '20_settings_dev': 'settings', '21_time_loop': 'time', '22_input': 'input',
  '22b_cloud': 'cloud', '22d_reset': 'reset', '22c_phone_shell': 'phone', '24_missions': 'missions', '25_guide': 'guide',
  '26_festival': 'fest', '27_halloween': 'hw', '28_home': 'home', '29_pack_care': 'care', '30_shelter': 'shelter', '31_winter': 'winter',
  '32_newyear': 'newyear', '33_japan': 'japan', '34_pack_play': 'packplay', '35_photo': 'photo', '36_personality': 'pers', '37_roam': 'roam',
  '38_ball': 'ball', '39_tokyo': 'tokyo', '40_dogcards': 'cards', '23_boot': 'boot',
  genes: 'mod.genes', pawaudio: 'mod.audio', walkrun: 'mod.walk', toys: 'mod.toys', garden: 'mod.garden', kitchen: 'mod.kitchen',
  pawart_dogs: 'art.dogs', shell: 'shell'
};
const SKIP_FILES = new Set(['35b_photo_fonts.js', '22b_cloud_config.js']); // generated font data, the Worker URL
const areaOf = (file) => { const b = path.basename(file).replace(/\.(js|html)$/, ''); return AREA[b] || (b.startsWith('pawart_world_') ? 'art.world_' + b.slice(-1) : b.replace(/^\d+[a-z]?_/, '').split('_')[0]); };
const slug = (s, n = 5) => String(s).replace(/\{[^}]*\}/g, ' ').normalize('NFKD').replace(/[^\w\s]/g, ' ').toLowerCase().split(/[\s_]+/).filter(Boolean).slice(0, n).join('_') || 'x';

/* ---- what counts as visible text ---- */
// CSS class names and ids used anywhere (a lowercase string made only of these is a class list, not words)
const CLASSES = new Set();
for (const f of fs.readdirSync(path.join(ROOT, 'game/css')).filter((x) => x.endsWith('.css'))) {
  const s = fs.readFileSync(path.join(ROOT, 'game/css', f), 'utf8');
  for (const m of s.matchAll(/[.#]([A-Za-z_][\w-]*)/g)) CLASSES.add(m[1]);
}
const DENY_WORDS = new Set(('Enter Escape Esc Tab Space Shift Control Alt Meta Backspace Delete ArrowLeft ArrowRight ArrowUp ArrowDown Home End PageUp PageDown '
  + 'GET PUT POST DELETE PATCH HEAD OPTIONS Bearer Content-Type Authorization UTF-8 Caveat Patrick Hand Gloria Hallelujah DD Local Title sans-serif serif monospace cursive '
  + 'use strict NaN Infinity undefined true false null').split(' '));
const DOM_EVENTS = /^(click|dblclick|mousedown|mouseup|mousemove|mouseenter|mouseleave|mouseover|mouseout|pointer\w+|touch\w+|key\w+|input|change|submit|focus\w*|blur|resize|scroll|wheel|load|unload|beforeunload|visibilitychange|pagehide|pageshow|animationend|transitionend|contextmenu|storage|message|error|online|offline|hashchange|popstate)$/;
// calls whose string args are ids, selectors, keys, events, art or API names (never shown)
const DENY_CALLS = new Set(['$', '$$', 'querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName', 'closest', 'matches', 'addEventListener',
  'removeEventListener', 'on', 'off', 'emit', 'add', 'remove', 'toggle', 'contains', 'replace', 'setAttribute', 'getAttribute', 'removeAttribute', 'hasAttribute',
  'toggleAttribute', 'createElement', 'createElementNS', 'getItem', 'setItem', 'removeItem', 'trackAct', 'dispatchEvent', 'require', 'fetch', 'clApi', 'dcApi',
  'itemArt', 'equip', 'includes', 'startsWith', 'endsWith', 'indexOf', 'lastIndexOf', 'split', 'join', 'padStart', 'padEnd', 'icon', 'ic', 'has', 'get', 'set',
  'delete', 'getPropertyValue', 'setProperty', 'removeProperty', 'Error', 'TypeError', 'RegExp', 'log', 'warn', 'error', 'info', 'debug', 'insertAdjacentHTML',
  'hmDecorOut', 'jrDecor', 'brDecor', 'switchHouse', 'sigIcon', 'setBowl', 'hoPos', 'rmPause', 'rmResume', 'phIcon', 'svgIcon', 'scene', 'prop', 'dog', 'art',
  'postMessage', 'animate', 'play', 'mode', 'go', 'goto', 'showMode', 'setMode', 'travel', 'sfx', 'tone', 'beep', 'Function', 'eval', 'matchMedia', 'toLocaleString',
  'Date', 'Number', 'parseInt', 'parseFloat', 'String', 'localeCompare', 'test', 'exec', 'match', 'search', 'execCommand', 'getContext', 'Image', 'Audio', 'Event', 'CustomEvent']);
// calls whose first argument (openModal: the first two) is shown to the player
const SINKS = { toast: [0], nope: [0], say: [0], sayW: [0], openModal: [0, 1], clToast: [0], tkToast: [0], wnToast: [0], msSay: [0], fxText: [0], blHint: [0],
  trainLine: [0], setTray: [0], titleGive: [0], brMail: [0, 1], hwChip: [0], fsChipAbove: [0], tInfo: [0], ask: [0], msg: [0], bubble: [0], tx: [2] };
// object properties whose string values are shown (data tables and option objects)
const SHOWN_PROPS = /^(n|name|nm|note|tip|tips|title|desc|description|txt|text|label|lbl|line|lines|msg|hint|joke|breed|says|say|body|sub|caption|cap|head|h|p|ab|bark|card|lesson|q|a|ok|cancel|btn|button|alt|placeholder|aria|help|why|what|story|letter|from|sig|blurb|flavor|fact|info|toast|done|tag|chip|word|words|place|title2|subtitle)$/;
const HTML_ATTRS = /\b(aria-label|title|placeholder|alt|aria-description|data-tip|data-title)\s*=\s*("([^"]*)"|'([^']*)')/g;

const letters = (s) => (s.match(/\p{L}/gu) || []).length;
function looksVisible(s, strong, sink) {
  const x = s.replace(/\{[^}]*\}/g, '').trim(), xs = s.replace(/\{[^}]*\}/g, 'X').trim();
  if (letters(x) < 2) return false;
  if (/[\w-]+=["']|^["']?\s*[\w-]+=/.test(xs) || /^[^\s]*\|[^\s]*$/.test(xs)) return false; // markup fragments, pipe-joined keys
  if (/^[\w$-]+([.:/|][\w$-]*)+$/.test(xs) && !/[.!?]$/.test(xs)) return false; // keys with vars (fetch:X, dcv:X:X)
  if (/^[A-G][#b]?(m|maj|min|dim|aug|sus|add|\d)+(\/[A-G][#b]?)?$/.test(x)) return false; // chord names
  if (DENY_WORDS.has(x) || /^&[#\w]+;$/.test(x)) return false;
  if (/^(https?:|mailto:|data:|blob:|\/\/|\.{0,2}\/[\w.-])/.test(x)) return false; // URLs and paths
  if (/^[\w.-]+\.(png|svg|jpe?g|webp|gif|woff2?|ttf|css|js|json|html|wav|mp3|ogg|md|txt)$/i.test(x)) return false; // file names
  if (/^pawhaven_|^__paw|^dd[A-Z_]/.test(x)) return false; // storage keys, test hooks
  if (DOM_EVENTS.test(x)) return false;
  if (/^[#.\[:>*][\w\s\-.#\[\]=":>*,()^$~|+{}]*$/.test(x) && !/ [a-z]{3,} [a-z]{3,}/.test(x)) return false; // selectors
  if (/^[MLHVCSQTAZmlhvcsqtaz0-9.,\s-]+$/.test(x)) return false; // SVG path data
  if (/^#[0-9a-f]{3,8}$/i.test(x) || /^(rgba?|hsla?|var|calc|url|translate[XYZ3d]*|rotate|scale|matrix|cubic-bezier|linear-gradient|radial-gradient|drop-shadow|blur)\(/.test(x)) return false;
  if (/^@(keyframes|media|font-face|supports)\b/.test(x) || (/[{};]/.test(x) && /[a-z-]+\s*:\s*[^\s]/.test(x) && !/[a-z]{3,} [a-z]{3,} [a-z]{3,}/i.test(x.replace(/\{[^}]*\}/g, "")))) return false; // CSS blocks
  if (/(^|[\s;])[a-z-]+\s*:\s*[^;]+;/.test(x) || /\b\d+(\.\d+)?(px|em|rem|vh|vw|ms|s|deg|%)\b/.test(x) && !/[a-z]{3,} [a-z]{3,}/i.test(x)) return false; // CSS
  if (/^[a-z][a-z0-9]*([A-Z][a-z0-9]*)+$/.test(x)) return false; // camelCase id
  if (/^[A-Z][a-z]+[A-Z]\w*$/.test(x) && !/ /.test(x)) return false; // PascalCase id (ArrowLeft, PawArt)
  if (/^[A-Z0-9_]{2,}$/.test(x) && !strong) return false; // CONSTANT_NAME (a painted sign word counts only in a sink)
  if (/^[\w$-]+([.:/][\w$-]+)+$/.test(x)) return false; // dotted / colon keys (walk.home, dcv:1:2)
  if (/^[a-z0-9_$-]+$/.test(x)) return !!sink && /^[a-z]{2,}$/.test(x); // one lowercase token: a key, unless it sits in a shown spot
  if (/^[a-z][\w-]*( [a-z][\w-]*)+$/.test(x)) { // only lowercase words: a class list unless they read like words
    const w = x.split(' ');
    if (w.every((t) => CLASSES.has(t) || /[-_\d]/.test(t))) return false;
    if (!strong && w.length < 3) return false;
  }
  return true;
}

/* ---- HTML in strings: one hit per text run between tags, plus the shown attributes. Markers \u0001<i>\u0002 stand for ${} vars. ---- */
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', times: '×', middot: '·', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hearts: '♥', star: '★' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] || m);
function htmlRuns(s) {
  const runs = []; // { text, attr? }
  for (const m of s.matchAll(HTML_ATTRS)) runs.push({ text: m[3] != null ? m[3] : m[4], attr: m[1] });
  const noTags = s.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, '\u0003').replace(/<!--[\s\S]*?-->/g, '\u0003').replace(/<[^<>]*>/g, '\u0003');
  for (const part of noTags.split('\u0003')) runs.push({ text: part });
  return runs.map((r) => ({ attr: r.attr, text: decode(r.text).replace(/\s+/g, ' ').trim() })).filter((r) => r.text);
}
const isHtml = (s) => /<\/?[a-z][\w-]*(\s[^<>]*)?\/?>/i.test(s);

/* ---- naming the vars of ${expr} and + operands ---- */
function varName(e, used) {
  let n = null;
  const inner = (x) => {
    if (!x) return null;
    if (x.type === 'Identifier') return x.name;
    if (x.type === 'MemberExpression') return !x.computed && x.property.type === 'Identifier' ? x.property.name : inner(x.object);
    if (x.type === 'CallExpression') {
      const c = x.callee, cn = c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' && !c.computed ? c.property.name : null;
      if (cn && /^(esc|String|Math\.\w+|round|R1|fmt|num|cap|plural|toFixed|toLocaleString|trim|toLowerCase|toUpperCase)$/.test(cn) && x.arguments[0]) return inner(x.arguments[0]) || cn;
      if (c.type === 'MemberExpression' && /^(toFixed|toLocaleString|trim|toLowerCase|toUpperCase)$/.test(cn)) return inner(c.object);
      return cn;
    }
    if (x.type === 'ConditionalExpression') return null;
    if (x.type === 'BinaryExpression' || x.type === 'LogicalExpression') return inner(x.left);
    if (x.type === 'TemplateLiteral' || x.type === 'Literal') return null;
    return null;
  };
  n = inner(e);
  n = n ? n.replace(/^[A-Z_]+$/, (m) => m.toLowerCase()).replace(/[^\w]/g, '') : '';
  if (!n || /^(x|i|j|k|e|o|a|b|c|d|s|t|v|w|p|q|r|y|z)$/.test(n)) n = e && e.type === 'ConditionalExpression' ? 'sel' : 'v';
  let k = n, i = 2; while (used.has(k)) k = n + i++;
  used.add(k);
  return k;
}

/* ---- the AST walk ---- */
const hits = [];
function emit(h) { hits.push(h); }

function scanJs(code, fileOf, mode) {
  // mode: 'game' | 'mod' | 'art'. fileOf(pos) -> { file, line } or null (skipped file)
  let ast;
  try { ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true, allowHashBang: true }); }
  catch (e) { console.error('parse error', e.message); process.exit(3); }
  const consumed = new Set();
  const parents = [];
  const calleeName = (c) => c.type === 'Identifier' ? c.name : c.type === 'MemberExpression' && !c.computed && c.property.type === 'Identifier' ? c.property.name : null;

  // context of a node from its parent chain: deny | sink | shown | table name | null
  function ctxOf(node) {
    let child = node, table = null, prop = null, strong = false, deny = false, sink = null;
    for (let i = parents.length - 1; i >= 0; i--) {
      const p = parents[i];
      if (p.type === 'Property') { if (p.key === child && !p.computed) return { deny: true }; if (prop == null && !p.computed) prop = p.key.name || p.key.value; }
      else if (p.type === 'MemberExpression') { if (p.property === child && p.computed) return { deny: true }; }
      else if (p.type === 'BinaryExpression' && /^(===|!==|==|!=|in|instanceof)$/.test(p.operator)) return { deny: true };
      else if (p.type === 'SwitchCase' && p.test === child) return { deny: true };
      else if (p.type === 'CallExpression' || p.type === 'NewExpression') {
        const cn = calleeName(p.callee), ai = p.arguments.indexOf(child);
        if (ai >= 0 && sink == null && !deny) {
          if (cn && Object.prototype.hasOwnProperty.call(SINKS, cn) && SINKS[cn].includes(ai)) sink = cn;
          else if (cn && DENY_CALLS.has(cn) && !(cn === 'replace' && ai === 1)) deny = true;
          else if (cn && /^(setAttribute)$/.test(cn) && ai === 1) { const a0 = p.arguments[0]; if (a0 && a0.type === 'Literal' && /^(aria-label|title|placeholder|alt)$/.test(a0.value)) sink = 'attr'; }
        }
        if (p.callee === child && child.type === 'MemberExpression') { /* 'a b'.split() etc.: the object of a call */ }
      } else if (p.type === 'AssignmentExpression' && p.right === child) {
        const l = p.left; const ln = l.type === 'MemberExpression' && !l.computed ? l.property.name : null;
        if (ln && /^(textContent|innerText|title|placeholder|alt|ariaLabel|value)$/.test(ln) && sink == null) sink = ln;
        if (ln && /^(className|id|type|src|href|cursor|display|background|color|transform|cssText|name)$/.test(ln)) deny = true;
        if (l.type === 'MemberExpression' && l.object && l.object.type === 'MemberExpression' && !l.object.computed && l.object.property.name === 'style') deny = true;
        if (l.type === 'MemberExpression' && !l.computed && l.object.type === 'MemberExpression' && !l.object.computed && l.object.property.name === 'dataset') deny = true;
      } else if (p.type === 'VariableDeclarator' && p.init === child && p.id.type === 'Identifier' && /^[A-Z][A-Z0-9_]+$/.test(p.id.name)
        && /^(ArrayExpression|ObjectExpression|CallExpression)$/.test(child.type) && !table) table = p.id.name;
      child = p;
    }
    if (prop && SHOWN_PROPS.test(prop)) strong = true;
    return { deny, sink, strong: strong || !!sink, table, prop };
  }

  // the path of a data string inside its table: property names, row ids (an object's id / key / n / name, an array row's leading
  // key-like strings) or indices. data.<table>.<path> is stable as long as the table only grows (the tables are append only).
  function dataPath(node, table) {
    let d = -1;
    for (let i = parents.length - 1; i >= 0; i--) if (parents[i].type === 'VariableDeclarator' && parents[i].id.name === table) { d = i; break; }
    if (d < 0) return slug(node.value || '');
    const seg = [];
    const idOf = (o) => {
      if (o.type === 'ObjectExpression') { const k = o.properties.find((q) => q.type === 'Property' && !q.computed && /^(id|key|k|n|name)$/.test(q.key.name || q.key.value) && q.value.type === 'Literal' && typeof q.value.value === 'string'); return k ? M.id(k.value.value) : null; }
      if (o.type === 'ArrayExpression') { const ks = []; for (const e of o.elements) { if (e && e.type === 'Literal' && typeof e.value === 'string' && /^[a-z][a-z0-9]*$/.test(e.value) && e !== node) ks.push(e.value); else break; } return ks.length ? ks.join('_') : null; }
      return null;
    };
    for (let j = d + 1; j < parents.length; j++) {
      const p = parents[j], child = parents[j + 1] || node;
      if (p.type === 'Property' && !p.computed) seg.push(M.id(String(p.key.name || p.key.value)));
      else if (p.type === 'ArrayExpression') { const i = p.elements.indexOf(child); seg.push(idOf(child) || String(i)); }
      else if (p.type === 'CallExpression' || p.type === 'NewExpression') {
        const ai = p.arguments.indexOf(child); if (ai < 0) continue;
        const a0 = p.arguments[0];
        if (a0 && a0.type === 'Literal' && typeof a0.value === 'string' && a0 !== child) seg.push(M.id(a0.value));
        seg.push(String(ai));
      }
    }
    // an object row seen through its id already: drop the bare index before it
    return seg.join('.').replace(/\.{2,}/g, '.') || 'text';
  }

  function record(node, text, kind, extra) {
    const at = fileOf(node.start); if (!at) return;
    const c = extra.ctx || {};
    if (mode === 'art' && !(extra.htmlRun || c.sink === 'tx' || c.sink === 'attr')) return;
    const area = areaOf(at.file);
    let key;
    if (kind === 'data') key = 'data.' + c.table.toLowerCase() + '.' + dataPath(node, c.table);
    else key = area + '.' + (extra.attr ? slug(extra.attr.replace(/^aria-/, ''), 1) + '_' : '') + slug(text);
    const h = { file: at.file, line: at.line, text, key, kind };
    if (extra.vars && extra.vars.length) h.vars = extra.vars;
    if (extra.cond) h.cond = true;
    if (extra.attr) h.attr = extra.attr;
    if (c.sink) h.ctx = c.sink;
    if (c.table) h.table = c.table;
    if (mode === 'art') h.ctx = c.sink === 'tx' ? 'painted' : h.ctx || 'art';
    emit(h);
  }

  // a string-ish node's text with ${} as markers; vars named
  function textOf(node, used, vars) {
    if (node.type === 'Literal') return String(node.value);
    let s = '';
    node.quasis.forEach((q, i) => {
      s += q.value.cooked == null ? q.value.raw : q.value.cooked;
      if (i < node.expressions.length) { const e = node.expressions[i]; const n = varName(e, used); vars.push({ name: n, cond: e.type === 'ConditionalExpression' }); s += '\u0001' + (vars.length - 1) + '\u0002'; }
    });
    return s;
  }
  function out(node, raw, vars, kindIn, ctx) {
    const pieces = isHtml(raw) ? htmlRuns(raw).map((r) => ({ ...r, htmlRun: true })) : [{ text: (/&[#\w]+;/.test(raw) && !/^&[#\w]+;$/.test(raw.trim()) ? decode(raw) : raw).replace(/\s+/g, ' ').trim() }];
    for (const r of pieces) {
      const used = []; let cond = false;
      const text = r.text.replace(/\u0001(\d+)\u0002/g, (m, i) => { const v = vars[+i]; used.push(v.name); if (v.cond) cond = true; return '{' + v.name + '}'; });
      if (/[\u0001\u0002]/.test(text)) continue;
      const strong = ctx.strong || !!r.attr || (r.htmlRun && pieces.length > 1);
      if (!looksVisible(text, strong, ctx.sink || r.attr)) continue;
      const kind = ctx.table ? 'data' : kindIn === 'concat' ? 'concat' : used.length ? 'template' : 'literal';
      record(node, text, kind, { vars: used, cond, attr: r.attr, ctx, htmlRun: r.htmlRun });
    }
  }

  function flatPlus(n, acc) { if (n.type === 'BinaryExpression' && n.operator === '+') { flatPlus(n.left, acc); flatPlus(n.right, acc); } else acc.push(n); return acc; }
  const isStr = (n) => (n.type === 'Literal' && typeof n.value === 'string') || n.type === 'TemplateLiteral';

  function visit(node) {
    if (!node || typeof node.type !== 'string') return;
    if (consumed.has(node)) { // already part of a concat: still walk the ${} expressions inside
      if (node.type === 'TemplateLiteral') { parents.push(node); node.expressions.forEach(visit); parents.pop(); }
      return;
    }
    if (node.type === 'TaggedTemplateExpression') return; // String.raw etc.
    if (node.type === 'BinaryExpression' && node.operator === '+') {
      const parent = parents[parents.length - 1];
      if (!(parent && parent.type === 'BinaryExpression' && parent.operator === '+')) {
        const parts = flatPlus(node, []);
        if (parts.some(isStr) && parts.some((p) => !isStr(p))) {
          const used = new Set(), vars = []; let raw = '';
          for (const p of parts) {
            if (isStr(p)) { raw += textOf(p, used, vars); consumed.add(p); }
            else { vars.push({ name: varName(p, used), cond: p.type === 'ConditionalExpression' }); raw += '\u0001' + (vars.length - 1) + '\u0002'; }
          }
          const ctx = ctxOf(node);
          if (!ctx.deny) out(node, raw, vars, 'concat', ctx);
        }
      }
    }
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const ctx = ctxOf(node);
      if (!ctx.deny) out(node, node.value, [], 'literal', ctx);
      return;
    }
    if (node.type === 'TemplateLiteral') {
      const ctx = ctxOf(node);
      if (!ctx.deny) { const vars = []; const raw = textOf(node, new Set(), vars); out(node, raw, vars, 'template', ctx); }
    }
    if (node.type === 'Property' && !node.computed) { parents.push(node); visit(node.value); parents.pop(); return; } // never the key
    parents.push(node);
    for (const k of Object.keys(node)) {
      if (k === 'type' || k === 'start' || k === 'end' || k === 'loc') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach((c) => { if (c && typeof c.type === 'string') visit(c); });
      else if (v && typeof v.type === 'string') visit(v);
    }
    parents.pop();
  }
  visit(ast);
}

/* ---- sources ---- */
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
function lineMap(text) { const ls = [0]; for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) ls.push(i + 1); return (pos) => { let lo = 0, hi = ls.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ls[m] <= pos) lo = m; else hi = m - 1; } return lo + 1; }; }

// game/src: one concatenated scope, as game/build.js joins it
{
  const dir = path.join(ROOT, 'game/src');
  const order = fs.readFileSync(path.join(dir, 'ORDER.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  let code = ''; const spans = [];
  for (const f of order) { const s = fs.readFileSync(path.join(dir, f), 'utf8'); spans.push({ f, start: code.length, end: code.length + s.length, line: lineMap(s) }); code += s; }
  scanJs(code, (pos) => { const sp = spans.find((x) => pos >= x.start && pos < x.end); if (!sp || SKIP_FILES.has(sp.f)) return null; return { file: 'game/src/' + sp.f, line: sp.line(pos - sp.start) }; }, 'game');
}
for (const [dir, re, mode] of [['mods', /^[a-z]+\.js$/, 'mod'], ['dogs', /^pawart_dogs\.js$/, 'art'], ['world', /^pawart_world_[a-z]\.js$/, 'art']]) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((x) => re.test(x)).sort()) {
    const full = path.join(ROOT, dir, f), code = fs.readFileSync(full, 'utf8'), ln = lineMap(code);
    scanJs(code, (pos) => ({ file: rel(full), line: ln(pos) }), mode);
  }
}
// game/shell.html: text nodes, the shown attributes, <title> and the share meta text
{
  const f = path.join(ROOT, 'game/shell.html'), s = fs.readFileSync(f, 'utf8'), ln = lineMap(s);
  const body = s.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, (m) => m.replace(/[^\n]/g, ' '));
  const add = (text, pos, attr) => { text = decode(text).replace(/\s+/g, ' ').trim(); if (!looksVisible(text, true, true)) return; hits.push({ file: 'game/shell.html', line: ln(pos), text, key: 'shell.' + (attr ? slug(attr.replace(/^aria-/, ''), 1) + '_' : '') + slug(text), kind: 'literal', ...(attr ? { attr } : {}) }); };
  for (const m of body.matchAll(HTML_ATTRS)) add(m[3] != null ? m[3] : m[4], m.index, m[1]);
  for (const m of body.matchAll(/<meta\s+(?:name|property)="(description|og:title|og:description|twitter:title|twitter:description)"\s+content="([^"]*)"/g)) add(m[2], m.index, 'meta:' + m[1]);
  for (const m of body.matchAll(/>([^<>]+)</g)) add(m[1], m.index + 1, null);
}

/* ---- key collisions: the same guessed key for different texts gets a number ---- */
{
  const byKey = new Map();
  for (const h of hits) { const t = byKey.get(h.key); if (!t) byKey.set(h.key, new Map([[h.text, 1]])); else if (!t.has(h.text)) t.set(h.text, t.size + 1); }
  for (const h of hits) { const n = byKey.get(h.key).get(h.text); if (n > 1) h.key += '_' + n; }
}

/* ---- stats ---- */
const words = (s) => s.replace(/\{[^}]*\}/g, ' ').split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
const uniq = new Map(); for (const h of hits) if (!uniq.has(h.text)) uniq.set(h.text, h);
const U = [...uniq.values()];
const sum = (a, f) => a.reduce((n, x) => n + f(x), 0);
const stats = {
  hits: hits.length, unique: U.length, words: sum(U, (h) => words(h.text)), chars: sum(U, (h) => h.text.length),
  enJsonBytes: Buffer.byteLength(JSON.stringify(Object.fromEntries(U.map((h) => [h.key, h.text])), null, 1)),
  kinds: {}, kindsUnique: {}, files: {}
};
for (const h of hits) { stats.kinds[h.kind] = (stats.kinds[h.kind] || 0) + 1; const f = stats.files[h.file] || (stats.files[h.file] = { hits: 0, words: 0 }); f.hits++; f.words += words(h.text); }
for (const h of U) stats.kindsUnique[h.kind] = (stats.kindsUnique[h.kind] || 0) + 1;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ made: new Date().toISOString(), stats, hits }, null, 1));
if (!QUIET) {
  console.log(`hits ${stats.hits}, unique strings ${stats.unique}, words ${stats.words} (unique strings), chars ${stats.chars}, en.json about ${(stats.enJsonBytes / 1e3).toFixed(0)} KB`);
  console.log('kinds (hits):', JSON.stringify(stats.kinds), ' unique:', JSON.stringify(stats.kindsUnique));
  for (const [f, x] of Object.entries(stats.files).sort((a, b) => b[1].words - a[1].words)) console.log('  ' + f.padEnd(40), String(x.hits).padStart(5), 'hits', String(x.words).padStart(6), 'words');
  console.log('wrote', rel(OUT));
}
