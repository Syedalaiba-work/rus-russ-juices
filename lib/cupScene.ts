import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import gsap from 'gsap'
import { FLAVOURS, type Fruit } from '@/lib/data'
import { cutOut, cutOutSet, fitted, loadHeroAssets, loadLayerSet, tintable, type LayerSet } from '@/lib/heroAssetLoader'
import { LAYER_ORDER, type LayerName } from '@/lib/heroAssets'
import { buildRabbit } from '@/lib/rabbit3d'

// The RUS RUSS hero product as one WebGL scene, reconstructed from the approved Clean Classic
// tile: a clear plastic cup of translucent juice packed with ice, the rabbit sitting in the top
// with its feet over the rim, fruit piled at the base and floating round it, clear ice cubes,
// and a splash of juice thrown up on both sides.
// The same scene renders the static cup images (tools/render-cups.mjs) and the live page,
// so the two line up when the page hands over from image to canvas.
//
// Everything drawn here is a STAND-IN. Each part (cup, juice, ice, fruit, splash, rabbit,
// hoodie print, wordmark) is a slot: when authored artwork for it is declared in
// public/assets/hero/manifest.json it replaces the stand-in, and this file goes on doing
// what it is for, which is placement, camera, depth, movement, flavour changes and light.
// Do not add detail to the stand-ins. See public/assets/hero/README.md.

// The product is framed in a 9.3 x 11 world-unit box. A pose places that box on screen.
export const FRAME = { w: 9.3, h: 11 }
const CAMERA_Z = 17
const FOV = 28

// rabbit: how much of the hero's realistic rabbit is showing, 0 to 1. It belongs to the hero
// only, so it leaves as the cup travels on. Left out, it is fully shown.
export type CupPose = { cx: number; cy: number; size: number; turn: number; tilt: number; push: number; rabbit?: number }
export type CupScene = Awaited<ReturnType<typeof createCupScene>>
// 'high' refracts the ice through the juice. 'low' swaps that for a cheaper blended juice;
// the page drops to it by itself if frames run long.
export type Tier = 'high' | 'low'

