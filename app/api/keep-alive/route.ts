import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (error) {
    console.error('[keep-alive] Supabase ping failed:', error.message)
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, timestamp: new Date().toISOString() })
}
