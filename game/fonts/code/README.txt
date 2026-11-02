DD Code: the friend-code face (v2.19, owner 2 Nov 2026: "I am not sure if it is S or 5").
A subset of Atkinson Hyperlegible Bold (Braille Institute, SIL Open Font License 1.1, AtkinsonHyperlegible-OFL.txt), made to tell look-alike
letters apart: S/5, Z/2, B/8, O/0, I/1. Source: google/fonts ofl/atkinsonhyperlegible/AtkinsonHyperlegible-Bold.ttf
(sha256 5a3b0c8cc8ca545155150b4512a1fa248298df121c50d6557e651e61fbdab92f), fontTools 4.67:
  pyftsubset AtkinsonHyperlegible-Bold.ttf --text="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- " --layout-features=tnum --flavor=woff2 \
    --name-IDs='*' --no-hinting --output-file=dd-code.woff2
Its base64 is inlined as FR_CODE_FONT_CSS in game/src/50_friends.js (page, card and poster) and in site/style.css (the invite page).
