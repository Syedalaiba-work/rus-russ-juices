import { HERO_ASSETS, heroAsset } from '@/lib/heroAssets'

// Site content.
// Nothing here is a confirmed fact unless it says so. Lines taken from the branding PDF are
// marked BRAND. Everything marked PLACEHOLDER came from the concept artwork or was written as
// a stand-in; on the page it is wrapped in <Placeholder> (lib/placeholder.tsx), which tags it
// in review builds and removes it in production.

// BRAND: from the branding PDF.
export const BRAND = {
  name: 'RUS RUSS',
  claim: 'UK’s Juice Brand',
  sub: 'Serving the best in UK.',
  motto: 'Good drinks, good days',
}

// PLACEHOLDER: the three hero stats are copied from the concept artwork. They are claims
// about the product and the business and have not been verified.
export const STATS = [
  { strong: '100%', label: 'Real Fruits' },
  { strong: '4', label: 'Unique Flavours' },
  { strong: 'UK', label: 'Locations' },
]

// PLACEHOLDER: from the concept artwork. Describes the company; not verified.
export const STORY = 'RUS\u00a0RUSS is a juice brand bringing real fruits, bold flavours and good vibes to the UK. It’s a community, a lifestyle and a different kind of energy.'

// No truck stops, addresses or hours have been supplied, and none are invented. Until this
// list has entries the Locations section shows its "Coming soon" state.
export type Place = { name: string; address: string; hours: string; map?: string }
export const PLACES: Place[] = []

export type Fruit = 'strawberry' | 'blueberry' | 'mango' | 'tropical'
// color: the juice where light comes through it. deep: the juice where it is thick.
export type Flavour = { id: string; name: string; line: string; color: string; deep: string; soft: string; fruit: Fruit }

// PLACEHOLDER, all of it. The four names are the ones on the approved concept's cards. The
// one-liners are from another concept tile and describe what is in each drink, which has not
// been confirmed. The colours are taken from the drinks pictured in the approved concept,
// and the fruit shown around the cup in 3D is guessed from the names. None of this is the real range until the brand supplies it.
export const FLAVOURS: Flavour[] = [
  { id: 'berry-blast', name: 'Berry Blast', line: 'Fresh strawberries with a bold twist.', color: '#f0314f', deep: '#a90f2b', soft: '#fde1e6', fruit: 'strawberry' },
  { id: 'blue-rush', name: 'Blue Rush', line: 'Blueberry coolness in every sip.', color: '#1fa4ff', deep: '#0b74e6', soft: '#dcecfb', fruit: 'blueberry' },
  { id: 'mango-madness', name: 'Mango Madness', line: 'Tropical mango, pure madness.', color: '#ffc21a', deep: '#f59e00', soft: '#fdf0c6', fruit: 'mango' },
  { id: 'tropical-mix', name: 'Tropical Mix', line: 'A mix of tropical favourites.', color: '#ff7a24', deep: '#e2520c', soft: '#fde3d6', fruit: 'tropical' },
]

// The menu. One category today, holding the placeholder range above. A real menu is added
// by filling this in: more categories, and per item an optional price, ingredients line and
// tag. Anything left out is simply not shown; nothing here is invented.
export type MenuItem = { flavour: string; price?: string; ingredients?: string; tag?: string }
export type MenuCategory = { id: string; name: string; items: MenuItem[] }
export const MENU: MenuCategory[] = [{ id: 'juices', name: 'Juices', items: FLAVOURS.map((f) => ({ flavour: f.id })) }]

// Blue Rush is the cup in the approved hero.
// Berry Blast is the drink in the farmers-market reference picture, so it is what the hero opens on.
export const DEFAULT_FLAVOUR = 0

// SLOT stills / cards: an authored still is used when the manifest declares one; until then
// the still is a photograph of the stand-in 3D scene (tools/render-cups.mjs). The version is
// part of that file name so a re-shoot is never served from an image cache; bump it here and
// in the script together.
export const cupImage = (id: string) => heroAsset(HERO_ASSETS.stills[id]) ?? `/brand/cups/${id}-v7.png`
// The drink alone, without the hero's realistic rabbit: what every place outside the hero shows.
export const drinkImage = (id: string) => heroAsset(HERO_ASSETS.drinks?.[id]) ?? `/brand/cups/${id}-drink-v7.png`
export const cardImage = (id: string) => heroAsset(HERO_ASSETS.cards[id]) ?? drinkImage(id)
export const hasCardArt = (id: string) => !!HERO_ASSETS.cards[id]
// Pre-rendered cups are 660 x 780, the same 9.3 : 11 frame the live 3D scene uses.
export const CUP_SIZE = { width: 660, height: 780 }

// Artwork sizes, so every image reserves its space.
export const RABBITS = {
  hero: [997, 1741],
  run: [596, 472],
  jump: [512, 643],
  sit: [423, 629],
  stand: [430, 682],
  sleep: [568, 380],
  drink: [417, 579],
  tumble: [627, 390],
  shades: [460, 594],
  box: [446, 522],
  back: [332, 519],
  pounce: [495, 439],
  flop: [600, 340],
} as const

export type Pose = keyof typeof RABBITS

// The sticker cut of each pose has a white border on every side.
export const rabbit = (pose: Pose, sticker = false) => {
  const [w, h] = RABBITS[pose]
  const pad = sticker ? (pose === 'hero' ? 60 : 40) : 0
  return { src: `/brand/rabbits/${pose}${sticker ? '-sticker' : ''}.png`, width: w + pad, height: h + pad }
}

// The twelve poses on the brand's "Multi Variations" sheet, in sheet order. They carry no
// captions: the brand has not named or described them, and none are invented here.
export const POSES: Pose[] = ['run', 'jump', 'sit', 'stand', 'sleep', 'drink', 'tumble', 'shades', 'box', 'back', 'pounce', 'flop']

// The four beats of the story walk. Captions only say what is pictured; the company's story
// itself is the STORY placeholder above until confirmed.
export const STORY_BEATS: { word: string; brand?: boolean }[] = [{ word: 'Fruit.' }, { word: 'Market.' }, { word: 'Juice.' }, { word: 'RUS RUSS.', brand: true }]

export const PHOTOS = {
  bags: { src: '/brand/photos/bags.jpg', width: 1509, height: 1042, alt: 'White and blue RUS RUSS paper bags printed with the rabbit' },
  cup: { src: '/brand/photos/cup.jpg', width: 786, height: 982, alt: 'A RUS RUSS cup of ice balanced on a cap' },
  truck: { src: '/brand/photos/truck.jpg', width: 1470, height: 1070, alt: 'The blue RUS RUSS juice truck covered in rabbit illustrations' },
  storefront: { src: '/brand/photos/storefront.jpg', width: 1495, height: 1052, alt: 'The blue RUS RUSS shopfront' },
} as const

export const NAV = [
  { href: '#top', label: 'Home' },
  { href: '#products', label: 'Flavours' },
  { href: '#story', label: 'Our Story' },
  { href: '#world', label: 'Brand World' },
  { href: '#locations', label: 'Locations' },
]
