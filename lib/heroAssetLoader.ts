import * as THREE from 'three'
import { FLAVOURS } from '@/lib/data'
import { HERO_ASSETS, LAYER_ORDER, heroAsset, type FruitKind, type LayerName } from '@/lib/heroAssets'

// Loads whatever authored hero artwork the manifest declares, for lib/cupScene.ts.
// The scene keeps doing placement, camera, movement, flavour changes and lighting; an
// authored asset only replaces how one part looks. A slot that is empty, or whose file fails
// to load, comes back as null and the scene keeps its stand-in for that part.

export type LoadedHeroAssets = Awaited<ReturnType<typeof loadHeroAssets>>

const image = (url: string | null) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    if (!url) return resolve(null)
    const img = new Image()
    // decoded off the main thread before it is handed over, so showing it does not stall a frame
    img.onload = () => img.decode().then(() => resolve(img), () => resolve(img))
    img.onerror = () => {
      console.warn(`hero asset missing: ${url}`)
      resolve(null)
    }
    img.src = url
  })

const texture = async (url: string | null, srgb = true) => {
  const img = await image(url)
  if (!img) return null
  const tex = new THREE.Texture(img)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

// The glTF loader is only downloaded if a model is actually declared.
let gltfLoader: Promise<{ loadAsync: (url: string) => Promise<{ scene: THREE.Group }> }> | null = null
const model = async (url: string | null) => {
  if (!url) return null
  try {
    gltfLoader ??= import('three/examples/jsm/loaders/GLTFLoader.js').then((m) => new m.GLTFLoader())
    return (await (await gltfLoader).loadAsync(url)).scene as THREE.Object3D
  } catch {
    console.warn(`hero asset missing or unreadable: ${url}`)
    return null
  }
}

// The layered artwork for one flavour, or null if that flavour has no cup layer. Loaded when
// the flavour is first shown, not up front: a full set is six large images.
export type LayerSet = Partial<Record<LayerName, THREE.Texture>>
export const hasLayers = (id: string) => !!({ ...HERO_ASSETS.layers?.shared, ...HERO_ASSETS.layers?.[id] } as Partial<Record<LayerName, string>>).cup
// A layer in layers/shared/ (the rabbit) is the same picture for every flavour: it is loaded
// once and kept, and is marked so the scene does not throw it away with a flavour's own layers.
const sharedLayers = new Map<string, Promise<THREE.Texture | null>>()
const layerTexture = (path: string | undefined) => {
  if (!path || !path.startsWith('layers/shared/')) return texture(heroAsset(path ?? null))
  if (!sharedLayers.has(path))
    sharedLayers.set(
      path,
      texture(heroAsset(path)).then((tex) => {
        if (tex) tex.userData.shared = true
        return tex
      }),
    )
  return sharedLayers.get(path)!
}
export async function loadLayerSet(id: string): Promise<LayerSet | null> {
  if (!hasLayers(id)) return null
  const spec = { ...HERO_ASSETS.layers.shared, ...HERO_ASSETS.layers[id] }
  const loaded = await Promise.all(LAYER_ORDER.map((k) => layerTexture(spec[k])))
  const set: LayerSet = {}
  LAYER_ORDER.forEach((k, i) => {
    if (loaded[i]) set[k] = loaded[i]!
  })
  return set.cup ? set : null
}

export async function loadHeroAssets() {
  const a = HERO_ASSETS
  const kinds = Object.keys(a.fruit) as FruitKind[]
  const [cup, ice, rabbitModel, splashModel, rabbitImage, hoodiePrint, wordmarkBlack, wordmarkWhite, wordmarkCup, liquidNormal, rabbitPoses, fruitModels, splashSprites] = await Promise.all([
    model(heroAsset(a.cup.model)),
    model(heroAsset(a.ice.model)),
    model(heroAsset(a.rabbit.model)),
    model(heroAsset(a.splash.model)),
    texture(heroAsset(a.rabbit.image)),
    image(heroAsset(a.hoodie.print)),
    image(heroAsset(a.wordmark.black)),
    image(heroAsset(a.wordmark.white)),
    image(heroAsset(a.wordmark.cup)),
    texture(heroAsset(a.liquid.normal), false),
    Promise.all(FLAVOURS.map((f) => texture(heroAsset(a.rabbit.poses[f.id])))),
    Promise.all(kinds.map((k) => model(heroAsset(a.fruit[k])))),
    Promise.all(
      FLAVOURS.map(async (f) => {
        const pair = a.splash.sprites[f.id]
        if (!pair) return null
        const [back, front] = await Promise.all([texture(heroAsset(pair.back)), texture(heroAsset(pair.front))])
        return back && front ? { back, front } : null
      }),
    ),
  ])
  const fruit = Object.fromEntries(kinds.map((k, i) => [k, fruitModels[i]])) as Record<FruitKind, THREE.Object3D | null>
  return { cup, ice, rabbitModel, rabbitImage, rabbitPoses, splashModel, splashSprites, hoodiePrint, wordmarkBlack, wordmarkWhite, wordmarkCup, liquidNormal, fruit }
}

// Authored models can be made at any scale and about any origin. This sizes one to the space
// its stand-in occupies and returns it inside a holder, so the scene can go on moving and
// scaling the holder exactly as it does the stand-in.
//   height: scale so the model is this tall.   size: scale so its largest side is this long.
//   sit: put the model's base, rather than its centre, at the holder's origin.
export function fitted(object: THREE.Object3D, opts: { height?: number; size?: number; sit?: boolean }) {
  const box = new THREE.Box3().setFromObject(object)
  const dims = box.getSize(new THREE.Vector3())
  const centre = box.getCenter(new THREE.Vector3())
  const scale = opts.height ? opts.height / (dims.y || 1) : (opts.size ?? 1) / (Math.max(dims.x, dims.y, dims.z) || 1)
  object.position.set(-centre.x * scale, -(opts.sit ? box.min.y : centre.y) * scale, -centre.z * scale)
  object.scale.multiplyScalar(scale)
  const holder = new THREE.Group()
  holder.add(object)
  return holder
}

// A transparent image standing upright in the scene, base at the holder's origin.
export function cutOut(map: THREE.Texture, height: number) {
  const img = map.image as HTMLImageElement
  const geo = new THREE.PlaneGeometry((height * img.naturalWidth) / img.naturalHeight, height)
  geo.translate(0, height / 2, 0)
  const holder = new THREE.Group()
  holder.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.02, toneMapped: false })))
  return holder
}

