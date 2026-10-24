# RUS RUSS Juices

The website for **RUS RUSS Juices**: a UK juice brand presented as a playful British farmers'
market. Next.js (App Router), plain CSS, GSAP + ScrollTrigger + Lenis for scroll motion, and a
single plain three.js canvas that carries the product from section to section.

> Status: the site is complete and working. Some artwork is temporary and some copy is
> placeholder; see [REPORT.md](REPORT.md) for the full status and what is still needed from the brand.

## Run it

Requires Node.js 20 or later.

```
npm install
cp .env.example .env.local   # optional: a review build that shows placeholder copy, tagged
npm run dev                  # http://localhost:3000
```

Production build:

```
npm run build
npm start                    # http://localhost:3000   (or: npx next start -p 3100)
```

`npm run dev` and `npm run build` first run `tools/scan-hero-assets.mjs`, which finds the hero
artwork in `public/assets/hero/`, writes `manifest.json` and warns about any off-spec file.

## Deploy

Any Node host that runs Next.js works. On Vercel: import the repository, keep the defaults
(framework Next.js, build `npm run build`), and leave `NEXT_PUBLIC_SHOW_PLACEHOLDERS` unset so
unconfirmed copy is left out of the public site.

## The page

Hero (the RUS RUSS rabbit with the Berry Blast cup, in a field behind a market stall) · flavour
stage · "Take your pick" stall · Our Story (fruit, market, juice, RUS RUSS) · wordmark band ·
brand world · juice tour · "One rabbit. Twelve poses." · locations · footer.

## Where things are

| Path | What |
|---|---|
| `DESIGN.md` | The design system: references and their order of authority, colours, type, market components, product art direction, motion, accessibility. Read this first. |
| `REPORT.md` | Status report: what is done, temporary, placeholder; decisions needed. |
| `app/page.tsx`, `app/globals.css`, `app/layout.tsx` | Markup, every section's styles, fonts and metadata. |
| `components/` | `Scene` (the 3D canvas), `Flavours` (stage, stall, tour), `Motion` (scroll choreography), `Backdrop` (shader gradient), `Doodles` (hand-drawn fruit). |
| `lib/data.ts` | Copy, flavours, navigation. Unconfirmed copy is wrapped in `Placeholder`. |
| `lib/flavour.ts` | The picked flavour, shared by every section and mirrored to `?flavour=`. |
| `lib/cupScene.ts`, `lib/heroAssets.ts`, `lib/heroAssetLoader.ts` | The 3D scene and the layered hero artwork it draws. |
| `public/assets/hero/` | Hero and drink artwork, with the delivery spec for final artwork (`README.md`, `layers/README.md`). |
| `public/assets/market/` | Market pieces, fruit, farm photographs. |
| `public/brand/` | The brand's own photographs and line-art rabbit poses. |
| `blender/` | Scripted Blender (Cycles) product renders: scripts, scenes, renders. See `blender/README.md`. |
| `tools/` | Asset scripts (cutting artwork, placing renders, extracting the wordmark) and the QA scripts. |
| `design/approved/`, `design/brand-pdf/` | The approved concepts and the rendered brand guidelines. |
| `design/archive/` | Earlier hero and drink artwork and code snapshots, kept so any approved state can be restored. |
| `design/blender/`, `design/editorial-archive/` | Earlier Blender drinks; captures from the first (Editorial) build. |

## QA

These need a running build (`npm start`, or pass `--base http://localhost:3100`).

```
npm run typecheck
npm run shots      # every section at 1440, 1280, 1024, 768, 390, 375 and 320 into design/shots
npm run a11y       # axe (WCAG 2.2 AA), keyboard, touch, reflow, reduced motion, idle, no-WebGL
npm run perf       # LCP, layout shift, frame rate while scrolling and switching flavours
npm run compare    # the hero beside the approved reference
```

The QA scripts use Playwright: run `npx playwright install chromium` once.

## Blender

Product renders are made with Blender 5.2 from scripts, headless:

```
blender -b --python blender/make_drink.py -- <flavour> blender/out/<flavour>.png 160 120
python tools/place_renders.py
```

See `blender/README.md`. The live site currently uses the drinks cut from the concept picture;
the Blender renders are kept in `blender/out/` and `design/archive/`.

## Not in this repository

Third-party reference material used during design is kept locally and not redistributed: film
posters used as a fur and lighting reference, other brands' product photographs, screenshots of
other websites, and the raw stock photographs (the site uses processed derivatives, credited in
`DESIGN.md`). Blender's automatic `.blend1` backups and generated QA screenshots are not
committed either.

## Credits

Farm photographs: Pexels, by Mike Bird, Linda Kokina, Engin Akyurt and Tamira Kanemägi (Pexels
licence). Everything else is the brand's own material or made for this project.
