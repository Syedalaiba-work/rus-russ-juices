// Interface and accessibility checks against a running build.
//   node tools/a11y.mjs [--base http://localhost:3000]
// Runs axe (WCAG 2.2 A/AA) at desktop and mobile, then checks the things axe cannot:
// keyboard order, the flavour switch, touch, reflow from 320px, reduced motion and the
// no-WebGL fallback.
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'
import { mkdir } from 'node:fs/promises'

const args = process.argv.slice(2)
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'http://localhost:3000'
const out = 'design/shots'
await mkdir(out, { recursive: true })
const GPU = ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11']
const browser = await chromium.launch({ args: GPU })
let failures = 0
const fail = (msg) => {
  failures++
  console.log(`  FAIL ${msg}`)
}
const pass = (msg) => console.log(`  ok   ${msg}`)
const check = (cond, msg) => (cond ? pass(msg) : fail(msg))

const open = async (options, from = browser) => {
  const context = await from.newContext(options)
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2800)
  return { context, page, errors }
}
const flavourState = (page) =>
  page.evaluate(() => ({
    chips: [...document.querySelectorAll('.chip')].map((c) => c.getAttribute('aria-pressed')),
    cards: [...document.querySelectorAll('.dish')].map((c) => c.getAttribute('aria-current')),
    name: document.querySelector('.stage__flavour').textContent,
    behind: document.querySelector('.stage__name').textContent,
    image: document.querySelector('.stage__slot img').getAttribute('alt'),
    url: location.search,
    tint: getComputedStyle(document.documentElement).getPropertyValue('--tint').trim(),
  }))

