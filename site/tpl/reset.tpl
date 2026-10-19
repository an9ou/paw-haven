<!doctype html>
<html lang="{{lang}}"{{raw htmlattrs}}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FFF8EC"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/icon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="stylesheet" href="/style.css">{{raw fontcss}}
<title>{{t reset.title}}</title>{{raw alternates}}{{raw langscript}}
</head><body>
<div class="deco" id="deco" aria-hidden="true"></div>{{raw header}}
<main class="page">
  <!-- v2.9.2: password resets happen inside the game with an emailed 6-digit code. This page is only a notice now
       (old emailed links still land here). -->
  <div class="sheet prose">
    <img class="rsdog" src="/img/noodle-sit.svg" alt="{{a reset.dog_alt}}" width="240" height="200">
    <h1 class="center" style="font-size:44px">{{t reset.h1}}</h1>
    <div id="rsMoved">
      <p class="center" style="font-size:22px" role="status">{{t reset.text}}</p>
      <p class="cta"><a class="play" href="https://an9ou.itch.io/doodle-doggo">{{t footer.play_itch}}</a></p>
    </div>
  </div>
  <footer class="foot"><a href="{{u /}}">{{t footer.home}}</a> · <a href="{{u /privacy}}">{{t footer.privacy}}</a></footer>
</main>
<div class="petals" id="petals" aria-hidden="true"></div>
<script src="/js/site.js" defer></script>
<script>try { if (location.search || location.hash) history.replaceState(null, '', location.pathname); } catch (e) { /* keep going */ }</script>
</body></html>
