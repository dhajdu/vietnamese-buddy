// lib/vocabulary/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

// Arguments arrive from the browser, so they are checked before they reach Postgres.
const StatusArgs = z.object({ id: z.uuid(), status: z.enum(['new', 'learning', 'known']) })

export async function setVocabularyStatus(id: string, status: 'new' | 'learning' | 'known') {
  const user = await requireAuth()
  if (!StatusArgs.safeParse({ id, status }).success) return { error: 'Word not found.' }
  const db = await createClient()
  const [word, cards] = await Promise.all([
    db.from('vocabulary').update({ status }).eq('id', id).eq('user_id', user.id).select('id'),
    // A known word is known everywhere: its cards in every lesson leave the due deck too.
    status === 'known'
      ? db.from('flashcards').update({ status: 'known' }).eq('user_id', user.id).eq('vocabulary_id', id).neq('status', 'known')
      : null,
  ])
  const error = word.error ?? cards?.error
  if (error) {
    console.error('setVocabularyStatus failed', error)
    return { error: 'Could not update that word. Try again.' }
  }
  if (!word.data?.length) return { error: 'Word not found.' }
  revalidatePath('/app/vocabulary')
  revalidatePath('/app')
  return { ok: true }
}
