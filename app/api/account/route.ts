import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function DELETE() {
  const cookieStore = await cookies()

  // Identify the requesting user via anon key (respects RLS)
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

  // Use service role key to hard-delete the auth.users row.
  // ON DELETE CASCADE removes profiles, cycle_state, and session_events rows.
  const adminSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { error } = await adminSupabase.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[/api/account DELETE] Failed to delete user:', error.message)
    return Response.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return Response.json({ deleted: true })
}
