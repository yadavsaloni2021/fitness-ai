import { createServerClient } from '@supabase/ssr'
import type { FoodStatus } from '@/types'

type FoodRow = {
  week_status: Record<string, FoodStatus>
  category_override: Record<string, Record<string, FoodStatus>> | null
  moderation_note: string | null
}

function computeStatus(food: FoodRow, week: number, category: number): FoodStatus {
  const w = String(week)
  const c = String(category)

  // Weeks 9 and 10: check category_override first
  if ((week === 9 || week === 10) && food.category_override) {
    const override = food.category_override[w]
    if (override && override[c] !== undefined) {
      return override[c]
    }
  }

  // All other weeks, or weeks 9–10 with no override for this item
  return food.week_status[w]
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: food, error } = await supabase
    .from('food_items')
    .select('week_status, category_override, moderation_note')
    .eq('id', foodId)
    .single<FoodRow>()

  if (error || !food) {
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
