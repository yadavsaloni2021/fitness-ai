import { createServerClient } from '@supabase/ssr'
import type { FoodItem } from '@/types'

export async function GET() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .eq('is_sugar_name', false)
    .order('name')

  if (error) {
    console.error('[/api/foods] Supabase error:', error.message)
    return Response.json({ error: 'Failed to fetch foods' }, { status: 500 })
  }

  const updatedAt = new Date().toISOString()

  return Response.json({
    foods: data as FoodItem[],
    total: data.length,
    updated_at: updatedAt,
  })
}
