// lib/flashcards/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { recordActivity } from '@/lib/activity/actions'

export type ReviewResult = 'known' | 'again'

export async function reviewCard(cardId: string, result: ReviewResult) {
  const user = await requireAuth()
  const db = await createClient()
  const now = new Date().toISOString()

  const { data: card, error } = await db.from('flashcards')
    .select('id, vocabulary_id, review_count').eq('id', cardId).eq('user_id', user.id).single()
  if (error || !card) return { error: 'Card not found.' }

  const { error: cErr } = await db.from('flashcards').update({
    status: result === 'known' ? 'known' : 'review',
    review_count: (card.review_count as number) + 1,
    last_reviewed_at: now,
  }).eq('id', cardId)
  if (cErr) return { error: cErr.message }

  if (card.vocabulary_id) {
    const { data: v } = await db.from('vocabulary').select('review_count').eq('id', card.vocabulary_id).single()
    await db.from('vocabulary').update({
      status: result === 'known' ? 'known' : 'learning',
      review_count: ((v?.review_count as number) ?? 0) + 1,
      last_reviewed_at: now,
    }).eq('id', card.vocabulary_id)
  }

  const { data: profile } = await db.from('profiles').select('timezone').eq('id', user.id).single()
  await recordActivity(db, 'card_reviewed', profile?.timezone as string | undefined)
  revalidatePath('/')
  return { ok: true }
}
