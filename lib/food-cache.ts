import type { FoodItem } from '@/types'

const CACHE_KEY = 'lw:foods:v1'
const CACHE_UPDATED_AT_KEY = 'lw:foods:updated_at'
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Save food items to localStorage cache.
 */
export function saveFoodsToCache(foods: FoodItem[], updatedAt: string): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(foods))
    localStorage.setItem(CACHE_UPDATED_AT_KEY, updatedAt)
  } catch (e) {
    console.warn('[food-cache] Failed to save to localStorage:', e)
  }
}

/**
 * Load food items from localStorage cache.
 * Returns null if no cache exists.
 */
export function loadFoodsFromCache(): FoodItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as FoodItem[]
  } catch (e) {
    console.warn('[food-cache] Failed to load from localStorage:', e)
    return null
  }
}

/**
 * Get the stored cache updated_at timestamp.
 */
export function getCacheUpdatedAt(): string | null {
  try {
    return localStorage.getItem(CACHE_UPDATED_AT_KEY)
  } catch {
    return null
  }
}

/**
 * Check if the cache is stale (older than CACHE_MAX_AGE_MS).
 */
export function isCacheStale(): boolean {
  const updatedAt = getCacheUpdatedAt()
  if (!updatedAt) return true
  const cacheTime = new Date(updatedAt).getTime()
  return Date.now() - cacheTime > CACHE_MAX_AGE_MS
}
