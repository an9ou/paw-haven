/* v2.31.14 PERF (PERF.md 8): the "rest" file of the split builds (tools/split.js; itch.io, doodledoggo.app /play/, the test copy, GitHub Pages).
   window.PAW_CHUNKS.r = 'world_r.<hash>.js' holds what the title screen does not need: art worlds D and E, the shop art and the walk, toy, garden,
   kitchen and QR modules, in their old order (about a fifth of the old page). The game is the same once it is there; only WHEN it loads changes:
     - a returning player (a save or a cloud account in this browser): the download starts here, next to the page, and the game script waits for it
       (PAW_REST.run, as it waits for its language), so the game starts exactly as before;
     - a new player: the game script runs at once and draws the title (it needs only the dogs and worlds A, B and C). The file loads right after, and the
       game holds every tap on the title until it is here (restGate in 00_core.js), so no game screen and no save is ever made without it.
   A failed load is tried three times; then the player reads "That didn't load. Tap to try again." (here on the loading paw, in the game on the wait
   card) and a tap starts over. Nothing is lost: no game has started yet. The one-file builds, the artifact and the test harness have no PAW_CHUNKS.r:
   everything is inline there and PAW_REST.ready is true from the start. Runs after loader.js, before the art. */
(function () {
  var C = window.PAW_CHUNKS, src = C && C.r, R = window.PAW_REST = { ready: !src, back: true };
  // the two lines a player may read before the game (and its texts) is there; the wait line is the loading paw's
  var MSG = {
    fail: { en: "That didn't load. Tap to try again.", ja: '読み込めませんでした。タップしてもう一度ためしてね。', 'zh-Hans': '没有加载成功。点一下再试一次。', 'zh-Hant': '沒有載入成功。點一下再試一次。', yue: '載入唔到。㩒一下再試過。', ko: '불러오지 못했어요. 눌러서 다시 시도해 주세요.', es: 'No se pudo cargar. Toca para intentarlo de nuevo.', 'pt-BR': 'Não deu para carregar. Toque para tentar de novo.', fr: "Le chargement n'a pas marché. Touche pour réessayer.", de: 'Das Laden hat nicht geklappt. Tippe, um es noch einmal zu versuchen.', th: 'โหลดไม่สำเร็จ แตะเพื่อลองอีกครั้ง', id: 'Gagal memuat. Ketuk untuk coba lagi.' },
    wait: { en: 'Loading…', ja: 'よみこみ中…', 'zh-Hans': '加载中…', 'zh-Hant': '載入中…', yue: '載入中…', ko: '불러오는 중…', es: 'Cargando…', 'pt-BR': 'Carregando…', fr: 'Chargement…', de: 'Wird geladen…', th: 'กำลังโหลด…', id: 'Memuat…' }
  };
  // msg(kind, lang): lang = the game's language code when the game knows it, else the browser's (picked as the game would)
  R.msg = function (kind, lang) {
    var T = MSG[kind] || MSG.wait, l = lang;
    if (!l) { try { var M = window.PawI18nMsg; l = M.pickLang(navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]); } catch (e) { l = 'en'; } }
    return T[l] || T.en;
  };
  if (!src) { R.load = function () { return Promise.resolve(true); }; R.run = function (fn) { fn(); }; return; }
  var busy = null;
  // one <script> tag -> true when the file ran to its last line (it sets PAW_REST_OK), 'net' on a network error (only that is tried again)
  function once() {
    return new Promise(function (res) {
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = function () { res(window.PAW_REST_OK === true); };
      s.onerror = function () { if (s.parentNode) s.parentNode.removeChild(s); res('net'); };
      (document.head || document.documentElement).appendChild(s);
    });
  }
  // load() -> a promise of true once the file is here; three tries (0.6 s and 2 s apart), then false (a later call starts over)
  R.load = function () {
    if (R.ready) return Promise.resolve(true);
    if (busy) return busy;
    var waits = [600, 2000];
    busy = new Promise(function (res) {
      (function go() {
        once().then(function (ok) {
          if (ok === true) { R.ready = true; busy = null; res(true); } else if (ok === 'net' && waits.length) setTimeout(go, waits.shift()); else { busy = null; res(false); }
        });
      })();
    });
    return busy;
  };
  // a returning player: a save or the cloud bookkeeping in this browser, a hot-reload host, or storage that cannot be read (then the old, safe order)
  var back = false;
  try { back = !!(localStorage.getItem('pawhaven_proto_v1') || localStorage.getItem('pawhaven_cloud_v1')); } catch (e) { back = true; }
  if (window.claude && window.claude.hot) back = true;
  R.back = back;
  function preload() { try { var l = document.createElement('link'); l.rel = 'preload'; l.as = 'script'; l.href = src; (document.head || document.documentElement).appendChild(l); } catch (e) { /* no preload: the tag loads it */ } }
  if (back) preload(); // next to the page itself
  // run(fn): the game script. A new player: at once (the download starts now, while the script runs: the page is all here, the line is free; the game adds
  // the tag once the title is drawn). A returning player: once the file is here (the tag is added now, after the inline art ran)
  R.run = function (fn) {
    if (!back) { preload(); return fn(); }
    (function attempt() {
      R.load().then(function (ok) {
        if (ok) return fn();
        var box = document.getElementById('pawload'), txt = document.getElementById('pawloadTxt');
        if (!box || !txt) return setTimeout(attempt, 5000);
        var old = txt.textContent; txt.textContent = R.msg('fail'); box.style.cursor = 'pointer'; box.setAttribute('role', 'button'); box.tabIndex = 0;
        var again = function (e) { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; box.removeEventListener('click', again); box.removeEventListener('keydown', again); txt.textContent = old; box.style.cursor = ''; box.setAttribute('role', 'status'); box.removeAttribute('tabindex'); attempt(); };
        box.addEventListener('click', again); box.addEventListener('keydown', again);
      });
    })();
  };
})();
