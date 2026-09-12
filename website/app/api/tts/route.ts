// app/api/tts/route.ts — GET ?text=…&pair=… → { url } for cached or freshly synthesised speech.
// 503 { fallback: true } when the provider is not configured; the client then uses browser speech.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAudioUrl, ttsConfigured } from '@/lib/voice/tts'
import { isPairId, DEFAULT_PAIR } from '@/lib/pairs'

export const maxDuration = 120

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const params = new URL(request.url).searchParams
  const text = params.get('text')?.trim() ?? ''
  const pairParam = params.get('pair')
  const pair = isPairId(pairParam) ? pairParam : DEFAULT_PAIR
  if (text.length < 3 || text.length > 500) return NextResponse.json({ error: 'text must be 3–500 characters' }, { status: 400 })
  if (!ttsConfigured(pair)) return NextResponse.json({ fallback: true }, { status: 503 })

  try {
    const url = await getAudioUrl(text, pair)
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, max-age=86400' } })
  } catch (err) {
    console.error('tts failed', err)
    return NextResponse.json({ fallback: true, error: 'synthesis failed' }, { status: 503 })
  }
}
