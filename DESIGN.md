# Design System: RUS RUSS Juices

Read this before touching the UI. The previous system (01 Clean Classic as the visual target)
is archived at `design/archive/DESIGN-clean-classic-2026-09-30.md`; it no longer applies.

**The site is RUS RUSS inside a fresh, playful British farmers' market.** Real fruit, real juice,
real materials, hand-drawn doodles, blue-and-white stalls, the RUS RUSS rabbit, bold type,
premium photography, Three.js depth and smooth scroll storytelling. Not SaaS, not a rustic
template, not a smoothie site, not a Peter Rabbit, Fizzi or Lusion clone.

## Sources, in order of authority

| For | Authority |
|---|---|
| Brand identity: wordmark, official line-art rabbit, blue, black, physical applications | the RUS RUSS branding PDF (`design/brand-pdf/`) and `public/brand/` |
| Visual theme: atmosphere, market environment, product presentation, fruit styling, doodles, composition style, personality | **`design/approved/farmers-market-reference.png`** (the primary visual reference) |
| Product photography direction | the smoothie photographs in `design/references/market/` |
| Rabbit realism (fur, cloth, light) | the film stills in `design/references/market/`: reference only, never copied |
| Interaction and product storytelling | Fizzi (behaviour only) |
| 3D, WebGL, camera, scroll sync | Lusion (technique only) |
| Process, system, QA, audit | Taste Skill + Image-to-Code; this file; Playwright; Vercel Web Interface Guidelines |

A higher row wins over a lower one. No colours, type, artwork or layouts are taken from the
references or from other brands.

## 1. Brand identity

- **Wordmark:** the official artwork only (`public/assets/hero/wordmark/`), cut from the PDF.
  Never re-set in a font. Nav logo, the repeated band, the footer lockup.
- **Rabbit, two expressions of one character:**
  - the **official line-art rabbit** (`public/assets/hero/rabbit/`, twelve poses) everywhere:
    story, brand world, poses section, locations, footer, packaging, truck, doodles;
  - a **realistic RUS RUSS rabbit** in the **hero only**: original, in the RUS RUSS hoodie,
    realistic fur and cloth, cinematic daylight. Secondary to the juice. Temporary version
    today: cut from the reference picture (see §9).
- **Colours:** `--blue #4EADEA` (primary), black `#0b0b0c`, white. Fruit colours come from
  photography, not from large UI backgrounds. Two market-only neutrals: `--kraft #ead9bd`,
  `--chalk #191b1e`. Flavour colours in `lib/data.ts` are used only in small accents (the pale
  name behind the stage cup) and the shader's faint wash.
- **Copy:** nothing invented. Stats, flavour names, descriptions, company story and locations
  are placeholders until confirmed, and are marked as such in review builds
  (`lib/placeholder.tsx`). Locations show "Coming soon".

## 2. Farmers-market visual language

Components, all in `app/globals.css` and `components/`:

| Piece | Where | Notes |
|---|---|---|
| Awning (`.awning`) | bottom of the hero, top of the footer | blue/white stripes, scalloped; drops into place |
| "Juices" sign (`.awning__sign`) | hangs from the hero awning | photograph from the reference (`public/assets/market/sign-juices.webp`) |
| Chalkboard (`.stage__board`) | end of the stall | "Take your pick", from the reference; says nothing else |
| Gingham table (`.stage::after`, `.stall__cloth`) | the stage and the stall | blue checks, ink edge, pinked bottom |
| Kraft labels (`.dish__text`, `.chip`) | under each drink; flavour chips | paper, slight tilt, marker lettering on chips |
| Hand-written names (`.dish__hand`, `.hero__label`) | above each drink; beside the hero product | marker face, arrow drawn in |
| Market edges (`.hero__edge`, `.drinks__edge`) | sides of the hero and the stall | blurred market from the reference, masked to fade; hidden under 1100 px |
| Fruit doodles (`components/Doodles.tsx`) | beside real fruit and drinks | see §4 |
| Farm photographs (`public/assets/market/`) | hero, locations panel, footer | the hero is built in depth so it reads as a market in a field, not a landscape view: `field-hero` far away and blurred (Pexels, Mike Bird, 5043192), `stall-bokeh` a produce stall softly behind the product (Pexels, Tamira Kanemägi, 36567404), warm sunlight from the top right, `grass` sharp in front for the product to stand in (Pexels, Engin Akyurt, 33211887), then the white veil for the copy. `field-pasture` (Pexels, Linda Kokina, 38269246) sits behind locations and the footer. Pexels licence: free commercial use, no attribution required, credited here anyway; originals in `design/references/field/`. The film posters in `design/references/mascot/` are feel references only, never assets |