// Seeded, so everything sits in the same place on every visit and in every render.
const mulberry = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export async function createCupScene(canvas: HTMLCanvasElement, opts: { flavour: number; calm?: boolean; markFont: string; tier?: Tier }) {
  // Throws when WebGL is unavailable; the caller keeps the static images in that case.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.08
  renderer.transmissionResolutionScale = 0.7
  const calm = !!opts.calm
  const rand = mulberry(11)
  let tier: Tier = opts.tier ?? 'high'

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80)
  camera.position.set(0, 0, CAMERA_Z)

  // ---------------------------------------------------------------- light
  // A bright, soft daylight studio, as in the approved hero: a white sky, pale blue walls,
  // one large soft source up and to the left and a smaller one to the right.
  const canvasTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    draw(c.getContext('2d')!, w, h)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  }
  const skyTex = canvasTexture(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.45, '#e3f1fd')
    g.addColorStop(0.62, '#b9dbf7')
    g.addColorStop(1, '#f3f8fd')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    const soft = (x: number, y: number, r: number, a: number) => {
      const b = ctx.createRadialGradient(x, y, 0, x, y, r)
      b.addColorStop(0, `rgba(255,255,255,${a})`)
      b.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = b
      ctx.fillRect(0, 0, w, h)
    }
    soft(w * 0.3, h * 0.2, 230, 1)
    soft(w * 0.72, h * 0.3, 150, 0.9)
    soft(w * 0.95, h * 0.42, 90, 0.7)
    // a darker band low down gives glass and ice an edge to reflect
    ctx.fillStyle = 'rgba(40,90,140,0.22)'
    ctx.fillRect(0, h * 0.66, w, h * 0.05)
  })
  skyTex.mapping = THREE.EquirectangularReflectionMapping
  const pmrem = new THREE.PMREMGenerator(renderer)
  const env = pmrem.fromEquirectangular(skyTex)
  scene.environment = env.texture
  scene.environmentIntensity = 1.35
  scene.add(new THREE.HemisphereLight('#ffffff', '#e9f2fb', 1.1))
  const key = new THREE.DirectionalLight('#ffffff', 2.4)
  key.position.set(-5, 8, 7)
  scene.add(key)
  const rim = new THREE.DirectionalLight('#cfe9ff', 1.3)
  rim.position.set(6, 3, -5)
  scene.add(rim)

  // ---------------------------------------------------------------- authored artwork
  // null for every slot that is still empty
  const authored = await loadHeroAssets()

  // ---------------------------------------------------------------- groups
  // anchor: placed on screen by the pose. product: the framed contents, tipped slightly toward
  // the camera so the rim reads as an ellipse, as in the approved hero. cup: the part that spins.
  const anchor = new THREE.Group()
  const product = new THREE.Group()
  product.position.y = -1.85
  product.rotation.x = 0.22
  // the approved cup leans a little to the left
  product.rotation.z = 0.06
  const cup = new THREE.Group()
  anchor.add(product)
  product.add(cup)
  scene.add(anchor)

  const CUP = { h: 4.3, rb: 1.06, rt: 1.66, wall: 0.035 }
  const { h, rb, rt, wall } = CUP
  const top = h / 2
  const cupRadius = (y: number) => rb + ((rt - rb) * (y + top)) / h
  const v = (x: number, y: number) => new THREE.Vector2(x, y)
  const first = new THREE.Color(FLAVOURS[opts.flavour].color)
  const firstDeep = new THREE.Color(FLAVOURS[opts.flavour].deep)
  // thrown juice is thinner than juice in the cup, so it reads lighter
  const waterOf = (c: THREE.Color) => c.clone().lerp(new THREE.Color('#ffffff'), 0.12)

  // ---------------------------------------------------------------- materials
  // The canvas is transparent, so a surface that only refracts has nothing behind it to show
  // and disappears. Everything that must be seen against the page is blended instead; only
  // the juice refracts, and it has the far wall of the cup and the ice to look at.
  const plastic = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.13, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.2, depthWrite: false })
  const plasticEdge = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, roughness: 0.06, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false })
  const juice = {
    // SLOT liquid: an optional normal map gives the stand-in juice some surface detail
    high: new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, thickness: 1.5, ior: 1.33, roughness: 0.05, attenuationColor: first.clone(), attenuationDistance: 1.05, envMapIntensity: 1.6, normalMap: authored.liquidNormal }),
    low: new THREE.MeshStandardMaterial({ color: first.clone(), roughness: 0.25, emissive: first.clone(), emissiveIntensity: 0.18, transparent: true, opacity: 0.86 }),
  }
  // The far inside wall of the cup, in the deep colour of the juice. It is what shows in the
  // gaps between the ice, and it is what makes the drink read as liquid with ice in it
  // rather than as one pale slush.
  const depth = new THREE.MeshStandardMaterial({ color: firstDeep.clone(), roughness: 0.4, emissive: firstDeep.clone(), emissiveIntensity: 0.55, side: THREE.BackSide })
  const water = new THREE.MeshPhysicalMaterial({ color: waterOf(first), transparent: true, opacity: 0.9, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, emissive: first.clone(), emissiveIntensity: 0.22 })
  const clearIce = new THREE.MeshPhysicalMaterial({ color: '#c3e1fa', transparent: true, opacity: 0.62, roughness: 0.03, clearcoat: 1, envMapIntensity: 3, side: THREE.DoubleSide, depthWrite: false })
  const iceEdge = new THREE.LineBasicMaterial({ color: '#3f93d6', transparent: true, opacity: 0.42 })
  // Ice packed inside the cup is seen through the juice, so it has to be solid: anything that
  // refracts is left out of what a refracting surface can see.
  const packedIce = new THREE.MeshPhysicalMaterial({ color: '#f2faff', roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 3.2 })

  // ---------------------------------------------------------------- the cup
  // SLOT cup: the stand-in cup and everything in it
  const standIn = new THREE.Group()
  cup.add(standIn)
  const shell = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        v(0, -top),
        v(rb - 0.06, -top),
        v(rb, -top + 0.06),
        v(cupRadius(top - 0.62), top - 0.62),
        v(cupRadius(top - 0.62) + 0.035, top - 0.58), // two ribs under the rim, as on the approved cup
        v(cupRadius(top - 0.5), top - 0.5),
        v(cupRadius(top - 0.3) + 0.03, top - 0.27),
        v(cupRadius(top - 0.2), top - 0.2),
        v(rt, top),
        v(rt + 0.1, top + 0.03), // rolled lip
        v(rt + 0.11, top + 0.1),
        v(rt + 0.04, top + 0.13),
        v(rt - wall, top + 0.08),
        v(rb - wall, -top + 0.1),
        v(0, -top + 0.1),
      ],
      96,
    ),
    plastic,
  )
  shell.renderOrder = 3
  standIn.add(shell)
  // the rolled lip and the two ribs catch the light, so the cup has an edge against the page
  ;[
    [rt + 0.07, top + 0.08, 0.055],
    [cupRadius(top - 0.27) + 0.02, top - 0.27, 0.03],
    [cupRadius(top - 0.58) + 0.02, top - 0.58, 0.03],
    [rb - 0.02, -top + 0.03, 0.04],
  ].forEach(([r, y, tube]) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 96), plasticEdge)
    ring.position.y = y
    ring.rotation.x = Math.PI / 2
    ring.renderOrder = 3
    standIn.add(ring)
  })

  const level = top - 0.16
  const inner = (y: number) => cupRadius(y) - wall - 0.02
  const liquid = new THREE.Mesh(new THREE.LatheGeometry([v(0, -top + 0.12), v(inner(-top + 0.12), -top + 0.12), v(inner(level), level), v(0, level + 0.02)], 96), juice[tier])
  liquid.renderOrder = 1
  standIn.add(liquid)
  standIn.add(new THREE.Mesh(new THREE.LatheGeometry([v(0, -top + 0.13), v(inner(-top + 0.13) - 0.01, -top + 0.13), v(inner(level) - 0.01, level)], 64), depth))

  const iceGeo = new RoundedBoxGeometry(1, 1, 1, 3, 0.14)
  const packed = (x: number, y: number, z: number, s: number) => {
    const m = new THREE.Mesh(iceGeo, packedIce)
    m.position.set(x, y, z)
    m.scale.set(s, s * (0.8 + rand() * 0.4), s)
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3)
    standIn.add(m)
  }
  // packed through the juice…
  // Fewer, larger pieces with juice between them. Most sit against the wall, where they
  // catch the light; the middle is left as juice.
  for (let i = 0; i < 17; i++) {
    const y = -top + 0.55 + rand() * (h - 1.3)
    const r = (inner(y) - 0.36) * (0.55 + 0.45 * rand())
    const a = rand() * Math.PI * 2
    packed(Math.cos(a) * r, y, Math.sin(a) * r, 0.5 + rand() * 0.32)
  }
  // …and heaped above the rim, where the rabbit sits
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rand() * 0.5
    const r = 0.35 + rand() * 0.85
    packed(Math.cos(a) * r, level + 0.05 + rand() * 0.3 - r * 0.08, Math.sin(a) * r, 0.44 + rand() * 0.22)
  }

  const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 4.4, 20), new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.3 }))
  straw.position.set(-1.0, top + 0.5, -0.45)
  straw.rotation.set(-0.1, 0, 0.3)
  standIn.add(straw)

  // What makes a cold drink look wet: bubbles in the juice, beads of condensation on the
  // outside of the cup, and two long highlights down the plastic.
  const bubbleMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 })
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), bubbleMat, 46)
  const bead = new THREE.Object3D()
  for (let i = 0; i < 46; i++) {
    const y = -top + 0.4 + rand() * (h - 0.9)
    const a = -1.5 + rand() * 3.0
    const r = inner(y) - 0.07 - rand() * 0.18
    bead.position.set(Math.sin(a) * r, y, Math.cos(a) * r)
    bead.scale.setScalar(0.018 + rand() ** 2 * 0.05)
    bead.updateMatrix()
    bubbles.setMatrixAt(i, bead.matrix)
  }
  standIn.add(bubbles)
  const dewMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, roughness: 0, clearcoat: 1, envMapIntensity: 3.5, depthWrite: false })
  const dew = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), dewMat, 110)
  for (let i = 0; i < 110; i++) {
    const y = -top + 0.25 + rand() * (h - 0.9)
    const a = -1.45 + rand() * 2.9
    const r = cupRadius(y) + 0.012
    bead.position.set(Math.sin(a) * r, y, Math.cos(a) * r)
    bead.rotation.set(0, a, 0)
    const s = 0.014 + rand() ** 3 * 0.05
    // a bead is flattened against the cup and hangs slightly long
    bead.scale.set(s, s * (1.1 + rand() * 0.7), s * 0.45)
    bead.updateMatrix()
    dew.setMatrixAt(i, bead.matrix)
  }
  dew.renderOrder = 4
  standIn.add(dew)
  // the highlights belong to the light, not the cup, so they do not turn with it
  const gloss = new THREE.Group()
  const glossTex = canvasTexture(32, 256, (ctx, w, hgt) => {
    const g = ctx.createLinearGradient(0, 0, 0, hgt)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.18, 'rgba(255,255,255,0.85)')
    g.addColorStop(0.7, 'rgba(255,255,255,0.5)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, hgt)
  })
  ;[
    [-0.78, 0.1, 0.62],
    [0.98, 0.045, 0.34],
  ].forEach(([angle, width, strength]) => {
    const streak = new THREE.Mesh(
      new THREE.CylinderGeometry(cupRadius(top - 0.75) + 0.02, cupRadius(-top + 0.35) + 0.02, h - 1.1, 8, 1, true, angle - width / 2, width),
      new THREE.MeshBasicMaterial({ map: glossTex, transparent: true, opacity: strength, depthWrite: false, toneMapped: false }),
    )
    streak.position.y = -0.2
    streak.renderOrder = 5
    gloss.add(streak)
  })
  product.add(gloss)

  // Two mint leaves tucked in at the rim.
  const leafGeo = new THREE.SphereGeometry(1, 16, 10)
  const leafMat = new THREE.MeshStandardMaterial({ color: '#3f9e3a', roughness: 0.45 })
  ;[
    [1.18, top + 0.22, 0.45, -0.7, 0.34],
    [1.42, top + 0.12, 0.2, -1.15, 0.27],
  ].forEach(([x, y, z, tilt, s]) => {
    const leaf = new THREE.Mesh(leafGeo, leafMat)
    leaf.position.set(x, y, z)
    leaf.scale.set(s * 0.7, s * 0.2, s * 1.25)
    leaf.rotation.set(0.5, 0.6, tilt)
    standIn.add(leaf)
  })

  // The mark on the cup: the wordmark in brush lettering, stacked and tilted, as approved.
  await document.fonts.load(`120px ${opts.markFont}`).catch(() => null)
  // SLOT wordmark / hoodie: supplied artwork is drawn as it is; otherwise the stand-in lettering
  const drawMark = (ctx: CanvasRenderingContext2D, w: number, hgt: number, ink: string, withJuices: boolean, art: HTMLImageElement | null) => {
    if (art) {
      const s = Math.min(w / art.naturalWidth, hgt / art.naturalHeight) * 0.94
      ctx.drawImage(art, (w - art.naturalWidth * s) / 2, (hgt - art.naturalHeight * s) / 2, art.naturalWidth * s, art.naturalHeight * s)
      return
    }
    ctx.translate(w / 2, hgt / 2)
    ctx.rotate(-0.1)
    ctx.fillStyle = ink
    ctx.strokeStyle = ink
    ctx.lineJoin = 'round'
    ctx.textAlign = 'center'
    const line = (text: string, size: number, x: number, y: number, weight: number) => {
      ctx.font = `${size}px ${opts.markFont}`
      ctx.lineWidth = weight
      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
    }
    const u = w / 720
    // stroked as well as filled, to get the weight of the approved brush lettering
    line('RUS', 268 * u, -40 * u, -28 * u, 9 * u)
    line('RUSS', 268 * u, 6 * u, 184 * u, 9 * u)
    if (withJuices) {
      ctx.letterSpacing = `${10 * u}px`
      line('JUICES', 66 * u, 44 * u, 284 * u, 3 * u)
    }
  }
  const markArt = authored.wordmarkCup ?? authored.wordmarkBlack
  const markShape = markArt ? markArt.naturalWidth / markArt.naturalHeight : 1
  // supplied artwork wraps further round the cup and keeps its own proportions
  const arc = markArt ? 1.95 : 1.45
  const printH = markArt ? (arc * cupRadius(-0.35)) / markShape : 2.2
  const printTex = canvasTexture(markArt ? 1440 : 720, markArt ? Math.round(1440 / markShape) : 720, (ctx, w, hgt) => drawMark(ctx, w, hgt, '#0a0a0a', true, markArt))
  const print = new THREE.Mesh(
    new THREE.CylinderGeometry(cupRadius(-0.35 + printH / 2) + 0.012, cupRadius(-0.35 - printH / 2) + 0.012, printH, 48, 1, true, -arc / 2, arc),
    new THREE.MeshBasicMaterial({ map: printTex, transparent: true, depthWrite: false, toneMapped: false }),
  )
  print.position.y = -0.35
  print.renderOrder = 4
  cup.add(print)

  // SLOT cup, filled: the authored cup replaces the stand-in whole. Materials it names
  // "liquid…" follow the flavour. If it has an object named "print" it carries its own mark.
  const authoredLiquid: THREE.Color[] = []
  if (authored.cup) {
    standIn.visible = false
    gloss.visible = false
    const model = fitted(authored.cup, { height: h })
    authoredLiquid.push(...tintable(model, 'liquid'))
    authoredLiquid.forEach((c) => c.copy(first))
    print.visible = !model.getObjectByName('print')
    cup.add(model)
  }

  // ---------------------------------------------------------------- the rabbit
  // SLOT rabbit: an authored model, or an authored cut-out image, or the stand-in.
  // SLOT hoodie: the print on the stand-in's chest (an authored rabbit carries its own).
  const chestTex = canvasTexture(512, 512, (ctx, w, hgt) => drawMark(ctx, w, hgt, '#ffffff', false, authored.hoodiePrint ?? authored.wordmarkWhite))
  // The brand's own rabbit drawings are used when they are supplied as cut-outs: one per
  // flavour, so the rabbit changes pose with the juice.
  const poses = !authored.rabbitModel && authored.rabbitPoses.some(Boolean) ? cutOutSet(authored.rabbitPoses, 4.5) : null
  const rabbit = authored.rabbitModel ? fitted(authored.rabbitModel, { height: 4.4, sit: true }) : poses ? poses.holder : authored.rabbitImage ? cutOut(authored.rabbitImage, 4.9) : buildRabbit(chestTex)
  // a cut-out stands with its feet down in the ice
  if (!authored.rabbitModel && (poses || authored.rabbitImage)) rabbit.children[0].position.y = -0.7
  poses?.show(opts.flavour)
  const flat = !!poses || (!!authored.rabbitImage && !authored.rabbitModel)
  const rabbitY = top + 0.05
  // A single cut-out of the whole seated rabbit (legs included) sits forward in the cup, in
  // front of the ice, with its feet down behind the front of the rim.
  const seated = !!authored.rabbitImage && !poses && !authored.rabbitModel
  if (seated) rabbit.children[0].position.y = -0.62
  rabbit.position.set(seated ? 0.62 : -0.2, rabbitY, seated ? 1.5 : -0.1)
  rabbit.rotation.set(flat ? 0 : -0.12, flat ? 0 : 0.12, 0.1)
  const RABBIT = 1.1
  product.add(rabbit)

  // ---------------------------------------------------------------- fruit
  const berryGeo = new THREE.SphereGeometry(0.36, 32, 20)
  const berryMat = new THREE.MeshPhysicalMaterial({ color: '#1c2150', roughness: 0.5, sheen: 1, sheenColor: new THREE.Color('#9aa6d8'), sheenRoughness: 0.5, envMapIntensity: 0.55 })
  const crownGeo = new THREE.ConeGeometry(0.035, 0.09, 4)
  const crownMat = new THREE.MeshStandardMaterial({ color: '#12153a', roughness: 0.8 })
  const pitGeo = new THREE.CircleGeometry(0.085, 12)
  const seedTex = canvasTexture(256, 256, (ctx, w, hgt) => {
    ctx.fillStyle = '#e0213a'
    ctx.fillRect(0, 0, w, hgt)
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 12; x++) {
        const px = ((x + (y % 2) * 0.5) * w) / 12
        const py = (y * hgt) / 9 + 14
        ctx.fillStyle = 'rgba(120,0,20,0.55)'
        ctx.beginPath()
        ctx.ellipse(px, py + 1.5, 5, 6.5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffd98a'
        ctx.beginPath()
        ctx.ellipse(px, py, 2.8, 4.4, 0, 0, Math.PI * 2)
        ctx.fill()
      }
  })
  const strawGeo = new THREE.LatheGeometry([v(0, -0.6), v(0.16, -0.5), v(0.36, -0.15), v(0.46, 0.18), v(0.4, 0.4), v(0.2, 0.52), v(0, 0.5)], 32)
  const strawMat = new THREE.MeshPhysicalMaterial({ map: seedTex, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 })
  const sepalGeo = new THREE.ConeGeometry(0.11, 0.38, 4)
  const mangoGeo = new RoundedBoxGeometry(0.62, 0.62, 0.62, 4, 0.13)
  const mangoMat = new THREE.MeshPhysicalMaterial({ color: '#ffa81a', roughness: 0.42, sheen: 0.6, sheenColor: new THREE.Color('#ffe08a'), sheenRoughness: 0.5 })
  const sliceTex = canvasTexture(512, 512, (ctx, w) => {
    const c = w / 2
    const disc = (r: number, fill: string | CanvasGradient) => {
      ctx.beginPath()
      ctx.arc(c, c, r, 0, Math.PI * 2)
      ctx.fillStyle = fill
      ctx.fill()
    }
    disc(c, '#ff8a1f')
    disc(c * 0.93, '#fff1d6')
    const g = ctx.createRadialGradient(c, c, 10, c, c, c * 0.86)
    g.addColorStop(0, '#ffc45e')
    g.addColorStop(1, '#ff9a1f')
    disc(c * 0.86, g)
    ctx.strokeStyle = '#fff1d6'
    ctx.lineWidth = 9
    ctx.lineCap = 'round'
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(c, c)
      ctx.lineTo(c + Math.cos(a) * c * 0.86, c + Math.sin(a) * c * 0.86)
      ctx.stroke()
    }
    disc(c * 0.07, '#fff1d6')
  })
  const sliceGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.1, 40)
  const sliceMats = [new THREE.MeshStandardMaterial({ color: '#ff8a1f', roughness: 0.55 }), new THREE.MeshStandardMaterial({ map: sliceTex, roughness: 0.3 }), new THREE.MeshStandardMaterial({ map: sliceTex, roughness: 0.3 })]

  const makers: Record<'blueberry' | 'strawberry' | 'mango' | 'slice', () => THREE.Object3D> = {
    blueberry: () => {
      const g = new THREE.Group()
      const body = new THREE.Mesh(berryGeo, berryMat)
      body.scale.y = 0.9
      g.add(body)
      // the little five-pointed crown a blueberry has at one end
      const pit = new THREE.Mesh(pitGeo, crownMat)
      pit.position.y = 0.318
      pit.rotation.x = -Math.PI / 2
      g.add(pit)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        const point = new THREE.Mesh(crownGeo, crownMat)
        point.position.set(Math.cos(a) * 0.095, 0.33, Math.sin(a) * 0.095)
        point.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9)
        g.add(point)
      }
      return g
    },
    strawberry: () => {
      const g = new THREE.Group()
      g.add(new THREE.Mesh(strawGeo, strawMat))
      for (let i = 0; i < 7; i++) {
        const sepal = new THREE.Mesh(sepalGeo, leafMat)
        const a = (i / 7) * Math.PI * 2
        sepal.position.set(Math.cos(a) * 0.17, 0.54, Math.sin(a) * 0.17)
        sepal.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2)
        sepal.scale.z = 0.4
        g.add(sepal)
      }
      return g
    },
    mango: () => new THREE.Mesh(mangoGeo, mangoMat),
    slice: () => {
      const m = new THREE.Mesh(sliceGeo, sliceMats)
      m.rotation.x = Math.PI / 2
      const g = new THREE.Group()
      g.add(m)
      return g
    },
  }
  // the largest dimension of each stand-in, which an authored piece is scaled to
  const FRUIT_SIZE = { blueberry: 0.72, strawberry: 1.12, mango: 0.62, slice: 1.24 }
  const RECIPES: Record<Fruit, (keyof typeof makers)[]> = {
    strawberry: Array(13).fill('strawberry'),
    blueberry: Array(13).fill('blueberry'),
    mango: Array(13).fill('mango'),
    tropical: ['slice', 'mango', 'slice', 'mango', 'strawberry', 'mango', 'slice', 'mango', 'strawberry', 'mango', 'slice', 'mango', 'slice'],
  }
  // Where fruit goes, taken from the approved hero: a pile across the foot of the cup, and
  // single pieces hanging in the air on either side. [x, y, z, size]
  const SPOTS: [number, number, number, number][] = [
    [-2.7, 0.75, 0.5, 1.25],
    [2.75, 1.35, 0.2, 1.05],
    [-1.95, 2.35, 0.4, 0.9],
    [2.6, -1.0, 0.6, 1.2],
    [-1.75, -1.6, 1.05, 1.0],
    [-1.4, -2.35, 1.25, 1.25],
    [-0.55, -2.45, 1.55, 1.1],
    [0.4, -2.55, 1.6, 1.2],
    [1.3, -2.3, 1.35, 1.05],
    [-0.05, -2.95, 1.85, 0.95],
    [0.95, -3.0, 1.75, 0.9],
    [3.1, -2.6, 0.3, 1.0],
    [-3.0, -2.5, -0.6, 0.8],
  ]
  type Floater = { obj: THREE.Object3D; home: THREE.Vector3; size: number; phase: number; speed: number; piled: boolean }
  const sets = FLAVOURS.map((f, index) => {
    const items: Floater[] = RECIPES[f.fruit].map((kind, i) => {
      const [x, y, z, size] = SPOTS[i]
      // SLOT fruit: an authored piece is sized to the stand-in it replaces
      const art = authored.fruit[kind]
      const obj = art ? fitted(art.clone(true), { size: FRUIT_SIZE[kind] }) : makers[kind]()
      obj.rotation.set(rand() * 6.28, rand() * 6.28, rand() * 6.28)
      product.add(obj)
      // fruit in the pile at the foot of the cup barely moves; fruit in the air drifts
      return { obj, home: new THREE.Vector3(x, y, z), size, phase: rand() * 6.28, speed: 0.35 + rand() * 0.4, piled: y < -1.5 && Math.abs(x) < 2 }
    })
    return { items, show: index === opts.flavour ? 1 : 0 }
  })
  const looseIce: Floater[] = (
    [
      [-2.6, 3.0, 0.2, 0.92],
      [2.75, 0.0, 0.75, 0.86],
      [-3.1, -0.8, -0.9, 0.6],
    ] as [number, number, number, number][]
  ).map(([x, y, z, size]) => {
    // A clear cube is mostly its edges and what is inside it: an outer block, a smaller
    // block turned inside it for the facets, and the edges drawn in.
    const obj = new THREE.Group()
    const outer = new THREE.Mesh(iceGeo, clearIce)
    const core = new THREE.Mesh(iceGeo, clearIce)
    core.scale.setScalar(0.66)
    core.rotation.set(0.5, 0.7, 0.2)
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.93, 0.93, 0.93)), iceEdge)
    ;[outer, core, edges].forEach((m) => (m.renderOrder = 4))
    // SLOT ice
    if (authored.ice) obj.add(fitted(authored.ice.clone(true), { size: 1 }))
    else obj.add(outer, core, edges)
    obj.rotation.set(rand() * 3, rand() * 3, rand() * 3)
    product.add(obj)
    return { obj, home: new THREE.Vector3(x, y, z), size, phase: rand() * 6.28, speed: 0.3 + rand() * 0.3, piled: false }
  })

  // ---------------------------------------------------------------- splash
  // Juice thrown up on both sides: tapering tongues that end in drops, and loose drops beyond
  // them. The shapes are fixed (made once, here); a new flavour throws them out again.
  const tongue = (points: [number, number, number][], width: number) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
    const segments = 36
    const radial = 12
    const geo = new THREE.TubeGeometry(curve, segments, 1, radial, false)
    const pos = geo.attributes.position
    const centre = new THREE.Vector3()
    const p = new THREE.Vector3()
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      curve.getPointAt(t, centre)
      // nothing at the root, swelling, thinning to a neck, a bead at the tip
      const r = width * (Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.7 * (1.05 - 0.8 * t) * (1 + 0.25 * Math.sin(t * 17 + width * 90)) + 0.75 * Math.exp(-(((t - 0.93) / 0.05) ** 2)) + 0.03)
      for (let j = 0; j <= radial; j++) {
        const k = i * (radial + 1) + j
        p.fromBufferAttribute(pos, k).sub(centre).multiplyScalar(r).add(centre)
        pos.setXYZ(k, p.x, p.y, p.z)
      }
    }
    geo.computeVertexNormals()
    const mesh = new THREE.Mesh(geo, water)
    mesh.renderOrder = 4
    return mesh
  }
  const tongues: THREE.Mesh[] = []
  // [side, where on the cup it leaves from (y), reach, lift, width]
  ;(
    [
      [-1, -1.2, 1.7, 1.3, 0.1],
      [-1, -0.5, 1.2, 1.7, 0.075],
      [-1, 0.4, 1.0, 1.2, 0.085],
      [-1, -1.85, 1.9, 0.45, 0.11],
      [-1, 1.3, 1.1, 1.1, 0.065],
      [-1, 1.9, 0.7, 1.25, 0.06],
      [-1, -1.5, 1.1, -0.5, 0.07],
      [1, -1.1, 1.6, 1.45, 0.1],
      [1, -0.3, 1.25, 1.55, 0.08],
      [1, 0.7, 1.05, 1.0, 0.08],
      [1, -1.8, 2.0, 0.55, 0.11],
      [1, 1.5, 1.0, 1.2, 0.065],
      [1, 2.0, 0.75, 0.9, 0.055],
      [1, -1.4, 1.15, -0.55, 0.07],
    ] as [number, number, number, number, number][]
  ).forEach(([side, y, reach, lift, width], i) => {
    const z = (rand() - 0.35) * 1.4
    const kink = (rand() - 0.5) * 0.5
    // out, up and over: each streak arcs, wobbles and starts to fall at its tip
    const mesh = tongue(
      [
        [0, 0, 0],
        [side * reach * 0.28, lift * 0.5 + 0.1, z * 0.2],
        [side * reach * (0.6 + kink * 0.2), lift * (0.95 + kink), z * 0.55],
        [side * reach * 0.92, lift * (1.0 - kink * 0.4), z * 0.85],
        [side * reach * 1.1, lift * 0.62 - 0.12, z],
      ],
      width * 1.5,
    )
    mesh.position.set(side * cupRadius(y) * 0.92, y, 0.35 + rand() * 0.5)
    mesh.userData.delay = i * 0.035
    product.add(mesh)
    tongues.push(mesh)
  })
  const DROPS = 130
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), water, DROPS)
  drops.frustumCulled = false
  drops.renderOrder = 4
  product.add(drops)
  const dropData = Array.from({ length: DROPS }, (_, i) => {
    const side = i % 2 ? 1 : -1
    const lift = rand()
    return {
      dir: new THREE.Vector3(side * (0.4 + rand() * 0.9), -0.75 + lift * 1.75, -0.5 + rand() * 1.1).normalize(),
      from: -1.9 + rand() * 4.0,
      reach: 0.5 + rand() * 2.6,
      // a few fat drops, many small ones; some stretched along their path
      size: 0.03 + rand() ** 3 * 0.2,
      stretch: 1 + rand() ** 2 * 1.4,
      jitter: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.8),
      phase: rand() * 6.28,
    }
  })
  // SLOT splash, filled: either one authored mesh (materials named "water…" follow the
  // flavour) or a back and a front image per flavour. Either replaces the stand-in streaks
  // and drops; the scene still throws it out and pulls it back on a flavour change.
  const authoredWater: THREE.Color[] = []
  let splashArt: THREE.Object3D | null = null
  let showSplash = (_index: number) => {}
  if (authored.splashModel) {
    splashArt = fitted(authored.splashModel, { size: 8.2 })
    authoredWater.push(...tintable(splashArt, 'water'))
    authoredWater.forEach((c) => c.copy(waterOf(first)))
  } else if (authored.splashSprites.some(Boolean)) {
    splashArt = new THREE.Group()
    const layer = (z: number, order: number) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }))
      mesh.position.z = z
      mesh.renderOrder = order
      splashArt!.add(mesh)
      return mesh
    }
    const back = layer(-1.9, 0)
    const front = layer(2.0, 5)
    showSplash = (index) => {
      const pair = authored.splashSprites[index]
      splashArt!.visible = !!pair
      if (!pair) return
      ;[
        [back, pair.back],
        [front, pair.front],
      ].forEach(([mesh, map]) => {
        const m = mesh as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
        const img = (map as THREE.Texture).image as HTMLImageElement
        m.material.map = map as THREE.Texture
        m.material.needsUpdate = true
        // the artwork is as wide as the product frame
        m.scale.set(FRAME.w, (FRAME.w * img.naturalHeight) / img.naturalWidth, 1)
      })
    }
    showSplash(opts.flavour)
  }
  if (splashArt) {
    product.add(splashArt)
    tongues.forEach((m) => product.remove(m))
    tongues.length = 0
    drops.count = 0
  }

  // ---------------------------------------------------------------- SLOT layers
  // Authored flat artwork: the whole product as six registered pictures, back to front.
  // When the flavour being shown has them, they are drawn instead of everything above. They
  // stand at different depths, so the camera's drift and push still give real parallax, and
  // each is scaled down by its distance so they line up exactly when the camera is at rest.
  const LAYER_Z: Record<LayerName, number> = { splashBack: -0.9, fruitBack: -1.0, rabbitBack: -0.5, cup: 0, hero: 0.4, rabbit: 0.45, fruitFront: 1.1, splashFront: 2.1 }
  const frame = new THREE.Group()
  frame.visible = false
  anchor.add(frame)
  const planeGeo = new THREE.PlaneGeometry(FRAME.w, FRAME.h)
  const planes = {} as Record<LayerName, THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>
  LAYER_ORDER.forEach((k, i) => {
    const mesh = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false }))
    mesh.position.z = LAYER_Z[k]
    mesh.userData.base = (CAMERA_Z - LAYER_Z[k]) / CAMERA_Z
    mesh.renderOrder = 10 + i
    mesh.visible = false
    frame.add(mesh)
    planes[k] = mesh
  })
  const layer = { active: false, show: 1, flip: 1, hasHero: false }
  // Artwork is kept in memory up to about eight pictures: every flavour when a set is one or
  // two layers, the one showing and the one before it when sets are full.
  const layerCache = new Map<number, Promise<LayerSet | null>>()
  const layersFor = (index: number) => {
    if (!layerCache.has(index)) layerCache.set(index, loadLayerSet(FLAVOURS[index].id))
    return layerCache.get(index)!
  }
  const showLayers = (index: number, set: LayerSet | null) => {
    layer.active = !!set
    layer.hasHero = !!set?.hero
    frame.visible = !!set
    product.visible = !set
    LAYER_ORDER.forEach((k) => {
      const map = set?.[k]
      planes[k].visible = !!map
      if (map) {
        planes[k].material.map = map
        planes[k].material.needsUpdate = true
      }
    })
    // full hero sets are six pictures each: on a phone only the flavour showing is kept
    const small = window.innerWidth < 820
    const keep = Math.max(small ? 1 : 2, Math.floor((small ? 5 : 10) / Math.max(1, Object.keys(set ?? {}).length)))
    for (const [i, pending] of layerCache) {
      if (i === index || layerCache.size <= keep) continue
      layerCache.delete(i)
      pending.then((old) => old && Object.values(old).forEach((tex) => !tex.userData.shared && tex.dispose()))
    }
  }
  showLayers(opts.flavour, await layersFor(opts.flavour))

  const dummy = new THREE.Object3D()
  const up = new THREE.Vector3(0, 1, 0)

  // ---------------------------------------------------------------- state
  const state = { spin: 0, hop: 0, dolly: 0, burst: 1, px: 0, py: 0, spx: 0, spy: 0 }
  const pose: CupPose = { cx: 0, cy: 0, size: 100, turn: 0, tilt: 0, push: 0 }
  let width = 1
  let height = 1
  let current = opts.flavour

  const resize = (w: number, hgt: number, dpr: number) => {
    width = w
    height = hgt
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, hgt, false)
    camera.aspect = w / hgt
    camera.updateProjectionMatrix()
  }

  const setTier = (next: Tier) => {
    if (next === tier) return
    tier = next
    liquid.material = juice[tier]
  }

  const render = (time: number, energy = 1) => {
    const t = calm ? 0 : time
    state.spx += (state.px - state.spx) * 0.06
    state.spy += (state.py - state.spy) * 0.06

    // pixels on screen to world units on the z = 0 plane
    const unit = (2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / height
    anchor.position.set((pose.cx - width / 2) * unit, -(pose.cy - height / 2) * unit, 0)
    anchor.scale.setScalar((pose.size * unit) / FRAME.h)
    anchor.rotation.z = pose.tilt - state.spx * 0.03

    // The camera moves in depth, not just across: it drifts with the pointer, pushes in as the
    // cup travels between sections, and again on a flavour change.
    camera.position.set(state.spx * 0.4, -state.spy * 0.25, CAMERA_Z - state.dolly - pose.push)
    camera.rotation.set(0, 0, 0)

    cup.rotation.y = -0.16 + Math.sin(t * 0.35) * 0.08 * energy + state.spin + pose.turn + state.spx * 0.16
    const bob = Math.sin(t * 0.8) * 0.05 * energy
    cup.position.y = bob
    rabbit.position.y = rabbitY + bob + state.hop * 0.45
    rabbit.rotation.z = 0.1 + Math.sin(t * 0.6) * 0.025 * energy - state.hop * 0.1
    // a drawing stays square to the viewer; a model turns a little with the pointer
    rabbit.rotation.y = flat ? 0 : 0.12 + state.spx * 0.25
    // breathing: a slight rise and fall, and a lean toward the pointer, while anything is going on
    const breath = Math.sin(t * 1.7) * 0.012 * energy
    if (flat) rabbit.rotation.z += state.spx * -0.05
    rabbit.scale.set(RABBIT * (1 - state.hop * 0.04 - breath * 0.5), RABBIT * (1 + state.hop * 0.07 + breath), RABBIT * (1 - state.hop * 0.04))

    const float = (f: Floater, show: number, i: number) => {
      f.obj.visible = show > 0.001
      if (!f.obj.visible) return
      const drift = f.piled ? 0.15 : 1
      f.obj.scale.setScalar(f.size * show)
      f.obj.position.set(
        f.home.x * (0.5 + 0.5 * show) + state.spx * (0.1 + (i % 3) * 0.05) * (1 + f.home.z * 0.4),
        f.home.y + Math.sin(t * f.speed + f.phase) * 0.2 * energy * drift - state.spy * (0.06 + (i % 3) * 0.04),
        f.home.z,
      )
      f.obj.rotation.x += 0.003 * f.speed * energy * drift
      f.obj.rotation.y += 0.004 * f.speed * energy * drift
    }
    sets.forEach((set) =>
      set.items.forEach((f, i) => {
        // items arrive one after another rather than all at once
        const n = set.items.length
        float(f, THREE.MathUtils.clamp(set.show * 1.7 - (i / n) * 0.7, 0, 1), i)
      }),
    )
    looseIce.forEach((f, i) => float(f, 1, i))

    const out = 1 - (1 - state.burst) ** 3
    splashArt?.scale.setScalar(Math.max(0.0001, 0.35 + 0.65 * out))
    tongues.forEach((m) => {
      const grow = THREE.MathUtils.clamp((state.burst - m.userData.delay) / (1 - m.userData.delay), 0, 1)
      m.scale.setScalar(1 - (1 - grow) ** 3)
      m.visible = grow > 0.001
    })
    dropData.forEach((d, i) => {
      const reach = d.reach * out
      dummy.position.set(
        d.dir.x * (cupRadius(d.from) + reach) + d.jitter.x * out,
        d.from + d.dir.y * reach * 1.3 - reach * reach * 0.16 + d.jitter.y * out + Math.sin(t * 0.9 + d.phase) * 0.05 * energy,
        0.4 + d.dir.z * reach + d.jitter.z * out,
      )
      dummy.quaternion.setFromUnitVectors(up, d.dir)
      const s = d.size * Math.min(1, state.burst * 3)
      dummy.scale.set(s, s * d.stretch, s)
      dummy.updateMatrix()
      drops.setMatrixAt(i, dummy.matrix)
    })
    drops.instanceMatrix.needsUpdate = true

    if (layer.active) {
      const rise = Math.sin(t * 0.8) * 0.05 * energy
      const breathe = Math.sin(t * 1.7) * 0.01 * energy
      LAYER_ORDER.forEach((k, i) => {
        const p = planes[k]
        const base = p.userData.base as number
        if (k === 'cup') {
          // a picture cannot turn, so on a flavour change the cup flips like a card instead
          p.scale.set(base * Math.max(0.02, layer.flip), base, 1)
          p.position.y = rise
          // with a hero picture, the drink alone only shows once the hero picture has gone
          p.material.opacity = layer.hasHero ? 1 - (pose.rabbit ?? 1) : 1
        } else if (k === 'hero') {
          const here = pose.rabbit ?? 1
          p.scale.set(base * Math.max(0.02, layer.flip), base, 1)
          p.position.y = rise + (1 - here) * 0.7
          p.material.opacity = here
        } else if (k === 'rabbit' || k === 'rabbitBack') {
          // Its body is behind the product and its paw is in front: both layers move as one.
          // Subtle only: it breathes, and gives a little with a flavour change. It does not bounce.
          p.scale.set(base * (1 - state.hop * 0.012), base * (1 + state.hop * 0.02 + breathe * 0.6), 1)
          // hero only: it is gone by the time the cup reaches the stage
          const here = pose.rabbit ?? 1
          p.material.opacity = Math.min(1, here * 1.6)
          p.position.y = rise + state.hop * 0.12 + (1 - here) * 0.5
          p.rotation.z = Math.sin(t * 0.6) * 0.006 * energy - state.spx * 0.01
        } else if (k === 'splashBack' || k === 'splashFront') {
          const here = layer.hasHero ? (pose.rabbit ?? 1) : 1
          p.scale.setScalar(base * (0.55 + 0.45 * out))
          p.position.y = rise
          p.material.opacity = Math.min(1, state.burst * 2.5) * here
        } else if (layer.hasHero) {
          // fruit lying at the foot of the hero product: it stays on the ground, and goes with the hero
          const here = pose.rabbit ?? 1
          p.scale.setScalar(base * (0.94 + 0.06 * layer.show))
          p.material.opacity = layer.show * here
          p.position.y = rise + (1 - here) * 0.4
        } else {
          // fruit: drifts a little, and comes and goes with the flavour
          p.scale.setScalar(base * (0.88 + 0.12 * layer.show))
          p.material.opacity = layer.show
          p.position.y = Math.sin(t * 0.5 + i) * 0.07 * energy
        }
      })
    }

    renderer.render(scene, camera)
  }

  // A new flavour is one move: the cup turns, the juice changes on the way round, the old
  // fruit leaves as the new fruit arrives, the splash goes again, the rabbit hops and the
  // camera pushes in and back out.
  let timeline: gsap.core.Timeline | null = null
  const paintTargets = () => [juice.high.attenuationColor, juice.low.color, juice.low.emissive, water.emissive, ...authoredLiquid]
  const deepTargets = () => [depth.color, depth.emissive]
  const waterTargets = () => [water.color, ...authoredWater]
  const setFlavour = (index: number, animate = true) => {
    if (index === current) return
    const from = current
    current = index
    const to = new THREE.Color(FLAVOURS[index].color)
    const toWater = waterOf(to)
    timeline?.kill()
    if (calm || !animate) {
      paintTargets().forEach((c) => c.copy(to))
      deepTargets().forEach((c) => c.set(FLAVOURS[index].deep))
      waterTargets().forEach((c) => c.copy(toWater))
      sets.forEach((set, i) => (set.show = i === index ? 1 : 0))
      showSplash(index)
      poses?.show(index)
      layersFor(index).then((set) => current === index && showLayers(index, set))
      return
    }
    const nextLayers = layersFor(index)
    timeline = gsap
      .timeline()
      .to(state, { spin: Math.round(state.spin / (Math.PI * 2)) * Math.PI * 2 + Math.PI * 2, duration: 1.25, ease: 'power3.inOut' }, 0)
      .to(state, { dolly: 1.5, duration: 0.6, ease: 'power2.out' }, 0)
      .to(state, { dolly: 0, duration: 0.85, ease: 'power2.inOut' }, 0.6)
      .to(state, { hop: 1, duration: 0.28, ease: 'power2.out' }, 0.22)
      .to(state, { hop: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' }, 0.5)
      .to(paintTargets(), { r: to.r, g: to.g, b: to.b, duration: 0.45, ease: 'power1.inOut' }, 0.35)
      .to(deepTargets(), { ...new THREE.Color(FLAVOURS[index].deep), duration: 0.45, ease: 'power1.inOut' }, 0.35)
      .to(state, { burst: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(waterTargets(), { r: toWater.r, g: toWater.g, b: toWater.b, duration: 0.05 }, 0.3)
      .call(() => showSplash(index), undefined, 0.32)
      // the rabbit changes pose at the top of its hop
      .call(() => poses?.show(index), undefined, 0.46)
      // layered artwork: fruit fades out, the cup flips and the new pictures come in on the way back
      .to(layer, { show: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(layer, { flip: 0, duration: 0.3, ease: 'power2.in' }, 0.12)
      .call(() => void nextLayers.then((set) => current === index && showLayers(index, set)), undefined, 0.43)
      .to(layer, { flip: 1, duration: 0.55, ease: 'back.out(1.6)' }, 0.45)
      .to(layer, { show: 1, duration: 0.8, ease: 'back.out(1.4)' }, 0.5)
      .to(state, { burst: 1, duration: 1, ease: 'power2.out' }, 0.36)
    sets.forEach((set, i) => {
      if (i === index) timeline!.to(set, { show: 1, duration: 0.9, ease: 'back.out(1.6)' }, 0.42)
      else if (set.show > 0 || i === from) timeline!.to(set, { show: 0, duration: 0.42, ease: 'power2.in' }, 0)
    })
  }

  const dispose = () => {
    timeline?.kill()
    layerCache.forEach((pending) => pending.then((set) => set && Object.values(set).forEach((tex) => tex.dispose())))
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.geometry.dispose()
      ;(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose())
    })
    Object.values(juice).forEach((m) => m.dispose())
    ;[printTex, chestTex, seedTex, sliceTex, skyTex].forEach((tex) => tex.dispose())
    env.dispose()
    pmrem.dispose()
    renderer.dispose()
  }

  return {
    render,
    resize,
    setFlavour,
    setTier,
    dispose,
    getTier: () => tier,
    setPose: (p: CupPose) => Object.assign(pose, p),
    setPointer: (x: number, y: number) => {
      state.px = x
      state.py = y
    },
    isBusy: () => !!timeline?.isActive() || Math.abs(state.px - state.spx) > 0.002 || Math.abs(state.py - state.spy) > 0.002,
  }
}
