'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FLAVOURS } from '@/lib/data'
import { flavour } from '@/lib/flavour'

// The page's background: a soft shader gradient in the brand's colours (ice, white, brand
// blue) with the picked flavour's colour washed through it. It sits behind the whole site,
// takes on more of the flavour colour in the flavour sections, and changes colour with the
// flavour.
// It is a single full-screen fragment shader on its own tiny canvas (drawn at a sixth of the
// screen size and stretched, which is what makes it soft and nearly free). It drifts while
// the page is being scrolled or the pointer is moving and comes to rest a few seconds later,
// like everything else on the page. Without WebGL, or with reduced motion, the canvas's CSS
// background (a static gradient from the same colours) is what shows.

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t)

const ICE = rgb('#f3f8fd')
const WHITE = rgb('#ffffff')
const BLUE = mix(rgb('#dcecfb'), rgb('#4eadea'), 0.3)
// the flavour's soft tint, pulled a little toward the juice colour itself
const wash = (i: number) => mix(rgb(FLAVOURS[i].soft), rgb(FLAVOURS[i].color), 0.32)

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime, uScroll, uBoost, uHero;
uniform vec2 uGlow;
uniform vec3 uIce, uWhite, uBlue, uWash;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) { return noise(p) * 0.65 + noise(p * 2.1 + 5.3) * 0.35; }
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  // large, slow shapes: the field should read as soft daylight, not as blotches
  vec2 p = vec2(uv.x * aspect, uv.y) * 0.7;
  p.y += uScroll * 0.18;
  float t = uTime * 0.05;
  float a = fbm(p * 0.9 + vec2(t, -t * 0.7));
  float b = fbm(p * 0.75 + vec2(-t * 0.6, t * 0.9) + 3.7);
  float c = fbm(p * 1.3 + vec2(t * 0.4, t * 0.5) + 9.1);
  // the approved hero's background: white, with pale blue drifting in from the edges
  vec3 col = mix(uWhite, uIce, smoothstep(0.3, 0.8, a));
  col = mix(col, uBlue, smoothstep(0.62, 0.98, c) * 0.4);
  // in the hero the juice colour glows softly behind the cup and nowhere else
  float glow = 1.0 - smoothstep(0.0, 0.6, distance(vec2(uv.x * aspect, uv.y), vec2(uGlow.x * aspect, uGlow.y)));
  col = mix(col, uWash, glow * glow * 0.85 * uHero);
  // in the flavour sections the juice colour takes over the whole field, evenly
  col = mix(col, uWash, uBoost * 0.3 * (0.78 + 0.18 * b));
  // a little grain, so the soft ramps do not band
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 160.0;
  gl_FragColor = vec4(col, 1.0);
}`

export function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!canvas || !gl) return
    gsap.registerPlugin(ScrollTrigger)
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const shader = (type: number, source: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, source)
      gl.compileShader(s)
      return s
    }
    const program = gl.createProgram()!
    gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'))
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const at = gl.getAttribLocation(program, 'p')
    gl.enableVertexAttribArray(at)
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
    const u = (name: string) => gl.getUniformLocation(program, name)
    gl.uniform3fv(u('uIce'), ICE)
    gl.uniform3fv(u('uWhite'), WHITE)
    gl.uniform3fv(u('uBlue'), BLUE)

    const state = { time: 0, scroll: 0, boost: 0, boostTo: 0, wash: wash(flavour.get()), washTo: wash(flavour.get()) }
    let raf = 0
    let running = false
    let last = 0
    let lastInput = performance.now()

    const resize = () => {
      canvas.width = Math.max(2, Math.ceil(window.innerWidth / 6))
      canvas.height = Math.max(2, Math.ceil(window.innerHeight / 6))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(u('uRes'), canvas.width, canvas.height)
      // behind the cup: right of centre on a wide screen, centred and lower when the hero is stacked
      const wide = window.innerWidth >= 1100 || window.innerWidth > window.innerHeight
      gl.uniform2f(u('uGlow'), wide ? 0.72 : 0.5, wide ? 0.5 : 0.28)
    }
    const draw = () => {
      gl.uniform1f(u('uTime'), state.time)
      gl.uniform1f(u('uScroll'), state.scroll)
      gl.uniform1f(u('uBoost'), state.boost)
      // the glow belongs to the hero: it fades as the hero scrolls away
      gl.uniform1f(u('uHero'), Math.max(0, 1 - state.scroll * 1.3))
      gl.uniform3fv(u('uWash'), state.wash)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      const quiet = now - lastInput
      const energy = Math.min(1, Math.max(0, 1 - (quiet - 1500) / 3000)) ** 2
      state.time += dt * energy
      state.boost += (state.boostTo - state.boost) * 0.06
      state.wash = state.wash.map((v, i) => v + (state.washTo[i] - v) * 0.06)
      draw()
      const settled = Math.abs(state.boostTo - state.boost) < 0.003 && state.wash.every((v, i) => Math.abs(state.washTo[i] - v) < 0.003)
      if (quiet > 4600 && settled) {
        running = false
        last = 0
        return
      }
      raf = requestAnimationFrame(frame)
    }
    const wake = () => {
      lastInput = performance.now()
      if (calm) {
        // no drift: jump straight to the new state and draw it once
        state.boost = state.boostTo
        state.wash = state.washTo
        draw()
        return
      }
      if (running) return
      running = true
      raf = requestAnimationFrame(frame)
    }

    // more of the flavour colour while a flavour section is on screen
    const showing = new Set<Element>()
    const flavourSections = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? showing.add(e.target) : showing.delete(e.target)))
        state.boostTo = showing.size ? 1 : 0
        wake()
      },
      { rootMargin: '-35% 0px -35% 0px' },
    )
    document.querySelectorAll('.stage-wrap, .tour-wrap').forEach((el) => flavourSections.observe(el))

    const follow = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        state.scroll = self.scroll() / window.innerHeight
        wake()
      },
    })
    const unsubscribe = flavour.subscribe(() => {
      state.washTo = wash(flavour.get())
      wake()
    })
    const onMove = () => wake()
    const onResize = () => {
      resize()
      wake()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', onResize)
    resize()
    draw()
    canvas.dataset.live = 'true'
    wake()

    return () => {
      cancelAnimationFrame(raf)
      flavourSections.disconnect()
      follow.kill()
      unsubscribe()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
      delete canvas.dataset.live
    }
  }, [])

  return <canvas ref={ref} className="backdrop" aria-hidden="true" />
}
