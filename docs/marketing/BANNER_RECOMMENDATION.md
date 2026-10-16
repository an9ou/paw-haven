# Should we make a 3-post "crossed" banner?

**Short answer: yes, for the first row only.** Your view was right. I checked it and added four conditions.

## Why yes
- A brand-new profile is judged in about 3 seconds, mostly by the **grid**. One wide picture (Noodle, Mt. Fuji, the Pumpkin Patch) says "this is a charming little world" faster than three separate squares.
- The three tiles are posted at once, so the three posts cost the same effort as three normal posts.
- It is a one-off. We do not repeat it, which keeps it special.

## The four conditions (all done in the files)
1. **Each tile is a complete picture.** The word box is on the middle tile only (the owner's choice). The left tile is the cottage scene, the right tile is the Halloween corner, so they read as pretty scenes on their own, and the caption carries the game name. The grid shows all three together, so the name is always in view on the profile.
2. **Built for the grid crop.** The profile grid shows 4:5 posts as 3:4 crops, so about 34 px is trimmed from each side. The tiles overlap by 68 px (34 px each side), so the three grid slices touch exactly: no missing strip at the seams. No dog stands in an overlap strip, so none is cut off.
3. **Post order matters.** Post the **right** tile first, then the middle, then the left, about 10 minutes apart. The newest post always goes top-left, so the three end up left, middle, right.
4. **Pin all three.** Instagram lets you pin up to 3 posts, and the most recently pinned goes top-left (pin right, middle, left). Without pins, **the very next post you make shifts the whole row by one and the picture tears apart.** With pins, it stays in row 1 and new posts start below.

## The costs, honestly
- It uses all 3 pin slots. You cannot pin a "best post" until you unpin a banner tile. That is fine: unpin it when it has done its job.
- **It is nearly evergreen now.** The tiles carry only the game name and one short line, with no date. The only seasonal parts are the pumpkin cart and the witch hat on the corgi, so after 2 Nov it still reads fine. If you want a fully evergreen right tile (no cart), it is a 5-minute change in `make_banner.js`.
- Instagram changes how the grid works from time to time (the 3:4 grid is new, and sources disagree on the dates). If your phone shows something different, tell me and I will re-cut the tiles.
- On a very small phone the small line under the game name is tiny. The game name itself is still readable.

## What is in the banner now (version 3, after the owner's feedback)
- **One word box**, middle tile only: the Doodle Doggo wordmark and "a cozy dog game · play free".
- **9 bigger dogs**, one meadow, nobody overlaps. Three wear two items (Noodle: heart sunglasses and red bandana; Scout: acorn cap and bow tie; Biscuit: witch hat and candy corn bandana), four wear one (Mochi: happi coat; Sunny: flower crown; Frost: autumn scarf; Dumpling: party hat) and two wear nothing (Cloud and Bagel).
- **A fuller background:** the game's cottage (blue heart door, curtains, flower box), autumn trees, a fence, a mailbox, a clothesline with laundry, string lights, red paper lanterns, a stone lantern, the torii, Mt. Fuji, a scarecrow, a ghost garland, the Pumpkin Patch cart, leaf piles and pumpkins.
- The trade: bigger dogs means fewer of them. The full 14 dog types are in the "14 dog types" post.
- The only seasonal parts are the pumpkin cart, ghost garland, scarecrow and the witch hat, so it still works after 2 Nov. Ask for an evergreen right tile if you want one.

## The files
- **A, the banner:** `banner-1-left-newest.jpg`, `banner-2-middle.jpg`, `banner-3-right-post-first.jpg`
- **B, the informative series:** `info1-japan-view.jpg`, `info2-meet-the-dogs.jpg`, `info3-what-you-can-do.jpg`, `info4-how-to-play.jpg`
- Side by side with the bio and highlights: `grid-preview.jpg`
