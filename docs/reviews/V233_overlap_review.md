# Overlap and size review: v2.33 "Helping paws" on `main` (2ec92581), 24 Nov 2026

Read-only review of things that move or are drawn (the text-fit audit `i18n_fit` covers clipped text, 44 px taps and side scroll).
Built in a private worktree with `node game/build.js`; Playwright (Chromium) drove the built game at 360x640, 390x844 (Pixel 7 touch
profile), 768x1024 (iPad portrait, phone layout) and 1280x720, deviceScaleFactor 2. English throughout; the worst cases were repeated in
de, th and ja. Roaming was on (`prefs.rmTest`) unless a row says otherwise. Friends ran on the mock `game/fr_mock.js` with `{ hp: true }`
and `prefs.hpTest`.

Screenshots: `/tmp/claude-0/-home-user-paw-haven/4e05f5fe-6db0-52dd-9c90-683900c16586/scratchpad/ovl_review/shots/` (named below).
The scripts are in the folder above (`roam.js`, `visit.js`, `visit2.js`, `sleep.js`, `tagm.js`, `sheets.js`, `town.js`, `care.js`,
`bubble.js`, `follow.js`, `art.js`). Raw samples are in its `*_results.jsonl` files.

What was sampled:
- Home yard: packs of 1 (Shiba puppy), 3 (Shiba, Dachshund, Great Dane) and 5 (Great Dane leading, Chihuahua puppy, Samoyed, Mastiff, Shiba),
  with 0 and 20 decorations, at all four sizes. That is 24 runs of 60 s, sampled every 2 s (30 samples each), plus 3 runs with a yard
  visitor. The 20 decorations were placed one at a time with the game's own `hoFreeSpot`, as buying and placing them does.
- Friend visit: 1, 3 and 5 friend dogs with 0 and 20 decorations at all four sizes (24 runs, 16 s each), then a bowl, water and wish help.
- Sleepovers: 1 and 2 guests at all four sizes with a pack of 3 (30 s each), Great Dane leader runs at 390 and 1280, the guest card,
  the diary page and both share sizes, and tag measurements in en, de, th and ja.
- Also: the walk, the town map, the Winter Market, Fun Fair and minigame screens, indoors, care, sheets and grids, and the v2.33 art
  (details in "Clean").

## Must-fix (2)

**M1. A sleepover guest's tag shows cut at the screen edge, or under the camera arrow, while its guest is off screen.**
- At 390x844 in ja with two guests, the second guest stands off screen to the right. Its tag still pokes in from the edge: the friend
  ribbon and a single "が", with no dog in sight (`tagm_s390_g2_ja_shiba_0.png`; tag box x 286..615, guest x 412..484, screen width 390).
- At 768x1024 the camera follows the roaming leader, so the guest and its tag slide under the right edge: "Bella, / Plucky L…"
  (`sleep_s768_g2_en_shiba_f11.png`; 2 of 15 samples).
- At 768x1024 with one guest, the camera arrow `#phPeek` sits on the tag text "Mochi, from" in 15 of 15 samples
  (`sleep_s768_g1_en_shiba_0.png`).
- The `hard` rule keeps chips and buttons off a guest's own box, but not off its tag after the camera moves. The look-chip test also
  only checks the dog's box, not the tag.
- Owner: `game/src/60b_sleep.js`: `slSpot` / `slCropFit` (a tag may be partly in view while its dog is not) and `slLookSync`.
- Fix: draw the tag only when its guest is in view. Keep the tag box clear of `#phPeek`, `.rm-look` and the screen edges in every crop
  the camera can take, not only the home crop. Or hide tags whose guest is off screen.

**M2. On a friend visit at 390x844 my own dog starts off screen.**
- Every sample in every run shows my leader at screen x −156..−9 px. The camera stays on its home crop (x 410, width 359 world units),
  so only the friend's leader and the camera arrow show.
- Seen with 1 and 3 friend dogs, in en and de, and with roaming on and off. 12 of 12 samples in each run
  (`still_visit_s390_f1_d0_en_t2.png`, `visit_s390_f1_d0_en_0.png`, `visit_s390_f3_d0_en_0.png`).
- At 360 and 1280 the greeting pair is in view. At 390 my dog only appears when it walks in for a wish (`visit_s390_f1_d0_en_wish.png`,
  still cut by the left edge).
