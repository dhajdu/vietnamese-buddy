// app/api/sessions/[id]/messages/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UIMessage } from 'ai'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Verify session ownership before loading messages
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!session) return new NextResponse('Not Found', { status: 404 })

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, parts, created_at')
    .eq('session_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const messages: UIMessage[] = (data ?? []).map(row => ({
    id: row.id,
    role: row.role as UIMessage['role'],
    parts: row.parts,
  }))

  return NextResponse.json(messages)
}
