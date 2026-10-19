#!/usr/bin/env node
// v2.14 FONTS lane: per-language font subsets for the site (and, in phase 2, the game). Contract and numbers: docs/i18n/FONTS.md.
//
//   node tools/i18n_fonts.js <lang> [corpus files...]   one language (ja, zh-Hans, zh-Hant, ko, th, es, pt-BR, fr, de, id)
//   node tools/i18n_fonts.js --all                       every language; corpus defaults to site/i18n/<lang>.json
//   options:
//     --for site|game     default corpus: site/i18n/<lang>.json (site) or game/i18n/<lang>.json (game)
//     --out <dir>         where <lang>.woff2, <lang>-title.woff2 and <lang>.css go (default site/fonts/i18n, game: dist/i18n-fonts)
//     --url <prefix>      URL prefix in the CSS (default /fonts/i18n/)
//     --embed <file.css>  also write the CSS with the fonts inlined as base64 data URIs (single-file game build, photo postcard)
//     --text "<chars>"    add these characters to the corpus
//     --title-keys <re>   JSON keys whose strings use the title face (default below, TITLE_KEYS)
//     --backend ft|gf     ft (default): fontTools from pinned source fonts, deterministic.
//                         gf: Google Fonts css2?text= (fallback when Python is missing; not byte-stable, several files per face)
//     --ascii             CJK/Thai faces also carry ASCII digits and punctuation (off by default: Patrick Hand has them)
//     --no-glossary     leave out game/i18n/glossary/<lang>.json (breeds + terms values; in by default)
//     --measure           print subset size vs glyph count (300/600/1000/2000/3000 common characters), writes nothing
//
// ft backend needs Python 3 with fontTools and brotli (`pip install --user fonttools brotli`) and, the first time, network access
// to download the source fonts (google/fonts and lxgw/LxgwWenKai on GitHub) into ~/.cache/dd-fonts/src (or $DD_FONT_CACHE).
// Every source is pinned by SHA-256: same corpus + same sources + same fontTools version -> the same bytes.
// Full CJK source fonts are never committed (they are 3-26 MB each).
//
// CSS family names: 'DD Local' (text) and 'DD Local Title' (headings, only where a title face is used). CJK/Thai faces leave all of
// ASCII (letters, digits, punctuation, space) and the Latin letters to Patrick Hand / Caveat, so "v2.14" or "3 dogs" look the same in
// every language. --ascii puts ASCII digits and punctuation in the face and its unicode-range (for a context without Patrick Hand).
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto'), os = require('os');
const root = path.join(__dirname, '..');
const CACHE = process.env.DD_FONT_CACHE || path.join(os.homedir(), '.cache', 'dd-fonts', 'src');
const GF = 'https://raw.githubusercontent.com/google/fonts/main/';
const LX = 'https://raw.githubusercontent.com/lxgw/LxgwWenKai/v1.530/';

