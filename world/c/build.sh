#!/bin/sh
# builds ../pawart_world_c.js = header (world A helpers, copied verbatim, pwa->pwc) + world C body
D=$(dirname "$0")
{
printf '%s\n' "/* Paw Haven world art, module C (v1.6 \"bigger town\"): 7 hangout scenes + 3 walk strips, style G \"Doodle sketch\"."
printf '%s\n' "   Wraps PawArt.scene (square | cafe | dogpark | vet | salon | hilltop | pier) and PawArt.walkStrip (town | hilltop | pier);"
printf '%s\n' "   every other name is handed to the previous function. Loads AFTER world A and world B."
printf '%s\n' "   The pencil kit, paper, palette, sky and time/weather helpers are copied from world A so both look like one sketchbook. No filters. */"
printf '%s\n' "window.PawArt = window.PawArt || {};"
printf '%s\n' "(function(){"
printf '%s\n' "'use strict';"
printf '%s\n' "/* ===== helpers copied from world A (pawart_world_a.js), ids prefixed pwc ===== */"
cat "$D/_head.js"
printf '%s\n' "/* ===== world C ===== */"
cat "$D/_body.js"
printf '%s\n' "})();"
} > "$D/../pawart_world_c.js"
node --check "$D/../pawart_world_c.js" && echo OK $(wc -c < "$D/../pawart_world_c.js")