- V233.md 3.1 assumes the 390 crop shows the greeting pair.
- Owner: `game/src/50_friends.js` (`frLayout`, the visit camera home), and `game/src/60_helps.js` `hpBowlSpot` (it plans the bowl against
  that crop).
- Fix: centre the 390 home crop on the greeting pair, or place my leader inside the crop the camera starts on.

## Should-fix (11)

**S1. Sleepover guest tags are drawn about twice the size of the game's text and float above the dog.**
- Measured tag font: 30.9 px on screen at 360, 390 and 768 in all four languages. The place buttons are 16 px.
- At 1280 the tag font is 23.4 px; the buttons are 17 px.
- A 252x75 px tag sits beside a 47x53 px Chihuahua guest (`sleep_s390_g2_en_shiba_0.png`).
- When the tag is drawn over the head, it floats 40–50 px above it, in the sky (`sleep_s1280_g2_en_shiba_0.png`, `sleep_s768_g1_en_shiba_0.png`).
- Cause: `slTagFs()` takes `dcTagFs(1)`. That value is in dog units (13.6 px divided by the depth scale), but the tag is drawn in world
  units in `#hpTags`, outside the dog's scale.
- Owner: `game/src/60b_sleep.js`, `slTagFs` / `slTagSVG`.
- Fix: size the tag for world units, aiming at about 15–16 px on screen. Put the "up" tag right on the head line.

**S2. A pack dog parks in front of the mailbox and hides it.**
- The Samoyed covers 85% of the mailbox at 390, leaving only the red badge (`s390_p5_d20_en_0_dog-over-scene_1.png`).
- How often, out of 30 samples:

  | Size, pack, decorations | Samples with the mailbox covered |
  |---|---|
  | 360, 5 dogs, 20 decorations | 27 |
  | 1280, 5 dogs, 20 decorations | 23 |
  | 390, 5 dogs, 20 decorations | 20 |
  | 768, 5 dogs, 20 decorations | 16 |
  | 390 / 1280, 5 dogs, no decorations | 9 |
  | 360 / 390, 3 dogs | 7–11 (the Dachshund lies or sleeps there) |

- Dogs stand, sit, lie and sleep there, not just walk past.
- Owner: `game/src/37_roam.js`, `rmScan` / `rmOk`. `#mailboxG` keeps only the feet off it, not the drawn body in front of it.
- Fix: keep the drawn body off the mailbox, or mark the mailbox as a hard spot for resting poses.

**S3. With 20 decorations out, several decorations stand behind others and cannot be seen. This is the same at every size.**
- Examples (`s1280_p5_d20_en_0_scene-on-scene_0.png`, `s390_p5_d20_en_0_dog-on-dog_2.png`):
  - the Tug Post is 94% behind the Giant Crayon Box;
  - the Bubble Fountain is behind the Felt Fir Tree;
  - the Doggy Ramp is behind the Flower Barrel;
  - the Rocking Chair is behind the Puddle Pool and the Play Tunnel;
  - the Hammock is behind the dog house.
- `hoFreeSpot` returns the least-bad spot when nothing is free, and its scan stays inside `HO_PH_SEEN`.
- Gifts put out with `out: true` and no `at` land on their catalogue spots. With a catalogue placement, the Present Pile sits 99% on the
  Sandbox (`s360_p1_d20_en_0_scene-on-scene.png`). Those gift paths are `07_treasure_journal.js:241`, `13c_litter.js:30`,
  `14b_vet_playboard.js:251`, `27_halloween.js:156` and `53_welcome.js:92`.
- Owner: `game/src/28_home.js` `hoFreeSpot`, plus the five gift paths above.
- Fix: when no free spot exists, leave the item in the house ("no room in the yard") rather than stacking it. Give the gift paths a free
  spot too, as `49_market.js:268` does.

**S4. A yard visitor stands on top of decorations.**
- Pom-Pom and its name chip are drawn over the Felt Fir Tree and the Bubble Fountain at the fixed `YV_SPOT`
  (`s390_p3_d20_en_vis_0_scene-on-scene_4.png`; 1 of 1 visitor runs with 20 decorations).
- Owner: `game/src/54_visitors.js` `yvDraw`, and `28_home.js` `hoKeepBoxes`, which does not reserve `YV_SPOT`.

**S5. The toast after a help covers the Help out strip on phones.**
- At 360, 390 and 768, "Mochi helped out! +1 Bond" and "Mochi made friends. +1 Bond." sit on the three help buttons. They hide the new
  done ticks for the toast's whole life.