// Source fonts, pinned. `lic` is the license file copied to <out>/<name>-OFL.txt. `gf` is the Google Fonts css2 family for the gf backend.
const SRC = {
  KleeOne: { file: 'KleeOne-SemiBold.ttf', url: GF + 'ofl/kleeone/KleeOne-SemiBold.ttf', lic: GF + 'ofl/kleeone/OFL.txt',
    sha: 'b031ec426c23ca1143ef1f7d58bee7a79efe119ed654152f121c922202b303fd', gf: 'Klee+One:wght@600' },
  LXGWWenKai: { file: 'LXGWWenKai-Medium.ttf', url: LX + 'fonts/TTF/LXGWWenKai-Medium.ttf', lic: LX + 'OFL.txt',
    sha: 'f4b8a34d1f838fe411540cb7c97b1c384ac9738a876c4104500bc42508b2312a', gf: 'LXGW+WenKai+TC:wght@400' }, // not on Google Fonts: gf falls back to the TC cut
  Iansui: { file: 'Iansui-Regular.ttf', url: GF + 'ofl/iansui/Iansui-Regular.ttf', lic: GF + 'ofl/iansui/OFL.txt',
    sha: '6e6340d80d618a42b48ade9370c34fa37a8210750c6fbc8efe65f23716538a2b', gf: 'Iansui' },
  PoorStory: { file: 'PoorStory-Regular.ttf', url: GF + 'ofl/poorstory/PoorStory-Regular.ttf', lic: GF + 'ofl/poorstory/OFL.txt',
    sha: '831ab87f7b5463f9cd83ac249bf386816f3a478f1d226427c88cac907adb7ee2', gf: 'Poor+Story' },
  Jua: { file: 'Jua-Regular.ttf', url: GF + 'ofl/jua/Jua-Regular.ttf', lic: GF + 'ofl/jua/OFL.txt',
    sha: '769677aef240bfc3b9965f2b50748075bff885e6c6992fc591a3fb268279f898', gf: 'Jua' },
  Mali: { file: 'Mali-Regular.ttf', url: GF + 'ofl/mali/Mali-Regular.ttf', lic: GF + 'ofl/mali/OFL.txt',
    sha: 'e3212f0f9be130743d32a4f174b7d79628daa5db0d72ca4c63c799ae465597bb', gf: 'Mali:wght@400' },
  MaliBold: { file: 'Mali-Bold.ttf', url: GF + 'ofl/mali/Mali-Bold.ttf', lic: GF + 'ofl/mali/OFL.txt', licName: 'Mali',
    sha: '3e2f421036c3f91eb5ef34650a5cd2116c737a542147769437a9856a455d4462', gf: 'Mali:wght@700' },
  PatrickHand: { file: 'PatrickHand-Regular.ttf', url: GF + 'ofl/patrickhand/PatrickHand-Regular.ttf', lic: GF + 'ofl/patrickhand/OFL.txt',
    sha: '0f173b3e6cb6d1af25babf7f0057c5ac4ee11f9992b0469bb817e967ef4ad0fc', gf: 'Patrick+Hand' },
  Caveat: { file: 'Caveat[wght].ttf', url: GF + 'ofl/caveat/Caveat%5Bwght%5D.ttf', lic: GF + 'ofl/caveat/OFL.txt',
    sha: '0bdb6b660482d31531b3945849fba5916b3ef8695da7024a9e6b9ee3c4157988', gf: 'Caveat:wght@700' },
};
// Per language. `base`: characters always in the subset (beside the corpus). `title`: second face for headings, or none.
// `titleAll`: the title face takes the whole corpus (cheap scripts). `latin`: Latin-script language: the face only fills what the
// shipped site/fonts latin subsets lack. `feat`: OpenType layout features kept ('*' for Thai: ccmp/mark/mkmk and the shifted marks).
const KANA = rng(0x3041, 0x3096) + rng(0x30A1, 0x30FA) + 'ー・';
const CJKP = '、。〃「」『』【】〈〉《》〜！？：；（），．…￥％＆＊＋＝';
const ASCII = rng(0x21, 0x7E).replace(/[A-Za-z]/g, '');
// CJK and Korean: horizontal features only (the default list also keeps the vertical forms: vert, vrt2, vkna..., about 15% more glyphs)
const HFEAT = ['ccmp', 'locl', 'kern', 'liga', 'calt', 'rlig', 'mark', 'mkmk'];
const LANGS = {
  ja: { body: 'KleeOne', base: KANA + CJKP, feat: HFEAT },
  'zh-Hans': { body: 'LXGWWenKai', base: CJKP + '“”‘’—·', feat: HFEAT },
  'zh-Hant': { body: 'Iansui', base: CJKP + '「」『』—·', feat: HFEAT },
  ko: { body: 'PoorStory', title: 'Jua', base: '', feat: HFEAT },
  th: { body: 'Mali', title: 'MaliBold', titleAll: true, base: rng(0x0E01, 0x0E3A) + rng(0x0E3F, 0x0E5B), feat: ['*'] },
  es: { body: 'PatrickHand', title: 'Caveat', latin: true }, 'pt-BR': { body: 'PatrickHand', title: 'Caveat', latin: true },
  fr: { body: 'PatrickHand', title: 'Caveat', latin: true }, de: { body: 'PatrickHand', title: 'Caveat', latin: true },
  id: { body: 'PatrickHand', title: 'Caveat', latin: true },
};
const TITLE_KEYS = /(^|[._-])(title|heading|h[1-3]|tag|name|logo|cta|btn|button)([._-]|$)/i;
const LATIN_LETTER = /[A-Za-zÀ-ɏḀ-ỿ]/;
const SHIPPED = { body: 'site/fonts/patrick-hand.woff2', title: 'site/fonts/caveat.woff2' }; // the latin subsets every page already has
const MACRON = 'ŌōŪū̄'; // tools/fonts/*macron* (photo postcard) already covers these

function rng(a, b) { let s = ''; for (let c = a; c <= b; c++) s += String.fromCodePoint(c); return s; }
function die(m) { console.error('i18n_fonts: ' + m); process.exit(1); }
function sha(f) { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); }