// ---------------------------------------------------------------- axe
for (const [name, options] of [
  ['desktop 1440', { viewport: { width: 1440, height: 900 } }],
  ['mobile 390', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['desktop, reduced motion', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }],
]) {
  console.log(`\naxe: ${name}`)
  const { context, page, errors } = await open(options)
  // walk the page so every scroll-revealed state is in its final form
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.8) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 140))
    }
  })
  await page.waitForTimeout(1500)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze()
  if (!results.violations.length) pass('no violations')
  for (const v of results.violations) {
    fail(`${v.id} (${v.impact}): ${v.help}`)
    v.nodes.slice(0, 6).forEach((n) => console.log(`         ${n.target.join(' ')}  ${n.any[0]?.message ?? ''}`.slice(0, 220)))
  }
  check(!errors.length, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`)
  await context.close()
}

// ---------------------------------------------------------------- keyboard
console.log('\nkeyboard')
{
  const { context, page } = await open({ viewport: { width: 1440, height: 900 } })
  check((await page.locator('.scene').getAttribute('data-ready')) === 'true', 'WebGL cup is running')
  const stops = []
  for (let i = 0; i < 26; i++) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      const style = getComputedStyle(el)
      return {
        name: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28),
        ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
      }
    })
    if (!stop) break
    stops.push(stop)
    await page.waitForTimeout(160)
  }
  console.log(`  order: ${stops.map((s) => s.name).join(' > ')}`)
  check(stops[0]?.name === 'Skip to content', 'first stop is the skip link')
  check(stops.every((s) => s.ring), `every stop shows a focus ring${stops.some((s) => !s.ring) ? `: missing on ${stops.filter((s) => !s.ring).map((s) => s.name)}` : ''}`)
  await page.waitForTimeout(1200)
  const offScreen = await page.evaluate(() => {
    const box = document.activeElement.getBoundingClientRect()
    return !(box.bottom > 0 && box.top < window.innerHeight)
  })
  check(!offScreen, 'focused element is scrolled into view')

  // picking a flavour from the keyboard changes everything that shows it
  await page.locator('.chip').nth(2).focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  let s = await flavourState(page)
  check(
    s.chips[2] === 'true' && s.cards[2] === 'true' && s.name === 'Mango Madness' && s.behind === 'MangoMadness' && s.image.includes('Mango Madness') && s.url === '?flavour=mango-madness' && s.tint === '#fdf0c6',
    'Enter on a chip changes the chip, card, names, image, tint and URL together',
  )
  await page.waitForTimeout(1800)
  await page.screenshot({ path: `${out}/check_stage-mango.jpg`, type: 'jpeg', quality: 80 })
  await page.locator('.round').nth(1).focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(250)
  await page.screenshot({ path: `${out}/check_stage-mid-transition.jpg`, type: 'jpeg', quality: 80 })
  await page.waitForTimeout(250)
  s = await flavourState(page)
  check(s.name === 'Tropical Mix', 'the next arrow moves to the next flavour')
  await page.locator('.round').nth(1).click()
  await page.waitForTimeout(300)
  check((await flavourState(page)).name === 'Berry Blast', 'the next arrow wraps round from the last flavour to the first')
  await page.waitForTimeout(1900)
  await page.screenshot({ path: `${out}/check_stage-berry.jpg`, type: 'jpeg', quality: 80 })

  // a drink on the stall is a link: it picks its flavour and lands on the stage with focus there
  await page.evaluate(() => document.querySelector('.drinks').scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(600)
  await page.locator('.dish').nth(3).evaluate((a) => a.click())
  await page.waitForTimeout(2600)
  s = await flavourState(page)
  check(s.name === 'Tropical Mix' && (await page.evaluate(() => document.activeElement?.id === 'products' && location.hash === '#products' && location.search === '?flavour=tropical-mix')), 'a drink on the stall picks its flavour, moves focus to the stage and updates the URL')
  const stageTop = await page.evaluate(() => Math.round(document.querySelector('.stage').getBoundingClientRect().top))
  check(Math.abs(stageTop) < 4, `the drink lands exactly on the stage (top at ${stageTop}px)`)
  await page.screenshot({ path: `${out}/check_stage-tropical.jpg`, type: 'jpeg', quality: 80 })
  await context.close()

  // the juice tour: scrolling through it shows each flavour, without rewriting the visitor's pick in the URL
  {
    const tourCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const t = await tourCtx.newPage()
    await t.goto(`${base}/?flavour=mango-madness`, { waitUntil: 'networkidle' })
    await t.waitForTimeout(2600)
    const seen = []
    for (const p of [0.05, 0.3, 0.55, 0.9]) {
      await t.evaluate((p) => {
        const wrap = document.querySelector('.tour-wrap')
        const top = wrap.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top: top + (wrap.offsetHeight - window.innerHeight) * p, behavior: 'instant' })
      }, p)
      await t.waitForTimeout(1500)
      seen.push(await t.evaluate(() => document.querySelector('.tour__steps li[data-current="true"]').textContent))
    }
    check(seen.join() === 'Berry Blast,Blue Rush,Mango Madness,Tropical Mix', `scrolling the tour steps through the range (${seen.join(' > ')})`)
    check(await t.evaluate(() => location.search === '?flavour=mango-madness'), 'the tour does not overwrite the picked flavour in the URL')
    await t.screenshot({ path: `${out}/check_tour-end.jpg`, type: 'jpeg', quality: 80 })
    await tourCtx.close()
  }

  // a shared link opens on its flavour
  const linked = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const deep = await linked.newPage()
  await deep.goto(`${base}/?flavour=berry-blast#products`, { waitUntil: 'networkidle' })
  await deep.waitForTimeout(2500)
  check((await flavourState(deep)).name === 'Berry Blast', 'a link with ?flavour= opens on that flavour')
  await linked.close()
}

