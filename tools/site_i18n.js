// doodledoggo.app in 11 languages (v2.14): writes every page of the site from the templates in site/tpl/ and the string tables in site/i18n/.
//   node tools/site_i18n.js              writes site/index.html, dogs.html, map.html, about.html, privacy.html, reset.html (English, committed) and site/<dir>/... for the
//                                        other 10 languages (generated, git-ignored; tools/cf_site.js builds them itself), and prints the missing-key report
//   node tools/site_i18n.js --report     the full report: every missing, unknown or broken key per language
//   node tools/site_i18n.js --pseudo     also writes the test-only pseudo-locales site/xx/ (accented, ~40% longer) and site/xx-cjk/ (CJK-like, no spaces)
//   node tools/site_i18n.js --check      writes nothing; exits 1 when the committed English pages differ from what the templates make
//   node tools/site_i18n.js --title-keys prints the keys drawn in the hand face (headings, buttons, names), for tools/i18n_fonts.js --title-keys
//   node tools/site_i18n.js --legacy     English only, without the v2.14 additions (language menu, hreflang, the language script): since site v3 (the header,
//                                        /map, /about) it no longer equals the v2.12 pages byte for byte
// Strings: site/i18n/en.json is the source (keys, _notes for translators); site/i18n/<lang>.json (lang exactly as in LANGS, e.g. zh-Hans.json, pt-BR.json)
// holds a translation, any keys missing there show the English text. Breed names come from game/i18n/glossary/<lang>.json "breeds" when that file exists.
// Message syntax: the ICU MessageFormat subset of the v2.14 contract (game/i18n/msg.js: {name}, plural, select, #, josa for ko). Values may use <b> and <i>.
// Templates: {{t key}} text, {{a key}} attribute, {{u /path}} a link to the same page in this language, {{raw block}} a block made here, {{lang}}.
// Site v3 (19 Oct 2026): {{raw header}} on every page (logo, the four page links Home · Dogs · Map · About Us, the language menu); the home page shows
// the FEATURED dogs only; /map is made from MAP (the place order), /about is the owner's story (about.p1 ... about.p8).
// Fonts: a non-English page links /fonts/i18n/<lang>.css only when tools/i18n_fonts.js put that file in site/fonts/i18n/ with an @font-face in it.
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..'), SITE = path.join(ROOT, 'site'), I18N = path.join(SITE, 'i18n'), TPL = path.join(SITE, 'tpl');
const ORIGIN = 'https://doodledoggo.app';

// ---- the languages: BCP 47 code (file names, <html lang>, hreflang), URL folder, native name (the menu), og:locale, script group (typography)
const LANGS = [
  { code: 'ja', dir: 'ja', name: '日本語', og: 'ja_JP', script: 'cjk' },
  { code: 'zh-Hans', dir: 'zh-hans', name: '简体中文', og: 'zh_CN', script: 'cjk' },
  { code: 'zh-Hant', dir: 'zh-hant', name: '繁體中文', og: 'zh_TW', script: 'cjk' },
  { code: 'ko', dir: 'ko', name: '한국어', og: 'ko_KR', script: 'cjk' },
  { code: 'es', dir: 'es', name: 'Español', og: 'es_ES', script: 'latin' },
  { code: 'pt-BR', dir: 'pt-br', name: 'Português (Brasil)', og: 'pt_BR', script: 'latin' },
  { code: 'fr', dir: 'fr', name: 'Français', og: 'fr_FR', script: 'latin' },
  { code: 'de', dir: 'de', name: 'Deutsch', og: 'de_DE', script: 'latin' },
  { code: 'th', dir: 'th', name: 'ไทย', og: 'th_TH', script: 'th' },
  { code: 'id', dir: 'id', name: 'Bahasa Indonesia', og: 'id_ID', script: 'latin' },
  { code: 'en', dir: '', name: 'English', og: 'en_US', script: 'latin' }
];
// test-only pseudo-locales: never in the menu, the hreflang set or the deployed Worker (unless cf_site.js is asked for them)
const PSEUDO = [
  { code: 'en-XA', dir: 'xx', name: '[Ƥšéûđö]', og: 'en_US', script: 'latin', pseudo: 'long', rules: 'en' },
  { code: 'ja-XA', dir: 'xx-cjk', name: '[犬犬犬]', og: 'ja_JP', script: 'cjk', pseudo: 'cjk', rules: 'ja' }
];
// site v3: six pages; the header (every page) links the first four (NAV), the footer the rest
const PAGES = [{ id: 'index', path: '/' }, { id: 'dogs', path: '/dogs' }, { id: 'map', path: '/map' }, { id: 'about', path: '/about' }, { id: 'privacy', path: '/privacy' }, { id: 'reset', path: '/reset' }];
const NAV = [{ page: 'home', id: 'index', path: '/' }, { page: 'dogs', id: 'dogs', path: '/dogs' }, { page: 'map', id: 'map', path: '/map' }, { page: 'about', id: 'about', path: '/about' }];
// the home page's featured dogs (site v3: eight cards, the rest on /dogs), in this order
const FEATURED = ['dachs', 'shiba', 'corgi', 'golden', 'pug', 'samoyed', 'beagle', 'husky'];
// the places of /map, in order: each has map.place.<id>.name / .text in en.json and a picture /img/map/<id>.webp (960 x 576, the SHOTS lane)
const MAP = [
  { id: 'home-places', key: 'home', places: ['yard', 'house', 'garden', 'kitchen'] },
  { id: 'town', key: 'town', map: { id: 'townmap', src: '/img/map/town-map.webp', alt: 'map.town.alt' },
    places: ['park', 'river', 'woods', 'beach', 'market', 'square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier', 'shelter', 'fujihill', 'station'] },
  { id: 'tokyo', key: 'japan', map: { id: 'japanmap', src: '/img/map/japan-map.webp', alt: 'map.japan.alt' }, places: ['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba'] }
];
const POLICY_DATE = Date.UTC(2026, 9, 17); // the privacy policy's "Last updated" date

