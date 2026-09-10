// app/api/tts/route.ts — GET ?text=… → { url } for cached/synthesised Southern Vietnamese audio.
// 503 { fallback: true } when no TTS key is configured; the client then uses browser speech.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAudioUrl, ttsConfigured } from '@/lib/voice/tts'

export const maxDuration = 120

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const text = new URL(request.url).searchParams.get('text')?.trim() ?? ''
  if (text.length < 3 || text.length > 500) return NextResponse.json({ error: 'text must be 3–500 characters' }, { status: 400 })
  if (!ttsConfigured()) return NextResponse.json({ fallback: true }, { status: 503 })

  try {
    const url = await getAudioUrl(text)
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, max-age=86400' } })
  } catch (err) {
    console.error('tts failed', err)
    return NextResponse.json({ fallback: true, error: 'synthesis failed' }, { status: 503 })
  }
}