// A set of cut-outs, one per flavour, shown one at a time. Each keeps its own proportions.
export function cutOutSet(maps: (THREE.Texture | null)[], height: number) {
  const geo = new THREE.PlaneGeometry(1, 1)
  geo.translate(0, 0.5, 0)
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.02, toneMapped: false }))
  const holder = new THREE.Group()
  holder.add(mesh)
  const show = (index: number) => {
    const map = maps[index] ?? maps.find(Boolean)
    if (!map) return
    const img = map.image as HTMLImageElement
    mesh.material.map = map
    mesh.material.needsUpdate = true
    mesh.scale.set((height * img.naturalWidth) / img.naturalHeight, height, 1)
  }
  return { holder, mesh, show }
}

// Materials in an authored model that the scene should recolour, found by name.
// Name a material "liquid…" (cup) or "water…" (splash) and it follows the flavour.
export function tintable(object: THREE.Object3D, prefix: string) {
  const colours: THREE.Color[] = []
  object.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    ;(Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => {
      if (!m.name.toLowerCase().startsWith(prefix)) return
      const mat = m as THREE.MeshPhysicalMaterial
      // a refracting material is coloured by what it absorbs; anything else by its base colour
      colours.push(mat.transmission > 0 && mat.attenuationColor ? mat.attenuationColor : mat.color)
    })
  })
  return colours
}