Keep it a **layer**: white page, blue and black type, then the market pieces. No wood
textures on large areas, no sepia, no distressed type.

## 3. Typography

- Display: Mont (Montserrat stands in until the licence file arrives), 800/900, tight
  tracking, uppercase in the hero. The hero "JUICE" line is blue and tilted 2.5°.
- Marker accents: Permanent Marker, uppercase, tilted 4–8°, for names, notes and chips only.
  Never for body copy or navigation.
- Body: Montserrat 500–700.
- **Reveals:** word or line-level masked rises with slight rotation and stagger, blue "inking"
  of the blue word, hand-drawn underlines and arrows that draw themselves, labels that pop in.
  Never a typing effect, cursor or per-character animation. Type should feel like market
  signage coming alive.

## 4. Fruit and doodle system

- Doodles: pineapple, strawberry, orange, blueberry, mango, cherry, lemon, watermelon, apple,
  banana, kiwi. One pen line plus an off-register colour patch; `plain` for line only. They
  draw themselves in on scroll.
- **Real fruit + doodle.** A doodle sits next to the thing it annotates: the fruit's doodle
  beside its drink, an arrow to a name, a sketch circle round a real berry. Not scattered.
- Real fruit cut-outs are an asset slot: `public/assets/market/fruit/` (transparent WebP).
  Until they exist the doodles stand alone beside the product photographs.

## 5. Photography direction

Drinks are photographs (or production-quality authored/generated artwork), never procedural.
Clear cup with the RUS RUSS mark, thick real juice with texture, fruit pieces, ice,
condensation, splash and drips, natural shadows, soft daylight, one camera for all four.
Spec, canvas, registration lines, formats and budgets: `public/assets/hero/layers/README.md`.
Three.js gives depth, travel and interaction; it does not draw the drink.

## 6. Page, section by section

1. **Hero:** a real meadow photograph (sky, trees, grass) veiled white at the top and on the
   copy column. Left: UK'S / JUICE / BRAND, crown, "Serving the best in UK." with a brush
   underline, big-figure stats, black CTA. Right: the hero product (rabbit + drink + fruit +
   splash) standing on the grass with a hand-written flavour label and arrow and the note
   "More than just juice." Blurred market edges, awning across the bottom with the Juices sign.
2. **Stage (`.stage-wrap`):** the product travels from the hero and lands on the gingham
   table; the flavour name stands pale behind it; kraft chips and arrows pick a flavour; the
   chalkboard at the end. White.
3. **Stall (`.drinks`):** four drinks standing on the table with hand-written names, fruit
   doodles and kraft labels; the cloth in front; market edges. Picking a drink sets the
   flavour and glides up to the stage.
4. **Story:** a walk through the market in four beats, FRUIT → MARKET → JUICE → RUS RUSS.
   The headline and the four words stay on the left; the active word turns blue as each beat
   (fruit out of focus with loose fruit floating over it, the storefront with the rabbit, the
   Berry Blast drink on gingham, the lockup on blue with the rabbit) passes the middle of the
   screen. Captions only name what is pictured; the company text stays placeholder.
5. **Wordmark band. Brand world:** truck, cup, bags with kraft marker tags, line-art rabbits,
   doodles.
6. **Tour (`.tour-wrap`):** scroll-driven walk through the range, white, gingham foot.
7. **Poses:** "One rabbit. Twelve poses." horizontal pan, paper-toned tiles.
8. **Locations:** pale blue panel, a hand-drawn UK outline with a dotted route (no pins: no
   confirmed locations), "Coming soon", line-art rabbit.
9. **Footer:** awning, blurred market at the edges, "Come get your juice.", blue CTA, doodles,
   official lockup. White.

**Loose fruit (`public/assets/market/fruit/`):** strawberry, two blueberries, blackberry, leaf,
ice, cut from the reference. They float round the cup on the stage and over the first story
beat, drifting with the scroll at their depth and leaning away from the pointer
(`[data-depth]` in Motion.tsx). Real fruit cut-outs of better quality replace them by name.

## 7. 3D / WebGL rules

- One fixed canvas (`components/Scene.tsx`, `lib/cupScene.ts`), plain three.js. Its pose comes
  from DOM slots (`.hero__slot`, `.stage__slot`, `.tour__slot`).
