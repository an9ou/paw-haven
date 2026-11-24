/* Doodle Doggo merch: the dog's name on a print. No dependencies, no DOM, no storage: the same file runs in the browser (<script> -> self.PawNames),
   in Node (require) and in a Worker (bundled or imported). tools/merch_build.js also puts it inside PawPrint (PawPrint.nameOk / nameClean).
     nameClean(s) -> the name as it will print, or null when it cannot print (the save reader and the link checker use this; a long name is cut at 20)
     nameOk(s)    -> { ok: true, name } or { ok: false, why: 'empty' | 'long' | 'letters' | 'word', name, say: "Let's try another name" }. Never throws.
   The rules: at most 20 characters, only the letters the print font draws (Latin with accents, digits, space and ' - . & !), trimmed, one line. */
(function (root) {
  'use strict';
  var MAX = 20;
  // the Latin letters Caveat Bold (merch/pawprint_font.js) has outlines for; test_pawprint.js checks each one is in the font
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    + '\u00C0\u00C1\u00C2\u00C3\u00C4\u00C5\u00C6\u00C7\u00C8\u00C9\u00CA\u00CB\u00CC\u00CD\u00CE\u00CF\u00D0\u00D1\u00D2\u00D3\u00D4\u00D5\u00D6\u00D8\u00D9\u00DA\u00DB\u00DC\u00DD\u00DE\u00DF'
    + '\u00E0\u00E1\u00E2\u00E3\u00E4\u00E5\u00E6\u00E7\u00E8\u00E9\u00EA\u00EB\u00EC\u00ED\u00EE\u00EF\u00F0\u00F1\u00F2\u00F3\u00F4\u00F5\u00F6\u00F8\u00F9\u00FA\u00FB\u00FC\u00FD\u00FE\u00FF'
    + '\u0102\u0131\u0152\u0153\u014C\u014D\u016A\u016B';
  var CHARS = LETTERS + '0123456789' + " !&'-.";
  var OK = {}; for (var i = 0; i < CHARS.length; i++) OK[CHARS[i]] = 1;
  // look-alikes typed on phones, turned into the plain mark the font draws
  var SWAP = { '\u2019': "'", '\u2018': "'", '\u02BC': "'", '\u00B4': "'", '`': "'", '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-', '\u2212': '-' };
  var SAY = "Let's try another name";

  /* The kind-word list: short on purpose, kept only here. ROT13, so the file does not read as a list of rude words.
     SUB: refused anywhere in the name. WORD: refused as a whole word, or as the whole name with its spaces and marks taken out.
     Matching is on a normalised copy: accents off, lower case, digits and ! read as letters (0 o, 1 i, 3 e, 4 a, 5 s, 7 t, 8 b, 9 g, ! i),
     only letters kept (so spacing and dots between letters do not hide a word), runs of 3 or more of a letter squeezed. */
  var SUB = 'shpx phag ovgpu juber fyhg gjng obyybpx cravf intvan cbea qvyqb anmv uvgyre encvfg ergneq nffubyr nefrubyr avttre avttn snttbg fuvg chffl';
  var WORD = 'nff nefr qvpx pbpx gvg gvgf obbo obbof phz wvmm frk encr cvff snt fcvp puvax xvxr genaal jnax jnaxre xxx';
  function rot(s) { return s.replace(/[a-z]/g, function (c) { return String.fromCharCode((c.charCodeAt(0) - 84) % 26 + 97); }); }
  var SUBL = rot(SUB).split(' '), WORDS = {}; rot(WORD).split(' ').forEach(function (w) { WORDS[w] = 1; });
  var LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', '!': 'i' };

  function norm(s) { // -> letters only
    var t = s.normalize('NFD').replace(/[\u0300-\u036F]/g, '').toLowerCase().replace(/\u00DF/g, 'ss').replace(/\u00E6/g, 'ae').replace(/\u0153/g, 'oe').replace(/\u0131/g, 'i').replace(/\u00F8/g, 'o').replace(/[\u00F0\u00FE]/g, 'd');
    var o = ''; for (var k = 0; k < t.length; k++) { var c = LEET[t[k]] || t[k]; o += /[a-z]/.test(c) ? c : ' '; }
    return o;
  }
  var sq1 = function (s) { return s.replace(/([a-z])\1{2,}/g, '$1'); }, sq2 = function (s) { return s.replace(/([a-z])\1{2,}/g, '$1$1'); };
  function rude(name) {
    var n = norm(name), words = n.split(/\s+/).filter(Boolean), joined = words.join('');
    var forms = [sq1(joined), sq2(joined)];
    for (var a = 0; a < forms.length; a++) { for (var b = 0; b < SUBL.length; b++) if (forms[a].indexOf(SUBL[b]) >= 0) return true; if (WORDS[forms[a]]) return true; }
    for (var w = 0; w < words.length; w++) if (WORDS[sq1(words[w])] || WORDS[sq2(words[w])]) return true;
    return false;
  }

  // the tidy form: NFC, look-alikes swapped, invisible and control characters out, spaces collapsed, trimmed
  function tidy(s) {
    if (typeof s !== 'string') return '';
    if (s.length > 400) s = s.slice(0, 400);
    var t = s.normalize('NFC').replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '');
    t = t.replace(/[\u2019\u2018\u02BC\u00B4`\u2010-\u2014\u2212]/g, function (c) { return SWAP[c]; });
    return t.replace(/\s+/g, ' ').trim();
  }
  function nameOk(s, o) {
    try {
      var t = tidy(s), cps = Array.from(t);
      if (!cps.length) return { ok: false, why: 'empty', name: '', say: SAY };
      if (cps.length > MAX) { if (!(o && o.cut)) return { ok: false, why: 'long', name: t, say: SAY }; t = cps.slice(0, MAX).join('').trim(); cps = Array.from(t); }
      for (var k = 0; k < cps.length; k++) if (!OK[cps[k]]) return { ok: false, why: 'letters', name: t, say: SAY };
      if (!/[A-Za-z0-9\u00C0-\u016B]/.test(t)) return { ok: false, why: 'letters', name: t, say: SAY }; // only marks ("...", "!!") is not a name
      if (rude(t)) return { ok: false, why: 'word', name: t, say: SAY };
      return { ok: true, name: t };
    } catch (e) { return { ok: false, why: 'letters', name: '', say: SAY }; }
  }
  function nameClean(s) { var r = nameOk(s, { cut: true }); return r.ok ? r.name : null; }

  var api = { MAX: MAX, CHARS: CHARS, SAY: SAY, nameOk: nameOk, nameClean: nameClean };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else if (root) root.PawNames = api;
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this);
