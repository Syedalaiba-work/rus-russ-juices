# Production artwork: what is here and what is still needed

## Status, 1 October 2026

| Layer | File | Status |
|---|---|---|
| Hero product, per flavour | `layers/<flavour>/4-hero.webp` | **production**: Blender render (`blender/make_hero.py`) |
| Splash, per flavour | `layers/<flavour>/1-splash-back.webp` | **production**: Blender render |
| Fruit and ice at the foot, per flavour | `layers/<flavour>/5-fruit-front.webp` | **production**: Blender render |
| Drink alone, per flavour (stage, stall, tour) | `layers/<flavour>/3-cup.webp` | **production**: Blender render (`blender/make_drink.py`) |
| Rabbit, behind the product | `layers/shared/2-rabbit-back.webp` | **TEMPORARY**: cut from the concept picture (`tools/cut_rabbit.py`) |
| Rabbit, in front (its paw on the cup) | `layers/shared/4-rabbit.webp` | **TEMPORARY**: cut from the concept picture |

**The one piece of artwork still needed is the rabbit:** an original, realistic RUS RUSS rabbit,
delivered as the two rabbit files above. Everything else is rendered.

## How the hero is put together

Back to front. Each layer is its own picture, so each can move on its own.

| Order | Layer | Hero only? |
|---|---|---|
| 1 | `1-splash-back` the splash leaving the cup | yes |
| 2 | `2-rabbit-back` the rabbit | yes |
| 3 | `3-cup` the drink alone | no: it is what the hero product turns into as it travels to the stall |
| 4 | `4-hero` the hero product: cup, smoothie, ice, fruit on top, straw | yes |
| 5 | `4-rabbit` whatever of the rabbit is in front of the cup | yes |
| 6 | `5-fruit-front` fruit and ice at the foot | yes |

A layer in `layers/shared/` is used by every flavour that does not have its own.

## Canvas (the rule that matters most)

- **Every file is the same canvas: 1400 x 1656 px, portrait, transparent background.**
- Work at 2100 x 2484 or 2800 x 3312 and bring it down; keep the masters.
- Everything is drawn **where it sits in the finished hero picture**. Do not crop a file to its
  contents. Stacked in order, the layers must make the finished hero product.
- Registration guide: `_templates/hero-guide_1400x1656.png` (the current hero, ghosted, with
  the lines below).

Registration of the current composition (rabbit on the left with an arm round the cup, cup
leaning 6 degrees to the right, splash leaving to the upper right):

| Guide | Position on the 1400 x 1656 canvas |
|---|---|
| centre of the cup's base | x 738, y 1355 |
| centre of the cup's rim | x 802, y 772 |
| rim, across | about 466 px |
| ground line at the front fruit | about y 1440 |
| top of the rabbit's ears | about y 425 |
| the rabbit's paw on the cup | about x 560, y 1085 |
| safe margin | 40 px on every side |

(The earlier guide numbers, cup centre x 680 and rim y 755/835, belonged to the previous hero
with the rabbit sitting in the cup. The composition changed with the farmers-market concept;
the numbers above are the ones the site is built on now.)

## The rabbit (still to be made)

- An **original** realistic interpretation of the RUS RUSS rabbit: realistic fur, believable
  anatomy, expressive but natural, in the blue RUS RUSS hoodie.
- Not Peter Rabbit, not any existing character, not another brand's rabbit. The film stills in
  `design/references/mascot/` are a reference for fur, cloth and light only.
- Lit like the product: soft daylight, key from the upper left, a rim light from behind.
- Pose: beside the cup on its left, one arm round it. Head and ears clear of the rim.
- Two files, same canvas:
  - `2-rabbit-back.webp`: the whole rabbit **except** what is in front of the cup. It is drawn
    behind the cup, so it can simply run on behind it; do not cut it to the cup's edge.
  - `4-rabbit.webp`: only what is in front of the cup (the paw and forearm that hold it).
- It must work against all four drinks: the cup is identical in each.
- The rabbit appears in the hero only. The official line-art rabbit is used everywhere else.

## Format

| | |
|---|---|
| File type | WebP with alpha, quality about 90 (PNG also accepted) |
| Colour | sRGB, 8-bit |
| Alpha | straight (not premultiplied), clean edge, no white or coloured fringe |
| Background | none. No backdrop, no floor, no gradient, no glow that fades into a colour |
| Shadow | none cast on the ground; the page adds its own. Contact shadows **inside** the product (rabbit on cup, fruit on fruit) stay |
| Text | none except the RUS RUSS mark on the cup and on the hoodie. No flavour names, claims or labels |
| File size | hero product and drink: 450 kB or less. Rabbit: 350 kB or less. Splash, fruit: 250 kB or less each |

## Camera and light (the same for all five)

- **Camera:** straight on to the cup, looking very slightly down (about 10 degrees), so a thin
  ellipse of the rim shows. Long-lens look (about 85 mm): no wide-angle distortion.
- **Crop:** the whole product in frame, including both ears, the straw, the splash and the fruit
  at the foot. Nothing cut off by the edge.
- **Light:** soft daylight. Key light from the upper left, broad and soft; white fill from the
  right; a gentle rim light from behind so the cup and the fur separate from a light page.
  Neutral white balance. Nothing moody, no coloured gels, no dark reflections.
- **Consistency:** one set-up for all four drinks and the rabbit. The rabbit is lit by the same
  light as the cup it sits with.

## Stills

Made by `tools/place_hero.py` (hero stills) and `tools/place_renders.py` (drinks, cards).

| File | Size | What |
|---|---|---|
| `stills/<flavour>.webp` | 1980 x 2340, transparent, 600 kB or less | the finished hero product, rabbit included |
| `drinks/<flavour>.webp` | 1980 x 2340, transparent, 600 kB or less | the drink alone (stage, tour) |
| `cards/<flavour>.webp` | 900 x 900, transparent, 150 kB or less | the small picture on cards and the menu, product on the bottom edge |

## After the files are in

1. `npm run assets` lists what was found and warns about anything off-spec.
2. `python tools/place_hero.py` to rebuild the flattened stills with the new rabbit, then `npm run build`.
3. Final QA (DESIGN.md, "Final QA"): screenshots at 1440, 1280, 1024, 768, 390, 375, 320;
   accessibility; keyboard; touch; reduced motion; no WebGL; performance; and the hero compared
   side by side with `design/approved/01-clean-classic.png`.
