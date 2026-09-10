// lib/vocabulary/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

export async function setVocabularyStatus(id: string, status: 'new' | 'learning' | 'known') {
  const user = await requireAuth()
  const db = await createClient()
  const { error } = await db.from('vocabulary').update({ status }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/vocabulary')
  revalidatePath('/')
  return { ok: true }
}
