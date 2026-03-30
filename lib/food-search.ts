import MiniSearch from 'minisearch'
import type { FoodItem } from '@/types'

export const foodIndex = new MiniSearch<FoodItem>({
  idField: 'id',
  fields: ['name', 'aliases_flat'],
  storeFields: ['id'],
  searchOptions: {
    boost: { name: 2 },
    prefix: true,
    fuzzy: 0.15,
  },
  extractField: (document, fieldName) => {
    if (fieldName === 'aliases_flat') {
      return (document.aliases ?? []).join(' ')
    }
    return String((document as unknown as Record<string, unknown>)[fieldName] ?? '')
  },
})

// foodMap stores the full items for retrieval by id after search
export let foodMap = new Map<string, FoodItem>()

/**
 * Build the MiniSearch index from a list of food items.
 * Safe to call multiple times — clears the existing index first.
 */
export function buildIndex(foods: FoodItem[]): void {
  if (foodIndex.documentCount > 0) foodIndex.removeAll()
  foodIndex.addAll(foods)
  foodMap = new Map(foods.map(f => [f.id, f]))
}

/**
 * Returns true if the search index has been built.
 */
export function isIndexReady(): boolean {
  return foodIndex.documentCount > 0
}

/**
 * Search the food index with exact-before-fuzzy ordering.
 * Returns an empty array if the query is empty.
 */
export function search(query: string): FoodItem[] {
  if (!query.trim()) return []

  // Pass 1: exact prefix, no fuzzy
  const exact = foodIndex.search(query, { prefix: true, fuzzy: false })

  // Pass 2: fuzzy — catches typos and close aliases
  const fuzzy = foodIndex.search(query, { prefix: true, fuzzy: 0.15 })

  // Merge: exact results first, then fuzzy results not already present
  const seen = new Set(exact.map(r => r.id))
  const merged = [
    ...exact,
    ...fuzzy.filter(r => !seen.has(r.id)),
  ]

  return merged
    .map(r => foodMap.get(r.id as string))
    .filter((item): item is FoodItem => item !== undefined)
}
