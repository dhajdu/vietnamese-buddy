// lib/flashcards/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { recordActivity } from '@/lib/activity/actions'

export type ReviewResult = 'known' | 'again'

// Arguments arrive from the browser, so they are checked before they reach Postgres.
const ReviewArgs = z.object({ cardId: z.uuid(), result: z.enum(['known', 'again']) })
const SAVE_FAILED = 'Could not save that answer. Try again.'

export async function reviewCard(cardId: string, result: ReviewResult) {
  const user = await requireAuth()
  if (!ReviewArgs.safeParse({ cardId, result }).success) return { error: 'Card not found.' }
  const db = await createClient()
  const now = new Date().toISOString()
  const known = result === 'known'

  const [cardRes, profileRes] = await Promise.all([
    db.from('flashcards').select('id, vocabulary_id, review_count, vocabulary(review_count)')
      .eq('id', cardId).eq('user_id', user.id).maybeSingle(),
    db.from('profiles').select('timezone').eq('id', user.id).single(),
  ])
  if (cardRes.error || profileRes.error) {
    console.error('reviewCard read failed', cardRes.error ?? profileRes.error)
    return { error: SAVE_FAILED }
  }
  const card = cardRes.data as unknown as {
    vocabulary_id: string | null; review_count: number; vocabulary: { review_count: number } | null
  } | null
  if (!card) return { error: 'Card not found.' }
  const vocabularyId = card.vocabulary_id

  const writes = await Promise.all([
    db.from('flashcards').update({
      status: known ? 'known' : 'review',
      review_count: card.review_count + 1,
      last_reviewed_at: now,
    }).eq('id', cardId).eq('user_id', user.id),
    vocabularyId && db.from('vocabulary').update({
      status: known ? 'known' : 'learning',
      review_count: (card.vocabulary?.review_count ?? 0) + 1,
      last_reviewed_at: now,
    }).eq('id', vocabularyId).eq('user_id', user.id),
    // A known word is known everywhere: its cards in other lessons leave the due deck too.
    vocabularyId && known && db.from('flashcards').update({ status: 'known' })
      .eq('user_id', user.id).eq('vocabulary_id', vocabularyId).neq('id', cardId).neq('status', 'known'),
  ])
  const writeError = writes.find(w => w && w.error)
  if (writeError && writeError.error) {
    console.error('reviewCard write failed', writeError.error)
    return { error: SAVE_FAILED }
  }

  // Streak bookkeeping must never turn a saved answer into an error.
  await recordActivity(db, 'card_reviewed', profileRes.data?.timezone as string | undefined)
    .catch(err => console.error('recordActivity failed', err))
  revalidatePath('/app')
  return { ok: true }
}