// ---------------------------------------------------------------- touch + reflow
console.log('\ntouch and reflow')
{
  const { context, page } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('a, button, summary')]
      .filter((el) => el.offsetParent && !el.classList.contains('skip'))
      .map((el) => ({ name: (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 30), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }))
      .filter((t) => t.h < 40 || t.w < 40),
  )
  check(!small.length, `touch targets are at least 40 x 40px${small.length ? `: ${JSON.stringify(small)}` : ''}`)
  await page.locator('.menu summary').tap()
  await page.waitForTimeout(250)
  check(await page.locator('.menu__panel').isVisible(), 'the menu opens on tap')
  await page.locator('.menu__panel a').nth(2).tap()
  await page.waitForTimeout(1800)
  check(await page.evaluate(() => !document.querySelector('.menu').open && location.hash === '#story'), 'a menu link closes the menu and goes to its section')
  await page.locator('.chip').nth(0).scrollIntoViewIfNeeded()
  await page.locator('.chip').nth(0).tap()
  await page.waitForTimeout(300)
  check((await flavourState(page)).name === 'Berry Blast', 'tapping a chip picks that flavour')
  await context.close()
}
for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920]) {
  const { context, page } = await open({ viewport: { width, height: width < 800 ? 640 : 900 } })
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  check(o.sw <= o.cw + 1, `no horizontal scroll at ${width}px${o.sw > o.cw + 1 ? ` (${o.sw} > ${o.cw})` : ''}`)
  await context.close()
}

// ---------------------------------------------------------------- reduced motion
console.log('\nreduced motion')
{
  const { context, page } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const state = await page.evaluate(() => ({
    pinned: document.querySelectorAll('.pin-spacer').length,
    lenis: document.documentElement.classList.contains('lenis'),
    webgl: document.documentElement.classList.contains('webgl-ready'),
    cup: getComputedStyle(document.querySelector('.hero__slot img')).opacity,
    heroVisible: [...document.querySelectorAll('.hero [data-enter], .hero__title .line > span')].every((el) => getComputedStyle(el).opacity === '1'),
    running: document.getAnimations().filter((a) => a.playState === 'running').length,
    trackScrolls: getComputedStyle(document.querySelector('.moods__track')).overflowX,
  }))
  check(state.pinned === 0 && !state.lenis, 'no pinning and no smooth scroll')
  check(!state.webgl && state.cup === '1', 'the 3D scene does not start; the cup photograph is shown instead')
  check(state.heroVisible, 'the hero is fully visible without its entrance')
  check(state.running === 0, `no running animations (${state.running})`)
  check(state.trackScrolls === 'auto', 'the lookbook falls back to a native scroller')
  await page.locator('.chip').nth(0).click()
  await page.waitForTimeout(300)
  const s = await flavourState(page)
  check(s.name === 'Berry Blast' && s.image.includes('Berry Blast'), 'flavours still switch, by swapping the photograph')
  await page.locator('.stage').scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}/check_reduced-stage.jpg`, type: 'jpeg', quality: 80 })
  await context.close()
}

// ---------------------------------------------------------------- nothing moves on its own
console.log('\nidle')
{
  const { context, page } = await open({ viewport: { width: 1440, height: 900 } })
  await page.mouse.move(700, 450)
  await page.waitForTimeout(7000)
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        // count canvas redraws over two seconds by watching for draw calls
        const gl = document.querySelector('.scene').getContext('webgl2') || document.querySelector('.scene').getContext('webgl')
        let n = 0
        const original = gl.drawElements.bind(gl)
        gl.drawElements = (...a) => {
          n++
          return original(...a)
        }
        setTimeout(() => resolve(n), 2000)
      }),
  )
  check(frames === 0, `the 3D scene stops drawing a few seconds after the last input (${frames} draw calls in 2s)`)
  await context.close()
}

// ---------------------------------------------------------------- no WebGL
console.log('\nno WebGL')
{
  const plain = await chromium.launch({ args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] })
  const { context, page, errors } = await open({ viewport: { width: 1440, height: 900 } }, plain)
  const state = await page.evaluate(() => ({
    webgl: document.documentElement.classList.contains('webgl-ready'),
    cup: getComputedStyle(document.querySelector('.hero__slot img')).opacity,
  }))
  check(!state.webgl && state.cup === '1', 'without WebGL the cup photographs stay')
  check(!errors.length, `no console errors without WebGL${errors.length ? `: ${errors.join(' | ').slice(0, 200)}` : ''}`)
  await page.screenshot({ path: `${out}/check_no-webgl.jpg`, type: 'jpeg', quality: 80 })
  await context.close()
  await plain.close()
}

await browser.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
