<!doctype html>
<html lang="{{lang}}"{{raw htmlattrs}}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FFF8EC"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/icon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="manifest" href="/site.webmanifest"><link rel="stylesheet" href="/style.css">{{raw fontcss}}
<title>{{t dogs.title}}</title>
<meta name="description" content="{{a dogs.description}}">
<link rel="canonical" href="{{raw canonical}}">{{raw alternates}}
<meta property="og:type" content="website"><meta property="og:site_name" content="Doodle Doggo"><meta property="og:url" content="{{raw canonical}}">{{raw oglocale}}
<meta property="og:title" content="{{a dogs.og_title}}"><meta property="og:description" content="{{a dogs.og_description}}">
<meta property="og:image" content="https://doodledoggo.app/logo-1200x630.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">{{raw langscript}}
</head><body>
<main class="page">{{raw langmenu}}
  <div class="sheet">
    <header class="top small-top">
      <a class="homelink" href="{{u /}}"><img class="logo sm" src="/doodle-doggo-logo.svg" alt="{{a dogs.home_alt}}" width="900" height="280"></a>
      <h1>{{t dogs.h1}} <span class="jpw">{{t dogs.h1_gloss}}</span></h1>
      <p>{{t dogs.lead}}</p>
      <ul class="dognav">
<!-- dogs:nav -->
{{raw dognav}}
<!-- /dogs:nav -->
      </ul>
    </header>

<!-- dogs:profiles -->
{{raw profiles}}
<!-- /dogs:profiles -->

    <div class="cta">
      <a class="play" id="play" href="https://an9ou.itch.io/doodle-doggo">{{t common.play}}</a>
      <p class="small">{{t dogs.cta_line}} <a class="back" href="{{u /}}">{{t dogs.back}}</a></p>
    </div>
  </div>
  <footer class="foot">
    <a href="https://www.instagram.com/doodledoggo.app/" id="insta" rel="noopener">{{t footer.instagram}}</a> · <a href="mailto:contact@doodledoggo.app" id="contact" class="contact">{{t footer.contact}}</a> · <a href="{{u /privacy}}">{{t footer.privacy}}</a> ·
    <a href="{{u /}}">{{t footer.home}}</a> ·
    <a href="https://an9ou.itch.io/doodle-doggo">{{t footer.itch}}</a>
    <div class="small">{{t footer.credit}}</div>
  </footer>
</main>
<div class="petals" id="petals" aria-hidden="true"></div>
<script src="/js/site.js" defer></script>
</body></html>
