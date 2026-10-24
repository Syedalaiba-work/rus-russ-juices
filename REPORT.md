# RUS RUSS Juices website: status report

Date: 1 October 2026 (updated after the Blender and guideline phase; see part 9)
Preview: http://localhost:3100 (run `bash tools/serve.sh` in the project folder if it is not running)
Screenshots of every section at every screen size: `design/shots/`
Full-page picture: `design/shots/1440_00-full-page.jpg` (desktop), `design/shots/390_00-full-page.jpg` (phone)

---

## 1. Where the site stands

The site is built and working from top to bottom in the farmers-market direction. Every section
exists, scrolls, animates and works on phones. What is **not final** is the artwork (it is cut from
one small concept picture) and the written content (most of it is placeholder).

| Area | State |
|---|---|
| Layout, sections, navigation | Done |
| Farmers-market theme (awning, gingham, kraft labels, chalkboard, doodles, farm background) | Done, open to your changes |
| 3D / scroll animation (cup travels, flavour switching, floating fruit) | Done |
| Phone and tablet layouts | Done, checked at 7 screen sizes |
| Accessibility, keyboard, reduced motion, no-3D fallback | Passing |
| Speed | Passing on desktop and on a slowed-down phone |
| Rabbit and drink artwork | **Temporary** (cut from your concept picture, soft) |
| Text content (stats, flavours, story, locations) | **Placeholder**, needs your real information |
| Brand font (Mont) | **Missing**, Montserrat is standing in |

---

## 2. The page, section by section

For each section: what is there now, and what you may want to change.

### 2.1 Navigation
- **Now:** official RUS RUSS logo, links Home / Flavours / Our Story / Brand World / Locations, blue "Get Juice" button.
- **To decide:** your concept picture says "ORDER NOW" and shows a basket icon. The site has no ordering, so the button says "Get Juice" and goes to Locations. Tell me if online ordering is planned.

### 2.2 Hero (first screen)
- **Now:** "UK'S JUICE BRAND" in bold capitals with JUICE in blue and a crown; "Serving the best in UK." with a brush underline; three stats; "Explore Flavours" button. On the right, the realistic rabbit hugging the Berry Blast cup with strawberries, blueberries, ice and splash, a hand-written "BERRY BLAST" label and the note "MORE THAN JUST JUICE." Background: blurred meadow and sky, a produce stall out of focus behind the product, warm sunlight, sharp grass in front, market leaves and crates at the edges. A blue-and-white awning with the wooden "JUICES" sign closes the screen.
- **Temporary:** the rabbit and cup are cut from your 1536-pixel concept picture, so they are slightly soft. Only Berry Blast is real; for the other three flavours the same picture is recoloured and the strawberries stay.
- **Different from your picture:** the headline uses the brand typeface, not the brush lettering in the picture.
- **Possible changes:** headline style, button colour (black now, blue in your picture), how strong the farm background is, which photographs are used.

### 2.3 Flavour stage
- **Now:** as you scroll, the cup travels down from the hero and lands on a blue gingham table. The flavour name stands large and pale behind it. Kraft price-tag buttons and arrows switch between the four flavours. Loose fruit (strawberry, blueberries, blackberry, mint leaf, ice) floats round the cup and reacts to the mouse. The "Take your pick" chalkboard stands at the right.
- **Temporary:** the drink shown here is the small drink from the stall row of your picture, enlarged about four times, so it is soft. The rabbit is not shown here (your rule: realistic rabbit in the hero only).

### 2.4 Stall (menu)
- **Now:** the four drinks standing on the gingham table, each with a hand-written name and arrow, a fruit doodle and a kraft label with a one-line description. Clicking a drink selects it and scrolls up to the stage.
- **Placeholder:** the four names and descriptions. No prices or ingredients are shown because none have been confirmed.

### 2.5 Our Story
- **Now:** "More than just juice." stays on the left with four words (Fruit, Market, Juice, RUS RUSS). Four pictures scroll past on the right and the matching word lights up: fruit, your storefront with the line-art rabbit, the Berry Blast drink on gingham, the RUS RUSS logo on blue.
- **Placeholder:** the paragraph about the company comes from the concept and is not verified.

### 2.6 Wordmark band
- **Now:** the official RUS RUSS logo repeated across a blue band that slides as you scroll.

### 2.7 Brand World ("Out in the wild.")
- **Now:** your truck, cup and bag photographs with kraft tags ("the truck", "the cup", "the bags"), line-art rabbits and fruit doodles.

### 2.8 Juice tour
- **Now:** the screen holds still while you scroll and the four flavours pass one after another, with the cup changing each time.

