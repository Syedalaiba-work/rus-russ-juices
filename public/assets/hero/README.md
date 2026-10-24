# Hero assets

Authored artwork for the RUS RUSS hero goes here.

**The target is the approved tile's composition at the large reference's level of finish.**
- Authoritative for what is in the picture and where: `design/approved/01-clean-classic.png` (01 Clean Classic, tile 01).
- Quality reference only, for how finished it should look: `design/approved/hero-reference-large.png`.
- Brand reference: the RUS RUSS branding PDF.

Where the large reference differs from the tile, follow the tile. Do not add the second crown, the
round arrow or the extra leaves; do not draw anything that belongs to the page's typography.

The artwork: a photorealistic cup of juice packed with ice, realistic fruit and splash, the
high-quality hoodie rabbit sitting in the top, the brush wordmark; realistic materials, premium
daylight lighting, accurate shadows and reflections, a product-photography finish.

What is on the site today is a **stand-in**: a simple procedural 3D scene that holds the right
composition so the page, the scroll and the flavour switching could be built and tested. It is not
the final artwork. It is frozen: it is not to be refined, and it stays as the fallback until the
artwork in this folder replaces it.

## How a slot is filled

1. Put the file in the folder named below.
2. Write its path (relative to this folder) into `manifest.json` in place of `null`.
3. Rebuild (`npm run build`). Nothing else changes: no page, layout or scene code.

A slot left as `null` keeps its stand-in. A path that fails to load logs a warning and keeps its
stand-in. Slots are independent, so assets can arrive one at a time.

The scene (`lib/cupScene.ts`) stays responsible for position, camera, depth, movement, flavour
transitions, lighting, interaction and scroll sync. An asset only supplies how a part looks.

## Status

| # | Slot | Manifest key | Status |
|---|---|---|---|
| 1 | Hero cup | `cup.model` | **missing** |
| 2 | Juice / liquid | part of `cup.model`; optional `liquid.normal` | **missing** |
| 3 | Ice | `ice.model` (loose cubes); packed ice is part of `cup.model` | **missing** |
| 4 | Fruit | `fruit.blueberry`, `.strawberry`, `.mango`, `.slice` | **missing** (4) |
| 5 | Splash | `splash.model` *or* `splash.sprites.<flavour>` | **missing** |
| 6 | Rabbit | `layers/shared/4-rabbit.webp` (the realistic hero rabbit; see `layers/README.md`) | **temporary**: baked into the picture cut-outs in `layers/<flavour>/3-cup.webp`. The realistic rabbit is **hero only**; the site fades it out as the cup travels. The official line-art poses in `rabbit/` are used everywhere else on the site |
| 7 | Rabbit hoodie | only relevant to a modelled hoodie rabbit | not used |
| 8 | Wordmark | `wordmark.black`, `wordmark.white`, `wordmark.cup` | **filled**: official artwork cut from the branding PDF (`tools/extract_wordmark.py`) |
| + | Hero still per flavour | `stills.<flavour>` | **missing** (4); photographed from the scene into `public/brand/cups/` by `npm run cups` |
| + | Drink alone per flavour | `drinks.<flavour>`, `layers/<flavour>/3-cup`, `cards.<flavour>` | **filled**: rendered in Blender (`blender/make_drink.py`, `tools/place_renders.py`); fruit pairing not a confirmed recipe |
| + | Card picture per flavour | `cards.<flavour>` | **missing** (4) |

Flavour ids: `berry-blast`, `blue-rush`, `mango-madness`, `tropical-mix`. The range itself is still
placeholder (see DESIGN.md appendix C); if it changes, the ids change with it.

## Spec for each slot

Two routes exist for some slots. **A** is a 3D model that the scene lights and turns. **B** is
flat artwork with a transparent background. B is the quicker way to match an illustrated
reference exactly; A is what makes the cup turn convincingly. They can be mixed.

### 1. Cup — `cup/cup.glb` (GLB)
- The whole cup as one model: clear plastic with the ribs and rolled rim, the juice, the ice packed inside, the straw, the mint leaves.
- Any scale and origin. It is fitted to the stand-in's height and centred.
- Upright, front facing +Z. The scene adds the lean and the view from above.
- Name the juice material `liquid` (or anything starting with `liquid`). The scene recolours it per flavour: its absorption colour if it is a transmission material, otherwise its base colour. Author it neutral white.
- If the model includes the wordmark on the cup, name that object `print`; the scene then hides its own. Otherwise the scene prints the wordmark slot on the front.
- Budget: 60k triangles, 1.5 MB, textures up to 2048px.
- The page background shows through the canvas. A purely refractive plastic wall will vanish against it, so give the plastic some reflection and a visible rim.

### 2. Juice / liquid
- Route A: part of `cup.glb`, as above. No separate file.
- Optional, for the stand-in only: `liquid/normal.webp`, a tileable 1024 x 1024 normal map (not transparent) for surface detail. Ignored once `cup.model` is set.
- Flavour colours are data (`lib/data.ts`), not assets.

### 3. Ice — `ice/ice.glb` (GLB)
- One clear cube. Used for the three loose cubes around the cup. Fitted so its longest side is 1 unit.
- Budget: 2k triangles, 150 kB.
- The ice packed inside the cup belongs to `cup.glb`.