// ---- args
const argv = process.argv.slice(2), opt = { files: [], text: '' };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i], v = () => argv[++i];
  if (a === '--all') opt.all = true; else if (a === '--for') opt.for = v(); else if (a === '--out') opt.out = v();
  else if (a === '--url') opt.url = v(); else if (a === '--embed') opt.embed = v(); else if (a === '--text') opt.text += v();
  else if (a === '--title-keys') opt.titleKeys = new RegExp(v(), 'i'); else if (a === '--backend') opt.backend = v();
  else if (a === '--ascii') opt.ascii = true; else if (a === '--measure') opt.measure = true; else if (a === '--no-glossary') opt.glossary = false; else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(__filename, 'utf8').split("'use strict'")[0].split('\n').slice(1).join('\n')); process.exit(0); }
  else if (a.startsWith('--')) die('unknown option ' + a); else if (!opt.lang && LANGS[a]) opt.lang = a; else opt.files.push(a);
}
opt.for = opt.for || 'site'; opt.backend = opt.backend || 'ft'; opt.url = opt.url || '/fonts/i18n/';
opt.titleKeys = opt.titleKeys || TITLE_KEYS;
opt.out = path.resolve(root, opt.out || (opt.for === 'game' ? 'dist/i18n-fonts' : 'site/fonts/i18n'));
if (!opt.lang && !opt.all) die('which language? one of ' + Object.keys(LANGS).join(', ') + ' (or --all). --help for usage.');

// ---- source fonts (download once, verify the pin)
function source(key) {
  const s = SRC[key], f = path.join(CACHE, s.file);
  fs.mkdirSync(CACHE, { recursive: true });
  if (!fs.existsSync(f)) {
    console.log(`  downloading ${s.file} ...`);
    cp.execFileSync('curl', ['-sSfL', '--retry', '4', '-o', f + '.part', s.url], { stdio: 'inherit' });
    fs.renameSync(f + '.part', f);
  }
  const h = sha(f);
  if (h !== s.sha) die(`${s.file}: SHA-256 ${h} is not the pinned ${s.sha}. Upstream changed: check the font, then update SRC in tools/i18n_fonts.js.`);
  return f;
}
function license(key) {
  const s = SRC[key], name = (s.licName || key) + '-OFL.txt', dst = path.join(opt.out, name);
  if (!fs.existsSync(dst)) {
    const c = path.join(CACHE, name);
    if (!fs.existsSync(c)) cp.execFileSync('curl', ['-sSfL', '--retry', '4', '-o', c, s.lic], { stdio: 'inherit' });
    fs.copyFileSync(c, dst);
  }
  return name;
}

