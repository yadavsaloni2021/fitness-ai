import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  computeCycleDay,
  computeCurrentWeek,
  computeDaysRemaining,
  seasonJumpStartDate,
} from '@/lib/cycle'

async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* read-only context */ }
        },
      },
    }
  )
}

export async function GET() {
  const supabase = await getSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's timezone from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()

  const timezone = profile?.timezone ?? 'UTC'

  const { data: cycleState, error } = await supabase
    .from('cycle_state')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[/api/cycle GET] error:', error.message)
    return Response.json({ error: 'Failed to fetch cycle state' }, { status: 500 })
  }

  if (!cycleState) {
    return Response.json({ configured: false })
  }

  const cycleDay = computeCycleDay(cycleState.start_date, timezone)
  const computedWeek = computeCurrentWeek(cycleDay)
  const daysRemaining = computeDaysRemaining(cycleDay)

  return Response.json({
    configured: true,
    start_date: cycleState.start_date,
    current_week: cycleState.current_week,
    category: cycleState.category,
    computed_week: computedWeek,
    cycle_day: cycleDay,
    days_remaining: daysRemaining,
  })
}

export async function PUT(request: Request) {
  const supabase = await getSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { start_date, current_week, category } = body as {
    start_date?: string
    current_week?: number
    category?: number | null
  }

  // Get user's timezone for season jump calculation
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()

  const timezone = profile?.timezone ?? 'UTC'

  // Build the update payload
  const updatePayload: Record<string, unknown> = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  }

  if (current_week !== undefined && current_week >= 1 && current_week <= 12) {
    // Season jump: recalculate start_date
    updatePayload.current_week = current_week
    updatePayload.start_date = seasonJumpStartDate(current_week, timezone)
  } else if (start_date) {
    updatePayload.start_date = start_date
  }

  if (category !== undefined) {
    updatePayload.category = category
  }

  const { data, error } = await supabase
    .from('cycle_state')
    .upsert(updatePayload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('[/api/cycle PUT] error:', error.message)
    return Response.json({ error: 'Failed to update cycle state' }, { status: 500 })
  }

  return Response.json({ data })
}

export async function DELETE() {
  const supabase = await getSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's timezone for "today"
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()

  const timezone = profile?.timezone ?? 'UTC'
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const { error } = await supabase
    .from('cycle_state')
    .update({
      start_date: todayStr,
      current_week: 1,
      category: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('[/api/cycle DELETE] error:', error.message)
    return Response.json({ error: 'Failed to reset cycle' }, { status: 500 })
  }

  return Response.json({ reset: true })
}
