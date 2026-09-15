// app/api/tts/route.ts — GET ?text=…&pair=… → { url } for cached or freshly synthesised speech.
// 503 { fallback: true } when the provider is not configured or the text is not the caller's own;
// the client then uses browser speech.
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { cachedAudioUrl, getAudioUrl, ttsConfigured } from '@/lib/voice/tts'
import { isPairId, getPair, DEFAULT_PAIR, type PhraseField } from '@/lib/pairs'

export const maxDuration = 120

/**
 * Only the caller's own words get synthesised: a phrase, word or grammar example in one of
 * their lessons, or a row in their vocabulary (whose spelling can differ from the lesson's).
 */
async function ownsText(db: SupabaseClient, userId: string, field: PhraseField, text: string) {
  const lessonsWith = (shape: Record<string, unknown>) =>
    db.from('lessons').select('id').eq('user_id', userId).contains('lesson_json', shape).limit(1)
  const results = await Promise.all([
    lessonsWith({ phrases: [{ [field]: text }] }),
    lessonsWith({ vocabulary: [{ [field]: text }] }),
    lessonsWith({ grammar: { examples: [{ [field]: text }] } }),
    db.from('vocabulary').select('id').eq('user_id', userId).eq(field, text).limit(1),
  ])
  for (const { error } of results) if (error) throw new Error(`tts ownership check failed: ${error.message}`)
  return results.some(r => r.data?.length)
}

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
    // A cached clip is already public by URL, so only a fresh synthesis needs the ownership check.
    const cached = await cachedAudioUrl(text, pair)
    if (!cached && !(await ownsText(supabase, user.id, getPair(pair).targetField, text))) {
      return NextResponse.json({ fallback: true }, { status: 503 })
    }
    const url = cached ?? await getAudioUrl(text, pair)
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, max-age=86400' } })
  } catch (err) {
    console.error('tts failed', err)
    return NextResponse.json({ fallback: true, error: 'synthesis failed' }, { status: 503 })
  }
}
