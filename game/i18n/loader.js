/* v2.14 PERF (PERF.md): the per-language loader of the split builds (tools/split.js; itch.io, GitHub Pages, doodledoggo.app /play/, the claude.ai
   artifact). English is in the code, so it needs nothing. Every other language is its own file, PAW_I18N.files[code] = 'lang/<code>.<hash>.js',
   which adds PAW_I18N[code], plus the shared PAW_I18N.keyFile = 'lang/keys.<hash>.js', which adds PAW_I18N.keys (the same arrays as
   game/i18n/packed.js). They load with <script> tags (works on file://, in the itch.io zip and in the artifact), started here from the language
   the game will pick, so they download while the rest of the page does.
   The game script waits for it (PAW_I18N.run, tools/split.js wraps the game in it), so the first screen is already in that language.
   On a failed load the game starts in English and 00b_i18n.js tries again later. The test harness keeps every language inline and has no loader. */
(function () {
  var P = window.PAW_I18N, M = window.PawI18nMsg;
  if (!P || !P.files) return;
  var busy = {};
  P.has = function (code) { return !P.files[code] || (Array.isArray(P[code]) && P.keys.length > 0); };
  // one script file -> a promise (rejects on a network error; a later call tries again)
  function script(src, done) {
    if (busy[src]) return busy[src];
    busy[src] = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () { busy[src] = null; if (done()) res(); else rej(new Error('language file ' + src)); };
      s.onerror = function () { busy[src] = null; if (s.parentNode) s.parentNode.removeChild(s); rej(new Error('language file ' + src)); };
      (document.head || document.documentElement).appendChild(s);
    });
    return busy[src];
  }
  // load(code) -> a promise that resolves once PAW_I18N.keys and PAW_I18N[code] are there
  P.load = function (code) {
    if (P.has(code)) return Promise.resolve(code);
    return Promise.all([
      P.keys.length ? null : script(P.keyFile, function () { return P.keys.length > 0; }),
      Array.isArray(P[code]) ? null : script(P.files[code], function () { return Array.isArray(P[code]); })
    ]).then(function () { return code; });
  };
  // the language 00b_i18n.js will pick (i18nWanted): the prefs.lang pin, a save's S.lang, the title pick prefs.langPick, else the device
  function guess() {
    var real = function (c) { return typeof c === 'string' && M.CODES.indexOf(c) >= 0; }, pr = {}, sv = null, dev = 'en';
    try { pr = JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}') || {}; } catch (e) { pr = {}; }
    try { sv = JSON.parse(localStorage.getItem('pawhaven_proto_v1') || 'null'); } catch (e) { sv = null; }
    try { dev = M.pickLang(navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]); } catch (e) { dev = 'en'; }
    if (real(pr.lang)) return pr.lang;
    if (sv && sv.v === 1 && (sv.dog || (sv.dogs && sv.dogs.length))) return real(sv.lang) ? sv.lang : dev;
    return real(pr.langPick) ? pr.langPick : dev;
  }
  var want = guess(), first = P.load(want);
  first.catch(function () { /* the game starts in English; 00b_i18n.js retries */ });
  // run(fn): the game script. Right away when its language is here (English always is), else once the file came or failed (at most 15 s)
  P.run = function (fn) {
    if (P.has(want)) return fn();
    var done = false, go = function () { if (!done) { done = true; fn(); } };
    first.then(go, go); setTimeout(go, 15000);
  };
})();
