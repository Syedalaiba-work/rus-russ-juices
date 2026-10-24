'use client'

import { useSyncExternalStore } from 'react'
import { DEFAULT_FLAVOUR, FLAVOURS } from '@/lib/data'

// One picked flavour for the whole page: the hero cards, the flavour stage and the 3D scene
// all read it from here. It is mirrored to ?flavour= so a link can open on a flavour.
let active = DEFAULT_FLAVOUR
let hydrated = false
const listeners = new Set<() => void>()

const apply = (i: number) => {
  active = i
  document.documentElement.style.setProperty('--tint', FLAVOURS[i].soft)
  document.documentElement.style.setProperty('--flavour', FLAVOURS[i].color)
  listeners.forEach((fn) => fn())
}

export const flavour = {
  get: () => active,
  // A pick (card, chip, arrow) is written to the URL. The juice tour shows each flavour as
  // you scroll past it, which is not a pick, so it passes url: false.
  set(i: number, opts: { url?: boolean } = {}) {
    const next = (i + FLAVOURS.length) % FLAVOURS.length
    if (next === active) return
    apply(next)
    if (opts.url === false) return
    const url = new URL(window.location.href)
    url.searchParams.set('flavour', FLAVOURS[next].id)
    window.history.replaceState(null, '', url)
  },
  // Reads the URL once, after hydration, so server and client markup agree.
  hydrate() {
    if (hydrated) return
    hydrated = true
    const id = new URLSearchParams(window.location.search).get('flavour')
    const i = FLAVOURS.findIndex((f) => f.id === id)
    if (i >= 0 && i !== active) apply(i)
  },
  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

export const useFlavour = () => useSyncExternalStore(flavour.subscribe, flavour.get, () => DEFAULT_FLAVOUR)

// Whether the live 3D cup has taken over from the photographs. While it has, the hidden
// photographs are not swapped on a flavour change: fetching and decoding large images nobody
// can see was costing frames on phones.
let live = false
const liveListeners = new Set<() => void>()
export const cupIsLive = {
  get: () => live,
  set(on: boolean) {
    if (on === live) return
    live = on
    liveListeners.forEach((fn) => fn())
  },
  subscribe(fn: () => void) {
    liveListeners.add(fn)
    return () => {
      liveListeners.delete(fn)
    }
  },
}
export const useCupIsLive = () => useSyncExternalStore(cupIsLive.subscribe, cupIsLive.get, () => false)
