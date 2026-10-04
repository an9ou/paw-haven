#!/bin/sh
# concatenates src parts into the single deliverable
cd "$(dirname "$0")/src" && cat p1_kit.js p2_icons.js p3_items.js $(ls p4_*.js p5_*.js p6_*.js p7_*.js p8_*.js 2>/dev/null) p9_tail.js > ../pawart_world.js && node --check ../pawart_world.js && echo built
