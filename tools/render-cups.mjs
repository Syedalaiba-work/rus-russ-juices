// Photographs the 3D cup for each flavour into public/brand/cups, with a transparent
// background. Run against a running build whenever lib/cupScene.ts or the range changes.
//   node tools/render-cups.mjs [--base http://localhost:3000]
import { chromium } from 'playwright'
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3000'
const FLAVOURS = ['berry-blast', 'blue-rush', 'mango-madness', 'tropical-mix']
// keep in step with cupImage() in lib/data.ts
const VERSION = 'v7'
await mkdir('public/brand/cups', { recursive: true })

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11'] })
const page = await browser.newPage({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 2 })
// two pictures of each: the hero product (with the hero's rabbit), and the drink alone
for (const [id, suffix, query] of FLAVOURS.flatMap((f) => [[f, '', ''], [f, '-drink', '&rabbit=0']])) {
  await page.goto(`${base}/studio?flavour=${id}${query}`, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: 'html, body { background: transparent !important } .skip { display: none }' })
  await page.waitForSelector('#studio[data-ready="true"]', { timeout: 30000 })
  await page.waitForTimeout(300)
  const png = await page.locator('#studio').screenshot({ omitBackground: true })
  await sharp(png).resize({ width: 990 }).png({ compressionLevel: 9, palette: false }).toFile(`public/brand/cups/${id}${suffix}-${VERSION}.png`)
  console.log(`rendered ${id}${suffix}`)
}
await browser.close()
