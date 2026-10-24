<!doctype html>
<html lang="{{lang}}"{{raw htmlattrs}}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#FFF8EC"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/icon-32.png" sizes="32x32"><link rel="apple-touch-icon" href="/icon-180.png"><link rel="manifest" href="/site.webmanifest"><link rel="stylesheet" href="/style.css">{{raw fontcss}}
<title>{{t home.title}}</title>
<meta name="description" content="{{a home.description}}">
<link rel="canonical" href="{{raw canonical}}">{{raw alternates}}
<meta property="og:type" content="website"><meta property="og:site_name" content="Doodle Doggo"><meta property="og:url" content="{{raw canonical}}">{{raw oglocale}}
<meta property="og:title" content="{{a home.og_title}}"><meta property="og:description" content="{{a home.og_description}}">
<meta property="og:image" content="https://doodledoggo.app/logo-1200x630.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">{{raw langscript}}
</head><body>
<div class="deco" id="deco" aria-hidden="true"></div>
<main class="page">
  <div class="sheet">{{raw header}}

    <section class="gamebox" id="game" aria-label="{{a home.game_label}}">
      <div class="gameframe" id="gameframe" data-src="/play/" data-title="{{a home.game_label}}">
        <button class="fsx" id="fsx" type="button" aria-label="{{a home.fullscreen_exit}}">✕</button>
        <noscript><p class="nojs">{{t home.nojs}} <a href="https://an9ou.itch.io/doodle-doggo">{{t footer.play_itch}}</a></p></noscript>
      </div>
      <div class="gamebar">
        <button class="fsbtn" id="fsbtn" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>{{t home.fullscreen}}</button>
        <span class="small">{{t home.game_saves}}</span>
      </div>
    </section>

    <p class="intro">{{t home.intro}}</p>

    <section id="aboutteaser" class="sec teaser abt">
      <img class="abdog" src="/img/art/dogs/dachs-still.svg" alt="{{a about.dog_alt}}" width="240" height="200" loading="lazy">
      <div>
        <h2>{{t home.about.title}}</h2>
        <p>{{t home.about.text}}</p>
        <p><a class="chip" href="{{u /about}}">{{t home.about.link}} <span aria-hidden="true">→</span></a></p>
      </div>
    </section>

    <div class="cta">
      <p class="small">{{t home.save_line}}</p>
    </div>
  </div>
  <footer class="foot">
    <a href="https://www.instagram.com/doodledoggo.app/" id="insta" rel="noopener">{{t footer.instagram}}</a> · <a href="mailto:contact@doodledoggo.app" id="contact" class="contact">{{t footer.contact}}</a> · <a href="{{u /privacy}}">{{t footer.privacy}}</a> ·
    <a href="{{u /dogs}}">{{t footer.dogs}}</a> · <a href="{{u /map}}">{{t footer.map}}</a> · <a href="{{u /about}}">{{t footer.about}}</a> ·
    <a href="https://an9ou.itch.io/doodle-doggo">{{t footer.itch}}</a> · <a href="https://ko-fi.com/doodledoggoapp" id="kofilink" rel="noopener">{{t footer.kofi}}</a>
    <div class="small">{{t footer.credit}} {{t home.footer.thanks}}</div>
  </footer>
</main>
<div class="petals" id="petals" aria-hidden="true"></div>{{raw i18njson}}
<script src="/js/site.js" defer></script>
</body></html>
