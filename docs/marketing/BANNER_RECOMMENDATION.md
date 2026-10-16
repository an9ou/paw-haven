# Should we make a 3-post "crossed" banner?

**Short answer: yes, for the first row only.** Your view was right. I checked it and added four conditions.

## Why yes
- A brand-new profile is judged in about 3 seconds, mostly by the **grid**. One wide picture (Noodle, Mt. Fuji, the Pumpkin Patch) says "this is a charming little world" faster than three separate squares.
- The three tiles are posted at once, so the three posts cost the same effort as three normal posts.
- It is a one-off. We do not repeat it, which keeps it special.

## The four conditions (all done in the files)
1. **Each tile reads well alone.** Every tile has its own card, headline and a subject (Noodle / Mt. Fuji / the corgi and the cart). In the feed nobody sees a "broken" picture.
2. **Built for the grid crop.** The profile grid shows 4:5 posts as 3:4 crops, so about 34 px is trimmed from each side. The tiles overlap by 34 px each, so the three grid slices touch exactly: no missing strip at the seams. Important things stay in the centre.
3. **Post order matters.** Post the **right** tile first, then the middle, then the left, about 10 minutes apart. The newest post always goes top-left, so the three end up left, middle, right.
4. **Pin all three.** Instagram lets you pin up to 3 posts, and the most recently pinned goes top-left (pin right, middle, left). Without pins, **the very next post you make shifts the whole row by one and the picture tears apart.** With pins, it stays in row 1 and new posts start below.

## The costs, honestly
- It uses all 3 pin slots. You cannot pin a "best post" until you unpin the banner. That is fine: unpin it when it has done its job.
- **It expires.** The right tile says "Halloween Pumpkin Patch till 2 Nov". After 2 Nov, either unpin and let it sink, or ask for an evergreen right tile (no chip, no cart), which is a 5-minute change in `make_banner.js`.
- Instagram changes how the grid works from time to time (the 3:4 grid is new, and sources disagree on the dates). If your phone shows something different, tell me and I will re-cut the tiles.
- On a very small phone the tile text is small. The headline is still readable; the small line under it may not be.

## Both versions are ready
- **A** `banner-1-left-newest.jpg`, `banner-2-middle.jpg`, `banner-3-right-post-first.jpg`
- **B** `post1-meet-noodle.jpg`, `post2-pencil-town-fuji.jpg`, `post3-play-free-halloween.jpg`
- Side by side with the bio and highlights: `grid-preview.jpg`

**My pick: A (banner), with B's pictures reused as later posts.** If you want the very first thing a person sees on the feed to be one clear "Meet Noodle" post, choose B.
