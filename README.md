# MOHAMMED · Mobilia (concept)

A fictional furniture brand shown as a **live 3D gallery**: the sun moves as you scroll, every piece builds itself, and the whole store re-dresses in real time. A portfolio / sales concept for furniture makers: *your catalogue, alive in 3D.*

**Live:** https://housinasaad-creator.github.io/mohammed-furniture-site/ (add `?lang=tr` for Turkish)

## The idea: "A day at Mohammed's"
Scroll and a whole day passes: dawn, morning, noon, golden hour, night. The sun crosses arched windows (the arch is also the logo), long patches of light and arch-shaped shadows crawl across a reflective travertine floor, lamps ignite at dusk, and the sound is birds by day and crickets by night.

## What makes it different
- **Pieces build themselves**: sofa, dining set and bed assemble from their real parts when the camera arrives.
- **Live re-dressing**: changing a fabric, wood or stone sends a ring of light across the piece; four home styles (Sand, Oasis, Noir, Clay Rosé) re-dress the whole house in one wave.
- **Anatomy** (exploded view with labels), **Dimensions** in centimetres, and a **drag-the-sun** light slider.
- A complete shop: live options and prices, a bag with a real snapshot of the configured piece, a demo checkout (test cards only).
- Three languages (English, Türkçe, العربية) without flipping the layout.
- Works on phones: portrait composition, bottom sheet, gyro parallax, and adaptive quality.

## Everything is generated in code
- three.js r172 vendored in `js/vendor` (no CDN, no model files, no texture images).
- GPU-generated textures (wood, plaster, travertine, bouclé, velvet, linen, leather, marble, wool) tinted by gradient maps.
- Curved sofas by sweeping a profile along an arc, an arch-following channel headboard, arch-shaped table legs.
- Sun/moon shadows, planar floor reflection, volumetric light shafts and dust, bloom, ACES tone mapping and film grain.

## Run locally
Serve the folder over HTTP (ES modules + import map need a server), for example `python -m http.server 3500`, then open http://127.0.0.1:3500/.

## Notes
Concept project: the brand, products and reviews are fictional, the 3D models are generated in code, and the checkout is a demo that sends nothing anywhere (known test cards only).

Designed & developed by Muhammed Elhuseyin.
