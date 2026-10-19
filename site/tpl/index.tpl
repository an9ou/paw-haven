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
<div class="deco" id="deco" aria-hidden="true"></div>{{raw header}}
<main class="page">
  <div class="sheet">
    <div class="top">
      <h1 class="h1logo"><img class="logo" src="/doodle-doggo-logo.svg" alt="{{a common.logo_alt}}" width="900" height="280"></h1>
      <p class="tag">🖍️ {{t home.tagline}}</p>
    </div>

    <section class="playroom" aria-label="{{a home.playroom_label}}">
      <div class="scene" id="scene">
        <div class="stage" id="stage">
          <img class="bg" src="/img/art/playroom.webp" alt="{{a home.playroom_alt}}" width="2000" height="1200">
          <div class="wallpic" aria-hidden="true"><img src="/img/art/wall-fuji.webp" alt="" width="600" height="360"></div>
          <div class="dd" data-key="corgi" style="left:22%;top:88%;--s:.67"><img src="/img/art/dogs/corgi-still.svg" alt="" width="240" height="200"></div>
          <div class="dd" data-key="pug" style="left:47%;top:96%;--s:.72"><img src="/img/art/dogs/pug-still.svg" alt="" width="240" height="200"></div>
          <div class="dd" data-key="shiba" style="left:66%;top:84%;--s:.62"><img src="/img/art/dogs/shiba-still.svg" alt="" width="240" height="200"></div>
          <div class="dd flip" data-key="beagle" style="left:82%;top:93%;--s:.69"><img src="/img/art/dogs/beagle-still.svg" alt="" width="240" height="200"></div>
          <div class="dd flip" data-key="golden" style="left:11%;top:80%;--s:.6"><img src="/img/art/dogs/golden-still.svg" alt="" width="240" height="200"></div>
          <div class="dd" data-key="dachs" style="left:33%;top:79%;--s:.58"><img src="/img/art/dogs/dachs-still.svg" alt="" width="240" height="200"></div>
          <img class="ball" src="/img/art/ball.svg" alt="" width="60" height="60" style="left:34%;top:93%">
          <img class="ball b1" src="/img/art/ball.svg" alt="" width="60" height="60" style="left:60%;top:88%">
        </div>
      </div>
      <div class="scenebar">
        <button type="button" class="chip" id="toss" hidden>🎾 {{t home.toss}}</button>
        <p class="small cap">{{t home.playroom_caption}}</p>
      </div>
    </section>

    <div class="getit">
      <a class="play" id="play" href="https://an9ou.itch.io/doodle-doggo">{{t common.play}}</a>
      <p class="free"><span class="hanko" lang="ja" title="{{a home.free_title}}">無料</span><span class="small">{{t home.free_line}}</span></p>
    </div>

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
    <a href="https://an9ou.itch.io/doodle-doggo">{{t footer.itch}}</a>
    <div class="small">{{t footer.credit}} {{t home.footer.thanks}}</div>
  </footer>
</main>
<div class="petals" id="petals" aria-hidden="true"></div>{{raw i18njson}}
<script src="/js/site.js" defer></script>
</body></html>
