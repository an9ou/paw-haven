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
      <div class="itchbox" id="itchbox"><iframe id="itch" src="https://itch.io/embed/5163381?bg_color=fffbf3&fg_color=5b3d32&link_color=c93a2a&border_color=5b3d32" width="552" height="167" frameborder="0" title="{{a home.widget.title}}" loading="lazy"><a href="https://an9ou.itch.io/doodle-doggo">{{t home.widget.fallback}}</a></iframe></div>
      <p class="itchalt"><a id="itchlink" href="https://an9ou.itch.io/doodle-doggo">{{t home.widget.fallback}} <span aria-hidden="true">→</span></a></p>
      <p class="free"><span class="hanko" lang="ja" title="{{a home.free_title}}">無料</span><span class="small">{{t home.free_line}}</span></p>
    </div>

    <p class="intro">{{t home.intro}}</p>

    <section id="dogs" class="sec">
      <h2>{{t home.dogs.title}} <span class="jpw">{{t home.dogs.gloss}}</span></h2>
      <p>{{t home.dogs.lead}}</p>
      <ul class="cards featured">
<!-- dogs:cards -->
{{raw cards}}
<!-- /dogs:cards -->
      </ul>
      <p class="center some">{{t home.dogs.some}}</p>
      <p class="center"><a class="chip" href="{{u /dogs}}">{{t home.dogs.all}} <span aria-hidden="true">→</span></a></p>
    </section>

    <section class="sec">
      <h2>{{t home.do.title}}</h2>
      <ul class="feats">
        <li><b>{{t home.feat.walks.title}}</b>{{t home.feat.walks.text}}</li>
        <li><b>{{t home.feat.cuddles.title}}</b>{{t home.feat.cuddles.text}}</li>
        <li><b>{{t home.feat.garden.title}}</b>{{t home.feat.garden.text}}</li>
        <li><b>{{t home.feat.playdates.title}}</b>{{t home.feat.playdates.text}}</li>
        <li><b>{{t home.feat.winter.title}}</b>{{t home.feat.winter.text}}</li>
        <li><b>{{t home.feat.fuji.title}}</b>{{t home.feat.fuji.text}}</li>
      </ul>
    </section>

    <section id="japan" class="sec washi">
      <h2>{{t home.japan.title}} <span class="hanko" lang="ja" aria-hidden="true">犬</span></h2>
      <p>{{t home.japan.lead}}</p>
      <figure class="fuji"><img id="fujiImg" src="/img/art/fuji-autumn.webp" alt="{{a home.japan.fuji_alt}}" width="1280" height="768" loading="lazy"><figcaption>{{t home.japan.caption}}</figcaption></figure>
      <ul class="notes">
        <li><h3>{{t home.note.hachiko.title}}</h3><p>{{t home.note.hachiko.text}}</p></li>
        <li><h3>{{t home.note.shiba.title}}</h3><p>{{t home.note.shiba.text}}</p></li>
        <li><h3>{{t home.note.cafe.title}}</h3><p>{{t home.note.cafe.text}}</p></li>
        <li><h3>{{t home.note.stroller.title}}</h3><p>{{t home.note.stroller.text}}</p></li>
        <li><h3>{{t home.note.lead.title}}</h3><p>{{t home.note.lead.text}}</p></li>
        <li class="shrine"><img src="/img/art/torii.webp" alt="{{a home.note.shrine.alt}}" width="720" height="600" loading="lazy"><h3>{{t home.note.shrine.title}}</h3><p>{{t home.note.shrine.text}}</p></li>
      </ul>
      <div class="words">
        <h3>{{t home.words.title}}</h3>
        <dl>
          <div><dt lang="ja">犬</dt><dd><i>inu</i>: {{t home.words.inu}}</dd></div>
          <div><dt lang="ja">子犬</dt><dd><i>koinu</i>: {{t home.words.koinu}}</dd></div>
          <div><dt lang="ja">ワンワン</dt><dd><i>wan wan</i>: {{t home.words.wanwan}}</dd></div>
          <div><dt lang="ja">かわいい</dt><dd><i>kawaii</i>: {{t home.words.kawaii}}</dd></div>
          <div><dt lang="ja">お散歩</dt><dd><i>osanpo</i>: {{t home.words.osanpo}}</dd></div>
          <div><dt lang="ja">おすわり</dt><dd><i>osuwari</i>: {{t home.words.osuwari}}</dd></div>
          <div><dt lang="ja">お手</dt><dd><i>ote</i>: {{t home.words.ote}}</dd></div>
          <div><dt lang="ja">いい子</dt><dd><i>ii ko</i>: {{t home.words.iiko}}</dd></div>
        </dl>
      </div>
      <div class="trip">
        <span class="hanko" lang="ja" aria-hidden="true">東京</span>
        <h3>{{t home.trip.title}}</h3>
        <p>{{t home.trip.text}}</p>
      </div>
    </section>

    <section id="mapteaser" class="sec teaser">
      <h2>{{t home.map.title}} <span class="jpw">{{t map.h1_gloss}}</span></h2>
      <p>{{t home.map.text}}</p>
      <ul class="tpics">
{{raw teaserpics}}
      </ul>
      <p class="center"><a class="chip" href="{{u /map}}">{{t home.map.link}} <span aria-hidden="true">→</span></a></p>
    </section>

    <section id="aboutteaser" class="sec teaser abt">
      <img class="abdog" src="/img/art/dogs/dachs-still.svg" alt="{{a about.dog_alt}}" width="240" height="200" loading="lazy">
      <div>
        <h2>{{t home.about.title}}</h2>
        <p>{{t home.about.text}}</p>
        <p><a class="chip" href="{{u /about}}">{{t home.about.link}} <span aria-hidden="true">→</span></a></p>
      </div>
    </section>

    <div class="cta">
      <a class="play" href="https://an9ou.itch.io/doodle-doggo">{{t common.play}}</a>
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
