import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
} from 'serwist'
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[]
  }
}

declare const self: WorkerGlobalScope & SerwistGlobalConfig & typeof globalThis

const runtimeCaching: RuntimeCaching[] = [
  // /api/foods — Stale-While-Revalidate, 24h max-age
  {
    matcher: ({ url }) => url.pathname === '/api/foods',
    handler: new StaleWhileRevalidate({
      cacheName: 'api-foods',
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 }),
      ],
    }),
  },
  // /api/foods/status — Network-first, 1h cache fallback
  {
    matcher: ({ url }) => url.pathname === '/api/foods/status',
    handler: new NetworkFirst({
      cacheName: 'api-foods-status',
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 60 * 60 }),
      ],
    }),
  },
  // Static assets — Cache-first, immutable
  {
    matcher: ({ request }) =>
      request.destination === 'image' ||
      request.destination === 'font',
    handler: new CacheFirst({
      cacheName: 'static-assets',
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365 }),
      ],
    }),
  },
  // All other routes — fall through to defaultCache
  ...defaultCache,
]

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
})

serwist.addEventListeners()
