/* Doodle Doggo v2.14: the message formatter shared by the game and the site (V214.md section 3).
   UMD, no dependencies: `require('./msg.js')` in node, `window.PawI18nMsg` in the browser.

   Syntax (an ICU MessageFormat subset, nothing else):
     {name}                                        the var as a string (numbers are NOT grouped: use num())
     {n, plural, =0 {no dogs} one {# dog} other {# dogs}}
                                                   =N exact match first, then Intl.PluralRules(lang), then `other`
                                                   `#` = n formatted with Intl.NumberFormat(lang) (innermost plural)
     {x, select, a {..} b {..} other {..}}         the var as a string, then `other`
     {name, josa, 이/가}                            Korean only (V214.md 3.2): the var plus the particle that fits its last
                                                   syllable (batchim -> 이, none -> 가; 으로/로: none or ㄹ -> 로). Pairs:
                                                   이/가 을/를 은/는 과/와 아/야 이랑/랑 으로/로 (with-batchim form first).
                                                   A last character that is not Hangul or a digit gets "이(가)", "(으)로".
   Branches nest. Every plural and select needs an `other` branch. Apostrophes are plain text (no ICU quoting),
   so "It's {name}'s ball" is fine. `{` and `}` are always syntax: a table never needs a literal brace.
   A var that is missing from `vars` renders as `{name}`, so a test can spot it on screen.

   API: format(msg, vars, lang) -> string (never throws: a broken message comes back as written)
        parse(msg) -> AST (throws on bad syntax; tests use it), args(msg) -> { name: 'arg'|'plural'|'select'|'josa' }
        pickLang(list) -> one of CODES, LANGS { code: native name }, LANG_EN { code: English name }, CODES
        num(n, lang, opts), date(d, lang, opts), list(arr, lang): cached Intl formatters
        lookup(table, en, key, vars, lang): the per-key fallback (`en` is a table or the English string itself)
        id(s): the data-row key part ('Bone-shaped Biscuit' -> 'bone_shaped_biscuit') */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PawI18nMsg = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // the 11 languages, in picker order (English first: the source language)
  const LANGS = {
    en: 'English', ja: '日本語', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文', ko: '한국어', es: 'Español',
    'pt-BR': 'Português (Brasil)', fr: 'Français', de: 'Deutsch', th: 'ไทย', id: 'Bahasa Indonesia'
  };
  const LANG_EN = {
    en: 'English', ja: 'Japanese', 'zh-Hans': 'Chinese (Simplified)', 'zh-Hant': 'Chinese (Traditional)', ko: 'Korean', es: 'Spanish',
    'pt-BR': 'Portuguese (Brazil)', fr: 'French', de: 'German', th: 'Thai', id: 'Indonesian'
  };
  const CODES = Object.keys(LANGS);

  /* ---- Korean particles (josa): the form after a final consonant (batchim) first, the form after a vowel second ---- */
  const JOSA = { '이/가': 1, '을/를': 1, '은/는': 1, '과/와': 1, '아/야': 1, '이랑/랑': 1, '으로/로': 1, '이에요/예요': 1, '이었/였': 1 };
  // the batchim of the last syllable: 0 none, 8 = ㄹ, other > 0; digits as read in Sino-Korean (영 일 이 삼 사 오 육 칠 팔 구); null = unknown
  const DIGIT_BATCHIM = [21, 8, 0, 16, 0, 0, 1, 8, 8, 0];
  function batchim(word) {
    const w = String(word).replace(/[\s)\]}"'’”.!?…~]+$/u, '');
    const c = w.charCodeAt(w.length - 1);
    if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28;
    if (c >= 48 && c <= 57) return DIGIT_BATCHIM[c - 48];
    return null;
  }
  function josa(word, a, b) {
    const n = batchim(word);
    if (n == null) return a === '으로' ? '(으)로' : a + '(' + b + ')';
    if (a === '으로') return n === 0 || n === 8 ? b : a;
    return n ? a : b;
  }

  /* ---- parser: msg -> array of nodes. A node is a string, { t: 'arg', v }, { t: 'hash' },
     { t: 'plural', v, opts: { '=0': nodes, one: nodes, other: nodes } } or { t: 'select', v, opts } ---- */
  function parse(msg) {
    const s = String(msg);
    let i = 0;
    const fail = (why) => { throw new Error('i18n: ' + why + ' at ' + i + ' in "' + s.slice(0, 80) + '"'); };
    const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
    const word = () => { const m = /^[^\s{},]+/.exec(s.slice(i)); if (!m) fail('expected a name'); i += m[0].length; return m[0]; };
    function nodes(inPlural, depth) {
      const out = []; let txt = '';
      const push = () => { if (txt) { out.push(txt); txt = ''; } };
      while (i < s.length) {
        const c = s[i];
        if (c === '}') { if (!depth) fail('unmatched }'); break; }
        if (c === '#' && inPlural) { push(); out.push({ t: 'hash' }); i++; continue; }
        if (c !== '{') { txt += c; i++; continue; }
        push(); i++; ws();
        const v = word(); ws();
        if (!/^[A-Za-z_$][\w$]*$/.test(v)) fail('bad var name "' + v + '"');
        if (s[i] === '}') { i++; out.push({ t: 'arg', v }); continue; }
        if (s[i] !== ',') fail('expected , or }');
        i++; ws();
        const type = word(); ws();
        if (type !== 'plural' && type !== 'select' && type !== 'josa') fail('unknown type "' + type + '" (only plural, select and josa)');
        if (s[i] !== ',') fail('expected ,');
        if (type === 'josa') {
          i++; ws();
          const m = /^([^\s{}/,]+)\/([^\s{}/,]+)\s*\}/.exec(s.slice(i));
          if (!m || !JOSA[m[1] + '/' + m[2]]) fail('josa needs one of ' + Object.keys(JOSA).join(' '));
          i += m[0].length;
          out.push({ t: 'josa', v, a: m[1], b: m[2] });
          continue;
        }
        i++; ws();
        const opts = {};
        while (s[i] !== '}') {
          if (i >= s.length) fail('unclosed ' + type);
          const k = word(); ws();
          if (type === 'plural' && !/^(=\d+|zero|one|two|few|many|other)$/.test(k)) fail('bad plural key "' + k + '"');
          if (s[i] !== '{') fail('expected { after "' + k + '"');
          if (opts[k]) fail('duplicate key "' + k + '"');
          i++;
          opts[k] = nodes(type === 'plural' ? true : inPlural, depth + 1);
          if (s[i] !== '}') fail('unclosed branch "' + k + '"');
          i++; ws();
        }
        i++;
        if (!opts.other) fail(type + ' "' + v + '" has no other branch');
        out.push({ t: type, v, opts });
      }
      push();
      return out;
    }
    const ast = nodes(false, 0);
    if (i < s.length) fail('unmatched }');
    return ast;
  }

  // parse cache: a message is parsed once (the tables are small and repeat a lot)
  const CACHE = new Map(), BAD = {};
  function parsed(msg) {
    let a = CACHE.get(msg);
    if (a === undefined) {
      try { a = parse(msg); } catch (e) { a = BAD; }
      if (CACHE.size > 5000) CACHE.clear();
      CACHE.set(msg, a);
    }
    return a;
  }

  // cached Intl objects, with English-rule fallbacks for very old browsers
  const PR = {}, NF = {}, DF = {};
  function pluralCat(n, lang) {
    const k = lang || 'en';
    if (!(k in PR)) { try { PR[k] = new Intl.PluralRules(k); } catch (e) { PR[k] = null; } }
    return PR[k] ? PR[k].select(n) : (n === 1 ? 'one' : 'other');
  }
  function num(n, lang, opts) {
    const k = (lang || 'en') + (opts ? JSON.stringify(opts) : '');
    if (!(k in NF)) { try { NF[k] = new Intl.NumberFormat(lang || 'en', opts); } catch (e) { NF[k] = null; } }
    return NF[k] ? NF[k].format(n) : String(n);
  }
  function date(d, lang, opts) {
    const k = (lang || 'en') + (opts ? JSON.stringify(opts) : '');
    if (!(k in DF)) { try { DF[k] = new Intl.DateTimeFormat(lang || 'en', opts); } catch (e) { DF[k] = null; } }
    const x = d instanceof Date ? d : new Date(d);
    return DF[k] ? DF[k].format(x) : x.toDateString();
  }

  // list(['Mochi', 'Bao', 'Pip'], lang) -> 'Mochi, Bao and Pip' (Intl.ListFormat, 'and' lists)
  const LF = {};
  function list(arr, lang) {
    const k = lang || 'en', a = (arr || []).map(String);
    if (!(k in LF)) { try { LF[k] = new Intl.ListFormat(k, { type: 'conjunction' }); } catch (e) { LF[k] = null; } }
    if (LF[k]) return LF[k].format(a);
    return a.length < 3 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  }

  function render(ast, vars, lang, n) {
    let out = '';
    for (const x of ast) {
      if (typeof x === 'string') { out += x; continue; }
      if (x.t === 'hash') { out += n == null ? '#' : num(n, lang); continue; }
      const has = vars && Object.prototype.hasOwnProperty.call(vars, x.v) && vars[x.v] != null;
      if (!has) { out += '{' + x.v + '}'; continue; }
      const val = vars[x.v];
      if (x.t === 'arg') { out += String(val); continue; }
      if (x.t === 'josa') { out += String(val) + josa(String(val), x.a, x.b); continue; }
      if (x.t === 'select') { const b = x.opts[String(val)] || x.opts.other; out += render(b, vars, lang, n); continue; }
      const v = Number(val);
      const b = x.opts['=' + v] || x.opts[pluralCat(v, lang)] || x.opts.other;
      out += render(b, vars, lang, v);
    }
    return out;
  }

  function format(msg, vars, lang) {
    if (msg == null) return '';
    msg = String(msg);
    if (msg.indexOf('{') < 0) return msg; // most strings: plain text, no parse
    const a = parsed(msg);
    return a === BAD ? msg : render(a, vars || {}, lang || 'en', null);
  }

  // the vars a message uses: { name: 'arg' | 'plural' | 'select' } (tests compare a translation with en.json)
  function args(msg) {
    const out = {};
    const walk = (ast) => ast.forEach((x) => {
      if (typeof x === 'string' || x.t === 'hash') return;
      if (!out[x.v] || out[x.v] === 'arg') out[x.v] = x.t;
      if (x.opts) Object.keys(x.opts).forEach((k) => walk(x.opts[k]));
    });
    walk(parse(msg));
    return out;
  }

  /* pickLang(list): the game's and the site's language from navigator.languages (or one tag, or a saved code).
     The first entry that maps to one of the 11 wins; nothing matches -> 'en'.
       zh-TW, zh-HK, zh-MO, zh-Hant(-*) -> zh-Hant      zh, zh-CN, zh-SG, zh-MY, zh-Hans(-*) -> zh-Hans
       pt(-*) -> pt-BR      es(-*) -> es      in (old Java code) -> id      any other: the base subtag (ja-JP -> ja) */
  function pickLang(list) {
    const arr = Array.isArray(list) ? list : list == null ? [] : [list];
    for (const raw of arr) {
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const parts = raw.trim().replace(/_/g, '-').toLowerCase().split('-');
      const base = parts[0], rest = parts.slice(1);
      if (base === 'zh') {
        if (rest.includes('hant') || rest.some((p) => p === 'tw' || p === 'hk' || p === 'mo')) return 'zh-Hant';
        return 'zh-Hans';
      }
      if (base === 'pt') return 'pt-BR';
      if (base === 'in') return 'id';
      const hit = CODES.find((c) => c.toLowerCase() === base);
      if (hit) return hit;
    }
    return 'en';
  }

  /* lookup(table, en, key, vars, lang): the text for `key` in `table` (this language), else the English (`en` is the inline
     English string the game passes, or a whole English table), else the key itself.
     An empty string in a translation counts as missing (a translator's placeholder). */
  function lookup(table, en, key, vars, lang) {
    let m = table && table[key];
    if (m == null || m === '') { m = typeof en === 'string' ? en : en && en[key]; lang = 'en'; }
    if (m == null) return key;
    return format(m, vars, lang);
  }

  /* id(s): the key part for a data row, from its English id ('Bone-shaped Biscuit' -> 'bone_shaped_biscuit', 'Hachikō' -> 'hachiko').
     tdata() in the game and tools/i18n_extract.js both use it, so a data key never depends on who builds it. */
  function id(s) {
    return String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || '_';
  }

  return { LANGS, LANG_EN, CODES, parse, format, args, pickLang, pluralCat, num, date, list, lookup, id, josa, JOSA };
});
