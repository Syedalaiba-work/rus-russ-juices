'use client'

import { useEffect, useRef } from 'react'
import { CUP_SIZE, FLAVOURS } from '@/lib/data'

export function Studio() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let dispose = () => {}
    let gone = false
    const params = new URLSearchParams(window.location.search)
    const id = params.get('flavour')
    // ?rabbit=0 photographs the drink alone, as it is shown everywhere outside the hero
    const rabbit = params.get('rabbit') === '0' ? 0 : 1
    const index = Math.max(0, FLAVOURS.findIndex((f) => f.id === id))
    import('@/lib/cupScene').then(async ({ createCupScene }) => {
      const markFont = getComputedStyle(document.documentElement).getPropertyValue('--font-marker-face')
      const scene = await createCupScene(canvas, { flavour: index, calm: true, markFont })
      if (gone) return scene.dispose()
      dispose = scene.dispose
      scene.resize(CUP_SIZE.width, CUP_SIZE.height, 2)
      scene.setPose({ cx: CUP_SIZE.width / 2, cy: CUP_SIZE.height / 2, size: CUP_SIZE.height, turn: 0, tilt: 0, push: 0, rabbit })
      scene.render(0)
      canvas.dataset.ready = 'true'
    })
    return () => {
      gone = true
      dispose()
    }
  }, [])

  return (
    <main style={{ background: 'transparent' }}>
      <canvas ref={ref} id="studio" style={{ width: CUP_SIZE.width, height: CUP_SIZE.height }} />
    </main>
  )
}