### 4. Fruit — `fruit/blueberry.glb`, `fruit/strawberry.glb`, `fruit/mango.glb`, `fruit/slice.glb` (GLB)
- One piece each. The scene places thirteen per flavour in fixed spots taken from the approved hero, and turns and scales each one, so a single good model per fruit is enough.
- Any scale; each is fitted to its stand-in's size.
- `mango` is a cube of mango; `slice` is a round citrus slice.
- Budget: 8k triangles and 300 kB each, textures up to 1024px.

### 5. Splash — choose one
- **A, model:** `splash/splash.glb`. One static mesh of the whole splash, both sides of the cup, centred on the cup. Name its material `water…` and the scene tints it per flavour. Budget 40k triangles, 1 MB.
- **B, images:** two transparent images per flavour, the splash behind the cup and the splash in front of it:
  `splash/<flavour>-back.webp` and `splash/<flavour>-front.webp`, 1860 x 2200 px, transparent WebP (or PNG).
  The canvas is the product frame (see "The frame" below): draw the splash where it sits around the cup.
  In the manifest: `"blue-rush": { "back": "splash/blue-rush-back.webp", "front": "splash/blue-rush-front.webp" }`.
- Either way the scene pulls the splash in and throws it out again on a flavour change.
- **Sequence (not wired yet):** an animated burst would be a sprite sheet, `splash/<flavour>-burst.webp`, 8 x 4 frames of 512 x 512 px on a transparent background. The name is reserved; nothing reads it today.

### 6 and 7. Rabbit and hoodie — choose one
- **A, model:** `rabbit/rabbit.glb`. The rabbit from the approved hero, in its blue hoodie with the mark on the chest and its blue shades, seated, arms out to rest on a rim, feet forward. Base of the model at the height of the cup's rim. Fitted to 4.4 units tall. Budget 80k triangles, 2 MB, textures up to 2048px. The hoodie is part of the model.
- **B, image:** `rabbit/rabbit.webp`. The rabbit as drawn in the approved hero, cut out, transparent background, 1800 x 2400 px minimum, the whole figure including both ears, feet at the bottom edge. It stands in the top of the cup as a flat cut-out that always faces the viewer. The hoodie is part of the image.
- `hoodie/print.png` (1024 x 1024, transparent, white artwork) only changes the mark on the **stand-in** rabbit's chest. It is not needed once A or B is supplied.

### 8. Wordmark — `wordmark/black.svg` and `wordmark/white.svg`
- The brand's own stacked brush wordmark, as on the approved cup. SVG preferred; otherwise transparent PNG at least 1200px wide.
- `black` is printed on the cup and used as the logo in the navigation. `white` is printed on the stand-in rabbit's hoodie.
- Supply it already stacked and tilted as it should appear. If "JUICES" belongs under it on the cup, include it in the artwork.

### Hero stills — `stills/<flavour>.webp`
- The finished hero product for each flavour as one picture: cup, rabbit, fruit, ice, splash. Transparent background.
- 1980 x 2340 px (ratio 9.3 : 11, the frame below), transparent WebP.
- This is the first thing a visitor sees, before the 3D starts, and the only thing they see with reduced motion or without WebGL. It matters as much as the 3D.
- Once the 3D slots are filled, these can instead be re-shot from the scene with `npm run cups`.

### Card pictures — `cards/<flavour>.webp`
- The small product picture on each flavour card, as in the approved cards: the cup with its fruit beside it.
- 900 x 900 px, transparent WebP, product sitting on the bottom edge.

## The frame

Stills and splash images share one frame so they line up with the 3D: a 9.3 : 11 upright rectangle.
- The cup's centre line is the horizontal centre of the frame.
- The cup's rim is about 47% down from the top; its base about 86% down.
- The rabbit's ears reach to about 3% from the top.
`_templates/` holds empty transparent files at each required size.

## Formats

| Kind | Format | Notes |
|---|---|---|
| Model | `.glb` (glTF 2.0 binary) | PBR metallic-roughness. Textures embedded as PNG, JPEG or WebP. **No Draco, Meshopt or KTX2 compression yet**: the loader has no decoders wired. Adding them is a small change in `lib/heroAssetLoader.ts` if the models need it. |
| Transparent image | `.webp` with alpha (or `.png`) | sRGB, straight (not premultiplied) alpha, no background, no baked shadow on the page. |
| Vector | `.svg` | Outlined paths, no fonts. |
| Texture | `.webp` or `.png` | Power-of-two sizes. |
| Sprite sequence | `.webp` sheet | Reserved for the splash burst; not read yet. |

## What not to supply

No claims, labels or copy baked into artwork beyond the wordmark. No new colours: brand blue
`#4eadea`, the four flavour colours in `lib/data.ts`, white, black. Nothing darker or moodier than
the approved hero.

## Layered artwork (the route chosen for the hero): START HERE

The client is supplying the hero as flat artwork in separate layers rather than as 3D models.
The spec for that is `layers/README.md`: six registered layers per flavour on a 1400 x 1656
transparent canvas, found automatically by `tools/scan-hero-assets.mjs` when the site is built.
A flavour with a `3-cup` layer is drawn from its layers instead of the 3D stand-in.
