// Finds artwork dropped into public/assets/hero/ and switches it on in manifest.json, so
// supplying artwork is: put the files in the right folder, rebuild. Runs before dev and build.
//   layers/<flavour>/1-splash-back.webp … 6-splash-front.webp   (and layers/shared/ for any layer all flavours share)
//   stills/<flavour>.webp        drinks/<flavour>.webp        cards/<flavour>.webp
// It also checks what it finds against the spec in layers/README.md and prints a warning for
// anything that is the wrong size, has no transparency or is over its file-size budget.
// Slots it does not manage (models, wordmark, rabbit poses) are left exactly as they are.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
import { createHash } from 'node:crypto'

const root = 'public/assets/hero'
const file = `${root}/manifest.json`
const manifest = JSON.parse(readFileSync(file, 'utf8'))
const images = /\.(webp|png|avif)$/i
const LAYERS = { 'splash-back': 'splashBack', 'fruit-back': 'fruitBack', 'rabbit-back': 'rabbitBack', cup: 'cup', hero: 'hero', rabbit: 'rabbit', 'fruit-front': 'fruitFront', 'splash-front': 'splashFront' }

const layers = {}
if (existsSync(`${root}/layers`)) {
  for (const dir of readdirSync(`${root}/layers`, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const found = {}
    for (const name of readdirSync(`${root}/layers/${dir.name}`).filter((n) => images.test(n))) {
      // "3-cup.webp" -> cup; the leading number is only there to keep the files in stacking order
      const key = LAYERS[name.replace(images, '').replace(/^\d+-/, '')]
      if (key) found[key] = `layers/${dir.name}/${name}`
    }
    if (Object.keys(found).length) layers[dir.name] = found
  }
}
manifest.layers = layers

manifest.drinks ??= Object.fromEntries(Object.keys(manifest.stills).map((id) => [id, null]))
for (const slot of ['stills', 'drinks', 'cards']) {
  const present = existsSync(`${root}/${slot}`) ? readdirSync(`${root}/${slot}`).filter((n) => images.test(n)) : []
  for (const id of Object.keys(manifest[slot])) {
    const hit = present.find((n) => n.replace(images, '') === id)
    manifest[slot][id] = hit ? `${slot}/${hit}` : null
  }
}

// the revision of the whole set: changes whenever any hero picture changes
const everything = [
  ...Object.values(layers).flatMap((set) => Object.values(set)),
  ...['stills', 'drinks', 'cards'].flatMap((slot) => Object.values(manifest[slot]).filter(Boolean)),
].sort()
const hash = createHash('sha1')
for (const p of everything) {
  const st = statSync(`${root}/${p}`)
  hash.update(`${p}:${st.size}:${Math.round(st.mtimeMs)}`)
}
manifest.rev = hash.digest('hex').slice(0, 10)
writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n')

// [width, height, budget in kB]
const SPEC = { layers: [1400, 1656, 450], stills: [1980, 2340, 600], drinks: [1980, 2340, 600], cards: [900, 900, 150] }
const found = [
  ...Object.values(layers).flatMap((set) => Object.values(set).map((p) => ['layers', p])),
  ...['stills', 'drinks', 'cards'].flatMap((slot) => Object.values(manifest[slot]).filter(Boolean).map((p) => [slot, p])),
]
for (const [slot, path] of found) {
  const [w, h, kb] = SPEC[slot]
  const meta = await sharp(`${root}/${path}`).metadata()
  const size = statSync(`${root}/${path}`).size / 1024
  const notes = []
  if (Math.abs(meta.width / meta.height - w / h) > 0.004) notes.push(`is ${meta.width}x${meta.height}, should be ${w}x${h} (wrong shape: it will be stretched)`)
  else if (meta.width < w) notes.push(`is ${meta.width}x${meta.height}, smaller than ${w}x${h} (will look soft)`)
  if (!meta.hasAlpha) notes.push('has no transparency')
  if (size > kb) notes.push(`is ${Math.round(size)} kB, over the ${kb} kB budget`)
  notes.forEach((n) => console.warn(`  warning: ${path} ${n}`))
}
const sets = Object.entries(layers).map(([k, v]) => `${k} (${Object.keys(v).length})`)
console.log(`hero assets: layers ${sets.length ? sets.join(', ') : 'none'}; stills ${Object.values(manifest.stills).filter(Boolean).length}/4; cards ${Object.values(manifest.cards).filter(Boolean).length}/4`)
