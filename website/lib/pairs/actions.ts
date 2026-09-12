// lib/pairs/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { isPairId } from './index'

/** Switches which direction the learner is studying. Everything else follows from this. */
export async function setPair(pair: string) {
  if (!isPairId(pair)) return { error: 'Unknown language pair.' }
  const user = await requireAuth()
  const db = await createClient()
  const { error } = await db.from('profiles').update({ pair }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { ok: true }
}
