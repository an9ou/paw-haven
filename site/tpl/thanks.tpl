<!doctype html>
<html lang="{{lang}}"{{raw htmlattrs}}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FFF8EC"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/icon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="stylesheet" href="/style.css">{{raw fontcss}}
<title>{{t thanks.title}}</title>{{raw alternates}}{{raw langscript}}
</head><body>
<div class="deco" id="deco" aria-hidden="true"></div>
<main class="page">
  <!-- v2.24: where Stripe Checkout sends people back to: ?ok=0 means the payment was cancelled. noindex, no tracking, no calls. -->
  <div class="sheet prose">{{raw header}}
    <img class="rsdog" src="/img/noodle-happy.svg" alt="{{a thanks.dog_alt}}" width="240" height="200">
    <h1 class="center" style="font-size:44px">{{t thanks.h1}}</h1>
    <div id="thOk">
      <p class="center" style="font-size:22px" role="status">{{t thanks.ok}}</p>
      <p class="center" style="font-size:22px" role="status" hidden>{{t thanks.no}}</p>
    </div>
  </div>
  <footer class="foot"><a href="{{u /}}">{{t footer.home}}</a> · <a href="{{u /privacy}}">{{t footer.privacy}}</a></footer>
</main>
<div class="petals" id="petals" aria-hidden="true"></div>
<script src="/js/site.js" defer></script>
<script>try { if (/[?&]ok=0\b/.test(location.search)) { var p = document.querySelectorAll('#thOk p'); p[0].hidden = true; p[1].hidden = false; } if (location.search || location.hash) history.replaceState(null, '', location.pathname); } catch (e) { /* keep going */ }</script>
</body></html>