// ---- the message formatter: game/i18n/msg.js (the v2.14 contract) parses; the site renders its AST as HTML (escaped text, <b>/<i>, HTML parameters)
const MSG = require('../game/i18n/msg.js');
const parse = (src) => MSG.parse(src);
const args = (src, set) => { Object.keys(MSG.args(src)).forEach((k) => set.add(k)); return set; };
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>');
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const H = (html) => ({ html }); // a parameter that is already HTML
function render(ast, params, rules, attr, num) {
  let s = '';
  const str = (v) => (attr ? escAttr(v) : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  for (const n of ast) {
    if (typeof n === 'string') s += attr ? escAttr(n.replace(/<\/?(b|i)>/g, '')) : escText(n);
    else if (n.t === 'hash') s += new Intl.NumberFormat(rules).format(num);
    else if (n.t === 'arg' || n.t === 'josa') {
      const v = params[n.v];
      if (v == null) s += '{' + n.v + '}';
      else if (typeof v === 'object') s += attr ? escAttr(v.html.replace(/<[^>]+>/g, '')) : v.html;
      else s += str(v);
      if (n.t === 'josa' && v != null) s += str(MSG.josa(typeof v === 'object' ? v.html.replace(/<[^>]+>/g, '') : String(v), n.a, n.b));
    } else if (n.t === 'plural') {
      const v = Number(params[n.v]); const c = n.opts['=' + v] || n.opts[MSG.pluralCat(v, rules)] || n.opts.other;
      s += render(c, params, rules, attr, v);
    } else s += render(n.opts[String(params[n.v])] || n.opts.other, params, rules, attr, num);
  }
  return s;
}

// ---- the pseudo-locales
const ACC = { a: 'á', b: 'ƀ', c: 'ç', d: 'đ', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ', n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'û', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Å', B: 'Ɓ', C: 'Ç', D: 'Đ', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Î', J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ', N: 'Ñ', O: 'Ö', P: 'Ƥ', Q: 'Ǫ', R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Û', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž' };
const CJK = '犬猫小大好遊走食眠楽友家庭花雪富士山町公園夢空星光風森川海春夏秋冬朝夜音色心手足耳目口鼻尾毛玉骨';
function pseudoText(s, kind) {
  let h = 7;
  if (kind === 'cjk') {
    return s.replace(/[A-Za-z]+(?:['’][A-Za-z]+)?/g, (w) => { let o = ''; for (let k = 0; k < Math.ceil(w.length * 0.7); k++) { h = (h * 31 + w.charCodeAt(k % w.length)) % 9973; o += CJK[h % CJK.length]; } return o; })
      .replace(/(\S) (?=\S)/g, '$1').replace(/\. ?/g, '。').replace(/, ?/g, '、').replace(/: ?/g, '：').replace(/!/g, '！').replace(/\?/g, '？');
  }
  return s.replace(/[A-Za-z]+/g, (w) => {
    const extra = Math.ceil(w.length * 0.4), vow = w.match(/[aeiouyAEIOUY]/g) || [w[0]];
    let o = w; for (let k = 0; k < extra; k++) o += vow[k % vow.length].toLowerCase();
    return o.replace(/[A-Za-z]/g, (ch) => ACC[ch] || ch);
  });
}
function pseudoAst(ast, kind) { // only the literal text changes; placeholders, select keys and <b>/<i> stay
  return ast.map((n) => typeof n === 'string' ? n.split(/(<\/?(?:b|i)>)/).map((p, k) => k % 2 ? p : pseudoText(p, kind)).join('')
    : n.opts ? Object.assign({}, n, { opts: Object.fromEntries(Object.entries(n.opts).map(([k, c]) => [k, pseudoAst(c, kind)])) }) : n);
}

// ---- data: the dogs (PawArt.DOGS: key, name, breed) and their site profiles (tools/site_dogs.js)
let DOGS_CACHE = null;
function dogs() {
  if (DOGS_CACHE) return DOGS_CACHE;
  const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx, { filename: 'dogs/pawart_dogs.js' });
  const PROFILES = require('./site_dogs');
  DOGS_CACHE = ctx.window.PawArt.DOGS.map((d) => Object.assign({ key: d.key, breed: d.breed, gamePersonality: d.personality }, PROFILES.find((p) => p.key === d.key)));
  if (DOGS_CACHE.some((d) => !d.jp)) throw new Error('every dog needs a profile in tools/site_dogs.js');
  return DOGS_CACHE;
}
const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw new Error(p + ': ' + e.message); } };
const EN = () => readJSON(path.join(I18N, 'en.json'));
const glossary = (code) => readJSON(path.join(ROOT, 'game', 'i18n', 'glossary', code + '.json'));
const isKey = (k) => !k.startsWith('_');
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^icon:/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aAn = (s) => (/^[aeiou]/i.test(s) ? 'an' : 'a');
const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const numWord = (n) => { const w = n <= 20 ? NUM[n] : ['', '', 'twenty', 'thirty', 'forty', 'fifty'][Math.floor(n / 10)] + (n % 10 ? '-' + NUM[n % 10] : ''); return w[0].toUpperCase() + w.slice(1); };
// the Japanese words of the site, as HTML (the placeholders {asobo}, {inu} ... of en.json)
const JPW = {
  asobo: '<span lang="ja" class="jp">遊ぼう</span> <i>asobō</i>', muryo: '<span lang="ja" class="jp">無料</span> <i>muryō</i>', inu: '<span lang="ja">犬</span> <i>inu</i>',
  osanpo: '<span class="jpw" lang="ja">お散歩</span> <i>osanpo</i>', fujisan: '<span lang="ja" class="jp">富士山</span> <i>Fuji-san</i>', shibainu: '<span lang="ja" class="jp">柴犬</span>',
  dogrun: '<span lang="ja" class="jp">ドッグラン</span> <i>doggu ran</i>', torii: '<span lang="ja" class="jp">鳥居</span>', arigato: '<span lang="ja" class="jp">ありがとう</span> <i>arigatō</i>',
  inutachi: '<span lang="ja">犬たち</span> <i>inu-tachi</i>', chizu: '<span lang="ja">地図</span> <i>chizu</i>', mame: '<span lang="ja">豆知識</span> <i>mame-chishiki</i>',
  mail: '<a class="mail" href="mailto:contact@doodledoggo.app">contact@doodledoggo.app</a>'
};
// the keys drawn in the hand face (var(--hand) in site/style.css: headings, .tag, .nav, .chip, .play, .feats b, .bark, .dname, .pics .cap,
// .prof h2 .dtype, .bubble, .traits b, .loves>b): the corpus of the 'DD Local Title' subset.
//   node tools/i18n_fonts.js --all --title-keys "$(node tools/site_i18n.js --title-keys)"
const HAND_KEYS = /^(?:.*\.title|dogs\.h1|privacy\.h1|reset\.h1|map\.h1|about\.h1|about\.p8|about\.itch|map\.place\.[a-z]+\.name|nav\.(?:home|dogs|map|about)|home\.(?:map|about)\.link|home\.tagline|home\.nav\..*|home\.toss|home\.dogs\.all|common\.(?:play|quoted)|footer\.play_itch|notfound\..*|play\..*|soon\.(?:title|line)|profile\.(?:pup_cap|title_type|loves)|dog\.[a-z]+\.(?:name|quote|trait[1-4]))$/;
// the placeholders every message may use (the dog count, the policy date, the Japanese words), besides its own English ones
const GLOBAL = ['count', 'date'].concat(Object.keys(JPW));
// the keys whose text carries the dog count (the count rule: it must come from {count}, never typed in). On the English page the sentences
// that start with it get the number as a word (Thirty-five), every other language and key gets the number in figures
const WORD_KEYS = ['home.dogs.lead', 'dogs.og_description', 'dogs.lead'];
// Chinese big lines that must not break inside a word (e.g. the tagline at phone width): words come from Intl.Segmenter, joined by <wbr>,
// and site/style.css sets word-break:keep-all on them, so a line only breaks between words. Plain text only (no markup or entities).
const KEEP_WORDS = ['home.tagline'];
const keepWords = (s, lang) => (/[<&]/.test(s) || typeof Intl.Segmenter !== 'function' ? s
  : [...new Intl.Segmenter(lang, { granularity: 'word' }).segment(s)].reduce((w, x) => {
    // punctuation and the particles 的 地 得 了 stay with the word before them
    if (!w.length || (x.isWordLike && !/^[的地得了]$/.test(x.segment))) w.push(x.segment); else w[w.length - 1] += x.segment;
    return w;
  }, []).join('<wbr>'));
const COUNT_KEYS = ['home.dogs.lead', 'home.dogs.all', 'dogs.description', 'dogs.og_description', 'dogs.lead'];

// ---- one language's string table, checked against English
function table(L, en) {
  en = en || EN();
  const own = L.code === 'en' || L.pseudo ? {} : (readJSON(path.join(I18N, L.code + '.json')) || {});
  const rep = { lang: L.code, file: !!Object.keys(own).length, complete: !!(own._meta && own._meta.complete), missing: [], broken: [], unknown: [], translated: 0, total: 0 };
  const T = {};
  for (const k of Object.keys(en).filter(isKey)) {
    rep.total++;
    let ast = parse(en[k]);
    if (L.pseudo) ast = pseudoAst(ast, L.pseudo);
    else if (own[k] != null && own[k] !== '') {
      try {
        const a = parse(String(own[k])), want = args(en[k], new Set(GLOBAL)), bad = [...args(String(own[k]), new Set())].filter((x) => !want.has(x));
        if (bad.length) rep.broken.push(`${k}: unknown placeholder {${bad.join('}, {')}}`); else { ast = a; rep.translated++; }
      } catch (e) { rep.broken.push(`${k}: ${e.message}`); }
    } else if (L.code !== 'en') rep.missing.push(k);
    T[k] = ast;
  }
  rep.unknown = Object.keys(own).filter((k) => isKey(k) && !(k in en));
  if (L.code === 'en') rep.translated = rep.total;
  return { T, rep, own };
}

// ---- the pages of one language
function urlFor(L, p) { // '/', '/dogs', '/dogs#shiba' in language L
  if (!L.dir) return p;
  const [a, h] = p.split('#');
  return '/' + L.dir + (a === '/' ? '/' : a) + (h != null ? '#' + h : '');
}
function langScript(L, page) {
  const target = page.path === '/' ? '/' : page.path, codes = LANGS.filter((x) => x.dir).map((x) => `'${x.dir}':1`).join(',');
  // English pages only: a saved pick from the menu (dd_lang, English too) wins; with none, the first visit follows navigator.languages. Never from a
  // page of this site (same-host referrer) or for bots, and only English pages redirect, so it can't loop. No storage, no redirect.
  // A pick from the menu keeps the #anchor (the same dog on /dogs).
  return `\n<script>(function(){var H='${L.dir || 'en'}',P='${target}',K='dd_lang',L={${codes}},s=null,d=document;try{s=window.localStorage;s.getItem(K)}catch(e){s=null}`
    + `d.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-lang]');if(a){if(location.hash)a.href=a.href.split('#')[0]+location.hash;if(s)try{s.setItem(K,a.getAttribute('data-lang'))}catch(x){}}var m=d.getElementById('langs');if(m&&m.open&&!m.contains(e.target))m.open=false});`
    + `if(H!=='en'||!s)return;var v=null;try{v=s.getItem(K);if(!v){s.setItem(K+'_t','1');s.removeItem(K+'_t')}}catch(e){return}`
    + `if(/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent))return;try{if(d.referrer&&new URL(d.referrer).host===location.host)return}catch(e){}`
    + `if(v){if(v!=='en'&&L[v]===1)location.replace('/'+v+P+location.hash);return}`
    + `var a=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];for(var i=0;i<a.length;i++){var t=String(a[i]).toLowerCase().replace(/_/g,'-'),b=t.split('-')[0];`
    + `if(b==='en')return;if(b==='zh')b=/^zh-(hant|tw|hk|mo)(-|$)/.test(t)?'zh-hant':'zh-hans';else if(b==='pt')b='pt-br';else if(b==='in')b='id';`
    + `if(L[b]){location.replace('/'+b+P+location.hash);return}}})();</script>`;
}
function langMenu(L, page, label, menu) {
  const items = LANGS.map((x) => `<li><a href="${urlFor(x, page.path)}" hreflang="${x.code}" lang="${x.code}" data-lang="${x.dir || 'en'}"${x === L ? ' aria-current="true"' : ''}>${x.name}</a></li>`).join('');
  return `<details class="langs" id="langs"><summary aria-label="${escAttr(label + ': ' + L.name)}"><span aria-hidden="true">🌐</span> <span lang="${L.code}">${L.name}</span></summary><nav aria-label="${escAttr(menu)}"><ul>${items}</ul></nav></details>`;
}
// site v3: the header of every page: the logo (home), the four page links (the current one aria-current), the language menu
function header(L, page, t, a, menu) {
  const cur = (NAV.find((n) => n.id === page.id) || {}).page;
  const links = NAV.map((n) => `<a data-page="${n.page}" href="${urlFor(L, n.path)}"${n.page === cur ? ' aria-current="page"' : ''}>${t('nav.' + n.page)}</a>`).join('');
  // owner: the header sits inside the paper sheet; every page starts like the home page: the big logo and the slogan, then the four tabs
  const logo = `<img class="logo" src="/doodle-doggo-logo.svg" alt="${a('common.logo_alt')}" width="900" height="280">`;
  const brand = `<div class="top sitetop">${page.id === 'index' ? `<h1 class="h1logo">${logo}</h1>` : `<a class="brandbig" href="${urlFor(L, '/')}">${logo}</a>`}<p class="tag">🖍️ ${t('home.tagline')}</p></div>`;
  return `\n<header class="sitehead" id="sitehead">${brand}`
    + `<nav class="sitenav" id="sitenav" aria-label="${a('nav.label')}">${links}</nav>${menu}</header>`;
}
function build(o) {
  o = Object.assign({ pseudo: false, legacy: false, langs: null }, o || {});
  const en = EN(), D = dogs(), out = {}, reports = [];
  const list = (o.legacy ? LANGS.filter((x) => x.code === 'en') : LANGS.concat(o.pseudo ? PSEUDO : [])).filter((x) => !o.langs || o.langs.includes(x.code));
  const tpls = Object.fromEntries(PAGES.map((p) => [p.id, fs.readFileSync(path.join(TPL, p.id + '.tpl'), 'utf8')]));
  for (const L of list) {
    const { T, rep, own } = table(L, en), rules = L.rules || L.code;
    const gl = L.code === 'en' || L.pseudo ? null : glossary(L.code);
    rep.glossary = !!gl;
    const base = Object.assign({ count: String(D.length), date: new Intl.DateTimeFormat(L.code === 'en' || L.pseudo === 'long' ? 'en-GB' : rules, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(POLICY_DATE) },
      Object.fromEntries(Object.entries(JPW).map(([k, v]) => [k, H(v)])));
    const cnt = (k) => (L.code === 'en' && WORD_KEYS.includes(k) ? { count: numWord(D.length) } : {});
    const t = (k, p) => { if (!T[k]) throw new Error('no key ' + k); return render(T[k], Object.assign({}, base, cnt(k), p), rules, false); };
    // attributes (alt, meta description) drop the soft hyphens that some long words carry for line breaking
    const a = (k, p) => render(T[k], Object.assign({}, base, cnt(k), p), rules, true).split(String.fromCharCode(0xad)).join('');
    const u = (p) => urlFor(L, p);
    const breed = (d) => (gl && gl.breeds && gl.breeds[d.key]) || d.breed;
    const name = (d) => t(`dog.${d.key}.name`);
    // the /dogs picture menu: --n is the name's rough width in em (Patrick Hand Latin ~0.45, kanji/kana 1.1, Hangul 0.85, Thai 0.75, Thai marks and
    // break hints 0), so site/style.css can shrink only a name that would not fit its cell (font-size min(17px, cell / --n)).
    const navEm = (s) => Math.round([...s].reduce((w, ch) => w + (/[\u200b\u2060\u0e31\u0e34-\u0e3a\u0e47-\u0e4e]/.test(ch) ? 0
      : /[\uac00-\ud7af]/.test(ch) ? 0.85 : /[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(ch) ? 1.1 : /[\u0e00-\u0e7f]/.test(ch) ? 0.75 : 0.45), 0) * 100) / 100;
    // Latin names too long for a phone cell even at 15px get a soft hyphen at a natural point (Marsh-mallow), never a break mid-syllable
    const NAV_SPLIT = { Marshmallow: 'Marsh|mallow', Shortbread: 'Short|bread', Jellybean: 'Jelly|bean', Madeleine: 'Made|leine', Meringue: 'Me|ringue', Dumpling: 'Dump|ling', Espresso: 'Es|presso' };
    const navName = (d) => {
      const nm = name(d), raw = nm.replace(/&[#a-z0-9]+;/g, 'x'), ch = [...nm];
      if (/[\u0e00-\u0e7f]/.test(nm)) { // Thai: break only at the translator's zero-width spaces, never inside a part
        const parts = nm.split(/[\u200b]/);
        return { n: Math.max(...parts.map(navEm)), html: `<span>${parts.map((x) => `<span class="nw">${x}</span>`).join('<wbr>')}</span>` }; // one flex item
      }
      if (!/^[\u3000-\u9fff\uac00-\ud7af]+$/.test(nm) || navEm(raw) <= 4.4) return { n: navEm(raw), html: NAV_SPLIT[nm] ? NAV_SPLIT[nm].replace('|', '&shy;') : nm };
      let at = Math.ceil(ch.length / 2);
      while (at > 1 && /[\u30a1\u30a3\u30a5\u30a7\u30a9\u30c3\u30e3\u30e5\u30e7\u30ee\u30f5\u30f6\u3041\u3043\u3045\u3047\u3049\u3063\u3083\u3085\u3087\u30fc\u30fb]/.test(ch[at])) at--; // a small kana or ー never starts the second line
      return { n: Math.max(navEm(ch.slice(0, at).join('')), navEm(ch.slice(at).join(''))), html: '<span>' + ch.slice(0, at).join('') + '<wbr>' + ch.slice(at).join('') + '</span>' };
    };
    // the dog cards (home), the picture menu and the profiles (/dogs)
    const card = (d) => `<li><a class="dcard" href="${u('/dogs#' + d.key)}" id="card-${d.key}">
  <img class="dimg" src="/img/art/dogs/${d.key}-still.svg" alt="${a('card.alt', { name: name(d), breed: breed(d) })}" width="240" height="200" loading="lazy">
  <span class="dname" style="--n:${navEm(name(d).replace(/&[#a-z0-9]+;/g, 'x'))}">${navName(d).html}</span><span class="dtype">${t('card.type', { breed: breed(d), jp: H(breed(d) === d.jp ? '' : `<span class="jp" lang="ja">${d.jp}</span>`) })}</span>
  <span class="dquote">${t('common.quoted', { text: H(t(`dog.${d.key}.quote`)) })}</span><span class="dmore">${t('card.more')} <span aria-hidden="true">→</span></span></a></li>`;
    const lovesHTML = (d) => d.loves.map(([n], i) => `<li><img src="/img/art/loves/${slug(n)}.svg" alt="" width="64" height="64" loading="lazy">${t(`dog.${d.key}.love${i + 1}`)}</li>`).join('');
    const profile = (d) => {
      const k = `dog.${d.key}.`, nm = name(d), art = aAn(en[k + 'name']);
      return `<article class="prof" id="${d.key}" aria-labelledby="h-${d.key}">
  <div class="pics"><img class="big" src="/img/art/dogs/${d.key}-still.svg" alt="${a('profile.alt', { name: nm, breed: breed(d) })}" width="240" height="200" loading="lazy"><img class="pup" src="/img/art/dogs/${d.key}-pup.svg" alt="${a('profile.pup_alt', { name: nm, article: art })}" width="240" height="200" loading="lazy"><span class="cap">${t('profile.pup_cap', { name: nm, article: art })}</span></div>
  <div class="txt">
    <h2 id="h-${d.key}">${nm} <span class="dtype">${t('profile.title_type', { breed: breed(d) })}</span></h2>
    <p class="jpline">${t('profile.jpline', { jp: H(`<span class="jp" lang="ja">${d.jp}</span>`), reading: H(`<i>${escText(d.jpRead)}</i>`), name: nm, nameJp: H(`<span class="jp" lang="ja">${d.nameJp}</span>`) })}</p>
    <p class="bubble">${t('common.quoted', { text: H(t(k + 'quote')) })}</p>
    <p>${t('profile.personality', { text: H(t(k + 'personality')) })}</p>
    <ul class="traits">${[1, 2, 3, 4].map((i) => `<li><b>${t(k + 'trait' + i)}</b>${t(k + 'trait' + i + '_line')}</li>`).join('')}</ul>
    <p class="playline">${t('profile.play', { text: H(t(k + 'play')) })}</p>
    <div class="loves"><b>${t('profile.loves')}</b><ul>${lovesHTML(d)}</ul></div>
    ${T[k + 'fun'] ? `<p class="fun"><span class="tip">${t('profile.fun')}</span> ${t(k + 'fun')}</p>` : ''}
  </div>
</article>`;
    };
    const sils = ['shiba-still', 'samoyed-pup'].map((f) => `<span class="sil"><img src="/img/art/dogs/${f}.svg" alt="" width="240" height="200" loading="lazy"><b aria-hidden="true">?</b></span>`).join('');
    const plain = (k) => t(k).replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    // /map: one section per area, its big map (town, Tokyo) and a card per place
    const placeSec = (sec) => `<section class="places" id="${sec.id}" aria-labelledby="h-${sec.id}">
      <h2 id="h-${sec.id}">${t(`map.${sec.key}.title`)}</h2>
      <p class="seclead">${t(`map.${sec.key}.lead`)}</p>${sec.map ? `
      <figure class="bigmap" id="${sec.map.id}"><img src="${sec.map.src}" width="1200" height="720" alt="${a(sec.map.alt)}" loading="lazy"></figure>` : ''}
      <div class="placegrid">
${sec.places.map((id) => `        <article class="place" id="place-${id}"><img src="/img/map/${id}.webp" width="960" height="576" alt="${a('map.shot_alt', { place: plain(`map.place.${id}.name`) })}" loading="lazy"><h3>${t(`map.place.${id}.name`)}</h3><p>${t(`map.place.${id}.text`)}</p></article>`).join('\n')}
      </div>
    </section>`;
    const soonProf = `<section class="soonprof" id="soon" aria-labelledby="h-soon"><div class="sils">${sils}</div><div class="txt"><h2 id="h-soon">${t('soon.title')}</h2><p class="bubble">${t('soon.line')}</p><p>${t('soon.more')}</p></div></section>`;
    // the playroom's barks for site.js (only what this language has translated; English needs none)
    const play = {}; Object.keys(T).filter((k) => k.startsWith('play.') && (L.pseudo || (own[k] != null && own[k] !== ''))).forEach((k) => { play[k.slice(5)] = render(T[k], base, rules, true).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); });
    const fontCss = path.join(SITE, 'fonts', 'i18n', (L.pseudo === 'cjk' ? 'ja' : L.code) + '.css');
    for (const page of PAGES) {
      const blocks = {
        htmlattrs: L.code === 'en' ? '' : ` class="i18n s-${L.script}${L.pseudo ? ' pseudo' : ''}"`,
        fontcss: L.code !== 'en' && fs.existsSync(fontCss) && /@font-face/.test(fs.readFileSync(fontCss, 'utf8')) ? `<link rel="stylesheet" href="/fonts/i18n/${path.basename(fontCss)}?v=${crypto.createHash('sha1').update(fs.readFileSync(fontCss)).digest('hex').slice(0, 8)}">` : '',
        canonical: ORIGIN + urlFor(L, page.path),
        alternates: o.legacy || L.pseudo || page.id === 'reset' ? '' : '\n' + LANGS.map((x) => `<link rel="alternate" hreflang="${x.code}" href="${ORIGIN + urlFor(x, page.path)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${ORIGIN + page.path}">`,
        oglocale: L.code === 'en' ? '' : `<meta property="og:locale" content="${L.og}">`,
        langscript: o.legacy ? '' : langScript(L, page),
        header: header(L, page, t, a, o.legacy ? '' : langMenu(L, page, render(T['lang.label'], base, rules, false), render(T['lang.menu'], base, rules, true))),
        cards: page.id === 'index' ? FEATURED.map((k) => D.find((d) => d.key === k)).map(card).join('\n') : '',
        places: page.id === 'map' ? MAP.map(placeSec).join('\n') : '',
        teaserpics: page.id === 'index' ? [['/map#townmap', '/img/map/town-map.webp', 1200, 720, a('map.town.alt')], ['/map#place-shibuya', '/img/map/shibuya.webp', 960, 576, a('map.shot_alt', { place: plain('map.place.shibuya.name') })],
          ['/map#place-fujihill', '/img/map/fujihill.webp', 960, 576, a('map.shot_alt', { place: plain('map.place.fujihill.name') })]]
          .map(([href, src, w, h, alt]) => `        <li><a href="${u(href)}"><img src="${src}" alt="${alt}" width="${w}" height="${h}" loading="lazy"></a></li>`).join('\n') : '',
        dognav: page.id === 'dogs' ? D.map((d) => { const nn = navName(d); return `<li style="--n:${nn.n}"><a href="#${d.key}"><img src="/img/art/dogs/${d.key}-still.svg" alt="" width="240" height="200">${nn.html}</a></li>`; }).join('\n') : '',
        profiles: page.id === 'dogs' ? D.map(profile).concat(soonProf).join('\n') : '',
        i18njson: page.id === 'index' && Object.keys(play).length ? `\n<script type="application/json" id="dd-i18n">${JSON.stringify(play).replace(/</g, '\\u003c')}</script>` : ''
      };
      const html = tpls[page.id].replace(/\{\{(?:(t|a|u|raw) ([^}\s]+)|(lang))\}\}/g, (m, kind, arg, lang) => {
        if (lang) return L.code;
        if (kind === 't' && KEEP_WORDS.includes(arg) && /^zh/.test(L.code)) return keepWords(t(arg), L.code);
        if (kind === 't') return t(arg);
        if (kind === 'a') return a(arg);
        if (kind === 'u') return u(arg);
        if (!(arg in blocks)) throw new Error('unknown block ' + arg); return blocks[arg];
      });
      out[(L.dir ? L.dir + '/' : '') + page.id + '.html'] = html;
    }
    // the glossary's word rules (bans) on this language's translated text
    rep.bans = [];
    if (gl && Array.isArray(gl.bans)) {
      // only the translated messages: the English fallback text keeps the English word rules (game/test_site.js WORDS)
      const text = Object.keys(own).filter((k) => isKey(k) && T[k] && own[k]).map((k) => render(T[k], base, rules, false).replace(/<[^>]+>/g, ' ')).join(' \n ');
      let clean = text; (gl.allow || []).forEach((s) => { clean = clean.split(s).join(' '); });
      gl.bans.forEach((b) => { try { const m = clean.match(new RegExp(b.re, (b.flags || 'iu').replace('g', ''))); if (m) rep.bans.push(`"${m[0]}" (${b.why || b.re})`); } catch (e) { rep.bans.push('bad ban ' + b.re); } });
    }
    if (L.code === 'en') { // the game's own personality lines (PawArt.DOGS) and en.json must agree
      rep.drift = D.filter((d) => { const p = d.gamePersonality + (/[.!?]$/.test(d.gamePersonality) ? '' : '.'); return en[`dog.${d.key}.personality`] !== p || en[`dog.${d.key}.name`] == null; }).map((d) => d.key);
    }
    reports.push(rep);
  }
  return { pages: out, reports };
}
// fmt: one message of one language, for tests (e.g. the dog count rule)
function fmt(code, key, params) {
  const L = LANGS.concat(PSEUDO).find((x) => x.code === code); const { T } = table(L);
  const D = dogs();
  return render(T[key], Object.assign({ count: code === 'en' && WORD_KEYS.includes(key) ? numWord(D.length) : String(D.length) }, Object.fromEntries(Object.entries(JPW).map(([k, v]) => [k, H(v)])), params || {}), L.rules || L.code, false);
}
function printReport(reports, full) {
  for (const r of reports) {
    if (r.lang === 'en') { if (r.drift && r.drift.length) console.log(`en: en.json personality differs from the game's PawArt.DOGS for ${r.drift.join(', ')}`); continue; }
    const pct = Math.round(100 * r.translated / r.total);
    console.log(`${r.lang.padEnd(8)} ${String(r.translated).padStart(4)}/${r.total} translated (${pct}%)${r.complete ? ', marked complete' : ''}${r.file ? '' : ', no site/i18n/' + r.lang + '.json yet'}${r.glossary ? '' : ', no glossary (English breed names)'}`
      + `${r.missing.length ? `, ${r.missing.length} missing` : ''}${r.broken.length ? `, ${r.broken.length} BROKEN` : ''}${r.unknown.length ? `, ${r.unknown.length} unknown keys` : ''}${r.bans && r.bans.length ? `, ${r.bans.length} word-rule hits` : ''}`);
    const show = (label, a) => { if (a && a.length && (full || label !== 'missing')) console.log(`  ${label}: ${a.slice(0, full ? 1e9 : 12).join(' | ')}${!full && a.length > 12 ? ' ...' : ''}`); };
    show('missing', r.missing); show('broken', r.broken); show('unknown', r.unknown); show('word rules', r.bans);
  }
}
function write(pages, root) {
  root = root || SITE;
  for (const [rel, html] of Object.entries(pages)) { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, html); }
}
module.exports = { LANGS, PSEUDO, PAGES, NAV, FEATURED, MAP, COUNT_KEYS, HAND_KEYS, build, fmt, write, parse, render, urlFor, printReport, table };

if (require.main === module) {
  const argv = process.argv.slice(2), has = (f) => argv.includes(f);
  if (has('--title-keys')) { console.log(HAND_KEYS.source); process.exit(0); }
  const r = build({ pseudo: has('--pseudo'), legacy: has('--legacy') });
  if (has('--check')) {
    const bad = PAGES.map((p) => p.id + '.html').filter((f) => fs.readFileSync(path.join(SITE, f), 'utf8') !== r.pages[f]);
    console.log(bad.length ? 'out of date: site/' + bad.join(', site/') + ' (run node tools/site_i18n.js)' : 'the English pages are up to date');
    process.exit(bad.length ? 1 : 0);
  }
  if (has('--legacy')) { write(r.pages, path.join(ROOT, argv[argv.indexOf('--legacy') + 1] || '_legacy')); console.log('wrote the v2.12-style English pages'); process.exit(0); }
  write(r.pages);
  printReport(r.reports, has('--report'));
  const n = Object.keys(r.pages).length;
  console.log(`wrote ${n} pages (${n / PAGES.length} languages) in site/`);
}
