import type { NextConfig } from 'next'
import withSerwist from '@serwist/next'

const withSerwistConfig = withSerwist({
  swSrc: 'sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
})

const nextConfig: NextConfig = {
  // other Next.js config here
}

export default withSerwistConfig(nextConfig)