// ---- Python (fontTools) helper: subset, report glyphs/cmap/missing; or read a cmap
const PY = String.raw`
import sys, json, io
from fontTools.ttLib import TTFont
from fontTools import subset, version
job = json.load(sys.stdin)
if job['op'] == 'cmap':
    print(json.dumps(sorted(TTFont(job['src']).getBestCmap().keys()))); sys.exit()
o = subset.Options()
o.hinting = False; o.desubroutinize = True; o.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
o.layout_features = job['feat'] or o.layout_features; o.notdef_outline = True
f = TTFont(job['src'], recalcTimestamp=False)  # keep head.modified from the source: same input, same bytes
have = f.getBestCmap()
missing = [c for c in job['text'] if ord(c) not in have]
s = subset.Subsetter(o); s.populate(text=job['text']); s.subset(f)
cm = sorted(f.getBestCmap().keys())
f.flavor = 'woff2'  # Options.flavor only applies to the CLI; TTFont.save needs it on the font
b = io.BytesIO(); f.save(b); data = b.getvalue()
if job.get('out'): open(job['out'], 'wb').write(data)
print(json.dumps({'bytes': len(data), 'glyphs': len(f.getGlyphOrder()), 'cmap': cm, 'missing': ''.join(missing), 'ft': version}))
`;
function py(job) {
  const r = cp.spawnSync('python3', ['-P', '-c', PY], { input: JSON.stringify(job), maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    const e = String(r.stderr);
    if (/No module named 'fontTools'|No module named 'brotli'|brotli/.test(e)) die('fontTools/brotli missing: pip install --user fonttools brotli  (or use --backend gf)');
    die('python failed: ' + e.split('\n').filter(Boolean).slice(-3).join(' | '));
  }
  return JSON.parse(String(r.stdout));
}

// ---- corpus
function strings(v, key, out) {
  if (typeof v === 'string') out.push([key, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, key + '.' + i, out));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) strings(v[k], key ? key + '.' + k : k, out);
  return out;
}
function corpus(lang) {
  let files = opt.files.slice();
  if (!files.length) files = [opt.for === 'game' ? `game/i18n/${lang}.json` : `site/i18n/${lang}.json`].filter((f) => fs.existsSync(path.join(root, f)));
  let text = opt.text, title = '';
  // the glossary (breed names and game terms) always goes in: breed names show on both the site and the game (zh-Hant 㹴 U+3E74, CJK Ext A)
  const gl = path.join(root, 'game/i18n/glossary', lang + '.json');
  if (opt.glossary !== false && fs.existsSync(gl)) {
    const g = JSON.parse(fs.readFileSync(gl, 'utf8'));
    for (const v of Object.values(g.breeds || {})) if (typeof v === 'string') { text += v; title += v; } // breed names head the dog profiles
    for (const v of Object.values(g.terms || {})) if (typeof v === 'string') text += v;
    files.push(path.relative(root, gl) + ' (breeds, terms)');
  }
  // the built site pages of this language (site/<dir>/*.html, visible text): characters that come from templates or Intl (ja 散 in index.tpl,
  // ko 월 in the privacy date) and not from the string table. Left out: the language menu and Japanese words (lang="ja") on other languages'
  // pages, which have their own fonts. Headings (h1-h3) also go to the title face. Run node tools/site_i18n.js first.
  if (opt.for !== 'game' && !opt.files.length && !LANGS[lang].latin) { // Latin-script pages: Patrick Hand and Caveat already cover them
    const dir = path.join(root, 'site', lang.toLowerCase());
    const pages = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.html')).sort() : [];
    const dec = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&[a-z]+;/g, ' ').replace(/\p{Extended_Pictographic}\p{M}*/gu, ' '); // emoji come from the system
    for (const f of pages) {
      let h = fs.readFileSync(path.join(dir, f), 'utf8').replace(/<(script|style|head)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<details class="langs"[\s\S]*?<\/details>/g, ' ');
      if (lang !== 'ja') h = h.replace(/<(span|i|b|dt)\b[^>]*\blang="ja"[^>]*>[^<]*<\/\1>/g, ' ');
      text += dec(h);
      for (const m of h.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/g)) title += dec(m[2]);
    }
    if (pages.length) files.push(`site/${lang.toLowerCase()}/*.html (${pages.length} pages)`);
  }
  for (const f of files.filter((x) => !x.endsWith(' (breeds, terms)') && !x.endsWith(' pages)'))) {
    const p = path.resolve(root, f), raw = fs.readFileSync(p, 'utf8');
    if (/\.json$/i.test(f)) for (const [k, s] of strings(JSON.parse(raw), '', [])) { text += s; if (opt.titleKeys.test(k)) title += s; }
    else text += raw;
  }
  return { files, text, title };
}
// unique characters, sorted by code point (deterministic), no controls / spaces
const uniq = (s) => [...new Set([...s.normalize('NFC')])].filter((c) => !/[\s\p{Cc}]/u.test(c)).sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('');

function ranges(cps) {
  const out = []; let a = null, b = null;
  for (const c of cps) { if (a !== null && c === b + 1) { b = c; continue; } if (a !== null) out.push([a, b]); a = b = c; }
  if (a !== null) out.push([a, b]);
  return out.map(([x, y]) => 'U+' + x.toString(16).toUpperCase() + (y > x ? '-' + y.toString(16).toUpperCase() : '')).join(',');
}

// ---- one face (ft backend)
function face(lang, cfg, role, chars) {
  const key = role === 'title' ? cfg.title : cfg.body;
  const file = lang + (role === 'title' ? '-title' : '') + '.woff2';
  const r = py({ op: 'subset', src: source(key), text: chars, feat: cfg.feat || null, out: path.join(opt.out, file) });
  // what this face answers for: its cmap, minus the space, minus Latin letters unless it is a Latin supplement
  const cps = r.cmap.filter((c) => c > 0x20 && (cfg.latin || ((c >= 0x80 || opt.ascii) && !LATIN_LETTER.test(String.fromCodePoint(c)))));
  return { role, key, file, bytes: r.bytes, glyphs: r.glyphs, missing: r.missing.replace(/[\x21-\x7e]/g, ''), range: ranges(cps), lic: license(key), ft: r.ft };
}

