import manifest from '@/public/assets/hero/manifest.json'

// The slots for authored hero artwork. Every slot is empty (null) until a file is supplied;
// an empty slot means the scene uses its built-in stand-in for that part.
// To fill a slot: put the file under public/assets/hero/ and write its path (relative to that
// folder) into manifest.json. Nothing else changes. The full spec is in
// public/assets/hero/README.md.
export type FruitKind = 'blueberry' | 'strawberry' | 'mango' | 'slice'
// back to front
// The hero is built from independent layers, so each can move on its own:
//   rabbitBack  the rabbit, behind the product      hero        the hero product (cup, ice, toppings)
//   rabbit      what of the rabbit is in front      fruitFront  fruit and ice at the foot
//   splashBack  the splash leaving the cup
// When a flavour has a "hero" layer, every layer except "cup" belongs to the hero only: they
// fade as the product travels on, and "cup" (the drink alone) takes over.
export const LAYER_ORDER = ['splashBack', 'fruitBack', 'rabbitBack', 'cup', 'hero', 'rabbit', 'fruitFront', 'splashFront'] as const
export type LayerName = (typeof LAYER_ORDER)[number]
type PerFlavour<T> = Record<string, T>

export type HeroAssets = {
  version: number
  /** The cup, with everything inside it: plastic, juice, packed ice, straw, leaves. GLB. */
  cup: { model: string | null }
  /** Optional surface detail for the stand-in juice. Texture. Unused once cup.model is set. */
  liquid: { normal: string | null }
  /** One loose ice cube. GLB. */
  ice: { model: string | null }
  /** One piece of each fruit. GLB. */
  fruit: Record<FruitKind, string | null>
  /** Either one mesh that is tinted per flavour (GLB), or a pair of transparent images per flavour. */
  splash: { model: string | null; sprites: PerFlavour<{ back: string; front: string } | null> }
  /** The rabbit in the cup: a model (GLB), or one transparent cut-out image, or one cut-out per flavour. */
  rabbit: { model: string | null; image: string | null; poses: PerFlavour<string | null> }
  /** The mark on the stand-in rabbit's chest. Texture. Part of rabbit.model once that is set. */
  hoodie: { print: string | null }
  /** The brand's own wordmark artwork. Transparent image or SVG. `cup` is what is printed on the cup (defaults to `black`). */
  wordmark: { black: string | null; white: string | null; cup: string | null }
  /**
   * The hero product as flat artwork, in registered layers, per flavour ("shared" holds any
   * layer that is the same for every flavour, usually the rabbit). Filled in by
   * tools/scan-hero-assets.mjs from the files in layers/. A flavour with a cup layer is
   * drawn from its layers instead of the 3D stand-in.
   */
  layers: PerFlavour<Partial<Record<LayerName, string>>>
  /** The finished hero product per flavour, as a still: first paint and every fallback. */
  stills: PerFlavour<string | null>
  /** The drink alone per flavour, as a still: everywhere outside the hero (the realistic rabbit is hero only). */
  drinks: PerFlavour<string | null>
  /** The small product picture on each flavour card. */
  cards: PerFlavour<string | null>
}

export const HERO_ASSETS = manifest as HeroAssets

// Every hero picture carries the revision of the asset set in its URL. The browser keeps the
// optimised stills for hours; without this, a still from an earlier set (another size, another
// position) can be shown next to the current live layers: the rabbit twice.
const REV = (manifest as { rev?: string }).rev
export const heroAsset = (path: string | null | undefined) => (path ? `/assets/hero/${path}${REV ? `?v=${REV}` : ''}` : null)
