import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// The rabbit from the approved Clean Classic hero, modelled for the 3D scene: white, blue
// shades, blue hoodie with the mark on the chest, sitting with its arms on the rim and its
// feet hanging over the front. The approved artwork is a drawn character with ink outlines,
// so every part here carries an outline (a slightly larger copy of itself, drawn inside out)
// and is lit softly, which keeps it reading as the same illustration rather than as plastic.
// No source file for this character exists; this is a reconstruction, to be replaced by the
// brand's own model or render when one is supplied.
//
// The group's origin is the centre of the cup's rim. +z faces the camera.
export function buildRabbit(chestMark: THREE.Texture) {
  const rabbit = new THREE.Group()

  const fur = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 })
  const earInner = new THREE.MeshStandardMaterial({ color: '#c4c6cc', roughness: 0.9 })
  const hoodie = new THREE.MeshStandardMaterial({ color: '#1669cf', roughness: 0.8 })
  const hoodieDark = new THREE.MeshStandardMaterial({ color: '#0f4ea3', roughness: 0.85 })
  const shorts = new THREE.MeshStandardMaterial({ color: '#15161a', roughness: 0.85 })
  const frame = new THREE.MeshStandardMaterial({ color: '#1e8fec', roughness: 0.35 })
  const lens = new THREE.MeshStandardMaterial({ color: '#08090c', roughness: 0.38, envMapIntensity: 0.12 })
  const glint = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })
  const nose = new THREE.MeshStandardMaterial({ color: '#e8a0ac', roughness: 0.6 })
  const ink = new THREE.MeshBasicMaterial({ color: '#15161a', side: THREE.BackSide })
  const line = new THREE.MeshBasicMaterial({ color: '#15161a' })

  type Vec = [number, number, number]
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos: Vec, rot: Vec = [0, 0, 0], scale: Vec = [1, 1, 1], outline = 0.04) => {
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(...pos)
    mesh.rotation.set(...rot)
    mesh.scale.set(...scale)
    if (outline) {
      // the outline grows each part by the same distance whatever its size
      geo.computeBoundingSphere()
      const r = geo.boundingSphere!.radius
      const hull = new THREE.Mesh(geo, ink)
      hull.scale.set(1 + outline / (r * scale[0]), 1 + outline / (r * scale[1]), 1 + outline / (r * scale[2]))
      mesh.add(hull)
    }
    parent.add(mesh)
    return mesh
  }
  const sphere = (r: number) => new THREE.SphereGeometry(r, 36, 24)
  const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 10, 24)

  // ---------------------------------------------------------------- body, in the hoodie
  add(rabbit, capsule(0.78, 0.35), hoodie, [0, 0.72, -0.1], [0.12, 0, 0], [1.12, 1, 0.92])
  // hood, slumped behind the neck
  add(rabbit, sphere(0.62), hoodie, [0, 1.3, -0.62], [0, 0, 0], [1.2, 0.85, 0.8])
  add(rabbit, new THREE.TorusGeometry(0.6, 0.17, 14, 40), hoodie, [0, 1.26, -0.02], [Math.PI / 2 - 0.25, 0, 0], [1.05, 0.95, 1], 0.03)
  // front pocket and hem
  add(rabbit, new RoundedBoxGeometry(0.9, 0.34, 0.2, 4, 0.1), hoodieDark, [0, 0.38, 0.62], [-0.18, 0, 0], [1, 1, 1], 0)
  // the mark on the chest
  const chest = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.98), new THREE.MeshBasicMaterial({ map: chestMark, transparent: true, depthWrite: false, toneMapped: false }))
  chest.position.set(0, 0.84, 0.69)
  chest.rotation.set(-0.12, 0, 0)
  chest.renderOrder = 5
  rabbit.add(chest)

  // arms resting on the rim, white paws at the ends
  ;[-1, 1].forEach((side) => {
    add(rabbit, capsule(0.25, 0.55), hoodie, [side * 0.98, 0.72, 0.18], [0.5, 0, side * 0.55], [1, 1, 1])
    add(rabbit, sphere(0.27), fur, [side * 1.22, 0.36, 0.5], [0, 0, 0], [1, 0.9, 1.1])
  })

  // shorts, then legs over the front of the rim with big soft feet
  add(rabbit, sphere(0.6), shorts, [0, 0.28, 0.35], [0, 0, 0], [1.25, 0.6, 0.9], 0)
  ;[-1, 1].forEach((side) => {
    add(rabbit, capsule(0.27, 0.36), fur, [side * 0.48, 0.3, 0.86], [1.1, 0, side * -0.12], [1, 1, 1])
    add(rabbit, sphere(0.3), fur, [side * 0.54, 0.0, 1.22], [0.5, 0, 0], [0.95, 1.2, 0.85])
  })

  // ---------------------------------------------------------------- head
  const head = new THREE.Group()
  head.position.set(0.04, 2.0, 0.12)
  head.rotation.set(0.04, 0, -0.05)
  rabbit.add(head)
  add(head, sphere(0.95), fur, [0, 0, 0], [0, 0, 0], [1.08, 0.95, 0.98])
  // cheek tufts and the muzzle
  ;[-1, 1].forEach((side) => add(head, sphere(0.42), fur, [side * 0.62, -0.36, 0.38], [0, 0, 0], [1.05, 0.85, 0.9]))
  add(head, sphere(0.34), fur, [0, -0.36, 0.78], [0, 0, 0], [1.25, 0.8, 0.7], 0.025)
  add(head, sphere(0.085), nose, [0, -0.2, 1.02], [0, 0, 0], [1.2, 0.85, 0.8], 0.018)
  // the smile: two small arcs under the nose
  ;[-1, 1].forEach((side) => add(head, new THREE.TorusGeometry(0.105, 0.018, 8, 20, Math.PI), line, [side * 0.105, -0.36, 1.0], [0.15, 0, Math.PI], [1, 1, 1], 0))

  // ears: one up, one tipped out to the side
  const ear = (pos: Vec, rot: Vec) => {
    const g = new THREE.Group()
    g.position.set(...pos)
    g.rotation.set(...rot)
    add(g, sphere(1), fur, [0, 0.95, 0], [0, 0, 0], [0.36, 1.0, 0.15], 0.035)
    add(g, sphere(1), earInner, [0, 0.93, 0.09], [0, 0, 0], [0.2, 0.76, 0.09], 0)
    head.add(g)
  }
  ear([-0.3, 0.55, -0.05], [-0.08, 0.15, 0.1])
  ear([0.5, 0.45, -0.05], [-0.05, -0.2, -0.95])

  // shades: blue frames, black lenses, wrapped slightly round the face
  ;[-1, 1].forEach((side) => {
    const eye = new THREE.Group()
    eye.position.set(side * 0.46, 0.1, 0.84)
    eye.rotation.set(0, side * 0.3, side * -0.04)
    add(eye, new RoundedBoxGeometry(0.9, 0.68, 0.12, 8, 0.28), frame, [0, 0, 0], [0, 0, side * -0.08], [1, 1, 1], 0.025)
    add(eye, new RoundedBoxGeometry(0.66, 0.46, 0.13, 8, 0.2), lens, [0, -0.02, 0.015], [0, 0, side * -0.08], [1, 1, 1], 0)
    // a glint on each lens, as drawn in the approved artwork
    add(eye, new THREE.CircleGeometry(0.055, 16), glint, [side * -0.16, 0.08, 0.085], [0, 0, 0], [1.6, 0.7, 1], 0)
    // arm of the shades running back along the head
    add(eye, new THREE.BoxGeometry(0.62, 0.11, 0.06), frame, [side * 0.52, 0.12, -0.22], [0, side * -1.05, 0], [1, 1, 1], 0.02)
    head.add(eye)
  })
  add(head, new THREE.BoxGeometry(0.2, 0.11, 0.1), frame, [0, 0.15, 0.97], [0, 0, 0], [1, 1, 1], 0.02)

  return rabbit
}
