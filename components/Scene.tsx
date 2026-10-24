'use client'

import { useEffect, useRef } from 'react'
import { cupIsLive, flavour } from '@/lib/flavour'
import type { CupPose } from '@/lib/cupScene'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// One fixed canvas for the whole page. The cup starts in the hero, glides to the middle of
// the flavour stage as you scroll (one full turn on the way), holds there while the stage
// sticks, then leaves with it. Its position always comes from two DOM slots, so the 3D and
// the layout stay in step at every screen size.
// three.js is fetched after first paint; until it draws, each slot shows a photograph of the
// same cup. With reduced motion or no WebGL the photographs simply stay.
export function Scene() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const root = document.documentElement
    const heroSlot = document.querySelector<HTMLElement>('.hero__slot')
    const stage = document.querySelector<HTMLElement>('.stage')
    const wrap = document.querySelector<HTMLElement>('.stage-wrap')
    const stageSlot = document.querySelector<HTMLElement>('.stage__slot')
    const tour = document.querySelector<HTMLElement>('.tour')
    const tourWrap = document.querySelector<HTMLElement>('.tour-wrap')
    const tourSlot = document.querySelector<HTMLElement>('.tour__slot')
    if (!canvas || !heroSlot || !stage || !wrap || !stageSlot) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Ask for a context on a scratch canvas first, so a machine without WebGL never even
    // downloads three.js.
    const probe = document.createElement('canvas')
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return
    let gone = false
    let cleanup = () => {}

    const boot = async () => {
      const [{ createCupScene }, { ScrollTrigger }] = await Promise.all([import('@/lib/cupScene'), import('gsap/ScrollTrigger')])
      if (gone) return
      let scene: Awaited<ReturnType<typeof createCupScene>>
      try {
        const markFont = getComputedStyle(root).getPropertyValue('--font-marker-face')
        scene = await createCupScene(canvas, { flavour: flavour.get(), markFont })
      } catch {
        return
      }
      if (gone) return scene.dispose()

      type Box = { cx: number; cy: number; size: number }
      const layout = { a: { cx: 0, cy: 0, size: 1 } as Box, b: { cx: 0, cy: 0, size: 1 } as Box, c: null as Box | null, start: 1, hold: 0, start2: 0, hold2: 0 }
      let leg = 0
      let scroll = window.scrollY
      let running = false
      let raf = 0
      let lastInput = performance.now()
      let cur: CupPose | null = null
      // Frame times are watched while the scene is drawing. If the machine cannot keep
      // up, the juice stops refracting and the canvas drops to one pixel per pixel.
      let dpr = Math.min(window.devicePixelRatio, window.innerWidth < 820 ? 1.5 : 1.75)
      let lastFrame = 0
      const budget = { frames: 0, slow: 0 }

      const target = (s: number): CupPose => {
        const { a, b, c, start, hold, start2, hold2 } = layout
        // Second leg, the juice tour: the cup comes up with the section, holds while it
        // sticks and the flavours go by, and leaves with it. Between the two legs it is off
        // screen, which is where it changes over.
        if (c && s > (start + hold + start2) / 2) {
          if (leg !== 2) cur = null
          leg = 2
          const through = Math.min(1, Math.max(0, (s - start2) / Math.max(1, hold2)))
          return { cx: c.cx, cy: c.cy + Math.max(0, start2 - s) - Math.max(0, s - start2 - hold2), size: c.size, turn: Math.PI * 2, tilt: Math.sin(through * Math.PI * 4) * 0.03, push: 0, rabbit: 0 }
        }
        if (leg !== 1) cur = null
        leg = 1
        if (s <= start) {
          // For the first stretch the cup stays with the hero, so the flavour cards under it
          // are never covered while they are being read. Then it lets go and drops into the stage.
          const t = Math.min(1, Math.max(0, (s / start - 0.5) / 0.5))
          const e = t * t * (3 - 2 * t)
          // on the way the camera pushes in, so the fruit slides past at different depths
          return { cx: lerp(a.cx, b.cx, e), cy: lerp(a.cy - s, b.cy, e), size: lerp(a.size, b.size, e), turn: e * Math.PI * 2, tilt: Math.sin(t * Math.PI) * -0.16, push: Math.sin(t * Math.PI) * 1.6, rabbit: 1 - e }
        }
        return { cx: b.cx, cy: b.cy - Math.max(0, s - start - hold), size: b.size, turn: Math.PI * 2, tilt: 0, push: 0, rabbit: 0 }
      }

      const frame = (now: number) => {
        if (lastFrame && scene.getTier() === 'high') {
          budget.frames++
          if (now - lastFrame > 30) budget.slow++
          // judged in runs of 45 frames for as long as the page is open, because the heavy
          // moments (a flavour change mid-scroll) come later than the first few seconds
          if (budget.frames >= 45) {
            if (budget.slow / budget.frames > 0.35) {
              scene.setTier('low')
              dpr = 1
              scene.resize(window.innerWidth, window.innerHeight, dpr)
              canvas.dataset.tier = 'low'
            }
            budget.frames = 0
            budget.slow = 0
          }
        }
        lastFrame = now
        const quiet = now - lastInput
        const energy = Math.min(1, Math.max(0, 1 - (quiet - 1500) / 3000)) ** 2
        const to = target(scroll)
        // a little weight: the cup eases after the scroll rather than sticking to it
        if (!cur) cur = to
        else {
          cur.cx = lerp(cur.cx, to.cx, 0.16)
          cur.cy = lerp(cur.cy, to.cy, 0.16)
          cur.size = lerp(cur.size, to.size, 0.16)
          cur.turn = lerp(cur.turn, to.turn, 0.12)
          cur.tilt = lerp(cur.tilt, to.tilt, 0.12)
          cur.push = lerp(cur.push, to.push, 0.12)
          cur.rabbit = lerp(cur.rabbit ?? 1, to.rabbit ?? 1, 0.16)
        }
        const settled = Math.abs(cur.cx - to.cx) + Math.abs(cur.cy - to.cy) < 0.5 && Math.abs(cur.turn - to.turn) < 0.002
        const above = to.cy + to.size / 2 < -40 && cur.cy + cur.size / 2 < -40
        const below = to.cy - to.size / 2 > window.innerHeight + 40 && cur.cy - cur.size / 2 > window.innerHeight + 40
        const offScreen = above || below
        canvas.style.visibility = offScreen ? 'hidden' : 'visible'
        if (!offScreen) {
          scene.setPose(cur)
          scene.render(now / 1000, energy)
        }
        // Nothing keeps moving by itself: once the scene has settled the loop stops.
        if (offScreen || (quiet > 4600 && settled && !scene.isBusy())) {
          running = false
          lastFrame = 0
          return
        }
        raf = requestAnimationFrame(frame)
      }
      const wake = () => {
        lastInput = performance.now()
        if (running) return
        running = true
        raf = requestAnimationFrame(frame)
      }

      // Offsets rather than client rects: they ignore the transforms of entrance animations,
      // and the stage slot is measured against its own section, which is where it sits on
      // screen while the stage is stuck to the top.
      const box = (el: HTMLElement, within: HTMLElement | null): Box => {
        let x = 0
        let y = 0
        for (let node: HTMLElement | null = el; node && node !== within; node = node.offsetParent as HTMLElement | null) {
          x += node.offsetLeft
          y += node.offsetTop
        }
        return { cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2, size: el.offsetHeight }
      }
      const measure = () => {
        layout.a = box(heroSlot, null)
        layout.b = box(stageSlot, stage)
        // the stage is sticky inside its wrapper: it holds for the difference in their heights
        layout.start = Math.max(1, box(wrap, null).cy - wrap.offsetHeight / 2)
        layout.hold = wrap.offsetHeight - stage.offsetHeight
        if (tour && tourWrap && tourSlot) {
          layout.c = box(tourSlot, tour)
          layout.start2 = box(tourWrap, null).cy - tourWrap.offsetHeight / 2
          layout.hold2 = tourWrap.offsetHeight - tour.offsetHeight
        }
        scene.resize(window.innerWidth, window.innerHeight, dpr)
        cur = null
        wake()
      }

      const follow = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          scroll = self.scroll()
          wake()
        },
      })
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
        wake()
      }
      const unsubscribe = flavour.subscribe(() => {
        scene.setFlavour(flavour.get())
        wake()
      })
      window.addEventListener('pointermove', onMove, { passive: true })
      ScrollTrigger.addEventListener('refresh', measure)
      measure()
      root.classList.add('webgl-ready')
      cupIsLive.set(true)
      canvas.dataset.ready = 'true'

      cleanup = () => {
        cancelAnimationFrame(raf)
        running = false
        root.classList.remove('webgl-ready')
        cupIsLive.set(false)
        delete canvas.dataset.ready
        unsubscribe()
        window.removeEventListener('pointermove', onMove)
        ScrollTrigger.removeEventListener('refresh', measure)
        follow.kill()
        scene.dispose()
      }
      if (gone) cleanup()
    }
    // Building the scene is a burst of work on the main thread. It waits until the hero has
    // made its entrance, and then for an idle moment, so first paint is never held up by it.
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1))
    const timer = window.setTimeout(() => idle(() => boot()), 1500)

    return () => {
      gone = true
      window.clearTimeout(timer)
      cleanup()
    }
  }, [])

  return <canvas ref={ref} className="scene" aria-hidden="true" />
}
