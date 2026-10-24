import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  // local pictures may carry a ?v= revision (see lib/heroAssets.ts)
  images: { formats: ['image/avif', 'image/webp'], localPatterns: [{ pathname: '/assets/**' }, { pathname: '/brand/**' }] },
}

export default config
