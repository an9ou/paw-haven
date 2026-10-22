# v2.15 map design (preview and screenshots)

- Contract: `V215.md` (repo root).
- Live preview (claude.ai artifact): https://claude.ai/artifact/Fy6mzAFggiHUBa6xRGKKJU
- `preview/index.html` is the artifact's page. It loads the game's art unchanged as `dogs.js`, `world_a.js`, `world_b.js`, `world_c.js`: to open it locally, copy `dogs/pawart_dogs.js` and `world/pawart_world_{a,b,c}.js` next to it under those names and serve the folder.
- Screenshots (taken with Playwright from the preview, desktop 1440 wide and iPhone 15 size 390 × 844 @2x):
  - `v215_desktop_map.png`: the whole new town map with the new and moved tags
  - `v215_desktop_buttons.png`: zoomed in, the Café hovered (lift and glow), the Training Ground picked, the corgi arrived
  - `v215_desktop_nolabels_winter.png`: labels off, winter: every building reads by its look
  - `v215_desktop_roaming.png`: today's Dog Park strip next to the v2.15 Training Ground with the whole floor
  - `v215_phone_map.png`: phone, the Splash Pool picked, the bottom sheet
  - `v215_phone_roaming.png`: phone, the Training Ground crop with the camera strip
