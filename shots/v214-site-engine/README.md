# v2.14 site engine: before/after screenshots (English, reduced motion, 1280x800 and iPhone 15)

before = integration/v2.14 at 884d0a5 (v2.12 site), after = lane/v214-site-engine. The only visible change on the English pages is the language bar (top right, 44 px); with it hidden every page is compared pixel by pixel with before:

- home desktop: before 1280x7751, after 1280x7795 (+44 device px: the language bar, 44 CSS px), after with the bar hidden vs before: pixel-identical
- home phone: before 1179x36294, after 1179x36426 (+132 device px: the language bar, 44 CSS px), after with the bar hidden vs before: pixel-identical
- dogs desktop: before 1280x22499, after 1280x22543 (+44 device px: the language bar, 44 CSS px), after with the bar hidden vs before: pixel-identical
- dogs phone: before 1179x127491, after 1179x127623 (+132 device px: the language bar, 44 CSS px), after with the bar hidden vs before: differs in (0, 103633, 1179, 104141)
- privacy desktop: before 1280x2380, after 1280x2424 (+44 device px: the language bar, 44 CSS px), after with the bar hidden vs before: pixel-identical
- privacy phone: before 1179x9564, after 1179x9696 (+132 device px: the language bar, 44 CSS px), after with the bar hidden vs before: pixel-identical
- reset desktop: before 1280x800, after 1280x800 (+0 px: the page is one screen tall), after with the bar hidden vs before: pixel-identical
- reset phone: before 1179x1977, after 1179x1977 (+0 px: the page is one screen tall), after with the bar hidden vs before: pixel-identical

dogs phone: the full-page capture is 127,000 px tall and Chromium leaves blank tiles at different places in both captures (a capture artefact; the HTML of every English page is byte-identical to v2.12 apart from the head links, the language script and the language bar: node tools/site_i18n.js --legacy).

Also: the open language menu (phone, desktop) and the pseudo-locales /xx/ (en-XA, 40% longer, accents) and /xx-cjk/ (ja-XA, CJK-like, no spaces).