### 2.9 Rabbit poses ("One rabbit. Twelve poses.")
- **Now:** the twelve official line-art poses in a sideways-moving strip. No captions.

### 2.10 Locations ("Find the truck.")
- **Now:** a pasture photograph, a hand-drawn UK outline with a dotted route, "Coming soon", the line-art rabbit.
- **Needs from you:** real locations (name, address, opening hours). Until then there are no pins, because none would be true.
- **Known weakness:** the UK outline is a rough hand sketch and could be drawn better.

### 2.11 Footer
- **Now:** awning, "Come get your juice." in large type, blue button, links, and the full official logo across the bottom. White with a soft pasture photograph behind the heading.
- **To confirm:** "Come get your juice." and "Good drinks, good days" come from the concept sheet, not from the brand document.

---

## 3. What is temporary and what would replace it

All product pictures come from one concept image, `design/approved/farmers-market-reference.png`.

| Piece | Now | Needed to finish |
|---|---|---|
| Hero rabbit | cut from the concept picture | one realistic RUS RUSS rabbit, original, on a transparent background |
| Berry Blast drink | cut from the concept picture | one photograph or high-quality render |
| Blue Rush, Mango Madness, Tropical Mix (hero) | Berry Blast recoloured | one picture each |
| Drinks outside the hero | tiny stall drinks enlarged 4x | the same four pictures |
| Loose fruit | cut from the concept picture, small | fruit cut-outs on transparent backgrounds |
| "Juices" sign, chalkboard, market edges | cut from the concept picture | fine as they are, or sharper versions |
| Farm background | four free stock photographs (Pexels) | your own photographs if you have them |

Exact sizes, formats and where to put each file: `public/assets/hero/layers/README.md`.
Files dropped into the right folder are picked up on the next build; no code changes are needed.

---

## 4. Content that is still placeholder

In the preview these are marked with a yellow "PLACEHOLDER" tag. The tags do not appear on the live site.

| Content | Shown now | Status |
|---|---|---|
| "100% Real Fruits" | hero stat | not verified |
| "4 Unique Flavours" | hero stat | matches the four placeholder flavours |
| "UK Locations" | hero stat | not verified |
| Flavour names | Berry Blast, Blue Rush, Mango Madness, Tropical Mix | not confirmed |
| Flavour descriptions | one line each | not confirmed |
| Ingredients, prices, nutrition | not shown | not supplied |
| Company description | Our Story paragraph | from the concept, not verified |
| Locations | "Coming soon" | not supplied |
| Brand font | Montserrat | Mont licence file not supplied |

---

## 5. Decisions I need from you

1. **Headline lettering:** keep the clean brand typeface, or move toward the brush lettering in your picture?
2. **Top-right button:** "Get Juice" (goes to Locations) or "Order Now" (needs an ordering page or link)?
3. **Hero button colour:** black (now) or blue (your picture)?
4. **Farm background:** is the current blend right, or should it be stronger, lighter, or use different photographs? Should Locations and the footer get the same layered grass-and-stall treatment as the hero?
5. **Realistic rabbit:** is the rabbit from the concept picture the one you want finished in high quality, or should its look change (fur colour, hoodie, expression)?
6. **Flavours:** are the four names final? What is in each?
7. **Footer lines:** are "Come get your juice." and "Good drinks, good days" approved?
8. **Locations:** real addresses, or keep "Coming soon" for launch?

---

## 6. Quality checks (latest build)

| Check | Result |
|---|---|
| Screenshots at 1440, 1280, 1024, 768, 390, 375, 320 | no layout problems |
| Automated accessibility (axe) | passes |
| Keyboard navigation, touch targets | pass |
| Reduced motion, no-3D fallback | pass |
| Desktop speed | first paint 0.3 s, 60 frames per second |
| Slowed-down phone | first paint 1.0 s, 56 frames per second |
| Vercel web-interface guideline review | done on the earlier build, **not repeated** on the new market sections |

Known limits: the product pictures are soft up close; the phone speed test varies between runs on this computer.

---

## 7. Image sources

- **Your material:** branding PDF (logo, line-art rabbit, colours), five brand photographs, the farmers-market concept picture.
- **Stock photographs (Pexels, free for commercial use, no credit required):** meadow by Mike Bird, grass by Engin Akyurt, produce stall by Tamira Kanemägi, pasture by Linda Kokina. Originals in `design/references/field/`.
- **Reference only, not used on the site:** the Peter Rabbit film posters, the smoothie photographs from other brands, the Fizzi and Lusion websites.

---

## 8. How to write your changes

For each change, give the section name from part 2 and what you want, for example:
"Hero: make the button blue." / "Stall: change Blue Rush description to …" / "Locations: add …".
Pictures are welcome, but please send the file itself, not only a screenshot in chat.