- Seen after every bowl, water and wish help in every phone run (`visit_s360_f5_d20_en_bowl.png`, `visit_s360_f5_d20_en_water.png`,
  `visit_s390_f1_d0_en_wish.png`).
- Taps still pass through (`pointer-events: none`), so it is not a must-fix.
- Owner: `game/src/60_helps.js` (the toast call), and `game/css/20_phone_shell.css` (`#toasts` on the visit).
- Fix: on a visit, show the toast below the strip or at the bottom.

**S6. A dog's speech bubble covers the wish bubble on a visit.**
- After a pet wish, the line "Bella leans on you…" is drawn over `#hpWish` ("Wish come true!"), so text sits on text
  (`visit_s390_f1_d0_en_wish.png`).
- At home, the speech bubble also covered the status chip and the wish chip once at 1280 (1 of 30 samples). Three 120 s hunts at 1280,
  390 and 360 de found no further case.
- Owner: `game/src/00_core.js` `sayPlace`. Its `hard` list has `#status`, `#phPeek` and the place buttons, on phones only. It has
  neither `#hpWish` nor `#ddWish`.

**S7. On desktop my leader covers the watering can.**
- At 1280 the Shiba's tail is drawn over the can on the veggie patch. Samples with the can covered, out of 10:
  - 1 friend dog: 6
  - 3 friend dogs: 9
  - 1 friend dog with 20 decorations: 8