- Independent layers per flavour on a 1400×1656 canvas (`public/assets/hero/layers/`), back to
  front: `1-splash-back`, `2-rabbit-back` (shared), `3-cup` (the drink alone), `4-hero` (the
  hero product), `4-rabbit` (shared: the paw in front of the cup), `5-fruit-front`. With a hero
  layer present, everything except `3-cup` is hero-only and fades as the product travels on,
  while `3-cup` takes over. Planes sit at different depths for parallax. On a flavour change
  the product flips, the foot fruit swaps, the splash bursts, the rabbit gives slightly.
  Nothing is recoloured in code: each flavour loads its own pictures.
- Deferred start, idle stop, quality tiers, no-WebGL and reduced-motion fallbacks to the still
  images (`stills/`, `drinks/`, `cards/`). Never fake photoreal juice or fur procedurally.

## 8. Shader

`components/Backdrop.tsx`: one subtle daylight gradient behind the whole site, brand-blue
tinted, a faint flavour glow behind the hero product, a very faint flavour wash (30%) near the
stage and tour. No aurora, rainbow, neon, blobs. Stage and tour are opaque white.

## 8a. Product art direction (added 1 October 2026)

References, for art direction only (nothing is copied: no branding, type, layout, names or
claims): `design/references/market/5.png` (very large product imagery, drips, close crops, the
product running off the frame) and `design/references/market/6.png` (a family of drinks shown
at one scale, one style, each with its own fruit).

Target: premium editorial product photography placed inside a playful British farmers' market.
With all text and UI removed, the drinks should still look like an art-directed campaign.

**One product system.** Shared by all four: the same RUS RUSS cup and print, the same light, the
same camera, the same scale, the same render settings. Different for each: the liquid, the
fruit, the garnish, the splash, the colour, and small material differences.

| Flavour | Liquid | Fruit and garnish | Splash |
|---|---|---|---|
| Berry Blast | marbled raspberry pink, pale swirls, dark flecks, fine pulp | raspberry, blueberry, blackberry, strawberry | a lively crown: many fingers, plenty of spray |
| Blue Rush | smooth periwinkle, slow dark swirls, few flecks | blueberry, blackberry, mint | a tall, smooth wave: few long fingers |
| Mango Madness | dense, deep gold, fibrous, grainy, darker toward the foot | hand-cut mango, mint | heavy and thick: a low, wide slosh, a few big drops, three drips |
| Tropical Mix | layered red to orange to yellow, pulpy, opaque | pineapple, strawberry, banana, mango | a twisting ribbon with fruit in it |

**Scale.** The product is the picture. On desktop the hero product is larger than its column
and is cut by the right edge and by the awning; the hand-written notes move into the open
space to its left. Under 1100 px it is sized to its own column. On phones it is recomposed:
the cup fills the width and is cut at the right, the rabbit stays whole on the left. It is
never simply shrunk to fit.

**The collection (the stall).** One strong heading ("Take your pick."), then the four drinks
large, at one scale, with room round them; hand-written name and arrow, the fruit's doodle, a
kraft label with the name (and the description once confirmed). Market details stay at the
edges. Not a card grid.

## 8b. Blender pipeline

Product artwork is authored in Blender 5.2 (Cycles), scripted and reproducible:
`blender/make_drink.py` builds a PET cup, a marbled smoothie with subsurface scattering, the
official print, condensation, fruit and daylight, and renders it transparent with its ground
shadow; `tools/place_renders.py` puts the render on the site canvases. Sources in
`blender/scenes/`, renders in `blender/out/`, plan and status in `blender/README.md`.

Rule: Blender for glass, liquid, fruit, light and shadow; three.js and GSAP for position,
travel, depth, flavour changes and interaction. The realistic rabbit is not made by script.

## 9. What is temporary

- **The hero rabbit:** cut from the 1536 x 1024 concept picture by `tools/cut_rabbit.py`, as
  two layers (body behind the cup, paw in front). Soft, and not an original production
  character. It is the last temporary piece of the hero. Do not replace it with a scripted
  Blender rabbit; it needs an authored original (`public/assets/hero/layers/README.md`).
- **Loose fruit on the stage, the "Juices" sign, the chalkboard, the market edges:** cut from
  the concept picture.
- **Farm background:** free Pexels photographs.
- **Not temporary any more:** the hero product, its splash and its foot fruit for all four
  flavours, and the four drinks outside the hero, are Blender renders (section 8b). The fruit
  shown with each flavour still mirrors the concept and is not a confirmed recipe.

## 10. Motion hierarchy