---

## 9. Update: Blender and guideline phase (1 October, afternoon)

**New**
- The four drinks outside the hero (stage, stall, tour, story) are now **rendered in Blender**:
  real glass, marbled smoothie, the official RUS RUSS print, condensation, fruit, daylight and
  a ground shadow. They are sharp at full size. Scenes: `blender/scenes/`, script:
  `blender/make_drink.py`, how it works: `blender/README.md`.
- The table now slides in under the cup as it travels down from the hero, and the loose fruit
  gathers where it lands. On a flavour change the fruit and table react on the same beat as the cup.
- The Vercel guideline review was repeated on the market sections; the findings were fixed and
  the deliberate exceptions are listed at the end of `DESIGN.md`.
- Flavour descriptions on the kraft labels now follow the placeholder rule (hidden on the live
  site until confirmed).
- Audit of what is done and what is missing: `design/GAP-AUDIT.md`.

**Still not final**
- Hero rabbit and hero cup: still cut from the concept picture. Blender does not make the
  rabbit; it needs a character artist or a high-resolution original.
- The Blender drinks are good renders, not photographs: the mango pieces and strawberries are
  the weakest parts.
- The fruit shown with each flavour copies the concept picture, not a confirmed recipe.
- No real rotation of the cup, no splash outside the hero, loose fruit still cut from the concept.

**Checks on this build:** screenshots clean at seven widths; accessibility, keyboard, touch,
reduced motion and no-3D pass; desktop first paint 0.3 s at 59 to 60 fps; slowed-down phone
first paint 0.9 s at 55 fps. Images total about 3.4 MB on desktop and 2.6 MB on a phone.

---

## 10. Update: hero product phase (1 October, evening)

**Completed**
- The hero product is now a Blender render for **all four flavours**, each its own drink
  (not a recolour), on independent layers: the product, the splash, the fruit at the foot.
- The rabbit is separated from the cup: its body is drawn behind the product and its paw in
  front, so each layer can move on its own.
- Fruit rebuilt: strawberries with real seeds in dimples, separate leaves, graded colour and
  cut faces; hand-cut mango and pineapple with varied colour; ice with a cloudy heart.
- The site loads each flavour's own pictures; nothing is recoloured in code.

**Temporary**
- **The rabbit** is still the one cut from the concept picture. The hero is not complete
  until an original realistic rabbit replaces it (two files, see
  `public/assets/hero/layers/README.md`).
- Loose fruit on the stage, the "Juices" sign, the chalkboard and the market edges are still
  cut from the concept picture. The farm background is stock photography.

**Remaining:** see the final report for this phase; in short, the rabbit, then a more natural
splash, then the remaining concept cut-outs.

**Checks:** assets validate; screenshots clean at seven widths; accessibility, keyboard,
reduced motion and no-3D pass; desktop 53 fps, slowed-down phone 53 fps scrolling and 41 fps
while switching flavours. Images now total about 4.0 MB on desktop and 3.2 MB on a phone.

---

## 11. Update: product art direction pass (1 October, night)

References used: the stacked-cups picture with drips (`design/references/market/5.png`) for
product presentation, and the six-drinks grid (`design/references/market/6.png`) for the
collection. Art direction only; nothing copied. No new reference files arrived with the brief,
so these two earlier ones were taken to be the ones meant.

**Changed**
- **Splash** rebuilt as liquid: a rippled sheet with a thick rim tearing into fingers, beads,
  drops of different sizes and a fine spray, fused into one body. Each flavour has its own.
- **Drips**: smoothie now runs over the rim and down the outside of the cup.
- **Mango** and **Tropical** read as thick blended fruit: grainy pulp, fibres, almost no
  light passing through, darker toward the foot.
- **Ice** is slightly frosted with a cloudy heart; the dark and coloured reflections are gone.
- **Hero scale**: on desktop the product is about a third larger and is cut by the right edge
  and the awning; the hand-written notes moved to its left. Tablet and phone are composed
  separately.
- **Flavour section**: a heading ("Take your pick."), the four drinks larger and at one scale.
- **Supporting drinks** (stage, stall, tour) re-rendered with the same recipes and the
  improved fruit, so heroes and drinks are one family.

**Still temporary:** the rabbit; the loose fruit on the stage, the sign, chalkboard and market
edges; the stock farm photographs.

**Checks:** assets validate; screenshots clean at seven widths; accessibility, keyboard,
reduced motion and no-3D pass; desktop 56 fps, slowed-down phone 53 fps scrolling and 42 fps
switching flavours; images about 3.8 MB desktop, 3.1 MB phone.