- Screenshots: `visit_s1280_f3_d0_en_0.png`, `visit_s1280_f1_d20_en_0.png`.
- The 96-unit keep rect beside the can keeps the feet clear, not the drawn body.
- Owner: `game/src/60_helps.js` (`HP_CAN` keep), `game/src/50_friends.js` (my leader's spot).

**S8. With a pack of 3 at 360 and 390, both sleepover guests land outside the home view.**
- Only the look chip shows them, and the arrival meeting (bows, hearts, bark) plays off screen.
- Seen in 8 of 8 phone runs (`sleep_s360_g1_en_shiba_meet.png`, `tagm_s360_g2_de_shiba_0.png`).
- The suite's phone check uses a pack of 1, so it does not catch this.
- Owner: `game/src/60b_sleep.js` (`slSpot`, `SL_PH_ORDER`).

**S9. The friend ribbon art reads as a dark brown blob.**
- It is drawn at 40 px beside every guest tag. At 128 px it is still a blob: the thick outline swallows the rosette and its colours
  (`art_v233.png`, the "ribbon" tile; also in every guest-tag screenshot).
- Owner: `world/pawart_world_b.js` `PA.FRIENDS.ribbon`.

**S10. The new moon art has about twice the line weight of the other v2.33 art, and it touches the edges of its box.**
- The moon's stroke is 2.2 in a 48-unit box, which is 2.9 at 64 px. The scoop and the h5, h25, h100 and thx stickers are 1.4.
- The nightcap pom-pom and the crescent's tip touch the edge of the viewBox and are cut there (`art_v233.png`).
- The "first sleepover" sticker inherits the heavy line.
- Owner: `world/pawart_world_b.js` `PA.FRIENDS.moon`, `stk('sl1')`.

**S11. Pack dogs pile on each other at rest.**
- This is TODO 219, accepted; it is listed here because it still happens often and looks bad.
- Samples with two resting dogs overlapping, out of 30:
  - 390, 3 dogs, 20 decorations: 14
  - 768, 3 dogs, 20 decorations: 6
  - 360, 3 dogs, 20 decorations (rerun): 10
- Worst case: a Dachshund sitting on a rolled-over Great Dane's belly, with the Shiba's tail on the Dane's head
  (`s360_p3_d20_en_0_dog-on-dog.png`). Another: a Great Dane leader standing with its front feet in the Bird Bath
  (`s390_p5_d20_en_0_dog-on-dog_2.png`).
- Owner: `game/src/37_roam.js`.

## Nice (6)

- **N1.** A toast covers the walk HUD's fast-forward and pause buttons at 360 while it shows (`town_s360_en_walk_running_2.png`).
  Taps pass through. Owner: `game/css/20_phone_shell.css`.
- **N2.** What's new (v2.33): the bowl row icon is flat and about half the height of the moon and envelope icons (`fol_s390_en_news233.png`).
  Owner: `game/src/49c_news.js`, the v2.33 entry's icon.
- **N3.** Town map at 1280, default pan: the zoom control's "100%" covers the "Training Ground" label, and the hover tip "Town Square: go
  hang out" covers the Winter Market's "Festival!" ribbon (`town_s1280_en_town_map_market.png`). Owner: `game/src/08_map.js`.
- **N4.** At 390 with 20 decorations, the visit bowl stands on the Doggy Ramp in 11 of 11 samples (`visit_s390_f3_d20_en_0.png`). Owner:
  `game/src/60_helps.js` `hpBowlSpot`. Tier 1 should keep it off flat decorations.
- **N5.** Bath at 360: the Great Dane pack dog sits pressed against the tub with its nose in the suds (`care_s360_en_bath.png`). Owner:
  `game/src/29_pack_care.js`.
- **N6.** On the bar, the More button's "new!" tape sits on its three dots (`sheet_s360_en_more_tray.png`). Owner: `game/src/47_firstweek.js`.

## Accepted TODO items: still happening?

| TODO | Still happens? | How bad |
|---|---|---|
| 217: a pack dog passes in front of a Great Dane guest at 1280 | Yes, 1 of 15 samples (`sleep_s1280_g2_en_shiba` run) | Brief |
| 218: the watered patch partly under the visit buttons at 390 | Yes, at 360 too. The patch is mostly under "Leave a paw print" and the drops land on its top edge (`visit_s360_f5_d20_en_water.png`) | Mild |
| 219: pack dogs overlap in crowded yards | Yes | Bad: see S11 |
| 142 / 188: pack dogs outside the narrow phone crop | Yes, the look chips show often | As designed |
| 102: the Bird Bath in front of the house door | Not seen in the free-spot runs | — |

Not checked: TODO 101, the first pack spot in front of the bowl with the Feed tray open.

## Clean (checked, nothing found)

- **Yard:**
  - The leader was never cut by the screen edge (0 samples in 27 runs).
  - No dog was ever under a place button, the place chip, the wish chip, the phone bar or the HUD. Only speech bubbles covered a dog
    (briefly), and the `rm-look` chip once.
  - No dog stood on the wish chip.
- **Indoors:** the house with a pack of 3 (beds, sofa, rug) at 390 and 1280.
- **Care:** the Feed, Care and Play trays and the ball play: nothing over the buttons. On desktop the centred food card covers the leader
  as designed.
- **Visit:**
  - The strip is always under the chip.
  - The bowl's tap box was never under the chip, the strip, the buttons or the bar (0 samples).
  - The wish bubble was never cut and never on the strip.
  - The four buttons are in order, with Go home last and above the bar.
  - The guest card fits.
- **Sleepover pictures:**
  - The diary picture at 390.
  - The 1080x1350 and 1080x1920 share files: both dogs whole, the house whole, nothing cut by the frame, the caption inside
    (`sleep_s390_g2_en_dane_share_*.png`, `sleep_s390_g2_en_dane_diary.png`).
- **Walk:** the route picker, the how-to, the run and the results with the first-walk treasure, at all four sizes.
- **Town:**
  - The town map at 360, 390 and 768, including the forced Winter Market pin and the Fun Fair sign.
  - The Winter Market scene and three stall sheets.
  - The Square, the Fun Fair sheet and game cards, and the catch minigame start and play.
- **Sheets:** in the More tray, Settings, Journal (10 tabs), Calendar, Missions (3 tabs), Kind shop (4 tabs), What's new, Wardrobe
  (7 tabs) and Kibble Corner (4 tabs):
  - tiles are equal;
  - icons are inside their tiles;
  - the close button is never over a title;
  - no sheet goes under the phone bar.
- **Art:**
  - The scoop and the h5, h25, h100, host and thx stickers share one line weight.
  - Every colour fill in the v2.33 art is inside its outline.
  - Shop and wardrobe item icons read at one scale. Measured outliers (the Bone-shaped Biscuit is wide, the Little Sneakers and the
    Lucky Cat Charm are small) looked right in the screenshots.

## Gaps

- The Helping paws page inside the sticker book was not opened in-game: the follow-up page lacked the Friends load that adds the page.
  The six stickers were judged from `PA.FRIENDS.stk(k)` rendered at 128 px.
- The Wardrobe try-on was seen through its tabs, not through every outfit.
- The care sizes 390 and 768 were not run.
