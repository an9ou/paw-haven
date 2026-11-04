# v2.20 Missions v2: phone and layout review (paw-reviewer, 4 Nov 2026, tip a0ba0f3e)

360x740, 390x844 (touch, DSF 1), 1280x720; en, de, ja, pseudo xx (+40%) and xx-cjk. Screenshots: scratchpad review_phone/shots/ (not in the repo). phone_v24_shop, phone_v24_guide, phone_home pass. No console errors.

**No must-fix.** Every sheet, tab and popup: text 14 px or more, taps 44 px or more, no sideways scroll, nothing under the phone bar, the sheet scrolls inside itself, close is focused on open, focus follows the tab, a tab switch starts at the top; day 7 / day 14 / Crayon Medal popups fit at 360; the soft dot shows on the "..." menu (phone) and #msBtn (desktop).

## Nice-to-have (most important first)
1. Today 360/390: the clipboard card is about 346x426 for one line; at 360 the first help's Swap is cut and the second help hidden; pouch and stamp card two screens down. Smaller card is better: cap `.ms-left .ms-cardwrap` near 240 px on phones, loosen phone_v24_shop line 105 to about 220 px.
   Status: fixed in 889298fa (the card about 240 px on phones, phone_v24_shop checks 220 px or more inside the sheet).
2. Week, all sizes: note art squeezed into a 44 px box (blank white strip); the board header banner is empty with the title beside it. Use `note(i)` as the note background (stretch is fine) and put the h3 on the banner (`boardText`).
   Status: fixed in 889298fa (same as art 4 and 5).
3. Notebook, all sizes: `page()` (a repeat-y 320x240 tile) is drawn once with "meet": spiral/lines miss the header, rows off the ruled lines. Draw as a repeat-y CSS background at 100% width, step pitch a multiple of the 24-unit lines.
   Status: fixed in 889298fa (same as art 3).
4. Growing up 360/390: the 56 px chart's date labels are about 5 px tall. Pass label '' on phones (dates are in the list) or widen.
   Status: fixed in 889298fa (same as art 6).
5. Tabs at 360 xx: "Notebook" breaks mid-word (`overflow-wrap:anywhere`), tabs grow to 71 px. Break at words only (hyphens:auto); add the sheet to `i18n_fit`.
   Status: fixed in 889298fa (hyphens auto, no overflow-wrap anywhere, a long word widens its tab; i18n_fit measures every Missions tab).
6. Badges on phone: 17 rows of about 108 px = about 2,250 px of scroll, tabs scroll away. Sticky `.ms-tabs`, tighter rows (hide `.msb-d` on phones); the count wraps under the shelf at 390 leaving a gap.
   Status: fixed in 889298fa (sticky tabs, the short line hidden on phones, smaller rosettes, the count and medal line beside the shelf).
7. Desktop Today: in the 250 px left column the help's Swap wraps; the second help and `.msw-sum` sit below the fold. Widen to about 290 px or move the helps up.
   Status: fixed in 889298fa (desktop: the helps at the top of the right column, the board summary under the card).
8. Toasts on phone sit under the tab row (existing) and cover help rows after a scroll (taps pass through). A badge burst gives 3 title toasts + the batch toast + a sticker toast at once.
   Status: fixed in 889298fa (a badge burst is one toast; the existing toast position under the tabs is unchanged).
9. All gold/crayon: the open list is empty and the fold closed, so the tab looks empty. Open the fold when nothing is left open.
   Status: fixed in 889298fa (the fold opens when no track is left open).
10. Phone: "Swap the mission" sits under the coin line, a screen from the mission. Put it right under the card.
   Status: fixed in 889298fa (the mission Swap sits right under the card).

Not checked: the house Trophy Shelf on screen (off the right edge of the phone view; not granted yet).
