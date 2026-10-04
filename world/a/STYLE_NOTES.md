# World A style notes (for world C)

Source of truth: `/home/claude/proto/world/pawart_world_a.js`. Copy the helpers verbatim (they are pure and self-contained) rather than re-implementing them, so strokes and colours match exactly.

## Palette (`C`)
- Pencil ink `#5B3D32`, graphite construction `#A8968A`, paper `#FFFBF3`, dot grid `#E3D2BA`, pink accent `#F28FA5`.
- Fills are soft pastels: `sky #D3E9F6`, `grass #CBE5A6 / #B4D98E / #93C276`, `leaf #B9DD92 / #9ACD7C / #7FB86A`, `pine #8CC09A / #6FA483`, `trunk #C9A07A / #A97E5A`, `wood #EBCDA4 / #CFA77C`, `roof #EBA48C / #D88870`, walls `#FCE6CC #F9D9DE #D9E9F7 #DDEFD8`, `stone #DED6CC / #C7BCAE`, `path #EFDDBA`, `soil #D9B48E`, `water #BEE0F2 / #9CCDE8`, `sand #F7E4B5 / #EBCF95`, plus `red #F4A3A3`, `yellow #FCE59A`, `orange #F8C08A`, `lav #DCCBF2`, `mint #C9EBDA`, `blue #B9D3F2`, `glass #E4F2FA`.
- Each colour comes with a darker partner for hatching (for example `leafD`, `woodD`, `roofD`). Hatching always uses the partner, never black.

## Determinism and ids
- `rng(seed)` is mulberry32. `hashS('pwa-'+name)` seeds each scene. Jitter is `k.J(a)`, uniform in ±a.
- Ids come from `uid()`; use a different prefix (for example `pwc`). Cached copies get fresh ids by suffixing: `s.replace(/pwa(\d+)/g, m => m+'x'+n)`.
- The kit has two rng streams. `k.side(fn)` draws time/weather extras on the side stream, so the base layout stays identical across variants. `k.skyD(defaultFn, cfg)` runs the day sky as usual and, in a variant, discards it and draws `drawSky(k, cfg)` instead. `k.fx(fn)` runs only in non-default variants, on the side stream.

## Stroke kit (`kit(seed)` returns `k`)
- `k.pen(pts, closed, {w=2.2, wk=.8, amp=.8, tap=.15, col, one})` is the signature outline. It is a filled ribbon, not a stroke: points are resampled every 7px, the line wobbles (a damped random walk with amp ≈.8), the ends taper over 15% of the length, and it gets heavier on downward-facing edges (`wk`). A closed shape is drawn as **two overlapping passes** with a small gap or overshoot; `one:1` gives a single pass for small parts.
- `k.fill(pts, col, {dx, dy, sc, amp, op})` is the coloured-pencil fill. It drifts 1–2.6px right and down off the line, with a ±1.5% scale and a soft edge wobble. Use `{dx:0, dy:0, sc:0}` for full-bleed bands (ground, sky, water) so the edges don't show gaps.
- `k.shape(pts, col, {w, hatch:{side, gap, col, op, w}, one, lcol, noline})` does fill, then hatch, then pen. `hatch.side` (0..1) limits hatching to the right-hand (shadow) part. The typical recipe is `{side:.6, gap:4.5, col:<darker partner>, op:.5}`.
- `k.line(pts, w=1.4, col, {op, dash, amp=.7})` is a cheap wobbly stroke for details: grain, seams, stems, rails.
- `k.text(s, x, y, size, {rot, col, wt=700, anchor, halo})` uses Caveat. `halo` adds a paper-coloured outline (`paint-order: stroke`) for captions over busy art.
- `k.cap(fn)` captures output as a string (used for hotspot groups, wrapping and discarding).
- Shape helpers: `E(cx,cy,rx,ry,n,rot)` (ellipse points), `RC(x,y,w,h)`, `blobP(...)`, `dense`, `smooth` (midpoint-quadratic path).
- Paper: `paperDefs(k,W,H)` provides the dot grid plus a seeded speck pattern (`tooth`) laid on top. There are **no filters anywhere**.

## Doodle objects (`O`)
`sparkle, heart, note, tape, cloud, sun, bird, tuft, flower, leafy, tree, pine, bush, rock, board, fence, bench, lamp, mushroom, cobbles, awning, bunting, window`. Most have snow caps and night lights built in: `O.window` registers a lit-window glow, `O.lamp` registers a halo, and trees, fences, awnings and benches get snow caps when `k.env.snow`.

## Time and weather
- `mkEnv({time, weather})` gives the env. `recolorFn(env, 'out'|'in'|'strip')` handles the base-art colour treatment and runs as a string-level hex remap at assembly. Use `'in'` for indoor scenes.
- `drawSky(k, {W, H, sun, low, moon, clouds, rainC, birds, stars})` covers the gradient, hatch texture, sun or moon, stars and clouds.
- `skyGrad(k, y0, y1)` + `windowView(k, x, y, w, h, {rainGlass, sillSnow})` give windows that show the weather (rain streaks on the glass, snow on the sill).
- Other helpers: `capLine(k, topEdgePts, thickness)` (snow cap), `snowPatch`, `puddle`, `sheen`, `ripples`, `waterGlints`.
- Lights are collected in `k.glows`, `k.lamps` (`{x, y, s, gy, glass, big}`), `k.bulbs`, `k.flies` and `k.glints`, and drawn by `lightsLayer` on top of the recoloured art.
- `assemble(k, pp, W, openTag, wrap)` builds the final string. For walk strips pass `wrap=true` and draw through `k.wrap(x, halfWidth, fn)` / `k.edge(...)` so the seam at x=0/1200 stays clean.

## Conventions
- Hotspots: `hot(k, 'data-hot'|'data-shop'|'data-area', value, label, hitPts, innerSvg)` adds a transparent hit path plus a pink dashed `.pa-wa-hl` outline on hover. Inject the CSS for your own `[data-…]` attributes with a `pa-wc-` prefix.
- Strokes are 2–2.4 on big forms and 1.2–1.6 on details. Leave charm space for washi tape in the corners (`O.tape`), sparkles and hearts.
- Keep overlay zones empty; flat ground decor (a rug, a path) is fine.