// ---- gf backend: Google Fonts css2?text= (about 400 CJK characters per request; one woff2 per request)
function faceGF(lang, cfg, role, chars) {
  const key = role === 'title' ? cfg.title : cfg.body, UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
  const parts = [], arr = [...chars];
  for (let i = 0, n = 0; i < arr.length; i += 400, n++) {
    const css = cp.execFileSync('curl', ['-sSf', '--retry', '4', '-A', UA, `https://fonts.googleapis.com/css2?family=${SRC[key].gf}&text=${encodeURIComponent(arr.slice(i, i + 400).join(''))}`]).toString();
    const srcs = [...css.matchAll(/src: url\(([^)]+)\)/g)].map((m) => m[1]);
    if (srcs.length !== 1) die(`gf: expected one face for ${key} part ${n}, got ${srcs.length}`);
    const file = lang + (role === 'title' ? '-title' : '') + (n ? '.' + (n + 1) : '') + '.woff2';
    cp.execFileSync('curl', ['-sSfL', '--retry', '4', '-o', path.join(opt.out, file), srcs[0]]);
    parts.push({ file, range: ranges([...new Set(arr.slice(i, i + 400).map((c) => c.codePointAt(0)))].sort((a, b) => a - b)), bytes: fs.statSync(path.join(opt.out, file)).size });
  }
  return { role, key, parts, bytes: parts.reduce((n, p) => n + p.bytes, 0), glyphs: arr.length, missing: '', lic: license(key) };
}

function css(lang, faces, embed) {
  const head = `/* GENERATED by tools/i18n_fonts.js (${lang}, backend ${opt.backend}). Do not edit: rerun the tool. Fonts: ${[...new Set(faces.map((f) => f.key))].map((k) => SRC[k].file.replace(/\.ttf$/, '')).join(', ')}; licenses: ${[...new Set(faces.map((f) => f.lic))].join(', ')} (SIL Open Font License 1.1). */\n`;
  return head + faces.flatMap((f) => (f.parts || [f]).map((p) => {
    const src = embed ? `data:font/woff2;base64,${fs.readFileSync(path.join(opt.out, p.file)).toString('base64')}` : opt.url + p.file + '?v=' + sha(path.join(opt.out, p.file)).slice(0, 8); // cache key: a new subset gets a new URL
    return `@font-face{font-family:'${f.role === 'title' ? 'DD Local Title' : 'DD Local'}';font-style:normal;font-weight:400 700;font-display:swap;src:url(${src}) format('woff2');unicode-range:${p.range}}`;
  })).join('\n') + '\n';
}

function build(lang) {
  const cfg = LANGS[lang], c = corpus(lang);
  console.log(`${lang}: corpus ${c.files.length ? c.files.join(', ') : '(none)'}${opt.text ? ' + --text' : ''}`);
  fs.mkdirSync(opt.out, { recursive: true });
  for (const f of fs.readdirSync(opt.out)) if (f.startsWith(lang + '.') || f.startsWith(lang + '-title.')) fs.rmSync(path.join(opt.out, f)); // stale outputs
  let body, title;
  if (cfg.latin) {
    // Latin-script languages: only what the shipped latin subsets lack (e.g. Ÿ); usually nothing, then the CSS is a comment only.
    const need = (k) => { const have = new Set(py({ op: 'cmap', src: path.join(root, SHIPPED[k]) })); return uniq(c.text).split('').filter((ch) => !have.has(ch.codePointAt(0)) && !MACRON.includes(ch)).join(''); };
    body = need('body'); title = need('title');
  } else {
    const keep = (s) => [...s].filter((ch) => ch.codePointAt(0) >= 0x80 && !LATIN_LETTER.test(ch)).join(''), asc = opt.ascii ? ASCII : '';
    body = uniq(keep(cfg.base + c.text) + asc);
    title = cfg.title ? uniq(keep(cfg.titleAll ? cfg.base + c.text : c.title) + (c.title || cfg.titleAll ? asc : '')) : '';
  }
  const make = opt.backend === 'gf' ? faceGF : face, faces = [];
  if (body) faces.push(make(lang, cfg, 'body', body));
  if (cfg.title && title) faces.push(make(lang, cfg, 'title', title));
  else if (cfg.title && !cfg.latin) console.log(`  no strings under title keys (${opt.titleKeys}): ${lang}-title.woff2 skipped, headings use 'DD Local'`);
  const out = faces.length ? css(lang, faces, false) : `/* GENERATED by tools/i18n_fonts.js (${lang}): Patrick Hand and Caveat (site/fonts) already cover every character of the corpus. Nothing to load. */\n`;
  fs.writeFileSync(path.join(opt.out, lang + '.css'), out);
  if (opt.embed) fs.writeFileSync(path.resolve(root, opt.embed.replace('{lang}', lang)), faces.length ? css(lang, faces, true) : out);
  for (const f of faces) {
    console.log(`  ${f.role === 'title' ? lang + '-title' : lang}.woff2  ${SRC[f.key].file}  ${f.glyphs} glyphs  ${(f.bytes / 1024).toFixed(1)} KB${f.ft ? '  fontTools ' + f.ft : ''}`);
    if (f.missing) console.log(`  WARNING ${SRC[f.key].file} has no glyph for: ${f.missing}  (they fall back to the next font in the stack)`);
  }
  if (cfg.latin && !faces.length) console.log('  nothing missing from the shipped latin subsets: CSS only');
  return faces;
}

