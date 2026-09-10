import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// TODO: Add push notification integration (Expo, web push) if needed

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Explicit ownership check — RLS is safety net, not primary guard
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, read_at, action_url, created_at')
    .eq('user_id', user.id)
    .or('read_at.is.null,created_at.gte.' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
