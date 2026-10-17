#!/bin/sh
# Builds the 30 s Reel (two end cards: "play free, link in bio" and "coming soon") into brand/instagram/launch/reel/.
#   sh brand/instagram/launch/reel_build.sh <workdir> <shotsdir>
# <shotsdir> holds garden.png and kitchen.png (from shots2.js). Needs ffmpeg and Playwright. Step 1 and 2 only once; they are slow-ish.
set -e
W=${1:-/tmp/reel_work}; SHOTS=${2:-/tmp/shots}; L="$(cd "$(dirname "$0")" && pwd)"; export NODE_PATH=${NODE_PATH:-/opt/node-tools/node_modules}
mkdir -p "$W"
[ -d "$W/footage/yard" ] || node "$L/reel_footage.js" "$W/footage"          # real gameplay clips
[ -f "$W/music.wav" ]   || node "$L/reel_audio.js" "$W/music.wav"            # the game's own music
rm -rf "$W/frames_play" "$W/frames_soon"; mkdir -p "$W/frames_play" "$W/frames_soon"
for r in "0 300" "300 600" "600 900"; do set -- $r; node "$L/reel_render.js" "$W/footage" "$SHOTS" "$W/frames_play" play $1 $2 & done; wait
i=0; while [ $i -lt 765 ]; do n=$(printf %05d $i); ln -s "$W/frames_play/f_$n.jpg" "$W/frames_soon/f_$n.jpg"; i=$((i+1)); done
node "$L/reel_render.js" "$W/footage" "$SHOTS" "$W/frames_soon" soon 765 900
for v in play soon; do
  ffmpeg -y -loglevel error -framerate 30 -i "$W/frames_$v/f_%05d.jpg" -i "$W/music.wav" \
    -filter_complex "[1:a]atrim=0:30,afade=t=in:d=0.3,afade=t=out:st=28.8:d=1.2,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" \
    -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -r 30 -c:a aac -b:a 192k -ar 44100 -movflags +faststart -t 30 "$L/reel/doodle-doggo-reel-30s-$v.mp4"
done
