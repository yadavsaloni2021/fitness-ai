import seedData from '../../../foods-seed.json'
import type { FoodItem } from '@/types'

// Filter sugar-name entries (hidden from food lookup UI per PRD §4.4)
const foods = (seedData.foods as unknown as FoodItem[])
  .filter((f) => !f.is_sugar_name)
  .sort((a, b) => a.name.localeCompare(b.name))

// Stable version tag — changes when the entry count changes (sufficient for MVP cache invalidation)
const DATA_VERSION = `seed-v${seedData.total_entries}`

export async function GET() {
  return Response.json({
    foods,
    total: foods.length,
    updated_at: DATA_VERSION,
  })
}
