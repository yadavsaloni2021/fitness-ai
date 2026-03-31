import seedData from '../../../../foods-seed.json'
import type { FoodStatus } from '@/types'

type SeedFood = (typeof seedData.foods)[number]

// Module-level map: built once per serverless instance, O(1) lookup by id
const foodMap = new Map(seedData.foods.map((f) => [f.id, f]))

function computeStatus(food: SeedFood, week: number, category: number): FoodStatus {
  const w = String(week)
  const c = String(category)

  // Weeks 9 and 10: check category_override first
  if ((week === 9 || week === 10) && food.category_override) {
    const override = (food.category_override as Record<string, Record<string, FoodStatus>>)[w]
    if (override && override[c] !== undefined) {
      return override[c]
    }
  }

  // All other weeks, or weeks 9–10 with no override for this item
  return (food.week_status as Record<string, FoodStatus>)[w]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const foodId = searchParams.get('food_id')
  const week = parseInt(searchParams.get('week') ?? '1', 10)
  const category = parseInt(searchParams.get('category') ?? '2', 10) // default: 2

  if (
    !foodId ||
    isNaN(week) || week < 1 || week > 12 ||
    ![1, 2, 3].includes(category)
  ) {
    return Response.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const food = foodMap.get(foodId)

  if (!food) {
    return Response.json({ error: 'Food not found' }, { status: 404 })
  }

  const status = computeStatus(food, week, category)

  return Response.json({
    food_id: foodId,
    week,
    category,
    status,
    moderation_note: status === 'moderation' ? food.moderation_note : null,
  })
}
