import type { Metadata } from 'next'
import { Studio } from '@/components/Studio'

// Not part of the site. tools/render-cups.mjs opens this page to photograph the 3D cup
// for each flavour; those images are the fallback when WebGL or motion is off.
export const metadata: Metadata = { title: 'Cup studio', robots: { index: false, follow: false } }

export default function StudioPage() {
  return <Studio />
}
