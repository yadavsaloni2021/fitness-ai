import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { screen_name, cycle_week } = body as {
    screen_name: string
    cycle_week: number | null
  }

  if (!screen_name) {
    return Response.json({ error: 'screen_name is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('session_events')
    .insert({
      user_id: user.id,
      screen_name,
      cycle_week: cycle_week ?? null,
    })

  if (error) {
    console.error('[/api/events POST] error:', error.message)
    return Response.json({ error: 'Failed to log event' }, { status: 500 })
  }

  return Response.json({ logged: true })
}
