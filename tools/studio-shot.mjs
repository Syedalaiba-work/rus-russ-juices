// Quick look at the 3D cup on the page background, for art-directing lib/cupScene.ts.
//   node tools/studio-shot.mjs [flavour-id] [--base http://localhost:3000]
import { chromium } from 'playwright'
const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3000'
const id = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--base') || 'blue-rush'
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11'] })
const page = await browser.newPage({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 1.5 })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(`${base}/studio?flavour=${id}`, { waitUntil: 'networkidle' })
await page.waitForSelector('#studio[data-ready="true"]', { timeout: 30000 }).catch(() => errors.push('scene never became ready'))
await page.waitForTimeout(400)
await page.locator('#studio').screenshot({ path: `design/shots/studio_${id}.jpg`, type: 'jpeg', quality: 88 })
errors.forEach((e) => console.log('error:', e.slice(0, 300)))
await browser.close()
console.log(`design/shots/studio_${id}.jpg`)
