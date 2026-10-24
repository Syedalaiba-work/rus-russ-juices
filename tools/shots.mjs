// Playwright visual QA. Captures the same named stops on any build of the page, so the
// implementation can be compared against the approved reference section by section.
//   node tools/shots.mjs --base http://localhost:3000 --path / --out design/shots [--viewport 390] [--reduced]
// Stops are addressed by section selector, not page percentage, because pinned sections
// make page height differ between builds.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const base = opt('base', 'http://localhost:3000')
const path = opt('path', '/')
const out = opt('out', 'design/shots')
const only = opt('viewport', '')
const reduced = args.includes('--reduced')

// [name, selector, offset in viewport heights, offset as a fraction of the section's pinned travel]
const STOPS = [
  ['01-hero', '.hero', 0, 0],
  ['02-cards', '.cards', -0.62, 0],
  ['03-glide', '.stage-wrap', -0.45, 0],
  ['04-stage', '.stage-wrap', 0, 0],
  ['05-stage-held', '.stage-wrap', 0, 0.6],
  ['05b-menu', '.drinks', 0, 0],
  ['05c-stall', '.stall', -0.55, 0],
  ['06-story', '.story', -0.12, 0],
  ['07-world', '.world', 0, 0],
  ['08-world-mid', '.world', 0.75, 0],
  ['09-tour', '.tour-wrap', 0, 0.1],
  ['10-tour-mid', '.tour-wrap', 0, 0.62],
  ['11-moods', '.moods', 0, 0],
  ['12-moods-mid', '.moods', 0, 0.5],
  ['13-locations', '.locations', -0.1, 0],
  ['14-footer', '.footer', 0, 0],
  ['15-end', '.footer', 5, 0],
]

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024, hasTouch: true },
  { name: '390', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: '375', width: 375, height: 667, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: '320', width: 320, height: 568, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
].filter((v) => !only || only.split(',').includes(v.name))

await mkdir(out, { recursive: true })
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11'] })
let problems = 0

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor || 1,
    isMobile: !!vp.isMobile,
    hasTouch: !!vp.hasTouch,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  const issues = []
  page.on('console', (m) => m.type() === 'error' && issues.push(`console: ${m.text()}`))
  page.on('pageerror', (e) => issues.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => issues.push(`failed: ${r.url()}`))
  page.on('response', (r) => r.status() >= 400 && issues.push(`${r.status()}: ${r.url()}`))

  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3200)

  // Measure every stop once, at the top of the page, before anything is pinned.
  const targets = await page.evaluate((stops) => {
    const vh = window.innerHeight
    const max = document.documentElement.scrollHeight - vh
    return stops.map(([name, selector, vhOffset, travel]) => {
      const el = document.querySelector(selector)
      if (!el) return { name, missing: true }
      const box = el.closest('.pin-spacer') || el
      const top = box.getBoundingClientRect().top + window.scrollY
      const pinned = Math.max(0, box.offsetHeight - vh)
      return { name, y: Math.max(0, Math.min(max, Math.round(top + vhOffset * vh + travel * pinned))) }
    })
  }, STOPS)

  for (const t of targets) {
    if (t.missing) continue
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), t.y)
    await page.waitForTimeout(t.y === 0 ? 400 : 1900)
    await page.screenshot({ path: `${out}/${vp.name}_${t.name}.jpg`, type: 'jpeg', quality: 78 })
  }

  // The whole page in one image. Taken with motion reduced, so nothing is pinned or
  // half-revealed and every section is in its finished state.
  const still = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, reducedMotion: 'reduce' })
  const whole = await still.newPage()
  await whole.goto(base + path, { waitUntil: 'networkidle' })
  await whole.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo(0, 0)
  })
  await whole.waitForTimeout(600)
  await whole.screenshot({ path: `${out}/${vp.name}_00-full-page.jpg`, type: 'jpeg', quality: 70, fullPage: true })
  await still.close()

  const overflow = await page.evaluate(() => {
    const w = document.documentElement.clientWidth
    return { wide: document.documentElement.scrollWidth > w + 1, scrollWidth: document.documentElement.scrollWidth, clientWidth: w, height: document.documentElement.scrollHeight }
  })
  if (overflow.wide) issues.push(`horizontal overflow: scrollWidth ${overflow.scrollWidth} > ${overflow.clientWidth}`)
  console.log(`${vp.name}: ${issues.length ? 'ISSUES' : 'ok'} (page height ${overflow.height}px)`)
  issues.forEach((i) => console.log(`   - ${i}`))
  problems += issues.length
  await context.close()
}

await browser.close()
console.log(problems ? `\n${problems} issue(s) found` : '\nNo issues found')
