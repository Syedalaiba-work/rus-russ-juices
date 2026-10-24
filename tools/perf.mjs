// Performance check against a running production build.
//   node tools/perf.mjs [--base http://localhost:3000]
// Reports LCP, CLS, transfer sizes, and the frame rate while scrolling the whole page and
// while switching flavours, on a desktop profile and a throttled mobile profile.
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3000'
const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11'] })
let failures = 0
const check = (ok, msg) => {
  if (!ok) failures++
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`)
}

for (const profile of [
  { name: 'desktop 1440', options: { viewport: { width: 1440, height: 900 } }, cpu: 1, fps: 50 },
  { name: 'mobile 390, 4x CPU slowdown', options: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, cpu: 4, fps: 30 },
]) {
  console.log(`\n${profile.name}`)
  const context = await browser.newContext(profile.options)
  const page = await context.newPage()
  const client = await context.newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu })
  // bytes on the wire, by resource type, from the network layer
  const bytes = { Script: 0, Image: 0, Font: 0, Other: 0 }
  const types = new Map()
  await client.send('Network.enable')
  client.on('Network.responseReceived', (e) => types.set(e.requestId, e.type))
  client.on('Network.loadingFinished', (e) => {
    const type = types.get(e.requestId)
    bytes[type in bytes ? type : 'Other'] += e.encodedDataLength
  })
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0 }
    new PerformanceObserver((list) => list.getEntries().forEach((e) => (window.__vitals.lcp = e.startTime))).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => list.getEntries().forEach((e) => !e.hadRecentInput && (window.__vitals.cls += e.value))).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  // Layout shift is judged on load. Shifts while scrolling are listed separately, because
  // a section being pinned registers as one even though nothing visibly jumps.
  const loaded = await page.evaluate(() => ({ ...window.__vitals }))
  const shifts = await page.evaluate(() => {
    window.__shifts = []
    new PerformanceObserver((list) =>
      list.getEntries().forEach((e) => !e.hadRecentInput && window.__shifts.push({ value: +e.value.toFixed(3), at: Math.round(window.scrollY), nodes: e.sources.map((s) => s.node?.className || s.node?.nodeName).slice(0, 3) })),
    ).observe({ type: 'layout-shift' })
  })

  // frame rate over a slow scroll of the whole page
  const scrollFps = await page.evaluate(async () => {
    const times = []
    let run = true
    const tick = (t) => {
      times.push(t)
      if (run) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    const max = document.documentElement.scrollHeight - window.innerHeight
    const start = performance.now()
    const duration = 9000
    await new Promise((resolve) => {
      const step = () => {
        const p = Math.min(1, (performance.now() - start) / duration)
        window.scrollTo(0, max * p)
        p < 1 ? requestAnimationFrame(step) : resolve()
      }
      step()
    })
    run = false
    const gaps = times.slice(1).map((t, i) => t - times[i])
    gaps.sort((a, b) => a - b)
    return { avg: Math.round(1000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length)), worst: Math.round(gaps[Math.floor(gaps.length * 0.99)]), long: gaps.filter((g) => g > 50).length }
  })

  // frame rate while the flavour transition runs
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(600)
  await page.locator('.chip').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  const switchFps = await page.evaluate(async () => {
    const times = []
    let run = true
    const tick = (t) => {
      times.push(t)
      if (run) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    const chips = [...document.querySelectorAll('.chip')]
    for (const i of [0, 2, 3]) {
      chips[i].click()
      await new Promise((r) => setTimeout(r, 1500))
    }
    run = false
    const gaps = times.slice(1).map((t, i) => t - times[i])
    return Math.round(1000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length))
  })

  const kb = (n) => `${Math.round(n / 1024)} kB`
  check(loaded.lcp < 2500, `LCP ${Math.round(loaded.lcp)} ms`)
  check(loaded.cls < 0.1, `CLS on load ${loaded.cls.toFixed(3)}`)
  const moved = await page.evaluate(() => window.__shifts)
  const total = moved.reduce((a, s) => a + s.value, 0)
  console.log(`       shifts reported while scrolling: ${moved.length} (sum ${total.toFixed(2)})`)
  moved
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
    .forEach((s) => console.log(`         ${s.value} at scroll ${s.at}: ${s.nodes.join(', ')}`))
  check(scrollFps.avg >= profile.fps, `scrolling the whole page: ${scrollFps.avg} fps average, 99th percentile frame ${scrollFps.worst} ms, ${scrollFps.long} frames over 50 ms`)
  check(switchFps >= profile.fps, `switching flavours: ${switchFps} fps average`)
  console.log(`       transferred: script ${kb(bytes.Script)}, images ${kb(bytes.Image)}, fonts ${kb(bytes.Font)}`)
  await context.close()
}

await browser.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