// ---- measure: size vs number of common characters (even sample of the national level-1 sets, decoded by Python codecs)
function measure(lang) {
  const cfg = LANGS[lang];
  if (cfg.latin) return console.log(`${lang}: Latin script, see docs/i18n/FONTS.md (coverage)`);
  const set = {
    ja: `[bytes([r,c]).decode('euc_jp') for r in range(0xB0,0xD0) for c in range(0xA1,0xFF) if r!=0xCF or c<=0xD3]`,
    'zh-Hans': `[bytes([r,c]).decode('gb2312') for r in range(0xB0,0xD8) for c in range(0xA1,0xFF) if r!=0xD7 or c<=0xF9]`,
    'zh-Hant': `[ch for h in range(0xA4,0xC7) for l in list(range(0x40,0x7F))+list(range(0xA1,0xFF)) for ch in [bytes([h,l]).decode('big5','ignore')] if len(ch)==1 and not (h==0xC6 and l>0x7E)]`,
    ko: `[bytes([r,c]).decode('euc_kr') for r in range(0xB0,0xC9) for c in range(0xA1,0xFF)]`,
  }[lang];
  const all = set ? JSON.parse(cp.execFileSync('python3', ['-P', '-c', `import json; print(json.dumps(''.join(${set})))`]).toString()) : '';
  const src = source(cfg.body), rows = [];
  if (lang === 'th') { const r = py({ op: 'subset', src, text: uniq(cfg.base), feat: cfg.feat }); return console.log(`th ${SRC[cfg.body].file}: all Thai (${[...cfg.base].length} chars) -> ${r.glyphs} glyphs, ${(r.bytes / 1024).toFixed(1)} KB`); }
  // realistic start: the base set plus the glossary (breed names and terms), then an even sample of the level-1 set on top
  const start = uniq([...cfg.base + corpus(lang).text].filter((ch) => ch.codePointAt(0) >= 0x80 && !LATIN_LETTER.test(ch)).join('')), have = new Set(start);
  const pool = [...all].filter((ch) => !have.has(ch)), n0 = [...start].length;
  const g = py({ op: 'subset', src, text: start, feat: cfg.feat || null });
  rows.push(`glossary+base ${n0}: ${(g.bytes / 1024).toFixed(0)} KB`);
  for (const n of [300, 600, 1000, 1500, 2000, 3000]) {
    if (n <= n0) continue;
    const k = Math.min(n - n0, pool.length), pick = Array.from({ length: k }, (_, i) => pool[Math.floor(i * pool.length / k)]);
    const r = py({ op: 'subset', src, text: uniq(start + pick.join('')), feat: cfg.feat || null });
    rows.push(`${n0 + k}: ${(r.bytes / 1024).toFixed(0)} KB`);
    if (k === pool.length) break;
  }
  console.log(`${lang} ${SRC[cfg.body].file}: ${rows.join(', ')}  (then an even sample of ${all.length} level-1 characters)`);
}

const langs = opt.all ? Object.keys(LANGS) : [opt.lang];
if (opt.measure) langs.forEach(measure);
else {
  const report = langs.map((l) => [l, build(l)]);
  const total = report.reduce((n, [, fs_]) => n + fs_.reduce((m, f) => m + f.bytes, 0), 0);
  if (langs.length > 1) console.log(`total ${(total / 1024).toFixed(0)} KB in ${path.relative(root, opt.out)}`);
}
