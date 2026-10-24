// Visual QA sheet: the approved Clean Classic tile on the left, this build's hero on the right.
//   node tools/compare.mjs [--shots design/shots]
// The approved design is a single hero image, so that is what can be compared like for like;
// the right side shows the first screen and the cards row of the 1440 capture.
import sharp from 'sharp'

const args = process.argv.slice(2)
const shots = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : 'design/shots'
const H = 900

const ref = await sharp('design/approved/farmers-market-reference.png').resize({ height: H }).toBuffer()
const hero = await sharp(`${shots}/1440_01-hero.jpg`).resize({ height: H }).toBuffer()
const cards = await sharp(`${shots}/1440_02-cards.jpg`).resize({ height: H }).toBuffer()
const w = async (buf) => (await sharp(buf).metadata()).width
const [rw, hw, cw] = [await w(ref), await w(hero), await w(cards)]

const sheet = await sharp({ create: { width: rw + hw + cw + 24, height: H, channels: 3, background: '#ff00aa' } })
  .composite([
    { input: ref, left: 0, top: 0 },
    { input: hero, left: rw + 12, top: 0 },
    { input: cards, left: rw + hw + 24, top: 0 },
  ])
  .jpeg({ quality: 84 })
  .toBuffer()
await sharp(sheet).resize({ width: 1900 }).toFile(`${shots}/compare_hero.jpg`)
console.log(`wrote ${shots}/compare_hero.jpg`)