1. Product motion (travel, flip, hop, splash) 2. Scroll storytelling 3. Fruit motion 4. Doodle
drawing 5. Typography 6. Micro-interactions. Not everything at once. Reduced motion: static
end states, no smooth scroll, no scrubbing.

## 11. Spacing and layout

`--pad` gutters (16–56 px), `--radius` 20–30 px, 12-column grids in story and world, max
1180 px for the stall. Sections breathe: 80–170 px between them. Awnings bleed full width.

## 12. Responsive

Checked at 1440, 1280, 1024, 768, 390, 375, 320. Under 1100 px the market edges and the
chalkboard are hidden; under 760 px the hero is one column, the stall is two columns, chips
wrap, the stage text gets a white backing on the cloth. No horizontal overflow at any width.

## 13. Accessibility

Skip link, one h1, labelled sections, real links for drinks (`?flavour=…#products`), 44 px
targets, axe clean, keyboard order tested (`tools/a11y.mjs`), decorative images `alt=""`,
`aria-live` for the flavour name, hand-written duplicates `aria-hidden`.

## 14. Performance

Budgets: LCP < 2.5 s at 4× CPU throttle on 390 px, no CLS on load, 50/30 fps scroll and
flavour switches (`tools/perf.mjs`). Images: WebP with alpha, layers decoded off the main
thread, all four flavours cached when sets are small.

## 15. Do / don't

| Do | Don't |
|---|---|
| Photograph the drinks; put the doodle beside the real fruit | Build juice or fur out of geometry |
| Blue/white stripes, gingham, kraft, chalk, as accents | Wood or sepia over whole sections |
| Marker face for names, notes, chips | Marker face for paragraphs or nav |
| Word-level reveals, drawn lines | Typing effects, cursors |
| Line-art rabbit everywhere, realistic rabbit in the hero | Realistic rabbit in the poses section, on cups, in the footer |
| Placeholder tags on unconfirmed copy | Invented stats, recipes, locations |
| One subtle daylight shader | Aurora, neon, purple/pink glows |

## Appendix: confirmed vs placeholder

Confirmed: wordmark, line-art rabbit poses, brand blue, five brand photographs, flavour count
(four in the placeholder range). Placeholder: stats, flavour names and descriptions, company
description, locations, "Come get your juice." (from the concept sheet), any fruit shown with a
flavour.

## Appendix: Vercel Web Interface Guidelines review, 1 October 2026 (market sections)

Reviewed `app/page.tsx`, `components/Flavours.tsx`, `components/Doodles.tsx`,
`components/Motion.tsx` and the market rules in `app/globals.css`.

**Fixed:** chip hover guarded by `(hover: hover)`; alternate tilt of the kraft labels (selector
never matched); leftover hover styling on the hand-written names; an image rendered with an
empty `src`; hero edge images downloaded on phones where they are hidden (now lazy);
`fetchPriority="high"` on the hero photograph and `decoding="async"` on the other two layers;
pointer-move tweens stacking up (one per fruit, overwritten); two live regions announcing the
same flavour change (the tour's is no longer live); `translate="no"` on the brand name, the
flavour names and the logo link; kraft labels can wrap long names (`min-width: 0`,
`overflow-wrap`); `text-wrap: balance` on the stage and tour titles and beat captions; a block
pasted into the wrong media query; conflicting and duplicated rules; the "current" drink no
longer looks like keyboard focus; a gradient that was given a transition; the sticky story
column sized to fit a short laptop screen; `scroll-margin-top` on the anchor targets; the hero
note gets a paper backing on phones where it sits on the grass; modifier-click on a drink no
longer changes the flavour on the current page.

**Passing as found:** explicit image dimensions everywhere, lazy loading below the fold,
reduced-motion handling for every animation, no `transition: all`, no animated layout
properties, 44 px targets, visible focus, contrast on kraft, typographic quotes.

**Deliberate exceptions:**
- Decorative market artwork uses plain `<img alt="" aria-hidden>` rather than `next/image`:
  it is pre-sized WebP, and several pieces need CSS masks that the wrapper complicates.
- `#products` has no `scroll-margin-top`: the stage is a full-height sticky scene and must
  land exactly at the top.
- The hand-written flavour names beside the drinks duplicate the real names and are
  `aria-hidden`.
- Marker text on the hero photograph (desktop) relies on the white veil rather than a backing;
  checked by eye, not by axe (axe cannot measure text over images).
- Unused rules from earlier iterations (`.cards`, `.board`, `.stall__fruit`, `.story__copy`,
  `.hero__star`, `.stat__icon`) are still in the stylesheet; harmless, to be pruned.
